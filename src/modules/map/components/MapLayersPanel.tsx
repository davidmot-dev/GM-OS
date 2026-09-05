import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMapStore } from '../useMapStore';
import { 
    Eye, EyeOff, Layers, 
    Grid, Users, Zap, AlertTriangle, CloudRain, Sun 
} from 'lucide-react';
import type { LayerId } from '../types';

const MapLayersPanel: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { layerVisibility, toggleLayer } = useMapStore();

    const layers: { id: LayerId; label: string; icon: React.ReactNode }[] = [
        { id: 'fog', label: t('map.sidebar.layers.fog'), icon: <Layers className="w-4 h-4 text-slate-400" /> },
        { id: 'grid', label: t('map.sidebar.layers.grid'), icon: <Grid className="w-4 h-4 text-blue-400" /> },
        { id: 'tokens', label: t('map.sidebar.layers.tokens'), icon: <Users className="w-4 h-4 text-green-400" /> },
        { id: 'magic', label: t('map.sidebar.layers.magic'), icon: <Zap className="w-4 h-4 text-purple-400" /> },
        { id: 'danger', label: t('map.sidebar.layers.danger'), icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
        { id: 'weather', label: t('map.sidebar.layers.weather'), icon: <CloudRain className="w-4 h-4 text-sky-400" /> },
        { id: 'ambiance', label: t('map.sidebar.layers.ambiance'), icon: <Sun className="w-4 h-4 text-amber-400" /> },
    ];

    return (
        <div className="flex flex-col gap-2 p-3 bg-obsidian-dark/40 rounded-lg border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1 px-1">
                <Layers className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('map.sidebar.layers.title')}</h3>
            </div>
            
            <div className="space-y-1">
                {layers.map((layer) => (
                    <button
                        key={layer.id}
                        onClick={() => toggleLayer(layer.id)}
                        className={`w-full flex items-center justify-between group px-2 py-1.5 rounded transition-all duration-200 ${
                            layerVisibility[layer.id] 
                                ? 'bg-white/5 hover:bg-white/10 text-slate-200' 
                                : 'bg-transparent hover:bg-white/5 text-slate-500'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {layer.icon}
                            <span className="text-sm font-medium">{layer.label}</span>
                        </div>
                        
                        {layerVisibility[layer.id] ? (
                            <Eye className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                        ) : (
                            <EyeOff className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        )}
                    </button>
                ))}
            </div>
            
            <div className="mt-2 pt-2 border-t border-white/5 text-ui-10 text-slate-500 italic text-center">
                {t('map.sidebar.layers.footer')}
            </div>
        </div>
    );
};

export default MapLayersPanel;
