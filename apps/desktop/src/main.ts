import { app, BrowserWindow, dialog, ipcMain, session } from "electron";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const currentDir = __dirname;
let mainWindow: BrowserWindow | null = null;

app.commandLine.appendSwitch("enable-features", "WebMidi");

function createWindow(): void {
  mainWindow = new BrowserWindow({
    title: "CyberMorph Studio",
    width: 1520,
    height: 980,
    minWidth: 1050,
    minHeight: 720,
    backgroundColor: "#07090d",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(currentDir, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else {
    const candidates = [
      join(currentDir, "../../studio/dist/index.html"),
      join(process.resourcesPath, "studio/index.html"),
      join(process.resourcesPath, "app.asar/apps/studio/dist/index.html"),
      join(process.resourcesPath, "app/apps/studio/dist/index.html")
    ];
    const entry = candidates.find(existsSync) ?? candidates[0]!;
    void mainWindow.loadFile(entry);
  }

  const screenshotPath = process.env.CYBERMORPH_SCREENSHOT_PATH;
  if (screenshotPath) {
    mainWindow.webContents.once("did-finish-load", () => {
      setTimeout(() => {
        void mainWindow?.webContents.capturePage().then((image) => {
          writeFileSync(screenshotPath, image.toPNG());
          app.quit();
        });
      }, 1800);
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(["midi", "midiSysex", "serial"].includes(String(permission)));
  });
  session.defaultSession.setDevicePermissionHandler((details) =>
    ["serial", "midi"].includes(String(details.deviceType))
  );
  session.defaultSession.on("select-serial-port", (event, portList, _webContents, callback) => {
    event.preventDefault();
    const preferred =
      portList.find((port) => /arduino|wch|ch340|cp210|usb serial/i.test(port.displayName ?? "")) ??
      portList[0];
    callback(preferred?.portId ?? "");
  });
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("app:version", () => app.getVersion());

ipcMain.handle("file:save", async (_event, options: { name: string; content: string }) => {
  const result = await dialog.showSaveDialog({
    defaultPath: join(app.getPath("documents"), options.name),
    filters: [
      { name: "CyberMorph data", extensions: options.name.endsWith(".csv") ? ["csv"] : ["json"] },
      { name: "All files", extensions: ["*"] }
    ]
  });
  if (result.canceled || !result.filePath) return false;
  writeFileSync(result.filePath, options.content, "utf8");
  return true;
});

ipcMain.handle("file:load", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "CyberMorph dataset", extensions: ["json"] }]
  });
  const path = result.filePaths[0];
  if (result.canceled || !path) return null;
  return { name: path, content: readFileSync(path, "utf8") };
});
