"use strict";
const electron = require("electron");
const validInvokeChannels = [
  "git:fetch",
  "git:status",
  "git:log",
  "dialog:openDirectory",
  "repos:loadKnownPaths",
  // add channel for loading repo list
  "repos:saveKnownPaths"
  // add channel for saving repo list
];
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // Expose invoke safely, checking against a whitelist
  invoke: (channel, ...args) => {
    if (validInvokeChannels.includes(channel)) {
      return electron.ipcRenderer.invoke(channel, ...args);
    }
    console.error(`IPC channel "${channel}" is not allowed.`);
    return Promise.reject(new Error(`IPC channel "${channel}" is not allowed.`));
  }
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
