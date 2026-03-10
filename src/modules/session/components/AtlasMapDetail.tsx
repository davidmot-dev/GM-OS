import React from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useMapStore } from '../../map/useMapStore';
import { Lock, Eye, Send, Film } from 'lucide-react';
import { useMediaUrl } from '../../../hooks/useMediaUrl';

const AtlasMapDetail: React.FC = () => {
    const { atlasMaps, selectedAtlasMapId, updateAtlasMap, setCurrentView } = useSessionOSStore();
    const { setMap } = useMapStore();

    const selectedMap = atlasMaps.find(m => m.id === selectedAtlasMapId);

    // Always call hooks at the top level
    const url = useMediaUrl(selectedMap?.fileUrl);

    if (!selectedMap) {
        return (
            <div className="flex-1 flex items-center justify-center bg-app-bg/50 text-app-text/20">
                <div className="text-center">
                    <p className="text-3xl mb-2">🗺️</p>
                    <p className="text-sm">Sélectionne une carte dans la bibliothèque</p>
                </div>
            </div>
        );
    }

    const handleSendToMapOS = () => {
        setMap(selectedMap.fileUrl, selectedMap.isVideo, selectedMap.name);
        setCurrentView('cockpit');
    };

    return (
        <div className="flex-1 flex flex-col bg-app-bg overflow-hidden">
            {/* Map Preview */}
            <div className="relative flex-shrink-0 h-64 bg-app-surface overflow-hidden">
                {url ? (
                    selectedMap.isVideo ? (
                        <video
                            key={url}
                            src={url}
                            className="w-full h-full object-cover"
                            muted
                            autoPlay
                            loop
                        />
                    ) : (
                        <img
                            src={url}
                            alt={selectedMap.name}
                            className="w-full h-full object-cover"
                        />
                    )
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-app-surface border-2 border-dashed border-app-border p-6 text-center">
                        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
                        <p className="text-app-text/40 font-bold text-sm">Chargement du fichier...</p>
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent" />
                {/* Name overlay */}
                <div className="absolute bottom-4 left-6 right-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">{selectedMap.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                {selectedMap.isVideo && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/80 text-white">
                                        <Film size={9} /> Animé
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleSendToMapOS}
                            className="flex items-center gap-2 bg-accent hover:bg-accent/80 text-white font-black py-2.5 px-5 rounded-xl text-sm transition-all shadow-glow-accent"
                        >
                            <Send size={16} />
                            Send to Map-OS
                        </button>
                    </div>
                </div>
            </div>

            {/* Text Areas */}
            <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
                {/* Narrative Description */}
                <div className="border-r border-app-border p-5 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-3">
                        <Eye size={14} className="text-app-text/40" />
                        <h4 className="text-xs font-bold text-app-text/40 uppercase tracking-widest">Description Narrative</h4>
                        <span className="text-[9px] text-app-text/20 bg-app-surface/60 px-1.5 py-0.5 rounded-full">Public</span>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent border-none text-app-text/80 text-sm leading-relaxed resize-none focus:ring-0 focus:outline-none custom-scrollbar placeholder:text-app-text/10"
                        value={selectedMap.narrativeDescription}
                        onChange={e => updateAtlasMap(selectedMap.id, { narrativeDescription: e.target.value })}
                        placeholder="Ce que les joueurs voient et ressentent en arrivant ici..."
                    />
                </div>

                {/* GM Notes */}
                <div className="p-5 flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                        <Lock size={80} className="text-accent" />
                    </div>
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                        <Lock size={14} className="text-accent" />
                        <h4 className="text-xs font-bold text-accent uppercase tracking-widest">Notes MJ</h4>
                        <span className="text-[9px] text-app-text/20 bg-app-surface/60 px-1.5 py-0.5 rounded-full">Privé</span>
                    </div>
                    <textarea
                        className="flex-1 bg-transparent border-none text-app-text/80 text-sm leading-relaxed resize-none focus:ring-0 focus:outline-none custom-scrollbar placeholder:text-app-text/10 border-l-2 border-accent/30 pl-3 relative z-10"
                        value={selectedMap.gmNotes}
                        onChange={e => updateAtlasMap(selectedMap.id, { gmNotes: e.target.value })}
                        placeholder="Secrets, trappes, événements déclencheurs, DCs..."
                    />
                </div>
            </div>
        </div>
    );
};

export default AtlasMapDetail;
