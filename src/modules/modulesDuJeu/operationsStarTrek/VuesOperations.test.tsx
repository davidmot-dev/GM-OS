import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import * as op from '../../../../outils/star-trek/operations/moteur.mjs';
import type { CommandeOperations, EtatOperations } from '../../../../outils/star-trek/operations/moteur.mjs';
import { PupitreOperations, VueEquipageOperations } from './VuesOperations';

/** Le pupitre et la tablette de la bataille spatiale, sur un état produit par le vrai moteur. */
const MJ = { role: 'mj' as const };
const etat = (): EtatOperations => [
    { id: 'vaisseau', charge: { vaisseau: { id: 'defiant', nom: 'Defiant', camp: 'joueurs', envergure: 3, bonusResistance: 0, bonusBoucliers: 0, qualiteEquipage: null,
        systemes: { communications: 8, ordinateurs: 9, moteurs: 11, detecteurs: 9, structure: 9, armement: 13 },
        fonctions: { commandement: 2, navigation: 3, ingenierie: 2, securite: 5, medecine: 1, science: 1 },
        armes: [{ id: 'canons', nom: 'Canons phaseurs', type: 'energie', degats: 5, portee: 'courte', qualites: ['Polyvalent'] }] } } },
    { id: 'vaisseau', charge: { vaisseau: { id: 'lakota', nom: 'Lakota', camp: 'adverse', envergure: 5, bonusResistance: 0, bonusBoucliers: 0, qualiteEquipage: 'exceptionnel',
        systemes: { communications: 9, ordinateurs: 10, moteurs: 9, detecteurs: 9, structure: 10, armement: 10 }, armes: [],
        fonctions: { commandement: 3, navigation: 2, ingenierie: 3, securite: 3, medecine: 2, science: 2 } } } },
    { id: 'tache', charge: { tache: { id: 'mine', nom: 'Désamorcer la mine', genre: 'etendue', jauge: 12, difficulte: 3, obstacle: 1 } } },
].reduce<EtatOperations>((e, c) => op.appliquerCommande(e, c as CommandeOperations, MJ), op.creerEtat());

afterEach(cleanup);

describe('le pupitre des opérations', () => {
    it('montre les Boucliers, la Résistance et les dégâts de l’arme avec le bonus d’Armement', () => {
        render(<PupitreOperations vue={op.vuePour(etat(), MJ)} envoyerCommande={vi.fn()} />);
        const defiant = document.querySelector('[data-vaisseau="defiant"]') as HTMLElement;
        expect(within(defiant).getByText(/Envergure 3 · Résistance 4/)).toBeTruthy();
        expect(within(defiant).getByText('17 / 17')).toBeTruthy();
        expect(within(defiant).getByText(/Canons phaseurs — énergie, difficulté 2, portée courte, dégâts 9/)).toBeTruthy();
    });

    it('applique une attaque : l’arme de l’attaquant remplit les dégâts', async () => {
        const envoyer = vi.fn().mockResolvedValue({ ok: true });
        render(<PupitreOperations vue={op.vuePour(etat(), MJ)} envoyerCommande={envoyer} />);
        const zone = document.querySelector('[data-attaque-spatiale]') as HTMLElement;
        const [attaquant, arme, cible] = within(zone).getAllByRole('combobox');
        fireEvent.change(attaquant, { target: { value: 'defiant' } });
        fireEvent.change(arme, { target: { value: 'canons' } });
        fireEvent.change(cible, { target: { value: 'lakota' } });
        expect((within(zone).getByLabelText('Dégâts de l’attaque') as HTMLInputElement).value).toBe('9');
        fireEvent.click(within(zone).getByText('Appliquer les dégâts'));
        expect(envoyer).toHaveBeenCalledWith({ id: 'attaque', charge: expect.objectContaining({ cibleId: 'lakota', degats: 9, attaquantId: 'defiant', armeId: 'canons' }) });
    });

    it('coche l’impact d’une tâche étendue réussie', () => {
        const envoyer = vi.fn().mockResolvedValue({ ok: true });
        render(<PupitreOperations vue={op.vuePour(etat(), MJ)} envoyerCommande={envoyer} />);
        const tache = document.querySelector('[data-tache-etendue="mine"]') as HTMLElement;
        fireEvent.click(within(tache).getByText('Tâche réussie : cocher l’impact'));
        expect(envoyer).toHaveBeenCalledWith({ id: 'impact', charge: { tacheId: 'mine', fonction: 3, efforts: 0, complications: 0 } });
    });
});

describe('la tablette de l’équipage', () => {
    it('voit son vaisseau, l’adversaire de loin, sans aucune commande', () => {
        render(<VueEquipageOperations vue={op.vuePour(etat(), { role: 'joueur', personnageId: 'kira' })} envoyerCommande={vi.fn()} />);
        expect(document.querySelector('[data-vaisseau="defiant"]')).toBeTruthy();
        expect(screen.getByText(/Envergure 5 · Boucliers 100 % · 0 brèche/)).toBeTruthy();
        expect(screen.queryByText('Appliquer les dégâts')).toBeNull();
        expect(screen.queryByText('Retirer')).toBeNull();
    });
});
