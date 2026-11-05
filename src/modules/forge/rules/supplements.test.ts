import { describe, it, expect } from 'vitest';
import { lireInventaireDeSupplement, ficheInventaireDeSupplement } from './inventaire';
import { gabaritInventaireDeSupplement, gabaritFicheRegle, gabaritFichePratique } from './gabarits';
import { convertirFiche } from './conversion';
import {
  ajouterLeSujet,
  ajouterUnSupplement,
  candidatsDesSujets,
  canevasDesCandidats,
  ecarterLeSujet,
  lireLesSujets,
  lireLesSupplements,
  renommerLeSujet,
  sujetsDeLInventaire,
  sujetsDesCandidats,
} from './supplements';

/**
 * Le mode supplément de la Forge — § 185 du registre, 01/11/2026.
 *
 * Exemple de David : le *Colonial Marines Operations Manual* d'Alien, un livre
 * anglais presque entièrement fait de ce que l'inventaire du livre de base
 * exclut (spécialités, talents, armes, véhicules, procédures de campagne).
 */

/** L'inventaire tel que le gabarit 1 bis le fait rendre, avec les écarts habituels du carnet. */
const INVENTAIRE = `| Sujet | Mécanique | Sections |
|---|---|---|
| 1. **Spécialités militaires (MOS)** | Dix spécialités, chacune donne une compétence clé et un talent. | Military Occupational Specialty (MOS) ; AFV Marine |
| Armes de poing (Pistols) | Pistolets M4A3 et autres, bonus et dégâts chiffrés. | Pistols |
Pertes chez les joueurs | Un Marine tué est remplacé par un PNJ de l'escouade. | Player Casualties
| Armes de poing (Pistols) | doublon rendu par le carnet | Pistols |`;

describe('lireInventaireDeSupplement', () => {
  const entrees = lireInventaireDeSupplement(INVENTAIRE);

  it('rend les sujets proposés, et eux seuls — pas de canevas à compléter', () => {
    expect(entrees.map(e => e.sujet)).toEqual([
      'Spécialités militaires (MOS)',
      'Armes de poing (Pistols)',
      'Pertes chez les joueurs',
    ]);
  });

  it('lit la mécanique et les titres de section', () => {
    expect(entrees[0].mecanique).toMatch(/Dix spécialités/);
    expect(entrees[0].sections).toEqual(['Military Occupational Specialty (MOS)', 'AFV Marine']);
    expect(entrees[2].sections).toEqual(['Player Casualties']);
  });

  it('dit son supplément dans la fiche d\'inventaire, pour ne pas doubler celle du jeu', () => {
    const fiche = ficheInventaireDeSupplement(INVENTAIRE, 'alien', { slug: 'colonial-marines', titre: 'Colonial Marines Operations Manual' });
    expect(fiche).toMatch(/^sujet: "Inventaire du supplément Colonial Marines Operations Manual"$/m);
    expect(fiche).toMatch(/^systeme: alien$/m);
    expect(fiche).toMatch(/^supplement: colonial-marines$/m);
    expect(fiche).toMatch(/^sujets_proposes: 3$/m);
    expect(fiche).toMatch(/^relu: false$/m);
  });
});

describe('gabarits du supplément', () => {
  const inventaire = gabaritInventaireDeSupplement('Colonial Marines Operations Manual', { langue: 'fr' });

  it('demande les règles que le livre de base exclut', () => {
    expect(inventaire).toMatch(/Colonial Marines Operations Manual/);
    expect(inventaire).toMatch(/spécialités,\s+talents,\s+grades/);
    expect(inventaire).toMatch(/armes,\s+armures,\s+véhicules/);
    expect(inventaire).not.toMatch(/N'aborde PAS : la PROCÉDURE de création/);
  });

  it('écarte l\'univers et les scénarios', () => {
    expect(inventaire).toMatch(/l'histoire et l'univers/);
    expect(inventaire).toMatch(/le texte des scénarios/);
  });

  it('veut les sujets en français et les sections dans la langue du livre', () => {
    expect(inventaire).toMatch(/en français, avec le nom original entre parenthèses/);
    expect(inventaire).toMatch(/RECOPIÉS dans la langue du livre/);
  });

  it('pose le supplément, le tableau et la langue dans les deux moitiés de fiche', () => {
    const options = { supplement: 'Colonial Marines Operations Manual', langue: 'fr' };
    for (const gabarit of [gabaritFicheRegle('Armes de poing', options), gabaritFichePratique('Armes de poing', options)]) {
      expect(gabarit).toMatch(/SUPPLÉMENT « Colonial Marines Operations Manual »/);
      expect(gabarit).toMatch(/TABLEAU MARKDOWN, toutes ses lignes/);
      // Bestiaire, § 210 étape C (05/11/2026) : le profil des créatures en tableau, lu sans modèle.
      expect(gabarit).toMatch(/TABLEAU DE PROFIL : première colonne « Créature »/);
      expect(gabarit).toMatch(/« Tableau des\s+attaques de <créature> »/);
      expect(gabarit).toMatch(/prose en français/);
      expect(gabarit).toMatch(/« Fusilier \(Rifleman\) »/);
    }
  });

  it('ne change pas d\'un mot les gabarits du livre de base', () => {
    expect(gabaritFicheRegle('Poursuites')).not.toMatch(/SUPPLÉMENT|prose en/);
    expect(gabaritFichePratique('Poursuites')).not.toMatch(/SUPPLÉMENT|prose en/);
    expect(gabaritFichePratique('Poursuites').endsWith('exact du jeu.')).toBe(true);
  });
});

describe('les sujets retenus', () => {
  const candidats = candidatsDesSujets(sujetsDeLInventaire(lireInventaireDeSupplement(INVENTAIRE)));

  it('font des cartes forgeables, avec leur slug de fichier', () => {
    expect(candidats.map(c => c.id)).toEqual(['specialites-militaires-mos', 'armes-de-poing-pistols', 'pertes-chez-les-joueurs']);
    expect(candidats.every(c => !c.tags.includes('hors canevas'))).toBe(true);
  });

  it('font aller-retour par sujets.json sans rien perdre', () => {
    const relus = lireLesSujets(JSON.stringify(sujetsDesCandidats(candidats)));
    expect(candidatsDesSujets(relus!)).toEqual(candidats);
  });

  it('se renomment, s\'écartent et s\'ajoutent', () => {
    const renomme = renommerLeSujet(candidats, 'armes-de-poing-pistols', 'Pistolets');
    expect(renomme[1]).toMatchObject({ id: 'pistolets', title: 'Pistolets' });
    expect(ecarterLeSujet(candidats, 'pertes-chez-les-joueurs')).toHaveLength(2);
    expect(ajouterLeSujet(candidats, 'Grades')).toHaveLength(4);
  });

  it('refusent un renommage ou un ajout qui écrirait le même fichier', () => {
    expect(renommerLeSujet(candidats, 'armes-de-poing-pistols', 'Pertes chez les joueurs')).toEqual(candidats);
    expect(ajouterLeSujet(candidats, 'Armes de poing (Pistols)')).toEqual(candidats);
    expect(ajouterLeSujet(candidats, '   ')).toEqual(candidats);
  });

  it('servent de canevas : la fiche rendue tombe sur son sujet et dit son supplément', () => {
    const brut = `## Métadonnées
- sujet : Armes de poing (Pistols)
- couverture : complète
- sources : alien-colonial-marines-operations-manual.pdf
- sections : Pistols

## Règle
Les pistolets du Corps.

## Valeurs
| Arme | Bonus | Dégâts |
|---|---|---|
| M4A3 | +1 | 1 |`;
    const fiche = convertirFiche(brut, {
      systeme: 'alien',
      sujetDemande: 'Armes de poing (Pistols)',
      canevas: canevasDesCandidats(candidats),
      champsSupplementaires: { supplement: 'colonial-marines' },
    });
    expect(fiche.slug).toBe('armes-de-poing-pistols');
    expect(fiche.horsCanevas).toBe(false);
    expect(fiche.markdown).toMatch(/^supplement: colonial-marines$/m);
    expect(fiche.markdown).toMatch(/^systeme: alien$/m);
  });
});

describe('les suppléments déclarés', () => {
  it('se lisent avec tolérance', () => {
    expect(lireLesSupplements(null)).toEqual([]);
    expect(lireLesSupplements('pas du json')).toEqual([]);
    expect(lireLesSupplements('[{"slug":"colonial-marines","titre":"Colonial Marines"},{"titre":""}]'))
      .toEqual([{ slug: 'colonial-marines', titre: 'Colonial Marines' }]);
  });

  it('ne se dédoublent pas : un titre au même slug désigne le même dossier', () => {
    const { liste } = ajouterUnSupplement([], 'Colonial Marines');
    const encore = ajouterUnSupplement(liste, 'colonial marines');
    expect(encore.liste).toHaveLength(1);
    expect(encore.supplement).toEqual({ slug: 'colonial-marines', titre: 'Colonial Marines' });
    expect(ajouterUnSupplement(liste, '  ').supplement).toBeNull();
  });
});
