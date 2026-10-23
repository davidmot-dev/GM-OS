import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { useSessionOSStore } from '../../useSessionOSStore';
import { CLE_SYMBAROUM } from '../../../dice/systemes/symbaroumRegles';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * **Finir Symbaroum, au panneau** — 23/10/2026 (S2, S4 à S9 de l'audit). Une
 * fiche faite comme celle du pilote ; l'attaque et ses dégâts, la Défense et ce
 * qu'on encaisse, l'agonie, les critiques et la relance optionnels.
 */
const nombre = (id: string, label = id) => ({ id, label, type: 'number', defaultValue: 0 });
const texte = (id: string, label = id) => ({ id, label, type: 'text', defaultValue: '' });
const FICHE = {
    id: 'tpl-symbaroum', name: 'Symbaroum', emoji: '🌑',
    sections: [
        { id: 'attributs_primaires', label: 'Attributs primaires', fields: [nombre('precision', 'Précision'), nombre('agilite', 'Agilité'), nombre('force', 'Force'), nombre('volonte', 'Volonté')] },
        { id: 'attributs_secondaires', label: 'Attributs secondaires', fields: [
            nombre('endurance', 'Endurance maximale'), nombre('endurance_actuelle', 'Endurance'), nombre('resistance_douleur', 'Résistance à la douleur'),
            nombre('defense', 'Défense'), nombre('seuil_corruption', 'Seuil de Corruption'),
        ] },
        { id: 'armes', label: 'Armes', fields: [texte('arme_1', 'Arme 1'), texte('arme_1_degats', 'Arme 1 — dégâts')] },
        { id: 'protections', label: 'Protections', fields: [texte('armure_1', 'Armure 1'), texte('armure_1_protection', 'Armure 1 — protection')] },
        { id: 'ombre', label: 'Ombre', fields: [nombre('corruption_temporaire'), nombre('corruption_permanente')] },
        { id: 'equipement', label: 'Équipement', fields: [nombre('experience'), nombre('experience_non_depensee'), nombre('argent'), texte('bourse')] },
    ],
} as unknown as SheetTemplate;
const JET: DescripteurDeJet = {
    sens: 'sous-ou-egal',
    seuil: [{
        id: 'attribut', label: 'Attribut', sectionId: 'attributs_primaires', sectionsSupplementaires: ['attributs_secondaires'],
        motif: '^(precision|agilite|force|volonte|defense)$',
    }],
    reserve: { base: 1, max: 1, faces: 20 },
    modificateurDuSeuil: {
        min: -5, max: 5, defaut: 0, opposition: { reference: 10, label: 'Attribut adverse' },
        avantage: { label: 'Avantage tactique', seuil: 2, degats: '1d4' },
    },
    symbaroum: {
        attributs: ['precision', 'agilite', 'force', 'volonte'], force: 'force', volonte: 'volonte', agilite: 'agilite',
        endurance: { courante: 'endurance_actuelle', maximum: 'endurance' }, douleur: 'resistance_douleur', defense: 'defense',
        seuilDeCorruption: 'seuil_corruption', corruption: { temporaire: 'corruption_temporaire', permanente: 'corruption_permanente' },
        armes: [{ nom: 'arme_1', degats: 'arme_1_degats' }], armures: [{ nom: 'armure_1', protection: 'armure_1_protection' }],
        experience: { total: 'experience', disponible: 'experience_non_depensee' }, argent: { champ: 'argent', ecrit: 'bourse' },
    },
};
const DICE = { defaultDice: '1d20', logic: 'count-success', engine: 'standard' } as unknown as DiceConfig;
const HARGNE = {
    precision: 12, agilite: 10, force: 11, volonte: 10, endurance: 11, endurance_actuelle: 5, resistance_douleur: 6, defense: 9,
    arme_1: 'Bâton', arme_1_degats: '1D8', armure_1: 'Tablier de cuir', armure_1_protection: '1D4', experience: 12, experience_non_depensee: 3,
};

let de: ReturnType<typeof vi.spyOn>;
const faces = (...f: number[]) => de.mockImplementation(() => f.shift() ?? 10);
const ecrire = vi.fn();
const initial = useSessionOSStore.getState();
beforeEach(() => { de = vi.spyOn(DiceEngine, 'roll'); ecrire.mockClear(); });
afterEach(() => { cleanup(); de.mockRestore(); useSessionOSStore.setState(initial, true); });

const monter = (valeurs: Record<string, unknown> = HARGNE, campaignId?: string) =>
    render(<PanneauDeJet descripteur={JET} dice={DICE} template={FICHE} valeurs={valeurs} campaignId={campaignId} ecrireSurLaFiche={ecrire} />).container;
const attribut = (panneau: HTMLElement) => [...panneau.querySelectorAll('select')].find(s => s.querySelector('option[value="precision"]'))!;
const lancer = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const ecrit = () => Object.assign({}, ...ecrire.mock.calls.map(c => c[0]));

describe('Symbaroum au panneau de jet', () => {
    it('la Défense se propose, pas l’Endurance ni le Seuil de Corruption', () => {
        const options = [...attribut(monter()).querySelectorAll('option')].map(o => o.value);
        expect(options).toEqual(['', 'precision', 'agilite', 'force', 'volonte', 'defense']);
    });

    it('un 1 ne s’écrit plus « réussite critique » : le d20 n’en a pas de base (S8)', () => {
        const panneau = monter();
        fireEvent.change(attribut(panneau), { target: { value: 'precision' } });
        faces(1);
        lancer();
        expect(screen.getByText('1 / 12')).toBeTruthy();
        expect(screen.queryByText(/critique/)).toBeNull();
    });

    it('l’attaque réussie lance l’arme et l’Avantage, moins la protection fixe du PNJ (S5)', () => {
        const panneau = monter();
        fireEvent.change(attribut(panneau), { target: { value: 'precision' } });
        fireEvent.click(screen.getByRole('radio', { name: 'Attaque' }));
        fireEvent.click(panneau.querySelector('[data-avantage-tactique]')!);
        faces(13, 6, 3);
        lancer();
        const degats = panneau.querySelector('[data-degats-symbaroum]') as HTMLElement;
        fireEvent.change(within(degats).getByLabelText('Protection du PNJ'), { target: { value: '2' } });
        fireEvent.change(within(degats).getByLabelText('Résistance à la douleur du PNJ'), { target: { value: '5' } });
        fireEvent.click(within(degats).getByText('Lancer 1D8+1D4'));
        const issue = panneau.querySelector('[data-issue-des-degats]')!.textContent!;
        expect(issue).toMatch(/6 \(D8\) \+ 3 \(D4\) = 9 − 2 de protection → 7 dégâts/);
        expect(issue).toMatch(/Résistance à la douleur \(5\) atteinte : le joueur choisit/);
    });

    it('la Défense ratée fait lancer l’armure et retire le reste de l’Endurance', () => {
        const panneau = monter();
        fireEvent.click(screen.getByRole('radio', { name: 'Défense' }));
        expect(attribut(panneau).value).toBe('defense');
        fireEvent.change(panneau.querySelector('[data-valeur-adverse]')!, { target: { value: '13' } });
        faces(8, 2);
        lancer();
        expect(screen.getByText('8 / 6')).toBeTruthy();
        const zone = panneau.querySelector('[data-encaisser-symbaroum]') as HTMLElement;
        fireEvent.change(within(zone).getByLabelText('Dégâts du PNJ'), { target: { value: '6' } });
        fireEvent.click(within(zone).getByText('Lancer la protection et encaisser'));
        expect(ecrit().endurance_actuelle).toBe(1);
        expect(panneau.querySelector('[data-issue-encaisser]')!.textContent).toMatch(/6 − 2 \(Tablier de cuir : 2 \(D4\)\) → 4 dégâts ; Endurance 5 → 1/);
    });

    it('à zéro, le personnage est mourant ; le Test de mort compte les 11–19 (S2)', () => {
        const panneau = monter({ ...HARGNE, endurance_actuelle: 3 });
        fireEvent.click(screen.getByRole('radio', { name: 'Défense' }));
        faces(15, 1, 13);
        lancer();
        const zone = panneau.querySelector('[data-encaisser-symbaroum]') as HTMLElement;
        fireEvent.change(within(zone).getByLabelText('Dégâts du PNJ'), { target: { value: '8' } });
        fireEvent.click(within(zone).getByText('Lancer la protection et encaisser'));
        expect(ecrit().endurance_actuelle).toBe(0);
        expect(ecrit()[CLE_SYMBAROUM]).toMatchObject({ agonie: { tests: 0, echecs: 0 } });
        fireEvent.click(screen.getByText('Test de mort (1D20)'));
        expect(panneau.querySelector('[data-dernier-endurance]')!.textContent).toMatch(/13 : encore un peu plus près de la mort \(1 sur 3\)/);
    });

    it('avec les options de la table : Attaque parfaite et une seule relance contre l’Expérience (S8)', () => {
        useSessionOSStore.setState({ campaigns: [{ id: 'c-symb', name: 'Davokar', system: 'symbaroum', reglesOptionnelles: { attaquesParfaites: true, relanceExperience: true } }] as never });
        const panneau = monter(HARGNE, 'c-symb');
        fireEvent.change(attribut(panneau), { target: { value: 'precision' } });
        fireEvent.click(screen.getByRole('radio', { name: 'Attaque' }));
        faces(1);
        lancer();
        expect(screen.getByText('Attaque parfaite : +1D6 aux dégâts.')).toBeTruthy();
        expect(screen.getByText('Lancer 1D8+1D6')).toBeTruthy();
        faces(9);
        fireEvent.click(screen.getByText('1 Expérience'));
        expect(ecrit().experience_non_depensee).toBe(2);
        expect(screen.getByText('9 / 12')).toBeTruthy();
        expect(screen.queryByText('1 Expérience')).toBeNull();
    });

    it('un échec critique en Défense ne se relance pas, comme le livre le recommande (p. 184)', () => {
        useSessionOSStore.setState({ campaigns: [{ id: 'c-symb', name: 'Davokar', system: 'symbaroum', reglesOptionnelles: { attaquesParfaites: true, relanceExperience: true } }] as never });
        monter(HARGNE, 'c-symb');
        fireEvent.click(screen.getByRole('radio', { name: 'Défense' }));
        faces(20);
        lancer();
        expect(screen.getByText('Échec critique en Défense : l’ennemi inflige +3 dégâts.')).toBeTruthy();
        expect(screen.queryByText('1 Expérience')).toBeNull();
    });
});
