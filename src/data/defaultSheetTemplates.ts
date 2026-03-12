// src/data/defaultSheetTemplates.ts
// Defines the built-in character sheet templates.

export type SheetFieldType = 'number' | 'text' | 'checkbox' | 'gauge' | 'select' | 'textarea' | 'rating';

export interface SheetField {
    id: string;
    label: string;
    type: SheetFieldType;
    defaultValue: number | string | boolean;
    options?: string[]; // Used for 'select' type
    max?: number;       // Used for 'rating' or 'gauge' absolute maximum
}

export interface SheetSection {
    id: string;
    label: string;
    fields: SheetField[];
}

export interface SheetTemplate {
    id: string;
    name: string;
    emoji: string;
    isBuiltin?: boolean; // Built-in templates cannot be deleted
    sections: SheetSection[];
    defaultNotebookUrl?: string; // Default NotebookLM for this system
    aiPersonas?: Record<string, string>; // gemId -> instructions
}

export const DEFAULT_SHEET_TEMPLATES: SheetTemplate[] = [
    {
        id: 'coc7',
        name: 'Call of Cthulhu 7e',
        emoji: '🦑',
        isBuiltin: true,
        defaultNotebookUrl: 'https://notebooklm.google.com/notebook/12345678-coc7-default',
        sections: [
            {
                id: 'characteristics',
                label: 'Caractéristiques',
                fields: [
                    { id: 'str', label: 'Force (FOR)', type: 'gauge', defaultValue: 50 },
                    { id: 'con', label: 'Constitution (CON)', type: 'gauge', defaultValue: 50 },
                    { id: 'siz', label: 'Taille (TAI)', type: 'gauge', defaultValue: 50 },
                    { id: 'dex', label: 'Dextérité (DEX)', type: 'gauge', defaultValue: 50 },
                    { id: 'app', label: 'Apparence (APP)', type: 'gauge', defaultValue: 50 },
                    { id: 'int', label: 'Intelligence (INT)', type: 'gauge', defaultValue: 70 },
                    { id: 'pow', label: 'Pouvoir (POU)', type: 'gauge', defaultValue: 50 },
                    { id: 'edu', label: 'Éducation (ÉDU)', type: 'gauge', defaultValue: 60 },
                ],
            },
            {
                id: 'resources',
                label: 'Ressources Vitales',
                fields: [
                    { id: 'sanity', label: 'Santé Mentale', type: 'gauge', defaultValue: 50 },
                    { id: 'magic', label: 'Points de Magie', type: 'gauge', defaultValue: 50 },
                ],
            },
            {
                id: 'identity',
                label: 'Identité',
                fields: [
                    { id: 'profession', label: 'Profession', type: 'text', defaultValue: '' },
                    { id: 'age', label: 'Âge', type: 'number', defaultValue: 30 },
                    { id: 'origin', label: 'Origine', type: 'text', defaultValue: '' },
                ],
            },
        ],
    },
    {
        id: 'generic',
        name: 'Générique',
        emoji: '📋',
        isBuiltin: true,
        defaultNotebookUrl: 'https://notebooklm.google.com/notebook/generic-default',
        sections: [
            {
                id: 'stats',
                label: 'Statistiques',
                fields: [
                    { id: 'stat1', label: 'Stat 1', type: 'gauge', defaultValue: 50 },
                    { id: 'stat2', label: 'Stat 2', type: 'gauge', defaultValue: 50 },
                ],
            },
            {
                id: 'info',
                label: 'Informations',
                fields: [
                    { id: 'info1', label: 'Info 1', type: 'text', defaultValue: '' },
                ],
            },
        ],
    },
];
