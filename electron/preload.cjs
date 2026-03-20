"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const desktopApi = {
    getAppVersion: () => electron_1.ipcRenderer.invoke("app:get-version"),
    getPlatform: () => electron_1.ipcRenderer.invoke("app:get-platform"),
    openExternal: (url) => electron_1.ipcRenderer.invoke("app:open-external", url),
    showItemInFolder: (targetPath) => electron_1.ipcRenderer.invoke("app:show-item-in-folder", targetPath),
    system: {
        getStatus: () => electron_1.ipcRenderer.invoke("system:get-status"),
    },
    companies: {
        list: () => electron_1.ipcRenderer.invoke("companies:list"),
        create: (draft) => electron_1.ipcRenderer.invoke("companies:create", draft),
        update: (id, update) => electron_1.ipcRenderer.invoke("companies:update", id, update),
        delete: (id) => electron_1.ipcRenderer.invoke("companies:delete", id),
        runScrape: (id) => electron_1.ipcRenderer.invoke("companies:run-scrape", id),
    },
    jobs: {
        list: () => electron_1.ipcRenderer.invoke("jobs:list"),
        markSeen: (id) => electron_1.ipcRenderer.invoke("jobs:mark-seen", id),
    },
    filters: {
        list: () => electron_1.ipcRenderer.invoke("filters:list"),
        create: (draft) => electron_1.ipcRenderer.invoke("filters:create", draft),
        update: (id, update) => electron_1.ipcRenderer.invoke("filters:update", id, update),
        delete: (id) => electron_1.ipcRenderer.invoke("filters:delete", id),
    },
    settings: {
        get: () => electron_1.ipcRenderer.invoke("settings:get"),
        update: (update) => electron_1.ipcRenderer.invoke("settings:update", update),
    },
    scrapeRuns: {
        listRecent: (limit) => electron_1.ipcRenderer.invoke("scrape-runs:list-recent", limit),
    },
};
electron_1.contextBridge.exposeInMainWorld("electronAPI", desktopApi);
