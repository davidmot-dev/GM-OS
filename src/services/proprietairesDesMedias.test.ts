import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Le recensement doit voir les six modules qu'il ne voyait pas.**
 *
 * Chacun de ces cas correspond à un fichier que le nettoyage aurait supprimé
 * avant le 2026-09-04, faute d'avoir demandé à son propriétaire. Le test les
 * garde ouverts un par un : un magasin retiré de la liste fait tomber son test,
 * et lui seul.
 */

const vide = {
    npc: { currentEntity: null, savedEntities: [] },
    image: { mediaList: [] },
    session: {
        campaigns: [], entities: [], atlasMaps: [], wikiEntries: [], players: [], clues: [],
    },
    combat: { combatants: [] },
    sound: { atmospheres: [] },
    music: { playlists: [] },
    ambient: { presets: [], tracks: [] },
    map: { mapUrl: null, mapName: null, mapPresets: [] },
    storyboard: { moments: [] },
    favorite: { favorites: [] },
};

const etats = structuredClone(vide) as Record<string, any>;

vi.mock('../modules/npc/useNPCStore', () => ({ useNPCStore: { getState: () => etats.npc } }));
vi.mock('../modules/image/useImageStore', () => ({ useImageStore: { getState: () => etats.image } }));
vi.mock('../modules/session/useSessionOSStore', () => ({ useSessionOSStore: { getState: () => etats.session } }));
vi.mock('../modules/combat/useCombatStore', () => ({ useCombatStore: { getState: () => etats.combat } }));
vi.mock('../modules/sound/useSoundStore', () => ({ useSoundStore: { getState: () => etats.sound } }));
vi.mock('../modules/music/useMusicStore', () => ({ useMusicStore: { getState: () => etats.music } }));
vi.mock('../modules/ambient/useAmbientStore', () => ({ useAmbientStore: { getState: () => etats.ambient } }));
vi.mock('../modules/map/useMapStore', () => ({ useMapStore: { getState: () => etats.map } }));
vi.mock('../modules/storyboard/useStoryboardStore', () => ({ useStoryboardStore: { getState: () => etats.storyboard } }));
vi.mock('../modules/favorite/useFavoriteStore', () => ({ useFavoriteStore: { getState: () => etats.favorite } }));

const { usagesDesMedias, LES_MODULES_RECENSES } = await import('./proprietairesDesMedias');

beforeEach(() => {
    // `Object.assign` ne suffit pas : le test du magasin en echec remplace une
    // cle par un accesseur, qu'une simple affectation ne peut plus ecraser.
    for (const [cle, valeur] of Object.entries(vide)) {
        Object.defineProperty(etats, cle, {
            value: structuredClone(valeur),
            writable: true,
            configurable: true,
            enumerable: true,
        });
    }
});

describe('les six angles morts du 2026-09-04', () => {
    it('voit la carte chargée sur le plateau tactique', () => {
        etats.map = { mapUrl: 'm-carte', mapName: 'Les égouts', mapPresets: [] };
        expect(usagesDesMedias().usages.get('m-carte')).toEqual([
            { module: 'Map-OS', sujet: 'Les égouts' },
        ]);
    });

    it('voit la carte de chaque configuration sauvée, jamais chargée', () => {
        etats.map = {
            mapUrl: null,
            mapName: null,
            mapPresets: [{ id: 'p1', name: 'Embuscade de nuit', mapUrl: 'm-auberge' }],
        };
        expect(usagesDesMedias().usages.get('m-auberge')).toEqual([
            { module: 'Map-OS', sujet: 'Configuration « Embuscade de nuit »' },
        ]);
    });

    it("voit l'image attachée à un indice", () => {
        etats.session.clues = [{ id: 'c1', title: 'La lettre brûlée', mediaUrl: 'm-lettre' }];
        expect(usagesDesMedias().usages.get('m-lettre')).toHaveLength(1);
    });

    it("voit l'image ET la carte d'un moment de storyboard", () => {
        etats.storyboard.moments = [
            { id: 'm1', name: 'L’arrivée', imageMediaId: 'm-img', mapUrl: 'm-plan' },
        ];
        const { usages } = usagesDesMedias();
        expect(usages.has('m-img')).toBe(true);
        expect(usages.has('m-plan')).toBe(true);
    });

    it("voit les documents liés à un personnage", () => {
        etats.session.players = [{
            id: 'j1', realName: 'David', avatarUrl: '',
            characters: [{ id: 'p1', name: 'Kael', linkedDocumentIds: ['m-contrat', 'm-carte-visite'] }],
        }];
        const { usages } = usagesDesMedias();
        expect(usages.has('m-contrat')).toBe(true);
        expect(usages.has('m-carte-visite')).toBe(true);
    });

    it("voit l'avatar du joueur, distinct de celui de son personnage", () => {
        etats.session.players = [{
            id: 'j1', realName: 'David', avatarUrl: 'm-photo',
            characters: [{ id: 'p1', name: 'Kael', portraitUrl: 'm-portrait' }],
        }];
        const { usages } = usagesDesMedias();
        expect(usages.get('m-photo')).toEqual([{ module: 'Joueurs', sujet: 'Joueur — David' }]);
        expect(usages.get('m-portrait')).toEqual([{ module: 'Joueurs', sujet: 'Portrait de Kael' }]);
    });

    it('voit le portrait et le jeton d’un favori', () => {
        etats.favorite.favorites = [{ id: 'f1', name: 'Dame Ysolde', imageUrl: 'm-p', tokenUrl: 'm-j' }];
        const { usages } = usagesDesMedias();
        expect(usages.has('m-p')).toBe(true);
        expect(usages.has('m-j')).toBe(true);
    });
});

describe('ce que le recensement écarte', () => {
    it('ignore une illustration désignée par une URL web', () => {
        etats.session.entities = [{ id: 'e1', name: 'Garde', avatar: 'https://exemple/img.png' }];
        expect(usagesDesMedias().usages.size).toBe(0);
    });

    it('ignore une référence vide ou absente', () => {
        etats.session.entities = [
            { id: 'e1', name: 'A', avatar: '' },
            { id: 'e2', name: 'B' },
        ];
        expect(usagesDesMedias().usages.size).toBe(0);
    });
});

describe('plusieurs usages du même fichier', () => {
    it('les garde tous, pour pouvoir les nommer à l’écran', () => {
        etats.session.entities = [
            { id: 'e1', name: 'Garde 1', avatar: 'm-visage' },
            { id: 'e2', name: 'Garde 2', avatar: 'm-visage' },
        ];
        etats.favorite.favorites = [{ id: 'f1', name: 'Le Garde', imageUrl: 'm-visage' }];

        const usages = usagesDesMedias().usages.get('m-visage');
        expect(usages).toHaveLength(3);
        expect(usages?.map((u) => u.module)).toEqual(['Campagnes', 'Campagnes', 'Favoris']);
    });
});

describe('un magasin qui échoue', () => {
    it('ne rend pas orphelin ce que les autres détiennent, et se déclare', () => {
        etats.session.entities = [{ id: 'e1', name: 'Garde', avatar: 'm-garde' }];
        Object.defineProperty(etats, 'favorite', {
            get() { throw new Error('magasin cassé'); },
            configurable: true,
        });
        vi.spyOn(console, 'error').mockImplementation(() => {});

        const recensement = usagesDesMedias();

        expect(recensement.usages.has('m-garde')).toBe(true);
        expect(recensement.complet).toBe(false);
        expect(recensement.modulesEnEchec).toEqual(['Favoris']);
    });
});

describe('la liste des propriétaires', () => {
    it('nomme les douze modules qui retiennent des médias', () => {
        expect(LES_MODULES_RECENSES).toEqual([
            'NPC-OS', 'Image-OS', 'Campagnes', 'Joueurs', 'Indices', 'Combat-OS',
            'Map-OS', 'Storyboard', 'Favoris', 'Sound-OS', 'Music-OS', 'Ambient-OS',
        ]);
    });
});
