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

/**
 * Extracts module name from a message like "[SOUND] Playing file..."
 */
const extractModule = (message: string): { module?: string, cleanMessage: string } => {
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
    logs: [],
    addLog: (level, message, data) => set((state) => {
        const { module, cleanMessage } = extractModule(message);
        
        const entry: LogEntry = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            level,
            message: cleanMessage,
            module,
            data,
        };
        const newLogs = [entry, ...state.logs].slice(0, MAX_LOGS);
        return { logs: newLogs };
    }),
    clearLogs: () => set({ logs: [] }),
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
};
