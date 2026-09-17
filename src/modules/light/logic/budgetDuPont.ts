/**
 * **Le budget du pont Hue — la ressource rare de tout Light-OS.**
 *
 * ⛔ Le pont tient de l'ordre de **dix commandes par seconde, toutes lampes
 * confondues**. Chaque lampe sous effet a sa propre boucle : quatre lampes à
 * 100 ms en demandent quarante. C'est le plafond contre lequel toute idée de ce
 * module doit se mesurer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ Le 2026-09-17, cette valeur a été écrite **deux fois dans la même journée** —
 * `DEBIT_DU_PONT` dans `cadenceDeFusillade`, `BUDGET_DU_PONT` dans
 * `solistesDeLEffet` — par le même auteur, à deux heures d'écart, en ayant
 * dénoncé ce motif dans les deux fichiers. *Une seconde déclaration de la même
 * vérité dérive toujours, et savoir qu'elle dérive n'empêche rien.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ LES TROIS FAMILLES D'EFFETS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le budget se tient de trois façons, et le choix dépend de **ce qui fait
 * l'identité de l'effet** :
 *
 * | Famille | Règle | Parce que |
 * | --- | --- | --- |
 * | **Soliste** | Peu de lampes, pleine cadence | L'identité **est** la vitesse — *un stroboscope ralenti cesse d'être un stroboscope* |
 * | **Adaptatif** | Toutes les lampes, cadence partagée | L'identité est la **texture** — *un incendie sur six lampes lentes ressemble plus à un incendie que sur deux rapides* |
 * | **Lent** | Rien à faire | Déjà sous le budget |
 */

/** Ce que le pont accepte, en commandes par seconde, toutes lampes confondues. */
export const BUDGET_DU_PONT = 10;

/**
 * **La cadence d'un effet adaptatif, quand `lampes` le jouent ensemble.**
 *
 * Chaque lampe ne peut occuper qu'un `L`-ième du budget, soit au mieux une
 * commande toutes les `1000 × L / D` millisecondes. On ne descend jamais sous la
 * cadence nominale de l'effet : *le partage ralentit, il n'accélère pas.*
 *
 * ```text
 *   1 lampe  → la cadence nominale
 *   4 lampes → au moins 400 ms
 *   6 lampes → au moins 600 ms
 * ```
 */
export const cadencePartagee = (
    nominalMs: number,
    lampes: number,
    budget: number = BUDGET_DU_PONT,
): number => {
    const L = Number.isFinite(lampes) && lampes > 0 ? Math.floor(lampes) : 1;
    const D = Number.isFinite(budget) && budget > 0 ? budget : BUDGET_DU_PONT;
    return Math.max(nominalMs, Math.ceil((1000 * L) / D));
};
