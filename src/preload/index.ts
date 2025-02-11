import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

const extendedElectronAPI = {
  ...electronAPI,
  windowControls: {
    minimize: (): void => ipcRenderer.send('window-minimize'),
    maximize: (): void => ipcRenderer.send('window-maximize'),
    close: (): void => ipcRenderer.send('window-close')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', extendedElectronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = extendedElectronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
