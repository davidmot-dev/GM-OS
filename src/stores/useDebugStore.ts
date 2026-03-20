import { create } from 'zustand';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
    id: string;
    timestamp: number;
    level: LogLevel;
    message: string;
    module?: string; // e.g., 'SOUND', 'LIGHT', 'MIDI', 'MUSIC', 'MAP'
    data?: unknown;
}

interface DebugState {
    logs: LogEntry[];
    addLog: (level: LogLevel, message: string, data?: unknown) => void;
    clearLogs: () => void;
}

const MAX_LOGS = 500;
const PERSIST_LIMIT = 200; // Only persist the latest 200 logs to storage
const STORAGE_KEY = 'gm_os_debug_logs';

/**
 * Loads logs from local storage on init
 */
const loadStoredLogs = (): LogEntry[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

/**
 * Saves logs to local storage
 */
const saveLogsToStorage = (logs: LogEntry[]) => {
    try {
        const toPersist = logs.slice(0, PERSIST_LIMIT);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch (e) {
        console.warn('[DEBUG] Failed to persist logs:', e);
    }
};

/**
 * Extracts module name from a message like "[SOUND] Playing file..."
 */
const extractModule = (message: string): { module?: string, cleanMessage: string } => {
    // Support nested tags like [VOICE:ENGINE] or [AUDIO]
    const match = message.match(/^\[([^\]]+)\]\s*(.*)/);
    if (match) {
        return { 
            module: match[1].toUpperCase(), 
            cleanMessage: match[2] 
        };
    }
    return { cleanMessage: message };
};

export const useDebugStore = create<DebugState>((set) => ({
    logs: loadStoredLogs(),
    addLog: (level, message, data) => set((state) => {
        const { module, cleanMessage } = extractModule(message);
        
        const entry: LogEntry = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            level,
            message: cleanMessage,
            module: module || 'SYSTEM',
            data,
        };
        const newLogs = [entry, ...state.logs].slice(0, MAX_LOGS);
        saveLogsToStorage(newLogs);
        return { logs: newLogs };
    }),
    clearLogs: () => set(() => {
        localStorage.removeItem(STORAGE_KEY);
        return { logs: [] };
    }),
}));

// --- Console Interceptor ---
let isIntercepting = false;

export const initConsoleInterceptor = () => {
    if (isIntercepting) return;
    isIntercepting = true;

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;

    console.log = (...args: unknown[]) => {
        originalLog.apply(console, args);
        useDebugStore.getState().addLog('info', args[0]?.toString() || '(empty)', args.length > 1 ? args.slice(1) : undefined);
    };

    console.warn = (...args: unknown[]) => {
        originalWarn.apply(console, args);
        useDebugStore.getState().addLog('warn', args[0]?.toString() || '(empty)', args.length > 1 ? args.slice(1) : undefined);
    };

    console.error = (...args: unknown[]) => {
        originalError.apply(console, args);
        useDebugStore.getState().addLog('error', args[0]?.toString() || '(empty)', args.length > 1 ? args.slice(1) : undefined);
    };

    console.debug = (...args: unknown[]) => {
        originalDebug.apply(console, args);
        useDebugStore.getState().addLog('debug', args[0]?.toString() || '(empty)', args.length > 1 ? args.slice(1) : undefined);
    };

    // --- Global Error Listeners ---
    window.addEventListener('error', (event) => {
        useDebugStore.getState().addLog('error', `[RUNTIME] ${event.message}`, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        useDebugStore.getState().addLog('error', `[PROMISE] ${event.reason?.message || 'Unhandled Rejection'}`, {
            reason: event.reason,
            stack: event.reason?.stack
        });
    });
};
