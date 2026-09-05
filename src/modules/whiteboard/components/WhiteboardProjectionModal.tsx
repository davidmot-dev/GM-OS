import React, { useEffect } from 'react';
import { Monitor, Cast, ExternalLink } from 'lucide-react';
import { useImageStore } from '../../image/useImageStore';
import { useWhiteboardStore } from '../useWhiteboardStore';
import { useModalStore } from '../../../stores/useModalStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';
import { useTranslation } from 'react-i18next';
import { claimProjection } from '../../../services/projectionExclusivity';

const WhiteboardProjectionModal: React.FC = () => {
    const { displays, fetchDisplays } = useImageStore();
    const { clearProjectedState } = useWhiteboardStore();
    const { closeModal } = useModalStore();
    const { getDisplayLabel } = useHardwareStore();
    const { t } = useTranslation('modules');

    useEffect(() => {
        if (window.appBridge?.image?.getDisplays) {
            fetchDisplays();
        }
    }, [fetchDisplays]);

    const handleProjectToHub = () => {
        // La carte et le tableau ne cohabitent pas : c'est ici que manquait la
        // règle. Fermer les écrans physiques ne coupait que le tableau lui-même,
        // et laissait la carte projetée dessous.
        claimProjection('whiteboard');

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
            claimProjection('whiteboard');

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
                {t('whiteboard.projection.choose_dest')}
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
                        <h4 className="font-bold text-app-text">{t('whiteboard.projection.sync_hub')}</h4>
                        <p className="text-xs text-app-text/40">{t('whiteboard.projection.sync_hub_desc')}</p>
                    </div>
                </button>

                <div className="h-px bg-app-border/20 my-1" />

                {/* Option 2: Monitors */}
                <h5 className="text-ui-10 font-black uppercase tracking-widest text-app-text/40 px-1">{t('whiteboard.projection.monitors_detected')}</h5>
                
                {displays.length === 0 ? (
                    <div className="p-4 bg-app-surface/50 rounded-xl border border-dashed border-app-border text-center">
                        <p className="text-xs text-app-text/40 italic">{t('whiteboard.projection.no_monitor')}</p>
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
                                <h4 className="font-bold text-app-text">{getDisplayLabel(display.id)}</h4>
                                <p className="text-xs text-app-text/40">{t('whiteboard.projection.project_monitor_desc')}</p>
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
