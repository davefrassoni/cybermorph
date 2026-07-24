import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("cybermorph", {
  isDesktop: true,
  saveFile: (options: { name: string; content: string }) =>
    ipcRenderer.invoke("file:save", options),
  loadFile: () => ipcRenderer.invoke("file:load"),
  appVersion: () => ipcRenderer.invoke("app:version"),
  updateStatus: () => ipcRenderer.invoke("update:status"),
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  installUpdate: () => ipcRenderer.invoke("update:install"),
  onUpdateStatus: (callback: (status: unknown) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: unknown) => callback(status);
    ipcRenderer.on("update:status", listener);
    return () => ipcRenderer.removeListener("update:status", listener);
  }
});
