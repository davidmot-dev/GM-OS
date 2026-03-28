import React, { useEffect, useState } from 'react';
import { 
    MessageCircle, 
    X, 
    Save, 
    Check, 
    BellRing,
    ChevronUp
} from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { format } from 'date-fns';

interface Alert {
    id: string;
    messageId: string;
    player: string;
    character: string;
    content: string;
    timestamp: number;
}

export const MessageAlertOverlay: React.FC = () => {
    const { messages, saveMessageToJournal } = useSessionOSStore();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [lastProcessedMessageId, setLastProcessedMessageId] = useState<string | null>(null);

    // Monitor messages for new ones coming from players
    useEffect(() => {
        if (messages.length === 0) return;
        
        const latestMsg = messages[messages.length - 1];
        
        // Only trigger for new messages NOT from GM and NOT already processed
        if (latestMsg.fromId !== 'GM' && latestMsg.id !== lastProcessedMessageId) {
            setLastProcessedMessageId(latestMsg.id);
            
            // Add new alert (stack it)
            const newAlert: Alert = {
                id: `alert-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
                messageId: latestMsg.id,
                player: latestMsg.fromName, // Assuming player name for now, or character name
                character: latestMsg.fromName, 
                content: latestMsg.content,
                timestamp: latestMsg.timestamp
            };
            
            setAlerts(prev => [...prev, newAlert]);
        }
    }, [messages, lastProcessedMessageId]);

    const handleDismiss = (alertId: string) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    };

    const handleSave = (alert: Alert) => {
        saveMessageToJournal(alert.messageId);
        handleDismiss(alert.id);
    };

    if (alerts.length === 0) return null;

    return (
        <div className="fixed top-20 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
            {alerts.slice(-3).map((alert, index) => (
                <div 
                    key={alert.id}
                    className="w-80 bg-app-surface/90 border border-accent/30 rounded-2xl shadow-2xl backdrop-blur-2xl p-4 pointer-events-auto transform animate-in slide-in-from-right-10 duration-300 border-l-4 border-l-accent"
                    style={{ 
                        opacity: 1 - (alerts.length - 1 - index) * 0.15,
                        transform: `scale(${1 - (alerts.length - 1 - index) * 0.05}) translate-y-${(alerts.length - 1 - index) * 2}`
                    }}
                >
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/20">
                                <MessageCircle size={16} className="text-accent" />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-widest text-accent">Nouveau Message</span>
                                <span className="text-[10px] font-bold text-app-text/60 truncate max-w-[150px]">
                                    {alert.character}
                                </span>
                             </div>
                        </div>
                        <button 
                            onClick={() => handleDismiss(alert.id)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-app-text/40 hover:text-red-400"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <p className="text-sm text-app-text/90 line-clamp-3 mb-4 leading-relaxed font-medium pl-1 italic">
                        "{alert.content}"
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                        <button 
                            onClick={() => handleDismiss(alert.id)}
                            className="flex-1 py-2 px-3 rounded-xl bg-app-bg border border-app-border text-[10px] font-bold uppercase tracking-wider hover:bg-app-surface text-app-text/60 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <Check size={12} />
                            OK
                        </button>
                        <button 
                            onClick={() => handleSave(alert)}
                            className="flex-1 py-2 px-3 rounded-xl bg-gm-gold/20 border border-gm-gold/30 text-[10px] font-bold uppercase tracking-wider text-gm-gold hover:bg-gm-gold hover:text-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-gm-gold/10"
                        >
                            <Save size={12} />
                            Sauvegarder
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
