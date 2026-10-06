import React, { useEffect } from 'react';
import TexteMarkdown from '../TexteMarkdown';
import { MessageSquare, Bell, ShieldAlert } from 'lucide-react';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Bouton, Panneau } from '../socle';

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
        <div aria-label="Notifications du MJ" className="fixed bottom-[calc(var(--hub-navigation-hauteur)+env(safe-area-inset-bottom)+8px)] inset-x-3 z-[300] flex max-h-[50dvh] flex-col gap-3 overflow-y-auto pointer-events-none lg:left-auto lg:w-[440px]">
            <AnimatePresence mode="popLayout">
                {hubNotifications.map(notif => (
                    <motion.div key={notif.id} layout role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="pointer-events-auto">
                        <Panneau className={`space-y-2 border-l-4 bg-app-surface p-3 shadow-2xl ${notif.type === 'alert' ? 'border-l-etat-danger' : notif.type === 'system' ? 'border-l-etat-alerte' : 'border-l-accent'}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                    <p className="break-words text-[14px] text-app-muted">Reçu de : {notif.fromName}</p>
                                    <h3 className="flex items-start gap-2 break-words text-[16px] font-bold text-app-text">
                                        {notif.type === 'alert' ? <ShieldAlert size={20} className="shrink-0 text-etat-danger" /> : notif.type === 'system' ? <Bell size={20} className="shrink-0 text-etat-alerte" /> : <MessageSquare size={20} className="shrink-0 text-accent" />}
                                        {notif.title}
                                    </h3>
                                </div>
                                <Bouton cibleTactile onClick={() => clearHubNotification(notif.id)} title="Fermer" className="shrink-0">Fermer</Bouton>
                            </div>
                            <div className="break-words text-[16px] leading-relaxed text-app-text prose-p:my-1"><TexteMarkdown>{notif.content}</TexteMarkdown></div>
                        </Panneau>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default HubNotificationCenter;
