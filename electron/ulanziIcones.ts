import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

/**
 * **Déposer les icônes animées du signal sur l'afficheur — 2026-08-31.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI DES FICHIERS, ET NON UN TRACÉ POUSSÉ IMAGE PAR IMAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Mesuré sur l'appareil de David** : une écriture HTTP coûte **253 ms**, et le
 * même temps pour 59 octets que pour 398. C'est un coût **fixe par requête**, pas
 * un coût de dessin. Pousser des images plafonne donc à quatre par seconde — ce
 * qui n'est pas une animation, c'est une succession de photos.
 *
 * *Le détour que ça a coûté vaut d'être écrit* : le premier signal a été conçu
 * autour de cette limite, en tracé statique qui dérive. **Je n'avais jamais
 * regardé si l'appareil exposait un système de fichiers.** Il en expose un —
 * `/list` et `/edit` — et une icône animée déposée dans son dossier `ICONS` est
 * **jouée par l'appareil lui-même**, à pleine vitesse et sans un octet de trafic.
 *
 * Vérifié en réel le 2026-08-31 : un GIF **32 × 8** s'affiche sur toute la
 * largeur et s'anime. David : *« je vois un tracé animé sur toute la largeur »*.
 *
 * **Conséquence sur tout le widget** : changer de rythme ne coûte plus qu'une
 * écriture — celle qui change le nom de l'icône —, et le signal libère la cadence
 * rapide de 500 ms qui n'existait que pour lui.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEUX DÉCISIONS DE DAVID, LE 2026-08-31
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **1. Les icônes restent sur l'appareil.** Elles vivent en flash et survivent
 * aux redémarrages ; c'est exactement ce qui rend l'idée gratuite en séance. La
 * restitution ne les efface donc pas — *elles ne s'affichent pas d'elles-mêmes,
 * et les redéposer à chaque séance coûterait huit envois pour rien.*
 *
 * ⚠️ C'est la **première fois que GM-OS écrit durablement** sur l'afficheur.
 * Tout le reste — widgets, réglages — est temporaire par construction.
 *
 * **2. On ne dépose que ce qui manque.** Un `GET /list?dir=/ICONS` avant tout
 * envoi : le cas courant est donc *aucune requête d'écriture*.
 */

/** Le nom des six icônes, un par niveau du signal. */
export const ICONES_DU_SIGNAL = [1, 2, 3, 4, 5, 6].map(n => `gmosvk${n}`);

/**
 * Le corps `multipart/form-data` d'un dépôt, isolé pour être vérifiable.
 *
 * ⚠️ **Le nom du fichier se pose à la main, et c'est un piège payé.** Les
 * fabricants de multipart ajoutent volontiers un paramètre `filename*` (RFC 5987)
 * à côté de `filename` ; le serveur de l'appareil **avale la ligne entière** et
 * crée un fichier nommé `gmosvk1.gif"; filename*=utf-8''%2FICONS%2F…`. Deux
 * fichiers illisibles ont dû être supprimés à la main avant de comprendre.
 *
 * *Un serveur embarqué lit rarement toute la norme ; on lui envoie le strict
 * nécessaire.*
 */
export function corpsMultipart(
    frontiere: string,
    chemin: string,
    contenu: Buffer,
): Buffer {
    const entete =
        `--${frontiere}\r\n`
        + `Content-Disposition: form-data; name="data"; filename="${chemin}"\r\n`
        + 'Content-Type: image/gif\r\n\r\n';
    return Buffer.concat([
        Buffer.from(entete, 'utf-8'),
        contenu,
        Buffer.from(`\r\n--${frontiere}--\r\n`, 'utf-8'),
    ]);
}

/** L'hôte, tel qu'il est saisi — avec ou sans schéma, avec ou sans barre finale. */
function hoteNu(hote: string): string {
    return hote.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function requete(
    hote: string,
    chemin: string,
    method: 'GET' | 'POST',
    corps?: Buffer,
    entetes?: Record<string, string>,
): Promise<string> {
    return new Promise((resolve, rejeter) => {
        const req = http.request(
            { host: hoteNu(hote), port: 80, path: chemin, method, headers: entetes, timeout: 15_000 },
            (res) => {
                let texte = '';
                res.setEncoding('utf-8');
                res.on('data', (m: string) => { texte += m; });
                res.on('end', () => {
                    if ((res.statusCode ?? 0) >= 400) {
                        rejeter(new Error(`${method} ${chemin} — ${res.statusCode}`));
                        return;
                    }
                    resolve(texte);
                });
            },
        );
        req.on('timeout', () => req.destroy(new Error(`${method} ${chemin} — délai dépassé`)));
        req.on('error', rejeter);
        if (corps) req.write(corps);
        req.end();
    });
}

/**
 * Les icônes déjà présentes sur l'appareil.
 *
 * **Le listing est lu en tolérant qu'il soit malformé.** Celui de l'appareil
 * l'était pendant l'essai — des noms contenant guillemets et point-virgules
 * cassaient `JSON.parse`. *Un inventaire qu'on ne peut pas lire ne doit pas
 * empêcher de déposer* : on retombe alors sur « rien n'est là », et un dépôt de
 * plus ne coûte que quelques centaines de millisecondes.
 */
export function nomsPresents(listing: string): string[] {
    const noms: string[] = [];
    // Volontairement une expression régulière et non `JSON.parse` : voir ci-dessus.
    for (const [, nom] of listing.matchAll(/"name"\s*:\s*"([^"]+\.gif)"/g)) {
        noms.push(nom.replace(/\.gif$/i, ''));
    }
    return noms;
}

/** Ce qu'il reste à déposer, une fois retiré ce qui est déjà là. */
export function iconesManquantes(listing: string, attendues = ICONES_DU_SIGNAL): string[] {
    const presentes = new Set(nomsPresents(listing));
    return attendues.filter(n => !presentes.has(n));
}

/**
 * Dépose les icônes du signal qui manquent, et rend celles qui ont été écrites.
 *
 * **Un échec ne se remonte pas à l'écran.** Sans icône, le widget montre un
 * cadre vide plutôt qu'un tracé — c'est visible, et le meneur n'y peut rien sur
 * le moment. Le journal garde la trace pour qui la cherche.
 */
export async function deposerLesIcones(hote: string, dossier: string): Promise<string[]> {
    const listing = await requete(hote, '/list?dir=/ICONS', 'GET');
    const manquantes = iconesManquantes(listing);
    if (manquantes.length === 0) return [];

    const deposees: string[] = [];
    for (const nom of manquantes) {
        const source = path.join(dossier, `${nom}.gif`);
        if (!fs.existsSync(source)) {
            console.warn(`[Ulanzi] icône introuvable dans l'application : ${source}`);
            continue;
        }
        const frontiere = `----gmos${Date.now()}${nom}`;
        const corps = corpsMultipart(frontiere, `/ICONS/${nom}.gif`, fs.readFileSync(source));
        await requete(hote, '/edit', 'POST', corps, {
            'Content-Type': `multipart/form-data; boundary=${frontiere}`,
            'Content-Length': String(corps.length),
        });
        deposees.push(nom);
    }
    console.log(`[Ulanzi] icônes déposées : ${deposees.join(', ') || 'aucune'}`);
    return deposees;
}
