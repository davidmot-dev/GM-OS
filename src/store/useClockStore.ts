import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ClockMode = 'realtime' | 'static' | 'timer' | 'fantasy';
export type ClockTheme = 'cyberpunk' | 'oldstyle' | 'modern';


export interface FantasyCalendar {
    id: string;
    name: string;
    description?: string;
    months: {
        name: string;
        days: number;
        displayName?: string;
        isIntercalary?: boolean;
        leapYearOnly?: boolean;
    }[];
    daysPerWeek: number;
    daysOfWeek?: string[];
    hoursPerDay: number;
    minutesPerHour: number;
}

export interface TensionClock {
    id: string;
    name: string;
    totalSegments: number;
    filledSegments: number;
    color?: string;
}

export interface FantasyDate {
    year: number;
    monthIndex: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    dayOfWeek?: string;
}

interface ClockState {
    // Time State
    mode: ClockMode;
    theme: ClockTheme;
    timestamp: number; // Current point in time (ms)
    timeMultiplier: number; // For fantasy time acceleration

    // Timer State
    timerDuration: number; // Total duration in seconds
    timerRemaining: number; // Remaining time in seconds
    timerIsRunning: boolean;
    timerLabel: string; // Label for the current timer


    // Fantasy Calendar State
    activeCalendarId: string | null;
    calendars: Record<string, FantasyCalendar>;
    availableCalendars: string[];

    // Tension Clocks
    tensions: TensionClock[];

    // Projection State
    isClockProjected: boolean;

    // Actions
    setMode: (mode: ClockMode) => void;
    setTheme: (theme: ClockTheme) => void;
    setTimestamp: (timestamp: number) => void;
    addTime: (seconds: number) => void;
    setTimeMultiplier: (multiplier: number) => void;

    // Timer Actions
    setTimer: (seconds: number) => void;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    setTimerLabel: (label: string) => void;
    tickTimer: () => void;


    // Tension Actions
    addTensionClock: (name: string, segments: number) => void;
    removeTensionClock: (id: string) => void;
    updateTensionSegments: (id: string, delta: number) => void;
    resetTensionClock: (id: string) => void;

    // Calendar Actions
    loadCalendar: (calendar: FantasyCalendar) => void;
    setActiveCalendar: (id: string | null) => void;
    fetchCalendars: () => Promise<void>;
    selectCalendar: (id: string) => Promise<void>;
    getFantasyDate: () => FantasyDate | null;
    setFantasyDate: (date: Partial<FantasyDate>) => void;

    // Projection Actions
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

            addTensionClock: (name, totalSegments) => set((state) => ({
                tensions: [
                    ...state.tensions,
                    {
                        id: crypto.randomUUID(),
                        name,
                        totalSegments,
                        filledSegments: 0
                    }
                ]
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
                // @ts-expect-error global
                const bridge = window.appBridge?.clock;
                if (!bridge) return;
                try {
                    const catalogs = await bridge.listCalendars();
                    set({ availableCalendars: catalogs });
                } catch (err) {
                    console.error("Failed to fetch calendars:", err);
                }
            },

            selectCalendar: async (id) => {
                // @ts-expect-error global
                const bridge = window.appBridge?.clock;
                if (!bridge) return;
                try {
                    const calendar = await bridge.loadCalendar(id);
                    if (calendar) {
                        // Ensure ID is set (from filename if missing in JSON)
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

                // For simplicity, we treat timestamp as "seconds since year 0" in fantasy context
                // But typically timestamp is ms. Let's convert to seconds.
                let totalSeconds = Math.floor(timestamp / 1000);

                const getDaysInYear = (year: number) => {
                    let total = 0;
                    const isLeap = year % 4 === 0; // Simplified leap year
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

                // Day of week calculation
                let dayOfWeek = undefined;
                if (cal.daysOfWeek && cal.daysOfWeek.length > 0) {
                    // Total days since beginning
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
                // Years
                for (let y = 0; y < next.year; y++) {
                    totalSeconds += getDaysInYear(y) * secondsPerDay;
                }
                // Months up to current
                const isLeap = next.year % 4 === 0;
                for (let i = 0; i < next.monthIndex; i++) {
                    const m = cal.months[i];
                    if (m.leapYearOnly && !isLeap) continue;
                    totalSeconds += m.days * secondsPerDay;
                }
                // Days, Hours, Mins, Secs
                totalSeconds += (next.day - 1) * secondsPerDay;
                totalSeconds += next.hour * secondsPerHour;
                totalSeconds += next.minute * secondsPerMin;
                totalSeconds += next.second;

                set({ timestamp: totalSeconds * 1000 });
            }
        }),
        {
            name: 'gm-os-clock-storage',
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
