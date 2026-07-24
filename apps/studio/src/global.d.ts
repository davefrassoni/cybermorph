declare global {
  type DesktopUpdateState = "idle" | "checking" | "available" | "downloading" | "ready" | "current" | "error";
  type DesktopUpdateStatus = {
    state: DesktopUpdateState;
    currentVersion: string;
    availableVersion?: string;
    percent?: number;
    message?: string;
  };

  interface Window {
    cybermorph?: {
      isDesktop: true;
      saveFile: (options: { name: string; content: string }) => Promise<boolean>;
      loadFile: () => Promise<{ name: string; content: string } | null>;
      appVersion: () => Promise<string>;
      updateStatus: () => Promise<DesktopUpdateStatus>;
      checkForUpdates: () => Promise<DesktopUpdateStatus>;
      installUpdate: () => Promise<void>;
      onUpdateStatus: (callback: (status: DesktopUpdateStatus) => void) => () => void;
    };
  }
}

export {};
