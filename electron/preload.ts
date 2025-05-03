import { ipcRenderer, contextBridge, IpcRendererEvent } from 'electron'

// Whitelist of valid channels for IPC communication
// Define channels that the renderer is allowed to invoke on the main process
const validInvokeChannels = [
  'git:fetch',
  'git:status',
  'git:log',
  'dialog:openDirectory',
  'repos:loadKnownPaths', // add channel for loading repo list
  'repos:saveKnownPaths'  // add channel for saving repo list
]

// --------- Expose a controlled API to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  // Expose invoke safely, checking against a whitelist
  invoke: (channel: string, ...args: any[]): Promise<any> => {
    if (validInvokeChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    // Optionally, reject or log an error if the channel is not allowed
    console.error(`IPC channel "${channel}" is not allowed.`);
    return Promise.reject(new Error(`IPC channel "${channel}" is not allowed.`));
  },

  // Example of exposing 'on' safely if needed for main-to-renderer events
  // on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
  //   const validOnChannels = ['update-status', 'log-message']; // Example channels main can send on
  //   if (validOnChannels.includes(channel)) {
  //     // Deliberately strip event as it includes `sender`
  //     const subscription = (event: IpcRendererEvent, ...args: any[]) => listener(event, ...args);
  //     ipcRenderer.on(channel, subscription);
  //     // Return a function to remove the listener
  //     return () => ipcRenderer.removeListener(channel, subscription);
  //   }
  //   console.error(`IPC channel "${channel}" is not allowed for listening.`);
  //   return () => {}; // Return no-op unsubscriber
  // },
});

// Optional: You might want to remove the old 'ipcRenderer' exposure if 'electronAPI' replaces it completely
// contextBridge.exposeInMainWorld('ipcRenderer', { ... }); // Remove or comment out if electronAPI is sufficient
