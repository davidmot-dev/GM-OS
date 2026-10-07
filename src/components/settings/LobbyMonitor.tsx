import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Tablet, Smartphone, XCircle, CheckCircle2, AlertCircle, Trash2, RotateCw } from 'lucide-react';
import type { ClientContext } from '../../types/shared';
import { useHeureDuRendu } from '../../hooks/useHeureDuRendu';

const LobbyMonitor: React.FC = () => {
    const { t } = useTranslation('settings');
    const [clients, setClients] = useState<ClientContext[]>([]);
    const heure = useHeureDuRendu(1000);

    useEffect(() => {
        const handleSyncClients = (clients: unknown[]) => {
            setClients(clients as ClientContext[]);
        };

        const distant = window.appBridge?.remote;
        const retirerLAbonnement = distant?.onSyncClients?.(handleSyncClients);
        // On demande la liste une fois abonné, jamais avant.
        distant?.requestClientSync?.();

        return () => retirerLAbonnement?.();
    }, []);

    const getStatusIcon = (status: ClientContext['status']) => {
        switch (status) {
            case 'active': return <CheckCircle2 className="text-etat-succes" size={16} />;
            case 'ghost': return <AlertCircle className="text-etat-alerte animate-pulse" size={16} />;
            case 'disconnected': return <XCircle className="text-app-subtle" size={16} />;
        }
    };

    const getRoleIcon = (role: ClientContext['role']) => {
        if (role === 'remote') return <Smartphone size={14} />;
        return <Tablet size={14} />;
    };

    const formatRelativeTime = (timestamp: number) => {
        const seconds = Math.floor((heure - timestamp) / 1000);
        if (seconds < 5) return t('remote.lobby.just_now');
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h`;
    };

    return (
        <div className="bg-app-bg/50 border border-app-text/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="bg-app-text/5 px-4 py-3 border-b border-app-text/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-gm-cyan" />
                    <span className="text-xs font-black uppercase tracking-widest text-app-text">{t('remote.lobby.title')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-gm-cyan/20 text-gm-cyan text-ui-10 font-black px-2 py-0.5 rounded-full">
                        {clients.filter(c => c.status === 'active').length} {t('remote.lobby.active_suffix')}
                    </span>
                    <button 
                        onClick={() => {
                            if (window.appBridge?.remote?.clearDisconnected) {
                                window.appBridge.remote.clearDisconnected();
                                // Show immediate feedback by filtering locally until sync
                                setClients(prev => prev.filter(c => c.status === 'active'));
                            }
                        }}
                        className="p-1.5 hover:bg-etat-danger/20 text-app-subtle hover:text-etat-danger rounded-lg transition-all"
                        title={t('remote.lobby.clear_tooltip')}
                    >
                        <Trash2 size={14} />
                    </button>
                    <button 
                        onClick={() => window.appBridge?.remote?.requestClientSync?.()}
                        className="p-1.5 hover:bg-app-text/10 text-app-subtle hover:text-app-text rounded-lg transition-all"
                        title={t('remote.lobby.refresh_tooltip')}
                    >
                        <RotateCw size={14} />
                    </button>
                </div>
            </div>

            <div className="max-h-[300px] flex flex-col gap-2 overflow-y-auto custom-scrollbar p-3 relative">
                {clients.length === 0 ? (
                    <div className="py-8 text-center text-app-subtle">
                        <p className="text-ui-10 font-bold uppercase">{t('remote.lobby.no_devices')}</p>
                    </div>
                ) : (
                    clients.map((client) => (
                        <div 
                            key={client.deviceId} 
                            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                client.status === 'active' ? 'bg-app-text/5 border-app-text/10' : 'bg-app-bg/20 border-app-text/5 opacity-60'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${client.status === 'active' ? 'bg-etat-succes/10 text-etat-succes' : 'bg-app-surface-2 text-app-subtle'}`}>
                                    {getRoleIcon(client.role)}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-app-text leading-none">
                                        {client.pseudo}
                                        {client.playerName && (
                                            <span className="ml-2 text-ui-10 font-medium text-gm-cyan/60 italic lowercase tracking-tight">
                                                ({client.playerName})
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-ui-9 font-medium text-app-subtle uppercase mt-1">
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
            
            <div className="bg-app-bg/50 p-3 border-t border-app-text/5 shrink-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-ui-9 text-app-subtle italic flex-1">
                        {t('remote.lobby.reconnect_note')}
                    </p>
                    <button
                        onClick={() => {
                            if (window.appBridge?.remote?.ejectAll) {
                                window.appBridge.remote.ejectAll();
                                // Immediate feedback: clear local state
                                setClients([]);
                                // Reset character locks in session store
                                try {
                                    const sSession = (window as any).useSessionOSStore;
                                    if (sSession) sSession.getState().setCharacterLocks({});
                                } catch { /* non-critical */ }
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-etat-danger/10 hover:bg-etat-danger/30 border border-etat-danger/30 text-etat-danger hover:text-etat-danger rounded-lg text-ui-10 font-black uppercase tracking-widest transition-all active:scale-95 whitespace-nowrap"
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
