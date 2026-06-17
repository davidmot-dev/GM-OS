import { safeStorage, app, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';

/**
 * Service central pour la gestion sécurisée des secrets (clés API, tokens).
 * Utilise Electron safeStorage pour chiffrer les données de manière native.
 */
export class SecurityManager {
    private secretsPath: string;
    private secrets: Record<string, string> = {};

    constructor() {
        // Stockage dans le dossier AppData de l'utilisateur
        this.secretsPath = path.join(app.getPath('userData'), 'vault', 'secrets.enc');
        this.ensureStoreExists();
        this.loadSecrets();
    }

    /**
     * Garantit que le dossier du coffre-fort existe.
     */
    private ensureStoreExists() {
        const dir = path.dirname(this.secretsPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirpSync(dir);
        }
    }

    /**
     * Charge et déchiffre les secrets depuis le disque.
     */
    private loadSecrets() {
        if (!fs.existsSync(this.secretsPath)) {
            this.secrets = {};
            return;
        }

        try {
            const encryptedData = fs.readFileSync(this.secretsPath);
            if (encryptedData.length === 0) {
                this.secrets = {};
                return;
            }

            if (safeStorage.isEncryptionAvailable()) {
                try {
                    const decryptedData = safeStorage.decryptString(encryptedData);
                    this.secrets = JSON.parse(decryptedData);
                } catch (decErr) {
                    // Try fallback if decryption fails (might have been saved as base64)
                    const decoded = Buffer.from(encryptedData.toString('utf-8'), 'base64').toString('utf-8');
                    this.secrets = JSON.parse(decoded);
                }
            } else {
                console.warn('[SecurityManager] Encryption not available on this system. Using Base64 fallback.');
                const decoded = Buffer.from(encryptedData.toString('utf-8'), 'base64').toString('utf-8');
                this.secrets = JSON.parse(decoded);
            }
        } catch (error) {
            console.error('[SecurityManager] Failed to load or decrypt secrets:', error);
            this.secrets = {};
        }
    }

    /**
     * Chiffre et sauvegarde les secrets sur le disque.
     */
    private saveSecrets() {
        try {
            const dataString = JSON.stringify(this.secrets);
            if (safeStorage.isEncryptionAvailable()) {
                const encryptedBuffer = safeStorage.encryptString(dataString);
                fs.writeFileSync(this.secretsPath, encryptedBuffer);
            } else {
                console.warn('[SecurityManager] Encryption not available. Saving via Base64 fallback.');
                const fallbackBuffer = Buffer.from(dataString, 'utf-8').toString('base64');
                fs.writeFileSync(this.secretsPath, fallbackBuffer);
            }
        } catch (error) {
            console.error('[SecurityManager] Failed to encrypt or save secrets:', error);
        }
    }

    /**
     * Enregistre un secret de manière sécurisée.
     */
    public setSecret(id: string, value: string) {
        this.secrets[id] = value;
        this.saveSecrets();
    }

    /**
     * Récupère un secret déchiffré.
     */
    public getSecret(id: string): string | null {
        return this.secrets[id] || null;
    }

    /**
     * Supprime un secret.
     */
    public deleteSecret(id: string) {
        if (this.secrets[id]) {
            delete this.secrets[id];
            this.saveSecrets();
        }
    }
}

/**
 * Enregistre les handlers IPC pour le bridge de sécurité.
 */
export function registerSecurityHandlers() {
    const manager = new SecurityManager();

    ipcMain.handle('security:get-secret', (_, id: string) => {
        return manager.getSecret(id);
    });

    ipcMain.handle('security:set-secret', (_, id: string, value: string) => {
        manager.setSecret(id, value);
        return true;
    });

    ipcMain.handle('security:delete-secret', (_, id: string) => {
        manager.deleteSecret(id);
        return true;
    });
}
