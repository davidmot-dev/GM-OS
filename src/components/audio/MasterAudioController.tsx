import React from 'react';
import { Volume2, VolumeX, Mic, Zap } from 'lucide-react';
import { useAudioMasterStore } from '../../stores/useAudioMasterStore';
import { useSessionStore } from '../../store/useSessionStore';

const MasterAudioController: React.FC = () => {
    const { 
        masterVolume, 
        setMasterVolume, 
        isFocusMode, 
        toggleFocusMode 
    } = useAudioMasterStore();
    const { theme } = useSessionStore();

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMasterVolume(parseFloat(e.target.value));
    };

    return (
        <div className={`flex items-center gap-6 px-6 py-2 border shadow-2xl group transition-all duration-300 ${
            theme === 'medieval' 
                ? 'bg-app-surface/90 border-app-border/60 rounded-lg' 
                : 'bg-app-surface/40 backdrop-blur-xl border-app-border/30 rounded-2xl hover:border-accent/40'
        }`}>
            {/* Master Volume Slider */}
            <div className={`flex items-center gap-3 min-w-[180px] p-2 ${
                theme === 'medieval' ? 'bg-black/20 rounded border border-app-border/30' : ''
            }`}>
                <button 
                    onClick={() => setMasterVolume(masterVolume === 0 ? 1 : 0)}
                    className={`transition-colors ${theme === 'medieval' ? 'text-accent' : 'text-app-text/60 hover:text-accent'}`}
                >
                    {masterVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={masterVolume} 
                    onChange={handleVolumeChange}
                    className={`w-full h-1.5 appearance-none cursor-pointer accent-accent ${
                        theme === 'medieval' ? 'bg-app-bg' : 'bg-app-bg/50 rounded-lg'
                    }`}
                />
                
                <span className="text-[10px] font-mono text-app-text/40 w-8 text-right">
                    {Math.round(masterVolume * 100)}%
                </span>
            </div>

            {/* Focus Chat Button */}
            <button
                onClick={toggleFocusMode}
                className={`flex items-center gap-2.5 px-4 py-2 border transition-all duration-500 relative overflow-hidden group/btn ${
                    theme === 'medieval' ? 'rounded-md' : 'rounded-xl'
                } ${
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
