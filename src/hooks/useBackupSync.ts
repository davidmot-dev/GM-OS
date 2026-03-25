import { useEffect, useState, useCallback, useRef } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { useNPCStore } from '../modules/npc/useNPCStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useAudioMasterStore } from '../stores/useAudioMasterStore';
import { gmToast } from '../stores/useToastStore';

const BACKUP_INTERVAL = 1000 * 60 * 15; // Every 15 minutes
const BACKUP_BRANCH = 'data-sync';
const BACKUP_DIR = 'backups';

export const useBackupSync = () => {
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const isSyncingRef = useRef(false);

  const performSync = useCallback(async (force: boolean = false) => {
    if (isSyncingRef.current && !force) return;
    
    try {
      isSyncingRef.current = true;
      setIsSyncing(true);
      console.log('[BackupSync] Starting asynchronous automated backup...');

      // 1. Prepare Data - Optimized: Gather only on demand
      const dataToBackup = {
        session_settings: useSessionStore.getState().getBackupData(),
        npcs: useNPCStore.getState().getBackupData(),
        campaigns: useSessionOSStore.getState().getBackupData(),
        audio_master: useAudioMasterStore.getState().getBackupData(),
        metadata: {
          timestamp: new Date().toISOString(),
          version: 'v5.1.2-ALPHA'
        }
      };

      // 2. Save to Disk (JSON files in /backups)
      const saveResult = await window.appBridge?.git?.saveData(dataToBackup);
      if (!saveResult?.success) {
        throw new Error(`Failed to save data: ${saveResult?.error || 'Unknown error'}`);
      }

      // 3. Git Sync (Async Branch + Commit + Push)
      // This call no longer blocks the Electron main process.
      const syncResult = await window.appBridge?.git?.syncData(
        BACKUP_DIR, 
        BACKUP_BRANCH, 
        `GM-OS Auto-Backup: ${new Date().toLocaleString()}`
      ) as { success: boolean, timestamp?: string, error?: string, warning?: string };
      
      if (syncResult?.success) {
        if (syncResult.warning) {
          console.warn('[BackupSync] Local backup OK but remote failed:', syncResult.warning);
        } else {
          console.log('[BackupSync] Async backup completed successfully at:', syncResult.timestamp);
        }
        setLastSync(Date.now());
      } else {
        throw new Error(syncResult?.error || 'Git synchronization failed');
      }
    } catch (error) {
      console.error('[BackupSync] Fatal backup error:', error);
      gmToast("Auto-Backup: Échec de la synchronisation Git", "error");
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, []); // Empty dependency array! Callback is stable.

  useEffect(() => {
    let interval: any; // Using any here to avoid browser/node conflict in types

    const initGit = async () => {
      try {
        const status = await window.appBridge?.git?.getStatus();
        if (status?.available && status?.isRepo) {
          await window.appBridge?.git?.setupBranch(BACKUP_BRANCH);
          performSync(); // Initial sync on mount
        }
      } catch (err) {
        console.warn('[BackupSync] Git initialization skipped:', err);
      }
    };

    initGit();

    interval = setInterval(() => {
      performSync();
    }, BACKUP_INTERVAL);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [performSync]);

  return {
    syncNow: () => performSync(true),
    isSyncing,
    lastSync
  };
};
