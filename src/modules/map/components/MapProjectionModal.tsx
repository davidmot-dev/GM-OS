import React, { useEffect } from 'react';
import { Monitor, Cast, ExternalLink } from 'lucide-react';
import { useImageStore } from '../../image/useImageStore';
import { useMapStore } from '../useMapStore';
import { useModalStore } from '../../../stores/useModalStore';

const MapProjectionModal: React.FC = () => {
    const { displays, fetchDisplays } = useImageStore();
    const { mapUrl, syncToPlayers, clearProjectedState, isVideo, fogDataUrl, tokens, mapWidth, mapHeight, isGridEnabled, gridSize, gridColor, gridOpacity } = useMapStore();
    const { closeModal } = useModalStore();

    useEffect(() => {
        if (window.appBridge?.image?.getDisplays) {
            fetchDisplays();
        }
    }, [fetchDisplays]);

    const handleProjectToHub = () => {
        // Sync everything to Player Hub
        syncToPlayers();
        
        // Ensure physical displays are closed when projecting to Hub (Exclusivity)
        if (window.appBridge?.image?.closeAllDisplays) {
            window.appBridge.image.closeAllDisplays();
        }
        
        closeModal();
    };

    const handleProjectToMonitor = (displayId: string) => {
        const bridge = window.appBridge;
        if (bridge?.image?.launchDisplay && mapUrl) {
            // Stop Hub projection (Exclusivity)
            clearProjectedState();

            // Manually sync "projected" state for the monitor to consume via storage events
            // We set projectionTarget to 'monitor' so Hub doesn't show it
            useMapStore.setState({
                projectionTarget: 'monitor',
                projectedMapUrl: mapUrl,
                projectedIsVideo: isVideo,
                projectedFogDataUrl: fogDataUrl,
                projectedTokens: tokens,
                projectedMapWidth: mapWidth,
                projectedMapHeight: mapHeight,
                projectedIsGridEnabled: isGridEnabled,
                projectedGridSize: gridSize,
                projectedGridColor: gridColor,
                projectedGridOpacity: gridOpacity
            });

            // Signal tactical map mode to the projector window
            bridge.image.launchDisplay(['__tactical_map__'], displayId);
        }
        closeModal();
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-400 mb-2">
                Choisissez la destination pour projeter la carte actuelle :
            </p>

            <div className="grid grid-cols-1 gap-3">
                {/* Option 1: Player Hub */}
                <button
                    onClick={handleProjectToHub}
                    className="flex items-center gap-4 p-4 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl transition-all group text-left"
                >
                    <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <Cast size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-100">Synchroniser Player Hub</h4>
                        <p className="text-xs text-slate-500">Met à jour l'onglet Joueur interne avec la vue GM (Fog, Grille, Pions).</p>
                    </div>
                </button>

                <div className="h-px bg-slate-800 my-1" />

                {/* Option 2: Monitors */}
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Moniteurs Détectés</h5>
                
                {displays.length === 0 ? (
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 text-center">
                        <p className="text-xs text-slate-500 italic">Aucun moniteur externe détecté.</p>
                    </div>
                ) : (
                    displays.map(display => (
                        <button
                            key={display.id}
                            onClick={() => handleProjectToMonitor(display.id)}
                            className="flex items-center gap-4 p-4 bg-slate-800/40 hover:bg-slate-800/60 border border-gray-700/50 rounded-xl transition-all group text-left"
                        >
                            <div className="w-12 h-12 rounded-lg bg-slate-700/30 flex items-center justify-center text-slate-400 group-hover:text-gm-cyan transition-colors">
                                <Monitor size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-100">{display.label}</h4>
                                <p className="text-xs text-slate-500">Ouvrir une fenêtre de projection plein écran sur ce moniteur.</p>
                            </div>
                            <ExternalLink size={16} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default MapProjectionModal;
