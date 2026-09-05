import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    Save, 
    X, 
    Check, 
    Music, 
    Volume2, 
    Wind, 
    Lightbulb, 
    ImageIcon,
    Clock,
    Eye
} from 'lucide-react';
import { useModalStore } from '../../../stores/useModalStore';

interface SessionSnapshotModalProps {
    onClose: () => void;
}

const SessionSnapshotModal: React.FC<SessionSnapshotModalProps> = ({ onClose }) => {
    const { 
        sessions, 
        activeCampaignId, 
        saveSystemSnapshot 
    } = useSessionOSStore();

    const { showCustom } = useModalStore();
    
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const relevantSessions = sessions
        .filter(s => s.campaignId === activeCampaignId && (s.status === 'planned' || s.status === 'active'))
        .sort((a, b) => b.number - a.number);

    const handleSave = () => {
        if (!selectedSessionId) return;
        saveSystemSnapshot(selectedSessionId);
        setIsSaved(true);
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-app-surface border border-app-border rounded-[2.5rem] shadow-glow-accent overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-app-border bg-app-surface/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent/20 text-accent rounded-2xl">
                            <Save size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-app-text tracking-tight uppercase">Capture d'État</h3>
                            <p className="text-ui-10 text-app-text/40 font-bold uppercase tracking-widest mt-1">Sauvegarder la configuration actuelle</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-app-surface/80 rounded-full text-app-text/20 hover:text-app-text transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <p className="text-xs text-app-text/60 leading-relaxed font-medium">
                            Cette action va enregistrer l'état actuel de tous vos modules (**Music**, **Sound**, **Ambient**, **Light**, **Image**) dans la session sélectionnée. Vous pourrez le restaurer d'un clic lors du lancement.
                        </p>
                        
                        <div className="flex flex-wrap gap-3 py-2 opacity-40">
                            {[Music, Volume2, Wind, Lightbulb, ImageIcon].map((Icon, i) => (
                                <div key={i} className="flex items-center gap-1 px-2 py-1 bg-app-bg border border-app-border rounded-lg">
                                    <Icon size={12} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="text-ui-10 font-black text-app-text/40 uppercase tracking-[0.2em] ml-2">Choisir une session prévue</label>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                            {relevantSessions.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedSessionId(s.id)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                                        selectedSessionId === s.id 
                                        ? 'bg-accent/10 border-accent shadow-glow-accent/20' 
                                        : 'bg-app-bg border-app-border/40 hover:border-app-border'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${selectedSessionId === s.id ? 'bg-accent text-white' : 'bg-app-surface text-app-text/20'}`}>
                                            <Clock size={16} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-app-text">
                                                Session #{s.number}
                                                {s.status === 'active' && <span className="ml-2 text-ui-8 bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter">Active</span>}
                                            </div>
                                            <div className="text-ui-10 text-app-text/40">{new Date(s.date).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {selectedSessionId === s.id && <Check size={20} className="text-accent" />}
                                        {s.moduleSnapshot && !isSaved && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showCustom('snapshot-viewer', { snapshot: s.moduleSnapshot, sessionName: `Session #${s.number}` });
                                                    }}
                                                    className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-400 transition-colors pointer-events-auto"
                                                    title="Voir le contenu"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <div className="text-ui-8 font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter">
                                                    Snapshot Existant
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {relevantSessions.length === 0 && (
                                <div className="py-10 text-center border-2 border-dashed border-app-border rounded-3xl opacity-30">
                                    <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">Aucune session prévue.<br/>Créez-en une d'abord !</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 pt-0">
                    <button
                        onClick={handleSave}
                        disabled={!selectedSessionId || isSaved}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all ${
                            isSaved 
                            ? 'bg-emerald-500 text-white cursor-default' 
                            : selectedSessionId 
                                ? 'bg-accent text-white hover:brightness-110 shadow-glow-accent active:scale-95' 
                                : 'bg-slate-800 text-white/20 cursor-not-allowed'
                        }`}
                    >
                        {isSaved ? (
                            <>
                                <Check size={20} />
                                ÉTAT SAUVEGARDÉ !
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                CAPTURER L'ÉTAT ACTUEL
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionSnapshotModal;
