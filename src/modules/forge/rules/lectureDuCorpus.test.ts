import { describe, it, expect } from 'vitest';
import {
  corpsDeLaFiche,
  lireFichesDuCorpus,
  sujetDeLaFiche,
  type AccesAuxFiches,
} from './lectureDuCorpus';
import { corpusChoisi } from '../../../../electron/corpusSysteme';

/**
 * La charge réelle : une fiche v3 telle que `convertirFiche` l'écrit, avec son
 * frontmatter cité et son corps en trois sections.
 *
 * **Elle est copiée du disque, pas inventée.** La règle vaut ici comme ailleurs :
 * un test écrit sur une forme qu'on a fabriquée soi-même passe au vert pendant
 * que l'écran reste muet.
 */
const FICHE_REELLE = `---
sujet: Dégâts et types de dégâts
systeme: dune
couverture: partielle
hors_canevas: false
sources: "Dune_Aventures_dans_l'Imperium_BQ.pdf"
sections: "« La nature du conflit » ; « Attaques, défaites et récupération »"
genere_par: notebooklm
gabarit: v3
relu: false
---

# Dégâts et types de dégâts

## Règle
Le système ne propose pas de points de vie.
`;

function disque(fichiers: Record<string, string>): AccesAuxFiches {
  return {
    listDir: async chemin =>
      Object.keys(fichiers)
        .filter(p => p.startsWith(`${chemin}/`))
        .map(p => p.slice(chemin.length + 1)),
    readDoc: async chemin => fichiers[chemin] ?? null,
  };
}

const corpus = corpusChoisi('dune', ['dune']);

describe('sujetDeLaFiche', () => {
  it('lit le sujet du frontmatter', () => {
    expect(sujetDeLaFiche(FICHE_REELLE)).toBe('Dégâts et types de dégâts');
  });

  it('décote une valeur citée', () => {
    // `convertirFiche` cite dès que la valeur porte un `: ` ou une quote.
    expect(sujetDeLaFiche('---\nsujet: "Jets opposés, aide et \\"coopération\\""\n---\n\nx'))
      .toBe('Jets opposés, aide et "coopération"');
  });

  it('ignore un « sujet: » qui n\'est que du texte dans le corps', () => {
    /**
     * Sans cette limite au bloc de tête, une fiche qui *parle* de sujets se
     * rattacherait au canevas par une phrase, et irait nourrir un groupe de
     * champs qu'elle ne documente pas.
     */
    expect(sujetDeLaFiche('# Titre\n\nsujet: Résolution des jets\n')).toBe('');
  });

  it('rend une chaîne vide quand le frontmatter n\'est pas fermé', () => {
    expect(sujetDeLaFiche('---\nsujet: Poursuites\n\n# Titre')).toBe('');
  });
});

describe('corpsDeLaFiche', () => {
  it('retire le frontmatter et rend le corps seul', () => {
    const corps = corpsDeLaFiche(FICHE_REELLE);
    expect(corps).toMatch(/^# Dégâts/);
    expect(corps).not.toContain('genere_par');
    expect(corps).toContain('pas de points de vie');
  });

  it('rend le fichier entier quand il n\'a pas de frontmatter', () => {
    expect(corpsDeLaFiche('# Titre\n\nDu texte.\n')).toBe('# Titre\n\nDu texte.');
  });

  it('ne coupe pas sur un « --- » du corps', () => {
    // Une ligne de séparation au milieu d'une fiche est du markdown ordinaire.
    const fiche = '---\nsujet: Poursuites\n---\n\n# Poursuites\n\nAvant.\n\n---\n\nAprès.\n';
    const corps = corpsDeLaFiche(fiche);
    expect(corps).toContain('Avant.');
    expect(corps).toContain('Après.');
  });
});

describe('lireFichesDuCorpus', () => {
  it('lit les fiches du dossier rules du corpus visé', async () => {
    const { chemin, fiches, ignorees } = await lireFichesDuCorpus(
      corpus,
      disque({
        'systems/dune/rules/degats-et-types-de-degats.md': FICHE_REELLE,
        'systems/dune/rules/poursuites.md': '---\nsujet: Poursuites\n---\n\nOn court.',
        // Un fichier d'un autre corpus ne doit pas entrer.
        'systems/alien/rules/poursuites.md': '---\nsujet: Poursuites\n---\n\nAilleurs.',
      }),
    );

    expect(chemin).toBe('systems/dune/rules');
    expect(fiches.map(f => f.sujet)).toEqual(['Dégâts et types de dégâts', 'Poursuites']);
    expect(fiches[1].contenu).toBe('On court.');
    expect(ignorees).toEqual([]);
  });

  it('écarte ce qui n\'est pas une fiche, et dit pourquoi', async () => {
    /**
     * Un corpus qu'on croit lu et qui ne l'est qu'à moitié est le genre de trou
     * qui se découvre trois écrans plus loin. Chaque écart est nommé.
     */
    const { fiches, ignorees } = await lireFichesDuCorpus(
      corpus,
      disque({
        'systems/dune/rules/sans-sujet.md': '# Une note libre\n\nDu texte.',
        'systems/dune/rules/vide.md': '   ',
        'systems/dune/rules/entete-seule.md': '---\nsujet: Poursuites\n---\n',
        'systems/dune/rules/notes.txt': 'Pas du markdown.',
      }),
    );

    expect(fiches).toEqual([]);
    expect(ignorees).toEqual([
      { fichier: 'sans-sujet.md', raison: 'aucun « sujet: » dans le frontmatter' },
      { fichier: 'vide.md', raison: 'fichier vide ou illisible' },
      { fichier: 'entete-seule.md', raison: 'frontmatter seul, aucun contenu' },
    ]);
  });

  it('un dossier absent rend une lecture vide, pas une panne', async () => {
    /**
     * C'est l'état normal d'un corpus que l'Atelier n'a pas encore documenté :
     * la Forge doit pouvoir le dire à l'écran, pas mourir dessus.
     */
    const { fiches } = await lireFichesDuCorpus(corpus, {
      listDir: async () => { throw new Error('ENOENT'); },
      readDoc: async () => null,
    });
    expect(fiches).toEqual([]);
  });
});
