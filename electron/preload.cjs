const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aventasSplash", {
  onProgress: (cb) => ipcRenderer.on("splash:progress", (_e, payload) => cb(payload)),
});

contextBridge.exposeInMainWorld("aventasSplashCtl", {
  minimize: () => ipcRenderer.send("splash:minimize"),
  close: () => ipcRenderer.send("splash:close"),
});