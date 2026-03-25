import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export class GitBackupService {
  private projectPath: string;
  private isBusy: boolean = false;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Check if git is available and if the project is a repository.
   */
  async checkStatus() {
    try {
      await execAsync('git --version', { cwd: this.projectPath });
      const { stdout: status } = await execAsync('git status --short', { cwd: this.projectPath });
      const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: this.projectPath });
      
      return {
        available: true,
        isRepo: true,
        currentBranch: branch.trim(),
        hasChanges: status.length > 0
      };
    } catch (error: unknown) {
      return {
        available: false,
        isRepo: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Ensure the backup branch exists and is checked out.
   */
  async setupBackupBranch(branchName: string = 'data-sync') {
    if (this.isBusy) return { success: false, error: 'Une opération Git est déjà en cours.' };
    
    this.isBusy = true;
    try {
      const { stdout: branches } = await execAsync('git branch', { cwd: this.projectPath });
      if (!branches.includes(branchName)) {
        await execAsync(`git checkout --orphan ${branchName}`, { cwd: this.projectPath });
        // Clean the index for the new orphan branch
        await execAsync('git rm -r --cached . --quiet', { cwd: this.projectPath });
      } else {
        await execAsync(`git checkout ${branchName}`, { cwd: this.projectPath });
      }
      return { success: true, branch: branchName };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    } finally {
      this.isBusy = false;
    }
  }

  /**
   * Commit and push data from a specific directory.
   * This is now fully ASYNCHRONOUS and non-blocking.
   */
  async syncData(targetDir: string, branchName: string = 'data-sync', message: string = 'Automated GM-OS Backup') {
    if (this.isBusy) {
      console.warn('[GitSync] Sync already in progress, skipping.');
      return { success: false, error: 'Synchronisation déjà en cours.' };
    }

    this.isBusy = true;
    let originalBranch = '';
    
    try {
      const fullPath = path.resolve(this.projectPath, targetDir);
      if (!fs.existsSync(fullPath)) {
        return { success: false, error: `Le dossier ${targetDir} est introuvable.` };
      }

      // 1. Save current state
      const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: this.projectPath });
      originalBranch = branchOut.trim();

      // 2. Switch to backup branch if needed
      if (originalBranch !== branchName) {
        console.log(`[GitSync] Stashing changes on ${originalBranch} and switching to ${branchName}`);
        await execAsync('git stash', { cwd: this.projectPath });
        
        const { stdout: branches } = await execAsync('git branch', { cwd: this.projectPath });
        if (!branches.includes(branchName)) {
          await execAsync(`git checkout --orphan ${branchName}`, { cwd: this.projectPath });
          await execAsync('git rm -rf .', { cwd: this.projectPath });
        } else {
          await execAsync(`git checkout ${branchName}`, { cwd: this.projectPath });
          // Ensure index is clean so we only pick up targetDir
          try { await execAsync('git rm -r --cached . --quiet', { cwd: this.projectPath }); } catch { /* empty */ }
        }
      }

      // 3. Add, Commit, Push
      await execAsync(`git add "${targetDir}"`, { cwd: this.projectPath });
      const { stdout: status } = await execAsync('git status --porcelain', { cwd: this.projectPath });

      if (status.length > 0) {
        await execAsync(`git commit -m "${message}"`, { cwd: this.projectPath });
        console.log(`[GitSync] Pushing to origin ${branchName}...`);
        try {
          await execAsync(`git push origin ${branchName}`, { cwd: this.projectPath });
        } catch (pushError: unknown) {
          const stderr = (pushError as Error & { stderr?: string })?.stderr || String(pushError);
          console.error(`[GitSync] Push failed: ${stderr}`);
          // Return success but with warning if commit worked but push failed
          return { 
            success: true, 
            warning: `Sauvegarde locale OK, mais échec de l'envoi distant : ${stderr}`,
            timestamp: new Date().toISOString() 
          };
        }
      }

      return { success: true, timestamp: new Date().toISOString() };
    } catch (error: unknown) {
      console.error('[GitSync] Fatal error during sync:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    } finally {
      // 4. Cleanup: Always try to return to original branch
      if (originalBranch && originalBranch !== branchName) {
        try {
          await execAsync(`git checkout ${originalBranch}`, { cwd: this.projectPath });
          try { 
            const { stdout: stashList } = await execAsync('git stash list', { cwd: this.projectPath });
            if (stashList.includes('WIP on')) {
              await execAsync('git stash pop', { cwd: this.projectPath }); 
            }
          } catch { /* ignore if no stash found */ }
          
          console.log(`[GitSync] Successfully returned to ${originalBranch}`);
        } catch (cleanupErr) {
          console.error('[GitSync] CRITICAL: Stuck on backup branch!', cleanupErr);
          // In a real app, we might want to notify the UI via an IPC event here
        }
      }
      this.isBusy = false;
    }
  }
}
