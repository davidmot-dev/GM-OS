import path from 'node:path';
import fs from 'fs-extra';
import { app } from 'electron';

/**
 * **Le miroir des médias — chantier n° 4.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN MIROIR ET PAS DES INSTANTANÉS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La sauvegarde automatique du 28/08 est une **sauvegarde de pointeurs** : une
 * carte de l'atlas porte `"fileUrl": "m-<uuid>"`, et les octets vivent dans une
 * autre base. Restaurer sur un profil neuf rendait des cartes mortes.
 *
 * **Mesuré sur la machine de David le 2026-08-29 : 115 images, 261 Mo.** Copier
 * ça dans chaque sauvegarde, avec la rotation de douze, coûterait **trois
 * gigaoctets** pour presque rien — une carte ne change pas, on en ajoute. D'où
 * un miroir : **chaque image écrite UNE fois, jamais réécrite**. Le premier
 * passage coûte 261 Mo, les suivants ne coûtent que les nouveautés.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE MIROIR GARDE TOUT — décision de David, le 2026-08-29
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une image supprimée dans GM-OS **reste** dans le miroir. C'est précisément le
 * mode de perte qu'un filet doit couvrir : *une suppression accidentelle qui se
 * propage au filet le rend inutile le jour où il servirait.* Le prix est que
 * l'espace ne redescend jamais tout seul — un geste de nettoyage explicite, qui
 * dira ce qu'il s'apprête à supprimer, viendra plus tard.
 *
 * **Il n'y a donc AUCUNE rotation ici, et c'est délibéré.** La rotation de la
 * sauvegarde automatique existe parce que chaque fichier est une copie complète
 * de l'état ; ici chaque fichier est unique et irremplaçable.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES TROIS RÈGLES DU 28/08 TIENNENT ICI AUSSI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * | | |
 * | --- | --- |
 * | **R1** | Aucune commande de gestion de version. Ce module écrit des fichiers, c'est tout. |
 * | **R2** | Jamais sous `APP_ROOT`. Un seul point fabrique un chemin, et il vérifie sa sortie. |
 * | **R3** | Ne touche que des fichiers qu'il a écrits : son dossier, son motif de nom. |
 */

/** Sous `userData/backups/`, à côté des sauvegardes de session — jamais sous `APP_ROOT`. */
const DOSSIER = path.join('backups', 'medias');

/**
 * Le motif d'un fichier que CE module a écrit.
 *
 * Les identifiants de médias sont des `m-<uuid>` ; on n'accepte que ce
 * vocabulaire, ce qui exclut d'un coup les séparateurs, les `..` et les chemins
 * absolus. *Un fichier que le MJ aurait déposé là à la main ne correspond pas,
 * donc il est invisible* — c'est ce qui donne R3 sans effort.
 */
const MOTIF_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

/** Le catalogue : ce que chaque octet représente. Sans lui, on restaure des fichiers anonymes. */
export const CATALOGUE = 'catalogue.json';

/** Ce qu'on sait d'un média, en dehors de ses octets. */
export interface FicheDeMedia {
    id: string;
    name: string;
    type: string;
    size: number;
    createdAt?: number;
    tags?: string[];
    campaignIds?: string[];
    /** Quand le miroir l'a copié. Il ne change plus ensuite. */
    copieLe: string;
}

function normaliser(p: string): string {
    const resolu = path.resolve(p);
    return process.platform === 'win32' ? resolu.toLowerCase() : resolu;
}

function estSous(enfant: string, parent: string): boolean {
    const a = normaliser(enfant);
    const b = normaliser(parent);
    return a === b || a.startsWith(b + path.sep);
}

export function dossierDuMiroir(): string {
    return path.join(app.getPath('userData'), DOSSIER);
}

/**
 * **Le seul endroit du programme qui fabrique un chemin dans le miroir.**
 *
 * Il valide l'entrée **et** vérifie la sortie : *la première dit ce qu'on croit
 * avoir reçu, la seconde ce qu'on s'apprête vraiment à toucher.* Et il refuse
 * que le miroir tombe sous `APP_ROOT` — la configuration exacte qui a coûté
 * l'installation en mars 2026.
 */
export function cheminDuMedia(id: string): string {
    if (!MOTIF_ID.test(id)) {
        throw new Error(`[Miroir] Identifiant refusé : « ${id} » n'est pas un identifiant de média.`);
    }

    const dossier = dossierDuMiroir();
    const appRoot = process.env.APP_ROOT;
    if (appRoot && estSous(dossier, appRoot)) {
        throw new Error(
            '[Miroir] Destination refusée : le miroir tomberait dans le dossier de l’application. ' +
            'Aucune image ne sera copiée — écrire là est ce qui a détruit l’installation en mars 2026.',
        );
    }

    const complet = path.resolve(dossier, id);
    if (path.dirname(normaliser(complet)) !== normaliser(dossier)) {
        throw new Error(`[Miroir] Chemin refusé : « ${id} » sortirait du miroir.`);
    }
    return complet;
}

/**
 * Les identifiants déjà copiés.
 *
 * C'est cette liste qui rend le miroir incrémental : le renderer la compare à sa
 * bibliothèque et n'envoie que la différence. **Sans elle il faudrait relire 261
 * Mo à chaque sauvegarde**, et la sauvegarde de sortie n'aurait jamais le temps.
 */
export async function mediasCopies(): Promise<string[]> {
    const dossier = dossierDuMiroir();
    if (!(await fs.pathExists(dossier))) return [];
    return (await fs.readdir(dossier)).filter(n => n !== CATALOGUE && MOTIF_ID.test(n));
}

export interface ResultatDuMiroir {
    /** Vrai quand les octets viennent d'être écrits ; faux quand ils y étaient déjà. */
    ecrit: boolean;
    octets: number;
}

/**
 * Copie un média, **une seule fois**.
 *
 * Une image déjà présente n'est pas réécrite : c'est ce qui rend le passage
 * suivant gratuit, et c'est aussi ce qui garantit qu'un octet copié ne peut plus
 * être abîmé par une écriture ultérieure.
 *
 * L'écriture est **atomique** — fichier temporaire puis renommage —, et **relue**
 * : une copie tronquée par une coupure de courant serait pire qu'une absence,
 * parce qu'elle a l'air d'une copie.
 */
export async function copierUnMedia(id: string, octets: Uint8Array): Promise<ResultatDuMiroir> {
    const chemin = cheminDuMedia(id);
    if (await fs.pathExists(chemin)) {
        return { ecrit: false, octets: (await fs.stat(chemin)).size };
    }

    await fs.ensureDir(dossierDuMiroir());
    const provisoire = `${chemin}.partiel`;
    await fs.writeFile(provisoire, octets);

    const ecrits = (await fs.stat(provisoire)).size;
    if (ecrits !== octets.byteLength) {
        await fs.remove(provisoire);
        throw new Error(`[Miroir] Copie tronquée pour « ${id} » : ${ecrits} octets sur ${octets.byteLength}.`);
    }

    await fs.move(provisoire, chemin, { overwrite: false });
    return { ecrit: true, octets: ecrits };
}

/**
 * Le catalogue, **fusionné et jamais remplacé**.
 *
 * Puisque le miroir garde tout, une fiche déjà connue ne doit pas disparaître
 * parce que son image a été supprimée de GM-OS : *on perdrait le nom d'un
 * fichier dont on garde pourtant les octets, et la restauration rendrait des
 * images anonymes.* Les fiches reçues gagnent sur les anciennes de même
 * identifiant — un renommage dans GM-OS se propage.
 */
export async function inscrireAuCatalogue(fiches: FicheDeMedia[]): Promise<number> {
    const dossier = dossierDuMiroir();
    await fs.ensureDir(dossier);
    const chemin = path.join(dossier, CATALOGUE);

    let connues: Record<string, FicheDeMedia> = {};
    if (await fs.pathExists(chemin)) {
        try {
            const lu = await fs.readJson(chemin);
            if (lu && typeof lu === 'object' && lu.medias) connues = lu.medias;
        } catch (err) {
            // Un catalogue illisible ne doit pas bloquer la copie des octets :
            // on le reconstruit à partir de ce qu'on sait, et on le dit.
            console.error('[Miroir] Catalogue illisible, reconstruit :', err);
        }
    }

    for (const fiche of fiches) {
        if (MOTIF_ID.test(fiche.id)) connues[fiche.id] = { ...connues[fiche.id], ...fiche };
    }

    const provisoire = `${chemin}.partiel`;
    await fs.writeJson(provisoire, {
        format: 'gmos-miroir-medias',
        version: 1,
        majLe: new Date().toISOString(),
        medias: connues,
    }, { spaces: 0 });
    await fs.move(provisoire, chemin, { overwrite: true });

    return Object.keys(connues).length;
}
