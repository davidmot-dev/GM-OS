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
        <div className="flex flex-col h-full bg-app-bg overflow-hidden">
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-gm-violet/20 to-gm-violet/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative bg-app-bg/50 border border-gm-violet/20 rounded-2xl p-8 backdrop-blur-sm">
                            <p className="text-app-text text-lg leading-relaxed font-serif italic whitespace-pre-wrap">
                                {narrative}
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button
                            onClick={handleCopyToClipboard}
                            className="flex items-center gap-2 px-6 py-3 bg-app-surface-2 hover:bg-app-surface-2 text-app-text font-bold rounded-xl transition-all active:scale-95 border border-app-border"
                        >
                            {copied ? <Check size={18} className="text-etat-succes" /> : <Copy size={18} />}
                            <span>{t('map.narrative.copyButton')}</span>
                        </button>
                        
                        <button
                            onClick={handleAddToJournal}
                            className="flex items-center gap-2 px-8 py-3 bg-gm-violet hover:bg-gm-violet/90 text-app-bg font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-gm-violet/20 border border-gm-violet/30"
                        >
                            <BookOpen size={18} />
                            <span>{t('map.narrative.journalButton')}</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="px-6 py-3 bg-app-bg/50 border-t border-gm-violet/10 text-center">
                <span className="text-ui-10 text-app-subtle uppercase font-bold tracking-widest">{t('map.narrative.footer')}</span>
            </div>
        </div>
    );
};

export default NarrativeModal;
