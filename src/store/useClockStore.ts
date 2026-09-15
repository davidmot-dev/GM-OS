import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockageLocalDuMJ } from '../utils/ecritureReserveeAuMJ';
import type { FormeDeJauge } from '../modules/clock/components/formesDeJauge';
import {
    dateDeDepart,
    estBissextile,
    feteDuJour,
    jourDeLaSemaine,
    mentionDeLaFete,
    horodatageDeLaDate,
    joursDeLAnnee,
    leCalendrierEstFautif,
    secondesParJour,
    type CalendrierDatable,
} from '../modules/clock/logic/formeDuCalendrier';
import {
    appliquerLUsure,
    apresChangementDeSens,
    departDeLaJauge,
    usureDeLaScene,
    type SensDeLaJauge,
    type UsureDUneJauge,
} from '../modules/clock/logic/sensDeLaJauge';

/**
 * **Un horodatage est-il utilisable ?**
 *
 * `Number.isFinite` écarte `NaN`, les infinis, et tout ce qui n'est pas un
 * nombre — `null` et `undefined` compris, que `typeof` seul laisserait passer
 * après un aller-retour par JSON (`JSON.stringify(NaN)` rend `null`).
 *
 * La borne haute est celle de l'objet `Date` lui-même : au-delà de
 * ±8 640 000 000 000 000 ms, une date est invalide et `toISOString()` lève.
 * *Le contrôle doit refuser exactement ce que `Date` refuse, sinon il rassure
 * sans protéger.*
 */
export const HORODATAGE_MAX = 8_640_000_000_000_000;

export function horodatageValide(valeur: unknown): valeur is number {
    return typeof valeur === 'number'
        && Number.isFinite(valeur)
        && Math.abs(valeur) <= HORODATAGE_MAX;
}

/** Mode de fonctionnement de l'horloge */
export type ClockMode = 'realtime' | 'static' | 'timer' | 'fantasy';
/** Thèmes visuels disponibles pour l'affichage */
export type ClockTheme = 'cyberpunk' | 'oldstyle' | 'modern';

/**
 * Définit un calendrier fantastique personnalisé.
 */
export interface FantasyCalendar {
    id: string;
    /** Nom du calendrier (ex: "Calendrier d'Harptos") */
    name: string;
    description?: string;
    /** Liste des mois et leur durée */
    months: {
        name: string;
        days: number;
        displayName?: string;
        /** Indique si c'est un mois hors calendrier (ex: fête) */
        isIntercalary?: boolean;
        /** Présent uniquement lors des années bissextiles */
        leapYearOnly?: boolean;
        /**
         * **Les fêtes qui tombent DANS ce mois** — demandé par David le
         * 2026-09-15 : *« je veux pouvoir déclarer des jours de fêtes »*.
         *
         * ⚠️ **Elles sont portées par le mois, et non par le calendrier avec un
         * index de mois.** Un index se désynchronise dès qu'on déplace un mois
         * dans l'Atelier : les fêtes de Hammer se retrouveraient dans Alturiak
         * **sans que rien ne le signale**. Attachées au mois, elles le suivent
         * quand il bouge et disparaissent avec lui. *Rendre le défaut
         * impossible à écrire plutôt que de le signaler.*
         *
         * ⚠️ **Une fête dans un mois reste un jour de la semaine** : c'est le 15
         * de Hammer, qui porte un nom. Seuls les mois `isIntercalary` sortent
         * du calendrier, donc de la semaine.
         *
         * La forme, les bornes et le contrôle vivent dans
         * `modules/clock/logic/formeDuCalendrier.ts`.
         */
        fetes?: {
            nom: string;
            /** Premier jour, 1-based, dans le mois qui la porte. */
            jour: number;
            /** Durée en jours. Absente ou inférieure à 1 : un jour. */
            duree?: number;
            description?: string;
        }[];
    }[];
    /** Nombre de jours par semaine */
    daysPerWeek: number;
    /** Noms des jours de la semaine */
    daysOfWeek?: string[];
    /** Heures dans un cycle journalier */
    hoursPerDay: number;
    /** Minutes par heure */
    minutesPerHour: number;
}

/**
 * Jauge de tension narrative (Clock).
 */
export interface TensionClock {
    id: string;
    /** Label de la jauge (ex: "Alerte Gardes") */
    name: string;
    /** Nombre total de segments */
    totalSegments: number;
    /** Segments actuellement remplis */
    filledSegments: number;
    /** Couleur personnalisée pour le rendu */
    color?: string;
    /**
     * **La forme sous laquelle la jauge se dessine** — anneau, barre, points ou
     * aiguille. Choisie par jauge : une alerte des gardes n'a pas la même voix
     * que des provisions qui s'épuisent (David, 2026-08-30).
     *
     * Absente : c'est un anneau. Les jauges créées avant ce champ n'en ont pas
     * et continuent donc de s'afficher exactement comme hier — *aucune
     * migration, et rien à redessiner.*
     */
    forme?: FormeDeJauge;
    /**
     * **Cette jauge part-elle sur l'afficheur de table ?**
     *
     * *Demandé par David le 2026-08-31, pour l'instrument du § 4 — le
     * Voight-Kampff.* `isClockProjected` est tout-ou-rien : les jauges partaient
     * toutes sur l'Ulanzi, ou aucune. Or l'instrument est justement le cas où
     * l'on veut **celle-là** au milieu de la table et pas les cinq autres.
     *
     * **Absent = elle part**, comme avant ce champ. Aucune migration, et une
     * jauge créée hier se comporte exactement comme hier. C'est aussi le
     * défaut le moins surprenant : on retire une jauge de l'afficheur, on ne
     * l'y ajoute pas.
     *
     * ⚠️ Ne remplace pas `isClockProjected`, qui reste l'interrupteur général :
     * *le drapeau choisit lesquelles, l'interrupteur décide si.*
     */
    surLAfficheur?: boolean;
    /**
     * **Les joueurs voient-ils cette jauge ?**
     *
     * *Tranché par David le 2026-09-04 (point C1 du § 12).* `isClockProjected`
     * était tout-ou-rien : masquer une seule jauge obligeait à masquer
     * l'horloge entière. Or c'est précisément la jauge qu'on ne veut pas
     * montrer qui rend le reste utile — le compte à rebours que le meneur tient
     * pendant que la table croit avoir le temps.
     *
     * ⚠️ **Absent = elle est vue**, exactement comme avant ce champ : les
     * jauges d'hier continuent de s'afficher, aucune migration, rien à
     * redessiner. **Mais une jauge NOUVELLE naît secrète** — `addTensionClock`
     * écrit `false` — parce qu'une jauge qu'on vient de créer n'a pas encore de
     * nom qu'on assume, et qu'*ouvrir est un geste, refermer est un regret*.
     *
     * ⚠️ Ne remplace pas `isClockProjected`, qui reste l'interrupteur général :
     * *le drapeau choisit lesquelles, l'interrupteur décide si.* Ni
     * `surLAfficheur`, qui ne parle qu'à l'Ulanzi — une jauge secrète est
     * retirée des deux, l'afficheur est posé sur la table.
     */
    vueParLesJoueurs?: boolean;
    /**
     * **Dans quel sens cette jauge se lit-elle ?**
     *
     * *Demandé par David le 2026-09-15 :* **« j'ai des jauges qui augmentent,
     * mais je n'ai pas de jauge qui diminue pour simuler la diminution de
     * consommable »**.
     *
     * `epuisement` renverse tout ce qui entoure la jauge — sa naissance, son
     * alarme, son clic, sa relecture — sans toucher à sa géométrie : les
     * segments allumés sont **ce qu'il reste**. La règle et ses raisons vivent
     * dans `modules/clock/logic/sensDeLaJauge.ts`, une seule fois, parce qu'il y
     * a quatre écrans et un compte rendu qui la lisent.
     *
     * ⚠️ **Absent = elle monte**, exactement comme avant ce champ. Aucune
     * migration.
     */
    sens?: SensDeLaJauge;
    /**
     * **Ce qu'une fin de scène coûte à cette jauge.** Toujours **positif** :
     * c'est `sens` qui décide de la direction — une ration de moins, un segment
     * de rituel de plus.
     *
     * Absent ou nul : la scène ne lui fait rien, et c'est le cas de toutes les
     * jauges existantes. L'usure part de `trameSlice.terminerLaScene`, le seul
     * endroit de l'application qui sache qu'une scène s'achève.
     */
    pasParScene?: number;
}

/**
 * **LE filtre : ce que les joueurs ont le droit de voir.**
 *
 * Une seule fonction, parce qu'il y a **quatre** chemins vers un écran de
 * joueur — le Player Hub, les tablettes, le segment `clock` de la télécommande,
 * et l'afficheur de table. *Un caviardage qui vit dans trois copies est un
 * caviardage qui sera oublié dans la quatrième.* On filtre **à la source**,
 * avant l'émission : une jauge secrète ne quitte pas la machine du meneur.
 */
export function jaugesVuesParLesJoueurs<T extends { vueParLesJoueurs?: boolean }>(
    tensions: T[] | undefined,
): T[] {
    return (tensions ?? []).filter((jauge) => jauge.vueParLesJoueurs ?? true);
}

/**
 * Représente une date précise dans un calendrier fantastique.
 */
export interface FantasyDate {
    year: number;
    monthIndex: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    /** Nom du jour calculé selon le calendrier actif */
    dayOfWeek?: string;
    /**
     * **La fête qui tombe ce jour-là**, si le calendrier en déclare une.
     *
     * *Demandé par David le 2026-09-15.* Elle **ne remplace pas la date**, elle
     * la qualifie : « 13 Hammer — Nuits du Marteau (2/4) ». *Sans le numéro,
     * le meneur qui compte « nous partons dans trois jours » perd son repère
     * au milieu de sa propre fête.*
     */
    fete?: { nom: string; description?: string; rang: number; sur: number };
}

/**
 * Interface d'état globale pour le Clock-OS.
 * Gère le temps réel, les minuteurs et les calendriers narratifs.
 */
interface ClockState {
    // Time State
    /** Mode actuel de l'horloge */
    mode: ClockMode;
    /** Thème visuel actif */
    theme: ClockTheme;
    /** Point actuel dans le temps (Millisecondes UNIX ou relatives) */
    timestamp: number; 

    // Timer State
    /** Durée totale configurée pour le minuteur (secondes) */
    timerDuration: number; 
    /** Temps restant avant la fin (secondes) */
    timerRemaining: number; 
    /** Indique si le minuteur est actif */
    timerIsRunning: boolean;
    /** Label affiché sur le minuteur */
    timerLabel: string; 


    // Fantasy Calendar State
    /** ID du calendrier narratif sélectionné */
    activeCalendarId: string | null;
    /** Dictionnaire des calendriers chargés */
    calendars: Record<string, FantasyCalendar>;
    /** Liste des IDs de calendriers disponibles sur le système */
    availableCalendars: string[];

    // Tension Clocks
    /** Liste des jauges de tension actives */
    tensions: TensionClock[];

    // Projection State
    /** Indique si l'horloge/minuteur est projeté sur le Player Hub */
    isClockProjected: boolean;
    /**
     * **La cloche sonne-t-elle quand le minuteur atteint zéro ?**
     *
     * *Point C3 du § 12d, tranché par David le 2026-09-05.* `ChimeEngine` —
     * cinq harmoniques, quatre secondes de décroissance — était **entièrement
     * écrit et n'avait aucun appelant** : aucune sonnerie n'existait nulle part
     * dans l'application. La fin d'un minuteur est le moment qui la mérite le
     * plus, et le moteur était déjà là.
     *
     * Allumée par défaut, parce que c'est la fonction qu'on livre. *Mais une
     * sonnerie qu'on ne peut pas couper devient insupportable en trois
     * séances* — d'où l'interrupteur, demandé avec.
     */
    sonnerieDuMinuteur: boolean;

    // Actions
    setMode: (mode: ClockMode) => void;
    setTheme: (theme: ClockTheme) => void;
    /** Définit manuellement le timestamp actuel */
    setTimestamp: (timestamp: number) => void;
    /** Avance ou recule le temps de X secondes */
    addTime: (seconds: number) => void;
    /** Configure la vitesse de défilement du temps */

    // Timer Actions
    /** Configure une durée de minuteur */
    setTimer: (seconds: number) => void;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    setTimerLabel: (label: string) => void;
    /** Décrémente le minuteur (appelé chaque seconde) */
    tickTimer: () => void;


    // Tension Actions
    /**
     * Ajoute une nouvelle jauge de tension.
     *
     * ⚠️ **`sens` décide aussi d'où elle part** : un consommable naît **plein**
     * — on ne commence pas une expédition sans vivres. Sans ça, créer
     * « Rations » puis penser au chevron était un geste en deux temps dont le
     * second s'oublie.
     */
    addTensionClock: (
        name: string, totalSegments: number, forme?: FormeDeJauge, sens?: SensDeLaJauge,
    ) => void;
    /** Retourne le sens d'une jauge — elle monte, ou elle se vide. */
    changerLeSensDeLaJauge: (id: string, sens: SensDeLaJauge) => void;
    /** Ce qu'une fin de scène coûte à cette jauge. `0` ou `null` la détache. */
    reglerLePasParScene: (id: string, pas: number | null) => void;
    /**
     * **Une scène vient de se terminer.**
     *
     * Appelée par `trameSlice.terminerLaScene` — *le seul endroit qui sache
     * qu'une scène s'achève*, et qui le sait depuis le 2026-08-17. Rend ce qui a
     * bougé, pour que l'écran puisse l'annoncer : un magasin qui applique en
     * silence prive le meneur de la seule chose qui l'intéresse.
     */
    laSceneSeTermine: () => UsureDUneJauge[];
    /** Change la forme sous laquelle une jauge se dessine. */
    changerLaFormeDeLaJauge: (id: string, forme: FormeDeJauge) => void;
    /**
     * Change la couleur d'une jauge.
     *
     * **Le champ `color` existait depuis toujours et rien ne le renseignait** —
     * relevé le 2026-08-31 : aucune interface ne le posait, et aucun rendu ne le
     * lisait. L'afficheur Ulanzi le lit désormais, jauge par jauge, ce qui lui
     * donne enfin un usage. `null` l'efface.
     */
    changerLaCouleurDeLaJauge: (id: string, couleur: string | null) => void;
    /** Supprime une jauge */
    removeTensionClock: (id: string) => void;
    /** Ajoute ou retire des segments à une jauge */
    updateTensionSegments: (id: string, delta: number) => void;
    /** Remet une jauge à zéro */
    resetTensionClock: (id: string) => void;
    /**
     * **Remplit une jauge d'un coup.**
     *
     * *Demandé le 2026-08-31 :* un instrument qui **se vide** — le
     * Voight-Kampff — part de son maximum. Sans ce geste il fallait six clics
     * sur `+1` avant de pouvoir commencer à le descendre.
     */
    remplirLaJauge: (id: string) => void;
    /** Cette jauge part-elle sur l'afficheur de table ? */
    basculerSurLAfficheur: (id: string) => void;
    /** Ouvre ou referme une jauge aux joueurs. */
    basculerLaVueDesJoueurs: (id: string) => void;

    // Calendar Actions
    /** Charge les données d'un calendrier en mémoire */
    loadCalendar: (calendar: FantasyCalendar) => void;
    setActiveCalendar: (id: string | null) => void;
    /** Récupère la liste des fichiers de calendrier via le Bridge */
    fetchCalendars: () => Promise<void>;
    /** Charge et active un calendrier spécifique */
    selectCalendar: (id: string) => Promise<void>;
    /** Calcule la date fantastique actuelle selon le timestamp et le calendrier actif */
    getFantasyDate: () => FantasyDate | null;
    /** Définit la date fantastique (répercute sur le timestamp) */
    setFantasyDate: (date: Partial<FantasyDate>) => void;

    // Projection Actions
    /** Active/Désactive la projection sur le moniteur externe */
    setIsClockProjected: (projected: boolean) => void;
    /** Allume ou éteint la cloche de fin de minuteur. */
    basculerLaSonnerie: () => void;
}

/**
 * **Le journal apprend qu'une fête commence.**
 *
 * *Demandé par David le 2026-09-15, avec les jours de fête.* Une fête qu'on
 * déclare et qui ne se signale jamais n'est qu'une étiquette — *c'est le motif
 * que ce dépôt a déjà payé quatre fois : la chaîne complète sans bouton au
 * bout.*
 *
 * ⚠️ **On compare le NOM, pas la mention.** Une fête de quatre jours voit sa
 * mention passer de « (1/4) » à « (4/4) » : comparer la mention écrirait quatre
 * entrées pour une seule fête. *Entrer dans une fête est un événement ; y rester
 * n'en est pas un.*
 *
 * ⚠️ **Et seulement depuis les gestes du meneur** — `setTimestamp`, `addTime`,
 * `setFantasyDate`. La synchronisation entre fenêtres écrit par `setState` et ne
 * passe donc pas par ici : *le hub ne doit pas consigner ce que le meneur a déjà
 * consigné.*
 */
function annoncerLaFete(
    nomAvant: string | undefined,
    lireLaDate: () => FantasyDate | null,
): void {
    const fete = lireLaDate()?.fete;
    if (!fete || fete.nom === nomAvant) return;

    const journal = (window as unknown as {
        useJournalStore?: { getState: () => {
            isRecording?: boolean;
            addEvent?: (e: { type: string; title: string; content: string }) => void;
        } };
    }).useJournalStore?.getState();

    if (!journal?.isRecording || !journal.addEvent) return;

    journal.addEvent({
        type: 'SYSTEM',
        title: `Fête : ${fete.nom}`,
        content: [
            mentionDeLaFete(fete) ?? fete.nom,
            ...(fete.description ? [fete.description] : []),
        ].join('\n'),
    });
}

export const useClockStore = create<ClockState>()(
    persist(
        (set, get) => ({
            mode: 'realtime',
            theme: 'modern',

            timestamp: Date.now(),

            timerDuration: 0,
            timerRemaining: 0,
            timerIsRunning: false,
            timerLabel: '',


            activeCalendarId: null,
            calendars: {},
            availableCalendars: [],

            tensions: [],
            isClockProjected: true,
            sonnerieDuMinuteur: true,

            setMode: (mode) => set({ mode }),
            setTheme: (theme) => set({ theme }),
            /*
              **Le magasin refuse un horodatage qui n'en est pas un.**

              *Signalé par David le 2026-08-31, à l'écran* : vider le champ de
              date faisait tomber tout le tableau de bord sur
              `RangeError: Invalid time value`.

              Le chemin tenait en trois pas. `new Date('')` sur un champ vidé
              rend une date invalide, `getTime()` rend `NaN`, et ce `NaN`
              entrait ici **sans que rien ne le regarde**. Au rendu suivant,
              `toISOString()` — qui *lève* au lieu de rendre une chaîne, là où
              `toTimeString()` se contente d'un « Invalid Date » — emportait le
              composant entier.

              **Le contrôle est ici et pas à l'affichage**, parce que ce magasin
              a d'autres écrivains que ce champ : la synchro entre fenêtres, un
              import Nexus, la date fantastique. *Une valeur fausse gardée en
              mémoire finit toujours par ressortir par une porte qu'on n'a pas
              gardée* — et celle-ci ressort jusque sur l'afficheur Ulanzi, dont
              le widget « heure du monde » lit ce champ. Un `NaN` y écrirait
              `NaN:NaN` en pleine séance, et *un widget qui ment est pire qu'un
              widget absent.*

              On garde la valeur précédente plutôt que de retomber sur l'heure
              courante : refuser une saisie ne doit pas déplacer une horloge que
              le meneur avait posée.
            */
            setTimestamp: (timestamp) => {
                const avant = get().getFantasyDate()?.fete?.nom;
                set((state) => (horodatageValide(timestamp) ? { timestamp } : state));
                annoncerLaFete(avant, get().getFantasyDate);
            },

            addTime: (seconds) => {
                const avant = get().getFantasyDate()?.fete?.nom;

                set((state) => {
                /*
                  **On répare l'horloge au lieu de rester bloqué dessus.**

                  Le contrôle de `setTimestamp` ne couvre pas tout : la synchro
                  entre fenêtres écrit par `setState` et le contourne donc. Si
                  une valeur fausse entre par là, refuser tous les décalages
                  laisserait l'horloge morte jusqu'au prochain démarrage — *un
                  garde qui ne fait que refuser transforme une donnée fausse en
                  panne définitive.* Un décalage repart donc de l'heure courante
                  quand il n'y a rien de valable à décaler.
                */
                const base = horodatageValide(state.timestamp) ? state.timestamp : Date.now();
                const suivant = base + (seconds * 1000);
                    return horodatageValide(suivant) ? { timestamp: suivant } : state;
                });

                annoncerLaFete(avant, get().getFantasyDate);
            },

            setTimer: (seconds) => set({
                timerDuration: seconds,
                timerRemaining: seconds,
                timerIsRunning: false
            }),

            startTimer: () => set({ timerIsRunning: true }),
            pauseTimer: () => set({ timerIsRunning: false }),
            resetTimer: () => set((state) => ({
                timerRemaining: state.timerDuration,
                timerIsRunning: false
            })),

            setTimerLabel: (timerLabel) => set({ timerLabel }),


            tickTimer: () => set((state) => {
                if (!state.timerIsRunning || state.timerRemaining <= 0) return {};
                const newRemaining = Math.max(0, state.timerRemaining - 1);
                return { timerRemaining: newRemaining, timerIsRunning: newRemaining > 0 };
            }),

            addTensionClock: (name, totalSegments, forme, sens) => set((state) => ({
                tensions: [
                    ...state.tensions,
                    {
                        id: crypto.randomUUID(),
                        name,
                        totalSegments,
                        sens,
                        /*
                          **Un consommable naît plein.** `departDeLaJauge` tient
                          la règle, plutôt qu'un ternaire ici : elle sert aussi
                          au changement de sens, et deux écritures de la même
                          décision finissent toujours par diverger.
                        */
                        filledSegments: departDeLaJauge(
                            sens ?? 'remplissage', totalSegments),
                        forme,
                        /*
                          **Une jauge naît secrète.** Écrit explicitement, et non
                          laissé absent : l'absence veut dire « d'avant ce champ »,
                          donc « visible ». *Ouvrir est un geste, refermer est un
                          regret* — une jauge qu'on vient de créer porte souvent un
                          nom qui en dit trop.
                        */
                        vueParLesJoueurs: false,
                    }
                ]
            })),

            remplirLaJauge: (id) => set((state) => ({
                tensions: state.tensions.map((c) =>
                    (c.id === id ? { ...c, filledSegments: c.totalSegments } : c)),
            })),

            basculerSurLAfficheur: (id) => set((state) => ({
                // `?? true` : une jauge sans le drapeau part sur l'afficheur,
                // donc le premier clic l'en retire — jamais l'inverse.
                tensions: state.tensions.map((c) =>
                    (c.id === id ? { ...c, surLAfficheur: !(c.surLAfficheur ?? true) } : c)),
            })),

            basculerLaVueDesJoueurs: (id) => set((state) => ({
                // `?? true` : une jauge d'avant ce champ est vue, donc le
                // premier clic la referme. Une jauge neuve porte `false` et
                // s'ouvre au premier clic — les deux sens marchent.
                tensions: state.tensions.map((c) =>
                    (c.id === id ? { ...c, vueParLesJoueurs: !(c.vueParLesJoueurs ?? true) } : c)),
            })),

            changerLaCouleurDeLaJauge: (id, couleur) => set((state) => ({
                // `undefined` plutôt que `null` : une jauge sans couleur choisie
                // doit reprendre celle de son widget, pas en figer une.
                tensions: state.tensions.map((c) =>
                    (c.id === id ? { ...c, color: couleur || undefined } : c)),
            })),

            changerLaFormeDeLaJauge: (id, forme) => set((state) => ({
                tensions: state.tensions.map((c) => (c.id === id ? { ...c, forme } : c))
            })),

            /*
              **Retourner une jauge replace son compte — mais seulement si
              personne n'y a touché.** On pose « Alerte » à zéro, on se dit que
              c'était « Rations » : sans ça, les vivres seraient vides et
              hurlants dès la première seconde. Dès que le meneur a compté
              quelque chose, on garde son compte. *Deviner est bienvenu tant
              qu'il n'y a rien à perdre.*
            */
            changerLeSensDeLaJauge: (id, sens) => set((state) => ({
                tensions: state.tensions.map((c) => (c.id === id
                    ? { ...c, sens, filledSegments: apresChangementDeSens(c, sens) }
                    : c)),
            })),

            /*
              `null` ou zéro détache la jauge des fins de scène — et on écrit
              `undefined`, pas `0` : c'est la même distinction que pour la
              couleur, l'absence veut dire « rien de déclaré » et se relit comme
              telle dans le panneau.
            */
            reglerLePasParScene: (id, pas) => set((state) => ({
                tensions: state.tensions.map((c) => (c.id === id
                    ? {
                        ...c,
                        pasParScene: (pas && Number.isFinite(pas) && pas > 0)
                            ? Math.floor(pas)
                            : undefined,
                    }
                    : c)),
            })),

            /*
              **L'usure de fin de scène.**

              ⚠️ **On n'écrit rien quand rien ne bouge**, et c'est le cas
              courant : la plupart des tables ne déclareront aucun pas. Un `set`
              inutile ferait repeindre les quatre écrans et repartir une
              diffusion réseau à chaque scène fermée — `appliquerLUsure` rend la
              liste d'origine par référence, mais la garde explicite ici évite
              même de passer par `set`.
            */
            laSceneSeTermine: () => {
                const usures = usureDeLaScene(get().tensions);
                if (usures.length === 0) return usures;

                set((state) => ({ tensions: appliquerLUsure(state.tensions, usures) }));
                return usures;
            },

            removeTensionClock: (id) => set((state) => ({
                tensions: state.tensions.filter((c) => c.id !== id)
            })),

            updateTensionSegments: (id, delta) => set((state) => ({
                tensions: state.tensions.map((c) =>
                    c.id === id
                        ? { ...c, filledSegments: Math.min(c.totalSegments, Math.max(0, c.filledSegments + delta)) }
                        : c
                )
            })),

            resetTensionClock: (id) => set((state) => ({
                tensions: state.tensions.map((c) =>
                    c.id === id ? { ...c, filledSegments: 0 } : c
                )
            })),

            loadCalendar: (calendar) => set((state) => ({
                calendars: { ...state.calendars, [calendar.id]: calendar }
            })),

            setActiveCalendar: (id) => set({ activeCalendarId: id }),

            fetchCalendars: async () => {
                const bridge = (window as unknown as { appBridge?: { clock?: { listCalendars: () => Promise<string[]> } } }).appBridge?.clock;
                if (!bridge) return;
                try {
                    const catalogs = await bridge.listCalendars();
                    set({ availableCalendars: catalogs });
                } catch (err) {
                    console.error("Failed to fetch calendars:", err);
                }
            },

            selectCalendar: async (id) => {
                const bridge = (window as unknown as { appBridge?: { clock?: { loadCalendar: (id: string) => Promise<FantasyCalendar> } } }).appBridge?.clock;
                if (!bridge) return;
                try {
                    const calendar = await bridge.loadCalendar(id);
                    if (calendar) {
                        if (!calendar.id) calendar.id = id;

                        /*
                          ⛔ **Choisir un calendrier pose enfin sa date de départ.**

                          `currentYear` et ses cinq compagnons étaient écrits dans
                          le seul calendrier qui existe — Harptos déclare
                          `1492` — et **lus par personne**. Mesuré le 2026-09-15 :
                          le choisir affichait **l'an 56**, parce que la date
                          venait de l'horloge système. *Un champ renseigné que
                          rien ne lit est un mensonge patient : il a l'air d'une
                          fonctionnalité.*

                          ⚠️ **Seulement si le calendrier le dit**, et seulement
                          au moment où on le choisit : reposer la date à chaque
                          relecture écraserait le temps que la campagne a vécu.
                        */
                        const depart = dateDeDepart(calendar as CalendrierDatable);

                        set((state) => ({
                            calendars: { ...state.calendars, [calendar.id]: calendar },
                            activeCalendarId: calendar.id,
                            ...(depart !== null && horodatageValide(depart)
                                ? { timestamp: depart }
                                : {}),
                        }));
                    }
                } catch (err) {
                    console.error("Failed to load calendar:", id, err);
                }
            },

            setIsClockProjected: (isClockProjected) => set({ isClockProjected }),

            basculerLaSonnerie: () => set((etat) => ({ sonnerieDuMinuteur: !etat.sonnerieDuMinuteur })),

            getFantasyDate: () => {
                const { timestamp, activeCalendarId, calendars } = get();
                if (!activeCalendarId || !calendars[activeCalendarId]) return null;

                const cal = calendars[activeCalendarId] as CalendrierDatable;

                /*
                  ⛔⛔ **LA GARDE QUI EMPÊCHE LE GEL.**

                  La boucle ci-dessous avance d'année en année **par
                  soustraction**. Si une année dure zéro seconde — un calendrier
                  **sans mois**, ou `hoursPerDay: 0` — la condition reste vraie,
                  la soustraction ne retire rien, et **la boucle ne s'arrête
                  jamais**. Mesuré le 2026-09-15 : cinquante millions de tours
                  sans sortir. *Ce n'est pas une date fausse, c'est
                  l'application figée, sans message et sans trace.*

                  ⚠️ **La garde est ici et pas seulement dans l'Atelier** : les
                  calendriers arrivent aussi par un fichier JSON posé à la main
                  dans `databases/calendars/`, et c'est même le seul chemin qui
                  ait jamais existé. *Une garde qui ne tient que dans l'écran
                  laisse entrer tout ce qui ne passe pas par l'écran.*

                  On rend `null`, ce que tous les appelants savent déjà lire :
                  le pupitre n'affiche pas de date fantastique, et c'est
                  infiniment préférable à un cockpit qui ne répond plus.
                */
                if (leCalendrierEstFautif(cal)) {
                    console.warn(
                        `[Clock-OS] Calendrier « ${cal.name ?? activeCalendarId} » inutilisable — `
                        + 'aucune date fantastique ne sera calculée.',
                    );
                    return null;
                }

                const secondsPerMin = cal.minutesPerHour || 60;
                const secondsPerHour = secondsPerMin * 60;
                const secondsPerDay = secondesParJour(cal);

                let totalSeconds = Math.floor(timestamp / 1000);

                /* La règle bissextile vivait ici, écrite à la main — `year % 4 === 0`,
                   recopiée à cinq endroits. Aucun calendrier ne pouvait alors
                   déclarer la sienne ; Harptos tombait juste par chance. */
                const getDaysInYear = (year: number) => joursDeLAnnee(cal, year);

                let year = 0;
                let daysInYear = getDaysInYear(year);
                while (totalSeconds >= daysInYear * secondsPerDay) {
                    totalSeconds -= daysInYear * secondsPerDay;
                    year++;
                    daysInYear = getDaysInYear(year);
                }

                while (totalSeconds < 0) {
                    year--;
                    daysInYear = getDaysInYear(year);
                    totalSeconds += daysInYear * secondsPerDay;
                }

                const isLeap = estBissextile(cal, year);
                let monthIndex = 0;
                let day = 1;

                for (let i = 0; i < cal.months.length; i++) {
                    const m = cal.months[i];
                    if (m.leapYearOnly && !isLeap) continue;

                    const monthSeconds = m.days * secondsPerDay;
                    if (totalSeconds < monthSeconds) {
                        monthIndex = i;
                        day = Math.floor(totalSeconds / secondsPerDay) + 1;
                        totalSeconds %= secondsPerDay;
                        break;
                    }
                    totalSeconds -= monthSeconds;
                }

                const hour = Math.floor(totalSeconds / secondsPerHour);
                totalSeconds %= secondsPerHour;
                const minute = Math.floor(totalSeconds / secondsPerMin);
                const second = totalSeconds % secondsPerMin;

                /*
                  ⛔ **Le jour de la semaine comptait les jours HORS CALENDRIER.**

                  Il valait `⌊timestamp / jour⌋ % semaine` — tous les jours
                  écoulés, fêtes intercalaires comprises. Or à Harptos les six
                  fêtes sont **hors semaine** : elles la décalaient de six jours
                  par an. *Corrigé le 2026-09-15, à la demande de David — et le
                  jour affiché pour une date donnée change, parce qu'il était
                  faux.*

                  ⚠️ **Un jour hors calendrier n'a AUCUN jour de semaine**, et
                  `jourDeLaSemaine` rend alors `undefined` : l'écran omet la
                  mention au lieu d'en inventer une. *Demander quel jour de la
                  semaine tombe le Milieu d'Hiver n'a pas plus de sens que de
                  demander sa position dans un mois.*
                */
                const dayOfWeek = jourDeLaSemaine(cal, { year, monthIndex, day });

                /* La fête qualifie la date, elle ne la remplace pas. */
                const fete = feteDuJour(cal, monthIndex, day) ?? undefined;

                return { year, monthIndex, day, hour, minute, second, dayOfWeek, fete };
            },

            /*
              **La saisie manuelle et la date de départ passent par le MÊME
              calcul.** Cette fonction portait sa propre arithmétique — la
              somme des années, le saut des mois bissextiles, le `% 4` écrit une
              fois de plus. *Deux inverses de la même fonction finissent toujours
              par ne plus tomber sur le même jour.*

              Un calendrier mal formé produirait un `NaN` par cette porte-ci :
              `horodatageDeLaDate` refuse d'abord, `horodatageValide` ensuite.
            */
            setFantasyDate: (updates) => {
                const current = get().getFantasyDate();
                if (!current) return;

                const cal = get().calendars[get().activeCalendarId!] as CalendrierDatable;
                const quand = horodatageDeLaDate(cal, { ...current, ...updates });

                if (quand !== null && horodatageValide(quand)) {
                    set({ timestamp: quand });
                    annoncerLaFete(current.fete?.nom, get().getFantasyDate);
                }
            }
        }),
        {
            name: 'gm-os-clock-storage',
            /*
              **Seule la fenêtre MJ écrit ce store.**

              Le hub reçoit l'horloge par `useHubSync` **et** par le relais, et
              les deux l'appliquent en `setState`.
              Or le hub et le projecteur tournent sur la **même origine** que le
              MJ (`electron/main.ts` ne change que la chaîne de requête), donc
              dans le **même `localStorage`**, sous cette même clé. Un `setState`
              sur un store persisté écrit : la fenêtre secondaire réécrivait le
              magasin du MJ avec **sa** vue, qui est partielle — ce qu'elle n'a
              jamais reçu repart tel qu'elle l'avait à SON démarrage.

              **Rien n'est perdu pour autant, et c'est ce qui rend la garde sûre
              ici** : la synchronisation entre fenêtres est
              **bidirectionnelle** (`CrossWindowEventService.init` — *« everyone
              subscribes to their local store to broadcast changes »*). Ce que la
              fenêtre secondaire change part au MJ, qui l'applique
              (`applyRemoteUpdate`) puis rediffuse la version qui fait autorité.
              **C'est donc le MJ qui écrit sur le disque, et lui seul** ;
              l'écriture du hub n'était qu'un doublon — un doublon partiel, donc
              destructeur.

              Même garde que `PersistenceService` depuis la perte des campagnes
              du 2026-08-07, et que `useCombatStore` depuis le 2026-08-24.
              Détail et liste complète : `utils/ecritureReserveeAuMJ.ts`.
            */
            storage: stockageLocalDuMJ(),
            partialize: (state) => ({
                mode: state.mode,
                theme: state.theme,
                timestamp: state.timestamp,
                tensions: state.tensions,
                timerLabel: state.timerLabel,
                timerRemaining: state.timerRemaining,
                timerDuration: state.timerDuration,
                timerIsRunning: state.timerIsRunning,
                activeCalendarId: state.activeCalendarId,
                calendars: state.calendars,
                availableCalendars: state.availableCalendars,
                isClockProjected: state.isClockProjected,
                sonnerieDuMinuteur: state.sonnerieDuMinuteur
            }),
            /*
              **Un horodatage déjà corrompu ne doit pas revenir au démarrage.**

              Le correctif des écritures ne suffit pas : au moment où il est
              posé, la mauvaise valeur est **déjà sur le disque**. Sans ce
              rattrapage, l'écran resterait cassé après la correction et on
              chercherait le défaut dans le code neuf.

              *Corriger l'écriture ne répare pas ce qui est déjà écrit* — c'est
              la leçon de la routine de l'afficheur Ulanzi, qui restait
              irrécupérable par l'application elle-même tant qu'on ne rattrapait
              pas au lancement.

              Ici, et contrairement aux écritures, on retombe sur l'heure
              courante : au démarrage il n'y a pas de « valeur précédente » à
              garder, et une horloge à 1970 n'est pas plus juste qu'une horloge
              à maintenant — elle est seulement plus surprenante.
            */
            onRehydrateStorage: () => (etat) => {
                if (etat && !horodatageValide(etat.timestamp)) {
                    console.warn(
                        `[Clock-OS] Horodatage persisté inutilisable (${String(etat.timestamp)}) — `
                        + "remis à l’heure courante.",
                    );
                    etat.timestamp = Date.now();
                }
            },
        }
    )
);

if (typeof window !== 'undefined') {
    (window as any).useClockStore = useClockStore;
}
