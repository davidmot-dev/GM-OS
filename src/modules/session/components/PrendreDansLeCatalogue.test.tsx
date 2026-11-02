import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PrendreDansLeCatalogue from './PrendreDansLeCatalogue';
import type { CatalogueDEquipement, GameDriver } from '../../../types/drivers';

/**
 * « Prendre dans le catalogue » sur la fiche — § 203, étape D. Les objets sont
 * ceux du livre de base et de Colonial Marines, relus le 02/11/2026.
 */
const EQUIPEMENT = { noms: 'armes', bonus: 'bonus', degats: 'degats', portees: 'portees' };
const CATALOGUE: CatalogueDEquipement = {
    colonnes: {
        arme: [{ id: 'bonus', libelle: 'Bonus', nature: 'nombre' }, { id: 'degats', libelle: 'Dégâts', nature: 'nombre' }, { id: 'portee', libelle: 'Portée', nature: 'texte' }],
        protection: [{ id: 'protection', libelle: 'Protection', nature: 'nombre' }],
    },
    objets: [
        { id: 'm4a3', famille: 'arme', nom: 'Pistolet de service M4A3', categorie: 'Pistolets', valeurs: { bonus: '+2', degats: 1, portee: 'Moyenne' }, source: { livre: 'ALIEN', page: 119 } },
        { id: 'm41a', famille: 'arme', nom: 'Fusil à impulsion Armat M41A', categorie: 'Fusils', valeurs: { bonus: '+1', degats: 2, portee: 'Longue' }, proprietes: ['Lance-grenades intégré', 'Mode auto', 'Perce-armure'], source: { livre: 'ALIEN', page: 120 } },
        { id: 'ak-104s', famille: 'arme', nom: 'Canon à impulsion intégré Norcomm AK-104S', categorie: 'Fusils', valeurs: { degats: 2, portee: 'Longue' } },
        { id: 'ccc5', famille: 'protection', nom: 'Combinaison de compression offensive CCC5', categorie: 'Armures', valeurs: { protection: 2 }, contient: ['ak-104s'] },
        { id: 'palmes', famille: 'materiel', nom: 'Palmes d’ornithorynque M11', valeurs: {} },
    ],
};
const pilote = {
    id: 'alien', name: 'Alien', catalogue: CATALOGUE,
    jet: { alien: { equipement: EQUIPEMENT } },
    combat: { alien: { protection: 'protection', proprietesArmes: 'proprietes' } },
} as unknown as GameDriver;
const FICHE = { armes: 'Arme de recette', bonus: '0', degats: '1', portees: 'Courte', protection: '6' };

const monter = () => {
    const onEcrire = vi.fn();
    const onFermer = vi.fn();
    render(<PrendreDansLeCatalogue driver={pilote} fiche={FICHE} onEcrire={onEcrire} onFermer={onFermer} />);
    return { onEcrire, onFermer };
};

describe('PrendreDansLeCatalogue', () => {
    it('ne propose que les familles que la fiche sait recevoir', () => {
        monter();
        expect(screen.getAllByRole('tab', { name: /Armes|Protections|Matériel|Véhicules/ }).map(t => t.textContent)).toEqual(['Armes3', 'Protections1']);
    });

    it('écrit une arme dans chaque champ, au rang suivant, après l’avoir montré', () => {
        const { onEcrire, onFermer } = monter();
        expect((screen.getByRole('button', { name: /Ajouter à la fiche/ }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.click(screen.getByRole('tab', { name: 'Fusils' }));
        fireEvent.click(screen.getByRole('option', { name: /Fusil à impulsion Armat M41A/ }));
        const encadre = screen.getByRole('complementary', { name: 'Ce qui sera écrit sur la fiche' });
        expect(within(encadre).getByText('Lance-grenades intégré, Mode auto, Perce-armure')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Ajouter à la fiche/ }));
        expect(onEcrire).toHaveBeenCalledWith({
            armes: 'Arme de recette\nFusil à impulsion Armat M41A', bonus: '0\n+1', degats: '1\n2', portees: 'Courte\nLongue',
            proprietes: '\nLance-grenades intégré, Mode auto, Perce-armure',
        });
        expect(onFermer).toHaveBeenCalled();
    });

    it('montre la Protection remplacée, et ajoute ce que la combinaison emporte sauf si on le décoche', () => {
        const { onEcrire } = monter();
        fireEvent.click(screen.getByRole('tab', { name: /Protections/ }));
        fireEvent.click(screen.getByRole('option', { name: /CCC5/ }));
        const encadre = screen.getByRole('complementary', { name: 'Ce qui sera écrit sur la fiche' });
        expect(encadre.textContent).toContain('6 → 2');
        expect(encadre.textContent).toContain('Canon à impulsion intégré Norcomm AK-104S');
        fireEvent.click(within(encadre).getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: /Ajouter à la fiche/ }));
        expect(onEcrire).toHaveBeenCalledWith({ protection: '2' });
    });

    it('avec le Sac à dos : un onglet Matériel, et la protection y entre aussi, une seule fois', () => {
        const onEcrire = vi.fn();
        const onRanger = vi.fn();
        const sac = [{ id: 'i1', name: 'Palmes d’ornithorynque M11', type: 'matériel', rarity: 'commun', quantity: 1, weight: 0.5, description: '', properties: { catalogueId: 'palmes' } }];
        render(<PrendreDansLeCatalogue driver={pilote} fiche={FICHE} onEcrire={onEcrire} onFermer={vi.fn()} sac={sac} onRanger={onRanger} />);
        expect(screen.getByText(/sauf le Sac à dos, qui s’enregistre aussitôt/)).toBeTruthy();
        // Les palmes y sont déjà : rien à ajouter.
        fireEvent.click(screen.getByRole('tab', { name: /Matériel/ }));
        fireEvent.click(screen.getByRole('option', { name: /Palmes/ }));
        expect(screen.getByText(/y est déjà/)).toBeTruthy();
        expect((screen.getByRole('button', { name: /Ajouter à la fiche/ }) as HTMLButtonElement).disabled).toBe(true);
        // La CCC5 : sa Protection sur la fiche, et elle-même au Sac à dos ; son canon sur la fiche.
        fireEvent.click(screen.getByRole('tab', { name: /Protections/ }));
        fireEvent.click(screen.getByRole('option', { name: /CCC5/ }));
        fireEvent.click(screen.getByRole('button', { name: /Ajouter à la fiche/ }));
        expect(onEcrire.mock.calls[0][0]).toMatchObject({ protection: '2', armes: 'Arme de recette\nCanon à impulsion intégré Norcomm AK-104S' });
        expect(onRanger).toHaveBeenCalledTimes(1);
        expect(onRanger.mock.calls[0][0]).toMatchObject({ name: 'Combinaison de compression offensive CCC5', type: 'protection', properties: { catalogueId: 'ccc5' } });
    });

    it('cherche dans le catalogue', () => {
        monter();
        fireEvent.change(screen.getByLabelText('Chercher dans le catalogue'), { target: { value: 'M4A3' } });
        expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([expect.stringContaining('Pistolet de service M4A3')]);
    });
});
