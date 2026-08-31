import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import log from 'electron-log';

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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ « ELLES RESTENT » N'EST PAS « ELLES SERONT LÀ » — 2026-08-31, LE SOIR
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *David, quelques heures après la livraison : « le signal Voight-Kampff de
 * l'Ulanzi ne fonctionne pas ».* `/list?dir=/ICONS` rendait `[]` — **le dossier
 * était vide**, alors que `/api/loop` montrait `gmos_vk` bien poussé. GM-OS
 * publiait un widget qui pointe vers une icône absente : cadre noir.
 *
 * J'avais déduit du « elles vivent en flash » qu'il suffisait de déposer **une
 * fois**, à la prise de main. Deux choses démentent ce raisonnement :
 *
 * 1. **Le flash n'est pas une garantie.** Une remise à zéro, une mise à jour du
 *    micrologiciel, un ménage dans le portail de l'appareil, et le dossier est
 *    vide sans que GM-OS en sache rien.
 * 2. **La prise de main peut rater.** L'appareil qui démarre refuse les
 *    écritures (`500 CREATE FAILED`) pendant quelques minutes — c'est ce qui
 *    s'est produit, GM-OS ayant démarré trente secondes après l'afficheur.
 *
 * D'où la règle : *ce dépôt n'est pas un geste d'ouverture, c'est une veille.*
 * `useBattementUlanzi` l'appelle tant que le signal est affiché, et n'espace ses
 * vérifications qu'une fois `manquantes` vide.
 *
 * **Et le journal ne disait rien** : `console.log` du processus principal
 * **n'arrive pas dans `main.log`** (zéro ligne `[Main]` dans un fichier qui en
 * contient des milliers). Tout est passé à `log` d'electron-log — *une trace
 * qu'on ne peut pas relire est une trace qui n'existe pas.*
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

/**
 * L'hôte, tel qu'il est saisi — avec ou sans schéma, avec ou sans barre finale,
 * **et avec son port s'il en porte un**.
 *
 * `UlanziService` compose `http://<hôte>` et accepte donc déjà `machine:8080`.
 * Un port cloué à 80 ici aurait fait diverger les deux chemins sur le seul hôte
 * qui n'est pas l'appareil standard — et c'est aussi ce qui rend ce module
 * essayable contre un serveur local.
 */
export function cibleDeLHote(hote: string): { host: string; port: number } {
    const nu = hote.replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const separateur = nu.lastIndexOf(':');
    if (separateur < 0) return { host: nu, port: 80 };
    const port = Number(nu.slice(separateur + 1));
    return Number.isInteger(port) && port > 0
        ? { host: nu.slice(0, separateur), port }
        : { host: nu, port: 80 };
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
            { ...cibleDeLHote(hote), path: chemin, method, headers: entetes, timeout: 15_000 },
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
 * Ce qu'un dépôt a fait, et surtout **ce qu'il n'a pas réussi à faire**.
 *
 * `manquantes` vide est la seule preuve que le signal peut s'afficher : c'est
 * elle qui autorise l'appelant à espacer sa veille. *Rendre la liste des
 * déposées ne disait rien du cas qui compte — celui où il en manque encore.*
 */
export interface DepotDesIcones {
    deposees: string[];
    manquantes: string[];
}

/**
 * Dépose les icônes du signal qui manquent, et dit ce qui manque encore.
 *
 * **Un échec ne se remonte pas à l'écran.** Sans icône, le widget montre un
 * cadre vide plutôt qu'un tracé — c'est visible, et le meneur n'y peut rien sur
 * le moment. Le journal garde la trace pour qui la cherche.
 *
 * ⚠️ **Chaque icône est tentée pour elle-même, et un échec n'arrête pas les
 * autres.** *Mesuré le 2026-08-31 :* l'appareil qui vient de démarrer répond
 * `500 CREATE FAILED` à une écriture pendant quelques minutes, puis l'accepte
 * sans rien changer d'autre. Une boucle qui s'arrêtait à la première erreur
 * laissait donc les cinq suivantes au sol pour une panne passagère de la
 * première.
 */
export async function deposerLesIcones(hote: string, dossier: string): Promise<DepotDesIcones> {
    const listing = await requete(hote, '/list?dir=/ICONS', 'GET');
    const aDeposer = iconesManquantes(listing);
    if (aDeposer.length === 0) return { deposees: [], manquantes: [] };

    const deposees: string[] = [];
    const manquantes: string[] = [];
    for (const nom of aDeposer) {
        const source = path.join(dossier, `${nom}.gif`);
        if (!fs.existsSync(source)) {
            log.warn(`[Ulanzi] icône introuvable dans l'application : ${source}`);
            manquantes.push(nom);
            continue;
        }
        const frontiere = `----gmos${Date.now()}${nom}`;
        const corps = corpsMultipart(frontiere, `/ICONS/${nom}.gif`, fs.readFileSync(source));
        try {
            await requete(hote, '/edit', 'POST', corps, {
                'Content-Type': `multipart/form-data; boundary=${frontiere}`,
                'Content-Length': String(corps.length),
            });
            deposees.push(nom);
        } catch (e) {
            manquantes.push(nom);
            log.warn(`[Ulanzi] dépôt de ${nom} refusé :`, e);
        }
    }
    log.info(
        `[Ulanzi] icônes déposées : ${deposees.join(', ') || 'aucune'}`
        + (manquantes.length ? ` — il manque encore : ${manquantes.join(', ')}` : ''),
    );
    return { deposees, manquantes };
}
