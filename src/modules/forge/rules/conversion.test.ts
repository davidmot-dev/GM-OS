import { describe, it, expect } from 'vitest';
import { convertirFiche, decouperSections } from './conversion';

/** Une fiche telle que le gabarit 2 la fait rendre. */
const FICHE = `## Métadonnées
- sujet : Dégâts et types de dégâts
- couverture : partielle
- sources : Dune : Aventures dans l'Imperium
- sections : « Blessures critiques » ; « Vaincre un adversaire »

## Règle
Le système n'utilise ni points de vie ni dés de dégâts.

## Valeurs
- Qualité des atouts : de zéro à quatre.

## Non couvert
rien`;

describe('convertirFiche', () => {
  it('produit un frontmatter que le RAG reconnaîtra', () => {
    const fiche = convertirFiche(FICHE, { systeme: 'dune' });

    expect(fiche.markdown.startsWith('---\n')).toBe(true);
    expect(fiche.markdown).toContain('sujet: Dégâts et types de dégâts');
    expect(fiche.markdown).toContain('systeme: dune');
    expect(fiche.markdown).toContain('couverture: partielle');
    expect(fiche.markdown).toContain('hors_canevas: false');
    expect(fiche.markdown).toContain('genere_par: notebooklm');
    expect(fiche.markdown).toContain('relu: false');
  });

  it('sort la section Métadonnées du corps et pose un titre', () => {
    const fiche = convertirFiche(FICHE, { systeme: 'dune' });
    const corps = fiche.markdown.split('\n---\n')[1];

    expect(corps).toContain('# Dégâts et types de dégâts');
    expect(corps).not.toContain('## Métadonnées');
    expect(corps).not.toContain('- couverture :');
    expect(corps).toContain('## Règle');
  });

  it('écrit les sections dans la forme que lit le résolveur', () => {
    const fiche = convertirFiche(FICHE, { systeme: 'dune' });

    expect(fiche.sections).toEqual(['Blessures critiques', 'Vaincre un adversaire']);
    expect(fiche.markdown).toContain('sections: "« Blessures critiques » ; « Vaincre un adversaire »"');
  });

  it('nomme le fichier d\'après la clé canonique', () => {
    expect(convertirFiche(FICHE, { systeme: 'dune' }).slug).toBe('degats-et-types-de-degats');
  });

  it('ramène le sujet à la clé canonique du canevas', () => {
    const brut = FICHE.replace('Dégâts et types de dégâts', 'Monnaie de table ou ressource partagée');
    const fiche = convertirFiche(brut, { systeme: 'dune' });

    expect(fiche.sujet).toBe('Monnaie de table');
    expect(fiche.horsCanevas).toBe(false);
    expect(fiche.slug).toBe('monnaie-de-table');
  });

  it('marque hors canevas ce qui n\'entre dans aucun sujet, sans le forcer', () => {
    const brut = FICHE.replace('Dégâts et types de dégâts', 'Les Cinq Arènes de Conflit Unifiées');
    const fiche = convertirFiche(brut, { systeme: 'dune' });

    expect(fiche.horsCanevas).toBe(true);
    expect(fiche.sujet).toBe('Les Cinq Arènes de Conflit Unifiées');
    expect(fiche.markdown).toContain('hors_canevas: true');
    expect(fiche.avertissements.join(' ')).toContain('hors canevas');
  });

  it('conserve une couverture « absente » — c\'est elle qui rend le trou visible', () => {
    const brut = FICHE.replace('couverture : partielle', 'couverture : absente');
    expect(convertirFiche(brut, { systeme: 'dune' }).couverture).toBe('absente');
  });

  it('signale une couverture illisible au lieu de l\'inventer', () => {
    const brut = FICHE.replace('couverture : partielle', 'couverture : plutôt bonne');
    const fiche = convertirFiche(brut, { systeme: 'dune' });

    expect(fiche.couverture).toBe('partielle');
    expect(fiche.avertissements.join(' ')).toContain('non reconnue');
  });

  it('signale une fiche sans section : rien n\'y attrape l\'invention', () => {
    const brut = FICHE.replace(/- sections :.*/, '- sections : ');
    const fiche = convertirFiche(brut, { systeme: 'dune' });

    expect(fiche.sections).toEqual([]);
    expect(fiche.avertissements.join(' ')).toContain('résolveur');
  });

  it('signale les numéros de page rendus malgré la consigne', () => {
    const brut = FICHE.replace('ni dés de dégâts.', 'ni dés de dégâts (p. 167).');
    const fiche = convertirFiche(brut, { systeme: 'dune' });

    expect(fiche.avertissements.join(' ')).toContain('numéros de page');
    expect(fiche.markdown).toContain('pages_fiables: false');
  });

  it('n\'écrit pas pages_fiables quand la fiche ne cite aucune page', () => {
    // Écrire `false` laisserait croire qu'il existe des pages, et fausses.
    expect(convertirFiche(FICHE, { systeme: 'dune' }).markdown).not.toContain('pages_fiables');
  });

  it('défait le bloc de code et les tirets que le carnet ajoute malgré tout', () => {
    const fiche = convertirFiche('```markdown\n---\n' + FICHE + '\n```', { systeme: 'dune' });

    expect(fiche.sujet).toBe('Dégâts et types de dégâts');
    expect(fiche.markdown.split('\n---\n')[1]).not.toContain('```');
  });

  it('défait la ponctuation échappée', () => {
    const brut = FICHE.replace('de zéro à quatre.', 'de 1\\. à 4, ou \\+ deux.');
    expect(convertirFiche(brut, { systeme: 'dune' }).markdown).toContain('de 1. à 4, ou + deux.');
  });

  it('rassemble les sections énumérées en sous-puces', () => {
    const brut = FICHE.replace(
      '- sections : « Blessures critiques » ; « Vaincre un adversaire »',
      '- sections :\n  - Blessures critiques\n  - Vaincre un adversaire',
    );
    expect(convertirFiche(brut, { systeme: 'dune' }).sections)
      .toEqual(['Blessures critiques', 'Vaincre un adversaire']);
  });

  it('retombe sur le sujet demandé quand la fiche n\'a pas de métadonnées', () => {
    const fiche = convertirFiche('## Règle\nOn lance des dés.', {
      systeme: 'alien',
      sujetDemande: 'Résolution des jets',
    });

    expect(fiche.sujet).toBe('Résolution des jets');
    expect(fiche.slug).toBe('resolution-des-jets');
    expect(fiche.avertissements.join(' ')).toContain('Métadonnées');
    expect(fiche.markdown).toContain('## Règle');
  });

  it('ne perd jamais la réponse du carnet, même informe', () => {
    // Une requête perdue se repaie au carnet, sous un plafond de dix minutes.
    const fiche = convertirFiche('Texte sans structure aucune.', { systeme: 'noc' });

    expect(fiche.markdown).toContain('Texte sans structure aucune.');
    expect(fiche.avertissements.length).toBeGreaterThan(0);
  });

  it('cite les valeurs YAML qu\'un deux-points casserait', () => {
    const fiche = convertirFiche(FICHE, { systeme: 'dune' });
    expect(fiche.markdown).toContain(`sources: "Dune : Aventures dans l'Imperium"`);
  });

  it('conserve le titre quand la fiche en pose déjà un', () => {
    const fiche = convertirFiche('# Ma fiche\n\n' + FICHE, { systeme: 'dune' });
    expect(fiche.markdown.match(/^# /gm)).toHaveLength(1);
  });
});

describe('decouperSections', () => {
  it('coupe sur le point-virgule', () => {
    expect(decouperSections('« A » ; « B »')).toEqual(['A', 'B']);
  });

  it('ne coupe pas une virgule interne à un titre', () => {
    expect(decouperSections('Agir, réagir et souffrir')).toEqual(['Agir, réagir et souffrir']);
  });

  it('coupe sur la virgule devant une majuscule ou un guillemet', () => {
    expect(decouperSections('Forcer le test, Niveau de Stress')).toEqual(['Forcer le test', 'Niveau de Stress']);
  });

  it('rend une liste vide sur une valeur absente', () => {
    expect(decouperSections('')).toEqual([]);
  });
});
