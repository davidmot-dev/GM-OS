import React from 'react';
import { motion } from 'framer-motion';
import { ResolvedImage } from '../ResolvedImage';
import { VoiceReactiveAvatar } from './VoiceReactiveAvatar';

interface HubProjectionCardProps {
    src?: string;
    entity?: {
        id: string;
        name: string;
        type?: string;
        avatar?: string;
        imageUrl?: string;
        portraitUrl?: string;
        subtitle?: string;
    };
    count: number;
}

export const HubProjectionCard: React.FC<HubProjectionCardProps> = ({ 
    src, 
    entity,
    count 
}) => {
    // Determine image and name
    const finalSrc = src || entity?.avatar || entity?.imageUrl || entity?.portraitUrl;
    const finalName = entity?.name;
    const isVoiceReactive = !!entity && (entity.type === 'NPC' || entity.type === 'PNJ' || entity.type === 'Oracle');
    const subtitle = entity?.subtitle || entity?.type;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`relative bg-app-surface/90 backdrop-blur-3xl border-2 border-accent/40 rounded-[2.5rem] p-6 shadow-[0_0_80px_rgba(var(--accent-rgb),0.3)] flex flex-col gap-6 w-full group overflow-hidden ${count > 1 ? 'md:col-span-1' : 'md:max-w-2xl'}`}
        >
            {/* Header Label / Frequency UI */}
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                    <span className="text-xs font-black text-accent uppercase tracking-[0.4em]">Reception Visuelle</span>
                </div>
                <div className="flex items-center gap-2 text-app-text/30 font-mono text-ui-10">
                    <span className="hidden sm:inline">FRQ: 142.9 MHz</span>
                    <span className="hidden sm:inline h-3 w-px bg-app-border/40" />
                    <span>Sync: 6.3</span>
                </div>
            </div>

            {/* Image/Avatar Container */}
            <div className={`relative ${isVoiceReactive ? 'aspect-portrait sm:aspect-[3/4]' : 'aspect-square sm:aspect-video'} rounded-2xl overflow-hidden border border-accent/20 bg-black/60 shadow-inner flex items-center justify-center`}>
                {isVoiceReactive ? (
                    <div className="scale-110 sm:scale-125 w-full h-full flex items-center justify-center">
                        <VoiceReactiveAvatar 
                            imageUrl={finalSrc} 
                            name={finalName || 'Unknown'} 
                            type={entity?.type}
                        />
                    </div>
                ) : (
                    <ResolvedImage 
                        src={finalSrc} 
                        className="w-full h-full object-contain relative z-10" 
                    />
                )}
                
                {/* Premium Scanlines */}
                <div className="absolute inset-0 z-20 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_3px,4px_100%] opacity-30" />
                
                {/* Cinematic Grain */}
                <div className="absolute inset-0 z-20 pointer-events-none opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

                {/* Ambient Blur behind */}
                {!isVoiceReactive && (
                    <div className="absolute inset-0 z-0 opacity-40 blur-3xl scale-125">
                        <ResolvedImage src={finalSrc} className="w-full h-full object-cover" />
                    </div>
                )}
            </div>
            
            {/* Footer Info & Entity Name */}
            <div className="flex flex-col gap-3 px-2">
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent mb-1" />
                
                {finalName && (
                    <div className="flex flex-col items-center gap-1">
                        <div className="bg-accent/10 border border-accent/30 px-6 py-1.5 rounded-full shadow-glow-accent/20">
                            <p className="text-sm font-black text-accent uppercase tracking-[0.3em] text-center">
                                {finalName}
                            </p>
                        </div>
                        {subtitle && (
                            <p className="text-ui-10 font-bold text-app-text/40 uppercase tracking-[0.5em] mt-1">{subtitle}</p>
                        )}
                    </div>
                )}
                
                <p className="text-ui-10 text-center font-bold text-accent/50 uppercase tracking-[0.2em] opacity-60">
                    Projection {isVoiceReactive ? 'Interface-OS' : 'Image-OS'} Active
                </p>
            </div>
        </motion.div>
    );
};
