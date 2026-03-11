import { app, BrowserWindow } from "electron";
import * as path from "path";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL('http://localhost:3000'); 
    win.webContents.openDevTools()
  } else {
    win.loadFile(
      path.join(__dirname, '../dist/index.html')
    );
  }
}

app.whenReady().then(createWindow);