import type { CampagneNommee } from './titreDeJournal';

/**
 * Types d'événements enregistrables dans le journal.
 */
/**
 * **La liste fait foi, et le type en découle** — pas l'inverse.
 *
 * Écrite comme une union à la main, elle n'existait qu'à la compilation : un
 * seul `as any` suffisait à faire partir un événement avec un type inventé, et
 * `type: 'STORY' as any` l'a fait pendant des mois depuis le générateur de
 * narration. Les conséquences étaient toutes silencieuses — `natureParDefaut`
 * ne reconnaissant pas le type, l'événement retombait sur `trace`, se faisait
 * écarter du résumé, et s'affichait sans icône.
 *
 * En partant du tableau, le contrôle existe aussi À L'EXÉCUTION, et il ne peut
 * pas diverger de l'union : les deux sont le même objet.
 */
export const TYPES_D_EVENEMENT = [
  'AUDIO',
  'COMBAT',
  'NPC',
  'LOCATION',
  'NOTE',
  'SYSTEM',
  'ORACLE',
  /**
   * Ce qui arrive à un personnage joueur.
   *
   * **Décision de David, 2026-08-20** — l'une des trois questions laissées
   * ouvertes au § 10 du plan du 2026-08-08. La mort d'un PJ s'écrivait en `NPC`,
   * ce qui fonctionnait — nature `chronique`, donc elle atteignait le résumé —
   * mais rangeait sous « personnage non joueur » l'événement qu'une table
   * raconte le plus longtemps. *Un type qui ment sur son sujet coûte le jour où
   * l'on filtre.*
   */
  'PJ',
] as const;

export type JournalEventType = typeof TYPES_D_EVENEMENT[number];

/** Ce type existe-t-il vraiment ? Question posée au goulot, voir `addEvent`. */
export const estUnTypeDEvenement = (t: string): t is JournalEventType =>
  (TYPES_D_EVENEMENT as readonly string[]).includes(t);

/**
 * Ce qu'un événement est, indépendamment de son sujet.
 *
 * **On ne supprime pas, on distingue** (§ 4.3 du plan du 2026-08-08). Le journal
 * sert deux usages qui ne veulent pas la même granularité : *pendant* la partie
 * c'est un fil qu'on regarde, et « initiative tirée » confirme que l'action est
 * passée ; *après*, c'est la matière de la chronique, et la même ligne est du
 * bruit. Filtrer à la lecture aurait fait perdre le premier usage pour servir le
 * second.
 *
 * C'est cet axe qui permet de n'envoyer à un modèle que ce qui raconte —
 * aujourd'hui `summarizeSession` lui envoie tout, jets de dés compris.
 */
export type NatureDeLEvenement = 'trace' | 'chronique';

/**
 * La nature qu'on retient quand l'émetteur ne la déclare pas.
 *
 * **Un défaut par défaut, et non trente sites à instruire.** Le `type` porte
 * déjà l'essentiel de l'information ; seuls les émetteurs dont la nature
 * contredit leur type ont à le dire — le résumé de fin de combat, par exemple,
 * qui est du récit sous un type mécanique.
 *
 * `COMBAT` retombe sur `trace` parce que le cas courant est le tirage
 * d'initiative et les chutes de points de vie ; ses deux exceptions narratives
 * se déclarent. `ORACLE` aussi : consulter l'Oracle est un geste de meneur, pas
 * un fait de la fiction — à rebasculer si l'usage montre le contraire.
 */
export function natureParDefaut(type: JournalEventType): NatureDeLEvenement {
  switch (type) {
    case 'NPC':
    case 'PJ':
    case 'LOCATION':
    case 'NOTE':
      return 'chronique';
    default:
      return 'trace';
  }
}

/**
 * Représente un événement unique dans le journal de session.
 */
export interface JournalEvent {
  id: string;
  /** Timestamp UNIX de l'événement */
  timestamp: number;
  /** Catégorie de l'événement pour le filtrage et les icônes */
  type: JournalEventType;
  /** Titre court de l'événement */
  title: string;
  /** Contenu textuel ou Markdown */
  content: string;
  /**
   * Trace mécanique ou matière de chronique.
   *
   * Facultative à l'émission — `addEvent` la déduit du type quand elle manque —
   * mais **toujours présente sur un événement enregistré**. Les émetteurs dont
   * la nature contredit leur type la déclarent.
   */
  nature?: NatureDeLEvenement;
  /**
   * La scène pendant laquelle l'événement a eu lieu.
   *
   * **Un champ de premier ordre, et le § 9 du plan du 2026-08-08 l'exige en
   * toutes lettres** : *« le rattachement événement → scène doit être un champ
   * de premier ordre, pas une entrée dans `metadata` : c'est une relation
   * structurelle, pas une donnée accessoire. »*
   *
   * Il voyageait dans `metadata` depuis le 2026-08-17 — dette contractée en
   * même temps que le rattachement lui-même. La différence n'est pas cosmétique :
   * `metadata` est un sac de `unknown` que rien ne vérifie, où une faute de
   * frappe ne se voit jamais, et qu'aucun regroupement ne peut interroger sans
   * savoir d'avance ce qu'il cherche. C'est ce regroupement après coup qui est
   * le but — relire une séance scène par scène plutôt qu'en un seul fil.
   *
   * Facultatif : tout n'arrive pas pendant une scène, et un combat non rattaché
   * le dit franchement plutôt que de se taire.
   */
  sceneId?: string;
  /** Données additionnelles (ex: URLs d'images, IDs d'entités) */
  metadata?: Record<string, unknown>;
  /** État de favori pour l'affichage rapide */
  isFavorite?: boolean;
}

/**
 * Journal d'une session de jeu complète.
 */
export interface Journal {
  id: string;
  /** Titre généré (ex: "Campagne - Date (Session)") */
  title: string;
  /**
   * La campagne dont cette séance relève.
   *
   * **Il n'existait pas, et ça coûtait cher.** Le journal ne connaissait sa
   * campagne que par son titre, donc toute question à son sujet passait par une
   * correspondance de chaîne — c'est exactement la fragilité corrigée deux fois
   * ailleurs le 2026-08-18 (le résumé cherché par son titre traduit, le carnet
   * qui suivait l'écrivain et pas le lecteur). Relevé comme dette le soir même.
   *
   * Ce qui l'a rendu nécessaire : **le résumé par IA ne savait pas à quel jeu il
   * jouait.** Faute de campagne, il ne pouvait pas connaître le système, et il a
   * intitulé la séance du 19/08 « Chroniques des Terres Oubliées » — de
   * l'heroic-fantasy pour une campagne Alien.
   *
   * Facultatif : les journaux d'avant n'en portent pas, et un journal ouvert à
   * la main n'appartient à aucune campagne. `rattacherLesCampagnes` en rattrape
   * ce qu'il peut par le titre, sans jamais parier.
   */
  campaignId?: string;
  /** Heure de début de l'enregistrement */
  startTimestamp: number;
  /** Heure de fin (si terminée) */
  endTimestamp?: number;
  /** Durée formatée (HH:mm:ss) */
  duration?: string;
  /** Liste chronologique des événements */
  events: JournalEvent[];
  /** Notes finales de conclusion du MJ */
  finalNote?: string;
  /**
   * Le résumé narratif, **artefact dérivé du journal et non événement dedans**.
   *
   * **Le défaut qu'il corrige** (§ 4.2 du plan de trame narrative, 2026-08-08,
   * corrigé le 2026-08-17) : le résumé était enregistré par `addEvent`, donc il
   * rejoignait `journal.events` — et `summarizeSession` prend `journal.events`
   * en entrée. **Régénérer le résumé lui réinjectait le résumé précédent**,
   * contamination récursive qui s'aggrave à chaque passe. Il était de surcroît
   * typé `SYSTEM`, donc destiné à être écarté par le futur filtre trace/récit :
   * il se serait exclu lui-même.
   *
   * **Pourquoi ici et non sur `GameSession.publicSummary`**, que le plan
   * suggérait : ce champ-là est écrit par le meneur et relu au démarrage de la
   * séance suivante comme synopsis. Y verser le résumé de l'IA écraserait le
   * texte du meneur, puis se réinjecterait comme point de départ de la suite —
   * la même boucle, déplacée d'un cran. Un résumé dérive du journal ; il vit
   * donc sur le journal.
   *
   * Les journaux d'avant n'en portent pas, et **on ne migre rien** : leur
   * « résumé » était la phrase d'excuse d'un fournisseur non géré. Les
   * régénérer est le seul geste qui ait un sens.
   */
  resumeIA?: string;
  /** Quand ce résumé a été produit — un résumé plus vieux que la séance se voit. */
  resumeGenereLe?: number;
  /**
   * L'état des lieux au moment où la séance s'est arrêtée.
   *
   * **Conservé, et non plus seulement raconté.** `stopJournal` recevait déjà cet
   * instantané et le transformait en événements `SYSTEM` — donc il se noyait
   * dans le fil, et rien ne restait d'exploitable. Il est désormais gardé tel
   * quel : c'est la matière de la deuxième section du compte rendu, et elle se
   * calcule sans modèle.
   *
   * **Une photographie, pas une vue.** Relire un vieux journal doit montrer où
   * en étaient les personnages *ce soir-là*, pas où ils en sont aujourd'hui.
   */
  etatDeFin?: SessionSnapshot;
  /**
   * Ce qui restait à jouer quand la séance s'est arrêtée.
   *
   * Même raison d'être une photographie : la trame d'aujourd'hui ne dit pas ce
   * qui était prévu il y a trois semaines.
   */
  pourLaSuite?: PourLaSuite;
}

/**
 * Ce qui reste devant, relevé à la clôture d'une séance.
 *
 * **Troisième section du compte rendu, et elle se calcule** — décision de David
 * du 2026-08-17. Aucun appel au modèle : la trame sait déjà quelles scènes n'ont
 * jamais été jouées, quels indices n'ont pas été révélés, quels actes restent
 * ouverts. *Une chaîne construite est instantanée, gratuite, déterministe et
 * fonctionne hors ligne.*
 *
 * Des noms et non des identifiants : ce compte rendu se lit, et se relit des
 * mois plus tard, quand les objets pointés peuvent avoir disparu.
 */
export interface PourLaSuite {
  /** Scènes de la campagne jamais ouvertes, dans l'ordre de la trame. */
  scenesNonJouees: string[];
  /** Scènes laissées en pause — elles reprendront à la séance suivante. */
  scenesEnPause: string[];
  /** Indices que le groupe n'a pas encore trouvés. */
  indicesNonReveles: string[];
  /** Actes que la campagne n'a pas achevés. */
  actesOuverts: string[];
}

/**
 * Données capturées lors de la fin d'une session pour archivage.
 */
export interface SessionSnapshot {
  notes?: string;
  /**
   * État des PJs présents.
   *
   * **`hp` et `maxHp` sont facultatifs depuis le 2026-08-14** : tous les jeux
   * ne comptent pas la santé en points, et le compte rendu écrivait `12/20 HP`
   * pour des personnages qui n'en ont pas — sur Alien, `undefined/undefined`.
   * Facultatifs plutôt que remplacés, pour que les séances déjà archivées
   * restent lisibles telles quelles.
   */
  presentPCs?: Array<{ name: string; hp?: number; maxHp?: number; state: string }>;
  /** État des PNJs et monstres en combat. Même règle sur les points de vie. */
  sessionEntities?: Array<{ name: string; hp?: number; maxHp?: number; status: string }>;
  /** Éléments de la checklist non cochés */
  pendingChecklist?: string[];
  /** État des jauges de tension (Clock-OS) */
  clocks?: Array<{ name: string; filled: number; total: number }>;
  /** Données vectorielles du Whiteboard */
  whiteboardSnapshot?: unknown; 
}

/**
 * La campagne, telle qu'on l'annonce en ouvrant un journal.
 *
 * **Deux champs plutôt qu'une chaîne, et c'est le point.** `startJournal`
 * prenait un `campaignName: string`, et `launchSession` lui passait
 * `session.campaignId` — d'où les séances archivées sous
 * « c-1187082150026-gtbgs - 18/08 21:59 ». Le compilateur ne pouvait rien dire :
 * les deux sont des chaînes. En les nommant séparément, la confusion devient
 * impossible à écrire.
 *
 * L'identifiant **rattache**, le nom **s'affiche** — et jamais l'inverse.
 */
export interface CampagneDuJournal {
  /** Ce qui rattache. Absent pour un journal ouvert à la main. */
  id?: string;
  /** Ce qui s'affiche dans le titre, et se relit des mois plus tard. */
  nom: string;
}

/**
 * Données initiales pour le début d'une session.
 */
export interface SessionStartSnapshot {
  presentPlayers?: string[];
  publicSummary?: string;
}

/**
 * Interface d'état globale pour le Journal-OS.
 */
export interface JournalState {
  /** Historique complet des journaux enregistrés */
  journals: Journal[];
  /** ID du journal en cours d'enregistrement ou de consultation */
  activeJournalId: string | null;
  /** Indique si une session est actuellement en cours d'enregistrement */
  isRecording: boolean;
  
  // Actions
  /** Démarre un nouvel enregistrement de session avec snapshot initial */
  startJournal: (campagne: CampagneDuJournal, sessionName?: string, startSnapshot?: SessionStartSnapshot) => void;
  /**
   * Termine l'enregistrement en cours et **conserve** l'état final du système.
   *
   * `pourLaSuite` est relevé par l'appelant, qui seul voit la trame — le journal
   * ne connaît que ses propres événements.
   */
  stopJournal: (snapshot?: SessionSnapshot, pourLaSuite?: PourLaSuite) => void;
  /** Crée un journal vide manuellement */
  addJournal: (name: string) => void;
  /** Définit le journal actif pour l'affichage */
  setActiveJournal: (id: string | null) => void;
  /** Supprime définitivement un journal */
  deleteJournal: (id: string) => void;
  /** Ajoute un nouvel événement au journal actif */
  addEvent: (event: Omit<JournalEvent, 'id' | 'timestamp'>) => void;
  /** Supprime un événement spécifique */
  removeEvent: (journalId: string, eventId: string) => void;
  /** Met à jour un événement existant */
  updateEvent: (journalId: string, eventId: string, updates: Partial<JournalEvent>) => void;
  /**
   * Rattache à une scène **tous** les événements qui répondent au test, dans
   * tous les journaux. Rend combien ont bougé.
   *
   * **Tous les journaux, et c'est le point.** Une scène peut avoir été jouée sur
   * deux séances — c'est même le cas normal d'une scène laissée en pause. Ne
   * balayer que le journal ouvert laisserait la moitié de ses événements
   * pointer sur une scène que la fusion vient de faire disparaître.
   *
   * Le test est fourni par l'appelant parce que la politique lui appartient :
   * fusionner déplace tout ce qui portait l'ancienne scène, scinder ne déplace
   * que ce qui suit un instant donné. Le store, lui, ne connaît qu'un geste.
   */
  deplacerLesEvenements: (versSceneId: string, correspond: (e: JournalEvent) => boolean) => number;
  /** Active/Désactive l'état d'enregistrement */
  toggleRecording: (status?: boolean) => void;
  /** Génère un résumé narratif via LLM à partir des événements du journal */
  generateAISummary: (journalId: string) => Promise<void>;
  /** Synchronise le résumé IA vers un notebook externe (NotebookLM) */
  syncToNotebook: (journalId: string) => Promise<void>;
  /** Met à jour la note de fin de session */
  updateJournalNote: (journalId: string, note: string) => void;
  /**
   * Réécrit les titres qui portent un identifiant de campagne au lieu de son nom.
   *
   * Les journaux d'avant le 2026-08-18 s'appellent « c-1187082150026-gtbgs -
   * 18/08 21:59 » : `launchSession` passait l'identifiant à `startJournal`, qui
   * fige le titre à l'ouverture. Idempotente, et sans effet si rien ne change.
   */
  reparerLesTitresDeCampagne: (campagnes: readonly CampagneNommee[]) => void;
  /** Vide tout l'historique des journaux */
  clearJournal: () => void;
}
