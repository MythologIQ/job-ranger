"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const backend_cjs_1 = require("./backend.cjs");
const validators_cjs_1 = require("./validators.cjs");
const browser_loader_cjs_1 = require("./browser-loader.cjs");
const tray_notifications_cjs_1 = require("./tray-notifications.cjs");
const moduleDirectory = __dirname;
let mainWindow = null;
let helpWindow = null;
let backend = null;
let isQuitting = false;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 840,
        minWidth: 960,
        minHeight: 640,
        backgroundColor: "#f5f3ef",
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: node_path_1.default.join(moduleDirectory, "preload.cjs"),
            webSecurity: true,
        },
        icon: node_path_1.default.join(moduleDirectory, "../public/ICON.png"),
    });
    if (process.env.NODE_ENV === "development") {
        void mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }
    else {
        void mainWindow.loadFile(node_path_1.default.join(moduleDirectory, "../dist/index.html"));
    }
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        try {
            void electron_1.shell.openExternal((0, validators_cjs_1.validateExternalUrl)(url));
        }
        catch {
            return { action: "deny" };
        }
        return { action: "deny" };
    });
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https:;",
                "X-Frame-Options": "DENY",
            },
        });
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    mainWindow.on("close", async (event) => {
        const settings = await backend?.getSettings();
        if ((0, tray_notifications_cjs_1.shouldMinimizeToTray)(settings ?? null, isQuitting)) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });
}
function openHelpWindow() {
    if (helpWindow && !helpWindow.isDestroyed()) {
        helpWindow.focus();
        return;
    }
    helpWindow = new electron_1.BrowserWindow({
        width: 1040,
        height: 760,
        minWidth: 860,
        minHeight: 620,
        backgroundColor: "#f5f3ef",
        title: "Job Ranger Help",
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            webSecurity: true,
        },
        icon: node_path_1.default.join(moduleDirectory, "../public/ICON.png"),
    });
    if (process.env.NODE_ENV === "development") {
        void helpWindow.loadURL("http://localhost:5173/help.html");
    }
    else {
        void helpWindow.loadFile(node_path_1.default.join(moduleDirectory, "../dist/help.html"));
    }
    helpWindow.webContents.setWindowOpenHandler(({ url }) => {
        try {
            void electron_1.shell.openExternal((0, validators_cjs_1.validateExternalUrl)(url));
        }
        catch {
            return { action: "deny" };
        }
        return { action: "deny" };
    });
    helpWindow.on("closed", () => {
        helpWindow = null;
    });
}
function createMenu() {
    const template = [
        {
            label: "File",
            submenu: [
                {
                    label: "Quit",
                    accelerator: "CmdOrCtrl+Q",
                    click: () => electron_1.app.quit(),
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
                    label: "Open Help",
                    accelerator: "F1",
                    click: () => openHelpWindow(),
                },
                { type: "separator" },
                {
                    label: "Open Job Ranger Data Folder",
                    click: () => {
                        void electron_1.shell.openPath(electron_1.app.getPath("userData"));
                    },
                },
            ],
        },
    ];
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
}
function requireBackend() {
    if (!backend) {
        throw new Error("Job Ranger backend is not initialized");
    }
    return backend;
}
function registerIpcHandlers() {
    electron_1.ipcMain.handle("app:get-version", () => electron_1.app.getVersion());
    electron_1.ipcMain.handle("app:get-platform", () => process.platform);
    electron_1.ipcMain.handle("app:open-external", async (_event, url) => {
        await electron_1.shell.openExternal((0, validators_cjs_1.validateExternalUrl)(url));
    });
    electron_1.ipcMain.handle("app:show-item-in-folder", async (_event, targetPath) => {
        electron_1.shell.showItemInFolder(targetPath);
    });
    electron_1.ipcMain.handle("system:get-status", () => requireBackend().getSystemStatus(process.platform));
    electron_1.ipcMain.handle("companies:list", () => requireBackend().listCompanies());
    electron_1.ipcMain.handle("companies:create", (_event, draft) => requireBackend().createCompany((0, validators_cjs_1.validateCompanyDraft)(draft)));
    electron_1.ipcMain.handle("companies:update", (_event, id, update) => requireBackend().updateCompany((0, validators_cjs_1.validateId)(id, "Company id"), (0, validators_cjs_1.validateCompanyUpdate)(update)));
    electron_1.ipcMain.handle("companies:delete", (_event, id) => requireBackend().deleteCompany((0, validators_cjs_1.validateId)(id, "Company id")));
    electron_1.ipcMain.handle("companies:run-scrape", (_event, id) => requireBackend().runCompanyScrape((0, validators_cjs_1.validateId)(id, "Company id")));
    electron_1.ipcMain.handle("jobs:list", () => requireBackend().listJobs());
    electron_1.ipcMain.handle("jobs:mark-seen", (_event, id) => requireBackend().markJobSeen((0, validators_cjs_1.validateId)(id, "Job id")));
    electron_1.ipcMain.handle("filters:list", () => requireBackend().listFilters());
    electron_1.ipcMain.handle("filters:create", (_event, draft) => requireBackend().createFilter((0, validators_cjs_1.validateFilterDraft)(draft)));
    electron_1.ipcMain.handle("filters:update", (_event, id, update) => requireBackend().updateFilter((0, validators_cjs_1.validateId)(id, "Filter id"), (0, validators_cjs_1.validateFilterUpdate)(update)));
    electron_1.ipcMain.handle("filters:delete", (_event, id) => requireBackend().deleteFilter((0, validators_cjs_1.validateId)(id, "Filter id")));
    electron_1.ipcMain.handle("settings:get", () => requireBackend().getSettings());
    electron_1.ipcMain.handle("settings:update", (_event, update) => requireBackend().updateSettings((0, validators_cjs_1.validateSettingsUpdate)(update)));
    electron_1.ipcMain.handle("scrape-runs:list-recent", (_event, limit) => requireBackend().listRecentScrapeRuns(limit === undefined ? undefined : (0, validators_cjs_1.validateFiniteNumber)(limit, "Scrape run limit")));
}
electron_1.app.whenReady().then(async () => {
    try {
        backend = new backend_cjs_1.JobScoutBackend({
            dataDirectory: node_path_1.default.join(electron_1.app.getPath("userData"), "data"),
            browserPageLoader: browser_loader_cjs_1.loadPageHtmlInHiddenWindow,
        });
        await backend.initialize();
        registerIpcHandlers();
        createWindow();
        createMenu();
        (0, tray_notifications_cjs_1.createTray)(moduleDirectory, mainWindow, () => electron_1.app.quit());
        electron_1.app.on("activate", () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Job Ranger startup error";
        electron_1.dialog.showErrorBox("Job Ranger failed to start", message);
        electron_1.app.quit();
    }
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("before-quit", () => {
    isQuitting = true;
    void backend?.dispose();
});
