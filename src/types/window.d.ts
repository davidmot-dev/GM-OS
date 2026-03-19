import { ImageBridge } from '../modules/image/types';
import type { NoteEntry } from '../useObsidianStore';


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
    web?: {
        openExternal: (url: string) => void;
        saveList: (data: unknown) => Promise<boolean>;
        loadList: () => Promise<unknown>;
    };
    on?: (channel: string, callback: (event: unknown, ...args: unknown[]) => void) => void;
    app?: {
        quit: () => void;
    };
    ai?: {
        listDocs: () => Promise<unknown[]>;
        readDoc: (filePath: string) => Promise<string | null>;
        extractPDF: (filePath: string) => Promise<string>;
        proxyRequest: (url: string, method: string, headers: Record<string, string>, body: unknown) => Promise<{
            ok: boolean;
            status: number;
            statusText: string;
            data: unknown;
        }>;
        searchContext: (systemId: string, campaignName: string) => Promise<string>;
        reindex: () => Promise<boolean>;
    };
    sound?: {
        loadAudios: () => Promise<string[]>;
    };
    tactical?: {
        listSounds: () => Promise<string[]>;
    };
    light?: {
        request: (url: string, method: string, body?: unknown) => Promise<unknown>;
    };
    mcp?: {
        listTools: (serverName: string) => Promise<unknown[]>;
        callTool: (serverName: string, toolName: string, args: Record<string, unknown>) => Promise<{ content: string; [key: string]: unknown }>;
        reauthenticate: () => Promise<{ success: boolean; message: string }>;
    };
    obsidian?: {
        listNotes: (vaultPath?: string) => Promise<NoteEntry[]>;
        readNote: (relativePath: string, vaultPath?: string) => Promise<string | null>;
        writeNote: (relativePath: string, content: string, vaultPath?: string) => Promise<boolean>;
        ensureDirectory: (relativePath: string, vaultPath?: string) => Promise<boolean>;
    };
    npc?: {
        listDatabases: (category: string) => Promise<string[]>;
        loadDatabase: (category: string, name: string) => Promise<Record<string, string[]>>;
        selectAvatar: () => Promise<string | null>;
        saveAvatar: (buffer: ArrayBuffer, fileName: string) => Promise<string | null>;
    };
}

interface NoteEntry {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: NoteEntry[];
}

declare global {
    interface Window {
        appBridge?: AppBridge;
        useMusicStore?: any;
        useLightStore?: any;
        useMapStore?: any;
        useImageStore?: any;
        useSoundStore?: any;
        useStoryboardStore?: any;
        hueEngine?: any;
        soundEngine?: any;
    }
}

export {};
