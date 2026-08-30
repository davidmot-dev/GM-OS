import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import NarrativeClock from './components/NarrativeClock';
import type { TensionClock } from '../../store/useClockStore';

/**
 * **La promesse de la bascule : rien ne change pour les jauges existantes.**
 *
 * La forme a été ajoutée le 2026-08-30 comme un champ facultatif. Les jauges
 * d'avant ne le portent pas, et doivent continuer à s'afficher exactement comme
 * hier — *un choix ajouté ne redessine pas ce qui existait.* C'est aussi ce qui
 * dispense de toute migration, et les migrations sont l'endroit où les données
 * de ce projet sont déjà mortes deux fois.
 *
 * Le second test garde le fait que les quatre branches dessinent **vraiment**
 * quelque chose de différent : un `switch` dont un cas retomberait sur le
 * défaut rendrait quatre fois l'anneau, et tous les tests de géométrie
 * resteraient verts.
 */

const jauge = (extra: Partial<TensionClock> = {}): TensionClock => ({
    id: 'j-1',
    name: 'Alerte des gardes',
    totalSegments: 6,
    filledSegments: 3,
    ...extra,
});

const dessiner = (clock: TensionClock) =>
    render(<NarrativeClock clock={clock} theme="modern" size={100} />).container;

describe('une jauge créée avant le choix des formes', () => {
    it('se dessine encore en anneau', () => {
        expect(dessiner(jauge()).querySelector('svg')?.getAttribute('data-forme')).toBe('anneau');
    });

    /** L'anneau est fait d'arcs : s'il n'en reste aucun, ce n'est plus un anneau. */
    it('garde ses arcs, un par segment', () => {
        expect(dessiner(jauge()).querySelectorAll('path')).toHaveLength(6);
    });
});

describe('les quatre formes', () => {
    it('dessinent chacune quelque chose qui leur est propre', () => {
        // La barre est la seule à poser des rectangles.
        expect(dessiner(jauge({ forme: 'barre' })).querySelectorAll('rect')).toHaveLength(6);

        // Les points sont la seule forme faite uniquement de disques.
        expect(dessiner(jauge({ forme: 'points' })).querySelectorAll('circle')).toHaveLength(6);

        // Le cadran est la seule à porter une aiguille et des traits de repère.
        const cadran = dessiner(jauge({ forme: 'aiguille' }));
        expect(cadran.querySelectorAll('line').length).toBeGreaterThan(6);

        // L'anneau est la seule faite d'arcs.
        expect(dessiner(jauge({ forme: 'anneau' })).querySelectorAll('path')).toHaveLength(6);
    });

    it('annoncent la forme qu’elles portent', () => {
        for (const forme of ['anneau', 'barre', 'points', 'aiguille'] as const) {
            expect(dessiner(jauge({ forme })).querySelector('svg')?.getAttribute('data-forme')).toBe(forme);
        }
    });

    /**
     * **Une jauge pleine passe au rouge dans sa FORME**, pas seulement dans son
     * compte. C'est la tache de couleur que le meneur voit du coin de l'œil
     * pendant qu'il parle ; le compte, il faut le lire, et lire demande de
     * s'arrêter.
     *
     * Écrit d'abord sur tout le balisage, ce test passait par les deux chiffres
     * du milieu alors que les segments restaient bleus — *vert pour la mauvaise
     * raison.* Il ne regarde donc que les formes elles-mêmes.
     */
    it.each(['anneau', 'barre', 'points', 'aiguille'] as const)(
        'signalent le remplissage complet dans la forme, en %s',
        (forme) => {
            const conteneur = dessiner(jauge({ forme, filledSegments: 6 }));
            const formes = [...conteneur.querySelectorAll('path, rect, circle, line')];
            const rouges = formes.filter(f =>
                (f.getAttribute('fill') ?? '').includes('#ef4444')
                || (f.getAttribute('stroke') ?? '').includes('#ef4444'));

            expect(rouges.length, `aucune forme rouge en ${forme}`).toBeGreaterThan(0);
        },
    );
});
