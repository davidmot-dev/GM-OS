import { describe, expect, it } from 'vitest';
// `node:fs` n'existe pas dans le projet d'essais `renderer` : les fiches se lisent par Vite.
import BASE from '../../../docs/systems/alien/rules/bestiaire-du-livre-de-base.md?raw';
import CM from '../../../docs/systems/alien/supplements/colonial-marines/rules/nouvelles-variantes-de-xenomorphes-et-anathemes.md?raw';
import { estUneFicheDeBestiaire, remplirLeBestiaire } from './depuisLeCorpus';
import { controlerLeBestiaire } from './bestiaire';
import { profilXenomorphe, ROLES_ALIEN } from './rolesDuBestiaire';

/**
 * **Le bestiaire du livre de base d'Alien** — transcrit le 06/11/2026 (chapitre 11, p. 290-323), à
 * la demande de David : la fiche forgée n'était pas lue (« Créature / Stade ») et n'avait ni
 * Mobilité, ni Observation, ni tables d'attaques. La fiche relue relie chaque créature à une table
 * du jeu (`databases/tables/Alien/`) au lieu de la recopier.
 */
const FICHE = { chemin: 'docs/systems/alien/rules/bestiaire-du-livre-de-base.md', contenu: BASE, livre: 'ALIEN, le jeu de rôle' };
const { bestiaire, journal } = remplirLeBestiaire(undefined, [FICHE], ROLES_ALIEN);
const parNom = (nom: string) => bestiaire.creatures.find(c => c.nom === nom)!;

describe('la fiche relue du livre de base (p. 295-322)', () => {
    it('vingt-sept créatures en trois catégories, toutes les lignes lues, aucun constat', () => {
        expect(estUneFicheDeBestiaire(BASE)).toBe(true);
        expect(bestiaire.creatures).toHaveLength(27);
        expect([...new Set(bestiaire.creatures.map(c => c.categorie))]).toEqual(['Néomorphes', 'Xénomorphes XX121', 'Autres espèces extrasolaires']);
        expect(journal.lignesNonLues).toEqual([]);
        expect(journal.tableauxIgnores).toEqual([]);
        expect(journal.colonnesAjoutees.map(c => c.libelle)).toEqual(['Vitesse', 'Santé', 'Mobilité', 'Observation', 'Protection', "Éclaboussure d'acide"]);
        expect(controlerLeBestiaire(bestiaire)).toEqual([]);
    });

    it('le Drone : ses chiffres (p. 309), sa table du jeu, sa Protection au feu', () => {
        const d = parNom('Drone');
        expect(d.valeurs).toEqual({ vitesse: 2, sante: 7, mobilite: 10, observation: 8, protection: 8, 'eclaboussure-d-acide': 8 });
        expect(d.attaques).toEqual({ table: { univers: 'Alien', table: 'attaques_xenomorphe_rodeur' } });
        expect(d.particularites?.[0]).toBe('Protection 4 contre le feu');
        expect(d.source).toMatchObject({ livre: 'ALIEN, le jeu de rôle', page: 309 });
    });

    it('chaque table nommée est une des onze tables du jeu ; seuls les œufs, l’Ouvrier et le Jeune Moissonneur n’en ont pas', () => {
        const tables = import.meta.glob('../../../databases/tables/Alien/attaques_*.json');
        const connues = new Set(Object.keys(tables).map(k => k.split('/').pop()!.replace('.json', '')));
        const sans = bestiaire.creatures.filter(c => !c.attaques?.table).map(c => c.nom);
        expect(sans).toEqual(['Ovomorphe', 'Œuf de Reine', 'Ouvrier', 'Jeune Moissonneur']);
        for (const c of bestiaire.creatures.filter(c => c.attaques?.table)) expect(connues).toContain(c.attaques!.table!.table);
    });

    it('au combat : la Reine en XX121, le Néomorphe sans acide ni XX121, la Nuée pour une zone', () => {
        expect(profilXenomorphe(bestiaire, parNom('Reine'))).toMatchObject({ vitesse: 2, maximum: 14, protection: 14, acide: 10, xx121: true, table: 'attaques_pretorien_reine', competences: { mobilité: 8, observation: 12 } });
        expect(profilXenomorphe(bestiaire, parNom('Néomorphe Adulte'))).toMatchObject({ vitesse: 2, maximum: 6, protection: 6, acide: 0, xx121: false, table: 'attaques_neomorphes' });
        const n = parNom('Nuée');
        expect(n.valeurs).toMatchObject({ vitesse: 1, sante: 5 });
        expect(n.particularites).toContain('Vitesse par zone couverte');
        // L'œuf a une Vitesse de 0 : le profil la porte à 1, la carte d'initiative minimale.
        expect(profilXenomorphe(bestiaire, parNom('Ovomorphe'))).toMatchObject({ vitesse: 1, acide: 4 });
    });
});

describe('avec Colonial Marines, et un second remplissage', () => {
    it('les deux fiches s’ajoutent sans doubler les colonnes ; le second passage ne signale rien', () => {
        const fm = { chemin: 'cm.md', contenu: CM, livre: 'Colonial Marines Operations Manual' };
        const { bestiaire: deux, journal: j } = remplirLeBestiaire(bestiaire, [fm], ROLES_ALIEN);
        expect(j.colonnesAjoutees).toEqual([]);
        expect(deux.creatures).toHaveLength(30);
        const { journal: encore } = remplirLeBestiaire(deux, [FICHE, fm], ROLES_ALIEN);
        expect(encore.creaturesAjoutees).toEqual([]);
        expect(encore.creaturesCompletees).toEqual([]);
        expect(encore.conserves).toEqual([]);
    });

    it('une table déjà choisie dans l’éditeur reste ; l’écart est dit', () => {
        const corrige = { ...bestiaire, creatures: bestiaire.creatures.map(c => (c.nom === 'Soldat' ? { ...c, attaques: { table: { univers: 'Alien', table: 'attaques_pretorien_reine' } } } : c)) };
        const { bestiaire: b, journal: j } = remplirLeBestiaire(corrige, [FICHE], ROLES_ALIEN);
        expect(b.creatures.find(c => c.nom === 'Soldat')?.attaques?.table?.table).toBe('attaques_pretorien_reine');
        expect(j.conserves).toEqual(['Soldat · table d’attaques : bestiaire « Alien/attaques_pretorien_reine », fiche « Alien/attaques_soldat_sentinelle »']);
    });
});
