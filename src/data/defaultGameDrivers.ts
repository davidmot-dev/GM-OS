// src/data/defaultGameDrivers.ts
import type { GameDriver } from '../types/drivers';

export const DEFAULT_GAME_DRIVERS: GameDriver[] = [
    {
        id: 'alien',
        name: 'Alien RPG',
        author: 'Free League Publishing',
        version: '1.0.0',
        description: 'Year Zero Engine adapté pour l\'horreur spatiale. Utilise des dés de stress et des succès sur 6.',
        emoji: '👽',
        templateId: 'alien', // Link to the Alien template
        dice: {
            defaultDice: '6',
            logic: 'count-success',
            engine: 'year-zero' as any,
            successThreshold: 6
        },
        combat: {
            statsToTrack: [
                { fieldId: 'hp', label: 'Santé', isMainHP: true, isResource: false },
                { fieldId: 'stress', label: 'Stress', isMainHP: false, isResource: true }
            ],
            initiativeFormula: 'cards', // Specific logic for Alien
            initiativeSort: 'asc',
            initiativeCards: 10
        },
        tactical: {
            useTacticalAI: true,
            ranges: {
                contact: { label: 'Engagé (Contact)', maxUnits: 1.5, modifier: -3 }, // 0-3m
                courte: { label: 'Short (Courte)', maxUnits: 3.5, modifier: 0 },   // Zone
                moyenne: { label: 'Medium (Moyenne)', maxUnits: 12.5, modifier: -1 }, // Zone adjacente
                longue: { label: 'Long (Longue)', maxUnits: 50, modifier: -2 },     // Portée longue
                extreme: { label: 'Extreme (Extrême)', maxUnits: 200, modifier: -3 }  // Portée extrême
            }
        },
        aiInstructions: 'Système Alien RPG (Year Zero Engine). Les succès sont sur des 6. Un 1 sur un dé de stress provoque un test de Panique. Combat mortel, tactique basée sur les zones.'
    }
];
