import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { stockageLocalDuMJ } from '../utils/ecritureReserveeAuMJ';
import type { FormeDeJauge } from '../modules/clock/components/formesDeJauge';

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
    /** Multiplicateur pour l'accélération du temps fantastique */
    timeMultiplier: number; 

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

    // Actions
    setMode: (mode: ClockMode) => void;
    setTheme: (theme: ClockTheme) => void;
    /** Définit manuellement le timestamp actuel */
    setTimestamp: (timestamp: number) => void;
    /** Avance ou recule le temps de X secondes */
    addTime: (seconds: number) => void;
    /** Configure la vitesse de défilement du temps */
    setTimeMultiplier: (multiplier: number) => void;

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
    /** Ajoute une nouvelle jauge de tension */
    addTensionClock: (name: string, totalSegments: number, forme?: FormeDeJauge) => void;
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
}

export const useClockStore = create<ClockState>()(
    persist(
        (set, get) => ({
            mode: 'realtime',
            theme: 'modern',

            timestamp: Date.now(),
            timeMultiplier: 1,

            timerDuration: 0,
            timerRemaining: 0,
            timerIsRunning: false,
            timerLabel: '',


            activeCalendarId: null,
            calendars: {},
            availableCalendars: [],

            tensions: [],
            isClockProjected: true,

            setMode: (mode) => set({ mode }),
            setTheme: (theme) => set({ theme }),
            setTimestamp: (timestamp) => set({ timestamp }),

            addTime: (seconds) => set((state) => ({
                timestamp: state.timestamp + (seconds * 1000)
            })),

            setTimeMultiplier: (timeMultiplier) => set({ timeMultiplier }),

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

            addTensionClock: (name, totalSegments, forme) => set((state) => ({
                tensions: [
                    ...state.tensions,
                    {
                        id: crypto.randomUUID(),
                        name,
                        totalSegments,
                        filledSegments: 0,
                        forme
                    }
                ]
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
                        set((state) => ({
                            calendars: { ...state.calendars, [calendar.id]: calendar },
                            activeCalendarId: calendar.id
                        }));
                    }
                } catch (err) {
                    console.error("Failed to load calendar:", id, err);
                }
            },

            setIsClockProjected: (isClockProjected) => set({ isClockProjected }),

            getFantasyDate: () => {
                const { timestamp, activeCalendarId, calendars } = get();
                if (!activeCalendarId || !calendars[activeCalendarId]) return null;

                const cal = calendars[activeCalendarId];
                const secondsPerMin = cal.minutesPerHour || 60;
                const secondsPerHour = secondsPerMin * 60;
                const secondsPerDay = cal.hoursPerDay * secondsPerHour;

                let totalSeconds = Math.floor(timestamp / 1000);

                const getDaysInYear = (year: number) => {
                    let total = 0;
                    const isLeap = year % 4 === 0;
                    cal.months.forEach((m: { days: number; leapYearOnly?: boolean }) => {
                        if (m.leapYearOnly && !isLeap) return;
                        total += m.days;
                    });
                    return total;
                };

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

                const isLeap = year % 4 === 0;
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

                let dayOfWeek = undefined;
                if (cal.daysOfWeek && cal.daysOfWeek.length > 0) {
                    const totalDays = Math.floor(timestamp / (secondsPerDay * 1000));
                    dayOfWeek = cal.daysOfWeek[totalDays % cal.daysOfWeek.length];
                }

                return { year, monthIndex, day, hour, minute, second, dayOfWeek };
            },

            setFantasyDate: (updates) => {
                const current = get().getFantasyDate();
                if (!current) return;

                const next = { ...current, ...updates };
                const cal = get().calendars[get().activeCalendarId!];

                const secondsPerMin = cal.minutesPerHour || 60;
                const secondsPerHour = secondsPerMin * 60;
                const secondsPerDay = cal.hoursPerDay * secondsPerHour;

                const getDaysInYear = (year: number) => {
                    let total = 0;
                    const isLeap = year % 4 === 0;
                    cal.months.forEach((m: { days: number; leapYearOnly?: boolean }) => {
                        if (m.leapYearOnly && !isLeap) return;
                        total += m.days;
                    });
                    return total;
                };

                let totalSeconds = 0;
                for (let y = 0; y < next.year; y++) {
                    totalSeconds += getDaysInYear(y) * secondsPerDay;
                }
                const isLeap = next.year % 4 === 0;
                for (let i = 0; i < next.monthIndex; i++) {
                    const m = cal.months[i];
                    if (m.leapYearOnly && !isLeap) continue;
                    totalSeconds += m.days * secondsPerDay;
                }
                totalSeconds += (next.day - 1) * secondsPerDay;
                totalSeconds += next.hour * secondsPerHour;
                totalSeconds += next.minute * secondsPerMin;
                totalSeconds += next.second;

                set({ timestamp: totalSeconds * 1000 });
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
                isClockProjected: state.isClockProjected
            })
        }
    )
);

if (typeof window !== 'undefined') {
    (window as any).useClockStore = useClockStore;
}
