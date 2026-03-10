import React, { useEffect } from 'react';
import { Monitor, Cast, ExternalLink } from 'lucide-react';
import { useImageStore } from '../../image/useImageStore';
import { useWhiteboardStore } from '../useWhiteboardStore';
import { useModalStore } from '../../../stores/useModalStore';

const WhiteboardProjectionModal: React.FC = () => {
    const { displays, fetchDisplays } = useImageStore();
    const { clearProjectedState } = useWhiteboardStore();
    const { closeModal } = useModalStore();

    useEffect(() => {
        if (window.appBridge?.image?.getDisplays) {
            fetchDisplays();
        }
    }, [fetchDisplays]);

    const handleProjectToHub = () => {
        // Exclusivity: stop monitor projection if any
        if (window.appBridge?.image?.closeAllDisplays) {
            window.appBridge.image.closeAllDisplays();
        }
        
        useWhiteboardStore.setState({ projectionTarget: 'hub' });
        closeModal();
    };

    const handleProjectToMonitor = (displayId: string) => {
        const bridge = window.appBridge;
        if (bridge?.image?.launchDisplay) {
            // Stop Hub projection (Exclusivity)
            clearProjectedState();

            // Set projectionTarget to 'monitor'
            useWhiteboardStore.setState({ projectionTarget: 'monitor' });

            // Signal whiteboard mode to the projector window
            bridge.image.launchDisplay(['__whiteboard__'], displayId);
        }
        closeModal();
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-app-text/60 mb-2">
                Choisissez la destination pour projeter le Whiteboard :
            </p>

            <div className="grid grid-cols-1 gap-3">
                {/* Option 1: Player Hub */}
                <button
                    onClick={handleProjectToHub}
                    className="flex items-center gap-4 p-4 bg-accent/20 hover:bg-accent/30 border border-accent/20 rounded-xl transition-all group text-left"
                >
                    <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                        <Cast size={24} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-app-text">Synchroniser Player Hub</h4>
                        <p className="text-xs text-app-text/40">Affiche le Whiteboard sur l'onglet Joueur interne (Dessin collaboratif).</p>
                    </div>
                </button>

                <div className="h-px bg-app-border/20 my-1" />

                {/* Option 2: Monitors */}
                <h5 className="text-[10px] font-black uppercase tracking-widest text-app-text/40 px-1">Moniteurs Détectés</h5>
                
                {displays.length === 0 ? (
                    <div className="p-4 bg-app-surface/50 rounded-xl border border-dashed border-app-border text-center">
                        <p className="text-xs text-app-text/40 italic">Aucun moniteur externe détecté.</p>
                    </div>
                ) : (
                    displays.map(display => (
                        <button
                            key={display.id}
                            onClick={() => handleProjectToMonitor(display.id)}
                            className="flex items-center gap-4 p-4 bg-app-surface/40 hover:bg-app-surface/60 border border-app-border rounded-xl transition-all group text-left"
                        >
                            <div className="w-12 h-12 rounded-lg bg-app-surface/30 flex items-center justify-center text-app-text/60 group-hover:text-accent transition-colors">
                                <Monitor size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-app-text">{display.label}</h4>
                                <p className="text-xs text-app-text/40">Projeter le Whiteboard en plein écran sur ce moniteur.</p>
                            </div>
                            <ExternalLink size={16} className="text-app-text/20 group-hover:text-app-text/40 transition-colors" />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default WhiteboardProjectionModal;
