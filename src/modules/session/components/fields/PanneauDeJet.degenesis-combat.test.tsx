import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const consigner = vi.fn();
vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: (...a: unknown[]) => consigner(...a) }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { useCombatStore } from '../../../combat/useCombatStore';
import { useRoundDeDegenesisStore } from '../../../combat/useRoundDeDegenesisStore';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';
import type { Combatant } from '../../../combat/types';

/**
 * **Le combat de Degenesis au panneau de jet** — DEG-A1 et DEG-A2 (2026-11-03) : l'Égo payé à
 * l'initiative revient à la première action seulement ; l'attaque passe la défense, passive ou
 * active (une action), et ses dégâts nets — une seule armure — partent à la cible (p. 100-107).
 */
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    reserve: { base: 0, max: 12, faces: 6, composantes: [
        { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        { id: 'competence', label: 'Compétence', sectionId: 'competences_phy', sectionsSupplementaires: ['competences_agi'] },
    ] },
    difficulte: { min: 0, max: 12, defaut: 2 },
    degenesis: {
        traumatismes: 'traumatismes', ego: 'ego_jauge',
        combat: {
            force: ['physique', 'force'], attaques: ['corps_a_corps', 'armes_a_projectiles'], aDistance: ['armes_a_projectiles'],
            armes: [{ nom: 'arme1', degats: 'arme1_degats', maniabilite: 'arme1_maniabilite', proprietes: 'arme1_proprietes' }],
            armures: [{ nom: 'armure1', valeur: 'armure1_valeur' }, { nom: 'armure2', valeur: 'armure2_valeur' }],
            defenses: { esquive: ['agilite', 'mobilite'], 'parade-corps-a-corps': ['physique', 'corps_a_corps'] },
        },
    },
};
const DICE = { defaultDice: '6d6', logic: 'count-success', engine: 'pool', successThreshold: 4 } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-deg', name: 'Degenesis', emoji: '🍄',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [
            { id: 'physique', label: 'Physique', type: 'number', defaultValue: 1 },
            { id: 'agilite', label: 'Agilité', type: 'number', defaultValue: 1 },
        ] },
        { id: 'competences_phy', label: 'Compétences — Physique', fields: [
            { id: 'corps_a_corps', label: 'Corps à corps', type: 'number', defaultValue: 0 },
            { id: 'force', label: 'Force', type: 'number', defaultValue: 0 },
        ] },
        { id: 'competences_agi', label: 'Compétences — Agilité', fields: [
            { id: 'armes_a_projectiles', label: 'Armes à projectiles', type: 'number', defaultValue: 0 },
            { id: 'mobilite', label: 'Mobilité', type: 'number', defaultValue: 0 },
        ] },
        { id: 'ego_et_sante', label: 'Égo et santé', fields: [
            { id: 'ego_jauge', label: "Points d'Égo", type: 'number', defaultValue: 0 },
            { id: 'traumatismes', label: 'Traumatismes subis', type: 'number', defaultValue: 0 },
        ] },
    ],
} as unknown as SheetTemplate;
// Falberg : PHY 4 + Corps à corps 3, PHY + Force 7 ; une épée bâtarde 4+F/2, maniabilité +1D.
const FALBERG = {
    physique: 4, agilite: 2, corps_a_corps: 3, force: 3, armes_a_projectiles: 1, mobilite: 1, ego_jauge: 6, traumatismes: 0,
    arme1: 'Épée bâtarde', arme1_degats: '4+F/2', arme1_maniabilite: '+1D', arme1_proprietes: '',
};
// L'Usudi : AGI 3 + Mobilité 2 ; chemise de mailles 2 et un bouclier de cuir 1 — une seule compte.
const USUDI = { agilite: 3, mobilite: 2, physique: 3, corps_a_corps: 2, armure1: 'Chemise de mailles', armure1_valeur: 2, armure2: 'Cuir', armure2_valeur: 1 };

const combattant = (c: Partial<Combatant>) => ({ init: 0, faction: 'enemy', isPlayer: false, statuses: [], ...c }) as Combatant;

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 1);
const applyDamage = vi.fn();
const combat = useCombatStore.getState();
beforeEach(() => {
    de = vi.spyOn(DiceEngine, 'roll');
    consigner.mockClear();
    applyDamage.mockClear();
    useCombatStore.setState({
        round: 1, applyDamage, consignerLOuvertureDuCombat: () => {},
        combatants: [
            combattant({ id: 'c-falberg', name: 'Falberg', isPlayer: true, faction: 'player', sourcePlayerId: 'falberg', targetId: 'c-usudi' }),
            combattant({ id: 'c-usudi', name: 'Usudi', sheetData: USUDI }),
        ],
    });
    useRoundDeDegenesisStore.setState({
        round: 1, declarations: {},
        etats: {
            'c-falberg': { score: 3, declencheurs: 2, actions: 2, utilisees: 0, bonusEgo: 2, bonusUtilise: false },
            'c-usudi': { score: 2, declencheurs: 0, actions: 1, utilisees: 0, bonusEgo: 0, bonusUtilise: true },
        },
    });
});
afterEach(() => {
    cleanup();
    de.mockRestore();
    useCombatStore.setState(combat, true);
    useRoundDeDegenesisStore.setState({ round: null, etats: {}, declarations: {} });
});

const monter = (valeurs: Record<string, unknown> = FALBERG, ecrire = vi.fn()) => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={ecrire} personnageId="falberg" />).container;
    const [attribut, competence] = screen.getAllByRole('combobox');
    fireEvent.change(attribut, { target: { value: 'physique' } });
    fireEvent.change(competence, { target: { value: 'corps_a_corps' } });
    return { panneau, ecrire };
};
const composition = (p: HTMLElement) => p.querySelector('[data-composition-degenesis]')!.textContent;
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));

describe("l'Égo de l'initiative (DEG-A1, p. 100)", () => {
    it('la première action reçoit les +2D payés à l’initiative, sans débit ; la seconde, rien', () => {
        const { panneau, ecrire } = monter();
        expect(panneau.querySelector('[data-ego-de-l-initiative]')!.textContent).toContain('+2D');
        expect(screen.queryByLabelText('Égo dépensé')).toBeNull();
        expect(composition(panneau)).toContain("+2D d'Égo = 9 : 9 dés");
        faces(4, 4, 4, 4, 4, 4, 4, 4, 4);
        lancer();
        expect(de).toHaveBeenCalledTimes(9);
        expect(ecrire).not.toHaveBeenCalledWith(expect.objectContaining({ ego_jauge: expect.anything() }));
        expect(useRoundDeDegenesisStore.getState().etats['c-falberg']).toMatchObject({ utilisees: 1, bonusUtilise: true });
        expect(composition(panneau)).toContain('= 7 : 7 dés');
        expect(panneau.querySelector('[data-ego-de-l-initiative]')).toBeNull();
    });

    it("un jet qui n'est pas une action ne touche ni le compte ni le bonus", () => {
        monter();
        fireEvent.click(screen.getByLabelText(/Ce jet est une action du round/));
        faces(4);
        lancer();
        expect(useRoundDeDegenesisStore.getState().etats['c-falberg']).toMatchObject({ utilisees: 0, bonusUtilise: false });
    });
});

describe("l'attaque jusqu'aux dégâts nets (DEG-A2, p. 102-107)", () => {
    const sansEgo = () => useRoundDeDegenesisStore.setState(s => ({ etats: { ...s.etats, 'c-falberg': { ...s.etats['c-falberg'], bonusEgo: 0, bonusUtilise: true } } }));

    it("l'épée bâtarde : +1D de maniabilité ; défense passive 2 ; 4 + F/2 (7 → 4) + 1 déclencheur − la chemise 2 = 7", () => {
        sansEgo();
        const { panneau } = monter();
        fireEvent.change(screen.getByLabelText('Arme de l’attaque'), { target: { value: 'arme1' } });
        expect(composition(panneau)).toMatch(/\+1D \(dont \+1D de maniabilité\) = 8 : 8 dés/);
        faces(6, 5, 4, 2, 2, 1, 1, 1);
        lancer();
        expect(panneau.querySelector('[data-issue-degenesis]')!.textContent).toBe('Défense passive 2 : 3 succès ≥ 2 — touché.');
        expect(panneau.querySelector('[data-degats-degenesis]')!.textContent).toContain('4 + F/2 (7 → 4)');
        expect(panneau.querySelector('[data-coup-degenesis]')!.textContent).toBe('9 − armure 2 = 7 → Blessures superficielles');
        // Une seule armure : le cuir à la place de la chemise, jamais les deux.
        fireEvent.change(screen.getByLabelText('Armure de la cible'), { target: { value: '1' } });
        expect(panneau.querySelector('[data-coup-degenesis]')!.textContent).toBe('9 − armure 1 = 8 → Blessures superficielles');
        fireEvent.click(screen.getByText('Porter le coup à Usudi'));
        expect(applyDamage).toHaveBeenCalledWith(8, 'physique', ['c-usudi']);
    });

    it('la défense active coûte une action à la cible ; à égalité, elle pare ; sans action, plus de défense active', () => {
        sansEgo();
        const { panneau } = monter();
        faces(4, 4, 1, 1, 1, 1, 1);
        lancer();
        fireEvent.click(screen.getByText('Défense active'));
        expect((screen.getByLabelText('Défense active') as HTMLSelectElement).value).toBe('parade-corps-a-corps');
        // PHY 3 + Corps à corps 2 : cinq dés, deux succès contre deux.
        faces(5, 4, 3, 2, 1);
        fireEvent.click(screen.getByText('Lancer la défense (1 action)'));
        expect(panneau.querySelector('[data-issue-degenesis]')!.textContent).toBe('Défense active : 2 succès contre 2 — paré.');
        expect(panneau.querySelector('[data-degats-degenesis]')).toBeNull();
        expect(useRoundDeDegenesisStore.getState().etats['c-usudi'].utilisees).toBe(1);
        expect((screen.getByText('Lancer la défense (1 action)') as HTMLButtonElement).disabled).toBe(true);
        expect(panneau.textContent).toContain('défense passive seulement');
    });

    it('une arme « Mortel » ignore l’armure et va aux Traumatismes', () => {
        sansEgo();
        const { panneau } = monter({ ...FALBERG, arme1_degats: '6', arme1_proprietes: 'Mortel' });
        fireEvent.change(screen.getByLabelText('Arme de l’attaque'), { target: { value: 'arme1' } });
        faces(5, 5, 2, 2, 2, 2, 2, 2);
        lancer();
        expect(panneau.querySelector('[data-coup-degenesis]')!.textContent).toBe('6 (armure 2 ignorée : mortel) → Traumatismes');
        fireEvent.click(screen.getByText('Porter le coup à Usudi'));
        expect(applyDamage).toHaveBeenCalledWith(6, 'mortel', ['c-usudi']);
    });
});
