/**
 * SessionBackupManager
 * 
 * Orchestrates the 15-minute automatic background backup system.
 * Only active in Electron environments.
 */

import { SessionService } from '../../../store/SessionService';
import { useSessionOSStore } from '../useSessionOSStore';
import { Logger } from '../../../utils/logger';

class SessionBackupManager {
    private static instance: SessionBackupManager;
    private timer: ReturnType<typeof setInterval> | null = null;
    private readonly INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
    private readonly IS_AUTO_BACKUP_ENABLED = false; // Désactivé à la demande de l'utilisateur

    public static getInstance(): SessionBackupManager {
        if (!SessionBackupManager.instance) {
            SessionBackupManager.instance = new SessionBackupManager();
        }
        return SessionBackupManager.instance;
    }

    /**
     * Starts the automatic backup cycle.
     */
    public start() {
        if (!this.IS_AUTO_BACKUP_ENABLED) {
            Logger.info('[BackupManager] Auto-backup is disabled by configuration');
            return;
        }

        if (this.timer) {
            Logger.info('[BackupManager] Already started');
            return;
        }

        if (!window.appBridge?.session?.saveSession) {
            Logger.warn('[BackupManager] Auto-backup disabled: Bridge not available (Tablet/Browser)');
            return;
        }

        Logger.info(`[BackupManager] Starting auto-backup cycle (Every 15 minutes)`);
        
        // Setup the interval
        this.timer = setInterval(() => {
            this.performBackup(true);
        }, this.INTERVAL_MS);
    }

    /**
     * Stops the automatic backup cycle.
     */
    public stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            Logger.info('[BackupManager] Stopped');
        }
    }

    /**
     * Performs a backup.
     * @param silent If true, no toast will be shown.
     */
    public async performBackup(silent = false) {
        try {
            Logger.info('[BackupManager] Triggering background backup...');
            await SessionService.saveFullSession(silent);
            
            // Update the last backup timestamp in the store
            const timestamp = new Date().toISOString();
            useSessionOSStore.getState().setLastBackupAt(timestamp);
            
            if (!silent) {
                Logger.info(`[BackupManager] Backup completed at ${timestamp}`);
            }
        } catch (error) {
            Logger.error('[BackupManager] Backup failed', error);
        }
    }

    /**
     * Trigger a mandatory backup immediately (e.g. before deleting a campaign).
     */
    public async triggerImmediateBackup() {
        Logger.info('[BackupManager] Triggering immediate safety backup');
        await this.performBackup(false);
    }
}

export const sessionBackupManager = SessionBackupManager.getInstance();
