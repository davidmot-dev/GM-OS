import { create } from 'zustand';

type ModalType = 'alert' | 'confirm' | 'prompt' | null;

interface ModalState {
    type: ModalType;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    onPromptConfirm?: (value: string) => void;
    defaultValue?: string;
    confirmLabel?: string;
    cancelLabel?: string;

    showAlert: (message: string, onConfirm?: () => void, confirmLabel?: string) => void;
    showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void, confirmLabel?: string, cancelLabel?: string) => void;
    showPrompt: (message: string, defaultValue: string, onConfirm: (value: string) => void, confirmLabel?: string, cancelLabel?: string) => void;
    closeModal: () => void;
}


export const useModalStore = create<ModalState>((set) => ({
    type: null,
    message: '',

    showAlert: (message, onConfirm, confirmLabel) => set({
        type: 'alert',
        message,
        onConfirm,
        confirmLabel
    }),

    showConfirm: (message, onConfirm, onCancel, confirmLabel, cancelLabel) => set({
        type: 'confirm',
        message,
        onConfirm,
        onCancel,
        confirmLabel,
        cancelLabel
    }),

    showPrompt: (message, defaultValue, onPromptConfirm, confirmLabel, cancelLabel) => set({
        type: 'prompt',
        message,
        defaultValue,
        onPromptConfirm,
        confirmLabel,
        cancelLabel
    }),

    closeModal: () => set({
        type: null,
        message: '',
        onConfirm: undefined,
        onCancel: undefined,
        onPromptConfirm: undefined,
        defaultValue: undefined,
        confirmLabel: undefined,
        cancelLabel: undefined
    })
}));

// Helper functions that can be used outside React components
export const gmAlert = (message: string, onConfirm?: () => void, confirmLabel?: string) => {
    useModalStore.getState().showAlert(message, onConfirm, confirmLabel);
};

export const gmConfirm = (message: string, onConfirm: () => void, onCancel?: () => void, confirmLabel?: string, cancelLabel?: string) => {
    useModalStore.getState().showConfirm(message, onConfirm, onCancel, confirmLabel, cancelLabel);
};

export const gmPrompt = (message: string, defaultValue: string, onConfirm: (value: string) => void, confirmLabel?: string, cancelLabel?: string) => {
    useModalStore.getState().showPrompt(message, defaultValue, onConfirm, confirmLabel, cancelLabel);
};

