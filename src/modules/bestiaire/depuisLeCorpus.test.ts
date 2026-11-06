import { describe, expect, it } from 'vitest';
// `node:fs` n'existe pas dans le projet d'essais `renderer` : la fiche se lit par Vite.
import CONTENU from '../../../docs/systems/alien/supplements/colonial-marines/rules/nouvelles-variantes-de-xenomorphes-et-anathemes.md?raw';
import { estUneFicheDeBestiaire, remplirLeBestiaire, type FicheDuBestiaire } from './depuisLeCorpus';
import { controlerLeBestiaire, ficheDePlateau } from './bestiaire';

/**
 * **Remplir le bestiaire depuis les fiches relues** — § 210, étape C (05/11/2026). La fiche est
 * celle de Colonial Marines, mise au format le même jour et relue contre le livre (p. 176-181).
 */
const CHEMIN = 'docs/systems/alien/supplements/colonial-marines/rules/nouvelles-variantes-de-xenomorphes-et-anathemes.md';
const FICHE: FicheDuBestiaire = { chemin: CHEMIN, contenu: CONTENU, livre: 'Colonial Marines Operations Manual' };

describe('le bestiaire lu dans la fiche relue des xénomorphes (p. 176-181)', () => {
    const { bestiaire, journal } = remplirLeBestiaire(undefined, [FICHE]);
    const parNom = (nom: string) => bestiaire.creatures.find(c => c.nom === nom)!;

    it('reconnaît la fiche, déclare les six colonnes du jeu et range trois créatures', () => {
        expect(estUneFicheDeBestiaire(FICHE.contenu)).toBe(true);
        expect(journal.colonnesAjoutees).toEqual([
            { libelle: 'Vitesse', nature: 'nombre' }, { libelle: 'Santé', nature: 'nombre' },
            { libelle: 'Mobilité', nature: 'nombre' }, { libelle: 'Observation', nature: 'nombre' },
            { libelle: 'Protection', nature: 'nombre' }, { libelle: 'Éclaboussure d\'acide', nature: 'nombre' },
        ]);
        expect(bestiaire.creatures.map(c => [c.nom, c.categorie, c.source?.page])).toEqual([
            ['Biodrone XX121B', 'Xénomorphes aberrants', 176],
            ['Goreburster XX121AB', 'Xénomorphes aberrants', 177],
            ['Anathème monstrueux', 'Anathèmes', 180],
        ]);
        expect(controlerLeBestiaire(bestiaire)).toEqual([]);
    });

    it('le Biodrone : ses chiffres, sa protection au feu en particularité, son nom anglais', () => {
        const b = parNom('Biodrone XX121B');
        expect(b.valeurs).toEqual({ vitesse: 2, sante: 6, mobilite: 8, observation: 10, protection: 8, 'eclaboussure-d-acide': 8 });
        expect(b.nomOriginal).toBe('Biodrone Xenomorph XX121B');
        expect(b.particularites?.[0]).toBe('Protection 4 contre le feu');
        expect(b.particularites).toContain('table d\'attaques du Drone (Livre de base, p. 309)');
        expect(b.source?.fiche).toBe(CHEMIN);
    });

    it('les deux tables d’attaques se rattachent à leur créature ; l’Anathème n’a pas d’acide', () => {
        expect(journal.attaquesRattachees).toEqual([
            'Anathème monstrueux : 6 attaques (p. 181)',
            'Goreburster XX121AB : 5 attaques (p. 178)',
        ]);
        expect(parNom('Goreburster XX121AB').attaques?.lignes?.[0]).toMatchObject({ de: '1-2', nom: 'Impact' });
        expect(parNom('Anathème monstrueux').attaques?.lignes?.[5]).toMatchObject({ de: '6', nom: 'Vomissure noire' });
        expect(parNom('Anathème monstrueux').valeurs).not.toHaveProperty('eclaboussure-d-acide');
        expect(journal.attaquesSansCreature).toEqual([]);
    });

    it('relié aux champs, le Biodrone se pose avec 6 de santé', () => {
        const relie = { ...bestiaire, colonnes: bestiaire.colonnes.map(c => (c.id === 'sante' ? { ...c, champ: 'sante' } : c)) };
        expect(ficheDePlateau(relie, parNom('Biodrone XX121B'))).toEqual({ sante: 6 });
    });
});

describe('le remplissage ne remplace rien', () => {
    it('une valeur corrigée dans l’éditeur reste, l’écart est dit ; une case vide se remplit', () => {
        const { bestiaire: premier } = remplirLeBestiaire(undefined, [FICHE]);
        const corrige = {
            ...premier,
            colonnes: premier.colonnes.map(c => (c.id === 'sante' ? { ...c, champ: 'sante' } : c)),
            creatures: premier.creatures.map(c => (c.nom === 'Biodrone XX121B'
                ? { ...c, valeurs: { ...c.valeurs, sante: 7, observation: '' }, attaques: { lignes: [{ de: '1', nom: 'Morsure', effet: '' }] } }
                : c)),
        };
        const { bestiaire, journal } = remplirLeBestiaire(corrige, [FICHE]);
        const b = bestiaire.creatures.find(c => c.nom === 'Biodrone XX121B')!;
        expect(b.valeurs.sante).toBe(7);
        expect(b.valeurs.observation).toBe(10);
        expect(bestiaire.colonnes.find(c => c.id === 'sante')?.champ).toBe('sante');
        expect(journal.creaturesAjoutees).toEqual([]);
        expect(journal.colonnesAjoutees).toEqual([]);
        expect(journal.conserves).toContain('Biodrone XX121B · sante : bestiaire « 7 », fiche « 6 »');
        expect(journal.creaturesCompletees).toEqual([{ id: 'biodrone-xx121b', nom: 'Biodrone XX121B', champs: ['observation'] }]);
    });

    it('un tableau qui n’est ni un profil ni une table d’attaques est écarté, nommé', () => {
        const fiche = { chemin: 'x.md', livre: 'L', contenu: '### Événements\n\n| D66 | Événement |\n|:--|:--|\n| 11 | Rien |\n' };
        const { journal } = remplirLeBestiaire(undefined, [fiche]);
        expect(journal.tableauxIgnores).toEqual([{ chemin: 'x.md', titre: 'Événements' }]);
        expect(estUneFicheDeBestiaire(fiche.contenu)).toBe(false);
    });

    it('une table d’attaques sans sa créature est signalée, une ligne de profil boiteuse aussi', () => {
        const fiche = { chemin: 'y.md', livre: 'L', contenu: [
            '### Profils des rôdeurs', '', '| Créature | Santé |', '|:--|:--|', '| **Rôdeur** | 4 |', '| Mutilé | 3 | 9 |', '',
            '### Tableau des attaques du Néomorphe', '', '| D6 | Attaque |', '|:--|:--|', '| 1 | **Griffe** : 5 dés |',
        ].join('\n') };
        const { bestiaire, journal } = remplirLeBestiaire(undefined, [fiche]);
        expect(bestiaire.creatures).toMatchObject([{ nom: 'Rôdeur', categorie: 'Rôdeurs', valeurs: { sante: 4 } }]);
        expect(journal.lignesNonLues).toMatchObject([{ raison: '3 cases pour 2 colonnes' }]);
        expect(journal.attaquesSansCreature).toEqual(['Tableau des attaques du Néomorphe (y.md)']);
    });
});

describe('les défauts vus par David le 06/11', () => {
    it('un second remplissage ne signale pas des attaques identiques', () => {
        const { bestiaire: premier } = remplirLeBestiaire(undefined, [FICHE]);
        const { journal } = remplirLeBestiaire(premier, [FICHE]);
        expect(journal.conserves).toEqual([]);
    });

    it('« Créature / Stade » est un tableau de profil', () => {
        const fiche = { chemin: 'z.md', livre: 'L', contenu: ['| Créature / Stade | Vitesse | Santé |', '|:--|:--|:--|', '| **Drone XX121** | 2 | 7 |', ''].join('\n') };
        expect(estUneFicheDeBestiaire(fiche.contenu)).toBe(true);
        expect(remplirLeBestiaire(undefined, [fiche]).bestiaire.creatures).toMatchObject([{ nom: 'Drone XX121', valeurs: { vitesse: 2, sante: 7 } }]);
    });
});
