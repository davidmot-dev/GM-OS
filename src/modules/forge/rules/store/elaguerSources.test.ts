import { describe, it, expect, beforeEach } from 'vitest';
import { useBrainstormStore } from './useBrainstormStore';

/**
 * Une source cochée dans un carnet n'a aucun sens dans un autre.
 *
 * Le défaut relevé le 2026-08-10 : changer de carnet ne vidait pas la sélection.
 * Les identifiants du carnet précédent partaient comme filtre vers le nouveau —
 * et **sans que rien ne se voie**, puisque la corbeille de contexte n'affiche
 * que les sources du carnet courant : une sélection étrangère s'y montre comme
 * « aucune source sélectionnée » pendant que la requête filtre dessus.
 */
describe('elaguerSources', () => {
  beforeEach(() => useBrainstormStore.getState().reset());

  const selection = () => useBrainstormStore.getState().selectedSourceIds;

  it('retire les sources qui n\'appartiennent pas au carnet ouvert', () => {
    useBrainstormStore.getState().setSources(['blade-1', 'blade-2']);
    useBrainstormStore.getState().elaguerSources(['dune-1', 'dune-2', 'dune-3']);
    expect(selection()).toEqual([]);
  });

  it('conserve ce qui a déjà été coché sur ce carnet', () => {
    // On élague, on ne vide pas : revenir sur un carnet déjà visité doit
    // retrouver sa sélection.
    useBrainstormStore.getState().setSources(['dune-1', 'blade-9', 'dune-3']);
    useBrainstormStore.getState().elaguerSources(['dune-1', 'dune-2', 'dune-3']);
    expect(selection()).toEqual(['dune-1', 'dune-3']);
  });

  it('ne touche à rien quand tout est valide', () => {
    useBrainstormStore.getState().setSources(['dune-1']);
    const avant = selection();
    useBrainstormStore.getState().elaguerSources(['dune-1', 'dune-2']);
    // Identité préservée : pas de rendu inutile.
    expect(selection()).toBe(avant);
  });

  it('vide la sélection face à un carnet sans source', () => {
    useBrainstormStore.getState().setSources(['dune-1']);
    useBrainstormStore.getState().elaguerSources([]);
    expect(selection()).toEqual([]);
  });
});
