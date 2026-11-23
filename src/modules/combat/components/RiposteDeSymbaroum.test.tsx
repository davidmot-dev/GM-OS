// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RiposteDeSymbaroum } from './RiposteDeSymbaroum';
import { ripostePossible, attaqueSurLaCarte, jetDuCombattantPossible } from '../logic/jetDuCombattant';
import { attaquesDeSymbaroum, defenseContreLePNJ, protectionDeSymbaroum, riposteDeSymbaroum } from '../logic/attaqueDeLAdversaire';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DiceEngine } from '../../dice/DiceEngine';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';

/**
 * **« Riposte » — l'attaque d'un adversaire de Symbaroum** (registre § 267, T6, 23/11/2026). Le meneur
 * ne lance jamais (p. 178) : Mira teste sa Défense contre la Précision du brigand
 * ([Défense ← Précision], p. 164) ; touchée, elle subit ses dégâts fixes — la moitié de la plus haute
 * face, 1D8 vaut 4 (p. 178) — moins la protection qu'elle lance (p. 167). Le jet du pilote 2.0.0.
 */
const ARMES = [1, 2].map(n => ({ nom: `arme_${n}`, degats: `arme_${n}_degats`, qualites: `arme_${n}_qualites` }));
const ARMURES = [1, 2].map(n => ({ nom: `armure_${n}`, protection: `armure_${n}_protection`, qualites: `armure_${n}_qualites` }));
const PILOTE = {
    combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'endurance_actuelle', label: 'Endurance', isMainHP: true, max: 'endurance' }] },
    jet: { seuil: [{ id: 'attribut', label: 'Attribut', sectionId: 'attributs_primaires' }], reserve: { base: 1, max: 1, faces: 20 }, sens: 'sous-ou-egal',
        symbaroum: { endurance: { courante: 'endurance_actuelle', maximum: 'endurance' }, douleur: 'resistance_douleur', defense: 'defense', armes: ARMES, armures: ARMURES } },
} as unknown as GameDriver;
const BRIGAND = { precision: 12, arme_1: 'Épée', arme_1_degats: '1D8', arme_2: 'Hache de bataille', arme_2_degats: '1D10', arme_2_qualites: 'Éventreur' };

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    useCombatStore.getState().reset();
    de = vi.spyOn(DiceEngine, 'roll');
    useSessionOSStore.setState({ activeCampaignId: 'c1', campaigns: [{ id: 'c1', name: 'Davokar' }] as never });
});
afterEach(() => { cleanup(); de.mockRestore(); });

const poser = () => {
    useCombatStore.getState().addCombatant({ name: 'Mira', init: 10, hp: 14, hpMax: 14, isPlayer: true, faction: 'player', statuses: [],
        sheetData: { endurance_actuelle: 14, endurance: 14, defense: 11, resistance_douleur: 5, armure_1: 'Cuir', armure_1_protection: '1D4' } } as never);
    useCombatStore.getState().addCombatant({ name: 'Brigand', init: 0, isPlayer: false, faction: 'enemy', statuses: [], sheetData: BRIGAND } as never);
    const [mira, brigand] = useCombatStore.getState().combatants;
    return { mira: mira as Combatant, brigand: brigand as Combatant };
};
const miraApres = () => useCombatStore.getState().combatants.find(c => c.name === 'Mira')!;

describe('« Riposte » de Symbaroum (T6)', () => {
    it('paraît sur la carte d’un adversaire, jamais d’un PJ ; pas de jet d’adversaire', () => {
        const { mira, brigand } = poser();
        expect(ripostePossible(brigand, PILOTE)).toBe(true);
        expect(attaqueSurLaCarte(brigand, PILOTE, null)).toBe(true);
        expect(jetDuCombattantPossible(brigand, PILOTE, null)).toBe(false);
        expect(ripostePossible(mira, PILOTE)).toBe(false);
    });

    it('la logique : valeur fixe, Éventreur, Défense contre Précision, protection additionnée', () => {
        const regle = PILOTE.jet?.symbaroum;
        expect(attaquesDeSymbaroum(regle, BRIGAND)).toEqual([
            { libelle: 'Épée', formule: '1D8', fixes: 4 },
            { libelle: 'Hache de bataille', formule: '1D10', fixes: 6 },
        ]);
        expect(defenseContreLePNJ(11, 12)).toBe(9);
        expect(protectionDeSymbaroum(regle, { armure_1: 'Cuir', armure_1_protection: '1D4', armure_2: 'Casque', armure_2_protection: '1' }).formule?.texte).toBe('1D4+1');
        expect(riposteDeSymbaroum(4, 6, false)).toBe(0);
        expect(riposteDeSymbaroum(4, 1, true)).toBe(6);
    });

    it('Défense 11 + (10 − 12) = 9 ; un 12 touche : épée 4 − cuir lancé 3 = 1, appliqué une fois', () => {
        const { mira, brigand } = poser();
        render(<RiposteDeSymbaroum combattant={brigand} cible={mira} driver={PILOTE} />);
        expect(document.querySelector('[data-seuil-de-defense]')!.textContent).toContain('= 9');
        de.mockReturnValueOnce(12);
        fireEvent.click(screen.getByText(/Lancer 1D20 pour Mira/));
        de.mockReturnValueOnce(3);
        fireEvent.click(screen.getByText('Lancer 1D4'));
        expect(document.querySelector('[data-calcul-de-la-riposte]')!.textContent).toContain('Dégâts 4, − protection 3 = 1');
        fireEvent.click(screen.getByText('Appliquer 1 à Mira'));
        expect(miraApres().hp).toBe(13);
        expect(document.querySelector('[data-riposte-appliquee]')).toBeTruthy();
    });

    it('un 9 sur 9 évite le coup : rien à appliquer', () => {
        const { mira, brigand } = poser();
        render(<RiposteDeSymbaroum combattant={brigand} cible={mira} driver={PILOTE} />);
        fireEvent.change(screen.getByLabelText('Jet de Défense'), { target: { value: '9' } });
        expect(document.querySelector('[data-riposte-evitee]')).toBeTruthy();
        expect(screen.queryByText(/^Appliquer/)).toBeNull();
    });

    it('règle optionnelle retenue : un 20 en Défense ajoute 3 (p. 184) ; sans elle, rien', () => {
        const { mira, brigand } = poser();
        const { unmount } = render(<RiposteDeSymbaroum combattant={brigand} cible={mira} driver={PILOTE} />);
        fireEvent.change(screen.getByLabelText('Jet de Défense'), { target: { value: '20' } });
        expect(document.querySelector('[data-calcul-de-la-riposte]')!.textContent).toContain('Dégâts 4 = 4');
        unmount();
        useSessionOSStore.setState({ campaigns: [{ id: 'c1', name: 'Davokar', reglesOptionnelles: { attaquesParfaites: true } }] as never });
        render(<RiposteDeSymbaroum combattant={brigand} cible={mira} driver={PILOTE} />);
        fireEvent.change(screen.getByLabelText('Jet de Défense'), { target: { value: '20' } });
        expect(document.querySelector('[data-calcul-de-la-riposte]')!.textContent).toContain('Dégâts 4 + 3 (20 en Défense, p. 184) = 7');
    });
});
