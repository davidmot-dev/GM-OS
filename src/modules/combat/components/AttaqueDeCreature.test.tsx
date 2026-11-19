// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { AttaqueDeCreature } from './AttaqueDeCreature';
import { attaqueDeCreaturePossible, attaqueSurLaCarte } from '../logic/jetDuCombattant';
import { useCombatStore } from '../useCombatStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { CLE_COMBAT_ALIEN, lireLeCombatAlien } from '../../dice/systemes/combatAlien';
import { xenoViergeAlien } from '../../dice/systemes/xenomorphesAlien';
import type { Combatant } from '../types';

/**
 * **L'attaque d'une créature d'Alien** — registre § 263, T10 (19/11/2026) : « Attaquer » tire l'attaque
 * au D6 dans les lignes de l'espèce, ou dans la table du jeu, l'affiche, la note dans le suivi du
 * xénomorphe et la dit au journal du jet.
 */

const ALIEN = { combat: { alien: { sante: 'sante', force: 'force', stress: 'niveau_de_stress' } } } as never;
// Les lignes du Trilobite « Câlin » (bestiaire du pilote Alien 1.11.0), abrégées.
const LIGNES = [
    { de: '1', nom: 'Dressé', effet: 'Test de Panique.' },
    { de: '2', nom: 'Ondulation', effet: '+1 au Niveau de Stress.' },
    { de: '3', nom: 'Tentacule agrippeur', effet: 'huit dés de base, Dégâts 1.' },
    { de: '4-6', nom: 'Fouet renversant', effet: 'dix dés de base, Dégâts 1.' },
];
const ficheXeno = (xeno: Partial<ReturnType<typeof xenoViergeAlien>>) => ({
    sante: 6, [CLE_COMBAT_ALIEN]: { ...lireLeCombatAlien({}), xenomorphe: { ...xenoViergeAlien(), ...xeno } },
});

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => { useCombatStore.getState().reset(); de = vi.spyOn(DiceEngine, 'roll'); });
afterEach(() => { cleanup(); de.mockRestore(); delete (window as unknown as { appBridge?: unknown }).appBridge; });

const poser = (fiche: Record<string, unknown>) => {
    useCombatStore.getState().addCombatant({ name: 'Trilobite', init: 0, isPlayer: false, faction: 'enemy', statuses: [], sheetData: fiche } as never);
    return useCombatStore.getState().combatants[0] as Combatant;
};

describe('qui peut « Attaquer » par le tirage d’une créature', () => {
    it('une créature d’Alien qui a ses lignes ou sa table', () => {
        expect(attaqueDeCreaturePossible({ isPlayer: false }, ALIEN, ficheXeno({ lignes: LIGNES }))).toBe(true);
        expect(attaqueDeCreaturePossible({ isPlayer: false }, ALIEN, ficheXeno({ table: 'attaques_xenomorphe_rodeur' }))).toBe(true);
        expect(attaqueSurLaCarte({ isPlayer: false }, ALIEN, null, ficheXeno({ lignes: LIGNES })), 'le bouton paraît').toBe(true);
    });

    it('jamais un humain, un PJ, ni un autre jeu', () => {
        expect(attaqueDeCreaturePossible({ isPlayer: false }, ALIEN, { sante: 3 })).toBe(false);
        expect(attaqueDeCreaturePossible({ isPlayer: true }, ALIEN, ficheXeno({ lignes: LIGNES }))).toBe(false);
        expect(attaqueDeCreaturePossible({ isPlayer: false }, { combat: {} } as never, ficheXeno({ lignes: LIGNES }))).toBe(false);
    });
});

describe('le tirage de l’attaque (T10)', () => {
    it('tire au D6 dans les lignes de l’espèce, l’affiche, la note au suivi et au journal', async () => {
        const fiche = ficheXeno({ lignes: LIGNES });
        const trilobite = poser(fiche);
        de.mockReturnValue(5);
        render(<AttaqueDeCreature combattant={trilobite} valeurs={fiche} cible={{ id: 'vasquez', name: 'Vasquez' }} />);
        expect(screen.getByText('Trilobite attaque Vasquez')).toBeTruthy();
        fireEvent.click(screen.getByText(/Tirer l’attaque/));
        await waitFor(() => expect(document.querySelector('[data-attaque-tiree="5"]')).toBeTruthy());
        expect(document.querySelector('[data-attaque-tiree]')!.textContent).toBe('5 — Fouet renversant : dix dés de base, Dégâts 1.');
        expect(lireLeCombatAlien(useCombatStore.getState().combatants[0].sheetData ?? {}).xenomorphe?.attaque)
            .toEqual({ code: 5, titre: 'Fouet renversant', effet: 'dix dés de base, Dégâts 1.' });
        const dernier = useDiceStore.getState().lastRoll!;
        expect(dernier.title).toBe('Trilobite — Attaque sur Vasquez');
        expect(dernier.totalDisplay).toBe('D6 5 — Fouet renversant : dix dés de base, Dégâts 1.');
    });

    it('le meneur peut choisir le résultat au lieu de le tirer', async () => {
        const fiche = ficheXeno({ lignes: LIGNES });
        const trilobite = poser(fiche);
        render(<AttaqueDeCreature combattant={trilobite} valeurs={fiche} />);
        fireEvent.change(screen.getByLabelText('Résultat choisi'), { target: { value: '3' } });
        fireEvent.click(screen.getByText('Prendre cette attaque'));
        await waitFor(() => expect(document.querySelector('[data-attaque-tiree="3"]')?.textContent).toContain('Tentacule agrippeur'));
        expect(de).not.toHaveBeenCalled();
    });

    it('un dé qu’aucune ligne ne couvre se dit, sans tirer une autre attaque', async () => {
        const fiche = ficheXeno({ lignes: LIGNES.slice(1) });
        const trilobite = poser(fiche);
        de.mockReturnValue(1);
        render(<AttaqueDeCreature combattant={trilobite} valeurs={fiche} />);
        fireEvent.click(screen.getByText(/Tirer l’attaque/));
        await waitFor(() => expect(document.querySelector('[data-avis-de-l-attaque]')?.textContent).toContain('Aucune attaque pour un 1'));
        expect(document.querySelector('[data-attaque-tiree]')).toBeNull();
    });

    it('T11 : « dix dés de base, Dégâts 1 » — la réserve se lance, et le coup s’applique à la cible', async () => {
        useCombatStore.getState().addCombatant({ name: 'Vasquez', init: 9, hp: 6, hpMax: 6, isPlayer: false, faction: 'player', statuses: [] } as never);
        const fiche = ficheXeno({ lignes: LIGNES });
        poser(fiche);
        const trilobite = useCombatStore.getState().combatants.find(c => c.name === 'Trilobite')!;
        const vasquez = useCombatStore.getState().combatants.find(c => c.name === 'Vasquez')!;
        de.mockReturnValueOnce(5);
        render(<AttaqueDeCreature combattant={trilobite} valeurs={fiche} cible={vasquez} />);
        fireEvent.click(screen.getByText(/Tirer l’attaque/));
        await waitFor(() => expect(screen.getByText('Lancer 10 dés — Dégâts 1')).toBeTruthy());

        // Dix dés de base : trois six.
        const faces = [6, 6, 6, 2, 3, 4, 5, 1, 2, 3];
        de.mockImplementation(() => faces.shift() ?? 2);
        fireEvent.click(screen.getByText('Lancer 10 dés — Dégâts 1'));
        expect(useDiceStore.getState().lastRoll!.title).toBe('Trilobite — Fouet renversant (10 dés) sur Vasquez');
        expect(useDiceStore.getState().lastRoll!.successes).toBe(3);

        // L'attaque sert d'arme : Dégâts 1 + 3 succès − 1 = 3.
        expect((screen.getByLabelText('Arme') as HTMLSelectElement).value).toBe('Fouet renversant');
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toBe('arme 1 + 3 succès − 1 = 3');
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 3 à Vasquez' }));
        expect(useCombatStore.getState().combatants.find(c => c.name === 'Vasquez')!.hp).toBe(3);
    });

    it('T11 : un test opposé et une attaque perforante se signalent ; une attaque sans dés se résout telle quelle', async () => {
        const lignes = [
            { de: '1', nom: 'Dressé', effet: 'Test de Panique.' },
            { de: '2', nom: 'Griffes', effet: 'six dés de base, Dégâts 1, perforant.' },
            { de: '3-6', nom: 'Viol', effet: 'test opposé de dix dés de base contre le Combat rapproché de la cible.' },
        ];
        const fiche = ficheXeno({ lignes });
        const deacon = poser(fiche);
        render(<AttaqueDeCreature combattant={deacon} valeurs={fiche} />);
        const prendre = async (n: number, attendu: string) => {
            fireEvent.change(screen.getByLabelText('Résultat choisi'), { target: { value: String(n) } });
            fireEvent.click(screen.getByText('Prendre cette attaque'));
            await waitFor(() => expect(document.querySelector('[data-attaque-tiree]')?.textContent).toContain(attendu));
        };
        await prendre(2, 'Griffes');
        expect(document.querySelector('[data-attaque-perforante]')).toBeTruthy();
        await prendre(3, 'Viol');
        expect(document.querySelector('[data-attaque-opposee]')).toBeTruthy();
        expect(screen.getByText('Lancer 10 dés')).toBeTruthy();
        await prendre(1, 'Dressé');
        expect(document.querySelector('[data-attaque-sans-jet]')).toBeTruthy();
        expect(document.querySelector('[data-jet-de-l-attaque]')).toBeNull();
    });

    it('la table du jeu, lue sur le disque ; introuvable, elle se dit', async () => {
        const fiche = ficheXeno({ table: 'attaques_xenomorphe_rodeur' });
        const rodeur = poser(fiche);
        de.mockReturnValue(2);
        const { unmount } = render(<AttaqueDeCreature combattant={rodeur} valeurs={fiche} />);
        fireEvent.click(screen.getByText(/Tirer l’attaque/));
        await waitFor(() => expect(document.querySelector('[data-avis-de-l-attaque]')?.textContent).toContain('Table introuvable'));
        unmount();

        const loadTable = vi.fn(async () => ({ entries: [{ min: 1, max: 6, title: 'Coup de queue', description: 'La queue fouette.', effect: 'six dés de base, Dégâts 2' }] }));
        (window as unknown as { appBridge: unknown }).appBridge = { tables: { loadTable } };
        render(<AttaqueDeCreature combattant={rodeur} valeurs={fiche} />);
        fireEvent.click(screen.getByText(/Tirer l’attaque/));
        await waitFor(() => expect(document.querySelector('[data-attaque-tiree="2"]')?.textContent).toBe('2 — Coup de queue : La queue fouette. — six dés de base, Dégâts 2'));
        expect(loadTable).toHaveBeenCalledWith('Alien', 'attaques_xenomorphe_rodeur');
    });
});
