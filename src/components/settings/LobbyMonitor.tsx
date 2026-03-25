import React, { useEffect, useState } from 'react';
import { Users, Tablet, Smartphone, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ClientContext } from '../../types/shared';

const LobbyMonitor: React.FC = () => {
    const [clients, setClients] = useState<ClientContext[]>([]);

    useEffect(() => {
        const handleSyncClients = (_event: unknown, ...args: unknown[]) => {
            const data = args[0] as ClientContext[];
            setClients(data);
        };

        if (window.appBridge?.on) {
            window.appBridge.on('remote:sync-clients', handleSyncClients);
            // Request initial list
            window.appBridge.send('remote:request-client-sync');
        }

        return () => {
            if (window.appBridge?.off) {
                window.appBridge.off('remote:sync-clients', handleSyncClients);
            }
        };
    }, []);

    const getStatusIcon = (status: ClientContext['status']) => {
        switch (status) {
            case 'active': return <CheckCircle2 className="text-green-500" size={16} />;
            case 'ghost': return <AlertCircle className="text-orange-500 animate-pulse" size={16} />;
            case 'disconnected': return <XCircle className="text-slate-600" size={16} />;
        }
    };

    const getRoleIcon = (role: ClientContext['role']) => {
        if (role === 'remote') return <Smartphone size={14} />;
        return <Tablet size={14} />;
    };

    return (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-gm-cyan" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">Lobby des Terminaux</span>
                </div>
                <span className="bg-gm-cyan/20 text-gm-cyan text-[10px] font-black px-2 py-0.5 rounded-full">
                    {clients.filter(c => c.status === 'active').length} Actifs
                </span>
            </div>

            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-2">
                {clients.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                        <p className="text-[10px] font-bold uppercase">Aucun appareil connecté</p>
                    </div>
                ) : (
                    clients.map((client) => (
                        <div 
                            key={client.deviceId} 
                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                client.status === 'active' ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-60'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${client.status === 'active' ? 'bg-gm-cyan/10 text-gm-cyan' : 'bg-slate-800 text-slate-500'}`}>
                                    {getRoleIcon(client.role)}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white leading-none">{client.pseudo}</p>
                                    <p className="text-[9px] font-medium text-slate-500 uppercase mt-1">
                                        {client.role} • {client.deviceId.substring(0, 8)}...
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(client.status)}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className="bg-slate-950/50 p-3 border-t border-white/5 text-center">
                <p className="text-[9px] text-slate-500 italic">
                    Les tablettes se reconnectent automatiquement en cas de perte de signal.
                </p>
            </div>
        </div>
    );
};

export default LobbyMonitor;
