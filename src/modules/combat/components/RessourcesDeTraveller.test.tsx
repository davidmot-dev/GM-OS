import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RessourcesDeTraveller } from './RessourcesDeTraveller';
import { MunitionsDeTraveller } from './MunitionsDeTraveller';
import { useCombatStore } from '../useCombatStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { DiceEngine } from '../../dice/DiceEngine';
import type { Combatant } from '../types';
import type { ArmeDeTraveller } from '../logic/attaqueDeTraveller';

/** TRV-A6 (27/11/2026) — C1, C2, C5, C7, C8, C9 : munitions, PSI, repos et réveil sur la carte. */
const REGLE = {
    mecanique: 'traveller' as const, endurance: 'endurance', force: 'force', dexterite: 'dexterite',
    maximum: { endurance: 'endurance_max', force: 'force_max', dexterite: 'dexterite_max' },
    psi: { champ: 'psi', maximum: 'psi_max' }, incapacitants: 'degats_incapacitants',
};
const FICHE = {
    endurance: 7, force: 6, dexterite: 8, endurance_max: 7, force_max: 6, dexterite_max: 8, psi: 9, psi_max: 9,
    arme_1: 'Fusil d’assaut', arme_1_degats: '3D', arme_1_munitions: '30',
};
const PM: ArmeDeTraveller = {
    index: 1, libelle: 'Pistolet-mitrailleur', degats: { des: 3, bonus: 0, destructrice: false }, texteDesDegats: '3D', melee: false,
    traits: { ap: 0, auto: 4, incapacitante: false, autres: [] }, munitions: '30/30',
};

let de: ReturnType<typeof vi.spyOn>;
const ajouter = (sheetData: Record<string, unknown>) => {
    useCombatStore.getState().reset();
    useCombatStore.getState().addCombatant({ name: 'Kathya', init: 0, isPlayer: false, faction: 'player', statuses: [], sheetData } as never);
};
const kathya = () => useCombatStore.getState().combatants[0] as Combatant;
const ajout = vi.fn();
const journal = () => ajout.mock.calls.map(([e]) => (e as { content: string }).content).join(' | ');
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); ajout.mockReset(); useJournalStore.setState({ addEvent: ajout } as never); });
afterEach(() => { cleanup(); de.mockRestore(); });

describe('les munitions (C1, C2, C9)', () => {
    it('une rafale de 4 sur 30/30 : le décompte attend le clic, écrit 26/30 et se note', () => {
        const ecrire = vi.fn();
        render(<MunitionsDeTraveller arme={PM} rafale nom="Kathya" ecrire={ecrire} />);
        expect(document.querySelector('[data-munitions-traveller]')!.textContent).toContain('→ 26/30');
        expect(ecrire).not.toHaveBeenCalled();
        fireEvent.click(screen.getByText('Décompter 4'));
        expect(ecrire).toHaveBeenCalledWith({ arme_1_munitions: '26/30' });
        expect(journal()).toContain('Pistolet-mitrailleur : 30/30 → 26/30 (rafale, 4 coups, p. 76)');
    });

    it('l’auto complet prend trois fois le niveau Auto ; un chargeur vide propose de recharger', () => {
        const ecrire = vi.fn();
        const { unmount } = render(<MunitionsDeTraveller arme={PM} rafale={false} nom="Kathya" ecrire={ecrire} />);
        fireEvent.change(screen.getByLabelText('Mode de tir'), { target: { value: 'auto' } });
        expect(screen.getByText('Décompter 12')).toBeTruthy();
        unmount();
        render(<MunitionsDeTraveller arme={{ ...PM, munitions: '0/30' }} rafale={false} nom="Kathya" ecrire={ecrire} />);
        expect(document.querySelector('[data-chargeur-vide]')).toBeTruthy();
        fireEvent.click(screen.getByText('Recharger'));
        expect(ecrire).toHaveBeenCalledWith({ arme_1_munitions: '30/30' });
    });

    it('sans capacité lisible, la ligne se tait (C2)', () => {
        render(<MunitionsDeTraveller arme={{ ...PM, munitions: '' }} rafale nom="Kathya" ecrire={vi.fn()} />);
        expect(document.querySelector('[data-munitions-traveller]')).toBeNull();
    });
});

describe('la carte des ressources (C2, C5, C7, C8)', () => {
    it('rien à proposer : la carte ne s’affiche pas', () => {
        ajouter(FICHE);
        render(<RessourcesDeTraveller combattant={kathya()} regle={REGLE} valeurs={FICHE} />);
        expect(document.querySelector('[data-ressources-traveller]')).toBeNull();
    });

    it('Recharger une arme entamée, Récupérer la PSI au bout de 5 h', () => {
        const fiche = { ...FICHE, arme_1_munitions: '12/30', psi: 4 };
        ajouter(fiche);
        render(<RessourcesDeTraveller combattant={kathya()} regle={REGLE} valeurs={fiche} />);
        fireEvent.click(screen.getByText(/Recharger Fusil/));
        expect(kathya().sheetData).toMatchObject({ arme_1_munitions: '30/30' });
        fireEvent.change(screen.getByLabelText('Heures depuis la dernière utilisation'), { target: { value: '5' } });
        fireEvent.click(screen.getByText(/Récupérer la PSI/));
        expect(kathya().sheetData).toMatchObject({ psi: 6 });
        expect(journal()).toContain('2 PSI récupérés, PSI 4 → 6 (p. 224)');
    });

    it('Une heure de repos rend les dégâts incapacitants, eux seuls (C7)', () => {
        const fiche = { ...FICHE, endurance: 1, degats_incapacitants: 6 };
        ajouter(fiche);
        render(<RessourcesDeTraveller combattant={kathya()} regle={REGLE} valeurs={fiche} />);
        fireEvent.click(screen.getByText(/Une heure de repos/));
        expect(kathya().sheetData).toMatchObject({ endurance: 7, degats_incapacitants: 0, force: 6 });
    });

    it('Test de réveil : un échec donne MD+1 au suivant (C8)', () => {
        const fiche = { ...FICHE, endurance: 0, force: 0 };
        ajouter(fiche);
        render(<RessourcesDeTraveller combattant={kathya()} regle={REGLE} valeurs={fiche} />);
        // END 0 : MD −3 (p. 9). 3 + 3 − 3 = 3 : reste inconscient ; puis 6 + 4 − 3 + 1 = 8 : réveillé.
        const des = [3, 3, 6, 4]; let n = 0; de.mockImplementation(() => des[n++]);
        fireEvent.click(document.querySelector('[data-test-de-reveil]')!);
        expect(document.querySelector('[data-ressource-traveller-faite]')!.textContent).toContain('reste inconscient, MD+1');
        fireEvent.click(document.querySelector('[data-test-de-reveil]')!);
        expect(document.querySelector('[data-ressource-traveller-faite]')!.textContent).toContain('minute 2');
        expect(document.querySelector('[data-ressource-traveller-faite]')!.textContent).toContain('reprend conscience');
    });
});
