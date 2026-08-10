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
describe('setSourcesDuCarnet', () => {
  beforeEach(() => {
    useBrainstormStore.getState().reset();
    useBrainstormStore.getState().setSources([]);
    useBrainstormStore.getState().setSourcesDuCarnet([]);
  });

  const selection = () => useBrainstormStore.getState().selectedSourceIds;
  const catalogue = (ids: string[]) => ids.map(id => ({ id, titre: `Source ${id}` }));

  it('retire les sources qui n\'appartiennent pas au carnet ouvert', () => {
    useBrainstormStore.getState().setSources(['blade-1', 'blade-2']);
    useBrainstormStore.getState().setSourcesDuCarnet(catalogue(['dune-1', 'dune-2', 'dune-3']));
    expect(selection()).toEqual([]);
  });

  it('conserve ce qui a déjà été coché sur ce carnet', () => {
    // On élague, on ne vide pas : revenir sur un carnet déjà visité doit
    // retrouver sa sélection.
    useBrainstormStore.getState().setSources(['dune-1', 'blade-9', 'dune-3']);
    useBrainstormStore.getState().setSourcesDuCarnet(catalogue(['dune-1', 'dune-2', 'dune-3']));
    expect(selection()).toEqual(['dune-1', 'dune-3']);
  });

  it('ne touche à rien quand tout est valide', () => {
    useBrainstormStore.getState().setSources(['dune-1']);
    const avant = selection();
    useBrainstormStore.getState().setSourcesDuCarnet(catalogue(['dune-1', 'dune-2']));
    // Identité préservée : pas de rendu inutile.
    expect(selection()).toBe(avant);
  });

  it('retient le catalogue du carnet, pour pouvoir nommer les sources', () => {
    useBrainstormStore.getState().setSourcesDuCarnet(catalogue(['dune-1']));
    expect(useBrainstormStore.getState().sourcesDuCarnet).toEqual([
      { id: 'dune-1', titre: 'Source dune-1' },
    ]);
  });

  it('vide la sélection face à un carnet sans source', () => {
    useBrainstormStore.getState().setSources(['dune-1']);
    useBrainstormStore.getState().setSourcesDuCarnet([]);
    expect(selection()).toEqual([]);
  });
});

describe('reset', () => {
  it('conserve la configuration et ne defait que la serie', () => {
    /**
     * Le carnet ouvert, son catalogue et la selection sont des reglages, pas des
     * etats de serie. Les effacer creait un ecart silencieux : `notebookSources`
     * est un etat local de `ForgeDashboard` qui survit a la fermeture, si bien
     * que re-cocher une source restaurait son identifiant sans son titre — et
     * l ecran affichait un UUID brut a la place du nom du fichier.
     */
    const store = useBrainstormStore.getState();
    store.setNotebook('nb-1', 'Dune');
    store.setSourcesDuCarnet([{ id: 'src-1', titre: 'Livre de base.pdf' }]);
    store.setSources(['src-1']);
    store.setCorpusCible('dune');
    store.setCandidates([{ id: 'x', title: 'X', category: 'rule', summary: '', tags: [] }], 'brut');

    useBrainstormStore.getState().reset();
    const apres = useBrainstormStore.getState();

    // La configuration tient.
    expect(apres.notebookId).toBe('nb-1');
    expect(apres.notebookTitre).toBe('Dune');
    expect(apres.sourcesDuCarnet).toEqual([{ id: 'src-1', titre: 'Livre de base.pdf' }]);
    expect(apres.selectedSourceIds).toEqual(['src-1']);
    expect(apres.corpusCible).toBe('dune');

    // La serie tombe.
    expect(apres.step).toBe('idle');
    expect(apres.candidates).toEqual([]);
    expect(apres.inventaireBrut).toBeNull();
  });
});
