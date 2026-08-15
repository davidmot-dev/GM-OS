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

/**
 * Fiche de « Dune : Aventures dans l'Imperium » — **la fiche de référence**.
 *
 * **Pourquoi elle est livrée dans le code.** Jusqu'au 2026-08-10, le seul
 * gabarit fourni s'appelait « Generic » et ses champs `stat1`, `stat2`,
 * `info1`. Il n'existait donc aucun exemple de fiche juste : impossible de
 * juger ce que la Forge Système rendait, faute d'avoir jamais vu à quoi
 * ressemble un résultat correct.
 *
 * **Chaque valeur vient du corpus vérifié**, jamais d'une supposition :
 * `docs/systems/dune/rules/l-equation-statistique-duale-*.md` pour les bornes
 * des compétences et des principes, `jauges-et-ressources-individuelles.md`
 * pour la Détermination. Les fiches elles-mêmes citent leurs sections, et
 * `bookIndex` les résout en pages du livre.
 *
 * **Ce que Dune n'a pas, et qui ne doit surtout pas être ajouté** : aucun point
 * de vie. « Il n'existe aucune jauge numérique de santé ou de fatigue sur la
 * feuille de personnage » — les blessures sont des traits négatifs et des
 * tâches étendues. Une fiche Dune avec des PV serait une fiche fausse.
 */
const DUNE_TEMPLATE: SheetTemplate = {
    id: 'dune',
    /**
     * **Le nom dit que c'est une fiche, et une référence.**
     *
     * Il valait « Dune : Aventures dans l'Imperium » — c'est-à-dire le nom du
     * **pilote**. David, le 2026-08-15, voyant l'onglet Fiches : *« il y a le
     * "Système Officiel" de Dune qui ne correspond pas à la réalité et que je
     * ne peux pas effacer »*. Il avait toutes les raisons de s'y perdre : trois
     * cartes voisines s'appelaient « Dune : Aventures dans l'Imperium »,
     * « Fiche de Personnage Dune » et « Fiche de Chevalier des Tempêtes », sans
     * que rien ne dise laquelle était quoi.
     *
     * C'est la même confusion pilote/gabarit que celle corrigée la veille dans
     * l'écran de création de personnage, où un sélecteur intitulé « Système de
     * Jeu » listait des fiches.
     *
     * L'identifiant, lui, ne bouge pas : `dune` est asserté par
     * `duneReference.test.ts`, `DescripteurDeJet.test.ts` et
     * `controlesDuPilote.test.ts` — c'est l'étalon qui les calibre.
     */
    name: 'Dune — fiche de référence',
    emoji: '🏜️',
    isBuiltin: true,
    sections: [
        {
            id: 'competences',
            // « La compétence répond à ce que fait le personnage. » Bornes 4 à 8.
            label: 'Compétences',
            fields: [
                { id: 'analyse', label: 'Analyse', type: 'number', defaultValue: 4, max: 8 },
                { id: 'combat', label: 'Combat', type: 'number', defaultValue: 4, max: 8 },
                { id: 'discipline', label: 'Discipline', type: 'number', defaultValue: 4, max: 8 },
                { id: 'mobilite', label: 'Mobilité', type: 'number', defaultValue: 4, max: 8 },
                { id: 'rhetorique', label: 'Rhétorique', type: 'number', defaultValue: 4, max: 8 },
            ],
        },
        {
            id: 'principes',
            // « Le principe répond à pourquoi il agit. » Mêmes bornes : le seuil
            // d'un test est la somme d'une compétence et d'un principe, soit 8 à 16.
            label: 'Principes',
            fields: [
                { id: 'devoir', label: 'Devoir', type: 'number', defaultValue: 4, max: 8 },
                { id: 'domination', label: 'Domination', type: 'number', defaultValue: 4, max: 8 },
                { id: 'foi', label: 'Foi', type: 'number', defaultValue: 4, max: 8 },
                { id: 'justice', label: 'Justice', type: 'number', defaultValue: 4, max: 8 },
                { id: 'verite', label: 'Vérité', type: 'number', defaultValue: 4, max: 8 },
            ],
        },
        {
            id: 'ressources',
            label: 'Ressources',
            fields: [
                // Départ 1, bornes 0 à 3. À zéro, aucune relance ni réussite
                // automatique ; à trois, les gains sont perdus.
                { id: 'determination', label: 'Détermination', type: 'gauge', defaultValue: 1, max: 3 },
                { id: 'progression', label: 'Points de progression', type: 'number', defaultValue: 0 },
            ],
        },
        {
            id: 'identite',
            label: 'Identité',
            fields: [
                { id: 'maison', label: 'Maison', type: 'text', defaultValue: '' },
                { id: 'archetype', label: 'Archétype', type: 'text', defaultValue: '' },
                { id: 'ambition', label: 'Ambition', type: 'textarea', defaultValue: '' },
            ],
        },
        {
            id: 'traits',
            // Les traits portent aussi les blessures : « survivre à la défaite »
            // applique un trait personnel négatif. Pas de jauge, du texte.
            label: 'Traits, talents et atouts',
            fields: [
                { id: 'traits', label: 'Traits', type: 'textarea', defaultValue: '' },
                { id: 'talents', label: 'Talents', type: 'textarea', defaultValue: '' },
                { id: 'atouts', label: 'Atouts', type: 'textarea', defaultValue: '' },
            ],
        },
    ],
};

export const DEFAULT_SHEET_TEMPLATES: SheetTemplate[] = [
    DUNE_TEMPLATE,
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
