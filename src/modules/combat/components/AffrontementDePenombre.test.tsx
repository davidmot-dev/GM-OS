// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AffrontementDePenombre } from './AffrontementDePenombre';
import { useCombatStore } from '../useCombatStore';
import { CLE_AFFRONTEMENT_PENOMBRE } from '../logic/affrontementDePenombre';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { exemplairesDeLaCreature } from '../logic/invocationDeRencontre';

/**
 * **« Affronter » un adversaire de Pénombre** (registre § 267, T17, 22/11/2026) : Antrustion,
 * contre-accord de Mortencre (adversité 3, résilience 15, dissonance 1, p. 41), contre Lancine et Nimbé.
 */
const PILOTE = {
    combat: { defaultHealthType: 'hp', santeDeDepart: 'conscience_max',
        statsToTrack: [{ fieldId: 'conscience', label: 'Conscience / résilience', isMainHP: true, max: 'conscience_max' }] },
    jet: { penombre: {
        harmoniques: { ame: 'ame', esprit: 'esprit', etincelle: 'etincelle', nature: 'nature', nuit: 'nuit' },
        composanteHarmonique: 'harmonique', atouts: [],
        conscience: { restants: 'conscience', actifs: 'jetons_actifs', max: 'conscience_max' },
    } },
    bestiaire: {
        colonnes: [
            { id: 'adversite', libelle: 'Adversité', nature: 'nombre' },
            { id: 'resilience', libelle: 'Résilience', nature: 'nombre', champ: 'conscience_max' },
            { id: 'dissonance', libelle: 'Dissonance', nature: 'nombre' },
        ],
        creatures: [{ id: 'antrustion', nom: 'Antrustion, contre-accord de Mortencre', valeurs: { adversite: 3, resilience: 15, dissonance: 1 }, particularites: [
            'Lame colophane: 1 Éminence grise perd 3 jetons conscience',
            'Estoc et pizzicato: toutes perdent 1 jeton conscience et 1 succès sur leur prochaine action',
            "Touche d'ébène (dissonance): toutes perdent 2 jetons conscience",
        ] }],
    },
} as unknown as GameDriver;

beforeEach(() => useCombatStore.getState().reset());
afterEach(() => cleanup());

const poser = () => {
    const s = useCombatStore.getState();
    s.addCombatant({ name: 'Lancine', init: 0, hp: 7, hpMax: 7, isPlayer: true, faction: 'player', statuses: [],
        sheetData: { conscience: 7, jetons_actifs: 5, conscience_max: 7 } } as never);
    s.addCombatant({ name: 'Nimbé', init: 0, hp: 7, hpMax: 7, isPlayer: true, faction: 'player', statuses: [],
        sheetData: { conscience: 7, jetons_actifs: 7, conscience_max: 7 } } as never);
    s.addCombatant({ name: 'Antrustion', init: 0, hp: 15, hpMax: 15, isPlayer: false, faction: 'enemy', statuses: [],
        sheetData: { conscience_max: 15 }, origineDuLivre: { creatureId: 'antrustion' } } as never);
    const [lancine, nimbe, antrustion] = useCombatStore.getState().combatants as Combatant[];
    return { lancine, nimbe, antrustion };
};
const nomme = (nom: string) => useCombatStore.getState().combatants.find(c => c.name === nom)!;

describe('« Affronter » un adversaire de Pénombre (T17)', () => {
    it('dit l’adversité, la résilience et la dissonance d’Antrustion (p. 41)', () => {
        const { lancine, antrustion } = poser();
        render(<AffrontementDePenombre combattant={antrustion} cible={lancine} driver={PILOTE} />);
        const profil = document.querySelector('[data-profil-de-l-adversaire]')!.textContent!;
        expect(profil).toContain('Adversité 3');
        expect(profil).toContain('résilience 15 / 15');
        expect(profil).toContain('dissonance 1');
    });

    it('une attaque de 3 succès retire 3 de résilience (p. 43-44)', () => {
        const { lancine, antrustion } = poser();
        render(<AffrontementDePenombre combattant={antrustion} cible={lancine} driver={PILOTE} />);
        fireEvent.change(screen.getByLabelText('Succès de l’attaque'), { target: { value: '3' } });
        fireEvent.click(screen.getByRole('button', { name: /Retirer 3 de résilience/ }));
        expect(nomme('Antrustion').hp).toBe(12);
    });

    it('« Lame colophane » sur Lancine : 3 jetons, les inactifs d’abord (p. 24, 41)', () => {
        const { lancine, antrustion } = poser();
        render(<AffrontementDePenombre combattant={antrustion} cible={lancine} driver={PILOTE} />);
        fireEvent.change(screen.getByLabelText('Action adverse'), { target: { value: '0' } });
        expect((screen.getByLabelText('Jetons perdus') as HTMLInputElement).value).toBe('3');
        fireEvent.click(screen.getByRole('button', { name: /Appliquer : −3 jetons à Lancine/ }));
        expect(nomme('Lancine').hp).toBe(4);
        // 7 jetons dont 2 inactifs : les 2 inactifs partent, puis 1 actif — il en reste 4.
        expect(nomme('Lancine').sheetData!.jetons_actifs).toBe(4);
        expect(nomme('Nimbé').hp).toBe(7);
    });

    it('une action contre toutes : la moitié de l’adversité, arrondie au supérieur ; une défense en annule (p. 42, 44)', () => {
        const { lancine, antrustion } = poser();
        render(<AffrontementDePenombre combattant={antrustion} cible={lancine} driver={PILOTE} />);
        fireEvent.click(screen.getByLabelText(/toutes les Éminences grises/));
        fireEvent.change(screen.getByLabelText('Annulés par une défense'), { target: { value: '1' } });
        fireEvent.click(screen.getByRole('button', { name: /Appliquer : −1 jeton à 2 Éminences grises/ }));
        expect(nomme('Lancine').hp).toBe(6);
        expect(nomme('Nimbé').hp).toBe(6);
    });

    it('à 0 de résilience, la dissonance le relève une fois, puis il est vaincu (p. 43)', () => {
        const { lancine, antrustion } = poser();
        const vue = render(<AffrontementDePenombre combattant={antrustion} cible={lancine} driver={PILOTE} />);
        fireEvent.change(screen.getByLabelText('Succès de l’attaque'), { target: { value: '15' } });
        fireEvent.click(screen.getByRole('button', { name: /Retirer 15 de résilience/ }));
        expect(nomme('Antrustion').hp).toBe(0);
        expect(document.querySelector('[data-chute-dissonante]')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Jouer la dissonance/ }));
        expect(nomme('Antrustion').hp).toBe(15);
        expect(nomme('Antrustion').sheetData![CLE_AFFRONTEMENT_PENOMBRE]).toEqual({ dissonance: 0 });
        vue.rerender(<AffrontementDePenombre combattant={nomme('Antrustion')} cible={lancine} driver={PILOTE} />);
        fireEvent.change(screen.getByLabelText('Succès de l’attaque'), { target: { value: '15' } });
        fireEvent.click(screen.getByRole('button', { name: /Retirer 15 de résilience/ }));
        expect(document.querySelector('[data-adversaire-vaincu]')).toBeTruthy();
    });

    it('un opéra harmonique réussi annule sa dissonance (p. 45)', () => {
        const { lancine, antrustion } = poser();
        render(<AffrontementDePenombre combattant={antrustion} cible={lancine} driver={PILOTE} />);
        expect(document.querySelector('[data-opera-penombre]')!.textContent).toContain('difficulté 15');
        fireEvent.click(screen.getByRole('button', { name: 'Opéra réussi : dissonance annulée' }));
        expect(nomme('Antrustion').sheetData![CLE_AFFRONTEMENT_PENOMBRE]).toEqual({ opera: true });
        expect(screen.getByRole('button', { name: 'La dissonance revient' })).toBeTruthy();
    });
});

describe('le bestiaire relié : la résilience devient la santé (pilote 2.2.0)', () => {
    const initial = useSessionOSStore.getState();
    beforeEach(() => useSessionOSStore.setState({ getActiveDriver: () => PILOTE } as never));
    afterEach(() => useSessionOSStore.setState(initial, true));

    it('Antrustion posé depuis le bestiaire naît à 15 / 15 et garde son maximum sous les coups (p. 41)', () => {
        const bestiaire = PILOTE.bestiaire!;
        const [exemplaire] = exemplairesDeLaCreature({ bestiaire, creature: bestiaire.creatures[0], nombre: 1, typeDeSante: 'hp' });
        expect(exemplaire.sheetData).toMatchObject({ conscience_max: 15 });
        useCombatStore.getState().addCombatant(exemplaire as never);
        const pose = useCombatStore.getState().combatants[0];
        expect([pose.hp, pose.hpMax]).toEqual([15, 15]);
        useCombatStore.getState().applyDamage(3, 'physique', [pose.id]);
        const apres = useCombatStore.getState().combatants[0];
        expect([apres.hp, apres.hpMax]).toEqual([12, 15]);
    });
});
