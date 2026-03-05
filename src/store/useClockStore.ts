import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ClockMode = 'realtime' | 'static' | 'timer' | 'fantasy';
export type ClockTheme = 'cyberpunk' | 'oldstyle' | 'modern';


export interface FantasyCalendar {
    id: string;
    name: string;
    months: { name: string; days: number; displayName?: string }[];
    daysPerWeek: number;
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

    // Tension Clocks
    tensions: TensionClock[];

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
    setActiveCalendar: (id: string) => void;
}

export const useClockStore = create<ClockState>()(
    persist(
        (set) => ({
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

            tensions: [],

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

            setActiveCalendar: (id) => set({ activeCalendarId: id })
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
                calendars: state.calendars
            })
        }
    )
);
