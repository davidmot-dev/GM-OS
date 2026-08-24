/**
 * **Les jetons d'un thème de jeu : les lire, et les traduire.**
 *
 * Analyse pure, sans aucune entrée/sortie : ce module ne connaît ni le pont
 * Electron ni `window`. C'est ce qui lui permet d'être éprouvé depuis
 * `electron/themesDesJeux.test.ts`, qui lit les vrais fichiers du dépôt et
 * tourne dans un programme Node où `window` n'existe pas.
 *
 * Le chargement vit dans `themeDuJeu.ts`.
 *
 * **Déposer un fichier suffit.**
 *
 * Un jeu qui veut sa peau pose un `theme.css` dans
 * `docs/systems/<jeu>/theme/`. Rien d'autre — pas de registre à compléter, pas
 * de code à changer, pas de recompilation. Le dossier du système est déjà
 * rapproché du pilote par `resoudreCorpus`, y compris quand l'identifiant du
 * pilote est un horodatage.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI ON EXTRAIT LES JETONS AU LIEU D'INJECTER LA CSS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le SDK de thèmes livre deux choses : **22 jetons** et **un vocabulaire de
 * composants `.rpg-*`**. Mesuré sur les trois premiers jeux, ce vocabulaire est
 * celui d'une **page de livre** — `page`, `header`, `footer`, `page-chip`,
 * `kicker`, `callout`. L'interface de GM-OS est un cockpit : modules ancrés,
 * cartes de combattant, barres d'outils. *Les six seules racines communes aux
 * trois jeux étaient les primitives de formulaire.*
 *
 * Injecter la CSS entière colorerait donc **presque rien** ici, tout en
 * imposant `data-theme="alien"` sur la racine — or GM-OS y met déjà sa famille
 * d'interface, et trente-deux règles d'`index.css` en dépendent pour rendre
 * lisible le thème clair. **Deux vocabulaires sur un même attribut, le dernier
 * écrivain gagne.**
 *
 * On prend donc ce qui transfère — les jetons — et on laisse les composants à
 * qui ils servent : **l'iframe des fiches de personnage**, où `data-theme` est
 * libre et où le SDK fonctionne tel quel, sans une ligne de modification.
 * C'est la même séparation que le SDK documente lui-même sous « deux
 * consommateurs ».
 */

/** Les jetons `--rpg-*` d'un thème, plus sa polarité. */
export interface JetonsDuJeu {
    /** `--rpg-bg` → `bg`, etc. Les noms sont ceux du SDK, sans le préfixe. */
    jetons: Record<string, string>;
    /** `dark` ou `light`, tel que le thème le déclare. Absent s'il ne le dit pas. */
    clarte?: 'dark' | 'light';
}

/**
 * Les blocs `:root` d'une feuille, dans l'ordre — le dernier gagne.
 *
 * On accepte `:root`, `:root[data-theme="x"]` et `html[data-theme="x"]` **sans
 * exiger que l'identifiant corresponde au dossier**. C'est délibéré : le
 * dossier dit déjà de quel jeu il s'agit, et forcer l'auteur à faire coïncider
 * les deux serait une deuxième déclaration de la même vérité — donc une
 * occasion de les faire diverger.
 */
const BLOC_RACINE = /(?::root|html)(?:\[data-theme=["']?[\w-]+["']?\])?\s*\{([^}]*)\}/g;

const DECLARATION = /(--rpg-[\w-]+)\s*:\s*([^;]+)\s*;/g;
const CLARTE = /color-scheme\s*:\s*(dark|light)\s*;/;

/**
 * Lit les jetons d'une feuille de thème.
 *
 * Volontairement tolérante : elle ne valide pas, elle relève. Un thème
 * incomplet donnera moins de jetons, et le repli du thème d'interface comblera
 * le reste — plutôt que de refuser le fichier entier pour une ligne manquante.
 */
export function extraireJetons(css: string): JetonsDuJeu {
    const jetons: Record<string, string> = {};
    let clarte: 'dark' | 'light' | undefined;

    for (const bloc of css.matchAll(BLOC_RACINE)) {
        const corps = bloc[1];

        const polarite = CLARTE.exec(corps);
        if (polarite) clarte = polarite[1] as 'dark' | 'light';

        for (const d of corps.matchAll(DECLARATION)) {
            jetons[d[1].replace('--rpg-', '')] = d[2].trim();
        }
    }

    return { jetons, clarte };
}

/**
 * **Le pont : huit correspondances suffisent.**
 *
 * L'interface consomme des noms en `--app-*` — c'est à eux que Tailwind est
 * lié, et six mille sept cents usages de classes en dépendent. Les quatorze
 * autres jetons du SDK n'ont aucun équivalent ici ; ils ne sont pas perdus pour
 * autant, les fiches les liront.
 *
 * On ne rend que ce que le thème déclare **vraiment** : une clé absente laisse
 * la valeur du thème d'interface en place, au lieu d'écrire `undefined` par
 *-dessus une couleur qui marchait.
 */
const PONT: Record<string, string> = {
    bg: '--app-bg',
    surface: '--app-surface',
    text: '--app-text',
    muted: '--app-text-muted',
    accent: '--app-accent',
    border: '--app-border',
    'font-display': '--font-display',
    'font-mono': '--font-mono',
};

export function pontVersLInterface(jetons: Record<string, string>): Record<string, string> {
    const vars: Record<string, string> = {};

    for (const [jeton, variable] of Object.entries(PONT)) {
        const valeur = jetons[jeton];
        if (valeur) vars[variable] = valeur;
    }

    /*
      **`surface` a un repli sur `paper`, et l'inverse n'existe pas.**

      Les trois premiers jeux montrent deux conceptions : Alien empile
      `bg` → `surface` → `paper` du plus sombre au plus clair, NOC et Star Trek
      posent un « bureau » sombre avec du papier clair par-dessus. Dans les deux
      cas c'est `surface` que l'interface veut — mais un thème qui ne parlerait
      que de papier ne doit pas se retrouver sans surface du tout.
    */
    if (!vars['--app-surface'] && jetons.paper) {
        vars['--app-surface'] = jetons.paper;
    }

    return vars;
}

/**
 * Le chemin, relatif à `docs/`, du thème d'un système.
 *
 * `racine` est ce que rend `resoudreCorpus` — par exemple `systems/alien`.
 */
export function cheminDuTheme(racine: string): string {
    return `${racine}/theme/theme.css`;
}
