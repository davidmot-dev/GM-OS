import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import EditeurDuBestiaire from './EditeurDuBestiaire';
import type { BestiaireDuJeu, GameDriver } from '../../../../types/drivers';

const confirmer = vi.hoisted(() => vi.fn((_message: string, oui: () => void) => oui()));
vi.mock('../../../../stores/useModalStore', () => ({ gmConfirm: confirmer }));

/**
 * La section « Bestiaire » de l'éditeur du pilote — § 210, étape B (05/11/2026). Les créatures
 * sont celles de Colonial Marines, relues contre le livre le 02/11/2026.
 */
const BESTIAIRE: BestiaireDuJeu = {
    colonnes: [
        { id: 'vitesse', libelle: 'Vitesse', nature: 'nombre' },
        { id: 'sante', libelle: 'Santé', nature: 'nombre', champ: 'sante' },
        { id: 'protection', libelle: 'Protection', nature: 'nombre', champ: 'protection' },
    ],
    creatures: [
        { id: 'goreburster', nom: 'Goreburster XX121AB', categorie: 'Xénomorphes aberrants', valeurs: { vitesse: 3, sante: 6, protection: 6 }, source: { livre: 'Colonial Marines', page: 178 } },
        { id: 'biodrone', nom: 'Biodrone XX121B', nomOriginal: 'Biodrone Xenomorph XX121B', categorie: 'Xénomorphes aberrants',
            valeurs: { vitesse: 2, sante: 6, protection: 8 }, particularites: ['Protection 4 contre le feu'],
            attaques: { table: { univers: 'Alien', table: 'attaques_xenomorphe_rodeur' } }, source: { livre: 'Colonial Marines', page: 178 } },
        { id: 'stade-3', nom: 'Anathème monstrueux', categorie: 'Anathèmes', valeurs: { sante: 'huit' } },
    ],
};
const CHAMPS = [{ id: 'sante', label: 'Santé — Santé' }, { id: 'protection', label: 'Protection — Combat' }, { id: 'mobilite', label: 'Mobilité — Compétences' }];
const pilote = (bestiaire?: BestiaireDuJeu) => ({ id: 'alien', name: 'Alien', bestiaire } as unknown as GameDriver);

afterEach(cleanup);
const monter = (bestiaire?: BestiaireDuJeu) => {
    const onUpdate = vi.fn();
    const rendu = render(<EditeurDuBestiaire driver={pilote(bestiaire)} onUpdate={onUpdate} champsDeLaFiche={CHAMPS} />);
    const dernier = () => onUpdate.mock.calls.at(-1)![0].bestiaire as BestiaireDuJeu;
    return { onUpdate, dernier, ...rendu };
};

describe('EditeurDuBestiaire (§ 210, étape B)', () => {
    it('range les créatures par catégorie, colonnes du jeu en tête, et dit les constats sous la créature', () => {
        const { container } = monter(BESTIAIRE);
        expect(screen.getByText('Xénomorphes aberrants')).toBeTruthy();
        expect(screen.getByText('Anathèmes')).toBeTruthy();
        expect(screen.getAllByText('Vitesse').length).toBeGreaterThanOrEqual(2);
        const anatheme = container.querySelector('[data-creature="stade-3"]')!;
        expect(anatheme.textContent).toContain('« huit » n\'est pas un nombre');
    });

    it('une colonne choisit le champ qu’elle remplit, ou reste au bestiaire', () => {
        const { dernier } = monter(BESTIAIRE);
        const vitesse = screen.getByLabelText('Champ rempli par la colonne Vitesse') as HTMLSelectElement;
        expect(vitesse.value).toBe('');
        fireEvent.change(vitesse, { target: { value: 'mobilite' } });
        expect(dernier().colonnes[0]).toEqual({ id: 'vitesse', libelle: 'Vitesse', nature: 'nombre', champ: 'mobilite' });
        fireEvent.change(screen.getByLabelText('Champ rempli par la colonne Santé'), { target: { value: '' } });
        expect(dernier().colonnes[1]).toEqual({ id: 'sante', libelle: 'Santé', nature: 'nombre' });
    });

    it('le Biodrone déplié montre ce que la fiche de plateau recevra, et ses attaques par table', () => {
        const { container } = monter(BESTIAIRE);
        fireEvent.click(screen.getByText('Biodrone XX121B'));
        expect(container.querySelector('[data-sur-le-plateau]')!.textContent).toContain('Santé 6 · Protection 8');
        expect((screen.getByLabelText('Table d\'attaques') as HTMLInputElement).value).toBe('attaques_xenomorphe_rodeur');
        expect(screen.getByText(/la table Alien \/ attaques_xenomorphe_rodeur sert/)).toBeTruthy();
    });

    it('ajouter une attaque, saisir une valeur, puis supprimer la créature', () => {
        const { dernier, container } = monter(BESTIAIRE);
        fireEvent.click(screen.getByText('Goreburster XX121AB'));
        fireEvent.click(screen.getByText('Ajouter une attaque'));
        expect(dernier().creatures[0].attaques).toEqual({ lignes: [{ de: '', nom: '', effet: '' }] });
        const fiche = container.querySelector('[data-creature="goreburster"]') as HTMLElement;
        fireEvent.change(within(fiche).getByLabelText('Santé'), { target: { value: '' } });
        expect(dernier().creatures[0].valeurs).toEqual({ vitesse: 3, protection: 6 });
        fireEvent.click(screen.getByText('Supprimer la créature'));
        expect(dernier().creatures.map(c => c.id)).toEqual(['biodrone', 'stade-3']);
    });

    it('sans bestiaire : ajouter une colonne puis une créature, qui se déplie', () => {
        const { onUpdate, dernier } = monter(undefined);
        expect(screen.getByText('Aucune créature au bestiaire de ce jeu.')).toBeTruthy();
        fireEvent.click(screen.getByText('Ajouter une colonne'));
        fireEvent.change(screen.getByLabelText('Libellé de la nouvelle colonne'), { target: { value: 'Santé' } });
        fireEvent.click(screen.getByText('Créer'));
        expect(dernier()).toEqual({ colonnes: [{ id: 'sante', libelle: 'Santé', nature: 'nombre' }], creatures: [] });
        fireEvent.click(screen.getByText('Ajouter une créature'));
        fireEvent.change(screen.getByLabelText('Nom de la nouvelle créature'), { target: { value: 'Biodrone XX121B' } });
        fireEvent.click(screen.getByText('Créer'));
        expect(onUpdate.mock.calls.at(-1)![0].bestiaire.creatures).toEqual([{ id: 'biodrone-xx121b', nom: 'Biodrone XX121B', valeurs: {} }]);
        expect((screen.getByRole('button', { name: /Remplir depuis le corpus/ }) as HTMLButtonElement).disabled).toBe(false);
    });
});
