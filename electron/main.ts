// Import ipcMain, IpcMainInvokeEvent, and dialog
import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent, dialog } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Store from 'electron-store'; // Import electron-store
// Import the git client functions
import * as gitClient from './gitClient';

// Initialize electron-store
const store = new Store();

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
// Removed hardcoded REPO_PATH constant

// Modified handler to accept repoPath and optionally remote
ipcMain.handle('git:fetch', async (event: IpcMainInvokeEvent, repoPath: string, remote: string = 'origin') => {
  console.log(`IPC Main: Received git:fetch for repo "${repoPath}", remote "${remote}"`);
  // Add validation for repoPath
  if (!repoPath || typeof repoPath !== 'string') {
    return { status: 'error', message: 'Repository path is required for fetch.' };
  }
  try {
    const result = await gitClient.fetchRemote(repoPath, remote); // Use received repoPath
     return { status: 'ok', data: result };
   } catch (error: any) {
     console.error(`IPC Error git:fetch for repo "${repoPath}", remote "${remote}":`, error); // Updated log
     return { status: 'error', message: error.message || 'Unknown error during fetch.' };
  }
});

// Modified handler to accept repoPath
ipcMain.handle('git:status', async (event: IpcMainInvokeEvent, repoPath: string) => {
  console.log(`IPC Main: Received git:status for repo "${repoPath}"`);
  // Add validation for repoPath
  if (!repoPath || typeof repoPath !== 'string') {
    return { status: 'error', message: 'Repository path is required for status.' };
  }
   try {
    const files = await gitClient.getStatus(repoPath); // Use received repoPath
     return { status: 'ok', data: files };
   } catch (error: any) {
     console.error(`IPC Error git:status for path "${repoPath}":`, error); // Updated log
     return { status: 'error', message: error.message || 'Unknown error getting status.' };
  }
});

// Modified handler to accept repoPath and depth
ipcMain.handle('git:log', async (event: IpcMainInvokeEvent, repoPath: string, depth?: number) => {
  console.log(`IPC Main: Received git:log for repo "${repoPath}" with depth ${depth}`);
  // Add validation for repoPath
  if (!repoPath || typeof repoPath !== 'string') {
    return { status: 'error', message: 'Repository path is required for log.' };
  }
   try {
    const commits = await gitClient.getLog(repoPath, depth); // Use received repoPath
     return { status: 'ok', data: commits };
   } catch (error: any) {
     console.error(`IPC Error git:log for path "${repoPath}" with depth ${depth}:`, error); // Updated log
    return { status: 'error', message: error.message || 'Unknown error getting log.' };
  }
});

// Handler for opening directory dialog
ipcMain.handle('dialog:openDirectory', async () => {
  if (!win) {
    return { status: 'error', message: 'Main window not available.' };
  }
  console.log('IPC Main: Received dialog:openDirectory');
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, { // Pass window reference
      properties: ['openDirectory']
    });
    if (!canceled && filePaths.length > 0) {
      console.log(`IPC Main: Directory selected: ${filePaths[0]}`);
      // TODO: Add validation here to check if it's a git repo (e.g., check for .git dir)
      return { status: 'ok', path: filePaths[0] };
    } else {
      console.log('IPC Main: Directory selection canceled.');
      return { status: 'canceled', path: null };
    }
  } catch (error: any) {
    console.error('IPC Error dialog:openDirectory:', error);
     return { status: 'error', message: error.message || 'Unknown error opening directory dialog.' };
  }
});

// --- Repository Persistence Handlers ---
ipcMain.handle('repos:loadKnownPaths', async () => {
  try {
    const paths = store.get('knownRepoPaths', []); // Default to empty array if not found
    console.log('IPC Main: Loaded known repo paths:', paths);
    return { status: 'ok', data: paths };
  } catch (error: any) {
     console.error('IPC Error repos:loadKnownPaths:', error);
     return { status: 'error', message: error.message || 'Failed to load repository list.' };
  }
});

ipcMain.handle('repos:saveKnownPaths', async (event: IpcMainInvokeEvent, paths: string[]) => {
   try {
    // Basic validation
    if (!Array.isArray(paths) || !paths.every(p => typeof p === 'string')) {
       throw new Error('Invalid data format for knownRepoPaths.');
    }
    store.set('knownRepoPaths', paths);
    console.log('IPC Main: Saved known repo paths:', paths);
    return { status: 'ok' };
  } catch (error: any) {
     console.error('IPC Error repos:saveKnownPaths:', error);
     return { status: 'error', message: error.message || 'Failed to save repository list.' };
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
