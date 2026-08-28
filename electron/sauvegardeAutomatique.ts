import { app } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';

/**
 * **La sauvegarde automatique — le canal qui écrit, et rien d'autre.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE LA PREMIÈRE TENTATIVE A FAIT, ET POURQUOI CE MODULE EST BÂTI AINSI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Un `GitBackupService` a existé (supprimé par `c6306c9`, lisible avec
 * `git show c6306c9^:electron/GitBackupService.ts`). Il était construit sur
 * `process.env.APP_ROOT` — **le dépôt de GM-OS lui-même** — et y exécutait, en
 * boucle : `git stash`, `git checkout data-sync`, `git rm -r --cached .`,
 * `git commit`, `git push`.
 *
 * `data-sync` étant une branche **orpheline**, en basculer dessus depuis `main`
 * fait supprimer par git tous les fichiers suivis qui n'y existent pas —
 * c'est-à-dire tout GM-OS. **La sauvegarde vidait l'application.** Ce n'était
 * pas un bug de git : le service lui demandait littéralement cet effacement.
 *
 * Le correctif de l'époque (remplacer `git rm -rf .` par `git rm -r --cached .`)
 * visait la mauvaise commande. Le `checkout`, le `stash` et le `push`
 * restaient ; le bloc de rattrapage finissait par `git checkout -f`. La
 * sauvegarde pouvait donc encore vider le projet **après** avoir été déclarée
 * sûre.
 *
 * On n'écrit donc pas ici des commandes git plus prudentes. **On supprime la
 * catégorie.** Les trois règles ci-dessous ne sont pas des précautions, ce sont
 * des propriétés de construction : tant qu'elles tiennent, l'incident ne peut
 * pas se reproduire, quelle que soit la suite des événements.
 *
 * | | |
 * | --- | --- |
 * | **R1** | Aucune commande de gestion de version. Jamais. Ce module écrit un fichier, c'est tout ce qu'il sait faire. |
 * | **R2** | Jamais dans le dépôt ni dans le dossier de l'application. Un seul point fabrique un chemin, et il refuse tout le reste. |
 * | **R3** | Ne supprime et n'écrase que des fichiers qu'il a écrits : son motif de nom, dans son dossier, un à la fois. |
 */

/** Le dossier, sous `userData` — jamais sous `APP_ROOT`. Précédent : `PairingManager`, `SecurityManager`. */
const DOSSIER = 'backups';

/**
 * Le motif d'un fichier que CE module a écrit.
 *
 * Il sert deux fois, et c'est volontaire : il valide ce qu'on écrit **et** il
 * décide ce que la rotation a le droit de supprimer (R3). Un fichier que le MJ
 * aurait déposé là à la main ne correspond pas, donc il est invisible.
 */
const MOTIF = /^gmos-auto-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(-\d{3})?\.json$/;

/** Sous ce rapport, une sauvegarde qui rétrécit est suspecte plutôt que normale. */
const SEUIL_DE_RETRECISSEMENT = 0.5;

export type ResultatSauvegarde =
    | { statut: 'ecrite'; chemin: string; octets: number }
    | { statut: 'refusee'; raison: string; octets: number; octetsPrecedents?: number };

/** Normalise pour comparaison : absolu, séparateurs unifiés, casse ignorée sur Windows. */
function normaliser(p: string): string {
    const resolu = path.resolve(p);
    return process.platform === 'win32' ? resolu.toLowerCase() : resolu;
}

/** `enfant` est-il `parent` ou dedans ? */
function estSous(enfant: string, parent: string): boolean {
    const a = normaliser(enfant);
    const b = normaliser(parent);
    return a === b || a.startsWith(b + path.sep);
}

export function dossierDesSauvegardes(): string {
    return path.join(app.getPath('userData'), DOSSIER);
}

/**
 * **Le seul endroit du programme qui fabrique un chemin de sauvegarde.**
 *
 * Il n'accepte qu'un nom de fichier conforme au motif — donc jamais un
 * séparateur, jamais `..`, jamais un chemin absolu — puis vérifie le résultat
 * plutôt que de faire confiance à la vérification d'entrée. *Valider l'entrée
 * et vérifier la sortie ne font pas double emploi : la première dit ce qu'on
 * croit avoir reçu, la seconde ce qu'on s'apprête vraiment à toucher.*
 *
 * Il refuse aussi que le dossier de sauvegardes tombe sous `APP_ROOT`. Sur une
 * installation normale il n'y tombe pas ; sur une installation portable, si.
 * **Dans ce cas on n'écrit rien du tout** — c'est exactement la configuration
 * qui a coûté l'application en mars.
 */
export function cheminDeSauvegarde(nom: string): string {
    if (!MOTIF.test(nom)) {
        throw new Error(`[Sauvegarde] Nom refusé : « ${nom} » ne suit pas le motif des sauvegardes automatiques.`);
    }

    const dossier = dossierDesSauvegardes();
    const appRoot = process.env.APP_ROOT;
    if (appRoot && estSous(dossier, appRoot)) {
        throw new Error(
            '[Sauvegarde] Destination refusée : le dossier de sauvegardes tomberait dans celui de ' +
            'l’application. Aucune sauvegarde ne sera écrite — écrire là est précisément ce qui a ' +
            'détruit l’installation en mars 2026.',
        );
    }

    const complet = path.resolve(dossier, nom);
    if (path.dirname(normaliser(complet)) !== normaliser(dossier)) {
        throw new Error(`[Sauvegarde] Chemin refusé : « ${nom} » sortirait du dossier de sauvegardes.`);
    }
    return complet;
}

/** `gmos-auto-2026-08-28T14-32-05-123.json` — triable par ordre alphabétique, ce dont la rotation profite. */
export function nomHorodate(quand: Date = new Date()): string {
    const d = quand.toISOString().replace(/\.(\d{3})Z$/, '-$1').replace(/:/g, '-');
    return `gmos-auto-${d}.json`;
}

/** Les sauvegardes que ce module a écrites, la plus récente d'abord. R3 : rien d'autre n'est vu. */
export async function sauvegardesConnues(): Promise<{ nom: string; chemin: string; octets: number }[]> {
    const dossier = dossierDesSauvegardes();
    if (!(await fs.pathExists(dossier))) return [];

    const noms = (await fs.readdir(dossier)).filter(n => MOTIF.test(n));
    const fiches = await Promise.all(noms.map(async nom => {
        const chemin = path.join(dossier, nom);
        const stat = await fs.stat(chemin);
        return { nom, chemin, octets: stat.size };
    }));
    return fiches.sort((a, b) => b.nom.localeCompare(a.nom));
}

/**
 * Écrit une sauvegarde, ou explique pourquoi elle refuse.
 *
 * **Le refus n'est pas une erreur** : c'est un résultat attendu, et l'appelant
 * doit pouvoir le distinguer d'une panne de disque — qui, elle, lève.
 *
 * Trois propriétés :
 *
 * - **Atomique.** On écrit dans `<nom>.part`, puis `rename`. Un `rename` est
 *   atomique sur un même volume : une coupure ne laisse jamais une sauvegarde
 *   tronquée qu'on croirait valide. *Une sauvegarde illisible qu'on croit bonne
 *   est pire que pas de sauvegarde.*
 * - **Relue.** On rouvre le fichier écrit, on compare les octets et on le
 *   reparse. Le motif vient de `idbStorage.migrateFromLocalStorage`, où il sert
 *   déjà à ne pas libérer une source avant d'avoir vérifié la copie.
 * - **Prudente au rétrécissement.** Une sauvegarde qui fait moins de la moitié
 *   de la précédente est refusée, sauf si l'appelant déclare savoir pourquoi
 *   (`baisseAttendue`, par exemple après la suppression d'une campagne). C'est
 *   le moment où une perte se voit, ou elle ne se voit jamais.
 */
export async function ecrireSauvegarde(
    donnees: unknown,
    options: { baisseAttendue?: boolean; nom?: string } = {},
): Promise<ResultatSauvegarde> {
    const contenu = JSON.stringify(donnees);
    const octets = Buffer.byteLength(contenu, 'utf-8');

    const precedentes = await sauvegardesConnues();
    const precedente = precedentes[0];
    if (precedente && !options.baisseAttendue && octets < precedente.octets * SEUIL_DE_RETRECISSEMENT) {
        return {
            statut: 'refusee',
            raison:
                `La sauvegarde ferait ${octets} octets contre ${precedente.octets} pour la précédente. ` +
                'Un rétrécissement de plus de moitié qui ne s’explique pas est traité comme une perte, ' +
                'pas comme une sauvegarde. La précédente est conservée.',
            octets,
            octetsPrecedents: precedente.octets,
        };
    }

    const nom = options.nom ?? nomHorodate();
    const chemin = cheminDeSauvegarde(nom);
    const partiel = `${chemin}.part`; // dérivé d'un chemin déjà validé : dans le dossier par construction

    await fs.ensureDir(dossierDesSauvegardes());
    await fs.writeFile(partiel, contenu, 'utf-8');
    await fs.rename(partiel, chemin);

    // Relecture : on ne dit « sauvegardé » qu'après avoir constaté, jamais avant.
    try {
        const relu = await fs.readFile(chemin, 'utf-8');
        if (relu !== contenu) throw new Error('le fichier relu diffère de ce qui a été écrit');
        JSON.parse(relu);
    } catch (err) {
        // R3 : ce fichier vient d'être écrit par nous, donc nous avons le droit de le retirer.
        await fs.remove(chemin).catch(() => { /* le disque a déjà parlé */ });
        throw new Error(`[Sauvegarde] Écriture non vérifiable, fichier retiré : ${(err as Error).message}`);
    }

    await faireLaRotation();

    return { statut: 'ecrite', chemin, octets };
}

/** Ce qu'on garde de près, et sur combien de jours on garde une trace. */
const RECENTES_GARDEES = 12;
const JOURS_GARDES = 7;

/** `gmos-auto-2026-08-28T…` → `2026-08-28`. */
function jourDe(nom: string): string {
    return nom.slice('gmos-auto-'.length, 'gmos-auto-'.length + 10);
}

/**
 * **La rotation, et elle ne voit que ses propres fichiers.**
 *
 * Deux couches, parce qu'elles répondent à deux peurs différentes : les douze
 * dernières couvrent *« je viens de faire une bêtise »*, et une par jour sur
 * sept jours couvre *« quelque chose s'est abîmé et je ne l'ai pas vu tout de
 * suite »* — c'est ce second cas qui s'est produit les deux fois.
 *
 * R3 : on ne supprime qu'un fichier au motif reconnu, dans le dossier des
 * sauvegardes, un par un. Jamais de `remove` sur un dossier, jamais de motif
 * large. Et **jamais la plus récente**, quoi qu'il arrive.
 */
export async function faireLaRotation(): Promise<string[]> {
    const toutes = await sauvegardesConnues(); // la plus récente d'abord
    if (toutes.length <= RECENTES_GARDEES) return [];

    const gardees = new Set(toutes.slice(0, RECENTES_GARDEES).map(f => f.nom));

    // Puis la plus récente de chaque jour, sur les sept derniers jours vus.
    const jours: string[] = [];
    const parJour = new Map<string, string>();
    for (const f of toutes) {
        const jour = jourDe(f.nom);
        if (!parJour.has(jour)) { parJour.set(jour, f.nom); jours.push(jour); }
    }
    for (const jour of jours.slice(0, JOURS_GARDES)) gardees.add(parJour.get(jour)!);

    const supprimees: string[] = [];
    for (const f of toutes) {
        if (gardees.has(f.nom)) continue;
        await fs.remove(cheminDeSauvegarde(f.nom)); // revalidé, jamais le chemin listé tel quel
        supprimees.push(f.nom);
    }
    return supprimees;
}
