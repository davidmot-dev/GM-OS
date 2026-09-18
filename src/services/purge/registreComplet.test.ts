import { describe, it, expect } from 'vitest';

/**
 * **Le prochain magasin persisté doit se déclarer, ou faire tomber ce test.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE TEST EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deux registres de ce projet ont vieilli en silence, et tous deux pour la même
 * raison : *un module qui apprend à retenir quelque chose doit penser à se
 * déclarer dans un fichier que personne n'ouvre en écrivant une
 * fonctionnalité.*
 *
 * - Le recensement des médias en avait **six** qui ne l'avaient pas fait, et
 *   leurs fichiers passaient pour orphelins — donc supprimés.
 * - La cascade de `deleteCampaign` a laissé survivre actes et scènes pendant
 *   cinq jours, invisibles parce que tous les écrans filtrent par campagne.
 *
 * Une liste sans contrôle n'est qu'une bonne intention datée. Celui-ci lit les
 * sources, trouve **tous** les magasins persistés, et exige que chacun soit
 * quelque part : dans un registre de purge, ou dans la liste ci-dessous, avec
 * une raison écrite. *Se déclarer hors périmètre est une décision ; être absent
 * n'en est pas une.*
 *
 * ⚠️ Il ne vérifie pas que la purge est *correcte* — ça, ce sont les tests de
 * comportement à côté. Il vérifie qu'on a **regardé**.
 */

/* `node:fs` n'existe pas dans le projet de tests `renderer` : on lit par le glob
   de Vite, comme les contrôles de traduction. Un fichier neuf entre dans le test
   sans qu'on y pense, ce qui est tout l'intérêt. */
const sources = import.meta.glob<string>('/src/**/*.ts', {
    eager: true,
    query: '?raw',
    import: 'default',
});

/**
 * Le nom sous lequel on parle d'un magasin.
 *
 * ⚠️ Le magasin de session s'appelle `store/index.ts` : son nom de fichier seul
 * dirait « index », ce qui ne désigne rien et ne se cherche nulle part. On
 * remonte alors d'un cran — *un identifiant qu'on ne peut pas retrouver à la
 * main ne sert pas dans un message d'échec.*
 */
function nomLisible(chemin: string): string {
    const morceaux = chemin.replace(/\.ts$/, '').split('/');
    const dernier = morceaux[morceaux.length - 1];
    return dernier === 'index' ? `${morceaux[morceaux.length - 2]}/index` : dernier;
}

/** Un magasin persisté : il appelle `persist(` et déclare un `create`. */
function magasinsPersistes(): string[] {
    return Object.entries(sources)
        .filter(([chemin]) => !chemin.includes('.test.'))
        .filter(([, code]) => code.includes('persist(') && code.includes('create<'))
        .map(([chemin]) => nomLisible(chemin))
        .sort();
}

/** Les magasins qu'un registre de purge importe nommément. */
function magasinsDeclares(): Set<string> {
    const registres = Object.entries(sources)
        .filter(([chemin]) => chemin.includes('/services/purge/detenteurs'))
        .map(([, code]) => code)
        .join('\n');

    const declares = new Set<string>();
    for (const magasin of magasinsPersistes()) {
        if (registres.includes(magasin)) declares.add(magasin);
    }
    return declares;
}

/**
 * **Hors périmètre, et pourquoi.**
 *
 * Chaque ligne est une décision, pas un oubli toléré. Le motif tient en une
 * question : *ce magasin porterait-il encore, demain, quelque chose au nom d'une
 * campagne morte ou d'un jeu supprimé ?* Si la réponse est non, il n'a rien à
 * rendre.
 */
const HORS_PERIMETRE: Record<string, string> = {
    // ── Réglages de la machine et de la pièce : ils ne connaissent ni jeu ni campagne.
    useAudioMasterStore: 'Niveaux de sortie — ils décrivent la pièce, pas l’univers.',
    useHardwareStore: 'Les appareils branchés sur cette machine.',
    usePerformanceStore: 'Mesures de performance de cette machine.',
    useRaccourcisStore: 'Les raccourcis clavier du meneur.',
    useClientStore: 'Les tablettes connectées à l’instant présent.',
    useVoiceStore: 'Le réglage du micro du meneur.',
    useLightStore: 'Le pont Hue et les scènes de lumière — elles servent tous les jeux.',
    useWebStore: 'Les liens web du meneur.',
    useObsidianStore: 'Le chemin de son coffre Obsidian.',
    useAIStore: 'Les réglages des fournisseurs d’IA, communs à tous les jeux.',
    'store/index': 'Le magasin de session — déclaré dans les DEUX registres, sous le nom Session-OS.',

    // ── Bibliothèques sonores et visuelles : un travail réutilisable, jamais un résidu.
    useSoundStore: 'Les ambiances de pads — une bibliothèque, pas de la donnée de campagne.',
    useAmbientStore: 'Les nappes d’ambiance, communes à toutes les tables.',
    useImageStore: 'La médiathèque — c’est `MediaCleanupService` qui décide du sort d’une image.',
    useMapStore: 'La carte du plateau et ses configurations, réutilisables.',
    useMapUIStore: 'Où l’on regardait sur la carte.',
    useWhiteboardStore: 'Le tableau blanc — il n’est rattaché à aucune campagne.',
    useTableStore: 'Les tables aléatoires, rangées par univers sur le disque.',
    useBibliothequeDesFiches: 'Copie de sauvegarde du moteur de fiches ; la vérité vit dans le moteur.',
    useNPCStore: 'Le générateur de PNJ — ce qui est gardé passe en entités de campagne.',
    useMusicStore: 'Déclaré dans le registre de campagne (il détache), rien à faire côté pilote.',

    // ── Ce qui est déjà couvert autrement, ou ne survit pas à la séance.
    useDiceStore: 'Le pupitre lit le pilote actif ; il ne garde rien à son nom.',
    useOrdreDuTourStore: 'L’ordre du tour d’un combat en cours.',
    useClockStore: 'Les jauges et calendriers — ils ne portent pas d’identifiant de campagne.',
    useSessionStore: 'L’ancien magasin de session, sans rattachement.',
    useTacticalAIStore: 'Les réglages de l’IA tactique, communs.',
    useTaxonomyStore: 'La taxonomie des décors, commune.',
    useBrainstormStore: 'La série de brainstorm en cours ; elle se termine ou s’abandonne.',
    useUlanziStore: 'Déclaré dans le registre du pilote.',
    moteurParForge: 'Quel moteur sert pour chaque Forge — un réglage, pas de la donnée.',
    useGemStore: 'Déclaré dans le registre du pilote (surcharges par système).',
    useJournalDesLacunes: 'Déclaré dans le registre du pilote.',
    useCombatStore: 'Déclaré dans le registre de campagne (combats garés par scène).',
    useBestiaireStore: 'Déclaré dans le registre du pilote.',
    useFavoriteStore: 'Déclaré dans le registre de campagne.',
    useJournalStore: 'Déclaré dans le registre de campagne.',
    useStoryboardStore: 'Déclaré dans le registre de campagne.',
    useRessourcesDeTableStore: 'Déclaré dans le registre de campagne.',
};

describe('aucun magasin persisté n’échappe aux registres de purge', () => {
    it('trouve bien les magasins persistés du projet', () => {
        // Un glob qui ne rend rien rendrait ce test vert pour la pire raison.
        expect(magasinsPersistes().length).toBeGreaterThan(20);
    });

    it('chaque magasin persisté est déclaré, ou dit pourquoi il ne l’est pas', () => {
        const declares = magasinsDeclares();
        const orphelins = magasinsPersistes()
            .filter(m => !declares.has(m) && !(m in HORS_PERIMETRE));

        expect(orphelins, [
            'Ces magasins persistés ne sont ni dans un registre de purge, ni déclarés hors périmètre.',
            'Deux gestes possibles, et un seul est un oubli :',
            '  • il retient quelque chose au nom d’une campagne ou d’un jeu → l’ajouter au registre ;',
            '  • il n’en retient rien → l’écrire dans HORS_PERIMETRE avec la raison.',
        ].join('\n')).toEqual([]);
    });

    it('la liste hors périmètre ne garde pas de fantômes', () => {
        /*
          Un magasin renommé ou supprimé laisserait sa ligne ici, et la ligne
          continuerait d'excuser un nom qui n'existe plus — la forme silencieuse
          du même défaut, dans l'autre sens.
        */
        const existants = new Set(magasinsPersistes());
        const fantomes = Object.keys(HORS_PERIMETRE).filter(m => !existants.has(m));
        expect(fantomes).toEqual([]);
    });
});
