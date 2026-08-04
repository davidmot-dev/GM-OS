import React, { useEffect, useState } from 'react';
import { useSoundStore } from './useSoundStore';
import SoundPad from './components/SoundPad';
import AtmosphereManager from './components/AtmosphereManager';
import SoundHeader from './components/SoundHeader';
import { useMidiControls } from './useMidiControls';
import { useKeyboardControls } from './useKeyboardControls';
import { soundEngine } from './SoundEngine';
import { MediaBrowser } from '../../components/MediaBrowser';
import { useMediaStore } from '../../stores/useMediaStore';

const SoundDashboard: React.FC = () => {
    const store = useSoundStore();
    const activeAtmos = store.atmospheres.find(a => a.id === store.activeAtmosphereId) || store.atmospheres[0];
    const pads = Object.values(activeAtmos.pads).sort((a, b) => a.id.localeCompare(b.id));

    // Initialize Global Input Listeners
    useMidiControls();
    useKeyboardControls();

    useEffect(() => {
        // Sync engine output device on mount
        soundEngine.setOutputDevice(store.outputDeviceId);
    }, [store.outputDeviceId]);

    const [assignmentTarget, setAssignmentTarget] = useState<{ padId: string, atmosphereId: string } | null>(null);


    const handleAssignMedia = (padId: string) => {
        setAssignmentTarget({ padId, atmosphereId: store.activeAtmosphereId || activeAtmos.id });
    };

    const handleMediaSelect = (mediaId: string) => {
        if (!assignmentTarget) return;

        const { mediaList } = useMediaStore.getState();
        const media = mediaList.find(m => m.id === mediaId);
        
        if (media) {
            store.setPadFile(
                assignmentTarget.padId, 
                mediaId, 
                media.name, 
                assignmentTarget.atmosphereId
            );
        }
        
        setAssignmentTarget(null);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden font-sans bg-app-bg text-slate-50 p-6 space-y-6">
            <MediaBrowser
                isOpen={!!assignmentTarget}
                onClose={() => {
                    setAssignmentTarget(null);
                }}
                onSelect={handleMediaSelect}
                allowedTypes={['audio']}
                title="Choisir un Son"
            />
            
            <SoundHeader />


            {/* Main Area - Grid and Mixer space */}
            <main className="flex-1 flex flex-col min-h-0 bg-app-surface/20 backdrop-blur-sm rounded-3xl border border-app-border/50 overflow-hidden shadow-2xl">
                <div className="px-8 pt-6">
                    <AtmosphereManager />
                </div>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 w-full h-full content-start">
                        {pads.map(pad => (
                            <SoundPad 
                                key={pad.id} 
                                pad={pad} 
                                onAssignMedia={handleAssignMedia} 
                            />
                        ))}
                    </div>
                </div>

                {/* Optional: Footer with small stats or indicator */}
                <footer className="h-10 px-8 border-t border-app-border/50 flex items-center justify-between text-[10px] text-app-text/50 font-black uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <div className="size-1.5 rounded-full bg-accent shadow-glow-accent animation-pulse" />
                             <span>{pads.filter(p => p.isActive).length} ACTIVE CHANNELS</span>
                        </div>
                    </div>
                    <div>GM-OS SOUND ENGINE v{__APP_VERSION__}</div>
                </footer>
            </main>
        </div>
    );
};

export default SoundDashboard;
