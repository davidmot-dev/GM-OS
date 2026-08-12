import { describe, it, expect } from 'vitest';
import { GROUPES, fichesDuGroupe, promptDuGroupe, type FicheDuCorpus } from './GroupesDeChamps';
import { sujetDeLaFiche, corpsDeLaFiche } from './lectureDuCorpus';

/**
 * Ce que ces tests protègent : **la Forge dérivée tient dans le contexte du
 * modèle, sur les fiches réelles du dépôt**.
 *
 * Mesuré le 2026-08-12 sur `gemma4:12b`, contexte de 16 384 tokens. **Dépasser
 * ce plafond ne coûte pas le dépassement : il coûte la moitié de tout.**
 * llama.cpp garde `n_keep` tokens de tête puis la dernière moitié du contexte,
 * soit `4 + (16384 - 4) / 2 = 8 194`. Vérifié sur des invites de 33 500 et de
 * 55 800 tokens : **8 195 tokens traités dans les deux cas**, et c'est la FIN de
 * l'invite qui survit — sonde à deux marqueurs, seul celui de la queue est
 * revenu. Pas d'erreur, pas d'avertissement, juste un modèle qui répond sur ce
 * qu'il n'a pas lu. C'est le défaut qui vidait déjà le RAG, et c'est celui qui
 * condamnait `forgeSystem` et ses 100 000 caractères de livre.
 *
 * Le découpage par groupe de champs n'est donc pas une élégance : c'est la
 * seule façon de tenir. On le vérifie **sur les fiches du disque**, pas sur un
 * exemple écrit pour l'occasion — un corpus grossit, une fiche se reforge plus
 * longue, et la troncature reviendrait sans que rien ne le dise.
 *
 * Les fichiers sont chargés par `import.meta.glob` : c'est Vite qui les lit à
 * la compilation du test, ce qui donne la charge réelle sans passer par `fs`,
 * inutilisable dans l'environnement du renderer.
 */

const BRUTS = import.meta.glob('../../../../docs/systems/*/rules/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * Le budget d'invite qu'on s'accorde, en caractères.
 *
 * 8 000 tokens à **2,92 caractères par token** — la tokenisation mesurée du
 * français, pas les 4 caractères usuels de l'anglais. Un dixième est gardé en
 * réserve : la réponse partage le contexte avec l'invite.
 *
 * **C'est la moitié du plafond réel de 16 384, et c'est délibéré.** Le
 * dépassement ne se dégrade pas, il tombe d'un coup à 8 194 tokens ; on ne
 * s'approche donc pas du bord, on reste à un facteur deux de lui. Ce budget-ci
 * est aussi celui qui vaudrait si `OLLAMA_NUM_PARALLEL` passait à 2 — le
 * contexte se diviserait alors entre les deux emplacements.
 */
const BUDGET_CARACTERES = 8000 * 2.92 * 0.9;

function corpusDocumentes(): { systeme: string; fiches: FicheDuCorpus[] }[] {
  const parSysteme = new Map<string, FicheDuCorpus[]>();

  for (const [chemin, brut] of Object.entries(BRUTS)) {
    const systeme = /docs\/systems\/([^/]+)\/rules\//.exec(chemin)?.[1];
    if (!systeme) continue;

    const sujet = sujetDeLaFiche(brut);
    const contenu = corpsDeLaFiche(brut);
    // Une fiche sans sujet ne se rattache à aucun groupe : elle ne pèse rien
    // sur le budget, et le guide de synthèse d'Alien en est un cas voulu.
    if (!sujet || !contenu) continue;

    parSysteme.set(systeme, [...(parSysteme.get(systeme) ?? []), { sujet, contenu }]);
  }

  return [...parSysteme.entries()].map(([systeme, fiches]) => ({ systeme, fiches }));
}

const CORPUS = corpusDocumentes();

describe('la Forge dérivée tient dans le contexte, sur les corpus réels', () => {
  it('il y a au moins un corpus documenté à vérifier', () => {
    // Sans cette garde, tout ce qui suit passerait au vert sur une liste vide —
    // le pire des faux positifs, celui qui se félicite de rien. Un chemin de
    // glob cassé se voit ici, et nulle part ailleurs.
    expect(CORPUS.length, 'aucune fiche lue sous docs/systems/*/rules').toBeGreaterThan(0);
  });

  for (const { systeme, fiches } of CORPUS) {
    for (const groupe of GROUPES) {
      const retenues = fichesDuGroupe(groupe, fiches);
      if (retenues.length === 0) continue;

      it(`« ${systeme} » — le groupe « ${groupe.label} » tient dans le budget d'invite`, () => {
        const invite = promptDuGroupe(groupe, fiches);
        expect(
          invite.length,
          `${invite.length} caractères pour ${retenues.length} fiche(s) : au-delà de ` +
            `${Math.round(BUDGET_CARACTERES)}, la fin de l'invite est jetée en silence. ` +
            `Découper le groupe, ou raccourcir les fiches.`,
        ).toBeLessThan(BUDGET_CARACTERES);
      });
    }
  }

  it('chaque fiche rattachée à un groupe est bien recopiée dans son invite', () => {
    /**
     * Le rapprochement fiche → groupe passe par `normaliser`. Une fiche
     * rattachée mais non recopiée serait le pire des cas : le groupe partirait
     * sans elle, le modèle répondrait sur du vide, et rien ne compterait cela
     * comme une lacune puisque le groupe *avait* une fiche.
     */
    for (const { systeme, fiches } of CORPUS) {
      for (const groupe of GROUPES) {
        const invite = promptDuGroupe(groupe, fiches);
        for (const fiche of fichesDuGroupe(groupe, fiches)) {
          expect(invite, `${systeme}/${groupe.id} : « ${fiche.sujet} » manque à l'invite`)
            .toContain(fiche.contenu);
        }
      }
    }
  });
});
