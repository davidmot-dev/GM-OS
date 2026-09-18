import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * **Ce que chaque détenteur rend, et surtout ce qu'il ne rend pas.**
 *
 * Chaque cas ci-dessous correspond à un résidu réel — quelque chose qui
 * survivait à la suppression et revenait polluer la tentative suivante — ou à un
 * garde-fou dont l'absence aurait détruit plus que la cible. *Un test de purge
 * qui ne vérifie que ce qui part ne vérifie que la moitié intéressante.*
 */

/**
 * Un magasin mimé : `getState` et `setState`, c'est tout ce que les registres
 * emploient.
 *
 * ⚠️ L'état de départ est une **fabrique**, et pas une valeur. `structuredClone`
 * ne sait pas copier une fonction, et le magasin de session en porte trois
 * (`deleteCampaign` et ses voisines) : cloner aurait échoué au premier
 * remontage, pas au premier test.
 */
function magasin<T extends object>(faire: () => T) {
    let etat = faire();
    return {
        getState: () => etat,
        setState: (maj: Partial<T> | ((e: T) => Partial<T>)) => {
            etat = { ...etat, ...(typeof maj === 'function' ? maj(etat) : maj) };
        },
        remettre: () => { etat = faire(); },
        lire: () => etat,
    };
}

const session = magasin(() => ({
    campaigns: [] as any[],
    scenes: [] as any[],
    sessions: [] as any[],
    entities: [] as any[],
    atlasMaps: [] as any[],
    wikiEntries: [] as any[],
    timelineEvents: [] as any[],
    clues: [] as any[],
    actes: [] as any[],
    players: [] as any[],
    lootPool: [] as any[],
    lootHistory: [] as any[],
    decks: [] as any[],
    deckStates: {} as Record<string, unknown>,
    customGameDrivers: [] as any[],
    customSheetTemplates: [] as any[],
    deleteCampaign: vi.fn(),
    deleteGameDriver: vi.fn(),
    deleteSheetTemplate: vi.fn(),
}));
const journal = magasin(() => ({ journals: [] as any[] }));
const storyboard = magasin(() => ({ moments: [] as any[] }));
const ressources = magasin(() => ({ reserves: {} as Record<string, unknown> }));
const favoris = magasin(() => ({ favorites: [] as any[] }));
const musique = magasin(() => ({ playlists: [] as any[] }));
const combat = magasin(() => ({ combatsGares: {} as Record<string, unknown> }));
const bestiaire = magasin(() => ({ gabarits: [] as any[], repartitions: {} as Record<string, unknown> }));
const gemmes = magasin(() => ({ gems: [] as any[] }));
const ulanzi = magasin(() => ({ selection: {} as Record<string, unknown> }));
const lacunes = magasin(() => ({ questions: [] as any[] }));

vi.mock('../../modules/session/useSessionOSStore', () => ({ useSessionOSStore: session }));
vi.mock('../../modules/journal/useJournalStore', () => ({ useJournalStore: journal }));
vi.mock('../../modules/storyboard/useStoryboardStore', () => ({ useStoryboardStore: storyboard }));
vi.mock('../../modules/table/useRessourcesDeTableStore', () => ({ useRessourcesDeTableStore: ressources }));
vi.mock('../../modules/favorite/useFavoriteStore', () => ({ useFavoriteStore: favoris }));
vi.mock('../../modules/music/useMusicStore', () => ({ useMusicStore: musique }));
vi.mock('../../modules/combat/useCombatStore', () => ({ useCombatStore: combat }));
vi.mock('../../modules/combat/useBestiaireStore', () => ({ useBestiaireStore: bestiaire }));
vi.mock('../../stores/useGemStore', () => ({ useGemStore: gemmes }));
vi.mock('../../modules/ulanzi/useUlanziStore', () => ({ useUlanziStore: ulanzi }));
vi.mock('../../modules/ai/lacunes/useJournalDesLacunes', () => ({ useJournalDesLacunes: lacunes }));
vi.mock('../../data/defaultSheetTemplates', () => ({
    DEFAULT_SHEET_TEMPLATES: [{ id: 'tpl-integre', name: 'Référence', isBuiltin: true }],
}));
vi.mock('../../modules/session/store/tousLesPilotes', () => ({
    tousLesPilotes: (customs: any[]) => customs,
}));

const {
    LES_DETENTEURS_DE_CAMPAGNE, cibleDeLaCampagne,
} = await import('./detenteursDeLaCampagne');
const {
    LES_DETENTEURS_DE_PILOTE, cibleDuPilote, campagnesDuPilote, modeleAEmporter,
} = await import('./detenteursDuPilote');
const { recenserLesDetenteurs, purgerLesDetenteurs } = await import('./typesDeLaPurge');

const tous = [session, journal, storyboard, ressources, favoris, musique, combat,
    bestiaire, gemmes, ulanzi, lacunes];

beforeEach(() => {
    tous.forEach(m => m.remettre());
    vi.clearAllMocks();
});

const detenteur = (liste: readonly any[], nom: string) => liste.find(d => d.module === nom)!;

describe('la cible d’une campagne fige ses scènes', () => {
    it('emporte la liste des scènes, parce que Session-OS va les effacer', () => {
        session.setState({
            campaigns: [{ id: 'c1', name: 'Milo' }],
            scenes: [{ id: 's1', campaignId: 'c1' }, { id: 's2', campaignId: 'c2' }],
        });
        expect(cibleDeLaCampagne('c1')).toEqual({ id: 'c1', nom: 'Milo', sceneIds: ['s1'] });
    });

    it('rend null pour une campagne qui n’existe plus', () => {
        expect(cibleDeLaCampagne('fantome')).toBeNull();
    });
});

describe('les résidus d’une campagne', () => {
    const cible = { id: 'c1', nom: 'Milo', sceneIds: ['s1', 's2'] };

    it('Combat-OS rend les combats garés de SES scènes, et laisse les autres', () => {
        /*
          Le cas qui justifie la cible figée : les combats garés sont rangés par
          `sceneId`, et Session-OS efface les scènes. Un détenteur qui relirait
          le magasin après lui ne trouverait plus rien à rendre.
        */
        combat.setState({ combatsGares: { s1: {}, s2: {}, sAutre: {} } });
        const d = detenteur(LES_DETENTEURS_DE_CAMPAGNE, 'Combat-OS');

        expect(d.recenser(cible)).toEqual([{ sujet: 'combats garés sur ses scènes', compte: 2 }]);
        d.purger(cible);
        expect(Object.keys(combat.lire().combatsGares)).toEqual(['sAutre']);
    });

    it('Music-OS DÉTACHE la playlist au lieu de l’effacer', () => {
        /*
          Une playlist est un travail d'écoute et de niveaux, réutilisable ;
          l'étiquette de campagne est un tri, pas une cloison. Sans étiquette,
          elle est commune — c'est la règle d'août, pas une exception d'ici.
        */
        musique.setState({
            playlists: [
                { id: 'p1', name: 'Tension', campagneId: 'c1' },
                { id: 'p2', name: 'Voyage', campagneId: null },
            ],
        });
        const d = detenteur(LES_DETENTEURS_DE_CAMPAGNE, 'Music-OS');

        expect(d.recenser(cible)).toEqual([{ sujet: 'playlists étiquetées', compte: 1 }]);
        d.purger(cible);
        expect(musique.lire().playlists).toHaveLength(2);
        expect(musique.lire().playlists[0].campagneId).toBeNull();
    });

    it('le journal ne part que s’il porte l’identifiant, jamais sur un nom qui se ressemble', () => {
        journal.setState({
            journals: [
                { id: 'j1', title: 'Milo - 12/09', campaignId: 'c1' },
                { id: 'j2', title: 'Milo - 03/08' },            // d'avant le rattachement
                { id: 'j3', title: 'Autre', campaignId: 'c9' },
            ],
        });
        const d = detenteur(LES_DETENTEURS_DE_CAMPAGNE, 'Journal de séance');

        expect(d.recenser(cible)).toEqual([{ sujet: 'journaux', compte: 1 }]);
        d.purger(cible);
        expect(journal.lire().journals.map((j: any) => j.id)).toEqual(['j2', 'j3']);
    });

    it('les réserves de table partent par campagne, et elles seules', () => {
        ressources.setState({ reserves: { c1: { impulsion: 3 }, c2: { impulsion: 1 } } });
        const d = detenteur(LES_DETENTEURS_DE_CAMPAGNE, 'Réserves de table');

        expect(d.recenser(cible)).toEqual([{ sujet: 'réserves suivies', compte: 1 }]);
        d.purger(cible);
        expect(Object.keys(ressources.lire().reserves)).toEqual(['c2']);
    });

    it('le recensement ne montre aucun module qui n’a rien', () => {
        // Un module à zéro dans la liste ferait croire qu'il reste à décider.
        const recensement = recenserLesDetenteurs(LES_DETENTEURS_DE_CAMPAGNE, cible);
        expect(recensement.modules.every(m => m.total > 0)).toBe(true);
    });

    it('un module muet rend le recensement incomplet, et il est nommé', () => {
        const fautif = [{
            module: 'Fautif',
            recenser: () => { throw new Error('magasin illisible'); },
            purger: () => undefined,
        }];
        const recensement = recenserLesDetenteurs(fautif as any, cible);
        expect(recensement.complet).toBe(false);
        expect(recensement.modulesEnEchec).toEqual(['Fautif']);
    });

    it('purger ne touche QUE les modules cochés', () => {
        journal.setState({ journals: [{ id: 'j1', campaignId: 'c1' }] });
        storyboard.setState({ moments: [{ id: 'm1', campaignId: 'c1' }] });

        purgerLesDetenteurs(LES_DETENTEURS_DE_CAMPAGNE, cible, ['Storyboard']);

        expect(storyboard.lire().moments).toEqual([]);
        expect(journal.lire().journals).toHaveLength(1);
    });
});

describe('les garde-fous d’un pilote', () => {
    it('refuse d’emporter un modèle de fiche que partage un autre pilote', () => {
        session.setState({
            customGameDrivers: [
                { id: 'jeu-a', name: 'A', templateId: 'tpl-1' },
                { id: 'jeu-b', name: 'B', templateId: 'tpl-1' },
            ],
            customSheetTemplates: [{ id: 'tpl-1', name: 'Commun' }],
        });
        expect(modeleAEmporter('jeu-a')).toBeUndefined();
    });

    it('refuse d’emporter un modèle intégré au code', () => {
        session.setState({
            customGameDrivers: [{ id: 'jeu-a', name: 'A', templateId: 'tpl-integre' }],
            customSheetTemplates: [],
        });
        expect(modeleAEmporter('jeu-a')).toBeUndefined();
    });

    it('emporte le modèle qui n’appartient qu’à lui', () => {
        session.setState({
            customGameDrivers: [{ id: 'jeu-a', name: 'A', templateId: 'tpl-1' }],
            customSheetTemplates: [{ id: 'tpl-1', name: 'À lui' }],
        });
        expect(modeleAEmporter('jeu-a')).toBe('tpl-1');
    });

    it('nomme les campagnes qui jouent encore ce pilote', () => {
        session.setState({
            campaigns: [
                { id: 'c1', name: 'Milo', system: 'jeu-a' },
                { id: 'c2', name: 'Hadley', system: 'jeu-b' },
            ],
        });
        expect(campagnesDuPilote('jeu-a')).toEqual([{ id: 'c1', nom: 'Milo' }]);
    });
});

describe('les résidus d’un pilote', () => {
    const cible = { id: 'alien', nom: 'Alien' };

    it('le bestiaire rend ses gabarits et ses répartitions', () => {
        bestiaire.setState({
            gabarits: [{ id: 'g1', jeuId: 'alien' }, { id: 'g2', jeuId: 'dune' }],
            repartitions: { 'alien:brute': {}, 'dune:brute': {} },
        });
        const d = detenteur(LES_DETENTEURS_DE_PILOTE, 'Bestiaire');

        expect(d.recenser(cible)).toEqual([
            { sujet: 'gabarits d’adversaires', compte: 1 },
            { sujet: 'répartitions de champs validées', compte: 1 },
        ]);
        d.purger(cible);
        expect(bestiaire.lire().gabarits).toHaveLength(1);
        expect(Object.keys(bestiaire.lire().repartitions)).toEqual(['dune:brute']);
    });

    it('un identifiant préfixe d’un autre n’emporte pas ses répartitions', () => {
        // `dnd` ne doit pas emporter `dnd-5e` : la clé est `jeuId:archetype`,
        // donc c'est le deux-points qui fait la frontière, pas une inclusion.
        bestiaire.setState({ gabarits: [], repartitions: { 'dnd-5e:brute': {} } });
        detenteur(LES_DETENTEURS_DE_PILOTE, 'Bestiaire').purger({ id: 'dnd', nom: 'D&D' } as any);
        expect(Object.keys(bestiaire.lire().repartitions)).toEqual(['dnd-5e:brute']);
    });

    it('le cortex perd sa consigne pour ce jeu, et reste debout', () => {
        gemmes.setState({
            gems: [{ id: 'sage', name: 'Sage', systemOverrides: { alien: 'parle bas', dune: 'parle sec' } }],
        });
        const d = detenteur(LES_DETENTEURS_DE_PILOTE, 'Cortex — consignes du jeu');

        expect(d.recenser(cible)).toEqual([{ sujet: 'cortex portant une consigne pour ce jeu', compte: 1 }]);
        d.purger(cible);
        expect(gemmes.lire().gems).toHaveLength(1);
        expect(gemmes.lire().gems[0].systemOverrides).toEqual({ dune: 'parle sec' });
    });

    it('Deck-OS rend les paquets du jeu ET l’état de ces paquets', () => {
        /*
          Le paquet dit `systemId` là où la campagne dit `system` : deux noms
          pour la même chose. Et l'état d'un paquet vit dans une carte à part —
          l'oublier laisserait des mains de cartes sans paquet.
        */
        session.setState({
            decks: [{ id: 'd1', systemId: 'alien' }, { id: 'd2', systemId: 'dune' }],
            deckStates: { d1: { piochees: 3 }, d2: { piochees: 0 } },
        });
        const d = detenteur(LES_DETENTEURS_DE_PILOTE, 'Deck-OS');

        expect(d.recenser(cible)).toEqual([{ sujet: 'paquets de ce jeu', compte: 1 }]);
        d.purger(cible);
        expect(session.lire().decks.map((x: any) => x.id)).toEqual(['d2']);
        expect(Object.keys(session.lire().deckStates)).toEqual(['d2']);
    });

    it('la Forge retire le modèle AVANT le pilote', () => {
        /*
          L'ordre compte : une fois le pilote parti, plus rien ne sait à qui le
          modèle appartenait. La cible le porte, donc l'ordre est tenu ici — le
          test garde la raison visible.
        */
        session.setState({
            customGameDrivers: [{ id: 'alien', name: 'Alien', templateId: 'tpl-1' }],
            customSheetTemplates: [{ id: 'tpl-1' }],
        });
        const pilote = cibleDuPilote('alien', 'systems/alien');
        expect(pilote?.templateIdAEmporter).toBe('tpl-1');

        detenteur(LES_DETENTEURS_DE_PILOTE, 'Forge — pilote et modèle').purger(pilote!);
        expect(session.lire().deleteSheetTemplate).toHaveBeenCalledWith('tpl-1');
        expect(session.lire().deleteGameDriver).toHaveBeenCalledWith('alien');
    });
});
