// src/data/defaultGameDrivers.ts
import type { GameDriver } from '../types/drivers';

export const DEFAULT_GAME_DRIVERS: GameDriver[] = [
    {
        id: 'generic',
        name: 'Système Universel',
        author: 'GM-OS',
        version: '1.0.0',
        description: 'Moteur de règles générique utilisable pour tout type de JDR.',
        emoji: '🎲',
        templateId: 'generic',
        dice: {
            defaultDice: '1d20',
            logic: 'sum'
        },
        combat: {
            statsToTrack: [
                { fieldId: 'hp', label: 'PV', isMainHP: true, isResource: false },
                { fieldId: 'ac', label: 'CA', isMainHP: false, isResource: false },
                { fieldId: 'initiative', label: 'Initiative', isMainHP: false, isResource: false }
            ],
            initiativeFormula: 'dex',
            initiativeSort: 'desc'
        },
        aiInstructions: 'Tu es le Sage de GM-OS. Aide le MJ à interpréter les règles de manière fluide.',
        lootTables: [
            {
                id: 'basic-treasure',
                name: 'Trésor de Base',
                description: 'Objets trouvés sur des ennemis mineurs.',
                entries: [
                    { id: 'gold', type: 'currency', name: 'Pièces d\'Or', weight: 50, minAmount: '2d6', maxAmount: '3d10' },
                    { id: 'potion', type: 'item', name: 'Potion de Soin', weight: 30, metadata: { rarity: 'uncommon', type: 'consumable' } },
                    { id: 'rusty-sword', type: 'item', name: 'Épée Rouillée', weight: 20, metadata: { rarity: 'common', type: 'weapon' } }
                ]
            }
        ],
        encounterTemplates: [
            {
                id: 'goblin-ambush',
                name: 'Embuscade de Gobelins',
                description: 'Un groupe de gobelins affamés.',
                entities: [
                    { templateId: 'Gobelin', count: '1d4+2', role: 'mook' },
                    { templateId: 'Chef Gobelin', count: 1, role: 'elite' }
                ]
            }
        ]
    }
];
