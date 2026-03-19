import { _electron as electron, type ElectronApplication, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "../..");
const require = createRequire(import.meta.url);

export interface ElectronAppFixture {
  electronApp: ElectronApplication;
  page: Page;
  tempDataDir: string;
}

/**
 * Launch the Electron app for E2E testing.
 *
 * Note: On some Windows environments, Playwright's Electron launcher may fail
 * with "bad option: --remote-debugging-port=0". This is a known compatibility
 * issue between Playwright and certain Electron builds on Windows.
 * See: https://github.com/microsoft/playwright/issues/39008
 *
 * Workarounds:
 * 1. Run tests on macOS or Linux
 * 2. Use WSL on Windows
 * 3. Wait for Playwright/Electron compatibility fix
 */
export async function launchElectronApp(): Promise<ElectronAppFixture> {
  const tempDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "job-ranger-e2e-"));
  const mainPath = path.join(projectRoot, "electron/main.cjs");
  const electronExe = require("electron") as unknown as string;

  console.log("Launching Electron with main:", mainPath);
  console.log("Electron exe:", electronExe);
  console.log("Temp data dir:", tempDataDir);
  console.log("Project root:", projectRoot);

  const electronApp = await electron.launch({
    executablePath: electronExe,
    args: [mainPath],
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
    timeout: 60000,
  });

  console.log("Electron launched, waiting for first window...");
  const page = await electronApp.firstWindow();
  console.log("Got first window, waiting for load...");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(2000);
  console.log("App loaded successfully");

  return { electronApp, page, tempDataDir };
}

export async function closeElectronApp(fixture: ElectronAppFixture): Promise<void> {
  if (fixture?.electronApp) {
    await fixture.electronApp.close();
  }
  try {
    await fs.rm(fixture.tempDataDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

export async function navigateTo(page: Page, route: string): Promise<void> {
  const sidebar = page.locator("nav");
  const link = sidebar.locator(`a[href="#${route}"]`);
  await link.click();
  await page.waitForTimeout(300);
}
