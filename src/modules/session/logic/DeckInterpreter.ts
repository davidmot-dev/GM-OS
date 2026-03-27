/**
 * DeckInterpreter — Logique métier pure pour Deck-OS.
 * Extraction chirurgicale de la gestion des paquets de cartes.
 * 
 * @module session/logic/DeckInterpreter
 */

import type { CardFormat, CardOrientation, DeckManifest } from '../store/types';

export const DeckInterpreter = {
    /**
     * Calcule le ratio d'aspect CSS (w/h) basé sur le format et l'orientation.
     */
    calculateAspectRatio: (format: CardFormat, orientation: CardOrientation): string => {
        const ratios = {
            poker: 2.5 / 3.5,
            tarot: 2.75 / 4.75,
        };

        const base = ratios[format] || ratios.poker;
        return orientation === 'portrait' ? `${base}` : `${1 / base}`;
    },

    /**
     * Initialise un paquet mélangé de N cartes.
     */
    initializeIndices: (manifest: DeckManifest): number[] => {
        const start = manifest.startAtZero ? 0 : 1;
        const indices = Array.from({ length: manifest.cardCount }, (_, i) => i + start);
        return DeckInterpreter.shuffle(indices);
    },

    /**
     * Mélange de Fisher-Yates pour un tirage équitable.
     */
    shuffle: (array: number[]): number[] => {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    },

    /**
     * Piocher une carte.
     * @returns { card: number | null, remaining: number[] }
     */
    draw: (remaining: number[]): { card: number | null; newRemaining: number[] } => {
        if (remaining.length === 0) return { card: null, newRemaining: [] };
        const [card, ...newRemaining] = remaining;
        return { card, newRemaining };
    },

    /**
     * Génère l'URL d'une image de carte basée sur la convention de dossier.
     */
    getCardImageUrl: (folderPath: string, index: number, manifest: DeckManifest): string => {
        const ext = manifest.extension || '.jpg';
        const pattern = manifest.filenamePattern || '{n}';
        const padding = manifest.padding || 0;
        const indexStr = padding > 0 ? String(index).padStart(padding, '0') : String(index);
        const filename = pattern.replace('{n}', indexStr);
        
        // Ensure folderPath ends without /
        const finalPath = folderPath.endsWith('/') ? folderPath.slice(0, -1) : folderPath;
        
        return `${finalPath}/${filename}${ext}`;
    },

    /**
     * Retourne l'URL complète de l'image pour un index donné.
     */
    getCardImage: (deck: DeckManifest, index: number): string => {
        return DeckInterpreter.getCardImageUrl(deck.folderPath, index, deck);
    },

    /**
     * Retourne les métadonnées d'une carte (si définies).
     */
    getCardMetadata: (deck: DeckManifest, index: number) => {
        return deck.cardMetadata?.[index];
    },

    /**
     * Génère l'URL du dos de la carte.
     */
    getBackImageUrl: (folderPath: string, manifest: DeckManifest): string => {
        const ext = manifest.extension || '.png';
        const finalPath = folderPath.endsWith('/') ? folderPath.slice(0, -1) : folderPath;
        return `${finalPath}/back${ext}`;
    }
};
