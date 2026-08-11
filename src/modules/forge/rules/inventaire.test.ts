import { describe, it, expect } from 'vitest';
import { lireInventaire, couverture } from './inventaire';
import { CANEVAS, slugFiche } from './canevas';

/** Un inventaire tronqué, comme le gabarit 1 le fait rendre. */
const INVENTAIRE = `| Sujet | Traité | Mécanique | Sections |
|---|---|---|---|
| Résolution des jets | oui | 2d20 sous compétence + attribut, chaque dé sous le seuil vaut un succès. | Agir ; Tester une compétence |
| Degrés de réussite et critiques | oui | Les succès au-delà du seuil deviennent des points d'élan. | Élan |
| Poursuites | non | non couvert par les sources | |
| Monnaie de table ou ressource partagée | partiellement | Élan pour les joueurs, Menace pour le meneur. | Élan et Menace |

## Hors catégories
- **Les Cinq Arènes de Conflit** : Duel, Escarmouche, Espionnage, Guerre, Intrigue.
- **Les Maisons** : la maison du groupe est un personnage à part entière.`;

/** La forme réellement rendue par le carnet Dune le 2026-08-10 : une liste numérotée. */
const HORS_NUMEROTES = `| Sujet | Traité | Mécanique | Sections |
|---|---|---|---|
| Résolution des jets | oui | 2d20. | Agir |

## Hors catégories

Cette section recense les mécaniques centrales du livre de base :

1. **L'Équation Statistique Duale (Compétence plus Principe)** : Une compétence et un principe moral forment le seuil.
2. **Le Double Prisme d'Intervention** : Modes Agent et Architecte.`;

describe('lireInventaire', () => {
  it('rend toujours les treize sujets, dans l\'ordre du canevas', () => {
    const entrees = lireInventaire(INVENTAIRE).filter(e => !e.horsCanevas);

    expect(entrees).toHaveLength(CANEVAS.length);
    expect(entrees.map(e => e.sujet)).toEqual(CANEVAS.map(s => s.clef));
  });

  it('lit la mécanique et les sections d\'une ligne du tableau', () => {
    const jets = lireInventaire(INVENTAIRE).find(e => e.sujet === 'Résolution des jets')!;

    expect(jets.lu).toBe(true);
    expect(jets.traite).toBe('oui');
    expect(jets.mecanique).toContain('2d20');
    expect(jets.sections).toEqual(['Agir', 'Tester une compétence']);
  });

  it('rabat le libellé du carnet sur la clé canonique', () => {
    const entrees = lireInventaire(INVENTAIRE);

    expect(entrees.find(e => e.sujet === 'Monnaie de table')?.lu).toBe(true);
    expect(entrees.some(e => e.sujet === 'Monnaie de table ou ressource partagée')).toBe(false);
  });

  it('retient un « non couvert » — c\'est ce que l\'inventaire sert à révéler', () => {
    const poursuites = lireInventaire(INVENTAIRE).find(e => e.sujet === 'Poursuites')!;

    expect(poursuites.lu).toBe(true);
    expect(poursuites.traite).toBe('non');
  });

  it('distingue un sujet omis d\'un sujet non traité', () => {
    // Le carnet n'a rien dit sur « Poursuites » ici : ce n'est pas un « non ».
    const omis = lireInventaire(INVENTAIRE).find(e => e.sujet === 'États et conditions')!;

    expect(omis.lu).toBe(false);
    expect(omis.traite).toBe('partiellement');
  });

  it('ramasse les mécaniques hors catégories en fin de tableau', () => {
    const hors = lireInventaire(INVENTAIRE).filter(e => e.horsCanevas);

    expect(hors.map(e => e.sujet)).toEqual(['Les Cinq Arènes de Conflit', 'Les Maisons']);
    expect(hors[0].mecanique).toContain('Duel');
  });

  it('accepte une liste numérotée — la forme que Dune a réellement rendue', () => {
    /**
     * Relevé le 2026-08-10 sur la première forge aboutie : le carnet rend ses
     * hors catégories en « 1. **Nom** : … ». Le parseur n'acceptait que les
     * puces, et les quatre mécaniques centrales de Dune tombaient dans le vide
     * — sans que rien ne le signale, l'inventaire se contentant d'afficher les
     * treize sujets du canevas.
     */
    const hors = lireInventaire(HORS_NUMEROTES).filter(e => e.horsCanevas);

    expect(hors).toHaveLength(2);
    expect(hors[0].sujet).toBe("L'Équation Statistique Duale (Compétence plus Principe)");
    expect(hors[0].mecanique).toContain('seuil');
    expect(hors[1].sujet).toBe("Le Double Prisme d'Intervention");
  });

  it('ne prend pas la phrase d\'introduction pour une mécanique', () => {
    // « Cette section recense les mécaniques centrales du livre de base : »
    // ressemble à une entrée si l'on ne se méfie pas.
    const hors = lireInventaire(HORS_NUMEROTES).filter(e => e.horsCanevas);
    expect(hors.map(e => e.sujet)).not.toContain('Cette section recense les mécaniques centrales du livre de base');
  });

  it('accepte un second tableau pour les hors catégories', () => {
    const variante = INVENTAIRE.replace(
      /- \*\*Les Cinq Arènes de Conflit\*\*.*\n- \*\*Les Maisons\*\*.*/s,
      '| Sujet | Traité | Mécanique | Sections |\n|---|---|---|---|\n| Les Maisons | oui | Un personnage à part entière. | La Maison |',
    );
    const hors = lireInventaire(variante).filter(e => e.horsCanevas);

    expect(hors).toHaveLength(1);
    expect(hors[0].sujet).toBe('Les Maisons');
    expect(hors[0].sections).toEqual(['La Maison']);
  });

  it('ne prend pas l\'en-tête du tableau pour un sujet', () => {
    expect(lireInventaire(INVENTAIRE).some(e => e.sujet === 'Sujet')).toBe(false);
  });

  it('rend tous les sujets même sur une réponse informe', () => {
    const entrees = lireInventaire('Je ne sais pas répondre à cette demande.');

    expect(entrees).toHaveLength(CANEVAS.length);
    expect(entrees.every(e => !e.lu)).toBe(true);
  });
});

describe('sujet libre et doublons', () => {
  it('un sujet libre qui recouvre le canevas porte le meme slug', () => {
    /**
     * L atelier ajoute le sujet libre en tete de liste, sauf s il fait doublon.
     * La comparaison se fait sur le slug : « Poursuites » tape a la main donne
     * `poursuites`, exactement l identifiant du sujet du canevas — la liste ne
     * doit donc pas afficher deux fois le meme sujet.
     */
    const duCanevas = lireInventaire(INVENTAIRE).find(e => e.sujet === 'Poursuites')!;
    expect(slugFiche(duCanevas.sujet)).toBe(slugFiche('Poursuites'));
    expect(slugFiche('poursuites ')).toBe(slugFiche('Poursuites'));
  });

  it('un sujet libre inedit garde son propre slug', () => {
    expect(slugFiche('Les manoeuvres des Mentat')).toBe('les-manoeuvres-des-mentat');
  });
});

describe('couverture', () => {
  it('compte les sujets traités au moins partiellement', () => {
    expect(couverture(lireInventaire(INVENTAIRE))).toEqual({ traites: 3, total: CANEVAS.length });
  });
});

/**
 * **La forme réellement rendue par le carnet pour Alien et Blade Runner**, le
 * 2026-08-11 : un tableau **sans barres extérieures**, gras compris. C'est du
 * markdown valide, et le parseur l'ignorait entièrement — les treize sujets du
 * canevas ressortaient « sans réponse » alors que onze portaient un « oui » et
 * un paragraphe de mécanique.
 *
 * Le texte ci-dessous est copié de `docs/systems/alien/rules/`, pas réécrit :
 * un exemple qu'on fabrique soi-même ne prouve rien sur ce que le carnet rend.
 */
const SANS_BARRES_EXTERIEURES = `Sujet | Traité (oui/partiellement/non) | Mécanique | Sections
--- | --- | --- | ---
**1. Résolution des jets** | **oui** | Le joueur lance une réserve de **dés à six faces** égale à son Attribut plus sa Compétence. | **JETER LES DÉS**, **SIGNIFIE « RÉUSSITE »**
**11. Poursuites** | **non** | non couvert par les sources | non couvert par les sources

## Hors catégories

*   **La Vélocité d'approche en combat spatial** : Système gérant le rapprochement des vaisseaux.`;

describe('lireInventaire — tableau sans barres extérieures', () => {
  it('lit les lignes que le carnet rend sans barre de début', () => {
    const jets = lireInventaire(SANS_BARRES_EXTERIEURES).find(e => e.sujet === 'Résolution des jets')!;

    expect(jets.lu, 'la ligne était ignorée, donc le sujet passait pour sans réponse').toBe(true);
    expect(jets.traite).toBe('oui');
    expect(jets.mecanique).toContain('dés à six faces');
    expect(jets.sections).toContain('JETER LES DÉS');
  });

  it('reconnaît toujours un sujet non couvert', () => {
    const p = lireInventaire(SANS_BARRES_EXTERIEURES).find(e => e.sujet === 'Poursuites')!;
    expect(p.lu).toBe(true);
    expect(p.traite).toBe('non');
  });

  it('ne prend pas l\'en-tête ni le trait de séparation pour des sujets', () => {
    const hors = lireInventaire(SANS_BARRES_EXTERIEURES).filter(e => e.horsCanevas);
    expect(hors.map(e => e.sujet)).toEqual(["La Vélocité d'approche en combat spatial"]);
  });

  it('une phrase de prose contenant une barre n\'est pas une ligne de tableau', () => {
    /**
     * La contrepartie d'accepter les tableaux sans bordure : il faut au moins
     * trois cellules. Sinon une phrase ordinaire deviendrait un sujet, et
     * l'atelier proposerait de forger une fiche sur un bout de paragraphe.
     */
    const prose = `Sujet | Traité | Mécanique | Sections
--- | --- | --- | ---
**1. Résolution des jets** | **oui** | 2d20. | Agir

## Hors catégories

*   **Le Stress** : la jauge monte quand on échoue | et redescend au repos.`;

    const hors = lireInventaire(prose).filter(e => e.horsCanevas);
    expect(hors.map(e => e.sujet)).toEqual(['Le Stress']);
  });
});
