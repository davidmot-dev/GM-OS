import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/**
 * **Le serveur des fiches — un port à lui, et c'est tout l'intérêt.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN SECOND SERVEUR PLUTÔT QU'UNE ROUTE DE PLUS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Sur l'écran du meneur, la fiche marche parce que `gmos://media/…` est une
 * **origine différente** de celle du cockpit : le navigateur les sépare, la fiche
 * ne peut pas lire les données de GM-OS, et tout passe par `postMessage`. Cette
 * séparation n'est pas un effet de bord, c'est ce qui rend l'hôte sûr — le
 * fichier HTML est régénéré par un GPT, il n'est jamais relu ligne à ligne.
 *
 * Ajouter `.html` aux types servis par le `SyncServer` aurait été une ligne. Ça
 * aurait aussi mis la fiche **sur l'origine du Player Hub**, avec accès à son
 * stockage. Un port distinct rend la séparation à la tablette pour le même prix.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'IL SERT, ET RIEN D'AUTRE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deux formes d'adresse, décidées par `cheminServi`, qui est pure et éprouvée
 * séparément :
 *
 * - `/fiches/<…>.html` → `docs/fiches/<…>.html` — le moteur et les fiches ;
 * - `/systems/<jeu>/fiche/<…>.json` → la table de correspondance, que la
 *   tablette ne peut pas lire autrement (elle n'a pas `readDoc`).
 *
 * Tout le reste est un 404. Il n'écrit jamais, il ne liste jamais un dossier, et
 * il ne sort jamais de `docs/`. *Un serveur sur `0.0.0.0` voit passer ce que le
 * réseau lui envoie, pas ce qu'on avait prévu.*
 */

/** Le port des fiches. Distinct du `SyncServer` : c'est toute la raison d'être. */
export const PORT_DES_FICHES = 3002;

/** Les deux seules formes d'adresse acceptées, et l'extension qui va avec. */
const ROUTES: { prefixe: string; extension: string }[] = [
    { prefixe: 'fiches/', extension: '.html' },
    { prefixe: 'systems/', extension: '.json' },
];

const TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
};

/**
 * Traduit une adresse en chemin de fichier, ou rend `null`.
 *
 * Pure, donc éprouvable sans ouvrir de socket — et c'est la seule fonction de ce
 * module qui décide quoi que ce soit. Les refus sont silencieux côté client : un
 * 404 ne dit pas si le fichier existe mais est hors périmètre.
 */
export function cheminServi(urlBrute: string, racineDocs: string): string | null {
    if (!urlBrute) return null;

    // La query string se coupe AVANT décodage : sinon `?x=../..` repasse dedans.
    const sansQuery = urlBrute.split('?')[0].split('#')[0];

    let chemin: string;
    try {
        chemin = decodeURIComponent(sansQuery);
    } catch {
        // Un pourcentage mal formé lève : c'est un refus, pas une exception à propager.
        return null;
    }

    // Un octet nul tronque le chemin côté syscall.
    if (chemin.includes('\0')) return null;
    if (!chemin.startsWith('/')) return null;

    const relatif = chemin.slice(1);
    const route = ROUTES.find(r => relatif.startsWith(r.prefixe));
    if (!route) return null;
    if (path.extname(relatif).toLowerCase() !== route.extension) return null;

    /*
      On résout PUIS on vérifie le résultat. Refuser « .. » à la lecture suffirait
      aujourd'hui et échouerait au premier encodage exotique ou lien symbolique :
      seule la comparaison des chemins résolus dit la vérité.
    */
    const racine = path.resolve(racineDocs);
    const vise = path.resolve(racine, relatif);
    if (vise !== racine && !vise.startsWith(racine + path.sep)) return null;

    return vise;
}

export class ServeurDesFiches {
    private serveur: http.Server | null = null;

    constructor(private readonly racineDocs: string, private readonly port = PORT_DES_FICHES) {}

    public start(): void {
        if (this.serveur) return;

        this.serveur = http.createServer((req, res) => this.repondre(req, res));

        this.serveur.on('error', (err) => {
            // Un port occupé ne doit pas empêcher GM-OS de démarrer : les fiches
            // ne s'afficheront pas sur les tablettes, le reste marche.
            console.error(`[ServeurDesFiches] Impossible d'écouter sur ${this.port} :`, err);
            this.serveur = null;
        });

        this.serveur.listen(this.port, '0.0.0.0', () => {
            console.log(`[ServeurDesFiches] Fiches servies sur le port ${this.port}, depuis ${this.racineDocs}`);
        });
    }

    public stop(): void {
        this.serveur?.close();
        this.serveur = null;
    }

    private repondre(req: http.IncomingMessage, res: http.ServerResponse): void {
        // Lecture seule, sans exception : rien de ce qui vient du réseau n'écrit.
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { Allow: 'GET, HEAD' });
            res.end();
            return;
        }

        const fichier = req.url ? cheminServi(req.url, this.racineDocs) : null;
        if (!fichier || !fs.existsSync(fichier) || !fs.statSync(fichier).isFile()) {
            if (req.url) console.warn(`[ServeurDesFiches] Refusé ou introuvable : ${req.url}`);
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        res.writeHead(200, {
            'Content-Type': TYPES[path.extname(fichier).toLowerCase()],
            // La tablette lit la table depuis SON origine : sans ça, le `fetch` échoue.
            'Access-Control-Allow-Origin': '*',
            // Le type déclaré fait foi — pas de reniflage, pas de surprise.
            'X-Content-Type-Options': 'nosniff',
        });

        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(fichier).pipe(res);
    }
}
