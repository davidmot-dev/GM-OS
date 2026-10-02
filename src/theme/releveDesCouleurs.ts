/**
 * **Les couleurs écrites en dur — les compter, pour les voir disparaître.**
 *
 * Phase 0 de la refonte (`documentation/Planning/2026-09-17-refonte-interface.md`,
 * T0.2 et T0.4). L'architecture a mesuré ~4 100 classes de la palette Tailwind
 * brute (`bg-red-500`, `text-slate-400`…) : ce ne sont pas des négligences, ce
 * sont **trois familles sans jeton** — états, texte secondaire, catégories. La
 * refonte leur donne des jetons ; ce relevé dit combien il en reste.
 *
 * Analyse pure, sans entrée/sortie : on lui donne le texte d'un fichier. Deux
 * lecteurs, un seul comptage — `electron/couleursBrutes.test.ts` (la garde des
 * modules migrés) et `scripts/refonte-releve.mjs` (le relevé chiffré).
 */

/** Les propriétés qui prennent une couleur dans Tailwind. */
const PROPRIETES = [
    'bg', 'text', 'border', 'from', 'via', 'to', 'ring', 'ring-offset', 'shadow', 'fill', 'stroke',
    'outline', 'divide', 'placeholder', 'decoration', 'accent', 'caret',
    'border-t', 'border-b', 'border-l', 'border-r', 'border-x', 'border-y',
];

/** Les teintes de la palette Tailwind, plus le blanc et le noir. */
const TEINTES = [
    'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green',
    'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
];

/**
 * `bg-red-500`, `hover:text-slate-400/60`, `border-l-amber-400`, `bg-white/10`…
 *
 * ⚠️ Le blanc et le noir comptent : `text-white` sur un thème clair est
 * exactement le défaut que la refonte doit résorber. Mais pas `bg-transparent`
 * ni `text-current`, qui ne sont pas des couleurs.
 */
export const COULEUR_BRUTE = new RegExp(
    `(?<![\\w-])(?:${PROPRIETES.join('|')})-(?:(?:${TEINTES.join('|')})-\\d{2,3}|white|black)(?:\\/\\d{1,3})?(?![\\w-])`,
    'g',
);

export function compterLesCouleursBrutes(source: string): number {
    return source.match(COULEUR_BRUTE)?.length ?? 0;
}

/**
 * Le « lieu » d'un fichier pour le relevé : son module sous `src/modules/`, ou
 * son premier dossier sous `src/`. Le chemin est relatif à `src/`, séparé par `/`.
 */
export function lieuDuFichier(relatifASrc: string): string {
    const parties = relatifASrc.split('/');
    if (parties[0] === 'modules' && parties.length > 2) return `modules/${parties[1]}`;
    return parties.length > 1 ? parties[0] : '(racine)';
}

/**
 * **Les palettes de contenu — des couleurs qui sont la donnée, pas le châssis.**
 * Refonte, phase 4, lot L2 — 2026-10-02.
 *
 * Une teinte de pastille (« Ambre », « Rose ») ou la couleur d'un effet de
 * lumière (« Sirène » en rouge, « Aurore » en cyan) **est** ce que le meneur
 * choisit : la remplacer par un jeton d'état ferait dire « danger » à une
 * pastille rouge, et un thème de jeu repeindrait la sirène. Elles restent donc
 * en palette brute, et le relevé ne les compte pas.
 *
 * ⚠️ **Fichier entier, liste courte, raison écrite.** Le chrome qui vivrait dans
 * ces fichiers échapperait à la garde : on l'en sort d'abord (« Aucune » parle
 * en jetons). Un fichier ne s'ajoute ici que s'il ne contient **que** du contenu.
 */
export const PALETTES_DE_CONTENU: Readonly<Record<string, string>> = {
    'modules/music/logic/couleursDePastille.ts': 'les huit teintes que le meneur donne à une pastille',
    'modules/light/logic/catalogueDesEffets.ts': 'la couleur de chaque effet de lumière, celle de la lampe',
    'modules/clock/components/ClockVisualizer.tsx': 'la matière des trois cadrans dessinés (laiton, néon, moderne), que le meneur choisit',
};

/** Les fichiers qui comptent : le code de l'interface, pas ses essais ni ses palettes de contenu. */
export function fichierCompte(relatifASrc: string): boolean {
    return /\.(tsx|ts)$/.test(relatifASrc) && !/\.test\.(tsx|ts)$/.test(relatifASrc)
        && !(relatifASrc in PALETTES_DE_CONTENU);
}
