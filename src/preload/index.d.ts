import { ElectronAPI } from '@electron-toolkit/preload'

interface ExtendedElectronAPI extends ElectronAPI {
  windowControls: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  }
}

declare global {
  interface Window {
    electron: ExtendedElectronAPI
    api: unknown
  }
}
