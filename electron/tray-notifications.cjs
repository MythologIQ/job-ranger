"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTray = createTray;
exports.showJobNotification = showJobNotification;
exports.shouldMinimizeToTray = shouldMinimizeToTray;
const electron_1 = require("electron");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
let tray = null;
function createTray(moduleDirectory, mainWindow, onQuit) {
    const iconPath = node_path_1.default.join(moduleDirectory, "../public/ICON.png");
    if (!(0, node_fs_1.existsSync)(iconPath)) {
        return null;
    }
    const icon = electron_1.nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    if (icon.isEmpty()) {
        return null;
    }
    tray = new electron_1.Tray(icon);
    tray.setToolTip("Job Ranger");
    tray.setContextMenu(electron_1.Menu.buildFromTemplate([
        { label: "Open Job Ranger", click: () => mainWindow?.show() },
        { type: "separator" },
        { label: "Quit", click: onQuit },
    ]));
    tray.on("click", () => mainWindow?.show());
    return tray;
}
function showJobNotification(payload, settings) {
    if (!settings.notificationsEnabled)
        return;
    if (payload.newJobCount === 0 && payload.matchedJobCount === 0)
        return;
    if (payload.newJobCount === 0 && !settings.notifyOnMatchedJobs)
        return;
    const bodyParts = [];
    if (payload.newJobCount > 0 && settings.notifyOnNewJobs) {
        bodyParts.push(`${payload.newJobCount} new job${payload.newJobCount === 1 ? "" : "s"}`);
    }
    if (payload.matchedJobCount > 0 && settings.notifyOnMatchedJobs) {
        bodyParts.push(`${payload.matchedJobCount} matched filter${payload.matchedJobCount === 1 ? "" : "s"}`);
    }
    if (bodyParts.length === 0)
        return;
    const notification = new electron_1.Notification({
        title: payload.companyName,
        body: bodyParts.join(", "),
        silent: false,
    });
    notification.show();
}
function shouldMinimizeToTray(settings, isQuitting) {
    return Boolean(settings?.minimizeToTray && !isQuitting);
}
