import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

vi.mock('../../../journal/consignerLeJet', () => ({ consignerLeJet: () => {} }));

import PanneauDeJet from './PanneauDeJet';
import { DiceEngine } from '../../../dice/DiceEngine';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';
import { ressourcesDeLaTable, idDeReserveDuGroupe } from '../../../table/reservesDuGroupe';
import type { DescripteurDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { GameDriver } from '../../../../types/drivers';
import type { Campaign } from '../../../../types/campaign.types';

/**
 * **Puiser dans la Cabale depuis le panneau de jet** — NOC, 2026-10-13.
 *
 * Le Héros lance son Domaine ; il peut y ajouter des dés pris dans le même
 * Domaine de la Cabale (réserve rechargée à chaque scénario), un point de son
 * Espoir commun (trois dés, pris sur la piste de la feuille) ou de son Vécu
 * (plus un au résultat). Ce que ces tests protègent : **les dés arrivent au
 * moteur, et ce qu'on a puisé baisse là où il se tient.**
 */

const JET_NOC: DescripteurDeJet = {
    sens: 'superieur-ou-egal',
    reserve: { base: 0, max: 6, faces: 10, composantes: [{ id: 'domaine', label: 'Domaine', sectionId: 'domaines' }] },
};
const DICE = { defaultDice: '1d10', logic: 'count-success' as const, engine: 'pool_explode' as const, successThreshold: 8 };
const FICHE_HEROS = {
    id: 'tpl-noc', name: 'Héros', emoji: '🌑',
    sections: [{ id: 'domaines', label: 'Domaines', fields: [
        { id: 'action', label: 'Action', type: 'number', defaultValue: 0 },
        { id: 'vie', label: 'Vie', type: 'number', defaultValue: 0 },
    ] }],
} as unknown as SheetTemplate;

const NOC = {
    id: 'noc', name: 'NOC', templateId: 'tpl-noc', jet: JET_NOC,
    ficheDeGroupe: {
        libelle: 'Cabale', gabaritDeLaFiche: 'noc-cabale',
        apports: [
            { id: 'des', label: 'Dés de la Cabale', effet: 'des', parPoint: 1, epuisement: 'scenario', composante: 'domaine',
                stocks: [{ champ: 'domains.action', label: 'Action', pour: 'action' }, { champ: 'domains.life', label: 'Vie', pour: 'vie' }] },
            { id: 'espoir', label: 'Espoir de la Cabale', effet: 'des', parPoint: 3, epuisement: 'piste',
                stocks: [{ champ: 'tracks.espoir', label: 'Espoir' }] },
            { id: 'vecu', label: 'Vécu de la Cabale', effet: 'bonus', parPoint: 1, epuisement: 'piste',
                stocks: [{ champ: 'tracks.vecu', label: 'Vécu' }] },
        ],
    },
} as unknown as GameDriver;

const CAMPAGNE = {
    id: 'c-noc', name: 'Test NOC', system: 'noc', activeLocationIds: [],
    groupe: { sheetData: { 'domains.action': 3, 'domains.life': 1, 'tracks.espoir': 4, 'tracks.vecu': 2 } },
} as Campaign;

const initialSession = useSessionOSStore.getState();
let lancer: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    useSessionOSStore.setState({ campaigns: [CAMPAGNE], customGameDrivers: [NOC], activeCampaignId: 'c-noc' });
    useRessourcesDeTableStore.setState({ reserves: {} });
    lancer = vi.spyOn(DiceEngine, 'rollFromConfig');
});

afterEach(() => {
    cleanup();
    lancer.mockRestore();
    useSessionOSStore.setState(initialSession, true);
});

const monter = (props: Record<string, unknown> = {}) => {
    const campagne = useSessionOSStore.getState().campaigns[0];
    render(
        <PanneauDeJet
            descripteur={JET_NOC} dice={DICE} template={FICHE_HEROS} valeurs={{ action: 2, vie: 1 }}
            campaignId="c-noc" ressourcesDeTable={ressourcesDeLaTable(NOC, campagne)}
            {...props}
        />,
    );
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'action' } });
};

const plus = (label: string) => fireEvent.click(screen.getByRole('button', { name: `Un point de plus : ${label}` }));
const groupe = () => useSessionOSStore.getState().campaigns[0].groupe!.sheetData;
const resteDesDes = (champ: string) =>
    useRessourcesDeTableStore.getState().valeur('c-noc', ressourcesDeLaTable(NOC, useSessionOSStore.getState().campaigns[0]), idDeReserveDuGroupe(champ));

describe('puiser dans la Cabale', () => {
    it('les dés du Domaine et l’Espoir commun arrivent au moteur', () => {
        monter();
        plus('Dés de la Cabale');
        plus('Dés de la Cabale');
        plus('Espoir de la Cabale');
        fireEvent.click(screen.getByText('Lancer', { exact: true }));

        // Action 2, plus deux dés de la Cabale, plus trois pour un point d'Espoir.
        expect(lancer).toHaveBeenCalledTimes(1);
        expect(lancer.mock.calls[0][1]).toMatchObject({ baseCount: 7 });
    });

    it('ce qu’on a puisé baisse là où il se tient', () => {
        monter();
        plus('Dés de la Cabale');
        plus('Dés de la Cabale');
        plus('Espoir de la Cabale');
        fireEvent.click(screen.getByText('Lancer', { exact: true }));

        // Les dés du Domaine : une réserve de scénario, de 3 à 1.
        expect(resteDesDes('domains.action')).toBe(1);
        // L'Espoir : la piste de la feuille, de 4 à 3.
        expect(groupe()['tracks.espoir']).toBe(3);
        // Le Domaine que le Héros n'a pas retenu n'est pas touché.
        expect(resteDesDes('domains.life')).toBe(1);
    });

    it('on ne puise pas plus que ce qui reste', () => {
        monter();
        for (let i = 0; i < 5; i++) plus('Dés de la Cabale');
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(lancer.mock.calls[0][1]).toMatchObject({ baseCount: 2 + 3 });
        expect(resteDesDes('domains.action')).toBe(0);
    });

    it('le Vécu commun s’ajoute au résultat, pas aux dés', () => {
        monter();
        plus('Vécu de la Cabale');
        fireEvent.click(screen.getByText('Lancer', { exact: true }));
        expect(lancer.mock.calls[0][1]).toMatchObject({ baseCount: 2 });
        expect(groupe()['tracks.vecu']).toBe(1);
        expect(screen.getByText(/\+1 Cabale/)).toBeTruthy();
    });

    it('sur la tablette, l’Espoir commun part au meneur', () => {
        const recus: unknown[] = [];
        const ecoute = (e: Event) => recus.push((e as CustomEvent).detail);
        window.addEventListener('groupe:ecrire', ecoute);
        try {
            monter({ pourLesJoueurs: true, personnageId: 'pj-1' });
            plus('Espoir de la Cabale');
            fireEvent.click(screen.getByText('Lancer', { exact: true }));
        } finally {
            window.removeEventListener('groupe:ecrire', ecoute);
        }
        expect(recus).toEqual([{ characterId: 'pj-1', sheetData: { 'tracks.espoir': 3 } }]);
    });
});
