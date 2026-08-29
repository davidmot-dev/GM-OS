import { describe, it, expect, beforeEach } from 'vitest';
import { useBibliothequeDesFiches } from './useBibliothequeDesFiches';

/**
 * **La copie de sauvegarde de la bibliothèque du moteur — chantier n° 5.**
 *
 * Elle vit dans l'IndexedDB de l'origine `gmos://`, que la sauvegarde automatique
 * ne voit pas : *le magasin qui détient la vérité d'une fiche serait le seul non
 * protégé*, dans une application qui a perdu ses campagnes deux fois.
 */

const sauvegarde = (...noms: string[]) => ({
    format: 'character-sheet-manager-backup',
    version: 1,
    templates: [],
    characters: noms.map(name => ({ id: name, name, data: {} })),
});

beforeEach(() => useBibliothequeDesFiches.getState().oublier());

describe('retenirLInstantane', () => {
    it('garde le contenu tel quel, avec sa date et son compte', () => {
        const contenu = sauvegarde('Rick', 'Roy');
        useBibliothequeDesFiches.getState().retenirLInstantane(contenu);

        const instantane = useBibliothequeDesFiches.getState().instantane!;
        expect(instantane.contenu, 'le contenu ne se transforme pas').toBe(contenu);
        expect(instantane.personnages).toBe(2);
        expect(Date.parse(instantane.priseLe)).not.toBeNaN();
    });

    /**
     * **Le garde-fou qui empêche ce filet de devenir le second mécanisme de
     * perte.** Le moteur répond aussi quand sa base vient d'être ouverte sur un
     * profil neuf, ou quand la bibliothèque a été vidée à la main. Écraser une
     * copie de quatre personnages par une copie vide archiverait le vide.
     *
     * *C'est le refus de rétrécissement de la sauvegarde automatique, appliqué
     * ici mot pour mot.*
     */
    it('un instantané vide n’en remplace jamais un plein', () => {
        const store = useBibliothequeDesFiches.getState();
        store.retenirLInstantane(sauvegarde('Rick', 'Roy', 'Pris', 'Gaff'));
        const avant = useBibliothequeDesFiches.getState().instantane!;

        store.retenirLInstantane(sauvegarde());
        expect(useBibliothequeDesFiches.getState().instantane).toBe(avant);

        store.retenirLInstantane({ pas: 'la bonne forme' });
        expect(useBibliothequeDesFiches.getState().instantane).toBe(avant);
    });

    /** Mais une première copie vide se garde : il n'y a rien à protéger. */
    it('accepte une bibliothèque vide quand il n’y avait rien', () => {
        useBibliothequeDesFiches.getState().retenirLInstantane(sauvegarde());
        expect(useBibliothequeDesFiches.getState().instantane?.personnages).toBe(0);
    });

    /** Une bibliothèque qui rétrécit sans se vider est une suppression voulue. */
    it('accepte un rétrécissement qui n’est pas un effacement', () => {
        const store = useBibliothequeDesFiches.getState();
        store.retenirLInstantane(sauvegarde('Rick', 'Roy', 'Pris'));
        store.retenirLInstantane(sauvegarde('Rick'));

        expect(useBibliothequeDesFiches.getState().instantane?.personnages).toBe(1);
    });

    it('remplace une copie plus ancienne par une plus récente', () => {
        const store = useBibliothequeDesFiches.getState();
        store.retenirLInstantane(sauvegarde('Rick'));
        const premiere = useBibliothequeDesFiches.getState().instantane!;

        store.retenirLInstantane(sauvegarde('Rick', 'Roy'));
        const seconde = useBibliothequeDesFiches.getState().instantane!;

        expect(seconde).not.toBe(premiere);
        expect(seconde.personnages).toBe(2);
    });
});
