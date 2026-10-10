const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let splash = null;
let mainWin = null;

function createSplash() {
  splash = new BrowserWindow({
    width: 960,
    height: 540,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  splash.loadFile(path.join(__dirname, "../dist-splash/splash.html"));
  splash.once("ready-to-show", () => splash.show());
  splash.on("closed", () => (splash = null));
}

function sendProgress(pct, msg) {
  if (splash && !splash.isDestroyed()) {
    splash.webContents.send("splash:progress", { pct, msg });
  }
}

async function boot() {
  createSplash();

  const steps = [
    [12, "Loading your stats"],
    [34, "Reading local data"],
    [58, "Syncing sessions"],
    [80, "Warming up the engine"],
  ];
  for (const [pct, msg] of steps) {
    await new Promise((r) => setTimeout(r, 450));
    sendProgress(pct, msg);
  }

  mainWin = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: "#0B0F14",
    title: "Aventas Tracker",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  await mainWin.loadFile(path.join(__dirname, "../dist/index.html"));
  sendProgress(100, "Ready");
  await new Promise((r) => setTimeout(r, 350));
  mainWin.show();
  setTimeout(() => splash?.close(), 400);
}

ipcMain.on("splash:minimize", () => splash?.minimize());
ipcMain.on("splash:close", () => app.quit());

app.whenReady().then(boot);
app.on("window-all-closed", () => app.quit());