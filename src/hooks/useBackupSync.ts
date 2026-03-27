import { useState, useCallback } from 'react';

/**
 * [DISABLED] useBackupSync Hook
 * This functionality has been completely disabled and removed at the user's request.
 * It remains as a shell to avoid breaking components that might still import it.
 */
export const useBackupSync = () => {
  const [lastSync] = useState<number>(Date.now());
  const [isSyncing] = useState<boolean>(false);

  const performSync = useCallback(async (_force: boolean = false) => {
    console.warn('[BackupSync] Automated backup is DISABLED.');
    return { success: false, error: 'Backup system is disabled' };
  }, []);

  return {
    syncNow: () => performSync(true),
    isSyncing,
    lastSync
  };
};
