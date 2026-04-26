import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, ChevronRight, RefreshCw } from 'lucide-react';
import { useBrainstormStore } from '../store/useBrainstormStore';

const DiscoveryUI: React.FC = () => {
  const { t } = useTranslation(['modules']);
  const { candidates, isProcessing, startDiscovery, setSubject } = useBrainstormStore();

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-8 animate-in fade-in">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400 animate-pulse" size={32} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black uppercase tracking-widest text-purple-400 mb-2 font-display">{t('session.forge_module.atelier.discovery_processing')}</h3>
          <p className="text-app-text/40 text-xs uppercase tracking-widest animate-pulse">{t('session.forge_module.atelier.discovery_processing_sub')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30">
            <Sparkles className="text-purple-400" size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-app-text font-display">{t('session.forge_module.atelier.discovery_title')}</h3>
            <p className="text-xs text-app-text/40 uppercase tracking-widest">{t('session.forge_module.atelier.discovery_subtitle')}</p>
          </div>
        </div>
        
        <button 
          onClick={() => startDiscovery()}
          className="p-3 hover:bg-white/5 rounded-xl text-app-text/40 hover:text-purple-400 transition-all group"
          title={t('common:actions.refresh')}
        >
          <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {candidates.map((candidate, idx) => (
          <button
            key={idx}
            onClick={() => setSubject(candidate.title)}
            className="group relative bg-app-surface/60 border border-app-border/10 p-6 rounded-[2rem] text-left hover:border-purple-500/50 hover:bg-purple-500/5 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-6 shadow-xl"
          >
            <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors">
              <Zap className="text-purple-400" size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-black text-app-text mb-1 truncate font-display group-hover:text-purple-400 transition-colors">{candidate.title}</h4>
              <p className="text-[10px] text-app-text/40 uppercase tracking-widest font-bold">{t('session.forge_module.subtitle')}</p>
            </div>
            <ChevronRight className="text-app-text/20 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" size={20} />
            
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 blur-2xl rounded-full transition-opacity" />
          </button>
        ))}

        {candidates.length === 0 && (
          <div className="col-span-2 py-20 bg-app-surface/20 border-2 border-dashed border-app-border/10 rounded-[3rem] flex flex-col items-center justify-center text-center opacity-40 italic">
             <RefreshCw size={48} className="mb-4" />
             <p>{t('session.forge_module.atelier.discovery_empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoveryUI;
