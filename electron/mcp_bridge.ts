import { ipcMain, BrowserWindow } from 'electron';
import {
    ligneServeur,
    detailArguments,
    evenementRequete,
    evenementReponse,
    evenementServeur,
    evenementErreur,
    type EvenementMcp,
} from './mcpActivity';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MCP Bridge - Chemins dynamiques pour la portabilité
 */

const USER_HOME = process.env.USERPROFILE || process.env.HOME || '';

const DEBUG_LOG_PATH = path.join(USER_HOME, 'mcp_bridge_debug.log');

/**
 * Serveur MCP : `notebooklm-mcp-cli`, qui vise Gemini Notebook.
 *
 * Le paquet précédent, `notebooklm-mcp`, était figé sur `notebooklm.google.com`
 * — domaine que Google a quitté en migrant NotebookLM vers Gemini Notebook, sur
 * `notebook.google.com`. Son test de connexion cherchait l'ancien domaine dans
 * l'URL courante, condition devenue impossible à satisfaire : l'authentification
 * expirait indéfiniment, quel que soit le nombre de reconnexions. Sa dernière
 * version publiée datait de septembre 2025 ; aucun correctif n'était à attendre.
 *
 * Les noms d'outils sont identiques d'un paquet à l'autre — `notebook_list`,
 * `notebook_query`, `chat_configure`, `refresh_auth` — à une exception près,
 * `notebook_add_text`, devenu `source_add`.
 */

/**
 * Interpréteur Python hébergeant le serveur.
 *
 * `python` seul ne convient pas sur Windows : le PATH le résout couramment vers
 * le relais du Microsoft Store (`WindowsApps\python.exe`), qui n'est pas
 * l'installation où le paquet a été déposé — le serveur resterait introuvable
 * sans le moindre message clair.
 *
 * Ordre : la variable d'environnement, puis les installations officielles
 * trouvées sous `%LOCALAPPDATA%\Python`, puis le PATH en dernier recours.
 */
function resolvePythonExe(): string {
    if (process.env.GMOS_PYTHON) return process.env.GMOS_PYTHON;

    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
        const pythonRoot = path.join(localAppData, 'Python');
        try {
            for (const entry of fs.readdirSync(pythonRoot)) {
                const candidate = path.join(pythonRoot, entry, 'python.exe');
                if (fs.existsSync(candidate)) return candidate;
            }
        } catch {
            // Répertoire absent : on retombe sur le PATH.
        }
    }

    return 'python';
}

const PYTHON_EXE = resolvePythonExe();

/** Serveur MCP, lancé comme module pour ne dépendre d'aucun chemin de script. */
const MCP_SERVER_MODULE = 'notebooklm_tools.mcp.server';

/** CLI du même paquet, qui porte la ré-authentification. */
const MCP_CLI_MODULE = 'notebooklm_tools.cli.main';

/**
 * Diffuse un événement d'activité à toutes les fenêtres.
 *
 * `registerMcpHandlers()` s'exécute au chargement du module, **avant** que la
 * fenêtre principale n'existe : on ne peut pas lui passer une référence à la
 * construction. La diffusion résout le problème sans introduire de dépendance
 * d'ordre de démarrage, et le coût est nul — il n'y a qu'une poignée de
 * fenêtres, dont les vidéoprojections qui ignorent simplement le canal.
 *
 * Ne doit jamais faire échouer un appel MCP : le journal est un confort, la
 * requête est le travail.
 */
function emettreActivite(evenement: EvenementMcp) {
    try {
        for (const fenetre of BrowserWindow.getAllWindows()) {
            if (!fenetre.isDestroyed()) fenetre.webContents.send('mcp:activity', evenement);
        }
    } catch {
        // Une fenêtre en cours de destruction ne doit pas casser une génération.
    }
}

function logToDebugFile(msg: string) {
    try {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(DEBUG_LOG_PATH, `[${timestamp}] ${msg}\n`);
    } catch (err) {
        console.error('Failed to write to debug log:', err);
    }
}

// Clear log at startup
try { 
    if (process.type === 'browser') {
        fs.writeFileSync(DEBUG_LOG_PATH, '--- MCP Bridge Started ---\n'); 
    }
} catch (err) {
    console.error('Failed to initialize debug log:', err);
}

let mcpProcess: ChildProcess | null = null;
let requestId = 1;
const pendingRequests = new Map<number, { resolve: (val: unknown) => void; reject: (err: unknown) => void; method: string; timeout: NodeJS.Timeout; debut: number }>();
let stdoutBuffer = '';
// Singleton promise for spawning the server
let serverSpawnPromise: Promise<ChildProcess> | null = null;
// Queue for requests that arrive during initialization
let initializationPromise: Promise<void> | null = null;
let isInitialized = false;

async function ensureHandshake() {
    if (isInitialized) return;
    
    if (initializationPromise) {
        logToDebugFile('Waiting for existing initialization to complete...');
        return initializationPromise;
    }

    initializationPromise = (async () => {
        try {
            logToDebugFile('Performing initialize handshake...');
            await callMcp('initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {
                    sampling: {},
                    roots: { listChanged: false }
                },
                clientInfo: { name: 'gm-os', version: '1.0.0' }
            });
            
            logToDebugFile('Sending notifications/initialized...');
            const serverProcess = await ensureMcpServer();
            const notify = JSON.stringify({
                jsonrpc: '2.0',
                method: 'notifications/initialized'
            }) + '\n';
            serverProcess.stdin?.write(notify);
            
            // Give the server a small window to process the notification
            logToDebugFile('Handshake: Waiting 200ms for server state to stabilize...');
            await new Promise(resolve => setTimeout(resolve, 200));
            
            isInitialized = true;
            logToDebugFile('Handshake SUCCESS');
        } catch (error) {
            logToDebugFile(`Handshake FAILED: ${error}`);
            console.error('[MCP Bridge] Handshake failed:', error);
            initializationPromise = null; // Allow retry
            throw error;
        }
    })();

    return initializationPromise;
}

async function ensureMcpServer(): Promise<ChildProcess> {
    if (mcpProcess && mcpProcess.connected) return mcpProcess;
    if (serverSpawnPromise) return serverSpawnPromise;

    serverSpawnPromise = (async () => {
        isInitialized = false;
        initializationPromise = null;
        logToDebugFile(`Spawning Gemini Notebook MCP Server: ${PYTHON_EXE} -m ${MCP_SERVER_MODULE}`);

        const proc = spawn(PYTHON_EXE, ['-m', MCP_SERVER_MODULE, '--transport', 'stdio'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            // Le client Gemini Notebook ne lit pas NOTEBOOKLM_CONFIG : sa
            // configuration et ses profils vivent dans ~/.notebooklm-mcp-cli.
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1'
            }
        });

        proc.stdout?.on('data', (data: Buffer) => {
            stdoutBuffer += data.toString();
            
            let boundary = stdoutBuffer.indexOf('\n');
            while (boundary !== -1) {
                const line = stdoutBuffer.substring(0, boundary).trim();
                stdoutBuffer = stdoutBuffer.substring(boundary + 1);
                
                if (line) {
                    logToDebugFile(`<<< RECV: ${line}`);
                    try {
                        const response = JSON.parse(line);
                        logToDebugFile(`[Bridge] Parsed ID: ${response.id}, Method: ${response.method || 'N/A'}`);
                        
                        if (response.id !== undefined) {
                            const pending = pendingRequests.get(response.id);
                            if (pending) {
                                logToDebugFile(`[Bridge] Matching pending request found for ID ${response.id} (${pending.method})`);
                                clearTimeout(pending.timeout);
                                if (response.error) {
                                    const errorDetails = JSON.stringify(response.error);
                                    logToDebugFile(`!!! ERROR for ID ${response.id}: ${errorDetails}`);
                                    emettreActivite(evenementErreur(
                                        response.error.message || 'Erreur sans message',
                                        response.id,
                                    ));
                                    pending.reject(new Error(`${response.error.message || 'Unknown error'} (Data: ${errorDetails})`));
                                } else {
                                    logToDebugFile(`[Bridge] Resolving ID ${response.id} with ${JSON.stringify(response.result).substring(0, 100)}...`);
                                    // La couche fiable du journal : ce que le pont sait de
                                    // lui-même, indépendamment de ce que le serveur raconte.
                                    emettreActivite(evenementReponse(
                                        response.id,
                                        Date.now() - pending.debut,
                                        JSON.stringify(response.result ?? '').length,
                                    ));
                                    pending.resolve(response.result);
                                }
                                pendingRequests.delete(response.id);
                            } else {
                                logToDebugFile(`[Bridge] WARNING: Received response for unknown ID ${response.id}`);
                            }
                        } else if (response.method === 'notifications/message') {
                            logToDebugFile(`[Server Notification] ${response.params?.message}`);
                            // Ce canal etait recu et jete depuis toujours : le serveur
                            // parlait, personne n'ecoutait. Rien ne garantit qu'il emette
                            // quoi que ce soit, d'ou la couche fiable au-dessus.
                            const dit = ligneServeur(String(response.params?.message ?? ''));
                            if (dit) emettreActivite(evenementServeur(dit));
                        }
                    } catch (e) {
                        logToDebugFile(`[Bridge] JSON Parse Error or Handling Error: ${e}`);
                        logToDebugFile(`[Raw Output] ${line}`);
                    }
                }
                boundary = stdoutBuffer.indexOf('\n');
            }
        });

        proc.stderr?.on('data', (data: Buffer) => {
            const msg = data.toString().trim();
            if (msg) {
                logToDebugFile(`stderr: ${msg}`);
                if (msg.toLowerCase().includes('error')) {
                    console.error(`[MCP Server] ${msg}`);
                }
                // Un serveur Python journalise sur stderr bien plus souvent qu'il
                // n'émet des notifications MCP : c'est la source vivante la plus
                // probable. `ligneServeur` en retire le préambule et le bruit.
                for (const brut of msg.split(/\r?\n/)) {
                    const dit = ligneServeur(brut);
                    if (dit) emettreActivite(evenementServeur(dit));
                }
            }
        });

        proc.on('exit', (code, signal) => {
            logToDebugFile(`Server exited (code: ${code}, signal: ${signal})`);
            isInitialized = false;
            mcpProcess = null;
            serverSpawnPromise = null;
            pendingRequests.forEach((p) => p.reject(new Error(`MCP Server exited with code ${code}`)));
            pendingRequests.clear();
        });

        mcpProcess = proc;
        return proc;
    })();

    return serverSpawnPromise;
}

async function callMcp(method: string, params: Record<string, unknown>) {
    const process = await ensureMcpServer();

    // Auto-handshake for standard methods (except initialize itself)
    if (method !== 'initialize' && !isInitialized) {
        await ensureHandshake();
    }

    const id = requestId++;
    logToDebugFile(`[Bridge] Preparing request ${id} for method: ${method}`);
    
    return new Promise((resolve, reject) => {
        const timeoutDuration = 45 * 60 * 1000; // 45 minutes (aligned with AI Forge timeout)
        const timeout = setTimeout(() => {
            const timeoutMsg = `MCP Request ${id} (${method}) timed out after 45m`;
            logToDebugFile(`!!! TIMEOUT: ${timeoutMsg}`);
            console.error(`[MCP Bridge] ${timeoutMsg}`);
            pendingRequests.delete(id);
            emettreActivite(evenementErreur(timeoutMsg, id));
            reject(new Error(timeoutMsg));
        }, timeoutDuration);

        pendingRequests.set(id, { resolve, reject, method, timeout, debut: Date.now() });
        emettreActivite(evenementRequete(
            method === 'tools/call' ? String(params.name ?? method) : method,
            id,
            detailArguments(params.arguments as Record<string, unknown> | undefined),
        ));
        
        const request = JSON.stringify({
            jsonrpc: '2.0',
            id,
            method,
            params
        }) + '\n';
        
        logToDebugFile(`>>> SEND [ID:${id}]: ${request.trim().substring(0, 200)}...`);
        process.stdin?.write(request);
    });
}

export function registerMcpHandlers() {
    console.log('[MCP Bridge] Registering IPC Handlers');

    ipcMain.handle('mcp:list-tools', async () => {
        try {
            console.log('[MCP Bridge] Requesting tool list...');
            const result = await callMcp('tools/list', {}) as { tools: unknown[] };
            return result.tools || [];
        } catch (error) {
            console.error('[MCP Bridge] tools/list failed:', error);
            throw error;
        }
    });

    ipcMain.handle('mcp:call-tool', async (_event, _serverName: string, toolName: string, args: Record<string, unknown>) => {
        try {
            console.log(`[MCP Bridge] Calling tool: ${toolName}`);
            
            // Plain object clone to remove any hidden properties or circular refs
            const cleanArgs = JSON.parse(JSON.stringify(args));
            
            const result = await callMcp('tools/call', {
                name: toolName,
                arguments: cleanArgs
            }) as { content?: Array<{ type: string; text: string }> };
            
            // Standard MCP response content extraction with JSON parsing fallback
            if (result && result.content && Array.isArray(result.content)) {
                const textContent = result.content
                    .filter((c: { type: string; text: string }) => c.type === 'text')
                    .map((c: { type: string; text: string }) => c.text)
                    .join('\n');

                // If the content looks like JSON, try to extract 'answer' or handle errors
                if (textContent.trim().startsWith('{')) {
                    let parsed: Record<string, unknown> | null = null;
                    try {
                        parsed = JSON.parse(textContent) as Record<string, unknown>;
                        if (parsed.status === 'success') {
                            logToDebugFile(`[Bridge] Success detected, unwrapping content...`);
                            if (typeof parsed.answer === 'string') {
                                return { content: parsed.answer || "L'Oracle n'a pas trouvé de réponse précise pour ce notebook." };
                            }
                            // Return the full parsed object so UI can access fields like .notebooks, .sources, etc.
                            return parsed;
                        }
                        if (parsed.status === 'error') {
                            const errorMsg = (parsed.message as string) || (parsed.error as string) || "Erreur inconnue provenant de l'Oracle.";
                            throw new Error(errorMsg);
                        }
                    } catch (e: unknown) {
                        const err = e as Error;
                        // Si c'est notre erreur générée, on la fait remonter
                        if ((err.message && err.message.includes("provenant de l'Oracle")) || parsed?.status === 'error') {
                            console.error("[MCP Bridge] Oracle Error intercepted:", err);
                            throw err;
                        }
                        // Not valid JSON or different format, keep original text
                    }
                }

                return { content: textContent };
            }
            
            return result;
        } catch (error) {
            console.error(`[MCP Bridge] tools/call ${toolName} failed:`, error);
            throw error;
        }
    });

    /**
     * Ré-authentification : `nlm login` ouvre une fenêtre Chrome et attend que
     * l'utilisateur se connecte à son compte Google.
     *
     * On ne bloque pas jusqu'au bout — la connexion peut prendre plusieurs
     * minutes — mais on ne prétend plus au succès sur la seule création du
     * processus. L'ancienne version lançait le CLI en `detached` avec
     * `stdio: 'ignore'` et renvoyait toujours « lancée » : quand le processus
     * mourait aussitôt, rien ne le signalait, ni à l'écran ni dans le journal.
     * Un échec instantané est le symptôme le plus probable, et le seul qu'on
     * puisse détecter sans attendre l'utilisateur.
     */
    ipcMain.handle('mcp:reauthenticate', async () => {
        logToDebugFile(`[Auth] Triggering re-authentication: ${PYTHON_EXE} -m ${MCP_CLI_MODULE} login`);

        return await new Promise((resolve, reject) => {
            let authProcess: ChildProcess;
            try {
                authProcess = spawn(PYTHON_EXE, ['-m', MCP_CLI_MODULE, 'login'], {
                    shell: false,
                    stdio: ['ignore', 'pipe', 'pipe'],
                });
            } catch (error) {
                logToDebugFile(`[Auth] Spawn failed: ${error}`);
                reject(error);
                return;
            }

            let output = '';
            const collect = (data: Buffer) => {
                output += data.toString();
                logToDebugFile(`[Auth] ${data.toString().trimEnd()}`);
            };
            authProcess.stdout?.on('data', collect);
            authProcess.stderr?.on('data', collect);

            // Le CLI meurt-il avant même d'avoir ouvert le navigateur ?
            const earlyExit = setTimeout(() => {
                authProcess.removeAllListeners('exit');
                authProcess.unref();
                resolve({
                    success: true,
                    message: "Connectez-vous à votre compte Google dans la fenêtre Chrome qui vient de s'ouvrir.",
                });
            }, 3000);

            authProcess.on('exit', (code) => {
                clearTimeout(earlyExit);
                const detail = output.trim().split('\n').slice(-3).join(' ').slice(0, 300);
                logToDebugFile(`[Auth] CLI exited early with code ${code}: ${detail}`);
                resolve({
                    success: false,
                    message: `L'authentification a échoué immédiatement (code ${code}). ${detail}`,
                });
            });

            authProcess.on('error', (error) => {
                clearTimeout(earlyExit);
                logToDebugFile(`[Auth] CLI error: ${error}`);
                resolve({ success: false, message: `Lancement impossible : ${error.message}` });
            });
        });
    });

    ipcMain.handle('mcp:restart', async () => {
        logToDebugFile(`[System] Restarting MCP Server...`);
        if (mcpProcess) {
            mcpProcess.kill();
            mcpProcess = null;
        }
        serverSpawnPromise = null;
        isInitialized = false;
        initializationPromise = null;
        return { success: true, message: "Serveur MCP redémarré avec succès." };
    });
}
