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
    {
        id: 'dune',
        name: 'Dune: Aventures dans l\'Imperium',
        emoji: '🏜️',
        isBuiltin: true,
        defaultNotebookUrl: 'https://notebooklm.google.com/notebook/10bc3b64-7d40-4aad-99e6-9da1bf780b46',
        sections: [
            {
                id: 'skills',
                label: 'Compétences',
                fields: [
                    { id: 'analyse', label: 'Analyse', type: 'gauge', defaultValue: 4 },
                    { id: 'combat', label: 'Combat', type: 'gauge', defaultValue: 4 },
                    { id: 'discipline', label: 'Discipline', type: 'gauge', defaultValue: 4 },
                    { id: 'mobilite', label: 'Mobilité', type: 'gauge', defaultValue: 4 },
                    { id: 'rhetorique', label: 'Rhétorique', type: 'gauge', defaultValue: 4 },
                ],
            },
            {
                id: 'principles',
                label: 'Principes',
                fields: [
                    { id: 'devoir', label: 'Devoir', type: 'gauge', defaultValue: 4 },
                    { id: 'domination', label: 'Domination', type: 'gauge', defaultValue: 4 },
                    { id: 'foi', label: 'Foi', type: 'gauge', defaultValue: 4 },
                    { id: 'justice', label: 'Justice', type: 'gauge', defaultValue: 4 },
                    { id: 'verite', label: 'Vérité', type: 'gauge', defaultValue: 4 },
                ],
            },
            {
                id: 'resources',
                label: 'Ressources',
                fields: [
                    { id: 'momentum', label: 'Impulsion (Equipe)', type: 'number', defaultValue: 0 },
                    { id: 'threat', label: 'Menace (MJ)', type: 'number', defaultValue: 0 },
                ],
            },
        ],
    },
    {
        id: 'alien',
        name: 'Alien RPG',
        emoji: '👽',
        isBuiltin: true,
        defaultNotebookUrl: 'https://notebooklm.google.com/notebook/alien-default',
        sections: [
            {
                id: 'attributes',
                label: 'Attributs',
                fields: [
                    { id: 'strength', label: 'Force', type: 'gauge', defaultValue: 2, max: 5 },
                    { id: 'agility', label: 'Agilité', type: 'gauge', defaultValue: 2, max: 5 },
                    { id: 'wits', label: 'Esprit', type: 'gauge', defaultValue: 2, max: 5 },
                    { id: 'empathy', label: 'Empathie', type: 'gauge', defaultValue: 2, max: 5 },
                ],
            },
            {
                id: 'vitals',
                label: 'État Vital',
                fields: [
                    { id: 'hp', label: 'Santé', type: 'gauge', defaultValue: 3, max: 6 },
                    { id: 'stress', label: 'Stress', type: 'number', defaultValue: 0 },
                    { id: 'radiation', label: 'Radiations', type: 'number', defaultValue: 0 },
                ],
            },
            {
                id: 'career',
                label: 'Carrière & Atouts',
                fields: [
                    { id: 'career', label: 'Métier', type: 'text', defaultValue: 'Officier' },
                    { id: 'talent', label: 'Talent', type: 'text', defaultValue: '' },
                ],
            },
        ],
    },
];
