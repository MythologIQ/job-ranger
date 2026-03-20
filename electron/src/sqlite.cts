import { execFile } from "node:child_process";
import { constants as fsConstants, promises as fs } from "node:fs";
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
  const lookupTarget = "sqlite3";

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

  const fallbackCandidates =
    process.platform === "darwin"
      ? [
          "/usr/bin/sqlite3",
          "/opt/homebrew/bin/sqlite3",
          "/usr/local/bin/sqlite3",
          "/opt/local/bin/sqlite3",
        ]
      : process.platform === "linux"
        ? ["/usr/bin/sqlite3", "/usr/local/bin/sqlite3", "/bin/sqlite3"]
        : [];

  for (const candidatePath of fallbackCandidates) {
    try {
      await fs.access(candidatePath, fsConstants.X_OK);
      return candidatePath;
    } catch {
      // Try the next common install location.
    }
  }

  const expectedBinary = process.platform === "win32" ? "sqlite3.exe" : "sqlite3";
  const platformHint =
    process.platform === "darwin"
      ? " On macOS, Finder-launched apps may not inherit Homebrew paths, so set SQLITE3_PATH or install sqlite3 in a standard location such as /usr/bin, /opt/homebrew/bin, or /usr/local/bin."
      : "";
  throw new Error(
    `${expectedBinary} was not found. Set SQLITE3_PATH to a valid sqlite3 binary.${platformHint}`,
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
