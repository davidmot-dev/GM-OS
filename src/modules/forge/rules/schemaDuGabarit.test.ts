import { describe, it, expect } from 'vitest';
import { GROUPES, SCHEMA_DU_GABARIT } from './GroupesDeChamps';

/**
 * Ce que ces tests protègent : **la forme du gabarit est imposée au décodeur,
 * pas demandée au modèle**.
 *
 * Quatre échecs d'affilée sur la fiche de personnage d'Alien, et trois
 * hypothèses réfutées l'une après l'autre — la sortie trop longue, la
 * température, la pénalité de répétition. La sonde du 2026-08-12 a fini par
 * montrer la vraie raison : **c'était du contenu qui débordait**. Sommé de ne
 * rendre que des sections sans champs, le modèle a fourré les champs dans la
 * chaîne `label`, guillemets échappés compris. Il ne dégénérait pas, il
 * cherchait une place.
 *
 * | | tokens | `done_reason` | résultat |
 * |---|---|---|---|
 * | invite libre | 447 | stop | cassait à la position 1 027 |
 * | schéma « sections seules » | 236 | stop | valide, champs fourrés dans un `label` |
 * | **schéma du gabarit entier** | **465** | **stop** | **complet et valide** |
 *
 * Une consigne se contourne ; une grammaire, non.
 */

const groupeFiche = GROUPES.find(g => g.id === 'fiche')!;

describe('le gabarit de fiche est contraint par un schéma', () => {
  it('le groupe « fiche » en porte un', () => {
    expect(groupeFiche.schema).toBe(SCHEMA_DU_GABARIT);
  });

  it('aucune clé de trop n\'est permise, à aucun niveau', () => {
    /**
     * C'est `additionalProperties: false` qui interdit au modèle d'inventer un
     * champ — et donc de reproduire le `{":false,` ou le `_Note:` qui
     * cassaient le parsing.
     */
    const schema = SCHEMA_DU_GABARIT as Record<string, any>;
    const gabarit = schema.properties.template;
    const section = gabarit.properties.sections.items;
    const champ = section.properties.fields.items;

    expect(schema.additionalProperties).toBe(false);
    expect(gabarit.additionalProperties).toBe(false);
    expect(section.additionalProperties).toBe(false);
    expect(champ.additionalProperties).toBe(false);
  });

  it('une section a toujours ses champs, même vides', () => {
    // `fields` requis évite la section fantôme, que rien n'aurait signalée.
    const section = (SCHEMA_DU_GABARIT as Record<string, any>)
      .properties.template.properties.sections.items;
    expect(section.required).toEqual(['id', 'label', 'fields']);
  });

  it('le type d\'un champ est pris dans la liste que la fiche sait rendre', () => {
    /**
     * Le modèle avait rendu `type: "string"`, qui n'existe pas — le composant
     * de fiche serait retombé sur son cas par défaut, sans rien dire. Ici il
     * ne peut plus : l'énumération est dans la grammaire.
     */
    const champ = (SCHEMA_DU_GABARIT as Record<string, any>)
      .properties.template.properties.sections.items.properties.fields.items;
    expect(champ.properties.type.enum).toEqual(
      ['number', 'text', 'checkbox', 'gauge', 'select', 'textarea', 'rating'],
    );
  });
});
