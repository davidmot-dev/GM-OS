/**
 * Exclusion de fichiers pour l'index de l'Oracle — modèle `.gitignore`.
 *
 * Un fichier `.ragignore` vaut pour le sous-arbre du dossier qui le contient.
 * Les motifs suivent les conventions de git : `#` commente, `!` réintègre,
 * un `/` final ne vise que les dossiers, `*` ne traverse pas les séparateurs,
 * `**` si. Un motif sans `/` vise le nom de base à n'importe quelle profondeur ;
 * un motif qui contient un `/` est ancré au dossier du `.ragignore`.
 * Comme sur les autres règles, **la dernière qui s'applique l'emporte**.
 *
 * PORTÉE — c'est le point important. Ce filtre ne s'applique qu'à
 * `RAGEngine.updateIndex`, donc au seul contexte que l'Oracle et le Cortex
 * reçoivent automatiquement. Les poignées `ai:list-docs`, `ai:read-doc` et
 * `ai:extract-pdf` parcourent le disque directement et ne consultent pas
 * l'index : **les Forges gardent accès aux livres bruts en entier**, de même
 * que le lecteur de documents. Exclure ici, c'est retirer du prompt, jamais
 * de l'application.
 */

export interface IgnoreRule {
    /** Motif d'origine, conservé pour la journalisation. */
    readonly source: string;
    /** `!` en tête : réintègre au lieu d'exclure. */
    readonly negated: boolean;
    /** `/` final : ne vise que les dossiers. */
    readonly dirOnly: boolean;
    readonly regex: RegExp;
    /**
     * Pour une règle `dirOnly` confrontée à un fichier : `raw/` doit exclure
     * `raw/page-12.md` sans exclure un fichier *nommé* `raw`. D'où une seconde
     * expression qui exige d'être strictement sous le dossier.
     */
    readonly regexSousArbre?: RegExp;
}

/** Un jeu de règles et le dossier auquel il s'applique. */
export interface IgnoreScope {
    /** Chemin du dossier porteur, relatif à la racine des docs, en '/'. '' à la racine. */
    readonly base: string;
    readonly rules: readonly IgnoreRule[];
}

export const RAGIGNORE_FILENAME = '.ragignore';

function globToRegex(glob: string, anchored: boolean, suffixe = '(?:/.*)?'): RegExp {
    let out = '';
    for (let i = 0; i < glob.length; i++) {
        const c = glob[i];
        if (c === '*') {
            if (glob[i + 1] === '*') {
                i++;
                if (glob[i + 1] === '/') {
                    // `**/` traverse zéro dossier ou plus.
                    out += '(?:.*/)?';
                    i++;
                } else {
                    out += '.*';
                }
            } else {
                out += '[^/]*';
            }
        } else if (c === '?') {
            out += '[^/]';
        } else if ('.+^${}()|[]\\'.includes(c)) {
            out += '\\' + c;
        } else {
            out += c;
        }
    }
    // Un motif ancré part du dossier porteur ; sinon il vise le nom de base
    // à n'importe quelle profondeur. Dans les deux cas, ce qui suit un dossier
    // exclu l'est aussi, d'où le `(?:/.*)?` final.
    const prefix = anchored ? '^' : '^(?:.*/)?';
    // NTFS est insensible à la casse : l'être aussi évite un piège de plateforme.
    return new RegExp(`${prefix}${out}${suffixe}$`, 'i');
}

/** Analyse le contenu d'un `.ragignore`. Les lignes vides et `#` sont ignorées. */
export function parseRagIgnore(content: string): IgnoreRule[] {
    const rules: IgnoreRule[] = [];

    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const negated = line.startsWith('!');
        let pattern = negated ? line.slice(1).trim() : line;
        if (!pattern) continue;

        const dirOnly = pattern.endsWith('/');
        if (dirOnly) pattern = pattern.slice(0, -1);

        // Un `/` en tête ancre sans être un segment.
        const leadingSlash = pattern.startsWith('/');
        if (leadingSlash) pattern = pattern.slice(1);
        if (!pattern) continue;

        const anchored = leadingSlash || pattern.includes('/');
        rules.push({
            source: line,
            negated,
            dirOnly,
            regex: globToRegex(pattern, anchored),
            ...(dirOnly ? { regexSousArbre: globToRegex(pattern, anchored, '/.+') } : {}),
        });
    }

    return rules;
}

/**
 * Un chemin est-il exclu par les jeux de règles qui le couvrent ?
 *
 * `relPath` est relatif à la racine des docs, séparateurs '/'. Les portées
 * sont évaluées de la plus générale à la plus spécifique, et à l'intérieur
 * d'une portée la dernière règle qui s'applique l'emporte — pour qu'un
 * `!fiche.md` puisse rattraper un `*.md` écrit au-dessus.
 */
export function isIgnored(
    relPath: string,
    scopes: readonly IgnoreScope[],
    isDirectory = false,
): IgnoreRule | null {
    let verdict: IgnoreRule | null = null;

    const ordered = [...scopes].sort((a, b) => a.base.length - b.base.length);

    for (const scope of ordered) {
        if (scope.base && !relPath.startsWith(`${scope.base}/`)) continue;
        const local = scope.base ? relPath.slice(scope.base.length + 1) : relPath;

        for (const rule of scope.rules) {
            const regex = rule.dirOnly && !isDirectory ? rule.regexSousArbre : rule.regex;
            if (regex && regex.test(local)) verdict = rule.negated ? null : rule;
        }
    }

    return verdict;
}
