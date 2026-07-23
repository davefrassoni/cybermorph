import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("cybermorph", {
  isDesktop: true,
  saveFile: (options: { name: string; content: string }) =>
    ipcRenderer.invoke("file:save", options),
  loadFile: () => ipcRenderer.invoke("file:load"),
  appVersion: () => ipcRenderer.invoke("app:version")
});
