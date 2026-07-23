declare global {
  interface Window {
    cybermorph?: {
      isDesktop: true;
      saveFile: (options: { name: string; content: string }) => Promise<boolean>;
      loadFile: () => Promise<{ name: string; content: string } | null>;
      appVersion: () => Promise<string>;
    };
  }
}

export {};
