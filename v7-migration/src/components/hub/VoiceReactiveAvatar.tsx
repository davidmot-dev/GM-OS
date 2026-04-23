import React from 'react';
import { useSyncStore } from '../../stores/useSyncStore';
import { ResolvedImage } from '../ResolvedImage';

interface VoiceReactiveAvatarProps {
    imageUrl: string | undefined;
    name: string;
    type?: string;
    isPerformanceLimited?: boolean;
}

export const VoiceReactiveAvatar: React.FC<VoiceReactiveAvatarProps> = ({ 
    imageUrl, 
    name, 
    type, 
    isPerformanceLimited 
}) => {
    const voiceLevel = useSyncStore(state => state.voiceLevel);

    // Dynamic styles driven by voiceLevel
    // If performance is limited, we scale less and remove the expensive shadow glow
    const voiceStyles = {
        '--voice-scale': voiceLevel > 0.05 ? 1 + (voiceLevel * 0.1) : 1,
        '--voice-glow-opacity': voiceLevel > 0.05 ? voiceLevel : 0,
        transform: isPerformanceLimited ? 'none' : `scale(var(--voice-scale))`,
        boxShadow: (isPerformanceLimited || voiceLevel <= 0.05) 
            ? 'none' 
            : `0 0 ${voiceLevel * 30}px rgba(6, 182, 212, ${voiceLevel})`
    } as React.CSSProperties;

    return (
        <div 
            className={`${type === 'Oracle' ? 'w-full aspect-[2/3] max-h-[75vh]' : 'size-28 md:size-40'} rounded-2xl overflow-hidden border-2 border-accent/20 shadow-glow-accent bg-app-surface group-hover:border-accent/50 transition-all scale-100 group-hover:scale-105 relative`}
            style={voiceStyles}
        >
            <ResolvedImage 
                src={imageUrl} 
                className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110" 
            />
            <ResolvedImage 
                src={imageUrl} 
                alt={name} 
                className={`relative z-10 w-full h-full ${type === 'Oracle' ? 'object-contain' : 'object-cover'}`} 
            />
        </div>
    );
};
