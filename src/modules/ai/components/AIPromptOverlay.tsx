import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Wand2, RefreshCw } from 'lucide-react';

interface AIPromptOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => void;
    title?: string;
    placeholder?: string;
    suggestions?: string[];
    isGenerating?: boolean;
}

const AIPromptOverlay: React.FC<AIPromptOverlayProps> = ({
    isOpen,
    onClose,
    onGenerate,
    title = "IA Image Prompt",
    placeholder = "Décrivez l'image avec précision (ex: avec une cicatrice, éclairage dramatique...)",
    suggestions = [
        "Style Peinture à l'huile",
        "Éclairage Cinématique",
        "Ultra-détaillé",
        "Ambiance sombre et brumeuse",
        "Traits héroïques"
    ],
    isGenerating = false
}) => {
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (inputValue.trim() || !isGenerating) {
            onGenerate(inputValue.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleSubmit();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            {/* Backdrop Blur */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer" 
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-app-surface/90 border border-accent/30 rounded-3xl shadow-[0_0_50px_rgba(var(--color-accent),0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-app-border/50 flex items-center justify-between bg-accent/5">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-accent animate-pulse" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-app-text">{title}</h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-app-text/40 hover:text-white transition-colors hover:rotate-90 duration-300"
                        title="Fermer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="relative">
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={isGenerating}
                            className="w-full h-32 bg-black/40 border border-app-border/50 rounded-2xl p-4 text-sm text-app-text/90 focus:border-accent/50 outline-none transition-all resize-none font-sans leading-relaxed custom-scrollbar placeholder:text-app-text/20"
                        />
                        <div className="absolute bottom-3 right-4 text-[9px] font-bold text-app-text/20 uppercase tracking-widest pointer-events-none">
                            Ctrl + Enter pour lancer
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40 flex items-center gap-1.5">
                            <Wand2 size={10} className="text-accent" /> Suggestions
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInputValue(prev => prev ? `${prev}, ${s}` : s)}
                                    disabled={isGenerating}
                                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-app-text/60 hover:border-accent/30 hover:text-accent transition-all active:scale-95"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-black/20 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-app-border text-app-text/40 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isGenerating}
                        className={`flex-[2] py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all shadow-glow-accent ${
                            isGenerating 
                            ? 'bg-accent/20 text-accent cursor-not-allowed' 
                            : 'bg-accent text-slate-950 hover:scale-[1.02] active:scale-[0.98]'
                        }`}
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw size={14} className="animate-spin" />
                                Génération en cours...
                            </>
                        ) : (
                            <>
                                <Send size={14} />
                                Lancer la création
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIPromptOverlay;
