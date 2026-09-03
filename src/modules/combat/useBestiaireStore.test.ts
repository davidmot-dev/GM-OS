import { describe, it, expect, beforeEach } from 'vitest';
import { useBestiaireStore } from './useBestiaireStore';

/**
 * **Le bestiaire, et les deux règles qui évitent qu'il devienne inutilisable.**
 *
 * Un bestiaire se consulte en pleine séance : s'il se remplit de doublons, on
 * cesse de l'ouvrir. Et s'il ne retient pas ce que le meneur a corrigé, il lui
 * repose la même question chaque fois.
 */

const vider = () => useBestiaireStore.setState({ gabarits: [], repartitions: {} });

const pillard = {
    jeuId: 'blade-runner',
    nom: 'Pillard',
    archetypeId: 'brute',
    rangId: 'pietaille',
    sheetData: { force: 'B (D10)' },
};

describe('useBestiaireStore', () => {
    beforeEach(vider);

    it('range un gabarit et le rend pour son jeu', () => {
        useBestiaireStore.getState().enregistrer(pillard);
        const liste = useBestiaireStore.getState().gabaritsDuJeu('blade-runner');
        expect(liste).toHaveLength(1);
        expect(liste[0].nom).toBe('Pillard');
        expect(liste[0].id).toBeTruthy();
    });

    it('⚠️ ne mélange pas les bestiaires de deux jeux', () => {
        /*
          Un pillard de Blade Runner n'a rien à faire dans une partie d'Alien :
          ses caractéristiques sont dans une autre échelle, et il serait
          injouable sans que rien ne le signale.
        */
        useBestiaireStore.getState().enregistrer(pillard);
        useBestiaireStore.getState().enregistrer({ ...pillard, jeuId: 'alien', nom: 'Ouvrier' });
        expect(useBestiaireStore.getState().gabaritsDuJeu('blade-runner')).toHaveLength(1);
        expect(useBestiaireStore.getState().gabaritsDuJeu('alien')[0].nom).toBe('Ouvrier');
    });

    it('remplace au lieu d’empiler quand le nom revient pour le même jeu', () => {
        useBestiaireStore.getState().enregistrer(pillard);
        const avant = useBestiaireStore.getState().gabaritsDuJeu('blade-runner')[0].id;

        useBestiaireStore.getState().enregistrer({ ...pillard, nom: ' pillard ', rangId: 'elite' });

        const liste = useBestiaireStore.getState().gabaritsDuJeu('blade-runner');
        expect(liste).toHaveLength(1);
        expect(liste[0].rangId).toBe('elite');
        expect(liste[0].id).toBe(avant); // le même gabarit, retouché
    });

    it('garde deux gabarits distincts quand les noms diffèrent', () => {
        useBestiaireStore.getState().enregistrer(pillard);
        useBestiaireStore.getState().enregistrer({ ...pillard, nom: 'Chien de garde' });
        expect(useBestiaireStore.getState().gabaritsDuJeu('blade-runner')).toHaveLength(2);
    });

    it('rend le plus récent en premier', () => {
        useBestiaireStore.getState().enregistrer(pillard);
        useBestiaireStore.getState().enregistrer({ ...pillard, nom: 'Sentinelle' });
        expect(useBestiaireStore.getState().gabaritsDuJeu('blade-runner')[0].nom).toBe('Sentinelle');
    });

    it('oublie ce qu’on lui demande d’oublier', () => {
        useBestiaireStore.getState().enregistrer(pillard);
        const id = useBestiaireStore.getState().gabaritsDuJeu('blade-runner')[0].id;
        useBestiaireStore.getState().oublier(id);
        expect(useBestiaireStore.getState().gabaritsDuJeu('blade-runner')).toHaveLength(0);
    });

    it('retient la répartition corrigée par le meneur, par jeu et par archétype', () => {
        const repartition = { favorises: ['force'], negliges: ['analyse'] };
        useBestiaireStore.getState().retenirLaRepartition('alien', 'brute', repartition);

        expect(useBestiaireStore.getState().repartitionRetenue('alien', 'brute')).toEqual(repartition);
        /* Un autre archétype, ou un autre jeu, n'hérite de rien. */
        expect(useBestiaireStore.getState().repartitionRetenue('alien', 'tireur')).toBeNull();
        expect(useBestiaireStore.getState().repartitionRetenue('dune', 'brute')).toBeNull();
    });
});
