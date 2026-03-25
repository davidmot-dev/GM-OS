import React from 'react';
import { Volume2, VolumeX, Mic, Zap } from 'lucide-react';
import { useAudioMasterStore } from '../../stores/useAudioMasterStore';

const MasterAudioController: React.FC = () => {
    const { 
        masterVolume, 
        setMasterVolume, 
        isFocusMode, 
        toggleFocusMode 
    } = useAudioMasterStore();

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMasterVolume(parseFloat(e.target.value));
    };

    return (
        <div className="flex items-center gap-6 px-6 py-2 bg-app-surface/40 backdrop-blur-xl border border-app-border/30 rounded-2xl shadow-2xl group transition-all duration-300 hover:border-accent/40">
            {/* Master Volume Slider */}
            <div className="flex items-center gap-3 min-w-[180px]">
                <button 
                    onClick={() => setMasterVolume(masterVolume > 0 ? 0 : 1)}
                    className={`transition-colors duration-300 ${masterVolume === 0 ? 'text-red-500' : 'text-app-text/60 hover:text-accent'}`}
                >
                    {masterVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                
                <div className="relative flex-1 h-1.5 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.01"
                        value={masterVolume}
                        onChange={handleVolumeChange}
                        title="Volume Master"
                        className="w-full h-full bg-app-bg rounded-full appearance-none cursor-pointer accent-accent overflow-hidden"
                        style={{
                            background: `linear-gradient(to right, var(--app-accent) ${ (masterVolume / 1.5) * 100 }%, var(--app-surface) ${ (masterVolume / 1.5) * 100 }%)`
                        }}
                    />
                </div>
                
                <span className="text-[10px] font-mono text-app-text/40 w-8 text-right">
                    {Math.round(masterVolume * 100)}%
                </span>
            </div>

            {/* Focus Chat Button */}
            <button
                onClick={toggleFocusMode}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border transition-all duration-500 relative overflow-hidden group/btn ${
                    isFocusMode 
                    ? 'bg-accent/20 border-accent text-accent shadow-glow-accent' 
                    : 'bg-app-bg/50 border-app-border/50 text-app-text/40 hover:text-app-text/80 hover:border-app-text/30'
                }`}
            >
                {isFocusMode && (
                    <div className="absolute inset-0 bg-accent/10 animate-pulse" />
                )}
                
                <div className="relative z-10 flex items-center gap-2">
                    {isFocusMode ? (
                        <Zap size={16} className="animate-bounce" />
                    ) : (
                        <Mic size={16} className="group-hover/btn:scale-110 transition-transform" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {isFocusMode ? 'Focus ACTIVE' : 'Focus Chat'}
                    </span>
                </div>

                {/* Micro-animation indicator */}
                <div className={`w-1 h-1 rounded-full absolute right-2 top-2 ${isFocusMode ? 'bg-accent animate-ping' : 'bg-app-text/10'}`} />
            </button>
        </div>
    );
};

export default MasterAudioController;
