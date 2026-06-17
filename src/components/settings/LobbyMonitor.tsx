import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Tablet, Smartphone, XCircle, CheckCircle2, AlertCircle, Trash2, RotateCw } from 'lucide-react';
import type { ClientContext } from '../../types/shared';

const LobbyMonitor: React.FC = () => {
    const { t } = useTranslation('settings');
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

    const formatRelativeTime = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 5) return t('remote.lobby.just_now');
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h`;
    };

    return (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-gm-cyan" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">{t('remote.lobby.title')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-gm-cyan/20 text-gm-cyan text-[10px] font-black px-2 py-0.5 rounded-full">
                        {clients.filter(c => c.status === 'active').length} {t('remote.lobby.active_suffix')}
                    </span>
                    <button 
                        onClick={() => {
                            if (window.appBridge?.send) {
                                window.appBridge.send('remote:clear-disconnected');
                                // Show immediate feedback by filtering locally until sync
                                setClients(prev => prev.filter(c => c.status === 'active'));
                            }
                        }}
                        className="p-1.5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                        title={t('remote.lobby.clear_tooltip')}
                    >
                        <Trash2 size={14} />
                    </button>
                    <button 
                        onClick={() => window.appBridge?.send?.('remote:request-client-sync')}
                        className="p-1.5 hover:bg-white/10 text-slate-500 hover:text-white rounded-lg transition-all"
                        title={t('remote.lobby.refresh_tooltip')}
                    >
                        <RotateCw size={14} />
                    </button>
                </div>
            </div>

            <div className="max-h-[300px] flex flex-col gap-2 overflow-y-auto custom-scrollbar p-3 relative">
                {clients.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                        <p className="text-[10px] font-bold uppercase">{t('remote.lobby.no_devices')}</p>
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
                                    <p className="text-xs font-bold text-white leading-none">
                                        {client.pseudo}
                                        {client.playerName && (
                                            <span className="ml-2 text-[10px] font-medium text-gm-cyan/60 italic lowercase tracking-tight">
                                                ({client.playerName})
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-[9px] font-medium text-slate-500 uppercase mt-1">
                                        {client.role} • {client.deviceId.substring(0, 8)}... • {formatRelativeTime(client.lastSeen)}
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
            
            <div className="bg-slate-950/50 p-3 border-t border-white/5 shrink-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-[9px] text-slate-500 italic flex-1">
                        {t('remote.lobby.reconnect_note')}
                    </p>
                    <button
                        onClick={() => {
                            if (window.appBridge?.send) {
                                window.appBridge.send('remote:eject-all');
                                // Immediate feedback: clear local state
                                setClients([]);
                                // Reset character locks in session store
                                try {
                                    const sSession = (window as any).useSessionOSStore;
                                    if (sSession) sSession.getState().setCharacterLocks({});
                                } catch { /* non-critical */ }
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap"
                        title={t('remote.lobby.eject_all_tooltip')}
                    >
                        <XCircle size={12} />
                        {t('remote.lobby.eject_all')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LobbyMonitor;
