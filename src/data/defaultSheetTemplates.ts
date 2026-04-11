// src/data/defaultSheetTemplates.ts
// Defines the built-in character sheet templates.

export type SheetFieldType = 'number' | 'text' | 'checkbox' | 'gauge' | 'select' | 'textarea' | 'rating' | 'formula';

export interface SheetField {
    id: string;
    label: string;
    type: SheetFieldType;
    defaultValue: number | string | boolean;
    formula?: string;   // Used for 'formula' type
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
        id: 'generic',
        name: 'Generic',
        emoji: '📋',
        isBuiltin: true,
        defaultNotebookUrl: 'https://notebooklm.google.com/notebook/generic-default',
        sections: [
            {
                id: 'stats',
                label: 'Statistics',
                fields: [
                    { id: 'stat1', label: 'Stat 1', type: 'gauge', defaultValue: 50 },
                    { id: 'stat2', label: 'Stat 2', type: 'gauge', defaultValue: 50 },
                ],
            },
            {
                id: 'info',
                label: 'Information',
                fields: [
                    { id: 'info1', label: 'Info 1', type: 'text', defaultValue: '' },
                ],
            },
        ],
    },
];
