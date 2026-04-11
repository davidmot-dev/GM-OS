import type { Campaign, Entity, AtlasMap, Clue } from '../store/types';

export const INITIAL_DATA = {
    campaigns: [
        {
            id: 'c-1',
            name: 'The Eternal Quest',
            system: 'generic',
            description: 'A dark fantasy adventure in the Underdark.',
            synopsis: 'The party is currently investigating the iron citadel.',
            activeSessionId: 's-1',
            activeLocationIds: ['am-1', 'am-2'],
            notebookUrl: 'https://notebooklm.google.com/notebook/campaign-c1-override',
        },
        {
            id: 'c-2',
            name: "Les Ombres d'Eldoria",
            system: 'generic',
            description: "Un voyage épique dans les terres d'Eldoria.",
            synopsis: "Le groupe enquête sur la disparition du roi d'Eldoria.",
            activeLocationIds: ['am-3'],
        },
    ] as Campaign[],
    sessions: [
        {
            id: 's-1',
            campaignId: 'c-1',
            number: 4,
            date: new Date().toISOString(),
            status: 'active' as const,
            publicSummary: 'The party has arrived at the gates of Ironhelm Fortress.',
            gmSecrets: 'Captain Varick is actually a Doppelganger.',
            checklist: [
                { id: 'item-1', text: 'Review map coordinates', isCompleted: true },
                { id: 'item-2', text: 'Audit NPC stat blocks', isCompleted: true },
                { id: 'item-3', text: 'Set atmospheric lighting', isCompleted: false },
                { id: 'item-4', text: 'Queue combat soundtrack', isCompleted: false },
            ],
            sessionEntityIds: ['e-1', 'e-4'],
        },
    ],
    entities: [
        {
            id: 'e-1', name: 'Baron Varick', type: 'npc' as const, role: 'hostile' as const, status: 'alive' as const,
            avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Varick&backgroundColor=b6e3f4',
            hp: 85, maxHp: 85, ac: 16, speed: 30, initiative: 3,
            description: 'Doppelganger / Warlord',
            roleplayingNotes: "Speaks with a cold and calculated authority.",
            gmSecretInfo: "He is a Doppelganger.",
            linkedMapIds: ['am-1'], campaignId: 'c-1', templateId: 'generic', sheetData: {},
        },
        {
            id: 'e-2', name: 'Sylvara the Dryad', type: 'npc' as const, role: 'neutral' as const, status: 'alive' as const,
            avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Sylvara&backgroundColor=ffdfbf',
            hp: 52, maxHp: 52, ac: 14, speed: 35, initiative: 4,
            description: 'Dryad / Forest Guardian',
            roleplayingNotes: 'Distrustful of strangers.',
            gmSecretInfo: 'She knows where the portal to the Feywild is located.',
            linkedMapIds: ['am-2'], campaignId: 'c-1', templateId: 'generic', sheetData: {},
        },
        {
            id: 'e-3', name: 'Ignathor', type: 'monster' as const, role: 'boss' as const, status: 'alive' as const,
            avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Ignathor&backgroundColor=ffd5dc',
            hp: 256, maxHp: 256, ac: 22, speed: 40, initiative: 0,
            description: 'Dragon Rouge Ancien / Boss Final',
            roleplayingNotes: 'Arrogant, condescendant.',
            gmSecretInfo: "Faiblesse secrète : l'Orbe de Feu Primordial.",
            linkedMapIds: ['am-3'], campaignId: 'c-2', templateId: 'generic', sheetData: {},
        },
        {
            id: 'e-4', name: 'Captain Ren', type: 'npc' as const, role: 'ally' as const, status: 'alive' as const,
            avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Ren&backgroundColor=c0aede',
            hp: 68, maxHp: 75, ac: 18, speed: 30, initiative: 2,
            description: "Human / Elite Guard",
            roleplayingNotes: 'Loyal, direct, professional.',
            gmSecretInfo: 'She suspects that Varick is not who he claims to be.',
            linkedMapIds: ['am-1'], campaignId: 'c-1', templateId: 'generic', sheetData: {},
        },
    ] as Entity[],
    players: [
        {
            id: 'p-1', realName: 'Thomas D.',
            avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Thomas&backgroundColor=b6e3f4',
            isOnline: true,
            characters: [
                { id: 'pc-1', name: 'Aldric the Paladin', classRace: 'Human / Oath of the Ancients', portraitUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Aldric&backgroundColor=b6e3f4', hp: 42, maxHp: 58, campaignId: 'c-1', templateId: 'generic', sheetData: {}, inventory: '' },
            ],
        },
        {
            id: 'p-2', realName: 'Marie C.',
            avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Marie&backgroundColor=ffdfbf',
            isOnline: false,
            characters: [
                { id: 'pc-3', name: 'Elowen la Druide', classRace: 'Elfe / Cercle de la Lune', portraitUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Elowen&backgroundColor=ffdfbf', hp: 60, maxHp: 60, campaignId: 'c-2', templateId: 'generic', sheetData: {}, inventory: '' },
            ],
        },
        {
            id: 'p-3', realName: 'Lucas R.',
            avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Lucas&backgroundColor=c0aede',
            isOnline: true,
            characters: [
                { id: 'pc-4', name: 'Balder the Barbarian', classRace: 'Dwarf / Path of the Berserker', portraitUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Balder&backgroundColor=ffd5dc', hp: 72, maxHp: 90, campaignId: 'c-1', templateId: 'generic', sheetData: {}, inventory: '' },
            ],
        },
    ],
    atlasMaps: [
        { id: 'am-1', name: "Ironhelm Fortress", fileUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200', isVideo: false, type: 'battlemap' as const, campaignId: 'c-1', narrativeDescription: "An imposing dark stone fortress.", gmNotes: "Baron Varick is a doppelganger.", linkedEntities: [{ id: 'le-1', name: 'Baron Varick', category: 'npc' as const }] },
        { id: 'am-2', name: 'Whispering Forest', fileUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200', isVideo: false, type: 'region' as const, campaignId: 'c-1', narrativeDescription: 'An ancient forest.', gmNotes: 'The Dryads here are hostile.', linkedEntities: [] },
        { id: 'am-3', name: 'Caverne du Dragon Rouge', fileUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=1200', isVideo: false, type: 'dungeon' as const, campaignId: 'c-2', narrativeDescription: "Un réseau de tunnels.", gmNotes: 'Ignathor dort dans la chambre finale.', linkedEntities: [] },
    ] as AtlasMap[],
    timelineEvents: [
        { id: 'te-1', campaignId: 'c-1', date: '14 Janvier, 1492 DR', title: "Arrivée à Ironhelm", description: 'Le groupe arrive aux portes de la forteresse.', type: 'session' as const, involvedEntityIds: ['p-1', 'p-2'] },
    ],
    wikiEntries: [
        { id: 'we-1', campaignId: 'c-1', title: "La Forteresse d'Ironhelm", content: "# Ironhelm\nUne pile de pierre noire.", category: 'location' as const, tags: ['nain', 'forteresse'], imageUrls: [], linkedEntityIds: ['am-1'] },
    ],
    clues: [
        { id: 'clue-1', campaignId: 'c-1', title: "Le Médaillon Sanglant", content: "Un médaillon trouvé sur un garde mort, marqué du sceau de Varick.", locationId: 'am-1', ownerId: 'e-1', isRevealed: false },
    ] as Clue[],
};
