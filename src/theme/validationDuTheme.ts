/**
 * **Le validateur d'un thème de jeu : le contrat, vérifié de bout en bout.**
 *
 * Le constructeur de thèmes (*RPG Theme Builder*, dans ChatGPT) ne voit pas le
 * dépôt. Ce qu'il livre est déposé tel quel dans `docs/systems/<jeu>/theme/`,
 * puis passé ici : **ce qui se prouve par du code ne se demande pas à un
 * modèle.** Le rapport revient au constructeur par David, en texte prêt à
 * coller — le constructeur *lit* les contrastes, il ne les recalcule pas.
 *
 * Analyse pure, sans entrée/sortie : on lui donne le texte des fichiers, il rend
 * un rapport. La lecture du disque vit dans `scripts/theme-valider.mjs` et dans
 * `electron/validationDesThemes.test.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'IL NE FAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - **Il ne répare rien.** Un thème refusé repasse par son constructeur, sinon
 *   deux auteurs se contredisent au tour suivant.
 * - **Il ne juge pas le goût.** La vitrine montre, David juge.
 * - **Il ne vérifie pas les jetons SDK** : sans effet dans GM-OS, ils ne
 *   peuvent pas y être faux.
 *
 * Chaque remarque cite **la section du cahier** qu'elle applique : le
 * constructeur doit pouvoir la retrouver sans deviner.
 */

import {
    JETONS_DU_CONTRAT, PAIRES_DU_CONTRAT, HOTES_DE_POLICES, EMPLACEMENTS_D_ORNEMENT,
    TAILLES_MAXIMALES, VERSION_DU_CONTRAT, jetonDuContrat,
    type FormatDeJeton, type JetonDuContrat,
} from './contratDuTheme';
import { blocsDeJetons, declarationsDuBloc, extraireJetons } from './jetonsDeTheme';
import { contraste, POLICES_CONNUES } from './editionDuTheme';

/* ────────────────────────────────────────────────────────────────────────────
   L'ENTRÉE ET LA SORTIE
   ──────────────────────────────────────────────────────────────────────────── */

/** Un fichier du dossier `theme/`, hors `theme.css`. */
export interface FichierDuTheme {
    /** En octets. */
    taille: number;
    /** Le texte, pour les fichiers qui se lisent (`.svg`, `.json`, `.md`). */
    contenu?: string;
}

export interface ThemeAValider {
    /** Le nom du dossier du jeu, sous `docs/systems/`. */
    jeu: string;
    css: string;
    /**
     * Les autres fichiers du dossier `theme/`, par chemin relatif à ce dossier,
     * séparé par `/`. `intention.md` s'y trouve s'il existe.
     */
    fichiers: Record<string, FichierDuTheme>;
}

export type Gravite = 'erreur' | 'avertissement';

export interface Remarque {
    gravite: Gravite;
    /** La section du cahier, par exemple `§ 3.5`. */
    regle: string;
    jeton?: string;
    message: string;
}

export type VerdictDeContraste = 'bon' | 'sous le recommandé' | 'refusé' | 'non mesurable';

export interface MesureDeContraste {
    avant: string;
    fond: string;
    ratio: number | null;
    minimum: number;
    recommande: number;
    verdict: VerdictDeContraste;
}

export interface RapportDeTheme {
    jeu: string;
    versionDuContrat: string;
    accepte: boolean;
    polarite: { declaree?: 'dark' | 'light'; attendue?: 'dark' | 'light' };
    /** Les jetons déclarés, rangés par ce que GM-OS en fait. */
    jetons: {
        appliques: string[];
        annonces: string[];
        sansEffet: string[];
        lusParPersonne: string[];
    };
    /** Les paires du § 6 dont les deux couleurs sont déclarées. */
    contrastes: MesureDeContraste[];
    erreurs: Remarque[];
    avertissements: Remarque[];
}

/* ────────────────────────────────────────────────────────────────────────────
   LES VALEURS
   ──────────────────────────────────────────────────────────────────────────── */

const HEX6 = /^#[0-9a-f]{6}$/i;
const RGBA = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)$/i;
const NOMBRE = /^-?(\d+\.?\d*|\.\d+)$/;
const LONGUEUR = /^(-?(?:\d+\.?\d*|\.\d+))(px|em|rem|%)?$/i;
const DEGRADE = /^(repeating-)?(linear|radial|conic)-gradient\(/i;
const URL_CSS = /^url\(\s*['"]?([^'")]+)['"]?\s*\)$/i;
/** `@import url('…')` ou `@import '…'` — l'adresse est dans le premier ou le second groupe. */
const IMPORT = /@import\s+(?:url\(\s*['"]?([^'")]+)['"]?\s*\)|['"]([^'"]+)['"])[^;]*;?/gi;

/** Les familles génériques de CSS : une pile DOIT finir par l'une d'elles (§ 4.3). */
const FAMILLES_GENERIQUES = [
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'math', 'emoji',
    'fangsong', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded',
];

/**
 * **Les polices système courantes** — présentes sans import sur la machine du
 * meneur (Windows) et, pour la plupart, ailleurs.
 *
 * S'y ajoutent les polices qu'`index.css` charge pour toute l'application
 * (`POLICES_CONNUES`, marquées `deja`) : elles sont là, quel que soit le thème.
 */
const POLICES_SYSTEME = [
    'arial', 'arial narrow', 'arial black', 'helvetica', 'helvetica neue', 'georgia',
    'times new roman', 'times', 'courier new', 'courier', 'consolas', 'verdana', 'tahoma',
    'trebuchet ms', 'segoe ui', 'calibri', 'cambria', 'candara', 'constantia', 'corbel',
    'impact', 'palatino linotype', 'palatino', 'book antiqua', 'garamond', 'lucida console',
    'lucida sans unicode', 'franklin gothic medium', 'sfmono-regular', 'menlo', 'monaco',
];

/** Remplace un passage par autant d'espaces — les positions du reste ne bougent pas. */
const blanchir = (passage: string) => passage.replace(/[^\n]/g, ' ');

/** Le nom d'une famille ramené à une forme comparable : minuscules, espaces simples. */
const normaliserFamille = (nom: string) =>
    nom.trim().replace(/^['"]|['"]$/g, '').replace(/[+_-]+/g, ' ').replace(/\s+/g, ' ').toLowerCase();

function lireRgba(valeur: string): { r: number; v: number; b: number; alpha: number } | null {
    const m = RGBA.exec(valeur.trim());
    if (!m) return null;
    const [r, v, b] = [m[1], m[2], m[3]].map(Number);
    if ([r, v, b].some(c => c > 255)) return null;
    return { r, v, b, alpha: Number(m[4]) };
}

/* ────────────────────────────────────────────────────────────────────────────
   LE VALIDATEUR
   ──────────────────────────────────────────────────────────────────────────── */

export function validerLeTheme(theme: ThemeAValider): RapportDeTheme {
    const remarques: Remarque[] = [];
    const erreur = (regle: string, message: string, jeton?: string) =>
        remarques.push({ gravite: 'erreur', regle, message, jeton });
    const avertir = (regle: string, message: string, jeton?: string) =>
        remarques.push({ gravite: 'avertissement', regle, message, jeton });

    const css = theme.css;
    /* Blanchis à longueur égale : une position dans ce texte est la même que dans `css`. */
    const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, blanchir);
    const blocs = blocsDeJetons(css);
    const { jetons, clarte } = extraireJetons(css);

    /* ── § 1 · Les livrables ─────────────────────────────────────────────── */

    const intention = theme.fichiers['intention.md'];
    if (!intention) {
        erreur('§ 1.1', '`intention.md` est absent. Il est obligatoire : l\'intention visuelle, puis les limites signalées (« aucune » si aucune).');
    } else if (!intention.contenu?.trim()) {
        erreur('§ 1.1', '`intention.md` est vide.');
    } else if (!/limite/i.test(intention.contenu)) {
        avertir('§ 1.1', '`intention.md` ne semble pas avoir de partie « Limites signalées ». Même vide, elle dit « aucune ».');
    }
    if (theme.fichiers['icones.json']) {
        erreur('§ 9', '`icones.json` est réservé : la liste des icônes n\'est pas encore publiée. Ne pas en livrer.');
    }

    /* ── § 3 · Le format ─────────────────────────────────────────────────── */

    if (blocs.length === 0) {
        erreur('§ 3.1', 'Aucun bloc de jetons : GM-OS ne lira rien. Les jetons doivent être dans `:root { … }`, `:root[data-theme="<jeu>"] { … }` ou `html[data-theme="<jeu>"] { … }`.');
    }
    if (blocs.length > 1) {
        avertir('§ 3.1', `${blocs.length} blocs de jetons. RECOMMANDÉ : un seul, \`:root[data-theme="${theme.jeu}"]\`.`);
    }

    const declarees = new Map<string, number>();
    for (const { entete, corps } of blocs) {
        /*
          La lecture coupe le bloc à la première `}`. Un bloc imbriqué, ou un
          commentaire qui contient une accolade, le coupe donc AVANT sa fin : les
          jetons qui suivent n'existent pas pour GM-OS, et rien ne le dit.
        */
        if (corps.includes('{')) {
            erreur('§ 3.3', `Le bloc \`${entete}\` contient une accolade ouvrante : un bloc imbriqué ou un commentaire avec accolade. GM-OS arrête sa lecture à la première \`}\` — les jetons suivants seront ignorés.`);
        }
        const ouverts = (corps.match(/\/\*/g) ?? []).length;
        const fermes = (corps.match(/\*\//g) ?? []).length;
        if (ouverts > fermes) {
            erreur('§ 3.3', `Un commentaire du bloc \`${entete}\` contient une \`}\` : GM-OS arrête sa lecture à cet endroit.`);
        }
        if (/!important/i.test(corps)) {
            erreur('§ 11', `\`!important\` dans le bloc \`${entete}\` : interdit dans le bloc des jetons.`);
        }
        const id = /data-theme=["']?([\w-]+)/.exec(entete)?.[1];
        if (id && id !== theme.jeu) {
            avertir('§ 3.1', `Le bloc dit \`data-theme="${id}"\` et le dossier s'appelle \`${theme.jeu}\`. Sans effet dans GM-OS ; RECOMMANDÉ : le nom du dossier.`);
        }
        for (const [cle] of declarationsDuBloc(corps)) declarees.set(cle, (declarees.get(cle) ?? 0) + 1);
    }

    for (const [cle, fois] of declarees) {
        if (fois > 1) erreur('§ 3.4', `\`--rpg-${cle}\` est déclaré ${fois} fois. Un jeton, une seule déclaration.`, cle);
    }

    /* Un jeton déclaré seulement hors du bloc — dans une règle `.rpg-*` — n'existe pas pour GM-OS. */
    const horsDuBloc = new Set<string>();
    for (const m of sansCommentaires.matchAll(/--rpg-([\w-]+)\s*:/g)) {
        if (!declarees.has(m[1]) && jetonDuContrat(m[1])?.statut !== 'SDK') horsDuBloc.add(m[1]);
    }
    if (horsDuBloc.size > 0) {
        avertir('§ 2', `Déclarés seulement hors du bloc des jetons, donc ignorés par GM-OS : ${[...horsDuBloc].map(c => `\`--rpg-${c}\``).join(', ')}.`);
    }

    /* La polarité : déclarée, et conforme au fond réel. */
    const attendue = HEX6.test(jetons.bg ?? '')
        ? ((contraste('#ffffff', jetons.bg)! > contraste('#000000', jetons.bg)!) ? 'dark' : 'light')
        : undefined;
    if (!clarte) {
        erreur('§ 3.5', `\`color-scheme\` est absent du bloc des jetons.${attendue ? ` D'après \`--rpg-bg\`, il doit valoir \`${attendue}\`.` : ''}`);
    } else if (attendue && clarte !== attendue) {
        erreur('§ 3.5', `\`color-scheme: ${clarte}\`, mais \`--rpg-bg\` (${jetons.bg}) est un fond ${attendue === 'dark' ? 'sombre' : 'clair'} : la polarité doit être \`${attendue}\`. Elle décrit le fond de l'application, pas la page de démonstration.`);
    }

    /*
      Les `@import` d'abord, par leur propre motif : une adresse Google porte des
      `;` (`wght@400;500;600`), et un relevé qui s'arrête au premier `;` la
      couperait en deux.
    */
    const importees = new Set<string>();
    const premiereRegle = sansCommentaires.indexOf('{');
    for (const m of sansCommentaires.matchAll(IMPORT)) {
        if (premiereRegle >= 0 && m.index! > premiereRegle) {
            erreur('§ 3.6', 'Un `@import` suit une règle : il doit être en tête de fichier, sinon le navigateur l\'ignore.');
        }
        verifierLImport(m[1] ?? m[2], importees, erreur);
    }

    /*
      **Les autres règles `@` (§ 11).** GM-OS ne charge jamais la feuille : une
      `@media` de la partie facultative des composants est donc sans effet, et
      seulement signalée. Le vrai danger est AVANT la fin des jetons — un bloc
      de jetons enfermé dans une `@media` serait relevé **sans sa condition**,
      et appliqué toujours.
    */
    const finDesJetons = blocs.length ? blocs[blocs.length - 1].fin : 0;
    for (const m of sansCommentaires.replace(IMPORT, blanchir).matchAll(/(?:^|[;{}\s])@([a-z-]+)/gi)) {
        const regle = m[1].toLowerCase();
        if (regle === 'font-face') {
            avertir('§ 11', '`@font-face` est ignoré par l\'interface : la police doit passer par un `@import` d\'un hôte autorisé.');
        } else if (m.index! < finDesJetons) {
            erreur('§ 11', `Règle \`@${regle}\` avant la fin du bloc des jetons : GM-OS relève les jetons sans tenir compte d'une \`@${regle}\`. Seul l'\`@import\` de police y est permis.`);
        } else {
            avertir('§ 11', `Règle \`@${regle}\` dans la partie des composants : sans effet dans GM-OS.`);
        }
    }

    /* ── § 4 · Les jetons ────────────────────────────────────────────────── */

    const rangement: RapportDeTheme['jetons'] = { appliques: [], annonces: [], sansEffet: [], lusParPersonne: [] };
    for (const cle of Object.keys(jetons)) {
        const j = jetonDuContrat(cle);
        if (!j) rangement.lusParPersonne.push(cle);
        else if (j.statut === 'LU') rangement.appliques.push(cle);
        else if (j.statut === 'V2') rangement.annonces.push(cle);
        else rangement.sansEffet.push(cle);
    }
    if (rangement.lusParPersonne.length > 0) {
        avertir('§ 14', `Jetons hors contrat, lus par personne : ${rangement.lusParPersonne.map(c => `\`--rpg-${c}\``).join(', ')}.`);
    }

    for (const j of JETONS_DU_CONTRAT) {
        const valeur = jetons[j.cle];
        if (valeur === undefined) {
            if (j.obligatoire) erreur(`§ ${j.section}`, `\`--rpg-${j.cle}\` est obligatoire et absent.`, j.cle);
            continue;
        }
        if (j.statut === 'SDK') continue;
        verifierLaValeur(j, valeur, theme, importees, erreur, avertir);
    }

    /* Les couleurs d'état : reconnaissables entre elles et avec l'accent (§ 4.2). */
    const distinctes = ['accent', 'success', 'danger', 'warning', 'info'].filter(c => HEX6.test(jetons[c] ?? ''));
    for (let a = 0; a < distinctes.length; a++) {
        for (let b = a + 1; b < distinctes.length; b++) {
            if (distance(jetons[distinctes[a]], jetons[distinctes[b]]) < 60) {
                avertir('§ 4.2', `\`--rpg-${distinctes[a]}\` (${jetons[distinctes[a]]}) et \`--rpg-${distinctes[b]}\` (${jetons[distinctes[b]]}) sont presque la même couleur : elles doivent se reconnaître l'une de l'autre.`);
            }
        }
    }

    /* ── § 6 · Les contrastes ───────────────────────────────────────────── */

    const contrastes: MesureDeContraste[] = [];
    for (const p of PAIRES_DU_CONTRAT) {
        const avant = jetons[p.avant];
        const fond = jetons[p.fond];
        if (avant === undefined || fond === undefined) continue;
        const ratio = contraste(avant, fond);
        const verdict: VerdictDeContraste = ratio === null ? 'non mesurable'
            : ratio < p.minimum ? 'refusé'
                : ratio < p.recommande ? 'sous le recommandé' : 'bon';
        contrastes.push({ avant: p.avant, fond: p.fond, ratio, minimum: p.minimum, recommande: p.recommande, verdict });
        if (verdict === 'refusé') {
            erreur('§ 6', `Contraste \`${p.avant}\` sur \`${p.fond}\` : ${ratio} (${avant} sur ${fond}), minimum ${p.minimum}.`, p.avant);
        }
    }

    /* ── § 8 · Les ornements ─────────────────────────────────────────────── */

    const ornements = theme.fichiers['ornements.json'];
    if (ornements) verifierLesOrnements(ornements, theme, erreur);

    const erreurs = remarques.filter(r => r.gravite === 'erreur');
    return {
        jeu: theme.jeu,
        versionDuContrat: VERSION_DU_CONTRAT,
        accepte: erreurs.length === 0,
        polarite: { declaree: clarte, attendue },
        jetons: rangement,
        contrastes,
        erreurs,
        avertissements: remarques.filter(r => r.gravite === 'avertissement'),
    };
}

type Signaler = (regle: string, message: string, jeton?: string) => void;

/** Un `@import` : en `https`, depuis un hôte autorisé. Ses familles sont relevées. */
function verifierLImport(adresse: string, importees: Set<string>, erreur: Signaler): void {
    let url: URL;
    try {
        url = new URL(adresse);
    } catch {
        erreur('§ 11', `\`@import\` de « ${adresse} » : chemin local interdit, seules les polices des hôtes autorisés s'importent.`);
        return;
    }
    if (url.protocol !== 'https:' || !HOTES_DE_POLICES.includes(url.hostname)) {
        erreur('§ 3.6', `\`@import\` depuis ${url.protocol}//${url.hostname} : ignoré par GM-OS. Hôtes autorisés, en https : ${HOTES_DE_POLICES.join(', ')}.`);
        return;
    }
    /* Google : `family=Nom+De+Police:wght@…`, répété ; Bunny : `family=nom-de-police:400|autre:700`. */
    for (const famille of url.searchParams.getAll('family')) {
        for (const morceau of famille.split('|')) {
            const nom = morceau.split(':')[0];
            if (nom) importees.add(normaliserFamille(nom));
        }
    }
}

function verifierLaValeur(
    j: JetonDuContrat, valeur: string, theme: ThemeAValider, importees: Set<string>,
    erreur: Signaler, avertir: Signaler,
): void {
    const nom = `\`--rpg-${j.cle}\``;
    const regle = `§ ${j.section}`;
    const f: FormatDeJeton = j.format;
    const v = valeur.trim();

    switch (f.type) {
        case 'couleur-opaque': {
            if (HEX6.test(v)) return;
            if (/^#[0-9a-f]{3}$/i.test(v)) erreur('§ 3.7', `${nom}: ${v} — écrire la couleur en six chiffres (\`#rrggbb\`).`, j.cle);
            else if (/^(rgba|hsla)\(/i.test(v)) erreur('§ 5', `${nom}: ${v} — transparence interdite : GM-OS calcule son contraste. \`#rrggbb\` opaque.`, j.cle);
            else erreur('§ 3.7', `${nom}: ${v} — GM-OS ne lit que \`#rrggbb\` pour cette couleur.`, j.cle);
            return;
        }
        case 'couleur-ou-rgba':
        case 'rgba': {
            if (f.type === 'couleur-ou-rgba' && HEX6.test(v)) return;
            const c = lireRgba(v);
            if (!c) {
                erreur('§ 3.7', `${nom}: ${v} — attendu ${f.type === 'rgba' ? '' : '`#rrggbb` ou '}\`rgba(r, g, b, a)\`.`, j.cle);
                return;
            }
            if (c.alpha < f.alphaMin || c.alpha > f.alphaMax) {
                erreur('§ 5', `${nom}: opacité ${c.alpha}, hors des bornes ${f.alphaMin} à ${f.alphaMax}.`, j.cle);
            }
            return;
        }
        case 'halo':
            if (v !== 'none' && !lireRgba(v)) erreur(regle, `${nom}: ${v} — attendu \`rgba(r, g, b, a)\` ou \`none\`.`, j.cle);
            return;
        case 'pile':
            verifierLaPile(nom, j.cle, v, importees, erreur, avertir);
            return;
        case 'longueur': {
            const m = LONGUEUR.exec(v);
            const n = m ? Number(m[1]) : NaN;
            const unite = m?.[2]?.toLowerCase();
            if (!m || (unite !== f.unite && !(n === 0 && !unite))) {
                erreur(regle, `${nom}: ${v} — attendu une longueur en \`${f.unite}\`, de 0 à ${f.max}${f.unite}.`, j.cle);
            } else if (n < f.min || n > f.max) {
                erreur(regle, `${nom}: ${v} — hors des bornes, ${f.min}${f.unite} à ${f.max}${f.unite}.`, j.cle);
            }
            return;
        }
        case 'echelle': {
            const brut = v.replace('%', '');
            if (!NOMBRE.test(brut)) {
                erreur(regle, `${nom}: ${v} — attendu un facteur (\`1.1\`) ou un pourcentage (\`110\`).`, j.cle);
                return;
            }
            const n = Number(brut);
            /* La même frontière que la lecture (`echelleDeTexte`) : à dix, c'est un pourcentage. */
            const facteur = n >= 10 ? n / 100 : n;
            if (facteur < 0.8 || facteur > 2) {
                avertir(regle, `${nom}: ${v} — hors de 0.8 à 2, GM-OS le ramènera à la borne.`, j.cle);
            }
            return;
        }
        case 'nombre': {
            const n = Number(v);
            if (!NOMBRE.test(v)) erreur(regle, `${nom}: ${v} — attendu un nombre de ${f.min} à ${f.max}.`, j.cle);
            else if (n < f.min || n > f.max) erreur(regle, `${nom}: ${v} — hors des bornes, ${f.min} à ${f.max}.`, j.cle);
            return;
        }
        case 'choix':
            if (!f.valeurs.includes(v)) erreur(regle, `${nom}: ${v} — valeurs permises : ${f.valeurs.map(x => `\`${x}\``).join(', ')}.`, j.cle);
            return;
        case 'ombre':
            if (/url\(/i.test(v)) erreur('§ 11', `${nom}: une ombre ne charge aucune ressource.`, j.cle);
            return;
        case 'matiere': {
            if (v === 'none' || DEGRADE.test(v)) return;
            const m = URL_CSS.exec(v);
            if (!m) {
                erreur('§ 7', `${nom}: ${v} — attendu \`none\`, un dégradé, ou \`url('matieres/<fichier>.svg')\`.`, j.cle);
                return;
            }
            verifierUnFichierJoint(nom, j.cle, m[1], 'matiere', theme, erreur);
            return;
        }
        case 'libre':
            return;
    }
}

/**
 * Une pile de polices finit par une famille générique, et sa **première**
 * police arrive : importée, système, ou déjà chargée par GM-OS.
 *
 * ⚠️ **Les replis suivants sont avertis, pas refusés.** Le cahier (§ 4.3) exige
 * que *chaque* police nommée soit disponible ; mais un repli absent est sauté
 * par le navigateur sans aucun effet visible — c'est le rôle d'une pile. Le
 * refuser aurait fait tomber Alien pour un « OCR A Std » qui ne change rien à
 * l'écran. *Une erreur doit désigner un défaut qu'on verrait.*
 */
function verifierLaPile(
    nom: string, cle: string, pile: string, importees: Set<string>, erreur: Signaler, avertir: Signaler,
): void {
    const familles = pile.split(',').map(s => s.trim()).filter(Boolean);
    /* ⚠️ Les génériques se comparent AVANT la normalisation, qui ferait de `sans-serif` un « sans serif ». */
    const generique = (brute: string) => FAMILLES_GENERIQUES.includes(brute.replace(/^['"]|['"]$/g, '').toLowerCase());
    if (!generique(familles[familles.length - 1] ?? '')) {
        erreur('§ 4.3', `${nom}: la pile doit finir par une famille générique (\`serif\`, \`sans-serif\`, \`monospace\`…).`, cle);
    }

    const chargeesParGmOs = POLICES_CONNUES.filter(p => p.deja).map(p => normaliserFamille(p.famille));
    familles.forEach((brute, i) => {
        if (generique(brute)) return;
        const famille = normaliserFamille(brute);
        if (importees.has(famille) || POLICES_SYSTEME.map(normaliserFamille).includes(famille) || chargeesParGmOs.includes(famille)) return;
        const texte = `${nom}: « ${brute.replace(/^['"]|['"]$/g, '')} » n'est ni importée, ni une police système courante`;
        if (i === 0) erreur('§ 4.3', `${texte} — le texte retombera sur le repli.`, cle);
        else avertir('§ 4.3', `${texte}. C'est un repli : sans effet s'il manque, mais inutile.`, cle);
    });
}

/**
 * Un fichier désigné par le thème : relatif, dans le dossier `theme/`, présent,
 * d'un type et d'une taille permis — et, pour un SVG, sûr (§ 7, § 8).
 */
function verifierUnFichierJoint(
    nom: string, cle: string | undefined, chemin: string, usage: 'matiere' | 'ornement',
    theme: ThemeAValider, erreur: Signaler,
): void {
    const regle = usage === 'matiere' ? '§ 7' : '§ 8';
    if (/^[a-z][a-z0-9+.-]*:/i.test(chemin) || chemin.startsWith('/') || chemin.startsWith('\\') || chemin.split(/[\\/]/).includes('..')) {
        erreur(regle, `${nom}: « ${chemin} » sort du dossier \`theme/\`. Seuls les chemins relatifs qui y restent sont permis.`, cle);
        return;
    }
    const relatif = chemin.replace(/\\/g, '/').replace(/^\.\//, '');
    const fichier = theme.fichiers[relatif];
    if (!fichier) {
        erreur(regle, `${nom}: « ${relatif} » n'existe pas dans le dossier \`theme/\`.`, cle);
        return;
    }
    const extension = relatif.split('.').pop()?.toLowerCase();
    const estSvg = extension === 'svg';
    if (usage === 'ornement' && !estSvg) {
        erreur(regle, `${nom}: « ${relatif} » — un ornement est un SVG.`, cle);
        return;
    }
    if (!estSvg && !['png', 'webp'].includes(extension ?? '')) {
        erreur(regle, `${nom}: « ${relatif} » — une matière est un SVG, un PNG ou un WebP.`, cle);
        return;
    }
    const plafond = usage === 'ornement' ? TAILLES_MAXIMALES.ornement
        : estSvg ? TAILLES_MAXIMALES.matiereSvg : TAILLES_MAXIMALES.matiereImage;
    if (fichier.taille > plafond) {
        erreur(regle, `${nom}: « ${relatif} » pèse ${Math.round(fichier.taille / 1024)} Ko, au plus ${plafond / 1024} Ko.`, cle);
    }
    if (estSvg) verifierLeSvg(nom, cle, relatif, fichier.contenu ?? '', erreur);
}

/** Les règles des SVG du § 8, matières comprises. */
function verifierLeSvg(nom: string, cle: string | undefined, chemin: string, svg: string, erreur: Signaler): void {
    const dire = (quoi: string) => erreur('§ 8', `${nom}: « ${chemin} » ${quoi}`, cle);
    if (!/<svg[^>]*\sviewBox\s*=/i.test(svg)) dire('n\'a pas de `viewBox`.');
    if (!/currentColor/i.test(svg)) dire('ne dessine pas en `currentColor` : GM-OS ne pourra pas l\'accorder à l\'accent.');
    if (/<script/i.test(svg)) dire('contient un `<script>`.');
    if (/\son[a-z]+\s*=/i.test(svg)) dire('contient un attribut `on…`.');
    if (/<foreignObject/i.test(svg)) dire('contient un `<foreignObject>`.');
    for (const m of svg.matchAll(/\s(?:xlink:)?href\s*=\s*["']([^"']*)["']/gi)) {
        const cible = m[1].trim();
        if (!cible.startsWith('#') && !cible.startsWith('data:')) {
            dire(`renvoie vers « ${cible} » : un SVG ne charge aucun autre fichier.`);
        }
    }
}

function verifierLesOrnements(fichier: FichierDuTheme, theme: ThemeAValider, erreur: Signaler): void {
    let table: unknown;
    try {
        table = JSON.parse(fichier.contenu ?? '');
    } catch {
        erreur('§ 8', '`ornements.json` n\'est pas du JSON valide.');
        return;
    }
    if (!table || typeof table !== 'object' || Array.isArray(table)) {
        erreur('§ 8', '`ornements.json` doit être un objet `{ "emplacement": "ornements/<fichier>.svg" }`.');
        return;
    }
    for (const [emplacement, chemin] of Object.entries(table as Record<string, unknown>)) {
        if (!EMPLACEMENTS_D_ORNEMENT.includes(emplacement)) {
            erreur('§ 8', `Emplacement d'ornement « ${emplacement} » inconnu : GM-OS ne le lira pas. Emplacements : ${EMPLACEMENTS_D_ORNEMENT.join(', ')}. S'il manque au jeu, le signaler au meneur.`);
            continue;
        }
        if (typeof chemin !== 'string') {
            erreur('§ 8', `Ornement « ${emplacement} » : un chemin est attendu.`);
            continue;
        }
        verifierUnFichierJoint(`ornement « ${emplacement} »`, undefined, chemin, 'ornement', theme, erreur);
    }
}

/** La distance entre deux couleurs `#rrggbb`, dans l'espace RGB — grossière, mais sans faux positif sur des couleurs franches. */
function distance(a: string, b: string): number {
    const c = (x: string) => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16));
    const [p, q] = [c(a), c(b)];
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}

/* ────────────────────────────────────────────────────────────────────────────
   LE RAPPORT EN TEXTE — à coller tel quel dans ChatGPT
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * **Le rapport pour le constructeur.** En Markdown, parce que ChatGPT le rend
 * lisible et que David le colle sans retouche.
 *
 * Il dit d'abord le verdict, puis ce qu'il faut corriger, puis les mesures :
 * *le constructeur lit les contrastes, il ne les recalcule pas.*
 */
export function rapportEnTexte(r: RapportDeTheme): string {
    const lignes: string[] = [];
    const liste = (cles: string[]) => (cles.length ? cles.map(c => `\`${c}\``).join(', ') : '—');

    lignes.push(`# Rapport du validateur GM-OS — thème « ${r.jeu} »`);
    lignes.push('');
    lignes.push(`Contrat GM-OS v${r.versionDuContrat}. **Verdict : ${r.accepte ? 'ACCEPTÉ' : 'REFUSÉ'}** — ${r.erreurs.length} erreur(s), ${r.avertissements.length} avertissement(s).`);
    lignes.push('');
    lignes.push('Les contrastes ci-dessous sont mesurés par GM-OS : lis-les, ne les recalcule pas.');

    if (r.erreurs.length) {
        lignes.push('', '## Erreurs — à corriger', '');
        r.erreurs.forEach((e, i) => lignes.push(`${i + 1}. [${e.regle}] ${e.message}`));
    }
    if (r.avertissements.length) {
        lignes.push('', '## Avertissements', '');
        r.avertissements.forEach((e, i) => lignes.push(`${i + 1}. [${e.regle}] ${e.message}`));
    }

    lignes.push('', '## Contrastes (§ 6)', '');
    if (r.contrastes.length === 0) {
        lignes.push('Aucune paire mesurable.');
    } else {
        lignes.push('| Paire | Ratio | Minimum | Recommandé | Verdict |', '| --- | --- | --- | --- | --- |');
        for (const c of r.contrastes) {
            lignes.push(`| \`${c.avant}\` sur \`${c.fond}\` | ${c.ratio ?? '—'} | ${c.minimum} | ${c.recommande} | ${c.verdict} |`);
        }
    }

    lignes.push('', '## Polarité (§ 3.5)', '');
    lignes.push(`Déclarée : \`${r.polarite.declaree ?? 'absente'}\` · attendue d'après \`--rpg-bg\` : \`${r.polarite.attendue ?? 'non mesurable'}\`.`);

    lignes.push('', '## Ce que GM-OS fait des jetons déclarés', '');
    lignes.push(`- **Appliqués aujourd'hui (LU)** : ${liste(r.jetons.appliques)}`);
    lignes.push(`- **Annoncés (V2)** — sans effet visible aujourd'hui, et c'est normal : ${liste(r.jetons.annonces)}`);
    lignes.push(`- **Sans effet dans GM-OS (SDK)** : ${liste(r.jetons.sansEffet)}`);
    if (r.jetons.lusParPersonne.length) lignes.push(`- **Hors contrat, lus par personne** : ${liste(r.jetons.lusParPersonne)}`);

    return lignes.join('\n') + '\n';
}
