import path from 'node:path';
import fs from 'fs-extra';
import { app } from 'electron';
import { strictementSous } from './sousChemin';

/**
 * **Le miroir de `databases/` — le trou que les deux Ateliers ont creusé.**
 *
 * *Demandé par David le 2026-09-15 : « rajoute la database dans une
 * sauvegarde ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUI N'ÉTAIT SAUVEGARDÉ PAR RIEN
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `databases/` n'était dans **aucune** sauvegarde — ni la manuelle, ni
 * l'automatique, ni le miroir des médias. Le trou est antérieur aux Ateliers :
 * tant que ce dossier n'était que du contenu livré, un `git checkout` le
 * rendait. **Ce qui a changé, c'est que David y écrit** — les tables de
 * l'Atelier depuis le 2026-09-14, les calendriers depuis le 15.
 *
 * *Un dossier en lecture seule n'a pas besoin de filet ; le jour où quelque
 * chose y écrit, il en a besoin **le même jour**.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ ET LE DÉCLENCHEUR NE POUVAIT PAS ÊTRE CELUI DE LA SAUVEGARDE AUTOMATIQUE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La sauvegarde automatique part **deux minutes après un changement d'état de
 * session**. Or écrire une table passe par l'IPC et **ne touche aucun
 * magasin** : la sauvegarde n'aurait jamais démarré. Ranger `databases/` dedans
 * aurait donné un filet qui ne se déclenche pas — *pire qu'un filet absent,
 * parce qu'on croirait l'avoir.*
 *
 * D'où deux déclencheurs, et pas un :
 *
 * | Quand | Ce qu'il attrape |
 * | --- | --- |
 * | **Après chaque écriture** (table, calendrier) | Le geste du meneur, tout de suite |
 * | **Au démarrage** | Ce qui a été édité **à la main, hors de GM-OS** |
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LES TROIS RÈGLES DU 28/08, ET LA DÉCISION DU 29
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * | | |
 * | --- | --- |
 * | **R1** | Aucune commande de gestion de version. Ce module écrit des fichiers, c'est tout. |
 * | **R2** | Jamais sous `APP_ROOT`. Un seul point fabrique un chemin, et il vérifie sa sortie. |
 * | **R3** | Ne touche que son propre dossier. |
 *
 * ⚠️ **Le miroir GARDE ce qui a été supprimé** — tranché par David le
 * 2026-09-15, comme pour les images le 29/08 : *une suppression accidentelle
 * qui se propage au filet le rend inutile le jour où il servirait.* Le prix est
 * que l'espace ne redescend jamais tout seul ; ici il est dérisoire — **1,3 Mo
 * mesurés, 163 fichiers.**
 *
 * ⭐ **Le miroir reflète l'ARBORESCENCE, pas des identifiants.** Contrairement
 * aux médias — 261 Mo sous des `m-<uuid>` qu'aucun humain ne sait remettre en
 * place —, ici chaque fichier garde son chemin. *Restaurer, c'est recopier un
 * dossier :* c'est pour ça qu'il n'y a pas de bouton de restauration, et que
 * ce serait un bouton de trop.
 */

/** Sous `userData/backups/`, à côté des sauvegardes et du miroir des médias. */
const DOSSIER = path.join('backups', 'databases');

/** Le dossier source, sous la racine de l'application. */
export function racineDesDonnees(appRoot: string): string {
    return path.join(appRoot, 'databases');
}

/**
 * Le dossier du miroir.
 *
 * ⛔ **Fonction, et jamais une constante de module.** `app.getPath('userData')`
 * ne LIT pas un chemin, il le **verrouille** d'après `app.name` au moment de
 * l'appel : l'appeler à l'évaluation ferait basculer tout le profil. C'est la
 * panne du 2026-09-11, et elle a coûté sept campagnes à l'écran.
 */
export function dossierDuMiroir(): string {
    return path.join(app.getPath('userData'), DOSSIER);
}

/**
 * **Le reflet d'un fichier, ou `null` si son chemin sort du miroir.**
 *
 * `relatif` est un chemin **relatif à `databases/`** — `tables/Alien/panique.json`.
 * Tout ce qui remonte, tout ce qui est absolu, tout ce qui porte un octet nul
 * est refusé.
 *
 * ⚠️ **Les séparateurs des deux mondes sont acceptés en entrée** : le chemin
 * arrive parfois d'un `path.relative` Windows (`tables\\Alien\\x.json`) et
 * parfois d'un littéral écrit à la main. *Un miroir qui range le même fichier à
 * deux endroits selon la barre oblique employée est un miroir qui ment sur ce
 * qu'il contient.*
 */
export function cheminDuReflet(racineDuMiroir: string, relatif: string): string | null {
    const brut = (relatif ?? '').trim();
    if (brut === '' || brut.includes('\0')) return null;
    if (path.isAbsolute(brut)) return null;

    const normalise = brut.split(/[\\/]+/).filter(Boolean);
    if (normalise.length === 0) return null;
    if (normalise.some(seg => seg === '.' || seg === '..')) return null;

    const vise = path.resolve(racineDuMiroir, ...normalise);
    return strictementSous(vise, racineDuMiroir) ? vise : null;
}

/** Ce qu'une copie a produit. */
export type SortDuFichier =
    /** Le reflet n'existait pas, ou différait : il vient d'être écrit. */
    | 'copie'
    /** Le reflet était déjà identique, octet pour octet. */
    | 'inchange'
    /** Le fichier source n'existe plus. **Le reflet est conservé.** */
    | 'absent'
    /** Le chemin sortait du miroir, ou la lecture a échoué. */
    | 'refuse';

/**
 * **Deux fichiers portent-ils les mêmes octets ?**
 *
 * ⚠️ **On compare le CONTENU, pas les dates.** Une date de modification se
 * perd à la copie, se décale d'un système de fichiers à l'autre, et remonte le
 * temps quand on restaure un fichier plus ancien. *Un miroir qui se fie aux
 * dates finit par croire à jour ce qui ne l'est pas* — et il le croit
 * silencieusement, ce qui est le pire.
 *
 * Le coût est nul ici : **1,3 Mo pour tout le dossier**, et la taille écarte la
 * plupart des paires avant qu'on lise un seul octet.
 */
async function memesOctets(a: string, b: string): Promise<boolean> {
    try {
        const [sa, sb] = await Promise.all([fs.stat(a), fs.stat(b)]);
        if (sa.size !== sb.size) return false;

        const [oa, ob] = await Promise.all([fs.readFile(a), fs.readFile(b)]);
        return oa.equals(ob);
    } catch {
        return false;
    }
}

/**
 * Copie un fichier dans le miroir s'il y diffère.
 *
 * ⚠️ **Un fichier source absent rend `absent` et ne supprime RIEN.** C'est la
 * décision de David : le miroir garde ce qui a été supprimé.
 */
export async function refleterUnFichier(
    racineSource: string,
    racineDuMiroir: string,
    relatif: string,
): Promise<SortDuFichier> {
    const reflet = cheminDuReflet(racineDuMiroir, relatif);
    if (!reflet) return 'refuse';

    const source = cheminDuReflet(racineSource, relatif);
    if (!source) return 'refuse';

    if (!await fs.pathExists(source)) return 'absent';
    if (await fs.pathExists(reflet) && await memesOctets(source, reflet)) return 'inchange';

    try {
        await fs.ensureDir(path.dirname(reflet));
        await fs.copy(source, reflet, { overwrite: true });
        return 'copie';
    } catch (err) {
        console.error('[Miroir] copie impossible :', relatif, err);
        return 'refuse';
    }
}

/** Ce qu'un balayage a produit. */
export interface BilanDuMiroir {
    copies: number;
    inchanges: number;
    refuses: number;
    /** Les chemins relatifs effectivement copiés — utile au journal et aux essais. */
    nouveaux: string[];
}

/** Tous les fichiers d'un dossier, en chemins relatifs, séparés par `/`. */
async function fichiersDe(racine: string, prefixe = ''): Promise<string[]> {
    if (!await fs.pathExists(racine)) return [];

    const entrees = await fs.readdir(racine, { withFileTypes: true });
    const trouves: string[] = [];

    for (const e of entrees) {
        const relatif = prefixe ? `${prefixe}/${e.name}` : e.name;
        if (e.isDirectory()) {
            trouves.push(...await fichiersDe(path.join(racine, e.name), relatif));
        } else if (e.isFile()) {
            trouves.push(relatif);
        }
    }
    return trouves;
}

/**
 * **Le balayage complet — ce qui rattrape les éditions faites à la main.**
 *
 * ⚠️ **Il ne supprime jamais du miroir.** Un fichier qui a disparu de la source
 * n'est simplement pas visité.
 */
export async function balayerLesDonnees(
    racineSource: string,
    racineDuMiroir: string,
): Promise<BilanDuMiroir> {
    const bilan: BilanDuMiroir = { copies: 0, inchanges: 0, refuses: 0, nouveaux: [] };

    for (const relatif of await fichiersDe(racineSource)) {
        const sort = await refleterUnFichier(racineSource, racineDuMiroir, relatif);
        if (sort === 'copie') {
            bilan.copies++;
            bilan.nouveaux.push(relatif);
        } else if (sort === 'inchange') {
            bilan.inchanges++;
        } else if (sort === 'refuse') {
            bilan.refuses++;
        }
    }

    return bilan;
}

/** Ce que le miroir contient, en chemins relatifs. Pour le diagnostic. */
export async function refletsConnus(racineDuMiroir: string): Promise<string[]> {
    return fichiersDe(racineDuMiroir);
}
