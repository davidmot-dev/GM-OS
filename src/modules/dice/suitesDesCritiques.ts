import type { DegreDeReussite } from './degresDeReussite';

/**
 * **Les suites d'une maladresse ou d'un critique** — Nephilim Légende,
 * 2026-10-18 (`docs/systems/nephilim/rules/degres-de-reussite-et-critiques.md`) :
 * *« Une maladresse sur un Vécu contemporain ajoute un degré d'Ombre, tandis
 * qu'une maladresse en Art occulte ajoute un degré de Khaïba »* ; une réussite
 * critique en Science occulte rapporte un Point de Sapience.
 *
 * GM-OS annonçait la maladresse et n'en tirait rien : le meneur devait se
 * souvenir, en pleine scène, de la jauge à monter. La suite dépend de **ce qui
 * a été lancé** — le même double raté coûte de l'Ombre sur un Vécu
 * contemporain, du Khaïba sur un sortilège —, d'où les `sections` et les
 * `champs` : le champ retenu au jet doit en venir.
 *
 * **Proposée, jamais écrite seule** (choix de David, 2026-10-18) : le panneau
 * affiche un bouton, le meneur tranche. La règle a ses exceptions (une
 * invocation de Kabbale ratée rompt le pacte sans Khaïba), et c'est à la table
 * de les reconnaître.
 */
export interface SuiteDUnCritique {
    /** Le résultat qui déclenche la suite. */
    quand: 'maladresse' | 'critique';
    /** Ce que la carte annonce : « Maladresse de Magie ». */
    label: string;
    /** Ce que dit la règle, avec sa page. */
    rappel?: string;
    /** Le champ retenu au jet vient de l'une de ces sections de la fiche… */
    sections?: string[];
    /** …ou est l'un de ces champs. Sans l'un ni l'autre, tout jet compte. */
    champs?: string[];
    /**
     * Le geste proposé : `pas` (1 par défaut, négatif pour retirer) ajouté à
     * `champ` — ou au champ que le jet a retenu pour la `composante` (le Ka du
     * construct d'une transmutation ratée), s'il vient de `dansLesSections`.
     */
    ajouter?: { champ?: string; composante?: string; dansLesSections?: string[]; pas?: number };
}

/** Le champ que touche le geste d'une suite, pour ce jet ; `undefined` s'il n'y en a pas. */
export function champDeLaSuite(
    suite: Pick<SuiteDUnCritique, 'ajouter'>,
    retenus: Record<string, string>,
    sections: readonly SectionLue[],
): string | undefined {
    const a = suite.ajouter;
    if (!a) return undefined;
    if (a.champ) return a.champ;
    const retenu = a.composante ? retenus[a.composante] : undefined;
    if (!retenu) return undefined;
    if (a.dansLesSections?.length && !jetVientDe({ sections: a.dansLesSections }, [retenu], sections)) return undefined;
    return retenu;
}

const DEGRE_DU_CRITIQUE: Record<SuiteDUnCritique['quand'], DegreDeReussite> = {
    maladresse: 'echec-total',
    critique: 'reussite-particuliere',
};

interface SectionLue {
    id: string;
    fields: readonly { id: string }[];
}

/**
 * **Ce jet vient-il de là ?** — un des champs retenus est l'un des `champs`, ou
 * vient de l'une des `sections`. Sans l'un ni l'autre, tout jet compte.
 * Partagé avec les réserves du personnage (`ApportDuGroupe.si`) : la Stase ne
 * sert qu'au lancer d'un sort.
 */
export function jetVientDe(
    cible: { sections?: readonly string[]; champs?: readonly string[] } | undefined,
    retenus: readonly string[],
    sections: readonly SectionLue[],
): boolean {
    if (!cible || (!cible.sections?.length && !cible.champs?.length)) return true;
    const sectionDuChamp = new Map(sections.flatMap(s => s.fields.map(f => [f.id, s.id] as const)));
    return retenus.some(champ =>
        (cible.champs ?? []).includes(champ)
        || (cible.sections ?? []).includes(sectionDuChamp.get(champ) ?? ''));
}

/** Les suites que ce jet déclenche, dans l'ordre du pilote. */
export function suitesDuJet(
    suites: readonly SuiteDUnCritique[] | undefined,
    degre: DegreDeReussite | undefined,
    retenus: readonly string[],
    sections: readonly SectionLue[],
): SuiteDUnCritique[] {
    if (!suites?.length || !degre) return [];
    return suites.filter(suite => DEGRE_DU_CRITIQUE[suite.quand] === degre && jetVientDe(suite, retenus, sections));
}

/** La valeur après le geste : jamais sous zéro, jamais au-dessus du maximum du champ. */
export function valeurApresLaSuite(actuelle: number, pas = 1, max?: number): number {
    const brute = actuelle + pas;
    return Math.max(0, max !== undefined ? Math.min(max, brute) : brute);
}
