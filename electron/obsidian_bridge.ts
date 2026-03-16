import { ipcMain } from 'electron';
import path from 'node:path';
import fs from 'fs-extra';

/**
 * Obsidian Bridge
 * Handles secure file access to the Obsidian Vault.
 */

const DEFAULT_VAULT_PATH = 'C:\\Users\\david\\OneDrive\\Obsidian Vault';

interface NoteEntry {
    name: string;
    path: string; // Relative path to vault root
    type: 'file' | 'directory';
    children?: NoteEntry[];
}

export function registerObsidianHandlers() {
    console.log('[Obsidian Bridge] Registering IPC Handlers');

    ipcMain.handle('obsidian:list-notes', async (_event, vaultPath?: string) => {
        const rootPath = vaultPath || DEFAULT_VAULT_PATH;
        
        if (!(await fs.pathExists(rootPath))) {
            console.error(`[Obsidian Bridge] Vault path not found: ${rootPath}`);
            return [];
        }

        async function getNotes(dir: string): Promise<NoteEntry[]> {
            const items = await fs.readdir(dir, { withFileTypes: true });
            const result = await Promise.all(items.map(async item => {
                const fullPath = path.join(dir, item.name);
                const relativePath = path.relative(rootPath, fullPath);
                
                // Skip hidden folders like .obsidian
                if (item.name.startsWith('.')) return null;

                if (item.isDirectory()) {
                    const children = await getNotes(fullPath);
                    // Only return directory if it has markdown files or subdirectories with markdown files
                    if (children.length === 0) return null;
                    
                    return {
                        name: item.name,
                        path: relativePath,
                        type: 'directory',
                        children: children
                    } as NoteEntry;
                }
                
                if (item.name.toLowerCase().endsWith('.md')) {
                    return {
                        name: item.name,
                        path: relativePath,
                        type: 'file'
                    } as NoteEntry;
                }
                
                return null;
            }));
            
            return result.filter((r): r is NoteEntry => r !== null);
        }

        try {
            return await getNotes(rootPath);
        } catch (error) {
            console.error('[Obsidian Bridge] Error listing notes:', error);
            return [];
        }
    });

    ipcMain.handle('obsidian:read-note', async (_event, relativePath: string, vaultPath?: string) => {
        const rootPath = vaultPath || DEFAULT_VAULT_PATH;
        const fullPath = path.join(rootPath, relativePath);

        // Security check: ensure the path is inside the vault
        if (!fullPath.startsWith(rootPath)) {
            console.error(`[Obsidian Bridge] Security Violation: Attempted to read outside vault: ${fullPath}`);
            return null;
        }

        if (!(await fs.pathExists(fullPath))) {
            console.error(`[Obsidian Bridge] Note not found: ${fullPath}`);
            return null;
        }

        try {
            return await fs.readFile(fullPath, 'utf-8');
        } catch (error) {
            console.error('[Obsidian Bridge] Error reading note:', error);
            return null;
        }
    });

    ipcMain.handle('obsidian:write-note', async (_event, relativePath: string, content: string, vaultPath?: string) => {
        const rootPath = vaultPath || DEFAULT_VAULT_PATH;
        const fullPath = path.join(rootPath, relativePath);

        // Security check
        if (!fullPath.startsWith(rootPath)) {
            console.error(`[Obsidian Bridge] Security Violation: Attempted to write outside vault: ${fullPath}`);
            return false;
        }

        try {
            await fs.ensureDir(path.dirname(fullPath));
            await fs.writeFile(fullPath, content, 'utf-8');
            return true;
        } catch (error) {
            console.error('[Obsidian Bridge] Error writing note:', error);
            return false;
        }
    });

    ipcMain.handle('obsidian:ensure-directory', async (_event, relativePath: string, vaultPath?: string) => {
        const rootPath = vaultPath || DEFAULT_VAULT_PATH;
        const fullPath = path.join(rootPath, relativePath);

        // Security check
        if (!fullPath.startsWith(rootPath)) {
            console.error(`[Obsidian Bridge] Security Violation: Attempted to create directory outside vault: ${fullPath}`);
            return false;
        }

        try {
            await fs.ensureDir(fullPath);
            return true;
        } catch (error) {
            console.error('[Obsidian Bridge] Error creating directory:', error);
            return false;
        }
    });
}
