import { create } from 'zustand';

type ModalType = 'alert' | 'confirm' | 'prompt' | 'custom' | null;

export type CustomModalVariant = 'player-add' | 'character-add' | 'campaign-add' | 'campaign-edit' | 'npc-detail' | 'favorite-dossier' | 'session-select' | 'session-notes' | 'session-summary' | 'light-scene-select' | 'map-projection-select' | 'whiteboard-projection-select' | 'timeline-event-add' | 'timeline-event-edit' | 'wiki-entry-add' | 'wiki-entry-edit' | 'global-settings' | 'snapshot-viewer' | 'damage-calc' | 'danger-preset-editor' | 'narrative-display' | 'loot-roll' | 'encounter-roll';

interface ModalState {
    type: ModalType;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    onPromptConfirm?: (value: string) => void;
    defaultValue?: unknown;
    confirmLabel?: string;
    cancelLabel?: string;
    customVariant?: CustomModalVariant;
    isMediaHubOpen: boolean;

    showAlert: (message: string, onConfirm?: () => void, confirmLabel?: string) => void;
    showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void, confirmLabel?: string, cancelLabel?: string) => void;
    showPrompt: (message: string, defaultValue: string, onConfirm: (value: string) => void, confirmLabel?: string, cancelLabel?: string) => void;
    showCustom: (variant: CustomModalVariant, data?: unknown) => void;
    openMediaHub: () => void;
    closeMediaHub: () => void;
    closeModal: () => void;
}


export const useModalStore = create<ModalState>((set) => ({
    type: null,
    message: '',
    isMediaHubOpen: false,

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

    showCustom: (variant, data) => set({
        type: 'custom',
        customVariant: variant,
        defaultValue: data
    }),

    openMediaHub: () => set({ isMediaHubOpen: true }),
    closeMediaHub: () => set({ isMediaHubOpen: false }),

    closeModal: () => set({
        type: null,
        message: '',
        onConfirm: undefined,
        onCancel: undefined,
        onPromptConfirm: undefined,
        defaultValue: undefined,
        confirmLabel: undefined,
        cancelLabel: undefined,
        customVariant: undefined
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

export const gmCustom = (variant: CustomModalVariant, data?: unknown) => {
    useModalStore.getState().showCustom(variant, data);
};

export const gmOpenMediaHub = () => {
    useModalStore.getState().openMediaHub();
};
