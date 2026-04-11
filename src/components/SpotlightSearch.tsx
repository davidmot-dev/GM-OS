import React, { useRef, useEffect } from 'react';
import { 
  Search, 
  CornerDownLeft, 
  X, 
  Sparkles, 
  User, 
  Music, 
  Book, 
  Settings 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSpotlight, type SpotlightResult } from '../hooks/useSpotlight';

export const SpotlightSearch: React.FC = () => {
    const { 
        isOpen, 
        setIsOpen, 
        query, 
        setQuery, 
        results, 
        selectedIndex, 
        setSelectedIndex 
    } = useSpotlight();

    const { t } = useTranslation(['common']);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
        }
    }, [isOpen, setQuery]);

    // Keep selected item in view
    useEffect(() => {
        if (scrollRef.current && selectedIndex >= 0) {
            const selectedElement = scrollRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 pointer-events-none"
            onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
            }}
        >
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-md pointer-events-auto"
                onClick={() => setIsOpen(false)}
            />

            {/* Content Container */}
            <div className="relative w-full max-w-2xl bg-slate-900/90 border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden pointer-events-auto flex flex-col animate-in fade-in zoom-in duration-200 glass-panel">
                
                {/* Search Header */}
                <div className="flex items-center px-4 py-4 border-b border-slate-800 bg-slate-800/30">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('common:spotlight.placeholder')}
                        className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder:text-slate-500 text-lg"
                    />
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-[10px] text-slate-400 font-medium">
                            ESC
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            title={t('common:spotlight.close_tooltip')}
                            className="p-1 hover:bg-slate-700 rounded-md transition-colors text-slate-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div 
                    ref={scrollRef}
                    className="max-h-[60vh] overflow-y-auto py-2 custom-scrollbar"
                >
                    {results.length > 0 ? (
                        results.map((result, index) => (
                            <ResultItem 
                                key={result.id}
                                result={result}
                                isSelected={index === selectedIndex}
                                onSelect={() => result.action()}
                                onHover={() => setSelectedIndex(index)}
                            />
                        ))
                    ) : query.trim() ? (
                        <div className="px-6 py-12 text-center">
                            <Search className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                            <p className="text-slate-400 text-lg font-medium">{t('common:spotlight.no_results', { query })}</p>
                            <p className="text-slate-500 text-sm mt-1">{t('common:spotlight.no_results_sub')}</p>
                        </div>
                    ) : (
                        <div className="px-4 py-3 space-y-4">
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-2">{t('common:spotlight.suggestions')}</div>
                            <div className="grid grid-cols-2 gap-2">
                                <QuickTip icon={User} label={t('common:spotlight.quick_tips.npcs')} />
                                <QuickTip icon={Music} label={t('common:spotlight.quick_tips.audio')} />
                                <QuickTip icon={Book} label={t('common:spotlight.quick_tips.wiki')} />
                                <QuickTip icon={Settings} label={t('common:spotlight.quick_tips.system')} />
                            </div>
                            <div className="flex items-center justify-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-800/10">
                                <div className="text-center">
                                    <Sparkles className="w-5 h-5 text-accent mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">{t('common:spotlight.shortcut_hint_prefix')}<span className="text-slate-200 font-bold">CMD+K</span>{t('common:spotlight.shortcut_hint_suffix')} </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer / Shortcuts */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950/40 border-t border-slate-800 text-[10px] text-slate-500">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="flex items-center px-1 py-0.5 rounded border border-slate-800 bg-slate-900 mr-1.5 font-mono">↑↓</div>
                            <span>{t('common:spotlight.nav_hint')}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="flex items-center px-1 py-0.5 rounded border border-slate-800 bg-slate-900 mr-1.5 font-mono">ENTER</div>
                            <span>{t('common:spotlight.select_hint')}</span>
                        </div>
                    </div>
                    <div className="flex items-center font-medium text-slate-400">
                        GM-OS <span className="text-accent ml-1 italic">Spotlight</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResultItem: React.FC<{ 
    result: SpotlightResult; 
    isSelected: boolean;
    onSelect: () => void;
    onHover: () => void;
}> = ({ result, isSelected, onSelect, onHover }) => {
    const { t } = useTranslation(['common']);
    const Icon = result.icon;
    
    return (
        <div 
            onClick={onSelect}
            onMouseEnter={onHover}
            className={`
                flex items-center px-4 py-3 cursor-pointer transition-all duration-150
                ${isSelected ? 'bg-accent/10 border-l-2 border-accent' : 'bg-transparent border-l-2 border-transparent hover:bg-slate-800/40'}
            `}
        >
            <div className={`
                p-2 rounded-lg mr-4 transition-colors
                ${isSelected ? 'bg-accent text-slate-900' : 'bg-slate-800 text-slate-400'}
            `}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${isSelected ? 'text-accent' : 'text-slate-200'}`}>
                    {result.title}
                </div>
                {result.subtitle && (
                    <div className="text-[11px] text-slate-500 truncate mt-0.5 italic">
                        {result.subtitle}
                    </div>
                )}
            </div>
            {isSelected && (
                <div className="flex items-center text-accent/50 animate-pulse">
                    <span className="text-[10px] font-bold mr-2 uppercase tracking-tighter">{t('common:spotlight.open_hint')}</span>
                    <CornerDownLeft className="w-3 h-3" />
                </div>
            )}
        </div>
    );
};

const QuickTip: React.FC<{ icon: any; label: string }> = ({ icon: Icon, label }) => (
    <div className="flex items-center p-2 rounded-lg bg-slate-800/30 border border-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all cursor-default">
        <Icon className="w-4 h-4 mr-2" />
        <span className="text-[11px] font-medium">{label}</span>
    </div>
);
