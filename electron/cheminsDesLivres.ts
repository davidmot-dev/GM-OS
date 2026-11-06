import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'fs-extra';
import { BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { lirePagesPdf, pdfDisponible } from './extractionPdf';
import { racineDuCorpus } from './perimetreDeLInstance';
import { strictementSous } from './sousChemin';
import {
    demandeDOuvertureValide, lireLesLivres, livreDeLaDemande, mesurerLeDecalage, pageDuPdf, pagesAEchantillonner,
    type LivreDuJeu, type MotifDuLivre, type OuvertureDuLivre, type PropositionDeDecalage, type VerificationDuLivre,
} from '../src/modules/forge/rules/livres';

/**
 * **Les chemins des livres, côté processus principal** — étape B du plan
 * `documentation/Planning/2026-11-06-chemins-des-livres.md` (06/11/2026), écran validé par David
 * (*« je valide »*, maquette `stitch/livres/pdf-du-livre.png`).
 *
 * Trois gestes de la carte « PDF du livre » de la Forge : choisir le fichier, vérifier qu'il répond
 * (et compter ses pages), proposer le décalage des pages. **Aucun ne copie le livre**, aucun n'écrit :
 * le registre `livres.json` s'écrit par `ai:write-doc`, comme `supplements.json`.
 *
 * ⚠️ `verifier` et `proposer` reçoivent un chemin de l'interface : ils ne font que **lire**, et
 * seulement un `.pdf`. Rien n'est ouvert ni exécuté ici ; l'ouverture à la page (étape C) lira le
 * chemin dans le registre, jamais dans l'interface.
 */

const estUnPdf = (chemin: unknown): chemin is string => typeof chemin === 'string' && /\.pdf$/i.test(chemin.trim());

/** Le livre, lu en entier : un PDF du NAS se lit mal par morceaux, et la lecture est ponctuelle. */
async function lireLeLivre(chemin: unknown): Promise<{ donnees: Buffer } | { motif: MotifDuLivre }> {
    if (!estUnPdf(chemin)) return { motif: 'pas-un-pdf' };
    if (!pdfDisponible) return { motif: 'pdf-indisponible' };
    // Un NAS éteint rend une erreur, pas `false` : les deux disent que le livre ne répond pas.
    if (!(await fs.pathExists(chemin.trim()).catch(() => false))) return { motif: 'introuvable' };
    try {
        return { donnees: await fs.readFile(chemin.trim()) };
    } catch {
        return { motif: 'introuvable' };
    }
}

/**
 * **La fenêtre de lecture** — étape C (06/11/2026), choix de David : *« dans la fenêtre intégrée »*.
 * La visionneuse PDF de Chromium (`plugins: true`), sans préchargement ni accès à Node, dans une
 * partition à elle. Une seule fenêtre : chaque « Livre, p. N » la reprend.
 *
 * ⚠️ Essayé le 06/11 sur le livre d'Alien du NAS : changer seulement `#page=` d'une fenêtre déjà
 * ouverte sur le même fichier **ne déplace pas** la visionneuse (elle restait p. 312). Chaque
 * ouverture porte donc une adresse distincte (`?ouverture=N`) : le livre se recharge et la page
 * est prise.
 */
let fenetreDeLecture: BrowserWindow | null = null;
let ouvertures = 0;

async function ouvrirDansLaFenetre(livre: LivreDuJeu, pagePdf: number, parent: BrowserWindow | null): Promise<OuvertureDuLivre> {
    if (!fenetreDeLecture || fenetreDeLecture.isDestroyed()) {
        const fenetre = new BrowserWindow({
            width: 1100, height: 900, show: false, autoHideMenuBar: true, backgroundColor: '#2a2b2e',
            // ⚠️ Une partition persistante : dans une partition en mémoire (`livres`), la visionneuse
            // PDF se charge mais ne peint rien — fenêtre blanche, vue à l'e2e le 06/11.
            webPreferences: { plugins: true, sandbox: true, contextIsolation: true, nodeIntegration: false, partition: 'persist:livres' },
        });
        fenetre.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
        fenetre.webContents.on('will-navigate', e => e.preventDefault());
        // Le titre reste le nôtre (« ALIEN, le jeu de rôle — p. 309 »), pas le nom du fichier.
        fenetre.on('page-title-updated', e => e.preventDefault());
        fenetre.on('closed', () => { if (fenetreDeLecture === fenetre) fenetreDeLecture = null; });
        // ⛔ Restée seule, elle empêcherait GM-OS de se fermer (`window-all-closed` n'arrive pas).
        parent?.once('closed', () => { if (!fenetre.isDestroyed()) fenetre.close(); });
        fenetreDeLecture = fenetre;
    }
    const fenetre = fenetreDeLecture;
    ouvertures += 1;
    try {
        await fenetre.loadURL(`${pathToFileURL(livre.chemin).href}?ouverture=${ouvertures}#page=${pagePdf}`);
        fenetre.setTitle(`${livre.titre} — page ${pagePdf} du PDF`);
        fenetre.show();
        fenetre.focus();
        return { ouvert: true, titre: livre.titre, pagePdf, alaPage: true };
    } catch {
        // Repli : l'application PDF du système, qui ne sait pas viser une page.
        if (!fenetre.isDestroyed()) fenetre.close();
        const erreur = await shell.openPath(livre.chemin).catch(() => 'échec');
        return erreur ? { ouvert: false, motif: 'illisible' } : { ouvert: true, titre: livre.titre, pagePdf: 1, alaPage: false };
    }
}

export interface OptionsDesLivres {
    /** La racine de `docs/` (le corpus jetable en essai). */
    racineDesDocs?: () => string;
}

export function registerLivresHandlers(options: OptionsDesLivres = {}): void {
    const racineDesDocs = options.racineDesDocs ?? (() => racineDuCorpus(process.env, process.env.APP_ROOT || ''));

    /**
     * Ouvre le livre à la page imprimée demandée. Le chemin est relu ici, dans le registre du jeu :
     * l'écran ne nomme que le jeu, la clé et la page.
     */
    ipcMain.handle('livres:ouvrir', async (event, brute: unknown): Promise<OuvertureDuLivre> => {
        const demande = demandeDOuvertureValide(brute);
        if (!demande) return { ouvert: false, motif: 'demande-invalide' };
        const racine = racineDesDocs();
        const registre = path.join(racine, demande.racine, 'livres.json');
        if (!strictementSous(registre, racine)) return { ouvert: false, motif: 'demande-invalide' };
        const brut = await fs.readFile(registre, 'utf8').catch(() => null);
        const livre = livreDeLaDemande(lireLesLivres(brut), demande);
        if (!livre) return { ouvert: false, motif: 'sans-livre' };
        if (!estUnPdf(livre.chemin)) return { ouvert: false, motif: 'pas-un-pdf' };
        if (!(await fs.pathExists(livre.chemin).catch(() => false))) return { ouvert: false, motif: 'introuvable' };
        const pagePdf = demande.page ? pageDuPdf(livre, demande.page) : 1;
        return ouvrirDansLaFenetre(livre, pagePdf, BrowserWindow.fromWebContents(event.sender));
    });

    /** Le dialogue système, filtré sur les PDF, ouvert dans le dossier du livre actuel s'il y en a un. */
    ipcMain.handle('livres:choisir', async (_event, cheminActuel?: unknown): Promise<string | null> => {
        const { filePaths } = await dialog.showOpenDialog({
            title: 'Le PDF du livre',
            properties: ['openFile'],
            filters: [{ name: 'PDF', extensions: ['pdf'] }],
            ...(estUnPdf(cheminActuel) ? { defaultPath: path.dirname(cheminActuel.trim()) } : {}),
        });
        return filePaths?.[0] ?? null;
    });

    /** Le livre répond-il, et combien de pages a-t-il ? */
    ipcMain.handle('livres:verifier', async (_event, chemin: unknown): Promise<VerificationDuLivre> => {
        const lu = await lireLeLivre(chemin);
        if ('motif' in lu) return { repond: false, motif: lu.motif };
        try {
            const { total } = await lirePagesPdf(lu.donnees, () => []);
            return { repond: true, pages: total };
        } catch {
            return { repond: false, motif: 'illisible' };
        }
    });

    /**
     * Le décalage proposé, mesuré sur une quarantaine de pages réparties dans le livre : une
     * proposition, que le meneur retient ou non — jamais une écriture.
     */
    ipcMain.handle('livres:proposer-decalage', async (_event, chemin: unknown): Promise<PropositionDeDecalage> => {
        const lu = await lireLeLivre(chemin);
        if ('motif' in lu) return { trouve: false, motif: lu.motif };
        try {
            const { total, pages } = await lirePagesPdf(lu.donnees, n => pagesAEchantillonner(n, 60));
            const mesure = mesurerLeDecalage(pages, total);
            return mesure ? { trouve: true, mesure, pages: total } : { trouve: false, motif: 'rien-ne-se-degage' };
        } catch {
            return { trouve: false, motif: 'illisible' };
        }
    });
}
