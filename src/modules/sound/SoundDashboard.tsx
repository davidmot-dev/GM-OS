import React, { useEffect, useState } from 'react';
import { useSoundStore } from './useSoundStore';
import SoundPad from './components/SoundPad';
import SoundHeader from './components/SoundHeader';
import AtmosphereManager from './components/AtmosphereManager';
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

    const [isBrowserOpen, setIsBrowserOpen] = useState(false);
    const [selectedPadId, setSelectedPadId] = useState<string | null>(null);
    const { mediaList: storeMediaList } = useMediaStore();

    const handleAssignMedia = (padId: string) => {
        setSelectedPadId(padId);
        setIsBrowserOpen(true);
    };

    const handleMediaSelect = (mediaId: string) => {
        const media = storeMediaList.find(m => m.id === mediaId);
        if (!media || !selectedPadId) return;

        store.setPadFile(selectedPadId, mediaId, media.name);
        setIsBrowserOpen(false);
        setSelectedPadId(null);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden font-sans bg-obsidian-dark text-slate-50 p-6 space-y-6">
            <MediaBrowser
                isOpen={isBrowserOpen}
                onClose={() => {
                    setIsBrowserOpen(false);
                    setSelectedPadId(null);
                }}
                onSelect={handleMediaSelect}
                allowedTypes={['audio']}
                title="Choisir un Son"
            />
            
            <SoundHeader />

            {/* Main Area - Grid and Mixer space */}
            <main className="flex-1 flex flex-col min-h-0 bg-black/20 backdrop-blur-sm rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="px-8 pt-6">
                    <AtmosphereManager />
                </div>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 w-full h-full content-start">
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
                <footer className="h-10 px-8 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                             <div className="size-1.5 rounded-full bg-gm-violet shadow-glow-violet animation-pulse" />
                             <span>{pads.filter(p => p.isActive).length} ACTIVE CHANNELS</span>
                        </div>
                    </div>
                    <div>GM-OS SOUND ENGINE v5.0.4</div>
                </footer>
            </main>
        </div>
    );
};

export default SoundDashboard;
