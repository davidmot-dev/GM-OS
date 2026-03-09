import { ImageBridge } from '../modules/image/types';

interface AppBridge {
    image?: ImageBridge;
    session?: {
        launchHubWindow: () => void;
    };
    openFile?: (path: string) => void;
    openExternal?: (url: string) => void;
    utils?: {
        formatFileUrl: (path: string) => string;
    };
    on?: (channel: string, callback: (event: unknown, ...args: unknown[]) => void) => void;
}

declare global {
    interface Window {
        appBridge?: AppBridge;
    }
}

export {};
