import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import path from "node:path";
import { JobScoutBackend, type BrowserPageLoaderOptions } from "./backend.cjs";
import type {
  CompanyDraft,
  CompanyUpdate,
  FilterDraft,
  FilterUpdate,
  SettingsUpdate,
} from "./contracts.cjs";

const moduleDirectory = __dirname;

let mainWindow: BrowserWindow | null = null;
let backend: JobScoutBackend | null = null;

function validateExternalUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid external URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https links can be opened outside Job Ranger.");
  }

  return parsed.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateId(rawValue: unknown, label: string): string {
  if (typeof rawValue !== "string") {
    throw new Error(`${label} must be a string.`);
  }

  const normalized = rawValue.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${label} must be a numeric identifier.`);
  }

  return normalized;
}

function validateOptionalString(rawValue: unknown, label: string): string | undefined {
  if (rawValue === undefined) {
    return undefined;
  }
  if (typeof rawValue !== "string") {
    throw new Error(`${label} must be a string.`);
  }
  return rawValue.trim();
}

function validateBoolean(rawValue: unknown, label: string): boolean {
  if (typeof rawValue !== "boolean") {
    throw new Error(`${label} must be true or false.`);
  }
  return rawValue;
}

function validateOptionalBoolean(rawValue: unknown, label: string): boolean | undefined {
  if (rawValue === undefined) {
    return undefined;
  }
  return validateBoolean(rawValue, label);
}

function validateFiniteNumber(rawValue: unknown, label: string): number {
  if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
    throw new Error(`${label} must be a finite number.`);
  }
  return rawValue;
}

function validateStringArray(rawValue: unknown, label: string): string[] {
  if (!Array.isArray(rawValue)) {
    throw new Error(`${label} must be an array of strings.`);
  }

  return rawValue.map((entry, index) => {
    if (typeof entry !== "string") {
      throw new Error(`${label}[${index}] must be a string.`);
    }
    return entry.trim();
  });
}

function validateOptionalStringArray(
  rawValue: unknown,
  label: string,
): string[] | undefined {
  if (rawValue === undefined) {
    return undefined;
  }
  return validateStringArray(rawValue, label);
}

function validateNullableCompanyId(rawValue: unknown, label: string): string | null {
  if (rawValue === null) {
    return null;
  }
  return validateId(rawValue, label);
}

function validateOptionalNullableCompanyId(
  rawValue: unknown,
  label: string,
): string | null | undefined {
  if (rawValue === undefined) {
    return undefined;
  }
  return validateNullableCompanyId(rawValue, label);
}

function validateCompanyDraft(rawValue: unknown): CompanyDraft {
  if (!isRecord(rawValue)) {
    throw new Error("Company payload must be an object.");
  }

  const name = validateOptionalString(rawValue.name, "Company name");
  const url = validateOptionalString(rawValue.url, "Company URL");
  if (!name) {
    throw new Error("Company name is required.");
  }
  if (!url) {
    throw new Error("Company URL is required.");
  }

  return {
    name,
    url: validateExternalUrl(url),
    frequencyMinutes: validateFiniteNumber(rawValue.frequencyMinutes, "Frequency"),
    isActive: validateBoolean(rawValue.isActive, "Company active flag"),
  };
}

function validateCompanyUpdate(rawValue: unknown): CompanyUpdate {
  if (!isRecord(rawValue)) {
    throw new Error("Company update payload must be an object.");
  }

  const update: CompanyUpdate = {};
  const name = validateOptionalString(rawValue.name, "Company name");
  const url = validateOptionalString(rawValue.url, "Company URL");
  if (name !== undefined) {
    if (!name) {
      throw new Error("Company name cannot be empty.");
    }
    update.name = name;
  }
  if (url !== undefined) {
    update.url = validateExternalUrl(url);
  }
  if (rawValue.frequencyMinutes !== undefined) {
    update.frequencyMinutes = validateFiniteNumber(
      rawValue.frequencyMinutes,
      "Frequency",
    );
  }
  if (rawValue.isActive !== undefined) {
    update.isActive = validateBoolean(rawValue.isActive, "Company active flag");
  }
  return update;
}

function validateFilterDraft(rawValue: unknown): FilterDraft {
  if (!isRecord(rawValue)) {
    throw new Error("Filter payload must be an object.");
  }

  const name = validateOptionalString(rawValue.name, "Filter name");
  if (!name) {
    throw new Error("Filter name is required.");
  }

  return {
    name,
    companyId: validateNullableCompanyId(rawValue.companyId, "Filter company id"),
    titleInclude: validateStringArray(rawValue.titleInclude, "titleInclude"),
    titleExclude: validateStringArray(rawValue.titleExclude, "titleExclude"),
    keywordsInclude: validateStringArray(rawValue.keywordsInclude, "keywordsInclude"),
    keywordsExclude: validateStringArray(rawValue.keywordsExclude, "keywordsExclude"),
    salaryMin:
      rawValue.salaryMin === null
        ? null
        : validateFiniteNumber(rawValue.salaryMin, "salaryMin"),
    locationInclude: validateStringArray(rawValue.locationInclude, "locationInclude"),
    locationExclude: validateStringArray(rawValue.locationExclude, "locationExclude"),
    isActive: validateBoolean(rawValue.isActive, "Filter active flag"),
  };
}

function validateFilterUpdate(rawValue: unknown): FilterUpdate {
  if (!isRecord(rawValue)) {
    throw new Error("Filter update payload must be an object.");
  }

  const update: FilterUpdate = {};
  const name = validateOptionalString(rawValue.name, "Filter name");
  if (name !== undefined) {
    if (!name) {
      throw new Error("Filter name cannot be empty.");
    }
    update.name = name;
  }
  update.companyId = validateOptionalNullableCompanyId(
    rawValue.companyId,
    "Filter company id",
  );
  update.titleInclude = validateOptionalStringArray(rawValue.titleInclude, "titleInclude");
  update.titleExclude = validateOptionalStringArray(rawValue.titleExclude, "titleExclude");
  update.keywordsInclude = validateOptionalStringArray(
    rawValue.keywordsInclude,
    "keywordsInclude",
  );
  update.keywordsExclude = validateOptionalStringArray(
    rawValue.keywordsExclude,
    "keywordsExclude",
  );
  if (rawValue.salaryMin !== undefined) {
    update.salaryMin =
      rawValue.salaryMin === null
        ? null
        : validateFiniteNumber(rawValue.salaryMin, "salaryMin");
  }
  update.locationInclude = validateOptionalStringArray(
    rawValue.locationInclude,
    "locationInclude",
  );
  update.locationExclude = validateOptionalStringArray(
    rawValue.locationExclude,
    "locationExclude",
  );
  update.isActive = validateOptionalBoolean(rawValue.isActive, "Filter active flag");
  return update;
}

function validateSettingsUpdate(rawValue: unknown): SettingsUpdate {
  if (!isRecord(rawValue)) {
    throw new Error("Settings payload must be an object.");
  }

  const update: SettingsUpdate = {};
  const userAgent = validateOptionalString(rawValue.userAgent, "User agent");
  if (userAgent !== undefined) {
    if (!userAgent) {
      throw new Error("User agent cannot be empty.");
    }
    update.userAgent = userAgent;
  }
  if (rawValue.maxConcurrentScrapes !== undefined) {
    update.maxConcurrentScrapes = validateFiniteNumber(
      rawValue.maxConcurrentScrapes,
      "Max concurrent scrapes",
    );
  }
  if (rawValue.scrapeTimeoutMs !== undefined) {
    update.scrapeTimeoutMs = validateFiniteNumber(
      rawValue.scrapeTimeoutMs,
      "Scrape timeout",
    );
  }
  if (rawValue.retryCount !== undefined) {
    update.retryCount = validateFiniteNumber(rawValue.retryCount, "Retry count");
  }
  return update;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadPageHtmlInHiddenWindow(
  rawUrl: string,
  options: BrowserPageLoaderOptions,
): Promise<string> {
  const url = validateExternalUrl(rawUrl);
  const partition = `jobscout-scraper-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return new Promise<string>((resolve, reject) => {
    let finished = false;
    let didFinishLoad = false;
    const scraperWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        nodeIntegration: false,
        contextIsolation: true,
        javascript: true,
        webSecurity: true,
        partition,
      },
    });

    const finalize = (handler: () => void): void => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timeoutHandle);
      scraperWindow.removeAllListeners();
      scraperWindow.webContents.removeAllListeners();
      if (!scraperWindow.isDestroyed()) {
        scraperWindow.destroy();
      }
      handler();
    };

    const timeoutHandle = setTimeout(() => {
      finalize(() => reject(new Error("Browser-backed extraction timed out.")));
    }, options.timeoutMs + 4000);

    scraperWindow.webContents.setUserAgent(options.userAgent);
    scraperWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    scraperWindow.webContents.on("will-navigate", (event, targetUrl) => {
      try {
        validateExternalUrl(targetUrl);
      } catch {
        event.preventDefault();
      }
    });
    scraperWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
      if (errorCode === -3 && didFinishLoad) {
        return;
      }
      finalize(() => reject(new Error(`Browser-backed extraction failed: ${errorDescription}`)));
    });
    scraperWindow.webContents.once("did-finish-load", () => {
      didFinishLoad = true;
      void (async () => {
        try {
          await delay(1800);
          await scraperWindow.webContents.executeJavaScript(
            "window.scrollTo(0, document.body ? document.body.scrollHeight : 0);",
            true,
          );
          await delay(600);
          const html = await scraperWindow.webContents.executeJavaScript(
            "document.documentElement ? document.documentElement.outerHTML : ''",
            true,
          );
          finalize(() => resolve(String(html)));
        } catch (error) {
          finalize(() => reject(error instanceof Error ? error : new Error(String(error))));
        }
      })();
    });

    void scraperWindow.loadURL(url).catch((error) => {
      finalize(() => reject(error instanceof Error ? error : new Error(String(error))));
    });
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#f5f3ef",
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(moduleDirectory, "preload.cjs"),
      webSecurity: true,
    },
    icon: path.join(moduleDirectory, "../ICON.png"),
  });

  if (process.env.NODE_ENV === "development") {
    void mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(path.join(moduleDirectory, "../dist/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      void shell.openExternal(validateExternalUrl(url));
    } catch {
      return { action: "deny" };
    }
    return { action: "deny" };
  });

  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy":
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https:;",
          "X-Frame-Options": "DENY",
        },
      });
    },
  );

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Quit",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload", accelerator: "CmdOrCtrl+R" },
        { role: "forceReload", accelerator: "CmdOrCtrl+Shift+R" },
        { role: "toggleDevTools", accelerator: "CmdOrCtrl+Shift+I" },
        { type: "separator" },
        { role: "resetZoom", accelerator: "CmdOrCtrl+0" },
        { role: "zoomIn", accelerator: "CmdOrCtrl+Plus" },
        { role: "zoomOut", accelerator: "CmdOrCtrl+-" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Open Job Ranger Data Folder",
          click: () => {
            void shell.openPath(app.getPath("userData"));
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function requireBackend(): JobScoutBackend {
  if (!backend) {
    throw new Error("Job Ranger backend is not initialized");
  }
  return backend;
}

function registerIpcHandlers(): void {
  ipcMain.handle("app:get-version", () => app.getVersion());
  ipcMain.handle("app:get-platform", () => process.platform);
  ipcMain.handle("app:open-external", async (_event, url: string) => {
    await shell.openExternal(validateExternalUrl(url));
  });
  ipcMain.handle("app:show-item-in-folder", async (_event, targetPath: string) => {
    shell.showItemInFolder(targetPath);
  });

  ipcMain.handle("system:get-status", () =>
    requireBackend().getSystemStatus(process.platform),
  );

  ipcMain.handle("companies:list", () => requireBackend().listCompanies());
  ipcMain.handle("companies:create", (_event, draft) =>
    requireBackend().createCompany(validateCompanyDraft(draft)),
  );
  ipcMain.handle("companies:update", (_event, id: string, update) =>
    requireBackend().updateCompany(
      validateId(id, "Company id"),
      validateCompanyUpdate(update),
    ),
  );
  ipcMain.handle("companies:delete", (_event, id: string) =>
    requireBackend().deleteCompany(validateId(id, "Company id")),
  );
  ipcMain.handle("companies:run-scrape", (_event, id: string) =>
    requireBackend().runCompanyScrape(validateId(id, "Company id")),
  );

  ipcMain.handle("jobs:list", () => requireBackend().listJobs());
  ipcMain.handle("jobs:mark-seen", (_event, id: string) =>
    requireBackend().markJobSeen(validateId(id, "Job id")),
  );

  ipcMain.handle("filters:list", () => requireBackend().listFilters());
  ipcMain.handle("filters:create", (_event, draft) =>
    requireBackend().createFilter(validateFilterDraft(draft)),
  );
  ipcMain.handle("filters:update", (_event, id: string, update) =>
    requireBackend().updateFilter(
      validateId(id, "Filter id"),
      validateFilterUpdate(update),
    ),
  );
  ipcMain.handle("filters:delete", (_event, id: string) =>
    requireBackend().deleteFilter(validateId(id, "Filter id")),
  );

  ipcMain.handle("settings:get", () => requireBackend().getSettings());
  ipcMain.handle("settings:update", (_event, update) =>
    requireBackend().updateSettings(validateSettingsUpdate(update)),
  );

  ipcMain.handle("scrape-runs:list-recent", (_event, limit?: number) =>
    requireBackend().listRecentScrapeRuns(
      limit === undefined ? undefined : validateFiniteNumber(limit, "Scrape run limit"),
    ),
  );
}

app.whenReady().then(async () => {
  try {
    backend = new JobScoutBackend({
      dataDirectory: path.join(app.getPath("userData"), "data"),
      browserPageLoader: loadPageHtmlInHiddenWindow,
    });
    await backend.initialize();
    registerIpcHandlers();
    createWindow();
    createMenu();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Job Ranger startup error";
    dialog.showErrorBox("Job Ranger failed to start", message);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  void backend?.dispose();
});


