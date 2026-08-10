import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BrainstormState } from '../types';

/**
 * Le carnet ne tient qu'une conversation à la fois.
 *
 * **Mesuré en réel le 2026-08-10** : trois inventaires identiques partis dans la
 * même milliseconde, et sur six requêtes lancées, quatre ne sont jamais
 * revenues. La cause n'était pas une double exécution d'effet mais un **double
 * montage** — `BrainstormOverlay` était rendu à la fois par `App.tsx` et par
 * `ForgeDashboard`. Deux instances, deux `useRef`, deux effets : aucun garde-fou
 * porté par le composant ne pouvait les départager.
 *
 * D'où un verrou **de module** : il est partagé par toutes les instances, quelle
 * que soit la façon dont l'arbre est monté demain. Et il est posé de façon
 * synchrone — un état de store n'aurait rien protégé, puisqu'il n'est visible
 * qu'au rendu suivant, quand les requêtes concurrentes sont déjà parties.
 *
 * Hors du store proprement dit : ce n'est pas de l'état d'affichage, rien ne
 * doit se redessiner quand il change.
 */
let carnetOccupe = false;

/**
 * Numéro de la requête en cours.
 *
 * **Ce qu'il résout : l'abandon.** On ne peut pas annuler un appel MCP — le
 * serveur continue de travailler et finira par répondre. Ce qu'on peut faire,
 * c'est **cesser d'attendre** : on incrémente la génération, la réponse tardive
 * arrive sur une génération périmée et se jette au lieu d'écraser l'écran.
 *
 * Il protège aussi le verrou. Sans lui, la requête abandonnée libérerait en
 * retombant le verrou tenu par la requête *suivante*, et deux appels
 * partiraient de front — précisément ce que le verrou existe pour empêcher.
 */
let generation = 0;

/** Rend le numéro de génération, ou `null` si une requête est déjà en vol. */
export function reserverLeCarnet(): number | null {
  if (carnetOccupe) return null;
  carnetOccupe = true;
  return generation;
}

/** Ne libère que si la génération correspond : une requête périmée ne libère rien. */
export function libererLeCarnet(gen: number): void {
  if (gen === generation) carnetOccupe = false;
}

/**
 * Cesse d'attendre la requête en cours et rouvre le carnet.
 *
 * **On ne prétend pas l'avoir arrêtée** : le serveur poursuit son travail et
 * répondra dans le vide. C'est la moitié honnête de ce qui est faisable
 * aujourd'hui ; l'annulation réelle demande de reprendre le pont.
 */
export function abandonnerLaRequete(): void {
  generation += 1;
  carnetOccupe = false;
}

export function carnetEstOccupe(): boolean {
  return carnetOccupe;
}

/** La génération courante, pour savoir si une réponse est encore attendue. */
export function generationCourante(): number {
  return generation;
}

/**
 * Brainstorm Store
 * Gère le cycle de vie de l'inventaire, de la forge des fiches et de la
 * passe personas.
 *
 * **La forge et l'écriture sont deux états distincts** (`review` puis `saved`) :
 * rien ne part sur le disque sans passer devant un humain.
 */
export const useBrainstormStore = create<BrainstormState>()(persist((set) => ({
  step: 'idle',
  candidates: [],
  inventaireBrut: null,
  activeCard: null,
  personas: null,
  isProcessing: false,
  error: null,
  notebookId: null,
  notebookTitre: null,
  sourcesDuCarnet: [],
  corpusCible: null,
  selectedSourceIds: [],
  customSubject: '',
  forgedCandidateIds: [],
  savedCandidateIds: [],

  setNotebook: (id, titre) => set({ notebookId: id, notebookTitre: titre ?? null }),
  setCorpusCible: (corpusCible) => set({ corpusCible }),
  setSources: (ids) => set({ selectedSourceIds: ids }),

  /**
   * Le catalogue du carnet ouvert, et l'élagage de la sélection avec lui.
   *
   * **Relevé le 2026-08-10.** Changer de carnet ne vidait pas la sélection : les
   * identifiants du carnet précédent restaient et partaient comme filtre vers
   * le nouveau. Et l'écart était invisible — la corbeille de contexte n'affiche
   * que les sources du carnet courant, donc une sélection étrangère s'y montre
   * comme « aucune source », pendant que la requête filtre dessus.
   *
   * On élague plutôt qu'on ne vide : revenir sur un carnet déjà visité conserve
   * ce qu'on y avait coché.
   */
  setSourcesDuCarnet: (sources) => set((state) => {
    const valides = new Set(sources.map(s => s.id));
    const retenues = state.selectedSourceIds.filter(id => valides.has(id));
    return {
      sourcesDuCarnet: sources,
      ...(retenues.length === state.selectedSourceIds.length ? {} : { selectedSourceIds: retenues }),
    };
  }),
  setCustomSubject: (subject) => set({ customSubject: subject }),
  setStep: (step) => set({ step }),
  setProcessing: (isProcessing) => set({ isProcessing }),

  startDiscovery: () => set({
    step: 'discovery',
    error: null,
    candidates: [],
    inventaireBrut: null,
    activeCard: null,
    personas: null,
  }),

  setCandidates: (candidates, inventaireBrut) => set({
    candidates,
    ...(inventaireBrut === undefined ? {} : { inventaireBrut }),
    isProcessing: false
  }),

  startForging: () => set({
    isProcessing: true,
    step: 'forging',
    activeCard: null,
    error: null
  }),

  // La fiche existe, elle n'est pas écrite. C'est ici que la relecture a lieu.
  reviewCard: (card) => set((state) => ({
    activeCard: card,
    isProcessing: false,
    step: 'review',
    forgedCandidateIds: state.forgedCandidateIds.includes(card.id)
      ? state.forgedCandidateIds
      : [...state.forgedCandidateIds, card.id]
  })),

  markSaved: (candidateId) => set((state) => ({
    step: 'saved',
    isProcessing: false,
    savedCandidateIds: state.savedCandidateIds.includes(candidateId)
      ? state.savedCandidateIds
      : [...state.savedCandidateIds, candidateId]
  })),

  startPersonas: () => set({
    step: 'personas',
    isProcessing: true,
    error: null,
    personas: null
  }),

  setPersonas: (personas) => set({
    personas,
    step: 'personas',
    isProcessing: false
  }),

  setError: (error) => set({
    error,
    isProcessing: false
  }),

  /**
   * Ferme la série en cours, **sans défaire la configuration**.
   *
   * Le carnet ouvert, son catalogue de sources, la sélection et le corpus visé
   * ne sont pas des états de série : ce sont les réglages du travail. Les
   * effacer obligeait à tout re-désigner à chaque fermeture — et créait un écart
   * silencieux, `notebookSources` étant un état local de `ForgeDashboard` qui,
   * lui, survivait : re-cocher une source restaurait son identifiant sans son
   * titre, et l'écran affichait un UUID brut à la place du nom du fichier.
   *
   * Ce qui disparaît est ce qui appartient à la série : l'étape, les candidats,
   * la fiche en revue, les personas, l'erreur.
   */
  reset: () => set({
    step: 'idle',
    candidates: [],
    inventaireBrut: null,
    activeCard: null,
    personas: null,
    error: null,
    isProcessing: false,
    forgedCandidateIds: [],
    savedCandidateIds: []
  })
}), {
  name: 'gmos-forge-corpus',
  /**
   * **Le corpus visé, et lui seul.**
   *
   * Il tenait sa valeur par défaut de la campagne active ; il n'en a plus, et
   * sans mémoire il faudrait le re-désigner à chaque ouverture — une friction
   * qui pousse à cliquer vite, exactement ce qui a fait forger dans le mauvais
   * dossier. La Forge se souvient donc du livre qu'elle documente.
   *
   * Rien d'autre ne se persiste : ni l'étape, ni les candidats, ni la fiche en
   * revue. Une série reprise depuis le disque est vraie ; une série restaurée de
   * mémoire prétendrait connaître un état que le disque seul atteste.
   */
  partialize: (state) => ({ corpusCible: state.corpusCible }),
}));
