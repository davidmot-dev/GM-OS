import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RemoteStatusBar from './RemoteStatusBar';

/**
 * **La ligne d'état dit ce qui est vrai, et l'arrêt général ne part pas seul.**
 *
 * Écrite le 2026-09-05 en remplacement d'un en-tête de 104 px qui affichait un
 * titre qu'on connaît. Deux règles s'y jouent : *une chose absente disparaît au
 * lieu de laisser « — »* — un bandeau plein de tirets apprend au regard à ne
 * plus s'y arrêter —, et **l'arrêt général se tient enfoncé**, parce qu'un
 * bouton « tout couper » à portée de pouce sur une tablette posée entre deux dés
 * se déclencherait tout seul.
 */

const COMBAT_VIDE = { combatants: [], currentTurnIdx: 0, round: 1 };

const poser = (props: Partial<React.ComponentProps<typeof RemoteStatusBar>> = {}) =>
    render(
        <RemoteStatusBar
            status="connected"
            isPaired
            combat={COMBAT_VIDE}
            onStopAll={vi.fn()}
            {...props}
        />,
    );

describe('ce qui joue', () => {
    it('nomme le morceau en cours', () => {
        poser({ lecture: { musique: 'Marche funèbre', ambiance: null, pistesDAmbiance: 0 } });
        expect(screen.getByText('Marche funèbre')).toBeTruthy();
    });

    it('nomme le thème d’ambiance quand il y en a un', () => {
        poser({ lecture: { musique: null, ambiance: 'Taverne', pistesDAmbiance: 3 } });
        expect(screen.getByText('Taverne')).toBeTruthy();
    });

    it('compte les pistes quand l’ambiance a été composée à la main', () => {
        /* Dire « 3 pistes » reste vrai là où un nom serait inventé. */
        poser({ lecture: { musique: null, ambiance: null, pistesDAmbiance: 3 } });
        expect(screen.getByText('3 pistes')).toBeTruthy();
    });

    it('n’affiche rien quand rien ne joue — pas de tirets', () => {
        const { container } = poser({ lecture: { musique: null, ambiance: null, pistesDAmbiance: 0 } });
        expect(container.textContent).not.toContain('—');
    });
});

describe('le combat et le minuteur', () => {
    it('donne le round et le combattant dont c’est le tour', () => {
        poser({ combat: { combatants: [{ name: 'Gobelin' }, { name: 'Alia' }], currentTurnIdx: 1, round: 4 } });

        expect(screen.getByText(/R4/)).toBeTruthy();
        expect(screen.getByText(/Alia/)).toBeTruthy();
    });

    it('ne montre pas le combat quand il n’y a personne dessus', () => {
        poser({ combat: COMBAT_VIDE });
        expect(screen.queryByText(/R1/)).toBeNull();
    });

    it('affiche le minuteur en marche, en minutes', () => {
        poser({ minuteur: { timerRemaining: 95, timerIsRunning: true } });
        expect(screen.getByText('1:35')).toBeTruthy();
    });

    it('ignore un minuteur à l’arrêt — un compte à rebours figé est pire qu’aucun', () => {
        poser({ minuteur: { timerRemaining: 95, timerIsRunning: false } });
        expect(screen.queryByText('1:35')).toBeNull();
    });
});

describe('l’état de liaison', () => {
    it('le dit quand la liaison est tombée', () => {
        poser({ status: 'error' });
        expect(screen.getByText(/Reconnexion/)).toBeTruthy();
    });

    it('le dit quand la tablette n’est pas appairée', () => {
        poser({ isPaired: false });
        expect(screen.getByText(/Non appairée/)).toBeTruthy();
    });

    it('ne dit rien quand tout va bien', () => {
        const { container } = poser();
        expect(container.textContent).not.toContain('Reconnexion');
        expect(container.textContent).not.toContain('Non appairée');
    });
});

describe('l’arrêt général se tient enfoncé', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    /* `requestAnimationFrame` de jsdom n'avance pas avec les faux minuteurs :
       on le pilote nous-mêmes, et `performance.now` suit l'horloge simulée. */
    const avancer = (ms: number) => {
        act(() => { vi.advanceTimersByTime(ms); });
    };

    it('PART quand on tient 700 ms — sans quoi les deux cas suivants ne prouveraient rien', () => {
        /*
          *Une assertion qui ne peut pas échouer ne garde rien* : un bouton
          définitivement cassé satisferait les deux tests de non-déclenchement.
          C'est celui-ci qui leur donne leur sens.
        */
        const couper = vi.fn();
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number);
        vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));

        poser({ onStopAll: couper });
        fireEvent.pointerDown(screen.getByLabelText(/Tout couper/));
        avancer(800);

        expect(couper).toHaveBeenCalledTimes(1);
    });

    it('ne part pas sur un appui bref', () => {
        const couper = vi.fn();
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number);
        vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));

        poser({ onStopAll: couper });
        const bouton = screen.getByLabelText(/Tout couper/);

        fireEvent.pointerDown(bouton);
        avancer(200);
        fireEvent.pointerUp(bouton);
        avancer(1000);

        expect(couper).not.toHaveBeenCalled();
    });

    it('s’annule quand le doigt quitte le bouton', () => {
        const couper = vi.fn();
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number);
        vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));

        poser({ onStopAll: couper });
        const bouton = screen.getByLabelText(/Tout couper/);

        fireEvent.pointerDown(bouton);
        avancer(300);
        fireEvent.pointerLeave(bouton);
        avancer(2000);

        expect(couper).not.toHaveBeenCalled();
    });
});
