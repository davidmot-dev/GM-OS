import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'loading';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastState {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    showToast: (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type }]
        }));

        // Auto-remove after 3 seconds
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id)
            }));
        }, 3000);
    },
    removeToast: (id: string) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
    }))
}));

// Helper for easier access
export const gmToast = (message: string, type: ToastType = 'success') => {
    useToastStore.getState().showToast(message, type);
};
