/**
 * **Le dossier de tables du jeu actif** — chantier de la Fire HD 8 (registre § 256, T4).
 *
 * L'onglet Tables de la télécommande ne montre que les tables du jeu de la campagne active
 * (décision de David du 15/11/2026). Table-OS range ses tables par dossier, sous
 * `databases/tables/<univers>/`, et ce nom de dossier n'est écrit nulle part dans le pilote
 * comme tel. Il faut donc le retrouver.
 *
 * **Deux indices, dans cet ordre** (relevés sur les dix-neuf pilotes de David le 15/11) :
 *
 * 1. **Les tables que le pilote cite déjà** : `{ univers, table }` dans ses attaques, son test de
 *    Panique, son déclin… Alien en cite 24, toutes dans `Alien` — alors que son nom est
 *    « ALIEN, le jeu de rôle ». C'est l'indice le plus sûr : le pilote le dit lui-même.
 * 2. **Le nom**, comparé sans accents, sans casse, sans pluriel, et aussi par sa tête avant
 *    « : » ou « , » : « Rêve de Dragon » trouve `Reves de Dragon`, « Blade Runner: Le Jeu de
 *    Rôle » trouve `Blade Runner`.
 *
 * Rien de sûr → `null`, et l'onglet le dit. *Montrer les tables d'un autre jeu serait pire que
 * n'en montrer aucune.* Le dossier `generique` n'est jamais deviné par le nom.
 *
 * Pur : ni pont Electron, ni magasin.
 */

export interface PiloteDesTables {
    name: string;
    corpusId?: string;
}

/** Les dossiers que le pilote cite dans ses `{ univers, table }`, avec leur nombre de citations. */
export function universCites(pilote: unknown): Map<string, number> {
    const cites = new Map<string, number>();
    const vus = new Set<object>();
    const parcourir = (valeur: unknown): void => {
        if (!valeur || typeof valeur !== 'object' || vus.has(valeur)) return;
        vus.add(valeur);
        const objet = valeur as Record<string, unknown>;
        if (typeof objet.univers === 'string' && typeof objet.table === 'string' && objet.univers.trim()) {
            cites.set(objet.univers, (cites.get(objet.univers) ?? 0) + 1);
        }
        for (const enfant of Object.values(objet)) parcourir(enfant);
    };
    parcourir(pilote);
    return cites;
}

/** « Rêve de Dragon », « reves-de-dragons », « Rêves de Dragon » → « reve de dragon ». */
export function nomCompare(nom: string): string {
    return nom
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[-_]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map(mot => (mot.length > 3 && mot.endsWith('s') ? mot.slice(0, -1) : mot))
        .join(' ');
}

export function universDuJeu<P extends PiloteDesTables>(
    pilote: P | null | undefined,
    dossiers: readonly string[],
): string | null {
    if (!pilote || dossiers.length === 0) return null;
    const existants = new Set(dossiers);

    const cites = [...universCites(pilote)].filter(([univers]) => existants.has(univers));
    if (cites.length) {
        // Le plus cité ; à égalité, l'ordre alphabétique, pour un résultat stable.
        cites.sort(([a, na], [b, nb]) => nb - na || a.localeCompare(b));
        return cites[0][0];
    }

    const tete = pilote.name.split(/[:,]/)[0] ?? '';
    const candidats = [pilote.name, tete, pilote.corpusId ?? '']
        .map(nomCompare)
        .filter(Boolean);
    const trouve = dossiers.find(dossier => dossier !== 'generique' && candidats.includes(nomCompare(dossier)));
    return trouve ?? null;
}
