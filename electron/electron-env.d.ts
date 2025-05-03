/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer; // Keep existing basic ipcRenderer
  // Define a more specific API structure for type safety
  electronAPI?: {
    // Example: Define functions you expose from preload
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    // Add 'on' if needed for main-to-renderer communication
    // on: (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
    // Add 'removeListener' etc. as needed
  };
}
