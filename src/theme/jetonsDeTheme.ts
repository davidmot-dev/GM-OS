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
 *
 * ⚠️ **Corrigé le 2026-09-26 (contrat v1.2)** : les fiches sont indépendantes
 * des thèmes, décision de David. L'interface est le **seul** consommateur, et
 * le contrat qu'elle honore vit dans `contratDuTheme.ts`.
 */

import { JETONS_DU_CONTRAT, HOTES_DE_POLICES } from './contratDuTheme';

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
/*
  **Le nom du bloc peut porter une espace** — corrigé le 2026-09-30, trouvé sur
  Cthulhu Hack. Le cahier demande le NOM DU DOSSIER dans `data-theme`, et deux
  dossiers en ont une (`cthulhu hack`, `reves de dragons`) : RPG Theme Builder
  a suivi la règle, et l'analyseur, qui n'acceptait qu'un mot, ne voyait plus
  aucun jeton. Entre guillemets, tout sauf le guillemet ; sans, un mot.

  ⛔ **Une seule expression, trois lecteurs** : la lecture des jetons, l'atelier
  (`editionDuTheme.ts`) et le nom relu par le validateur (`nomDuBloc`). Il y en
  avait deux copies et une troisième variante — corriger l'une aurait laissé
  l'atelier incapable de retoucher un thème que GM-OS sait lire.
*/
const VALEUR_DU_NOM = String.raw`(?:"[^"\]]*"|'[^'\]]*'|[\w-]+)`;
export const BLOC_RACINE = new RegExp(String.raw`(?::root|html)(?:\[data-theme=${VALEUR_DU_NOM}\])?\s*\{([^}]*)\}`, 'g');

/** Le nom que le bloc donne au thème (`:root[data-theme="cthulhu hack"]` → `cthulhu hack`), ou `null`. */
export function nomDuBloc(entete: string): string | null {
    const m = /data-theme=(?:"([^"\]]*)"|'([^'\]]*)'|([\w-]+))/.exec(entete);
    return m ? (m[1] ?? m[2] ?? m[3]) : null;
}

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

    for (const { corps } of blocsDeJetons(css)) {
        const polarite = CLARTE.exec(corps);
        if (polarite) clarte = polarite[1] as 'dark' | 'light';

        for (const [cle, valeur] of declarationsDuBloc(corps)) jetons[cle] = valeur;
    }

    return { jetons, clarte };
}

/**
 * **Les blocs de jetons, tels que la lecture les voit.**
 *
 * Exposé pour le validateur (`validationDuTheme.ts`) : il doit juger *ce que
 * GM-OS lit*, et un second analyseur finirait par voir autre chose. `entete`
 * est le sélecteur (`:root[data-theme="alien"]`), `corps` ce qu'il y a entre
 * les accolades — coupé à la première `}`, comme la lecture le coupe. `fin`
 * est la position qui suit l'accolade fermante.
 */
export function blocsDeJetons(css: string): { entete: string; corps: string; fin: number }[] {
    return [...css.matchAll(BLOC_RACINE)].map(m => ({
        entete: m[0].slice(0, m[0].indexOf('{')).trim(),
        corps: m[1],
        fin: m.index! + m[0].length,
    }));
}

/** Les déclarations `--rpg-*` d'un corps de bloc, dans l'ordre, doublons compris. */
export function declarationsDuBloc(corps: string): [cle: string, valeur: string][] {
    return [...corps.matchAll(DECLARATION)].map(d => [d[1].replace('--rpg-', ''), d[2].trim()]);
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
 *
 * **Dérivé du contrat depuis le 2026-09-26** (`contratDuTheme.ts`) : le cahier
 * des charges promet au constructeur ce que le pont applique, et les deux ne
 * peuvent plus diverger.
 */
const PONT: Record<string, string> = Object.fromEntries(
    /*
      **LU seulement** (2026-09-27) : un jeton V2 qui a déjà sa variable l'a
      pour les thèmes de base (`VARIABLE_DU_JETON`). Le jeu ne l'emprunte
      qu'une fois le jeton passé à LU — sinon le cahier dirait « sans effet
      aujourd'hui » d'un réglage qui change l'écran.
    */
    JETONS_DU_CONTRAT.filter(j => j.versLInterface && j.statut === 'LU').map(j => [j.cle, j.versLInterface!]),
);

/** Les jetons LU que le jeu n'applique que sous l'interrupteur des personnalités (contrat v1.4). */
const SOUS_L_INTERRUPTEUR = new Set(JETONS_DU_CONTRAT.filter(j => j.personnalites).map(j => j.cle));

/**
 * Les jetons de police que le pont applique **réellement** à l'interface.
 *
 * Deux sur quatre : `font-ui` n'appartient qu'à la démonstration du SDK, et
 * `font-body` ne s'applique qu'avec les personnalités allumées (contrat v1.4). **Il ne faut donc pas vérifier leur
 * disponibilité** — une police que rien n'emploie n'est jamais téléchargée par
 * le navigateur, et la déclarer manquante serait crier sur le cas normal.
 *
 * **Dérivée de `PONT`, jamais recopiée.** Une seconde liste écrite à la main
 * dériverait au premier jeton ajouté — c'est le motif que ce dépôt a payé cinq
 * fois le 2026-08-24.
 */
export const POLICES_APPLIQUEES = Object.keys(PONT).filter(j => j.startsWith('font-') && !SOUS_L_INTERRUPTEUR.has(j));

export interface OptionsDuPont {
    /**
     * Les personnalités sont-elles allumées ? Éteintes (le défaut), le jeu
     * n'applique que ce qu'il appliquait avant la v1.4 — décision de David,
     * 2026-09-29. Le réglage arrive avec P1.7.
     */
    personnalites?: boolean;
}

export function pontVersLInterface(
    jetons: Record<string, string>,
    { personnalites = false }: OptionsDuPont = {},
): Record<string, string> {
    const vars: Record<string, string> = {};

    for (const [jeton, variable] of Object.entries(PONT)) {
        if (!personnalites && SOUS_L_INTERRUPTEUR.has(jeton)) continue;
        const valeur = jetons[jeton];
        if (valeur) vars[variable] = valeur;
    }

    // § 4.6 : l'ancienne ombre unique sert d'élévation 2 quand celle-ci manque.
    if (personnalites && jetons.shadow && !jetons['elevation-2']) {
        vars['--elev-2'] = jetons.shadow;
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

/* Les hôtes autorisés vivent dans le contrat (§ 3.6) : le validateur refuse ce que ce chargeur ignorerait. */
const IMPORT_CSS = /@import\s+url\(\s*['"]?([^'")]+)['"]?\s*\)/g;

/**
 * **Les `@import` de polices d'un thème, à charger séparément.**
 *
 * Signalé par David le 2026-08-24 : *« en réalité les thèmes ne changent pas la
 * police »*. La variable était bien posée — `--font-display: "Montserrat", …` —
 * mais **Montserrat n'était jamais téléchargée**, donc le navigateur retombait
 * en silence sur `Arial Narrow`.
 *
 * La cause tient à la conception : on extrait les jetons **sans charger la
 * CSS**, donc l'`@import` que chaque thème porte n'était jamais exécuté. La
 * police était déclarée, jamais fournie.
 *
 * *Une police absente n'échoue pas, elle se remplace* — c'est le piège que le
 * plan du 23/08 annonçait sous « polices en liste close ». On refuse d'ailleurs
 * le remède évident, qui serait d'ajouter ces polices à la liste globale
 * d'`index.css` : ça marcherait aujourd'hui et casserait au cinquième thème,
 * puisqu'il faudrait de nouveau éditer du code. **La promesse « déposer un
 * fichier suffit » ne survit qu'en lisant ce que le fichier déclare.**
 */
export function extraireImportsDePolice(css: string): string[] {
    const urls: string[] = [];

    for (const m of css.matchAll(IMPORT_CSS)) {
        const brut = m[1].trim();
        let url: URL;
        try {
            url = new URL(brut);
        } catch {
            continue; // un chemin relatif : rien à charger depuis le document
        }
        if (url.protocol !== 'https:') continue;
        if (!HOTES_DE_POLICES.includes(url.hostname)) {
            console.warn(
                `[ThèmeDuJeu] Import ignoré, hôte non autorisé : ${url.hostname}. ` +
                `Hôtes acceptés : ${HOTES_DE_POLICES.join(', ')}.`,
            );
            continue;
        }
        if (!urls.includes(url.href)) urls.push(url.href);
    }

    return urls;
}

/**
 * Le premier nom de famille d'une pile de polices — celui que le thème veut
 * vraiment, les suivants étant ses replis.
 */
export function premiereFamille(pile: string | undefined): string | null {
    if (!pile) return null;
    const premier = pile.split(',')[0]?.trim();
    if (!premier) return null;
    return premier.replace(/^['"]|['"]$/g, '') || null;
}
