import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, Bell, X, ShieldAlert } from 'lucide-react';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * HubNotificationCenter - Affiche les alertes et messages du MJ sur la tablette du joueur.
 */
const HubNotificationCenter: React.FC = () => {
    const { hubNotifications, clearHubNotification } = useSessionOSStore();

    // Auto-fermeture après 8 secondes pour chaque notification + Vibration
    useEffect(() => {
        if (hubNotifications.length > 0) {
            const lastNotif = hubNotifications[0];
            
            // Retour Haptique (Vibration)
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try {
                    if (lastNotif.type === 'alert') {
                        navigator.vibrate([300, 100, 300]); // Pulsation d'alerte
                    } else if (lastNotif.type === 'system') {
                        navigator.vibrate(200); // Signal système
                    } else {
                        navigator.vibrate([100, 50, 100]); // Double vibration discrète (Message)
                    }
                } catch (e) {
                    // Les navigateurs peuvent bloquer la vibration sans interaction utilisateur préalable
                    console.warn('[HubNotification] Haptic feedback blocked or unsupported:', e);
                }
            }

            const timer = setTimeout(() => {
                clearHubNotification(lastNotif.id);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [hubNotifications, clearHubNotification]);

    return (
        <div className="fixed bottom-24 right-6 z-[300] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
            <AnimatePresence mode="popLayout">
                {hubNotifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                        className="pointer-events-auto group relative overflow-hidden"
                    >
                        <div className="bg-app-surface/90 backdrop-blur-2xl border border-app-border/20 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex gap-4">
                            {/* Accent line */}
                            <div className={`absolute top-0 left-0 h-full w-1 ${
                                notif.type === 'alert' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
                                notif.type === 'system' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                                'bg-accent shadow-[0_0_10px_var(--app-accent)]'
                            }`} />

                            {/* Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                                notif.type === 'alert' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]' :
                                notif.type === 'system' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
                                'bg-accent/10 text-accent border-accent/20 shadow-[0_0_15px_var(--app-accent)]'
                            }`}>
                                {notif.type === 'alert' ? <ShieldAlert size={22} /> : 
                                 notif.type === 'system' ? <Bell size={22} /> : 
                                 <MessageSquare size={22} />}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 truncate pr-4">
                                        RECU DE : {notif.fromName}
                                    </span>
                                    <button 
                                        onClick={() => clearHubNotification(notif.id)}
                                        className="text-white/20 hover:text-white transition-colors p-1 -m-1"
                                        title="Fermer"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <h4 className="text-sm font-bold text-app-text mb-1 leading-tight">
                                    {notif.title}
                                </h4>
                                
                                <div className="text-xs text-app-text/80 line-clamp-4 leading-relaxed prose-sm prose-invert prose-p:my-0.5 prose-li:my-0">
                                    <ReactMarkdown>
                                        {notif.content}
                                    </ReactMarkdown>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex gap-1.5 opacity-40">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse [animation-delay:0.2s]" />
                                    </div>
                                    <span className="text-[9px] font-bold text-app-text/10 italic">NEXUS-COMM v5.2</span>
                                </div>
                            </div>
                        </div>

                        {/* Background glow sweep */}
                        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -rotate-45 pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default HubNotificationCenter;
