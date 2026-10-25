import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { RessourceDeTable } from '../../../table/RessourcesDeTable';

/**
 * **Le jet complet de NOC depuis la fiche** — 2026-10-13.
 *
 * Le Talent, les dés de destin jusqu'au Domaine (moins les malus de péril), la
 * difficulté, les réserves du Héros — et chaque 1 qui verse son Fiel.
 */
const JET_NOC: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    seuil: [{ id: 'talent', label: 'Talent', sectionId: 'talents' }],
    reserve: { base: 0, max: 10, faces: 10, composantes: [{ id: 'domaine', label: 'Domaine', sectionId: 'domaines' }] },
    difficulte: { min: -1, max: 10, defaut: 0 },
    destin: {
        fiel: 'Fiel',
        peril: [{ champ: 'blessures', label: 'Blessures', seuils: [
            { aPartirDe: 5, label: 'Choqué', domaines: -1 }, { aPartirDe: 8, label: 'Blessure lourde', talents: -1 }] }],
    },
    reservesDuPersonnage: [
        { id: 'vecu', label: 'Vécu', effet: 'bonus', parPoint: 1, epuisement: 'piste', maxParJet: 1, stocks: [{ champ: 'vecu', label: 'Vécu' }] },
        { id: 'espoir', label: 'Espoir', effet: 'des', parPoint: 3, epuisement: 'piste', stocks: [{ champ: 'espoir', label: 'Espoir' }] },
        { id: 'singularite', label: 'Singularité', effet: 'annuleLesUns', parPoint: 1, epuisement: 'piste', stocks: [{ champ: 'singularite', label: 'Singularité' }] },
    ],
};
const DICE = { defaultDice: '1d10', logic: 'count-success' as const, engine: 'pool_explode' as const, successThreshold: 8 };
const FICHE = {
    id: 'tpl-noc', name: 'Héros', emoji: '🌌',
    sections: [
        { id: 'talents', label: 'Talents', fields: [{ id: 'combat', label: 'Combat', type: 'number', defaultValue: 0 }] },
        { id: 'domaines', label: 'Domaines', fields: [{ id: 'action', label: 'Action', type: 'number', defaultValue: 0 }] },
    ],
} as unknown as SheetTemplate;
const FIEL: RessourceDeTable = { id: 'Fiel', label: 'Fiel', proprietaire: 'meneur', depart: 0, min: 0, max: 5, manipulableParLesJoueurs: true, visibleAuxJoueurs: true };

let lancer: ReturnType<typeof vi.spyOn>;
const initial = useSessionOSStore.getState();
beforeEach(() => {
    useSessionOSStore.setState({ campaigns: [{ id: 'c', name: 'NOC', system: 'noc', activeLocationIds: [] }], customGameDrivers: [] } as never);
    useRessourcesDeTableStore.setState({ reserves: {} });
    lancer = vi.spyOn(DiceEngine, 'rollFromConfig');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); useSessionOSStore.setState(initial, true); });

const tirage = (...faces: number[]) => lancer.mockReturnValue({
    total: 0, rolls: faces.map(val => ({ val, sides: 10 })), modifier: 0, successes: 0, fails: 0, tagSuccess: false, totalDisplay: '',
});

const monter = (valeurs: Record<string, unknown>, ecrire = vi.fn(), descripteur = JET_NOC) => {
    render(
        <PanneauDeJet descripteur={descripteur} dice={DICE} template={FICHE} valeurs={valeurs}
            campaignId="c" ressourcesDeTable={[FIEL]} ecrireSurLaFiche={ecrire} />,
    );
    const [talent, domaine] = screen.getAllByRole('combobox');
    fireEvent.change(talent, { target: { value: 'combat' } });
    fireEvent.change(domaine, { target: { value: 'action' } });
    return ecrire;
};
const plus = (nom: string) => fireEvent.click(screen.getByRole('button', { name: nom }));
const lancerLeJet = () => fireEvent.click(screen.getByText('Lancer', { exact: true }));
const fiel = () => useRessourcesDeTableStore.getState().reserves.c?.Fiel ?? 0;

describe('le jet de NOC', () => {
    it('permet de refuser le dé offert par un 10 avant de consigner le Fiel', () => {
        const de = vi.spyOn(DiceEngine, 'roll').mockReturnValueOnce(10).mockReturnValueOnce(1);
        monter({ combat: 1, action: 2 }, vi.fn(), { ...JET_NOC, destin: { ...JET_NOC.destin, desSurDixAuChoix: true } });
        lancerLeJet();
        expect(de).toHaveBeenCalledTimes(2); expect(fiel()).toBe(1);
        expect((screen.getByRole('button', { name: 'Lancer' }) as HTMLButtonElement).disabled).toBe(true);
        plus('Garder ce résultat');
        expect(de).toHaveBeenCalledTimes(2); expect(fiel()).toBe(1);
        expect(screen.queryByRole('button', { name: 'Garder ce résultat' })).toBeNull();
    });
    it('propose aussi les 10 supplémentaires et ne dépense la Singularité utile qu’une fois', () => {
        const de = vi.spyOn(DiceEngine, 'roll').mockReturnValueOnce(10).mockReturnValueOnce(10).mockReturnValueOnce(1);
        const ecrire = monter({ combat: 1, action: 1, singularite: 2 }, vi.fn(), { ...JET_NOC, destin: { ...JET_NOC.destin, desSurDixAuChoix: true } });
        plus('Un point de plus : Singularité'); lancerLeJet();
        plus('Lancer un dé supplémentaire'); plus('Lancer un dé supplémentaire');
        expect(de).toHaveBeenCalledTimes(3); expect(fiel()).toBe(0);
        expect(ecrire).toHaveBeenCalledTimes(1); expect(ecrire).toHaveBeenCalledWith({ singularite: 1 });
        expect(screen.getByText(/niveau 1 \+ 2 réussites/)).toBeTruthy();
    });
    it('le Talent, plus un par dé à 8 et plus, contre la difficulté', () => {
        tirage(8, 3, 10, 5);
        monter({ combat: 2, action: 3 });
        lancerLeJet();
        // Trois dés de destin (le Domaine), le moteur relance les 10 : on lui demande 3.
        expect(lancer.mock.calls[0][1]).toMatchObject({ baseCount: 3 });
        expect(screen.getByText(/Réussite, marge 4 — niveau 2 \+ 2 réussites/)).toBeTruthy();
    });

    it('sous la difficulté, c’est un échec — et rien n’est « excédentaire »', () => {
        tirage(3, 4);
        monter({ combat: 1, action: 2 });
        fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4' } });
        lancerLeJet();
        expect(screen.getByText(/^Échec de 3 degrés — niveau 1 \+ 0 réussite/)).toBeTruthy();
        expect(screen.queryByText(/excédent/)).toBeNull();
    });

    it('les malus de péril : moins de dés de destin, et un niveau plus bas', () => {
        tirage(8);
        monter({ combat: 2, action: 3, blessures: 8 });
        expect(screen.getByText(/Malus : −1 au Domaine, −1 au Talent — Choqué \(Blessures\), Blessure lourde \(Blessures\)/)).toBeTruthy();
        lancerLeJet();
        expect(lancer.mock.calls[0][1]).toMatchObject({ baseCount: 2 });
        expect(screen.getByText(/niveau 1 \+ 1 réussite/)).toBeTruthy();
    });

    it('on lance moins de dés si l’on veut, ou aucun', () => {
        monter({ combat: 3, action: 3 });
        for (let i = 0; i < 3; i++) plus('Un dé de destin de moins');
        lancerLeJet();
        expect(lancer).not.toHaveBeenCalled();
        expect(screen.getByText(/sans provoquer le destin/)).toBeTruthy();
    });

    it('chaque 1 verse une goutte de Fiel dans la jauge de la table', () => {
        tirage(1, 1, 9);
        monter({ combat: 1, action: 3 });
        lancerLeJet();
        expect(fiel()).toBe(2);
    });

    it('la Singularité annule des 1, et seule celle qui sert se dépense', () => {
        tirage(1, 9, 4);
        const ecrire = monter({ combat: 1, action: 3, singularite: 3 });
        plus('Un point de plus : Singularité');
        plus('Un point de plus : Singularité');
        lancerLeJet();
        expect(fiel()).toBe(0);
        expect(ecrire).toHaveBeenCalledWith({ singularite: 2 });
    });

    it('le Vécu : +1 au niveau, un seul par jet ; l’Espoir : trois dés de plus', () => {
        tirage(2, 2, 2, 2, 2, 2);
        const ecrire = monter({ combat: 1, action: 3, vecu: 2, espoir: 4 });
        plus('Un point de plus : Vécu');
        expect((screen.getByRole('button', { name: 'Un point de plus : Vécu' }) as HTMLButtonElement).disabled).toBe(true);
        plus('Un point de plus : Espoir');
        lancerLeJet();
        expect(lancer.mock.calls[0][1]).toMatchObject({ baseCount: 6 });
        expect(screen.getByText(/niveau 2 \+ 0 réussite/)).toBeTruthy();
        expect(ecrire).toHaveBeenCalledWith({ vecu: 1, espoir: 3 });
    });
});
