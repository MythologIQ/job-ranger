import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function escapeSqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function toSqlLiteral(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Non-finite number cannot be persisted to SQLite");
    }
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  if (typeof value === "string") {
    return escapeSqlString(value);
  }

  return escapeSqlString(JSON.stringify(value));
}

export function sql(queryParts: TemplateStringsArray, ...values: unknown[]): string {
  return queryParts.reduce((output, part, index) => {
    if (index === values.length) {
      return output + part;
    }
    return output + part + toSqlLiteral(values[index]);
  }, "");
}

export async function resolveSqliteBinary(): Promise<string> {
  if (process.env.SQLITE3_PATH) {
    return process.env.SQLITE3_PATH;
  }

  const command = process.platform === "win32" ? "where.exe" : "which";
  const lookupTarget = process.platform === "win32" ? "sqlite3" : "sqlite3";

  try {
    const { stdout } = await execFileAsync(command, [lookupTarget]);
    const [firstMatch] = stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (firstMatch) {
      return firstMatch;
    }
  } catch {
    // Fall through to the platform-specific guidance below.
  }

  const expectedBinary = process.platform === "win32" ? "sqlite3.exe" : "sqlite3";
  throw new Error(
    `${expectedBinary} was not found on PATH. Set SQLITE3_PATH to a valid sqlite3 binary.`,
  );
}

export class SqliteClient {
  constructor(
    private readonly databasePath: string,
    private readonly sqliteBinaryPath: string,
  ) {}

  async ensureDatabaseDirectory(): Promise<void> {
    await fs.mkdir(path.dirname(this.databasePath), { recursive: true });
  }

  async exec(statement: string): Promise<void> {
    await this.ensureDatabaseDirectory();
    await execFileAsync(this.sqliteBinaryPath, [
      this.databasePath,
      `PRAGMA foreign_keys = ON; ${statement}`,
    ]);
  }

  async queryAll<T>(statement: string): Promise<T[]> {
    await this.ensureDatabaseDirectory();
    const { stdout } = await execFileAsync(this.sqliteBinaryPath, [
      "-json",
      this.databasePath,
      `PRAGMA foreign_keys = ON; ${statement}`,
    ]);

    const trimmed = stdout.trim();
    if (!trimmed) {
      return [];
    }

    return JSON.parse(trimmed) as T[];
  }

  async queryOne<T>(statement: string): Promise<T | null> {
    const rows = await this.queryAll<T>(statement);
    return rows[0] ?? null;
  }
}
