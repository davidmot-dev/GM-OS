import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import EditeurDesTablesDeButin from './EditeurDesTablesDeButin';
import type { GameDriver, LootTable } from '../../../../types/drivers';

vi.mock('react-i18next', () => ({ useTranslation: () => ({
    t: (cle: string, options?: Record<string, unknown>) => (options && 'nom' in options ? `${cle}:${String(options.nom)}` : cle),
}) }));

/**
 * **L'éditeur des tables de butin et le catalogue du pilote** — registre § 264, T5
 * (19/11/2026). Décisions de David : « Lien vivant », « Les deux » gestes. Objets du
 * catalogue d'Alien 1.11.0.
 */
const CLE = 'modules:session.rule_engine_editor.loot';
const CATALOGUE = {
    colonnes: {},
    objets: [
        { id: 'm4a3', famille: 'arme', nom: 'Pistolet M4A3', categorie: 'Pistolets', valeurs: {} },
        { id: 'vp70', famille: 'arme', nom: 'Pistolet VP70', categorie: 'Pistolets', valeurs: {} },
        { id: 'm41a', famille: 'arme', nom: 'Fusil M41A', categorie: 'Fusils', valeurs: {} },
    ],
};
const CASIER: LootTable = { id: 'casier', name: 'Casier', rollMode: 'weighted', rolls: '1', entries: [
    { name: 'Ration', type: 'item', weight: 2, minAmount: '1', metadata: { value: 5 } },
] };

let dernier: GameDriver;
const monter = (pilote: Partial<GameDriver>) => {
    dernier = { id: 'alien', name: 'Alien', ...pilote } as GameDriver;
    const Banc = () => {
        const [d, setD] = useState(dernier);
        // Le pilote que l'éditeur écrit : celui que la Forge enregistrerait.
        return <EditeurDesTablesDeButin driver={d} onUpdate={patch => { dernier = { ...dernier, ...patch }; setD(dernier); }} />;
    };
    render(<Banc />);
};
const fenetre = () => screen.getByRole('dialog', { name: 'Choisir dans le catalogue' });

describe('sans catalogue, rien ne change (C6)', () => {
    it('ni bouton du catalogue, ni type « Objet du catalogue » ; la ligne tapée à la main garde ses champs', () => {
        monter({ lootTables: [CASIER] });
        expect(screen.queryByText(`${CLE}.catalogue.create_btn`)).toBeNull();
        expect(screen.queryByText(`${CLE}.catalogue.add_btn`)).toBeNull();
        expect(screen.queryByRole('option', { name: `${CLE}.entry_types.catalogue` })).toBeNull();
        expect(screen.getByText(`${CLE}.value_label`)).toBeTruthy();
    });
});

describe('avec le catalogue du pilote', () => {
    it('« Nouvelle table depuis le catalogue » : toute une catégorie devient une table nommée, poids égaux (C10)', () => {
        monter({ catalogue: CATALOGUE as never, lootTables: [CASIER] });
        fireEvent.click(screen.getByText(`${CLE}.catalogue.create_btn`));
        fireEvent.click(within(fenetre()).getByRole('tab', { name: 'Pistolets' }));
        fireEvent.click(within(fenetre()).getByRole('checkbox', { name: 'Toute la catégorie' }));
        fireEvent.click(within(fenetre()).getByRole('button', { name: new RegExp(`${CLE}.catalogue.create_geste`) }));
        expect(screen.queryByRole('dialog', { name: 'Choisir dans le catalogue' })).toBeNull();
        const neuve = dernier.lootTables![1];
        expect(neuve).toMatchObject({ name: 'Pistolets', rollMode: 'weighted', rolls: '1' });
        expect(neuve.entries).toEqual([
            { name: 'Pistolet M4A3', type: 'catalogue', weight: 1, minAmount: '1', metadata: { catalogueId: 'm4a3', rarity: 'common' } },
            { name: 'Pistolet VP70', type: 'catalogue', weight: 1, minAmount: '1', metadata: { catalogueId: 'vp70', rarity: 'common' } },
        ]);
    });

    it('« Ajouter depuis le catalogue » : les objets cochés s’ajoutent à cette table, après ses lignes (C1)', () => {
        monter({ catalogue: CATALOGUE as never, lootTables: [CASIER] });
        fireEvent.click(screen.getByText(`${CLE}.catalogue.add_btn`));
        fireEvent.click(within(fenetre()).getByRole('tab', { name: 'Fusils' }));
        fireEvent.click(within(fenetre()).getByRole('option', { name: /Fusil M41A/ }));
        fireEvent.click(within(fenetre()).getByRole('button', { name: new RegExp(`${CLE}.catalogue.add_geste`) }));
        expect(dernier.lootTables![0].entries.map(e => [e.name, e.type, e.metadata?.catalogueId])).toEqual([
            ['Ration', 'item', undefined], ['Fusil M41A', 'catalogue', 'm41a'],
        ]);
    });

    it('une ligne du catalogue montre le nom de son objet, sa famille, sa rareté, sans valeur ni masse à taper', () => {
        monter({ catalogue: CATALOGUE as never, lootTables: [{ ...CASIER, entries: [
            { name: 'Ancien nom', type: 'catalogue', weight: 1, minAmount: '1', metadata: { catalogueId: 'm41a', rarity: 'common' } },
        ] }] });
        const ligne = document.querySelector('[data-ligne-du-catalogue="m41a"]') as HTMLElement;
        expect(ligne).toBeTruthy();
        expect(screen.getByDisplayValue('Fusil M41A')).toHaveAttribute('readonly');
        expect(within(ligne).getByText('Arme · Fusils')).toBeTruthy();
        expect(within(ligne).getByText(`${CLE}.catalogue.badge`)).toBeTruthy();
        expect(screen.queryByText(`${CLE}.value_label`)).toBeNull();
        expect(screen.queryByText(`${CLE}.mass_label`)).toBeNull();
    });

    it('changer l’objet d’une ligne garde le lien et met à jour son nom', () => {
        monter({ catalogue: CATALOGUE as never, lootTables: [{ ...CASIER, entries: [
            { name: 'Fusil M41A', type: 'catalogue', weight: 3, minAmount: '1', metadata: { catalogueId: 'm41a', rarity: 'rare' } },
        ] }] });
        fireEvent.change(screen.getByLabelText(`${CLE}.catalogue.object_label`), { target: { value: 'vp70' } });
        expect(dernier.lootTables![0].entries[0]).toEqual(
            { name: 'Pistolet VP70', type: 'catalogue', weight: 3, minAmount: '1', metadata: { catalogueId: 'vp70', rarity: 'rare' } },
        );
    });

    it('un objet disparu du catalogue se dit sur la ligne (C5)', () => {
        monter({ catalogue: CATALOGUE as never, lootTables: [{ ...CASIER, entries: [
            { name: 'Lance-flammes M240', type: 'catalogue', weight: 1, metadata: { catalogueId: 'm240' } },
        ] }] });
        expect(screen.getByRole('alert')).toHaveTextContent(`${CLE}.catalogue.missing:Lance-flammes M240`);
    });
});
