import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Shield, HelpCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
            case 'rule': return <Shield className="text-amber-400" size={24} />;
            case 'memory': return <BookOpen className="text-indigo-400" size={24} />;
            case 'scenario': return <HelpCircle className="text-emerald-400" size={24} />;
            default: return <FileText className="text-slate-400" size={24} />;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-slate-900 border border-slate-700/50 rounded-[2rem] w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-slate-700/30 flex items-center justify-between bg-slate-800/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 shadow-inner">
                                {getIcon()}
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-1">
                                    Transmission de Données
                                </span>
                                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tightest leading-none">
                                    {rule.title}
                                </h2>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar text-slate-300 leading-relaxed">
                        <div className="prose prose-invert prose-slate max-w-none 
                            prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight
                            prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                            prose-p:text-lg prose-p:leading-relaxed
                            prose-strong:text-amber-400 prose-strong:font-black
                            prose-code:text-cyan-400 prose-code:bg-cyan-950/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                            prose-ul:list-disc prose-ul:pl-6
                            prose-li:my-2">
                            <ReactMarkdown>{rule.content}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-700/30 flex justify-center bg-slate-800/10">
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            Compris, Fermer
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
