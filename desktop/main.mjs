import { app, BrowserWindow, dialog, session } from "electron";
import path from "node:path";
import { startLocalDashboard } from "../bin/apex-dashboard.mjs";

let runtime;
let mainWindow;
let chosenRoot;

async function chooseWorkspace() {
  if (chosenRoot) return chosenRoot;
  const result = await dialog.showOpenDialog({
    title: "Choose an APEX workspace",
    buttonLabel: "Open workspace",
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  chosenRoot = result.filePaths[0];
  return chosenRoot;
}

async function openWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }
  const root = await chooseWorkspace();
  if (!root) {
    app.quit();
    return;
  }
  if (!runtime) {
    runtime = await startLocalDashboard({ root, port: 0, quiet: true });
  }
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 960,
    minHeight: 680,
    show: false,
    title: "APEX",
    backgroundColor: "#f4f6f1",
    icon: path.join(
      app.getAppPath(),
      "desktop",
      "icons",
      process.platform === "win32" ? "APEX.ico" : "512x512.png"
    ),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, target) => {
    try {
      if (new URL(target).origin !== runtime.origin) event.preventDefault();
    } catch {
      event.preventDefault();
    }
  });
  mainWindow.webContents.on("will-attach-webview", event => {
    event.preventDefault();
  });
  await mainWindow.loadURL(`${runtime.origin}/local`);
  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
}

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false);
    }
  );
  await openWindow();
  app.on("activate", () => void openWindow());
});

app.on("before-quit", () => {
  runtime?.server.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

process.on("uncaughtException", error => {
  dialog.showErrorBox("APEX Desktop stopped", error.message.slice(0, 1_000));
  app.quit();
});
