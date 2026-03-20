"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = delay;
exports.loadPageHtmlWithOptions = loadPageHtmlWithOptions;
exports.loadPageHtmlInHiddenWindow = loadPageHtmlInHiddenWindow;
const electron_1 = require("electron");
const validators_cjs_1 = require("./validators.cjs");
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function waitForSelectors(webContents, selectors, maxWaitMs) {
    if (selectors.length === 0)
        return true;
    const checkScript = `
    (function() {
      const selectors = ${JSON.stringify(selectors)};
      return selectors.some(s => document.querySelector(s) !== null);
    })()
  `;
    const startTime = Date.now();
    const pollInterval = 200;
    while (Date.now() - startTime < maxWaitMs) {
        const found = await webContents.executeJavaScript(checkScript, true);
        if (found)
            return true;
        await delay(pollInterval);
    }
    return false;
}
async function scrollToLoadAll(webContents, maxIterations) {
    let previousHeight = 0;
    let unchangedCount = 0;
    for (let i = 0; i < maxIterations; i++) {
        const currentHeight = await webContents.executeJavaScript("document.body ? document.body.scrollHeight : 0", true);
        if (currentHeight === previousHeight) {
            unchangedCount++;
            if (unchangedCount >= 2)
                break;
        }
        else {
            unchangedCount = 0;
        }
        previousHeight = currentHeight;
        await webContents.executeJavaScript("window.scrollTo(0, document.body ? document.body.scrollHeight : 0);", true);
        await delay(800);
    }
}
async function extractHtmlAfterLoad(webContents, options) {
    await delay(1200);
    await waitForSelectors(webContents, options.waitSelectors, options.maxWaitMs);
    if (options.enableScroll) {
        await scrollToLoadAll(webContents, options.maxScrollIterations);
    }
    const html = await webContents.executeJavaScript("document.documentElement ? document.documentElement.outerHTML : ''", true);
    return String(html);
}
function attachNavigationGuard(webContents) {
    webContents.on("will-navigate", (event, targetUrl) => {
        try {
            (0, validators_cjs_1.validateExternalUrl)(targetUrl);
        }
        catch {
            event.preventDefault();
        }
    });
}
function createBrowserSession(partition, options, reject) {
    let finished = false;
    let didFinishLoad = false;
    const window = createScraperWindow(partition, options.userAgent);
    const finalize = (handler) => {
        if (finished)
            return;
        finished = true;
        clearTimeout(timeoutHandle);
        window.removeAllListeners();
        window.webContents.removeAllListeners();
        if (!window.isDestroyed())
            window.destroy();
        handler();
    };
    const timeoutHandle = setTimeout(() => {
        finalize(() => reject(new Error("Browser-backed extraction timed out.")));
    }, options.maxWaitMs + 8000);
    window.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
        if (errorCode === -3 && didFinishLoad)
            return;
        finalize(() => reject(new Error(`Browser-backed extraction failed: ${errorDescription}`)));
    });
    window.webContents.once("did-finish-load", () => { didFinishLoad = true; });
    return { window, finalize };
}
function createScraperWindow(partition, userAgent) {
    const window = new electron_1.BrowserWindow({
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
    window.webContents.setUserAgent(userAgent);
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    return window;
}
async function loadPageHtmlWithOptions(options) {
    const url = (0, validators_cjs_1.validateExternalUrl)(options.url);
    const partition = `jobscout-scraper-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
        const session = createBrowserSession(partition, options, reject);
        attachNavigationGuard(session.window.webContents);
        session.window.webContents.once("did-finish-load", () => {
            void extractHtmlAfterLoad(session.window.webContents, options)
                .then((html) => session.finalize(() => resolve(html)))
                .catch((err) => session.finalize(() => reject(err instanceof Error ? err : new Error(String(err)))));
        });
        void session.window.loadURL(url).catch((err) => {
            session.finalize(() => reject(err instanceof Error ? err : new Error(String(err))));
        });
    });
}
async function loadPageHtmlInHiddenWindow(rawUrl, options) {
    return loadPageHtmlWithOptions({
        url: rawUrl,
        userAgent: options.userAgent,
        waitSelectors: [],
        maxWaitMs: options.timeoutMs,
        enableScroll: true,
        maxScrollIterations: 3,
    });
}
