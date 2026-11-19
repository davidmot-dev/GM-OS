// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));
const ecrire = vi.fn();
vi.mock('../ficheDesCombattants', () => ({ ecrireLaFicheDuCombattant: (...a: unknown[]) => ecrire(...a) }));

import { JetDuCombattant } from './JetDuCombattant';
import { attaqueSurLaCarte, jetDuCombattantPossible } from '../logic/jetDuCombattant';
import { armesDeLAdversaire, attaqueParDefaut } from '../logic/attaqueDeLAdversaire';
import { protectionLue } from '../logic/protectionDeLaCible';
import { DiceEngine } from '../../dice/DiceEngine';
import { forcerLeJet } from '../../dice/systemes/yearZero';
import { useCombatStore } from '../useCombatStore';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **« Attaquer » pour Blade Runner** — registre § 263, T9 (19/11/2026). L'Agent du LAPD du livre
 * (pilote 2.1.0) attaque Rachel : Agilité C + Armes à feu C, sa Matraque de policier (Dégâts 2) lue
 * au catalogue, la protection de Rachel lancée, le coup appliqué. Règle du jet, catalogue et
 * protection repris du pilote 2.1.0 (`Export Dirvers/corriges/Blade-Runner-2.1.0.gmos-driver`).
 */
const LETTRES = ['A (D12)', 'B (D10)', 'C (D8)', 'D (D6)'];
const PILOTE = {
    id: 'br', templateId: 'tpl',
    dice: { defaultDice: '1d6', logic: 'count-success', engine: 'yze-echelonne' },
    combat: { defaultHealthType: 'hp', statsToTrack: [{ fieldId: 'sante', label: 'Santé', isMainHP: true, max: 'santeMax' }],
        protection: { champ: 'protection', des: 2, label: 'Protection', nomSur: 'protectionNom' } },
    jet: {
        reserve: { base: 2, max: 3, faces: 12 }, sens: 'superieur-ou-egal',
        desEchelonnes: { echelle: 'yze-lettres', plafondDesD12: 0, composantes: [
            { id: 'attribut', label: 'Attribut', sectionId: 'attributs' },
            { id: 'competence', label: 'Compétence', sectionId: 'competences' },
        ] },
        bladeRunner: { sante: 'sante', santeMax: 'santeMax', sangFroid: 'sangFroid', sangFroidMax: 'sangFroidMax', blessures: 'blessuresCritiques', souvenirCle: 'souvenirCle', objetFetiche: 'objetFetiche' },
    },
    bestiaire: { colonnes: [], creatures: [{ id: 'agent-du-lapd-en-uniforme', nom: 'Agent du LAPD en uniforme', valeurs: { armes: 'Matraque de policier' } },
        { id: 'blade-runner', nom: 'Blade Runner', valeurs: { armes: 'Blaster PK-D 5223' } }] },
    catalogue: { objets: [
        { id: 'matraque-de-policier', famille: 'arme', nom: 'Matraque de policier', categorie: 'Armes de combat rapproché', valeurs: { degats: 2 } },
        { id: 'blaster-pk-d-5223', famille: 'arme', nom: 'Blaster PK-D 5223', categorie: 'PK-D 5223', valeurs: { disponibilite: 'Standard' } },
        { id: '44-special', famille: 'arme', nom: '.44 Special', categorie: 'PK-D 5223', valeurs: { degats: 2 } },
        { id: 'munition-sonique', famille: 'arme', nom: 'Munition sonique', categorie: 'PK-D 5223', valeurs: { degats: 1 } },
    ] },
} as unknown as GameDriver;
const FICHE = { id: 'tpl', name: 'Blade Runner', sections: [
    { id: 'attributs', label: 'Attributs', fields: ['vigueur', 'agilite'].map(id => ({ id, label: id === 'agilite' ? 'Agilité' : 'Vigueur', type: 'select', options: LETTRES, defaultValue: 'C (D8)' })) },
    { id: 'competences', label: 'Compétences', fields: [
        { id: 'armesAFeu', label: 'Armes à feu (Agilité)', type: 'select', options: LETTRES, defaultValue: 'D (D6)' },
        { id: 'corpsACorps', label: 'Corps à corps (Vigueur)', type: 'select', options: LETTRES, defaultValue: 'D (D6)' },
    ] },
    { id: 'pistes', label: 'Santé', fields: [{ id: 'sante', label: 'Santé', type: 'number', defaultValue: 0 }, { id: 'santeMax', label: 'Santé max', type: 'number', defaultValue: 0 }] },
] } as unknown as SheetTemplate;
const AGENT_FICHE = { vigueur: 'B (D10)', agilite: 'C (D8)', armesAFeu: 'C (D8)', sante: 5, santeMax: 5 };
const agent = { id: 'agent', name: 'Agent du LAPD 1', isPlayer: false, faction: 'enemy', statuses: [], init: 0,
    sheetData: AGENT_FICHE, origineDuLivre: { creatureId: 'agent-du-lapd-en-uniforme' } } as unknown as Combatant;

let de: ReturnType<typeof vi.spyOn>;
beforeEach(() => { ecrire.mockReset(); de = vi.spyOn(DiceEngine, 'roll'); useCombatStore.getState().reset(); });
afterEach(() => { cleanup(); de.mockRestore(); });

describe('« Attaquer » pour Blade Runner (T9)', () => {
    it('le jet d’un adversaire s’ouvre à Blade Runner, et le bouton paraît', () => {
        expect(jetDuCombattantPossible(agent, PILOTE, FICHE)).toBe(true);
        expect(attaqueSurLaCarte(agent, PILOTE, FICHE)).toBe(true);
        expect(attaqueSurLaCarte({ isPlayer: true }, PILOTE, FICHE), 'jamais pour un PJ').toBe(false);
    });

    it('les armes de l’adversaire viennent du catalogue ; le blaster propose ses munitions', () => {
        expect(armesDeLAdversaire(PILOTE, 'agent-du-lapd-en-uniforme')).toEqual([{ libelle: 'Matraque de policier', degats: 2, categorie: 'Armes de combat rapproché' }]);
        expect(armesDeLAdversaire(PILOTE, 'blade-runner')).toEqual([
            { libelle: 'Blaster PK-D 5223 — .44 Special', degats: 2, categorie: 'PK-D 5223' },
            { libelle: 'Blaster PK-D 5223 — Munition sonique', degats: 1, categorie: 'PK-D 5223' },
        ]);
        expect(armesDeLAdversaire(PILOTE, 'inconnu')).toEqual([]);
        expect(armesDeLAdversaire(PILOTE, undefined)).toEqual([]);
    });

    it('la protection de la cible se lit sur sa fiche', () => {
        expect(protectionLue(PILOTE.combat.protection, { protection: 'C (D8)', protectionNom: 'Gilet pare-balles' }))
            .toEqual({ nom: 'Gilet pare-balles', niveau: 'C (D8)', nombre: 2, faces: 8 });
        expect(protectionLue(PILOTE.combat.protection, { protection: 'Aucune' })).toBeNull();
    });

    it('l’attaque proposée suit l’arme : Vigueur + Corps à corps pour une matraque, Agilité + Armes à feu pour un blaster', () => {
        expect(attaqueParDefaut(PILOTE, armesDeLAdversaire(PILOTE, 'agent-du-lapd-en-uniforme'), AGENT_FICHE))
            .toEqual({ attribut: 'vigueur', competence: 'corpsACorps' });
        expect(attaqueParDefaut(PILOTE, armesDeLAdversaire(PILOTE, 'blade-runner'), {}))
            .toEqual({ attribut: 'agilite', competence: 'armesAFeu' });
        expect(attaqueParDefaut(PILOTE, [], { corpsACorps: 'C (D8)' }), 'sans arme : la compétence portée')
            .toEqual({ attribut: 'vigueur', competence: 'corpsACorps' });
        expect(attaqueParDefaut(PILOTE, [], {}), 'ni arme ni compétence d’attaque').toBeNull();
        expect(attaqueParDefaut({ jet: {} }, [], AGENT_FICHE), 'un autre jeu').toBeNull();
    });

    it('ouvert par « Attaquer » sans dernière attaque, le jet de l’arme est prérempli et dit', () => {
        render(<JetDuCombattant combattant={agent} driver={PILOTE} gabarit={FICHE} valeurs={AGENT_FICHE} auPremierPlan
            cible={{ id: 'rachel', name: 'Rachel' }} armes={armesDeLAdversaire(PILOTE, 'agent-du-lapd-en-uniforme')}
            attaqueProposee={{ attribut: 'vigueur', competence: 'corpsACorps' }} />);
        const [attribut, competence] = screen.getAllByRole('combobox') as HTMLSelectElement[];
        expect([attribut.value, competence.value]).toEqual(['vigueur', 'corpsACorps']);
        expect(document.querySelector('[data-attaque-par-defaut]')!.textContent).toContain('Vigueur + Corps à corps (Vigueur) (Matraque de policier)');
    });

    it('un jet forcé compte toujours des réussites', () => {
        const jet = DiceEngine.rollYZEEchelonne([8, 8]);
        expect(forcerLeJet(jet, { garde: 'reussites-et-uns' } as never, { famille: 'echelonnee', de: () => 7 }).compte).toBe('reussites');
    });

    it('Agilité C + Armes à feu C, Matraque 2, protection de Rachel : le coup calculé et appliqué', () => {
        useCombatStore.getState().addCombatant({ name: 'Rachel', init: 10, hp: 8, hpMax: 8, isPlayer: false, faction: 'player', statuses: [] } as never);
        const rachel = useCombatStore.getState().combatants[0];
        render(<JetDuCombattant combattant={agent} driver={PILOTE} gabarit={FICHE} valeurs={AGENT_FICHE} auPremierPlan
            cible={rachel} armes={armesDeLAdversaire(PILOTE, 'agent-du-lapd-en-uniforme')}
            protectionDeLaCible={{ nom: 'Gilet', niveau: 'C (D8)', nombre: 2, faces: 8 }} />);
        const [attribut, competence] = screen.getAllByRole('combobox');
        fireEvent.change(attribut, { target: { value: 'agilite' } });
        fireEvent.change(competence, { target: { value: 'armesAFeu' } });
        // Deux D8 : 7 et 6 → deux réussites.
        const faces = [7, 6];
        de.mockImplementation(() => faces.shift() ?? 1);
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(de).toHaveBeenCalledTimes(2);

        // L'arme du catalogue est proposée, ses dégâts remplis : 2 + 2 succès − 1 = 3.
        expect((screen.getByLabelText('Arme') as HTMLSelectElement).value).toBe('Matraque de policier');
        expect((screen.getByLabelText('Dégâts de l’arme') as HTMLInputElement).value).toBe('2');
        expect(document.querySelector('[data-calcul-du-coup]')!.textContent).toBe('arme 2 + 2 succès − 1 = 3');

        // La protection de Rachel : deux D8, 6 et 2 → une réussite retirée.
        const protection = [6, 2];
        de.mockImplementation(() => protection.shift() ?? 1);
        fireEvent.click(document.querySelector('[data-lancer-la-protection]')!);
        expect((screen.getByLabelText('Protection retirée') as HTMLInputElement).value).toBe('1');
        fireEvent.click(screen.getByRole('button', { name: 'Appliquer 2 à Rachel' }));
        expect(useCombatStore.getState().combatants[0].hp).toBe(6);
    });
});
