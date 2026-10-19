import type { NexusCampaignState } from './nexus.types';
import { clonerLaCampagne, type Fabrique } from './clonerLaCampagne';

/**
 * **Rejouer une campagne** — lot E4 du chantier des archives (2026-10-19,
 * `documentation/Planning/2026-10-18-chantier-archives-de-campagne.md`).
 *
 * Une campagne qu'on refait jouer ne doit pas arriver avec la première partie :
 * ses séances, ses journaux, les scènes barrées, les indices déjà tombés. Les
 * décisions de David (§ 7) :
 *
 * - on **efface les séances et les journaux**, donc le parcours — passages,
 *   scènes terminées, actes achevés, clôture de la campagne ;
 * - on **garde les personnages** ;
 * - les **réserves de table reviennent à leur valeur de départ**.
 *
 * Ce qui relève de la **préparation** reste : actes, scènes, enchaînements,
 * graphe, PNJ, lieux, wiki, indices (cachés à nouveau), storyboard, rencontres
 * et combats préparés, butin à distribuer, favoris, modules du jeu.
 *
 * Ce qui relève du **jeu** part avec les séances : les messages entre
 * tablettes, l'historique du butin distribué, les événements de chronologie
 * nés d'une séance, l'état des paquets de cartes (les cartes tenues désignent
 * des mains de la première partie).
 */
export function effacerLeParcours(state: NexusCampaignState): NexusCampaignState {
    const { activeSessionId: _seance, clotureeLe: _cloture, ...campaign } = state.campaign;
    return {
        ...state,
        campaign,
        sessions: [],
        journaux: state.journaux === undefined ? undefined : [],
        actes: state.actes?.map(({ acheve: _acheve, ...acte }) => acte),
        scenes: state.scenes?.map(({ passages: _p, termineeLe: _t, ecarteeDeLaChronique: _e, ...scene }) => scene),
        clues: state.clues.map(({ revealedAt: _r, ...indice }) => ({ ...indice, isRevealed: false })),
        timelineEvents: state.timelineEvents.filter(e => !e.sessionId && e.type !== 'session'),
        messages: state.messages === undefined ? undefined : [],
        lootHistory: state.lootHistory === undefined ? undefined : [],
        deckSessionStates: [],
        /*
          Un état VIDE et non absent : absent, l'import ne toucherait pas aux
          réserves (« l'archive n'en parle pas ») ; vide, chaque réserve se lit
          à son départ (`valeurDe`). Toutes les réserves, pas seulement celles
          que « Nouveau scénario » remet : c'est une partie qui recommence.
        */
        reservesDeTable: {},
    };
}

/**
 * La campagne à rejouer : une copie (nouveaux identifiants partout, lot E3),
 * dont le parcours est effacé. `existeDeja` : l'original est-il sur ce poste ?
 * Alors le nom porte « (Nouvelle partie) », pour qu'on les distingue.
 */
export function rejouerLaCampagne(
    state: NexusCampaignState,
    { existeDeja = false, nouvelId }: { existeDeja?: boolean; nouvelId?: Fabrique } = {},
): NexusCampaignState {
    return clonerLaCampagne(effacerLeParcours(state), nouvelId, existeDeja ? ' (Nouvelle partie)' : '');
}
