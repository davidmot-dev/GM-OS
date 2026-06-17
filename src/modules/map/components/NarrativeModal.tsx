import React from 'react';
import { BookOpen, Copy, Check } from 'lucide-react';
import { useNarrativeGenerator } from '../hooks/useNarrativeGenerator';
import { useModalStore } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';
import { useTranslation } from 'react-i18next';

const NarrativeModal: React.FC = () => {
    const { t } = useTranslation(['modules', 'common']);
    const { defaultValue, closeModal } = useModalStore();
    const { addToJournal } = useNarrativeGenerator();
    const [copied, setCopied] = React.useState(false);
    
    const narrative = defaultValue as string;

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(narrative);
        setCopied(true);
        gmToast(t('map.narrative.copied'));
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddToJournal = () => {
        addToJournal(narrative);
        gmToast(t('map.narrative.addedToJournal'));
        closeModal();
    };

    if (!narrative) return null;

    return (
        <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-slate-950/50 border border-indigo-500/20 rounded-2xl p-8 backdrop-blur-sm">
                            <p className="text-slate-200 text-lg leading-relaxed font-serif italic whitespace-pre-wrap">
                                {narrative}
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button
                            onClick={handleCopyToClipboard}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all active:scale-95 border border-slate-700"
                        >
                            {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                            <span>{t('map.narrative.copyButton')}</span>
                        </button>
                        
                        <button
                            onClick={handleAddToJournal}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-600/20 border border-indigo-400/30"
                        >
                            <BookOpen size={18} />
                            <span>{t('map.narrative.journalButton')}</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="px-6 py-3 bg-slate-950/50 border-t border-indigo-500/10 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('map.narrative.footer')}</span>
            </div>
        </div>
    );
};

export default NarrativeModal;
