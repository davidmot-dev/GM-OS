import { create } from 'zustand';

type ModalType = 'alert' | 'confirm' | 'prompt' | 'custom' | null;

export type CustomModalVariant = 'player-add' | 'character-add' | 'campaign-add' | 'campaign-edit' | 'npc-detail' | 'favorite-dossier' | 'session-select' | 'session-notes' | 'session-summary' | 'session-feedback' | 'light-scene-select' | 'map-projection-select' | 'whiteboard-projection-select' | 'timeline-event-add' | 'timeline-event-edit' | 'wiki-entry-add' | 'wiki-entry-edit' | 'global-settings' | 'snapshot-viewer' | 'damage-calc' | 'danger-preset-editor' | 'narrative-display' | 'loot-os' | 'aide-du-meneur' | 'atelier-adversaires' | 'rencontres' | 'fiche-combattant' | 'music-pad-edit' | 'vitrine-du-socle' | 'gestes-des-heros' | 'identite-visuelle';

/**
 * **Une question posée PAR-DESSUS une fenêtre, sans la démonter** — 24/11/2026 (§ 1 bis du 20/11, David :
 * « fais le 3 »). Le magasin n'a qu'une place (`type`) : ouverte depuis « Modifier la campagne », la
 * médiathèque qui demandait « Supprimer ce média ? » ou un nouveau nom faisait passer `type` de `custom`
 * à `confirm`, et le formulaire de campagne était démonté — ses modifications non enregistrées perdues.
 *
 * La question vit donc dans sa propre place, à côté de la fenêtre. Elle n'est pas devenue la règle de
 * `gmConfirm` : une trentaine de fenêtres posent une question qui, aujourd'hui, les referme (« Supprimer
 * ce PNJ ? » emporte sa fiche), et leurs gestes comptent dessus. Seuls les écrans qui s'ouvrent
 * par-dessus un formulaire l'emploient (`gmConfirmParDessus`, `gmPromptParDessus`) : la médiathèque.
 */
export interface QuestionParDessus {
    type: 'confirm' | 'prompt';
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    onPromptConfirm?: (value: string) => void;
    defaultValue?: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

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
    isNetworkModalOpen: boolean;
    /** La question posée par-dessus la fenêtre, qui reste montée dessous. */
    question: QuestionParDessus | null;

    showAlert: (message: string, onConfirm?: () => void, confirmLabel?: string) => void;
    showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void, confirmLabel?: string, cancelLabel?: string) => void;
    showPrompt: (message: string, defaultValue: string, onConfirm: (value: string) => void, confirmLabel?: string, cancelLabel?: string) => void;
    showCustom: (variant: CustomModalVariant, data?: unknown) => void;
    openMediaHub: () => void;
    closeMediaHub: () => void;
    openNetworkModal: () => void;
    closeNetworkModal: () => void;
    closeModal: () => void;
    poserParDessus: (question: QuestionParDessus) => void;
    fermerLaQuestion: () => void;
}


export const useModalStore = create<ModalState>((set) => ({
    type: null,
    message: '',
    isMediaHubOpen: false,
    isNetworkModalOpen: false,
    question: null,

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

    openNetworkModal: () => set({ isNetworkModalOpen: true }),
    closeNetworkModal: () => set({ isNetworkModalOpen: false }),

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
    }),

    poserParDessus: (question) => set({ question }),
    fermerLaQuestion: () => set({ question: null }),
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

/** Comme `gmConfirm`, mais la fenêtre ouverte reste montée dessous (`QuestionParDessus`). */
export const gmConfirmParDessus = (message: string, onConfirm: () => void, onCancel?: () => void, confirmLabel?: string, cancelLabel?: string) => {
    useModalStore.getState().poserParDessus({ type: 'confirm', message, onConfirm, onCancel, confirmLabel, cancelLabel });
};

/** Comme `gmPrompt`, mais la fenêtre ouverte reste montée dessous (`QuestionParDessus`). */
export const gmPromptParDessus = (message: string, defaultValue: string, onConfirm: (value: string) => void, confirmLabel?: string, cancelLabel?: string) => {
    useModalStore.getState().poserParDessus({ type: 'prompt', message, defaultValue, onPromptConfirm: onConfirm, confirmLabel, cancelLabel });
};

export const gmCustom = (variant: CustomModalVariant, data?: unknown) => {
    useModalStore.getState().showCustom(variant, data);
};

export const gmOpenMediaHub = () => {
    useModalStore.getState().openMediaHub();
};
