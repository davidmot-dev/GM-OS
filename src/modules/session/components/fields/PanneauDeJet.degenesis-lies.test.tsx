import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const consigner = vi.fn();
vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: (...a: unknown[]) => consigner(...a) }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { useCombatStore } from '../../../combat/useCombatStore';
import { useJetsLiesDeDegenesisStore } from '../../../combat/useJetsLiesDeDegenesisStore';
import { useSessionOSStore } from '../../useSessionOSStore';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Les jets liés de Degenesis au panneau de jet** — DEG-A4 (2026-11-04) : l'aide de Kum
 * (difficulté +1) devient des dés pour Falberg ; la combinaison reporte les déclencheurs une
 * fois ; la confrontation lance la réserve de l'adversaire ; l'action complexe cumule (p. 19-21).
 */
const JET: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    reserve: { base: 0, max: 12, faces: 6, composantes: [
        { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
        { id: 'competence', label: 'Compétence', sectionId: 'competences_phy' },
    ] },
    difficulte: { min: 0, max: 12, defaut: 2 },
    degenesis: {
        traumatismes: 'traumatismes',
        reserves: [{ attribut: 'physique', competences: ['corps_a_corps', 'force'] }],
    },
};
const DICE = { defaultDice: '6d6', logic: 'count-success', engine: 'pool', successThreshold: 4 } as unknown as DiceConfig;
const FICHE = {
    id: 'tpl-deg', name: 'Degenesis', emoji: '🍄',
    sections: [
        { id: 'attributs', label: 'Attributs', fields: [{ id: 'physique', label: 'Physique', type: 'number', defaultValue: 1 }] },
        { id: 'competences_phy', label: 'Compétences — Physique', fields: [
            { id: 'corps_a_corps', label: 'Corps à corps', type: 'number', defaultValue: 0 },
            { id: 'force', label: 'Force', type: 'number', defaultValue: 0 },
        ] },
        { id: 'sante', label: 'Santé', fields: [{ id: 'traumatismes', label: 'Traumatismes', type: 'number', defaultValue: 0 }] },
    ],
} as unknown as SheetTemplate;
const FALBERG = { physique: 4, corps_a_corps: 3, force: 3, traumatismes: 0 };
const KUM = { physique: 3, corps_a_corps: 2, force: 3, traumatismes: 0 };

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 1);
const combat = useCombatStore.getState();
const session = useSessionOSStore.getState();
beforeEach(() => {
    de = vi.spyOn(DiceEngine, 'roll');
    consigner.mockClear();
    useCombatStore.setState({ round: 1, combatants: [] });
    useSessionOSStore.setState({
        players: [{ id: 'j1', name: 'Table', characters: [
            { id: 'falberg', name: 'Falberg', campaignId: 'c1', sheetData: FALBERG },
            { id: 'kum', name: 'Kum', campaignId: 'c1', sheetData: KUM },
        ] }] as never,
        entities: [],
    });
    useJetsLiesDeDegenesisStore.setState({ aides: [], reports: {}, actions: [], actionCourante: null });
});
afterEach(() => {
    cleanup();
    de.mockRestore();
    useCombatStore.setState(combat, true);
    useSessionOSStore.setState(session, true);
});

const monter = (personnageId: string, valeurs: Record<string, unknown>, competence = 'corps_a_corps') => {
    const panneau = render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} ecrireSurLaFiche={vi.fn()}
        personnageId={personnageId} campaignId="c1" />).container;
    const [attribut, comp] = screen.getAllByRole('combobox');
    fireEvent.change(attribut, { target: { value: 'physique' } });
    fireEvent.change(comp, { target: { value: competence } });
    return panneau;
};
const composition = (p: HTMLElement) => p.querySelector('[data-composition-degenesis]')!.textContent;
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));

describe('les jets liés de Degenesis (DEG-A4, p. 19-21)', () => {
    it('Kum aide Falberg : difficulté +1, ses 2 déclencheurs deviennent +2D, pris une seule fois', () => {
        const kum = monter('kum', KUM, 'force');
        fireEvent.click(screen.getByText(/Ce jet aide un autre personnage/));
        expect((screen.getByLabelText('Personnage aidé') as HTMLSelectElement).value).toBe('falberg');
        faces(6, 6, 4, 4, 2, 2);
        lancer();
        expect(kum.textContent).toContain('difficulté 3');
        expect(kum.querySelector('[data-aide-donnee]')!.textContent).toContain('+2D mis de côté pour le prochain jet de Falberg');
        expect(useJetsLiesDeDegenesisStore.getState().aides).toMatchObject([{ pour: 'falberg', de: 'Kum', des: 2 }]);
        cleanup();

        const falberg = monter('falberg', FALBERG);
        expect(falberg.querySelector('[data-aide-recue]')!.textContent).toContain('Aide de Kum (+2D) : +2D');
        expect(composition(falberg)).toContain('= 9 : 9 dés');
        faces(4, 4, 4, 2, 2, 2, 2, 2, 2);
        lancer();
        expect(de).toHaveBeenCalledTimes(6 + 9);
        expect(useJetsLiesDeDegenesisStore.getState().aides).toEqual([]);
    });

    it('une aide ratée n’apporte rien, et la difficulté revient à la normale', () => {
        const kum = monter('kum', KUM, 'force');
        fireEvent.click(screen.getByText(/Ce jet aide un autre personnage/));
        faces(6, 4, 2, 2, 2, 2);
        lancer();
        expect(kum.querySelector('[data-aide-donnee]')!.textContent).toContain('Aucun dé pour Falberg');
        expect(useJetsLiesDeDegenesisStore.getState().aides).toEqual([]);
        expect(screen.queryByLabelText('Personnage aidé')).toBeNull();
    });

    it('combinaison : 2 déclencheurs reportés + 1 = 3 sur la réussite, et le report se consomme', () => {
        useJetsLiesDeDegenesisStore.setState({ reports: { falberg: { declencheurs: 2, source: 'Agilité + Navigation' } } });
        const p = monter('falberg', FALBERG);
        expect(p.querySelector('[data-report-recu]')!.textContent).toContain('Déclencheurs reportés (Agilité + Navigation) : 2');
        faces(6, 5, 4, 2, 2, 2, 2);
        lancer();
        expect(p.querySelector('[data-combinaison-degenesis]')!.textContent).toContain('1 déclencheur + 2 reportés = 3 déclencheurs');
        expect(useJetsLiesDeDegenesisStore.getState().reports).toEqual({});
        // Et l'on peut enchaîner à nouveau : les 3 passent au test suivant.
        fireEvent.click(screen.getByText(/Enchaîner un second test \(reporte 3 déclencheurs\)/));
        expect(useJetsLiesDeDegenesisStore.getState().reports.falberg?.declencheurs).toBe(3);
    });

    it('confrontation : GM-OS lance la réserve de Kum ; à succès égaux, le six de Falberg l’emporte', () => {
        const p = monter('falberg', FALBERG);
        faces(6, 5, 4, 2, 2, 2, 2);
        lancer();
        expect((screen.getByLabelText('Adversaire') as HTMLSelectElement).value).toBe('kum');
        fireEvent.change(screen.getByLabelText('Réserve de l’adversaire'), { target: { value: 'physique|force' } });
        faces(5, 5, 4, 2, 2, 1);
        fireEvent.click(screen.getByText('Lancer sa réserve'));
        expect(de).toHaveBeenCalledTimes(7 + 6);
        expect(p.querySelector('[data-issue-confrontation]')!.textContent)
            .toBe('Falberg 3 succès, 1 six contre Kum 3 succès, 0 six — Falberg l’emporte aux six (p. 19).');
        expect(consigner).toHaveBeenCalledWith(expect.objectContaining({ totalDisplay: expect.stringContaining('Kum, Physique + Force (6 dés)') }));
    });

    it('action complexe : on l’ouvre, chaque jet verse ses succès et ses déclencheurs, une fois', () => {
        const p = monter('falberg', FALBERG);
        faces(6, 5, 4, 4, 2, 2, 2);
        lancer();
        fireEvent.change(screen.getByLabelText('Nom de l’action complexe'), { target: { value: 'Dégager le chariot' } });
        fireEvent.change(screen.getByLabelText('Objectif de succès'), { target: { value: '20' } });
        fireEvent.click(screen.getByText('Ouvrir'));
        fireEvent.click(screen.getByText('Verser 4 succès + 1 déclencheur (5)'));
        expect(p.querySelector('[data-cumul-action]')!.textContent).toBe('5 / 20');
        expect(screen.getByText('Versé')).toBeTruthy();
        expect(useJetsLiesDeDegenesisStore.getState().actions[0].versements).toHaveLength(1);
    });
});
