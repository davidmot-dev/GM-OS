import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import EditeurDuCatalogue from './EditeurDuCatalogue';
import type { CatalogueDEquipement, GameDriver } from '../../../../types/drivers';

const confirmer = vi.hoisted(() => vi.fn((_message: string, oui: () => void) => oui()));
vi.mock('../../../../stores/useModalStore', () => ({ gmConfirm: confirmer }));

/**
 * La section « Équipement » de l'éditeur du pilote — § 203, étape B. Les
 * objets sont ceux de Colonial Marines, relus contre le livre le 02/11/2026.
 */
const CATALOGUE: CatalogueDEquipement = {
    colonnes: {
        arme: [
            { id: 'bonus', libelle: 'Bonus', nature: 'nombre' },
            { id: 'degats', libelle: 'Dégâts', nature: 'nombre' },
            { id: 'portee', libelle: 'Portée', nature: 'texte' },
        ],
    },
    objets: [
        { id: 'vp-70ma6', famille: 'arme', nom: 'Pistolet semi-automatique VP-70MA6', nomOriginal: 'VP-70MA6 Semi-Automatic Pistol', categorie: 'Pistolets', valeurs: { bonus: '+2', degats: 1, portee: 'Moyenne' }, poids: '½', cout: '250 $', source: { livre: 'Marines Coloniaux', page: 66 } },
        { id: 'type-4', famille: 'arme', nom: 'Charge de brèche Armat Type 4', categorie: 'Explosifs', valeurs: { degats: 'Puissance 9' } },
        { id: 'palmes-m11', famille: 'materiel', nom: 'Palmes d’ornithorynque M11', valeurs: {} },
    ],
};
const pilote = (catalogue?: CatalogueDEquipement) => ({ id: 'alien', name: 'Alien', catalogue } as unknown as GameDriver);

const monter = (catalogue?: CatalogueDEquipement) => {
    const onUpdate = vi.fn();
    const rendu = render(<EditeurDuCatalogue driver={pilote(catalogue)} onUpdate={onUpdate} />);
    const dernier = () => onUpdate.mock.calls.at(-1)![0].catalogue as CatalogueDEquipement;
    return { onUpdate, dernier, ...rendu };
};

describe('EditeurDuCatalogue', () => {
    it('compte chaque famille et range les armes par catégorie, colonnes du jeu en tête', () => {
        monter(CATALOGUE);
        expect(screen.getByRole('tab', { name: /Armes\s*2/ }).getAttribute('aria-selected')).toBe('true');
        expect(screen.getByRole('tab', { name: /Matériel\s*1/ })).toBeTruthy();
        expect(screen.getByText('Pistolets')).toBeTruthy();
        expect(screen.getByText('Explosifs')).toBeTruthy();
        expect(screen.getAllByText('Dégâts')).toHaveLength(2); // un en-tête par catégorie
        expect(screen.getByText('p. 66')).toBeTruthy();
    });

    it('montre l’avertissement du contrôle sous l’objet qu’il vise', () => {
        monter(CATALOGUE);
        const ligne = screen.getByText('Charge de brèche Armat Type 4').closest('article')!;
        expect(within(ligne).getByRole('status').textContent).toContain('« Puissance 9 » n\'est pas un nombre');
    });

    it('déplie un objet et enregistre une caractéristique modifiée', () => {
        const { dernier } = monter(CATALOGUE);
        fireEvent.click(screen.getByText('Pistolet semi-automatique VP-70MA6'));
        fireEvent.change(screen.getByLabelText('Bonus'), { target: { value: '+3' } });
        expect(dernier().objets[0].valeurs).toEqual({ bonus: '+3', degats: 1, portee: 'Moyenne' });
        // Une case vidée disparaît au lieu de garder une chaîne vide.
        fireEvent.change(screen.getByLabelText('Portée'), { target: { value: '' } });
        expect(dernier().objets[0].valeurs).not.toHaveProperty('portee');
    });

    it('ne propose dans « Emporte » que des objets du catalogue', () => {
        const { dernier } = monter(CATALOGUE);
        fireEvent.click(screen.getByText('Pistolet semi-automatique VP-70MA6'));
        const choix = screen.getByLabelText('Choisir dans le catalogue');
        expect(within(choix).getAllByRole('option').map(o => o.textContent)).toEqual([
            '+ Choisir dans le catalogue', 'Charge de brèche Armat Type 4', 'Palmes d’ornithorynque M11',
        ]);
        fireEvent.change(choix, { target: { value: 'palmes-m11' } });
        expect(dernier().objets[0].contient).toEqual(['palmes-m11']);
    });

    it('crée un catalogue au premier objet ajouté', () => {
        const { dernier } = monter(undefined);
        expect(screen.getByText('Aucun objet de cette famille dans le catalogue.')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Ajouter un objet/ }));
        fireEvent.change(screen.getByLabelText('Nom du nouvel objet'), { target: { value: 'Fusil à impulsion M41A' } });
        fireEvent.click(screen.getByRole('button', { name: 'Créer' }));
        expect(dernier()).toEqual({ colonnes: {}, objets: [{ id: 'fusil-a-impulsion-m41a', famille: 'arme', nom: 'Fusil à impulsion M41A', valeurs: {} }] });
    });

    it('demande avant de retirer une colonne qui porte des valeurs, et les retire avec elle', () => {
        const { dernier } = monter(CATALOGUE);
        fireEvent.click(screen.getByLabelText('Retirer la colonne Portée'));
        expect(confirmer).toHaveBeenCalledWith(expect.stringContaining('dans 1 objet(s)'), expect.any(Function));
        expect(dernier().colonnes.arme!.map(c => c.id)).toEqual(['bonus', 'degats']);
        expect(dernier().objets[0].valeurs).not.toHaveProperty('portee');
    });

    it('fait choisir la compétence d’un effet dans les champs de la fiche, et signale une cible inconnue', () => {
        // David, 02/11 : « je n'arrive pas à configurer les palmes » — la cible était une case libre.
        const palmes: CatalogueDEquipement = { colonnes: {}, objets: [
            { id: 'palmes-m11', famille: 'materiel', nom: 'Palmes', valeurs: {}, effets: [{ cible: 'eau', valeur: 2, texte: 'Bonus de +2 aux tests de Mobilité sous l’eau' }] },
        ] };
        const onUpdate = vi.fn();
        render(<EditeurDuCatalogue driver={pilote(palmes)} onUpdate={onUpdate}
            champsDeLaFiche={[{ id: 'mobilite', label: 'Ag_Mobilité — Compétences' }, { id: 'observation', label: 'Es_Observation — Compétences' }]} />);
        fireEvent.click(screen.getByRole('tab', { name: /Matériel/ }));
        fireEvent.click(screen.getByText('Palmes'));
        const cible = screen.getByLabelText('Compétence visée') as HTMLSelectElement;
        expect(cible.value).toBe('eau');
        expect(within(cible).getByRole('option', { name: 'eau — absent de la fiche' })).toBeTruthy();
        fireEvent.change(cible, { target: { value: 'mobilite' } });
        expect(onUpdate.mock.calls.at(-1)![0].catalogue.objets[0].effets[0]).toMatchObject({ cible: 'mobilite', valeur: 2 });
    });

    it('filtre la liste par la recherche', () => {
        monter(CATALOGUE);
        fireEvent.change(screen.getByLabelText('Chercher un objet'), { target: { value: 'breche' } });
        expect(screen.queryByText('Pistolet semi-automatique VP-70MA6')).toBeNull();
        expect(screen.getByText('Charge de brèche Armat Type 4')).toBeTruthy();
    });
});
