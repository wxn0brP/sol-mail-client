import { app, BrowserWindow, dialog } from "electron";
import { findServer } from "./findPort";

let mainWin: BrowserWindow = null;

function createWindow(url: string): BrowserWindow {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            devTools: true,
            backgroundThrottling: false,
        },
        resizable: true,
        title: "Sol Mail",
        icon: import.meta.dirname + "/../public/favicon.png",
    });

    win.webContents.setWindowOpenHandler((details) => {
        win.webContents.session.downloadURL(details.url);
        return { action: "deny" };
    });

    win.loadURL(url);
    win.maximize();

    return win;
}

app.whenReady().then(async () => {
    const serverIP = await findServer(19851);
    if (!serverIP) {
        dialog.showErrorBox("Error", "Could not find server");
        app.quit();
        return;
    }
    const server = "http://" + serverIP + ":19851";
    mainWin = createWindow(server);

    app.on("activate", () => {
        if (mainWin === null) createWindow(server);
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});