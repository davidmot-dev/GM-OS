import { ImageBridge } from '../modules/image/types';

interface AppBridge {
    image?: ImageBridge;
    session?: {
        launchHubWindow: () => void;
        saveSession: (data: Record<string, unknown>) => Promise<boolean>;
        loadSession: () => Promise<Record<string, unknown> | null>;
    };
    openFile?: (path: string) => void;
    openExternal?: (url: string) => void;
    utils?: {
        formatFileUrl: (path: string) => string;
    };
    on?: (channel: string, callback: (event: unknown, ...args: unknown[]) => void) => void;
    app?: {
        quit: () => void;
    };
}

declare global {
    interface Window {
        appBridge?: AppBridge;
    }
}

export {};
