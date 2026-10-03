import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Shield, HelpCircle, FileText } from 'lucide-react';
import TexteMarkdown from '../TexteMarkdown';

interface HubRuleViewerProps {
    rule: {
        title: string;
        content: string;
        category?: string;
    } | null;
    onClose: () => void;
}

export const HubRuleViewer: React.FC<HubRuleViewerProps> = ({ rule, onClose }) => {
    if (!rule) return null;

    const getIcon = () => {
        switch (rule.category) {
            case 'rule': return <Shield className="text-gm-gold" size={24} />;
            case 'memory': return <BookOpen className="text-gm-violet" size={24} />;
            case 'scenario': return <HelpCircle className="text-gm-emerald" size={24} />;
            default: return <FileText className="text-app-muted" size={24} />;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-app-bg/80 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-app-bg border border-app-border/50 rounded-[2rem] w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-app-border/30 flex items-center justify-between bg-app-surface-2/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-app-surface-2/50 border border-app-border/50 shadow-inner">
                                {getIcon()}
                            </div>
                            <div>
                                <span className="text-ui-10 font-black text-app-muted uppercase tracking-[0.3em] block mb-1">
                                    Transmission de Données
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black text-app-text uppercase tracking-tightest leading-none">
                                    {rule.title}
                                </h2>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 rounded-full hover:bg-app-text/10 text-app-muted hover:text-app-text transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar text-app-text leading-relaxed">
                        <div className="prose prose-invert prose-slate max-w-none 
                            prose-headings:text-app-text prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                            prose-p:text-lg prose-p:leading-relaxed
                            prose-strong:text-gm-gold prose-strong:font-black
                            prose-code:text-gm-cyan prose-code:bg-gm-cyan/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                            prose-ul:list-disc prose-ul:pl-6
                            prose-li:my-2">
                            <TexteMarkdown>{rule.content}</TexteMarkdown>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-app-border/30 flex justify-center bg-app-surface-2/10">
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 rounded-full bg-app-surface-2 border border-app-border text-app-text font-bold uppercase tracking-widest hover:bg-app-surface-2 hover:text-app-text transition-all shadow-lg active:scale-95"
                        >
                            Compris, Fermer
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
