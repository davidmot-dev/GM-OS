import { ipcMain, app } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MCP Bridge - Chemins dynamiques pour la portabilité
 */

const USER_HOME = process.env.USERPROFILE || process.env.HOME || '';
const ANTIGRAVITY_DIR = path.join(USER_HOME, '.antigravity', 'notebooklm-mcp');

const DEBUG_LOG_PATH = path.join(USER_HOME, 'mcp_bridge_debug.log');
const PYTHON_EXE = 'python'; // Utilise le python du PATH par défaut
const WRAPPER_SCRIPT = path.join(ANTIGRAVITY_DIR, 'run_mcp.py');
const CONFIG_PATH = path.join(ANTIGRAVITY_DIR, 'notebooklm-config.json');

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
const pendingRequests = new Map<number, { resolve: (val: unknown) => void; reject: (err: unknown) => void; method: string; timeout: NodeJS.Timeout }>();
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
        logToDebugFile(`Spawning NotebookLM MCP Server with wrapper: ${WRAPPER_SCRIPT}`);
        
        const proc = spawn(PYTHON_EXE, [WRAPPER_SCRIPT, 'server', '--debug'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { 
                ...process.env, 
                PYTHONUNBUFFERED: '1',
                NOTEBOOKLM_CONFIG: CONFIG_PATH
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
                                    pending.reject(new Error(`${response.error.message || 'Unknown error'} (Data: ${errorDetails})`));
                                } else {
                                    logToDebugFile(`[Bridge] Resolving ID ${response.id} with ${JSON.stringify(response.result).substring(0, 100)}...`);
                                    pending.resolve(response.result);
                                }
                                pendingRequests.delete(response.id);
                            } else {
                                logToDebugFile(`[Bridge] WARNING: Received response for unknown ID ${response.id}`);
                            }
                        } else if (response.method === 'notifications/message') {
                            logToDebugFile(`[Server Notification] ${response.params?.message}`);
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
        const timeout = setTimeout(() => {
            const timeoutMsg = `MCP Request ${id} (${method}) timed out after 60s`;
            logToDebugFile(`!!! TIMEOUT: ${timeoutMsg}`);
            console.error(`[MCP Bridge] ${timeoutMsg}`);
            pendingRequests.delete(id);
            reject(new Error(timeoutMsg));
        }, 60000);

        pendingRequests.set(id, { resolve, reject, method, timeout });
        
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

    ipcMain.handle('mcp:reauthenticate', async () => {
        logToDebugFile(`[Auth] Triggering re-authentication CLI...`);
        try {
            const authProcess = spawn(PYTHON_EXE, [WRAPPER_SCRIPT, 'auth_cli'], { 
                shell: false,
                detached: true,
                stdio: 'ignore'
            });
            authProcess.unref();
            logToDebugFile(`[Auth] Auth CLI process spawned via wrapper.`);
            return { success: true, message: "Authentification lancée." };
        } catch (error) {
            logToDebugFile(`[Auth] Error: ${error}`);
            throw error;
        }
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
