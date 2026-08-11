import { describe, it, expect } from 'vitest';
import { CANEVAS, CLEFS_CANEVAS, clefCanonique, normaliser, slugFiche } from './canevas';

describe('canevas', () => {
  it('porte les treize sujets, sans doublon de clé', () => {
    expect(CANEVAS).toHaveLength(14);
    expect(new Set(CLEFS_CANEVAS).size).toBe(14);
  });

  it('chaque énoncé contient sa clé — le carnet doit pouvoir la reprendre', () => {
    for (const sujet of CANEVAS) {
      expect(normaliser(sujet.enonce), sujet.clef).toContain(normaliser(sujet.clef));
    }
  });
});

describe('clefCanonique', () => {
  it('reconnaît une clé rendue telle quelle', () => {
    expect(clefCanonique('Résolution des jets')).toBe('Résolution des jets');
  });

  it('tolère la casse, les accents perdus et la ponctuation', () => {
    expect(clefCanonique('RESOLUTION DES JETS')).toBe('Résolution des jets');
    expect(clefCanonique('Etats et conditions')).toBe('États et conditions');
    expect(clefCanonique('Jets opposés / aide et coopération')).toBe('Jets opposés, aide et coopération');
  });

  it('rabat les libellés que Dune a réellement rendus', () => {
    // Les deux cas qui ont motivé la clé canonique.
    expect(clefCanonique('Monnaie de table ou ressource partagée')).toBe('Monnaie de table');
    expect(clefCanonique('Ton, registre et ambiance recherchés')).toBe('Ton, registre et ambiance');
  });

  it('rabat chaque énoncé du gabarit sur sa propre clé', () => {
    for (const sujet of CANEVAS) {
      expect(clefCanonique(sujet.enonce), sujet.enonce).toBe(sujet.clef);
    }
  });

  it('rattrape une reformulation qui garde les mots signifiants', () => {
    expect(clefCanonique('Distances et portées au combat')).toBe('Distances et portées');
    expect(clefCanonique('Ambiance, ton et registre visés')).toBe('Ton, registre et ambiance');
  });

  it('rend null plutôt que de forcer un rattachement douteux', () => {
    // Une fiche rangée sous un mauvais sujet fausse la comparaison entre jeux ;
    // hors canevas, elle s'en abstient seulement.
    /**
     * **Le defaut du 2026-08-10, releve sur Blade Runner.** « Differences
     * mecaniques Humains vs Replicants (Jets forces & Degats/Stress) » etait
     * rabattu sur « Degats et types de degats » — un mot commun sur neuf.
     *
     * Deux causes cumulees. La cle « Degats et types de degats » porte DEUX fois
     * le mot « degats », qui votait donc deux fois et suffisait a lui seul a
     * atteindre les deux tiers. Et le rapprochement ne se jugeait que dans un
     * sens : personne ne demandait si le libelle relevait de la cle.
     *
     * Le cout n'etait pas cosmetique : la fiche changeait de sujet, de slug, et
     * ECRASAIT la vraie fiche « Degats ». David l'a reforgee sept fois sans
     * jamais la voir aboutir.
     */
    expect(clefCanonique('Différence mécanique Humains vs Réplicants (Jets forcés & Dégâts/Stress)')).toBeNull();
    expect(clefCanonique('Structure temporelle par Quarts et Pauses')).toBeNull();
    expect(clefCanonique("Les Ancrages Narratifs (Souvenirs Clés & Relations Clés)")).toBeNull();
    expect(clefCanonique('Santé mentale')).toBeNull();
    expect(clefCanonique('Les Cinq Arènes de Conflit Unifiées')).toBeNull();
    expect(clefCanonique('Le Souvenir Clé')).toBeNull();
    expect(clefCanonique('')).toBeNull();
  });

  it('ne se laisse pas prendre aux mots vides', () => {
    // « et », « de », « les » ne discriminent rien : un libellé qui ne partage
    // que ça avec un sujet du canevas n'en relève pas.
    expect(clefCanonique('Les règles de la table et du reste')).toBeNull();
  });
});

describe('slugFiche', () => {
  it('produit un nom de fichier stable, sans accent ni ponctuation', () => {
    expect(slugFiche('Dégâts et types de dégâts')).toBe('degats-et-types-de-degats');
    expect(slugFiche('Jets opposés, aide et coopération')).toBe('jets-opposes-aide-et-cooperation');
    expect(slugFiche('Ton, registre et ambiance')).toBe('ton-registre-et-ambiance');
  });

  it('ne rend jamais une chaîne vide', () => {
    expect(slugFiche('«»')).toBe('fiche-sans-sujet');
  });
});
