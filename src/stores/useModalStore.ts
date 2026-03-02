import { create } from 'zustand';

type ModalType = 'alert' | 'confirm' | 'prompt' | null;

interface ModalState {
    type: ModalType;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    onPromptConfirm?: (value: string) => void;
    defaultValue?: string;

    showAlert: (message: string, onConfirm?: () => void) => void;
    showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
    showPrompt: (message: string, defaultValue: string, onConfirm: (value: string) => void) => void;
    closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    type: null,
    message: '',

    showAlert: (message, onConfirm) => set({
        type: 'alert',
        message,
        onConfirm
    }),

    showConfirm: (message, onConfirm, onCancel) => set({
        type: 'confirm',
        message,
        onConfirm,
        onCancel
    }),

    showPrompt: (message, defaultValue, onPromptConfirm) => set({
        type: 'prompt',
        message,
        defaultValue,
        onPromptConfirm
    }),

    closeModal: () => set({ type: null, message: '', onConfirm: undefined, onCancel: undefined, onPromptConfirm: undefined, defaultValue: undefined })
}));

// Helper functions that can be used outside React components
export const gmAlert = (message: string, onConfirm?: () => void) => {
    useModalStore.getState().showAlert(message, onConfirm);
};

export const gmConfirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
    useModalStore.getState().showConfirm(message, onConfirm, onCancel);
};

export const gmPrompt = (message: string, defaultValue: string, onConfirm: (value: string) => void) => {
    useModalStore.getState().showPrompt(message, defaultValue, onConfirm);
};
