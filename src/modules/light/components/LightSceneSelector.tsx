import React from 'react';
import { useLightStore } from '../useLightStore';
import { useMusicStore } from '../../music/useMusicStore';
import { useSoundStore } from '../../sound/useSoundStore';
import { useAmbientStore } from '../../ambient/useAmbientStore';
import { useModalStore } from '../../../stores/useModalStore';
import { X, Lightbulb } from 'lucide-react';

interface LightSceneSelectorProps {
    data: {
        type: 'music' | 'sound' | 'ambient';
        playlistId?: string;
        padIndex?: number;
        padId?: string;
        trackIndex?: number;
    };
}

const LightSceneSelector: React.FC<LightSceneSelectorProps> = ({ data }) => {
    const { scenes } = useLightStore();
    const { updatePad } = useMusicStore();
    const { setPadLightLink } = useSoundStore();
    const { setTrackLightLink } = useAmbientStore();
    const { closeModal } = useModalStore();

    const capturedScenes = Object.values(scenes).filter(s => Object.keys(s.lightStates).length > 0);

    const handleSelect = (sceneId: string | null) => {
        if (data.type === 'music' && data.playlistId !== undefined && data.padIndex !== undefined) {
            updatePad(data.playlistId, data.padIndex, { linkedLightSceneId: sceneId || undefined });
        } else if (data.type === 'sound' && data.padId) {
            setPadLightLink(data.padId, sceneId);
        } else if (data.type === 'ambient' && data.trackIndex !== undefined) {
            setTrackLightLink(data.trackIndex, sceneId);
        }
        closeModal();
    };

    return (
        <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 p-6">
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
    );
};

export default LightSceneSelector;
