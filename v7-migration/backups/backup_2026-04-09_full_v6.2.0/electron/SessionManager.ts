import { ClientContext } from '../src/types/shared';

export class SessionManager {
    private sessions = new Map<string, ClientContext>();
    private ghostTimeouts = new Map<string, NodeJS.Timeout>();
    private GHOST_DURATION = 2 * 60 * 1000; // 2 minutes

    public registerClient(deviceId: string, pseudo: string, role: ClientContext['role'], playerName?: string): ClientContext {
        // Clear any existing ghost timeout
        if (this.ghostTimeouts.has(deviceId)) {
            clearTimeout(this.ghostTimeouts.get(deviceId)!);
            this.ghostTimeouts.delete(deviceId);
        }

        const existingSession = this.sessions.get(deviceId);
        
        const context: ClientContext = {
            deviceId,
            pseudo: pseudo || (existingSession?.pseudo) || 'Anonyme',
            playerName: playerName || existingSession?.playerName,
            role,
            status: 'active',
            lastSeen: Date.now()
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
}

export const sessionManager = new SessionManager();
