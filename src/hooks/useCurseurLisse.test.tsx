import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useCurseurLisse } from './useCurseurLisse';

/**
 * **Le contrat du curseur lisse : l'effet à chaque cran, le magasin une fois.**
 *
 * Il se garde par des tests parce qu'il est **invisible à l'écran quand il se
 * casse** : un curseur rebranché directement sur son magasin marche
 * parfaitement — il est seulement saccadé, et personne ne sait dire pourquoi.
 * C'est exactement ce que David a signalé le 2026-09-16 sur le crossfader.
 *
 * Ce qui est gardé ici, ce n'est pas la fluidité — elle ne se mesure pas dans
 * un test — mais **le nombre d'écritures** qui la détruisait.
 */

const Curseur: React.FC<{
    valeur: number;
    deposer: (v: number) => void;
    pendantLeGeste?: (v: number) => void;
}> = ({ valeur, deposer, pendantLeGeste }) => {
    const curseur = useCurseurLisse(valeur, deposer, pendantLeGeste);
    return (
        <input
            type="range"
            aria-label="curseur"
            min="0"
            max="1"
            step="0.001"
            value={curseur.position}
            onChange={(e) => curseur.tirer(parseFloat(e.target.value))}
            {...curseur.gestesDeRelachement}
        />
    );
};

const tirerJusqua = (...valeurs: number[]) => {
    const champ = screen.getByLabelText('curseur');
    for (const v of valeurs) fireEvent.change(champ, { target: { value: String(v) } });
    return champ;
};

describe('useCurseurLisse', () => {
    it("n'écrit PAS dans le magasin pendant le geste, mais mène l'effet à chaque cran", () => {
        const deposer = vi.fn();
        const pendantLeGeste = vi.fn();
        render(<Curseur valeur={0.5} deposer={deposer} pendantLeGeste={pendantLeGeste} />);

        tirerJusqua(0.6, 0.7, 0.8);

        expect(deposer).not.toHaveBeenCalled();
        expect(pendantLeGeste.mock.calls.map(([v]) => v)).toEqual([0.6, 0.7, 0.8]);
    });

    it('écrit une seule fois au relâchement, avec la dernière valeur', () => {
        const deposer = vi.fn();
        render(<Curseur valeur={0.5} deposer={deposer} />);

        fireEvent.pointerUp(tirerJusqua(0.6, 0.7, 0.8));

        expect(deposer).toHaveBeenCalledTimes(1);
        expect(deposer).toHaveBeenCalledWith(0.8);
    });

    it('affiche la position du geste tant qu\'on tient, sans attendre le magasin', () => {
        // Le magasin reste à 0,5 : c'est tout l'intérêt, et ce serait un curseur
        // qui ne bouge pas si la position n'était pas tenue localement.
        render(<Curseur valeur={0.5} deposer={vi.fn()} />);

        const champ = tirerJusqua(0.9) as HTMLInputElement;

        expect(champ.value).toBe('0.9');
    });

    it('rend la main à la valeur rangée une fois lâché', () => {
        // Le parent n'a pas bougé : après le dépôt, c'est bien lui qui décide.
        render(<Curseur valeur={0.5} deposer={vi.fn()} />);

        const champ = tirerJusqua(0.9) as HTMLInputElement;
        fireEvent.pointerUp(champ);

        expect(champ.value).toBe('0.5');
    });

    it.each(['pointerUp', 'pointerCancel', 'keyUp', 'blur'] as const)(
        'dépose la valeur sur %s — les quatre façons de lâcher un curseur',
        (geste) => {
            const deposer = vi.fn();
            render(<Curseur valeur={0.5} deposer={deposer} />);

            fireEvent[geste](tirerJusqua(0.42));

            expect(deposer).toHaveBeenCalledWith(0.42);
        }
    );

    it('ne dépose rien si personne n\'a touché au curseur', () => {
        const deposer = vi.fn();
        render(<Curseur valeur={0.5} deposer={deposer} />);

        fireEvent.pointerUp(screen.getByLabelText('curseur'));

        expect(deposer).not.toHaveBeenCalled();
    });

    it("dépose la valeur si l'écran se démonte au milieu du geste", () => {
        // Sans ça, la valeur ne vivrait plus que dans le moteur audio : ni
        // persistée, ni diffusée, et ressuscitée à l'ancienne au rechargement.
        const deposer = vi.fn();
        const { unmount } = render(<Curseur valeur={0.5} deposer={deposer} />);

        tirerJusqua(0.77);
        unmount();

        expect(deposer).toHaveBeenCalledWith(0.77);
    });

    it("ne repart pas à chaque rendu : une lambda neuve ne déclenche pas de dépôt", () => {
        // `deposer` est réécrit à chaque rendu par les appelants (lambda dans le
        // JSX). Si l'effet de démontage en dépendait, tout rendu pendant le
        // geste rangerait la valeur — soit exactement la rafale d'écritures
        // qu'on cherche à supprimer.
        const deposer = vi.fn();
        const { rerender } = render(<Curseur valeur={0.5} deposer={(v) => deposer(v)} />);

        tirerJusqua(0.6);
        rerender(<Curseur valeur={0.5} deposer={(v) => deposer(v)} />);
        rerender(<Curseur valeur={0.5} deposer={(v) => deposer(v)} />);

        expect(deposer).not.toHaveBeenCalled();
    });
});
