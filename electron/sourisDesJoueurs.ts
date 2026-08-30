import { ipcMain, app } from 'electron';
import { spawn } from 'node:child_process';
import net from 'node:net';
import crypto from 'node:crypto';
import log from 'electron-log';

/**
 * **Le verrou de la souris des joueurs.**
 *
 * Demandé par David le 2026-08-30. Windows fusionne toutes les souris en un seul
 * curseur, et ça lui convient : ce qu'il veut, c'est pouvoir **couper** celle des
 * joueurs quand il prépare, et la rendre quand ils jouent. Il n'existe pas de
 * demi-mesure — Windows ne sait pas ignorer une souris, il sait seulement
 * désactiver le périphérique.
 *
 * ## Les deux dangers, et ce qui les tient
 *
 * **1. Se couper sa propre souris.** Mesuré chez David le 2026-08-30 : ses deux
 * souris s'appellent **toutes les deux « Souris HID »**. Une liste déroulante
 * lui ferait jouer à pile ou face avec son propre curseur. D'où
 * `MAINTIEN_AVANT_RETOUR` : **toute coupure se rend d'elle-même** si personne
 * ne la confirme. Se tromper coûte vingt secondes, pas une séance.
 *
 * *Un bouton dont l'erreur ne se rattrape qu'à la souris ne peut pas être
 * confirmé à la souris.*
 *
 * **2. Ne plus avoir aucune souris.** `peutEtreCoupee` refuse la dernière
 * active. Ce n'est pas une politesse : c'est le seul cas où le retour
 * automatique lui-même serait inatteignable, puisqu'il faudrait cliquer pour
 * relancer l'application.
 *
 * ## Pourquoi une aide élévée qui vit toute la session
 *
 * `Disable-PnpDevice` exige les droits administrateur, et GM-OS ne les a pas
 * (vérifié). Deux voies :
 *
 * - une élévation **par bascule** — donc une fenêtre UAC à chaque clic, et
 *   surtout **une fenêtre UAC pour le retour automatique**, qu'il faudrait
 *   valider… sans souris. *La sécurité serait alors gardée par la panne qu'elle
 *   doit réparer.*
 * - une aide élevée **une seule fois**, qui écoute ensuite sur un tuyau nommé :
 *   une seule fenêtre UAC par session, et le retour automatique ne demande plus
 *   rien à personne. C'est celle-ci.
 *
 * L'aide **revalide de son côté** que l'identifiant désigne bien une souris :
 * elle est élevée, celui qui lui parle ne l'est pas, et *un processus privilégié
 * qui fait confiance à son appelant n'est plus une frontière.*
 *
 * Rien n'est laissé sur la machine : pas de tâche planifiée, pas de service, pas
 * de fichier — le script part en `-EncodedCommand`. Fermer GM-OS rend toutes les
 * souris coupées.
 */

/** Combien de temps une coupure tient sans être confirmée, avant de se rendre. */
const MAINTIEN_AVANT_RETOUR = 20_000;

export interface Souris {
    id: string;
    nom: string;
    active: boolean;
}

/**
 * Lit l'inventaire rendu par `Get-PnpDevice -Class Mouse … | ConvertTo-Json`.
 *
 * **PowerShell rend un objet nu quand il n'y a qu'un élément**, et un tableau
 * au-delà : un `JSON.parse(...)` suivi d'un `.map` plante donc exactement sur
 * la machine qui n'a qu'une souris — celle où le verrou n'a aucun intérêt, mais
 * où l'écran des réglages s'ouvre quand même.
 *
 * Un périphérique absent (`Present: false`) est une souris débranchée dont
 * Windows garde le souvenir : l'afficher proposerait de couper un objet qui
 * n'est pas là.
 */
export function lireLInventaire(sortie: string): Souris[] {
    if (!sortie.trim()) return [];

    let brut: unknown;
    try {
        brut = JSON.parse(sortie);
    } catch {
        return [];
    }

    const lignes = Array.isArray(brut) ? brut : [brut];

    return lignes
        .filter((l): l is Record<string, unknown> => !!l && typeof l === 'object')
        .filter(l => l.Present !== false)
        .filter(l => typeof l.InstanceId === 'string' && l.InstanceId !== '')
        .map(l => ({
            id: String(l.InstanceId),
            nom: typeof l.FriendlyName === 'string' && l.FriendlyName ? l.FriendlyName : 'Souris',
            // Windows dit `OK` pour un périphérique qui fonctionne ; désactivé,
            // il passe à `Error` (code 22) ou `Unknown`. On ne retient que `OK`
            // plutôt que d'énumérer les façons d'être en panne.
            active: l.Status === 'OK',
        }));
}

/**
 * Peut-on couper cette souris ?
 *
 * **La dernière active ne se coupe jamais.** Sans souris du tout, le retour
 * automatique reste bien armé, mais plus rien ne permet d'attendre vingt
 * secondes devant un écran où l'on ne peut plus rien faire — et le meneur, lui,
 * ne sait pas que ça va revenir.
 */
export function peutEtreCoupee(id: string, inventaire: Souris[]): { possible: boolean; raison?: string } {
    const visee = inventaire.find(s => s.id === id);
    if (!visee) return { possible: false, raison: 'Cette souris n’est plus branchée.' };
    if (!visee.active) return { possible: false, raison: 'Cette souris est déjà coupée.' };

    const actives = inventaire.filter(s => s.active).length;
    if (actives <= 1) {
        return { possible: false, raison: 'C’est la seule souris active : la couper te laisserait sans curseur.' };
    }
    return { possible: true };
}

// ─────────────────────────────────────────────
// L'aide élevée
// ─────────────────────────────────────────────

/**
 * Le script qui tourne **du côté élevé**.
 *
 * Il revalide l'identifiant contre la classe `Mouse` avant d'agir : il est
 * administrateur, GM-OS ne l'est pas, et la liste des souris est le seul
 * périmètre qu'il accepte.
 *
 * ⚠ **Le nom du tuyau est écrit DANS le script, et ce n'est pas un détail.**
 * Première version : `param([string]$Tuyau)` et `-Tuyau <nom>` passé après
 * `-EncodedCommand`. Ça ne marche pas — `-EncodedCommand` exécute une
 * *commande*, pas un script paramétrable, et **rien ne peut le suivre**. L'aide
 * démarrait donc avec un tuyau vide et mourait à la seconde, en laissant
 * l'écran sur « L'aide administrateur ne s'est pas connectée » (signalé par
 * David le 2026-08-30). Éprouvé sans élévation avant d'être réécrit.
 */
export function scriptDeLAide(nomDuTuyau: string): string {
    return `
$Tuyau = '${nomDuTuyau}'
$flux = New-Object System.IO.Pipes.NamedPipeClientStream('.', $Tuyau, [System.IO.Pipes.PipeDirection]::InOut)
$flux.Connect(15000)
$lecteur = New-Object System.IO.StreamReader($flux)
$ecrivain = New-Object System.IO.StreamWriter($flux)
$ecrivain.AutoFlush = $true
while (($ligne = $lecteur.ReadLine()) -ne $null) {
  try {
    $ordre = $ligne | ConvertFrom-Json
    $souris = Get-PnpDevice -Class Mouse | Where-Object { $_.InstanceId -eq $ordre.id }
    if (-not $souris) { $ecrivain.WriteLine('{"ok":false,"message":"identifiant hors de la classe Mouse"}'); continue }
    if ($ordre.action -eq 'couper') { Disable-PnpDevice -InstanceId $ordre.id -Confirm:$false -ErrorAction Stop }
    elseif ($ordre.action -eq 'activer') { Enable-PnpDevice -InstanceId $ordre.id -Confirm:$false -ErrorAction Stop }
    else { $ecrivain.WriteLine('{"ok":false,"message":"action inconnue"}'); continue }
    $ecrivain.WriteLine('{"ok":true}')
  } catch {
    $m = $_.Exception.Message -replace '"', "'"
    $ecrivain.WriteLine('{"ok":false,"message":"' + $m + '"}')
  }
}
`;
}

/**
 * La ligne qui lance l'aide élevée.
 *
 * **`-EncodedCommand` est en dernier, et rien ne le suit** — c'est la règle que
 * la première version avait enfreinte. Le script porte déjà tout ce qu'il lui
 * faut, donc il n'y a plus rien à passer après.
 */
export function lancementDeLAide(nomDuTuyau: string): string {
    const encode = Buffer.from(scriptDeLAide(nomDuTuyau), 'utf16le').toString('base64');
    return 'Start-Process powershell.exe -Verb RunAs -WindowStyle Hidden -ArgumentList '
        + `'-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand','${encode}'`;
}

let aide: net.Socket | null = null;
let serveur: net.Server | null = null;

/** Les souris que NOUS avons coupées — les seules qu'on se permet de rendre. */
const coupeesParNous = new Set<string>();
/** Le retour automatique en attente, par souris. */
const retours = new Map<string, NodeJS.Timeout>();

function powershell(args: string[]): Promise<{ code: number; sortie: string; erreur: string }> {
    return new Promise(resolve => {
        const p = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', ...args], { windowsHide: true });
        let sortie = '';
        let erreur = '';
        p.stdout.on('data', d => { sortie += d.toString(); });
        p.stderr.on('data', d => { erreur += d.toString(); });
        p.on('error', e => resolve({ code: -1, sortie: '', erreur: e.message }));
        p.on('close', code => resolve({ code: code ?? -1, sortie, erreur }));
    });
}

export async function inventaireDesSouris(): Promise<Souris[]> {
    const { sortie } = await powershell([
        '-Command',
        'Get-PnpDevice -Class Mouse | Select-Object Status,FriendlyName,InstanceId,Present | ConvertTo-Json -Compress',
    ]);
    return lireLInventaire(sortie);
}

/**
 * Ouvre l'aide élevée si elle ne l'est pas déjà. **Une fenêtre UAC par session.**
 */
async function ouvrirLAide(): Promise<{ prete: boolean; raison?: string }> {
    if (aide && !aide.destroyed) return { prete: true };

    const nom = `gmos-souris-${crypto.randomBytes(8).toString('hex')}`;

    const attente = new Promise<net.Socket | null>(resolve => {
        let repondu = false;
        serveur = net.createServer(socket => {
            if (repondu) return;
            repondu = true;
            resolve(socket);
        });
        serveur.listen(`\\\\.\\pipe\\${nom}`);
        // L'UAC peut être refusée : sans délai, l'attente ne finirait jamais et
        // l'écran resterait sur « en cours » pour toujours.
        setTimeout(() => { if (!repondu) { repondu = true; resolve(null); } }, 30_000);
    });

    const { code, erreur } = await powershell(['-Command', lancementDeLAide(nom)]);
    if (code !== 0) {
        serveur?.close();
        serveur = null;
        log.warn('[Souris]', `élévation refusée (code ${code}) : ${erreur.trim()}`);
        return { prete: false, raison: erreur.trim() || 'L’élévation a été refusée.' };
    }

    const socket = await attente;
    if (!socket) {
        serveur?.close();
        serveur = null;
        // Le processus élevé a démarré et n'a pas joint le tuyau : c'est le
        // script lui-même qui a échoué, pas l'autorisation. On le dit, sinon la
        // prochaine panne ressemblera à un refus d'UAC.
        log.warn('[Souris]', `aide lancée mais jamais connectée au tuyau ${nom}`);
        return { prete: false, raison: 'L’aide administrateur a démarré mais n’a pas répondu (voir main.log).' };
    }

    aide = socket;
    socket.on('close', () => { aide = null; });
    return { prete: true };
}

function demanderALAide(action: 'couper' | 'activer', id: string): Promise<{ ok: boolean; message?: string }> {
    return new Promise(resolve => {
        if (!aide || aide.destroyed) return resolve({ ok: false, message: 'Aide administrateur absente.' });

        const surReponse = (d: Buffer) => {
            aide?.off('data', surReponse);
            try {
                resolve(JSON.parse(d.toString().trim().split(/\r?\n/)[0]));
            } catch {
                resolve({ ok: false, message: 'Réponse illisible de l’aide.' });
            }
        };
        aide.on('data', surReponse);
        aide.write(`${JSON.stringify({ action, id })}\n`);
        setTimeout(() => {
            aide?.off('data', surReponse);
            resolve({ ok: false, message: 'L’aide n’a pas répondu.' });
        }, 15_000);
    });
}

/** Rend une souris que nous avions coupée, et désarme son retour. */
async function rendreLaSouris(id: string): Promise<{ ok: boolean; message?: string }> {
    const minuteur = retours.get(id);
    if (minuteur) { clearTimeout(minuteur); retours.delete(id); }

    const verdict = await demanderALAide('activer', id);
    if (verdict.ok) coupeesParNous.delete(id);
    else log.warn('[Souris]', `retour impossible pour ${id} : ${verdict.message}`);
    return verdict;
}

export function registerSourisHandlers() {
    ipcMain.handle('souris:inventaire', async () => inventaireDesSouris());

    ipcMain.handle('souris:couper', async (_e, id: string) => {
        const inventaire = await inventaireDesSouris();
        const verdict = peutEtreCoupee(id, inventaire);
        if (!verdict.possible) return { ok: false, message: verdict.raison };

        const ouverte = await ouvrirLAide();
        if (!ouverte.prete) return { ok: false, message: ouverte.raison };

        const reponse = await demanderALAide('couper', id);
        if (!reponse.ok) return reponse;

        coupeesParNous.add(id);

        /*
          **Le retour automatique s'arme AVEC la coupure, pas après.** C'est la
          seule sécurité qui vaille ici : si le meneur vient de couper sa propre
          souris, il ne peut plus rien cliquer — donc rien de ce qu'il pourrait
          faire ne doit être nécessaire pour revenir en arrière.
        */
        retours.set(id, setTimeout(() => {
            log.info('[Souris]', `retour automatique : ${id} n’a pas été confirmée`);
            void rendreLaSouris(id);
        }, MAINTIEN_AVANT_RETOUR));

        return { ok: true, retourDans: MAINTIEN_AVANT_RETOUR };
    });

    /** « Oui, c'était la bonne » — le meneur a encore sa souris pour le dire. */
    ipcMain.handle('souris:confirmer', async (_e, id: string) => {
        const minuteur = retours.get(id);
        if (minuteur) { clearTimeout(minuteur); retours.delete(id); }
        return { ok: true };
    });

    ipcMain.handle('souris:rendre', async (_e, id: string) => {
        const ouverte = await ouvrirLAide();
        if (!ouverte.prete) return { ok: false, message: ouverte.raison };
        return rendreLaSouris(id);
    });

    /*
      **Fermer GM-OS rend tout.** Un périphérique désactivé le reste après
      l'extinction de l'application qui l'a coupé : le meneur retrouverait une
      souris morte au prochain démarrage, sans rien pour relier les deux.
    */
    app.on('before-quit', () => {
        for (const id of [...coupeesParNous]) void rendreLaSouris(id);
    });
}
