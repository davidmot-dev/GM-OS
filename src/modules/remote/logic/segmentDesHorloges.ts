import { jaugesVuesParLesJoueurs, type useClockStore } from '../../../store/useClockStore';

type Horloges = Pick<ReturnType<typeof useClockStore.getState>, 'timestamp' | 'mode' | 'isClockProjected' | 'theme' | 'tensions' | 'timerRemaining' | 'timerIsRunning' | 'timerLabel' | 'timerDuration'>;

/** T4/J1 : première connexion et changements doivent transmettre la même horloge. */
export const segmentDesHorloges = (s: Horloges) => ({
    timestamp: s.timestamp, mode: s.mode, isClockProjected: s.isClockProjected,
    theme: s.theme, tensions: jaugesVuesParLesJoueurs(s.tensions), timerRemaining: s.timerRemaining,
    timerIsRunning: s.timerIsRunning, timerLabel: s.timerLabel, timerDuration: s.timerDuration,
});
