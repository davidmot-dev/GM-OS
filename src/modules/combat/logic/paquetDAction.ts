import type {
    ActionApprouvee,
    CarteDAction,
    DeckManifest,
    EffetDeConflit,
    LigneDeConflit,
} from '../../../types/deck.types';
import type { Camp } from './OrdreDuTour';

/**
 * **Le Paquet d'Action de Torg Eternity** — 2026-10-13, d'après le carnet
 * NotebookLM « Torg » et `docs/systems/torg/rules/initiative-et-deroulement-du-tour.md`.
 *
 * Au début de chaque round, le meneur retourne une carte. Sa **Ligne de
 * Conflit** — la claire pour une scène standard, la sombre pour une scène
 * dramatique — dit quel camp agit en premier (H ou V) et ce que chaque camp
 * reçoit ; le bas de la carte nomme une ou deux **Actions approuvées**. Le camp
 * désigné joue tous ses tours, dans l'ordre de son choix, puis l'autre.
 *
 * Les cartes sont des images : ce qu'elles disent, le meneur le saisit une fois
 * (`DeckManifest.cardMetadata[i].action`). Tout est pur ici.
 */

export type SorteDEffet = 'avantage' | 'desavantage';

export interface DefinitionDEffet {
    libelle: string;
    sorte: SorteDEffet;
    /** La règle, en une phrase — l'écran l'annonce telle quelle. */
    texte: string;
}

/** La liste fermée du livre. L'ordre est celui des menus. */
export const EFFETS_DE_CONFLIT: Record<EffetDeConflit, DefinitionDEffet> = {
    'inspiration': { libelle: 'Inspiration', sorte: 'avantage', texte: 'Tout le camp récupère 2 Choc — un KO reprend connaissance.' },
    'un-de-plus': { libelle: 'Un de plus !', sorte: 'avantage', texte: 'À chaque test du round, un second d20 s’ajoute au premier (il explose, sans minimum de 10).' },
    'vivacite': { libelle: 'Vivacité', sorte: 'avantage', texte: 'Le camp prend un second tour complet avant que la main ne passe.' },
    'deferlement': { libelle: 'Déferlement', sorte: 'desavantage', texte: 'Test de Contradiction (d20 pur) pour qui n’est pas natif du cosm ou porte un équipement étranger : 1 (1 à 4 en contradiction totale), Déconnecté.' },
    'desorientes': { libelle: 'Désorientés', sorte: 'desavantage', texte: 'Aucune carte ne se joue depuis la Réserve d’Action ce round (on peut encore y poser et piocher).' },
    'destabilises': { libelle: 'Déstabilisés', sorte: 'desavantage', texte: '−2 à tous les tests jusqu’à la fin de leur prochain tour.' },
    'fatigues': { libelle: 'Fatigués', sorte: 'desavantage', texte: '2 Choc à la fin du tour de chacun (3 avec une armure lourde « Fatigue »).' },
    'revers': { libelle: 'Revers', sorte: 'desavantage', texte: 'Une complication narrative — à défaut, le camp perd son tour.' },
};

export const ACTIONS_APPROUVEES: Record<ActionApprouvee, string> = {
    'attaque': 'Attaque',
    'defense': 'Défense',
    'intimidation': 'Intimidation',
    'manoeuvre': 'Manœuvre',
    'provocation': 'Provocation',
    'ruse': 'Ruse',
    'actions-multiples': 'Actions multiples',
    'toutes': 'Toutes',
};

export type SceneDeConflit = 'standard' | 'dramatique';

/** Le Paquet d'Action du jeu — le premier paquet du système marqué `action`. */
export function paquetDActionDuJeu(decks: readonly DeckManifest[], systemeId: string | undefined | null): DeckManifest | null {
    if (!systemeId) return null;
    return decks.find(d => d.systemId === systemeId && d.role === 'action') ?? null;
}

/** Ce que la carte dit, si le meneur l'a décrite. */
export function carteDecrite(deck: DeckManifest | null | undefined, index: number | null | undefined): CarteDAction | null {
    if (!deck || index === null || index === undefined) return null;
    return deck.cardMetadata?.[index]?.action ?? null;
}

/** La ligne qui vaut pour la scène. */
export function ligneActive(carte: CarteDAction, scene: SceneDeConflit): LigneDeConflit {
    return scene === 'dramatique' ? carte.dramatique : carte.standard;
}

/** Le camp qui agit en premier. Les Héros sont les joueurs et leurs alliés. */
export function campQuiCommence(ligne: LigneDeConflit): Camp {
    return ligne.premier === 'H' ? 'joueurs' : 'adversaires';
}

/** Ce qu'un camp reçoit de la ligne. */
export function effetsDuCamp(ligne: LigneDeConflit | null | undefined, camp: Camp): EffetDeConflit[] {
    if (!ligne) return [];
    return (camp === 'joueurs' ? ligne.heros : ligne.vilains) ?? [];
}

/**
 * **Ce que la carte du round donne à un camp** : rien tant qu'aucun round n'est
 * ouvert sur une carte décrite. Une seule règle pour le meneur, qui la calcule,
 * et la tablette, qui la reçoit avec la séance (`effetsDuRound`).
 */
export function effetsDuRound(
    ordre: { tour: unknown; carte: { index: number } | null; carteEnAttente: boolean; scene: SceneDeConflit },
    deck: DeckManifest | null | undefined,
    camp: Camp,
): EffetDeConflit[] {
    if (!ordre.tour || !ordre.carte || ordre.carteEnAttente) return [];
    const decrite = carteDecrite(deck, ordre.carte.index);
    return decrite ? effetsDuCamp(ligneActive(decrite, ordre.scene), camp) : [];
}

/** Les effets de la Ligne de Conflit, pour vérifier ce que la tablette reçoit. */
export const NOMS_DES_EFFETS = Object.keys(EFFETS_DE_CONFLIT) as EffetDeConflit[];

export const nomDuCampDeTorg = (camp: Camp) => (camp === 'joueurs' ? 'Héros' : 'Vilains');

/** La ligne en une phrase, pour le journal : « Héros d'abord — Héros : Inspiration ; Vilains : Fatigués ». */
export function direLaLigne(ligne: LigneDeConflit, approuvees: readonly ActionApprouvee[] = []): string {
    const premier = `${nomDuCampDeTorg(campQuiCommence(ligne))} d’abord`;
    const effets = (['joueurs', 'adversaires'] as Camp[])
        .map(camp => {
            const liste = effetsDuCamp(ligne, camp);
            return liste.length ? `${nomDuCampDeTorg(camp)} : ${liste.map(e => EFFETS_DE_CONFLIT[e].libelle).join(', ')}` : '';
        })
        .filter(Boolean);
    const approuvee = approuvees.length ? `Action approuvée : ${approuvees.map(a => ACTIONS_APPROUVEES[a]).join(', ')}` : '';
    return [premier, ...effets, approuvee].filter(Boolean).join(' — ');
}

/** Une carte vierge, pour le formulaire. */
export const CARTE_VIERGE: CarteDAction = {
    standard: { premier: 'H' },
    dramatique: { premier: 'V' },
    approuvees: [],
};

const EFFETS = new Set(Object.keys(EFFETS_DE_CONFLIT));
const ACTIONS = new Set(Object.keys(ACTIONS_APPROUVEES));

/**
 * Ce qui ne va pas dans une carte décrite — un pilote ou une sauvegarde
 * retouchés à la main. Vide : la carte se lit.
 */
export function defautsDeLaCarte(carte: CarteDAction): string[] {
    const defauts: string[] = [];
    for (const [nom, ligne] of [['standard', carte.standard], ['dramatique', carte.dramatique]] as const) {
        if (!ligne || (ligne.premier !== 'H' && ligne.premier !== 'V')) defauts.push(`La ligne ${nom} ne dit pas qui commence (H ou V).`);
        for (const e of [...(ligne?.heros ?? []), ...(ligne?.vilains ?? [])]) {
            if (!EFFETS.has(e)) defauts.push(`« ${e} » n’est pas un effet de la Ligne de Conflit.`);
        }
    }
    for (const a of carte.approuvees ?? []) {
        if (!ACTIONS.has(a)) defauts.push(`« ${a} » n’est pas une Action approuvée.`);
    }
    return defauts;
}
