import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HubCombatTracker } from './HubCombatTracker';

/**
 * Le Hub est l'écran partagé de la table : il ne montre pas les points de vie.
 *
 * Le compte exact des PV d'un adversaire renseigne les joueurs sur ce que le MJ
 * n'a pas choisi de leur dire. Une barre de vie en dit autant, en moins précis.
 *
 * Une fuite d'information de ce genre ne se voit pas en relisant le code — elle
 * se constate en partie, trop tard. D'où ce test.
 */

vi.mock('../ResolvedImage', () => ({
    ResolvedImage: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const combattant = (over: Record<string, unknown> = {}) => ({
    id: 'c1',
    name: 'Garde',
    avatar: null,
    hp: 7,
    hpMax: 42,
    isPlayer: false,
    statuses: [],
    ...over,
});

/** Rend le pisteur et renvoie tout son texte, espaces normalisés. */
function texteRendu(combatants: unknown[], currentTurnIdx = 0) {
    const { container } = render(
        <HubCombatTracker
            combatants={combatants as never}
            currentTurnIdx={currentTurnIdx}
            round={3}
        />,
    );
    return (container.textContent || '').replace(/\s+/g, ' ');
}

describe('HubCombatTracker — les points de vie ne sortent pas', () => {
    it('ne montre pas les PV du combattant actif', () => {
        const texte = texteRendu([combattant()]);

        expect(texte).not.toContain('HP');
        expect(texte).not.toContain('7');
        expect(texte).not.toContain('42');
    });

    it('ne montre pas les PV des combattants à venir', () => {
        const texte = texteRendu(
            [combattant(), combattant({ id: 'c2', name: 'Molosse', hp: 13, hpMax: 20 })],
            0,
        );

        expect(texte).not.toContain('HP');
        expect(texte).not.toContain('13');
    });

    it('ne rend aucune barre de vie', () => {
        const { container } = render(
            <HubCombatTracker
                combatants={[combattant(), combattant({ id: 'c2', name: 'Molosse' })] as never}
                currentTurnIdx={0}
                round={1}
            />,
        );

        // La barre était le seul élément dimensionné en pourcentage.
        expect(container.innerHTML).not.toMatch(/width:\s*\d+(\.\d+)?%/);
    });

    it('continue de montrer ce qui doit se voir : noms, round et tour', () => {
        const texte = texteRendu([combattant({ name: 'Garde' })]);

        expect(texte).toContain('Garde');
        expect(texte).toContain('Round 3');
        expect(screen.getByLabelText('Combat Tracker')).toBeTruthy();
    });

    it('garde les jauges des systèmes de santé alternatifs', () => {
        // Une horloge de progression est souvent publique à la table : elle
        // n'est pas un compte de PV et reste affichée.
        const texte = texteRendu([
            combattant({
                healthSystem: { type: 'clock', data: { segments: 2, maxSegments: 6 } },
            }),
        ]);

        expect(texte).toContain('Clock 2/6');
    });
});
