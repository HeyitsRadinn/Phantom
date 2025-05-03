// Import ipcMain and IpcMainInvokeEvent
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
// Import the git client functions
import * as gitClient from './gitClient';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// --- IPC Handlers ---
// Use the imported git client functions
// Using process.env.APP_ROOT as the repo path placeholder
const REPO_PATH = process.env.APP_ROOT;

ipcMain.handle('git:fetch', async (event: IpcMainInvokeEvent, remote: string = 'origin') => {
  console.log(`IPC Main: Received git:fetch for remote "${remote}"`);
  try {
    const result = await gitClient.fetchRemote(REPO_PATH, remote);
     return { status: 'ok', data: result };
   } catch (error: any) {
     console.error(`IPC Error git:fetch for remote "${remote}":`, error); // More specific log
     return { status: 'error', message: error.message || 'Unknown error during fetch.' };
  }
});

ipcMain.handle('git:status', async (event: IpcMainInvokeEvent) => {
  console.log('IPC Main: Received git:status');
   try {
    const files = await gitClient.getStatus(REPO_PATH);
     return { status: 'ok', data: files };
   } catch (error: any) {
     console.error(`IPC Error git:status for path "${REPO_PATH}":`, error); // More specific log
     return { status: 'error', message: error.message || 'Unknown error getting status.' };
  }
});

ipcMain.handle('git:log', async (event: IpcMainInvokeEvent, depth?: number) => {
  console.log(`IPC Main: Received git:log with depth ${depth}`);
   try {
    const commits = await gitClient.getLog(REPO_PATH, depth);
     return { status: 'ok', data: commits };
   } catch (error: any) {
     console.error(`IPC Error git:log for path "${REPO_PATH}" with depth ${depth}:`, error); // More specific log
     return { status: 'error', message: error.message || 'Unknown error getting log.' };
  }
});
// --- End IPC Handlers ---

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
