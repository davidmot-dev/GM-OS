import { describe, expect, it } from 'vitest';
import { useClockStore } from '../../../store/useClockStore';
import { segmentDesHorloges } from './segmentDesHorloges';

describe('la première connexion reçoit la même horloge que les changements', () => {
    it('porte le mode statique, son thème et la visibilité', () => {
        const segment = segmentDesHorloges({ ...useClockStore.getState(), mode: 'static', timestamp: 1234, theme: 'oldstyle', isClockProjected: false });
        expect(segment).toMatchObject({ mode: 'static', timestamp: 1234, theme: 'oldstyle', isClockProjected: false });
    });
    it('porte le libellé et la durée du minuteur', () => {
        expect(segmentDesHorloges({ ...useClockStore.getState(), mode: 'timer', timerLabel: 'Relais', timerDuration: 120, timerRemaining: 65, timerIsRunning: true }))
            .toMatchObject({ mode: 'timer', timerLabel: 'Relais', timerDuration: 120, timerRemaining: 65, timerIsRunning: true });
    });
    it('retire la jauge réservée au meneur', () => {
        const segment = segmentDesHorloges({ ...useClockStore.getState(), tensions: [
            { id: 'public', name: 'Public', totalSegments: 4, filledSegments: 1, vueParLesJoueurs: true },
            { id: 'secret', name: 'Secret', totalSegments: 4, filledSegments: 2, vueParLesJoueurs: false },
        ] });
        expect(segment.tensions.map(c => c.id)).toEqual(['public']);
    });
});
