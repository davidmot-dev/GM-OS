import React from 'react';
import { useLightStore } from '../useLightStore';
import { useMusicStore } from '../../music/useMusicStore';
import { useSoundStore } from '../../sound/useSoundStore';
import { useModalStore } from '../../../stores/useModalStore';
import { X, Lightbulb } from 'lucide-react';

interface LightSceneSelectorProps {
    data: {
        type: 'music' | 'sound';
        playlistId?: string;
        padIndex?: number;
        padId?: string;
    };
}

const LightSceneSelector: React.FC<LightSceneSelectorProps> = ({ data }) => {
    const { scenes } = useLightStore();
    const { updatePad } = useMusicStore();
    const { setPadLightLink } = useSoundStore();
    const { closeModal } = useModalStore();

    const capturedScenes = Object.values(scenes).filter(s => Object.keys(s.lightStates).length > 0);

    const handleSelect = (sceneId: string | null) => {
        if (data.type === 'music' && data.playlistId !== undefined && data.padIndex !== undefined) {
            updatePad(data.playlistId, data.padIndex, { lightLinkId: sceneId || undefined });
        } else if (data.type === 'sound' && data.padId) {
            setPadLightLink(data.padId, sceneId);
        }
        closeModal();
    };

    return (
        <div className="w-[500px] bg-app-bg border border-app-border rounded-3xl shadow-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gm-cyan/20 flex items-center justify-center">
                        <Lightbulb className="text-accent" size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Lier une Scène</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Sélectionnez une ambiance pour ce pad</p>
                    </div>
                </div>
                <button onClick={closeModal} className="size-8 flex items-center justify-center rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all">
                    <X size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="p-8">
                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {/* None Option */}
                    <button
                        onClick={() => handleSelect(null)}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group"
                    >
                        <div className="size-12 rounded-xl bg-app-surface flex items-center justify-center text-app-text/50 group-hover:text-app-text/80">
                            <X size={24} />
                        </div>
                        <div className="text-left">
                            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Aucune</span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter italic">Désactiver le lien</span>
                        </div>
                    </button>

                    {capturedScenes.map((scene) => (
                        <button
                            key={scene.id}
                            onClick={() => handleSelect(scene.id)}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-gm-cyan/30 hover:bg-gm-cyan/5 transition-all group"
                        >
                            <div 
                                className="size-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                                style={{ backgroundColor: `${scene.color}20`, color: scene.color }}
                            >
                                <span className="material-symbols-outlined text-2xl">{scene.icon}</span>
                            </div>
                            <div className="text-left overflow-hidden">
                                <span className="block text-[10px] font-black uppercase tracking-widest text-white truncate">{scene.name}</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                    {Object.keys(scene.lightStates).length} LUMIÈRE(S)
                                </span>
                            </div>
                        </button>
                    ))}

                    {capturedScenes.length === 0 && (
                        <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center opacity-50">
                            <Lightbulb size={32} className="text-slate-600 mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Aucune scène capturée</p>
                            <p className="text-[9px] text-slate-600 mt-1 uppercase">Capturez des scènes dans l'onglet Light OS</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-app-bg/20 border-t border-app-border/10 flex justify-end">
                <button 
                    onClick={closeModal}
                    className="px-6 py-2.5 rounded-xl bg-app-surface hover:bg-app-surface/80 text-[10px] font-black uppercase tracking-widest text-app-text transition-all shadow-lg active:scale-95"
                >
                    Annuler
                </button>
            </div>
        </div>
    );
};

export default LightSceneSelector;
