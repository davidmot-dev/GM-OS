import React from 'react';
import { Activity, Clock, X, Shield } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';

/**
 * RemoteNotificationCenter - Affiche les alertes provenant du Tablet HUB des joueurs.
 * Permet au MJ de superviser les modifications de PV/Ressources en temps réel.
 */
const RemoteNotificationCenter: React.FC = () => {
    const { remoteNotifications, clearRemoteNotification } = useSessionOSStore();

    if (remoteNotifications.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
            {remoteNotifications.map((notif) => (
                <div 
                    key={notif.id}
                    className="pointer-events-auto bg-app-surface/95 backdrop-blur-xl border border-app-border/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-right-10 fade-in duration-500 group relative overflow-hidden"
                >
                    {/* Progress strip */}
                    <div className="absolute top-0 left-0 h-1 bg-accent shadow-glow-accent w-full" />
                    
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent border border-accent/30 shadow-glow-accent/20">
                            {notif.type === 'vitals_update' ? <Activity size={20} /> : <Shield size={20} />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-ui-10 font-black uppercase tracking-widest text-accent flex items-center gap-1">
                                    <Clock size={10} /> {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <button 
                                    onClick={() => clearRemoteNotification(notif.id)}
                                    className="text-app-text/20 hover:text-app-text transition-colors"
                                    title="Fermer la notification"
                                    aria-label="Fermer la notification"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <h4 className="text-sm font-bold text-app-text leading-tight truncate">
                                {notif.characterName} <span className="text-app-text/40 font-medium">({notif.playerName})</span>
                            </h4>
                            
                            <p className="text-xs text-app-text/70 mt-1 leading-relaxed">
                                {notif.message}
                            </p>

                            <div className="flex items-center gap-2 mt-3">
                                <div className="h-px flex-1 bg-app-border/5" />
                                <span className="text-ui-9 font-bold text-app-text/20 uppercase tracking-tighter">Tablet Hub Sync</span>
                            </div>
                        </div>
                    </div>

                    {/* Background glow on hover */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                </div>
            ))}
        </div>
    );
};

export default RemoteNotificationCenter;
