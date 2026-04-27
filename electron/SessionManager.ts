/**
 * ClientContext — Interface locale au process Electron (main).
 * 
 * ⚠️ Ne pas importer depuis '../src/types/shared' ici :
 *    le main process ne peut pas résoudre les types du renderer.
 *    Cette interface doit rester en sync avec src/types/shared.ts.
 */
export interface ClientContext {
    deviceId: string;
    pseudo: string;
    playerName?: string;
    characterId?: string;
    role: 'combat' | 'narrative' | 'player' | 'remote' | 'hub';
    status: 'active' | 'ghost' | 'disconnected';
    lastSeen: number;
    ip?: string;
}


export class SessionManager {
    private sessions = new Map<string, ClientContext>();
    private ghostTimeouts = new Map<string, NodeJS.Timeout>();
    private GHOST_DURATION = 2 * 60 * 1000; // 2 minutes

    public registerClient(deviceId: string, pseudo: string, role: ClientContext['role'], playerName?: string, characterId?: string, ip?: string): ClientContext {
        // 1. Validation d'unicité du personnage
        if (characterId) {
            const collision = Array.from(this.sessions.values()).find(c => 
                c.characterId === characterId && 
                c.deviceId !== deviceId && 
                (c.status === 'active' || c.status === 'ghost')
            );
            
            if (collision) {
                // FALLBACK: Si c'est un mode ghost et que l'IP match, on autorise le takeover (Session Recovery)
                // Cela aide si le localStorage a été vidé mais que c'est le même appareil physique.
                if (collision.status === 'ghost' && collision.ip === ip) {
                    console.log(`[SessionManager] IP-based Recovery: Taking over ghost session for ${characterId} from ${collision.deviceId} to ${deviceId}`);
                    this.disconnectClient(collision.deviceId);
                } else {
                    console.warn(`[SessionManager] Character Collision: ${characterId} already taken by ${collision.deviceId} (IP: ${collision.ip} vs ${ip})`);
                    throw new Error('character_taken');
                }
            }
        }

        // 2. Clear any existing ghost timeout for THIS deviceId
        if (this.ghostTimeouts.has(deviceId)) {
            clearTimeout(this.ghostTimeouts.get(deviceId)!);
            this.ghostTimeouts.delete(deviceId);
        }

        const existingSession = this.sessions.get(deviceId);
        
        // 3. Update or Create session
        const context: ClientContext = {
            deviceId,
            pseudo: pseudo || (existingSession?.pseudo) || 'Anonyme',
            playerName: playerName || existingSession?.playerName,
            characterId: characterId || existingSession?.characterId,
            role,
            status: 'active',
            lastSeen: Date.now(),
            ip: ip || existingSession?.ip
        };

        this.sessions.set(deviceId, context);
        return context;
    }

    public ghostClient(deviceId: string) {
        const session = this.sessions.get(deviceId);
        if (session && session.status === 'active') {
            session.status = 'ghost';
            session.lastSeen = Date.now();
            
            // Set timeout to fully disconnect after ghost duration
            const timeout = setTimeout(() => {
                this.disconnectClient(deviceId);
            }, this.GHOST_DURATION);
            
            this.ghostTimeouts.set(deviceId, timeout);
        }
    }

    public disconnectClient(deviceId: string) {
        this.sessions.delete(deviceId);
        if (this.ghostTimeouts.has(deviceId)) {
            clearTimeout(this.ghostTimeouts.get(deviceId)!);
            this.ghostTimeouts.delete(deviceId);
        }
    }

    public getAllClients(): ClientContext[] {
        return Array.from(this.sessions.values());
    }

    public getClient(deviceId: string): ClientContext | undefined {
        return this.sessions.get(deviceId);
    }

    public updateClientStatus(deviceId: string, status: ClientContext['status']) {
        const session = this.sessions.get(deviceId);
        if (session) {
            session.status = status;
            session.lastSeen = Date.now();
        }
    }

    public clearDisconnected() {
        for (const [deviceId, session] of this.sessions.entries()) {
            if (session.status !== 'active') {
                this.disconnectClient(deviceId);
            }
        }
    }

    public clearAll() {
        for (const [deviceId] of this.ghostTimeouts.entries()) {
            clearTimeout(this.ghostTimeouts.get(deviceId)!);
        }
        this.ghostTimeouts.clear();
        this.sessions.clear();
    }
}

export const sessionManager = new SessionManager();
