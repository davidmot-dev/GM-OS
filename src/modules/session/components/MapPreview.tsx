import React from 'react';
import { useMapStore } from '../../map/useMapStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { ResolvedImage } from '../../../components/ResolvedImage';
import { Layers, ZoomIn, MapPin } from 'lucide-react';

const MapPreview: React.FC = () => {
    const { mapUrl, isVideo } = useMapStore();
    const { setActiveModule } = useSessionStore();
    const resolvedMapUrl = useMediaUrl(mapUrl || undefined);

    return (
        <div className="h-64 bg-slate-800/40 rounded-xl border border-slate-800 overflow-hidden relative group">
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-10" />

            {/* Labels */}
            <div className="absolute bottom-4 left-4 z-20">
                <h5 className="text-slate-100 font-bold tracking-tight">
                    {mapUrl ? 'Current Tactical Map' : 'No Map Active'}
                </h5>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <MapPin size={12} />
                    <span>{mapUrl ? 'Sector 7G • Underdark Region' : 'Connect a map via Map OS'}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button
                    onClick={() => setActiveModule('map')}
                    className="bg-slate-900/80 backdrop-blur-md p-2 rounded-lg text-slate-300 hover:text-gm-gold transition-all hover:scale-105 active:scale-95" title="Zoom"
                >
                    <ZoomIn size={18} />
                </button>
                <button
                    onClick={() => setActiveModule('map')}
                    className="bg-slate-900/80 backdrop-blur-md p-2 rounded-lg text-slate-300 hover:text-gm-gold transition-all hover:scale-105 active:scale-95" title="Layers"
                >
                    <Layers size={18} />
                </button>
            </div>

            {/* Media Rendering */}
            <div className="w-full h-full relative z-0 overflow-hidden flex items-center justify-center">
                {resolvedMapUrl ? (
                    <>
                        {isVideo ? (
                            <video
                                src={resolvedMapUrl}
                                autoPlay
                                loop
                                muted
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div
                                className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url('${resolvedMapUrl}')` }}
                            />
                        )}
                        
                        {/* Minimized Token Layer */}
                        <div className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                            {useMapStore.getState().tokens.map(token => (
                                <div 
                                    key={token.id}
                                    className="absolute rounded-full border border-white/40 shadow-lg bg-slate-900 overflow-hidden"
                                    style={{ 
                                        left: `${(token.x / 1000) * 100}%`, // Absolute fallback or relative? 
                                        top: `${(token.y / 1000) * 100}%`,
                                        width: '40px', height: '40px',
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                     <ResolvedImage src={token.avatar} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center opacity-50">
                        <span className="text-slate-500 font-bold tracking-widest uppercase text-xs">Waiting for Projection</span>
                    </div>
                )}
            </div>
        </div>
    );
};


export default MapPreview;
