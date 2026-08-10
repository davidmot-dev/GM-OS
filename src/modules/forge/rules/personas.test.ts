import { describe, it, expect } from 'vitest';
import {
  CLEFS_GEMMES,
  CHEMIN_PERSONAS,
  extrairePersonas,
  controlerPersonas,
  type Personas,
} from './personas';

function huitPersonas(surcharge: Record<string, string> = {}): Record<string, string> {
  const base: Record<string, string> = {};
  for (const clef of CLEFS_GEMMES) base[clef] = `Voix de ${clef} pour ce jeu.`;
  return { ...base, ...surcharge };
}

describe('CHEMIN_PERSONAS', () => {
  it('vise le seul chemin que readDoc résout', () => {
    // Un fichier rangé ailleurs n'est jamais lu, sans le moindre message.
    expect(CHEMIN_PERSONAS('dune')).toBe('systems/dune/gems.json');
  });
});

describe('extrairePersonas', () => {
  it('lit les huit gemmes d\'un JSON nu', () => {
    const { personas } = extrairePersonas(JSON.stringify(huitPersonas()));
    expect(Object.keys(personas).sort()).toEqual([...CLEFS_GEMMES].sort());
  });

  it('défait le bloc de code que le prompt interdit pourtant', () => {
    const brut = '```json\n' + JSON.stringify(huitPersonas()) + '\n```';
    expect(extrairePersonas(brut).personas.oracle).toContain('oracle');
  });

  it('défait le bavardage autour de l\'objet', () => {
    const brut = 'Voici les personas :\n' + JSON.stringify(huitPersonas()) + '\nBonne partie !';
    expect(extrairePersonas(brut).personas.sage).toContain('sage');
  });

  it('refuse une gemme manquante plutôt que d\'écrire un fichier troué', () => {
    const partiel = huitPersonas();
    delete partiel.strategist;

    expect(() => extrairePersonas(JSON.stringify(partiel)))
      .toThrow(/strategist/);
  });

  it('refuse une gemme vide', () => {
    expect(() => extrairePersonas(JSON.stringify(huitPersonas({ bard: '   ' }))))
      .toThrow(/bard/);
  });

  it('signale les clés en trop au lieu de les perdre en silence', () => {
    const { ignorees } = extrairePersonas(JSON.stringify(huitPersonas({ narrateur: 'Inconnue.' })));
    expect(ignorees).toEqual(['narrateur']);
  });

  it('refuse une réponse qui n\'est pas du JSON', () => {
    expect(() => extrairePersonas("Je ne peux pas répondre.")).toThrow(/JSON/);
  });

  it('refuse un tableau : AIService indexe par clé', () => {
    expect(() => extrairePersonas('[{"sage": "x"}]')).toThrow();
  });
});

describe('controlerPersonas', () => {
  const personas = (surcharge: Record<string, string>) =>
    ({ ...huitPersonas(), ...surcharge }) as unknown as Personas;

  it('ne signale rien sur des personas conformes', () => {
    expect(controlerPersonas(personas({}))).toEqual([]);
  });

  it('signale une persona qui énonce une règle chiffrée', () => {
    // Le Stratège d'Alien v1 affirmait une règle que le corpus contredisait.
    const avis = controlerPersonas(personas({ strategist: 'Rappelle que 3 points de stress suffisent.' }));
    expect(avis.join(' ')).toContain('strategist');
    expect(avis.join(' ')).toContain('chiffrée');
  });

  it('signale une persona hors budget de prompt', () => {
    const avis = controlerPersonas(personas({ oracle: 'a'.repeat(1300) }));
    expect(avis.join(' ')).toContain('oracle');
    expect(avis.join(' ')).toContain('1300');
  });
});
