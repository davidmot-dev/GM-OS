import { app, ipcMain } from 'electron';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'fs-extra';
import { auditNotice } from './auditLog';

/**
 * Secret d'appairage du poste MJ.
 *
 * Le SyncServer écoute sur 0.0.0.0 et distribue deux flux : un flux caviardé pour
 * les joueurs, et un flux brut (notes privées, secrets de PNJ) pour les rôles
 * privilégiés. Sans secret partagé, n'importe qui sur le réseau local peut
 * réclamer un rôle privilégié — il suffit de l'écrire dans le message.
 *
 * Le secret est persistant : un appareil appairé le reste d'une partie à l'autre.
 * `rotate()` le régénère et invalide tous les appairages existants.
 */
class PairingManager {
    private secret: string | null = null;
    private storeFile: string | null = null;

    private get file(): string {
        if (!this.storeFile) {
            this.storeFile = path.join(app.getPath('userData'), 'pairing.json');
        }
        return this.storeFile;
    }

    /** Le secret courant, généré au premier appel. */
    public getSecret(): string {
        if (this.secret) return this.secret;

        try {
            if (fs.existsSync(this.file)) {
                const raw = fs.readJsonSync(this.file);
                if (raw && typeof raw.secret === 'string' && raw.secret.length >= 32) {
                    this.secret = raw.secret;
                    return this.secret!;
                }
            }
        } catch (err) {
            console.warn('[Pairing] Lecture de pairing.json impossible, régénération:', err);
        }

        return this.rotate();
    }

    /** Régénère le secret : tous les appareils appairés devront re-scanner le QR. */
    public rotate(): string {
        this.secret = crypto.randomBytes(32).toString('hex');
        try {
            fs.outputJsonSync(this.file, { secret: this.secret, createdAt: Date.now() }, { spaces: 2 });
        } catch (err) {
            // Secret en mémoire uniquement : l'appairage vaudra pour cette session.
            console.error('[Pairing] Écriture de pairing.json impossible:', err);
        }
        auditNotice('Nouveau secret d\'appairage généré : tous les appareils doivent re-scanner le QR code');
        return this.secret;
    }

    /**
     * Compare en temps constant. Un `===` fuirait la longueur du préfixe correct,
     * ce qui suffit à reconstruire le secret octet par octet.
     */
    public verify(token: unknown): boolean {
        if (typeof token !== 'string' || token.length === 0) return false;

        const expected = Buffer.from(this.getSecret(), 'utf8');
        const provided = Buffer.from(token, 'utf8');
        // timingSafeEqual exige des longueurs égales : on compare d'abord une
        // empreinte de taille fixe pour ne pas repasser par un test de longueur.
        const hash = (b: Buffer) => crypto.createHash('sha256').update(b).digest();
        return crypto.timingSafeEqual(hash(expected), hash(provided));
    }
}

export const pairingManager = new PairingManager();

export function registerPairingHandlers() {
    // Réservé au renderer du poste MJ : c'est lui qui affiche le QR d'appairage.
    ipcMain.handle('pairing:get-secret', () => pairingManager.getSecret());

    ipcMain.handle('pairing:rotate', () => pairingManager.rotate());
}
