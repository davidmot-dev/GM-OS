import { describe, expect, it } from 'vitest';
// `node:fs` n'existe pas dans le projet d'essais `renderer` : les fiches se lisent par Vite.
import BESTIAIRE from '../../../docs/systems/coc/rules/bestiaire-du-livre-de-base.md?raw';
import ROLES from '../../../docs/systems/coc/rules/la-gestion-simplifiee-des-adversaires-par-roles-et-bandes-de-sbires.md?raw';
import { estUneFicheDeBestiaire, remplirLeBestiaire } from './depuisLeCorpus';
import { controlerLeBestiaire } from './bestiaire';

/**
 * **Le bestiaire de COC** — transcrit du livre le 06/11/2026 (chapitre 8, « Rencontres »,
 * p. 108-119), à la demande de David (*« refait la fiche des adversaires »*) : la reforge des
 * adversaires réintroduisait deux règles absentes du livre, et les profils humains et les créatures
 * du chapitre n'étaient dans aucune fiche.
 */
const LIVRE = 'Chroniques Oubliées Contemporain — Livre de règles';
const { bestiaire, journal } = remplirLeBestiaire(undefined, [
    { chemin: 'docs/systems/coc/rules/la-gestion-simplifiee-des-adversaires-par-roles-et-bandes-de-sbires.md', contenu: ROLES, livre: LIVRE },
    { chemin: 'docs/systems/coc/rules/bestiaire-du-livre-de-base.md', contenu: BESTIAIRE, livre: LIVRE },
]);
const parNom = (nom: string) => bestiaire.creatures.find(c => c.nom === nom)!;

describe('le bestiaire de COC, depuis le livre', () => {
    it('trois rôles, six profils humains et neuf créatures ; toutes les lignes lues', () => {
        expect(estUneFicheDeBestiaire(ROLES)).toBe(true);
        expect(estUneFicheDeBestiaire(BESTIAIRE)).toBe(true);
        expect(bestiaire.creatures.map(c => c.nom)).toEqual([
            'Figurant', 'Second rôle', 'Premier rôle',
            'Gamin des rues', 'Gros bras / agent de sécurité', 'Officier de police', 'Explorateur', 'Universitaire âgé', 'Leader politique',
            'Rat', 'Serpent venimeux', 'Aigle', 'Grand chien', 'Gorille', 'Tigre', 'Cheval', 'Crocodile', "Éléphant d'Afrique",
        ]);
        expect(journal.lignesNonLues).toEqual([]);
        expect(controlerLeBestiaire(bestiaire)).toEqual([]);
    });

    it('le tigre (p. 118) : ses chiffres, sa catégorie et sa page', () => {
        const tigre = parNom('Tigre');
        expect(tigre.categorie).toBe('Moyen');
        expect(tigre.valeurs).toMatchObject({ tai: 4, def: 12, init: 14, 'echelle-de-sante': 20 });
        expect(tigre.source).toMatchObject({ livre: LIVRE, page: 118 });
    });

    it('l’échelle de santé Pulp est une précision, pas une autre valeur', () => {
        const gamin = parNom('Gamin des rues');
        expect(gamin.valeurs['echelle-de-sante']).toBe(12);
        expect(gamin.particularites).toContain('Échelle de santé Pulp 4');
    });
});
