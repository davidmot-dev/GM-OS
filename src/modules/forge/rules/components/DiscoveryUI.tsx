import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, ChevronRight, RefreshCw, CheckCircle2, MinusCircle, HelpCircle } from 'lucide-react';
import { useBrainstormStore } from '../store/useBrainstormStore';
import ForgeProgress from './ForgeProgress';
import type { BrainstormCandidate } from '../types';

/**
 * La liste des sujets, telle que l'inventaire la rend.
 *
 * **Les treize sujets du canevas y figurent toujours**, y compris ceux que le
 * livre ne traite pas et ceux sur lesquels le carnet n'a rien répondu. C'est le
 * point : une absence invisible vaut une absence fausse, et un sujet qui
 * disparaît de la liste disparaît de la boucle.
 */

/** Le premier tag porte le traitement rendu par l'inventaire. */
function etat(candidate: BrainstormCandidate): 'non' | 'inconnu' | 'traite' {
  const marque = candidate.tags[0];
  if (marque === 'non') return 'non';
  if (!marque) return 'inconnu';
  return 'traite';
}

interface DiscoveryUIProps {
  /** Cesse d'attendre l'inventaire en cours. */
  onAbandon?: () => void;
  /** Forge la fiche du sujet retenu. La liste ne décide pas, elle propose. */
  onSelect: (candidate: BrainstormCandidate) => void;
}

const DiscoveryUI: React.FC<DiscoveryUIProps> = ({ onSelect, onAbandon }) => {
  const { t } = useTranslation(['modules']);
  const { candidates, isProcessing, startDiscovery, savedCandidateIds } = useBrainstormStore();

  const duCanevas = candidates.filter(c => !c.tags.includes('hors canevas'));
  const traites = duCanevas.filter(c => etat(c) === 'traite').length;

  // L'inventaire est une requête au carnet comme les autres : elle mérite le
  // même compteur, pour la même raison.
  if (isProcessing) {
    return (
      <ForgeProgress
        onAbandon={onAbandon}
        titre={t('session.forge_module.atelier.discovery_processing')}
        sousTitre={t('session.forge_module.atelier.discovery_processing_sub')}
      />
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
            <h3 className="text-2xl font-black uppercase tracking-tighter text-app-text font-display">{t('session.forge_module.atelier.inventory_title')}</h3>
            <p className="text-xs text-app-text/40 uppercase tracking-widest">{t('session.forge_module.atelier.inventory_subtitle')}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {candidates.length > 0 && (
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400/60">
              {t('session.forge_module.atelier.coverage', { traites, total: duCanevas.length })}
            </p>
          )}
          <button
            onClick={() => startDiscovery()}
            className="p-3 hover:bg-white/5 rounded-xl text-app-text/40 hover:text-purple-400 transition-all group"
            title={t('common:actions.refresh')}
          >
            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {candidates.map((candidate, idx) => {
          const statut = etat(candidate);
          const horsCanevas = candidate.tags.includes('hors canevas');
          const enregistre = savedCandidateIds.includes(candidate.id);

          return (
            <button
              key={idx}
              onClick={() => onSelect(candidate)}
              className={`group relative bg-app-surface/60 border p-6 rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-6 shadow-xl ${
                statut === 'traite' ? 'border-app-border/10 hover:border-purple-500/50 hover:bg-purple-500/5' : 'border-app-border/10 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-colors">
                {statut === 'non' ? <MinusCircle className="text-app-text/30" size={24} />
                  : statut === 'inconnu' ? <HelpCircle className="text-amber-400/60" size={24} />
                  : <Zap className="text-purple-400" size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-black text-app-text mb-1 truncate font-display group-hover:text-purple-400 transition-colors flex items-center gap-2">
                  {candidate.title}
                  {enregistre && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                </h4>
                <p className="text-[10px] text-app-text/40 uppercase tracking-widest font-bold">
                  {statut === 'non' ? t('session.forge_module.atelier.not_covered')
                    : statut === 'inconnu' ? t('session.forge_module.atelier.not_read')
                    : horsCanevas ? t('session.forge_module.atelier.off_canvas')
                    : t('session.forge_module.subtitle')}
                </p>
                {candidate.summary && (
                  <p className="text-xs text-app-text/50 mt-2 line-clamp-2 normal-case tracking-normal font-normal">{candidate.summary}</p>
                )}
              </div>
              <ChevronRight className="text-app-text/20 group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0" size={20} />
            </button>
          );
        })}

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
