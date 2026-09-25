import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Cast, ExternalLink } from 'lucide-react';
import { useImageStore } from '../../image/useImageStore';
import { projeterLaCarteSur } from '../projectionDeLaCarte';
import { useModalStore } from '../../../stores/useModalStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';

const MapProjectionModal: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { displays, fetchDisplays } = useImageStore();

    const { closeModal } = useModalStore();
    const { getDisplayLabel } = useHardwareStore();

    useEffect(() => {
        if (window.appBridge?.image?.getDisplays) {
            fetchDisplays();
        }
    }, [fetchDisplays]);

    /* Les deux gestes vivent dans `projectionDeLaCarte`, que le Storyboard
       emprunte aussi : une seule règle d'exclusivité pour les deux portes. */
    const handleProjectToHub = () => {
        projeterLaCarteSur('hub');
        closeModal();
    };

    const handleProjectToMonitor = (displayId: string) => {
        projeterLaCarteSur(displayId);
        closeModal();
    };

    return (
        <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-400 mb-2">
                {t('map.projection.title')}
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
                        <h4 className="font-bold text-slate-100">{t('map.projection.hub.title')}</h4>
                        <p className="text-xs text-slate-500">{t('map.projection.hub.desc')}</p>
                    </div>
                </button>

                <div className="h-px bg-app-border my-1" />

                {/* Option 2: Monitors */}
                <h5 className="text-ui-10 font-black uppercase tracking-widest text-slate-500 px-1">{t('map.projection.monitors.title')}</h5>
                
                {displays.length === 0 ? (
                    <div className="p-4 bg-app-bg/50 rounded-xl border border-dashed border-app-border text-center">
                        <p className="text-xs text-slate-500 italic">{t('map.projection.monitors.empty')}</p>
                    </div>
                ) : (
                    displays.map(display => (
                        <button
                            key={display.id}
                            onClick={() => handleProjectToMonitor(display.id)}
                            className="flex items-center gap-4 p-4 bg-app-surface/40 hover:bg-app-surface/60 border border-app-border/50 rounded-xl transition-all group text-left"
                        >
                            <div className="w-12 h-12 rounded-lg bg-app-bg/30 flex items-center justify-center text-slate-400 group-hover:text-accent transition-colors">
                                <Monitor size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-100">{getDisplayLabel(display.id)}</h4>
                                <p className="text-xs text-slate-500">{t('map.projection.monitors.desc')}</p>
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
