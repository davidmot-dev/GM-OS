import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ChoisirDansLeCatalogue from './ChoisirDansLeCatalogue';
import type { GameDriver } from '../../../types/drivers';
import { lignesDepuisLeCatalogue, nomDUneTableDuCatalogue, tableDepuisLeCatalogue } from '../../equipement/butinDuCatalogue';

/**
 * **La fenêtre du butin** — registre § 264, T4 (19/11/2026) : la liste de « Prendre
 * dans le catalogue », sur les quatre familles, en choix multiple ; elle rend les
 * objets cochés à qui l'ouvre. Objets tirés du catalogue d'Alien 1.11.0.
 */
const OBJETS = [
    { id: 'm4a3', famille: 'arme', nom: 'Pistolet M4A3', categorie: 'Pistolets', valeurs: {} },
    { id: 'vp70', famille: 'arme', nom: 'Pistolet VP70', categorie: 'Pistolets', valeurs: {} },
    { id: 'm41a', famille: 'arme', nom: 'Fusil M41A', categorie: 'Fusils', valeurs: {} },
    { id: 'daihotai', famille: 'vehicule', nom: 'Daihotai', categorie: 'Véhicules terrestres', valeurs: {} },
] as const;
const pilote = (objets: readonly object[] = OBJETS) => ({ id: 'alien', name: 'Alien', catalogue: { colonnes: {}, objets } }) as unknown as GameDriver;

const ouvrir = (driver = pilote()) => {
    const onValider = vi.fn();
    const onFermer = vi.fn();
    render(<ChoisirDansLeCatalogue driver={driver} geste="Ajouter à la table" explication="Chaque objet devient une ligne." onValider={onValider} onFermer={onFermer} />);
    return { onValider, onFermer };
};

describe('ChoisirDansLeCatalogue', () => {
    it('montre les quatre familles — un butin peut contenir un véhicule — et l’explication', () => {
        ouvrir();
        expect(screen.getAllByRole('tab', { name: /Armes|Protections|Véhicules|Matériel/ }).map(t => t.textContent)).toEqual(['Armes3', 'Protections0', 'Véhicules1', 'Matériel0']);
        expect(screen.getByText('Chaque objet devient une ligne.')).toBeTruthy();
    });

    it('s’ouvre sur la première famille qui a des objets', () => {
        ouvrir(pilote([{ id: 'trousse', famille: 'materiel', nom: 'Trousse', valeurs: {} }]));
        expect(screen.getByRole('tab', { name: /Matériel/ })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('option', { name: /Trousse/ })).toBeTruthy();
    });

    it('rend les objets cochés, toutes familles confondues, dans l’ordre du catalogue, puis se ferme', () => {
        const { onValider, onFermer } = ouvrir();
        const valider = screen.getByRole('button', { name: /Ajouter à la table/ });
        expect(valider).toBeDisabled();
        expect(screen.getByText('Aucun objet choisi')).toBeTruthy();
        fireEvent.click(screen.getByRole('tab', { name: /Véhicules/ }));
        fireEvent.click(screen.getByRole('option', { name: /Daihotai/ }));
        fireEvent.click(screen.getByRole('tab', { name: /Armes/ }));
        fireEvent.click(screen.getByRole('tab', { name: 'Pistolets' }));
        fireEvent.click(screen.getByRole('checkbox', { name: 'Toute la catégorie' }));
        expect(screen.getByText('3 objets choisis')).toBeTruthy();
        fireEvent.click(valider);
        expect(onValider.mock.calls[0][0].map((o: { id: string }) => o.id)).toEqual(['m4a3', 'vp70', 'daihotai']);
        expect(onFermer).toHaveBeenCalled();
    });

    it('« Tout décocher » vide la sélection ; « Annuler » et Échap ferment sans rien rendre', () => {
        const { onValider, onFermer } = ouvrir();
        fireEvent.click(screen.getByRole('tab', { name: 'Fusils' }));
        fireEvent.click(screen.getByRole('option', { name: /Fusil M41A/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Tout décocher' }));
        expect(screen.getByText('Aucun objet choisi')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(onFermer).toHaveBeenCalledTimes(2);
        expect(onValider).not.toHaveBeenCalled();
    });
});

describe('les lignes et la table tirées d’une sélection (C10)', () => {
    const [m4a3, vp70, m41a] = OBJETS as unknown as Parameters<typeof lignesDepuisLeCatalogue>[0];

    it('une ligne par objet, qui le désigne, poids 1, quantité 1, rareté donnée', () => {
        expect(lignesDepuisLeCatalogue([m4a3], 'common')).toEqual([
            { name: 'Pistolet M4A3', type: 'catalogue', weight: 1, minAmount: '1', metadata: { catalogueId: 'm4a3', rarity: 'common' } },
        ]);
    });

    it('la table porte le nom de la catégorie partagée, sinon « Sélection du catalogue »', () => {
        expect(nomDUneTableDuCatalogue([m4a3, vp70])).toBe('Pistolets');
        expect(nomDUneTableDuCatalogue([m4a3, m41a])).toBe('Sélection du catalogue');
        expect(nomDUneTableDuCatalogue([{ ...m4a3, categorie: undefined }])).toBe('Sélection du catalogue');
    });

    it('une table neuve : poids égaux, un seul tirage parmi la liste', () => {
        const t = tableDepuisLeCatalogue([m4a3, vp70], 'common', 'table-1');
        expect(t).toMatchObject({ id: 'table-1', name: 'Pistolets', rolls: '1', rollMode: 'weighted' });
        expect(t.entries.map(e => [e.metadata?.catalogueId, e.weight])).toEqual([['m4a3', 1], ['vp70', 1]]);
    });
});
