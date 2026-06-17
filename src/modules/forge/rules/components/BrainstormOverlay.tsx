import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBrainstormStore } from '../store/useBrainstormStore';
import { forgeService } from '../../ForgeService';
import { useSessionOSStore } from '../../../session/useSessionOSStore';
import { X, Zap, Sparkles, Rocket, ChevronLeft, Shield, CheckCircle2, BookOpen } from 'lucide-react';
import { DEFAULT_GAME_DRIVERS } from '../../../../data/defaultGameDrivers';
import DiscoveryUI from './DiscoveryUI';
import type { BrainstormCandidate } from '../types';

/**
 * BrainstormOverlay
 * Interface premium pour l'Atelier de Règles.
 * Gère la découverte de sujets et la forge de fiches markdown.
 */
export const BrainstormOverlay: React.FC = () => {
  const { t } = useTranslation(['modules', 'common']);
  const brainstormStore = useBrainstormStore();
  const { activeCampaignId, campaigns, updateCampaign, customGameDrivers, setCurrentView } = useSessionOSStore();
  
  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
  const allDrivers = [...DEFAULT_GAME_DRIVERS, ...customGameDrivers];

  const handleDiscover = useCallback(async () => {
    if (!brainstormStore.notebookId) return;
    brainstormStore.setProcessing(true);
    brainstormStore.startDiscovery(); 
    try {
      const discovered = await forgeService.discoverCandidates(
        brainstormStore.notebookId, 
        brainstormStore.selectedSourceIds
      );
      brainstormStore.setCandidates(discovered);
    } catch (err: any) {
      brainstormStore.setError(err.message || t('session.forge_module.atelier.discovery_processing_error'));
    }
  }, [brainstormStore.notebookId, brainstormStore.selectedSourceIds, t, brainstormStore.startDiscovery, brainstormStore.setCandidates, brainstormStore.setError]);

  const handleSubjectForge = useCallback(async (subject: string) => {
    if (!brainstormStore.notebookId) return;
    brainstormStore.setProcessing(true);
    try {
      const candidates = await forgeService.discoverCandidates(
        brainstormStore.notebookId,
        brainstormStore.selectedSourceIds,
        subject
      );
      brainstormStore.setCandidates(candidates);
    } catch (err: any) {
      brainstormStore.setError(err.message || t('session.forge_module.atelier.discovery_processing_error'));
    }
  }, [brainstormStore.notebookId, brainstormStore.selectedSourceIds, t]);

  useEffect(() => {
    if (brainstormStore.step === 'discovery' && brainstormStore.candidates.length === 0 && !brainstormStore.isProcessing && !brainstormStore.error) {
      handleDiscover();
    }
  }, [brainstormStore.step, brainstormStore.candidates.length, brainstormStore.isProcessing, brainstormStore.error, handleDiscover]);

  useEffect(() => {
    if (brainstormStore.step === 'listing' && brainstormStore.candidates.length === 0 && brainstormStore.customSubject && !brainstormStore.isProcessing && !brainstormStore.error) {
      handleSubjectForge(brainstormStore.customSubject);
    }
  }, [brainstormStore.step, brainstormStore.candidates.length, brainstormStore.customSubject, brainstormStore.isProcessing, brainstormStore.error, handleSubjectForge]);

  const handleForge = async (candidate: BrainstormCandidate) => {
    if (!brainstormStore.notebookId || !activeCampaign?.system) {
        brainstormStore.setError(t('session.forge_module.atelier.error_no_system'));
        return;
    }
    brainstormStore.startForging(candidate.id);
    try {
      const card = await forgeService.forgeCard(
        brainstormStore.notebookId, 
        candidate, 
        activeCampaign.system,
        brainstormStore.selectedSourceIds
      );
      
      const systemId = activeCampaign.system;
      const driver = allDrivers.find(d => d.id === systemId);
      
      // Resolve base directory from driver or fallback to standard system path
      let baseDir = driver?.ragPath?.trim().replace(/\\/g, '/') || `systems/${systemId}/rules`;
      
      // Security/Cleanup: Remove leading/trailing slashes
      if (baseDir.startsWith('/')) baseDir = baseDir.substring(1);
      if (baseDir.endsWith('/')) baseDir = baseDir.slice(0, -1);

      const fileName = `${baseDir}/${card.id}.md`;
      console.log(`[Forge] Saving document to: ${fileName} (Driver Path: ${driver?.ragPath || 'default'})`);
      
      const saveSuccess = await window.appBridge?.ai?.writeDoc(fileName, card.content);
      
      if (saveSuccess) {
        brainstormStore.completeForge(card);
      } else {
        throw new Error(t('session.forge_module.atelier.error_write'));
      }
    } catch (err: any) {
      brainstormStore.setError(err.message || t('session.forge_module.atelier.error_title'));
    }
  };

  if (brainstormStore.step === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl h-[85vh] overflow-hidden rounded-[3rem] border border-white/10 bg-[#0c0c14]/90 shadow-2xl backdrop-blur-2xl flex flex-col">
        
        {/* Animated Glow Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full animate-pulse pointer-events-none" />

        {/* Header Section */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between relative z-10 bg-white/2">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-purple-600 rounded-2xl shadow-glow-purple/20">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white font-display">
                {t('session.forge_module.tabs.rules').split(' ')[0]} <span className="text-purple-400">{t('session.forge_module.tabs.rules').split(' ').slice(1).join(' ') || 'Rules'}</span>
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
                <Sparkles size={12} className="text-purple-400" /> Powered by NotebookLM
              </div>
            </div>

            <div className="h-8 w-px bg-white/5 mx-2" />

            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-0.5">{t('session.campaign_form.identity.system_label')}</span>
              <button 
                onClick={() => brainstormStore.setError('SELECT_SYSTEM')}
                className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-white transition-all group"
              >
                <Shield size={12} className={activeCampaign?.system ? 'text-purple-400' : 'text-red-500'} />
                {activeCampaign?.system ? (
                  <span>{allDrivers.find(d => d.id === activeCampaign.system)?.name || activeCampaign.system}</span>
                ) : (
                  <span className="text-red-500 italic">Non associé</span>
                )}
              </button>
            </div>
          </div>
          
          <button 
            onClick={brainstormStore.reset}
            className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"
          >
            <X size={28} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-8">
          
          { (brainstormStore.error || !activeCampaign?.system) && (
            <div className={`mb-8 p-8 border rounded-[3rem] animate-in slide-in-from-top-4 shadow-xl transition-all duration-500 ${
              brainstormStore.error === 'SELECT_SYSTEM' || (!activeCampaign?.system && !brainstormStore.error)
                ? 'bg-purple-600/10 border-purple-500/20 shadow-purple-900/10' 
                : 'bg-[#ff4d4d]/10 border-[#ff4d4d]/20 shadow-red-900/10'
            }`}>
              
              {brainstormStore.error && brainstormStore.error !== 'SELECT_SYSTEM' && (
                <div className="flex items-start gap-6 mb-6">
                  <div className="p-4 bg-red-500 rounded-2xl shadow-glow-red/30">
                    <Shield size={24} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight text-red-400 font-display">{t('session.forge_module.atelier.error_title')}</h4>
                    <p className="text-sm text-red-400/60 leading-relaxed">{brainstormStore.error}</p>
                  </div>
                </div>
              )}

              { (brainstormStore.error === 'SELECT_SYSTEM' || !activeCampaign?.system) && (
                <div className="space-y-4 mb-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <Shield size={16} className="text-white" />
                      </div>
                      <h4 className="text-lg font-black uppercase tracking-tight text-white font-display">
                        {activeCampaign?.system ? 'Changer de Système' : 'Associer un Système'}
                      </h4>
                    </div>
                    {brainstormStore.error === 'SELECT_SYSTEM' && (
                      <button 
                        onClick={() => brainstormStore.setError(null)}
                        className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                      >
                        Annuler
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {allDrivers.map(driver => {
                      const isSelected = activeCampaign?.system === driver.id;
                      return (
                        <button
                          key={driver.id}
                          onClick={() => {
                            if (activeCampaign) {
                              updateCampaign(activeCampaign.id, { system: driver.id });
                              brainstormStore.setError(null);
                            }
                          }}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group relative overflow-hidden ${
                            isSelected 
                              ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-900/20' 
                              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          <span className="text-2xl relative z-10">{driver.emoji || '🎲'}</span>
                          <div className="min-w-0 flex-1 relative z-10">
                            <p className={`text-xs font-black uppercase tracking-widest truncate transition-colors ${
                              isSelected ? 'text-white' : 'text-white/60 group-hover:text-white'
                            }`}>
                              {driver.name}
                            </p>
                            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-0.5">
                              {driver.id}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-0 right-0 p-2">
                              <Zap size={10} className="text-purple-400" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {brainstormStore.error && brainstormStore.error !== 'SELECT_SYSTEM' && (
                <div className="mt-6 pt-6 border-t border-white/5 flex gap-4">
                  <button 
                    onClick={() => brainstormStore.reset()} 
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    {t('session.forge_module.atelier.btn_reset')}
                  </button>
                </div>
              )}
            </div>
          )}

          {brainstormStore.step === 'discovery' && <DiscoveryUI />}

          {brainstormStore.step === 'listing' && !brainstormStore.isProcessing && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => brainstormStore.startDiscovery()}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} /> {t('session.forge_module.atelier.back_to_subjects')}
                </button>
                <div className="text-right">
                  <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{t('session.forge_module.atelier.current_subject')}</p>
                  <p className="text-xl font-bold font-display text-white">{brainstormStore.customSubject}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {brainstormStore.candidates.map((candidate, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleForge(candidate)}
                    className="group bg-white/5 border border-white/5 p-8 rounded-[2.5rem] hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 border border-white/5">
                        {candidate.category}
                      </span>
                      <Rocket size={16} className="text-white/10 group-hover:text-purple-400 transition-colors" />
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold font-display text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                        {candidate.title}
                        {brainstormStore.forgedCandidateIds.includes(candidate.id) && (
                          <CheckCircle2 size={16} className="text-emerald-400" />
                        )}
                      </h3>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed line-clamp-3">{candidate.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {candidate.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold text-purple-400/60">#{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {brainstormStore.step === 'forging' && (
            <div className="h-full flex flex-col items-center justify-center p-20 space-y-8 text-center animate-in zoom-in-95">
               <div className="w-32 h-32 relative">
                 <div className="absolute inset-0 bg-purple-600/30 blur-3xl animate-pulse" />
                 <div className="relative w-full h-full rounded-full border-4 border-dashed border-purple-500/50 flex items-center justify-center animate-spin-slow">
                   <Zap size={48} className="text-purple-400" />
                 </div>
               </div>
               <div>
                 <h3 className="text-2xl font-black uppercase tracking-widest text-white font-display mb-2">{t('session.forge_module.atelier.forging_title')}</h3>
                 <p className="text-white/40 text-sm uppercase tracking-widest">{t('session.forge_module.atelier.forging_subtitle')}</p>
               </div>
            </div>
          )}

          {brainstormStore.step === 'completed' && brainstormStore.activeCard && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[3rem] flex items-center gap-8">
                 <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-glow-emerald/30">
                   <Zap size={32} className="text-white" />
                 </div>
                 <div>
                   <h3 className="text-2xl font-black uppercase text-emerald-400 font-display tracking-tight">{t('session.forge_module.atelier.success_title')}</h3>
                   <p className="text-sm text-emerald-400/40 uppercase font-black tracking-widest mt-1">{t('session.forge_module.atelier.success_subtitle')}</p>
                 </div>
               </div>

               <div className="bg-black/40 border border-white/5 rounded-[3rem] p-12 relative">
                 <div className="absolute top-8 right-12 text-[10px] font-black uppercase tracking-widest text-white/10">Markdown Construct</div>
                 <div className="prose prose-invert max-w-none">
                   <h1 className="text-4xl font-black uppercase tracking-tighter text-white font-display mb-8">{brainstormStore.activeCard.title}</h1>
                   <div className="text-white/60 leading-relaxed font-sans text-lg whitespace-pre-wrap">
                     {brainstormStore.activeCard.content}
                   </div>
                 </div>
               </div>

               <div className="flex justify-end gap-6 pt-8">
                 <button onClick={() => brainstormStore.setStep('listing')} className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all">{t('session.forge_module.atelier.btn_back')}</button>
                 <button 
                   onClick={() => {
                     brainstormStore.reset();
                     setCurrentView('rule-workshop');
                   }} 
                   className="px-12 py-4 bg-accent/20 border border-accent/40 text-accent hover:bg-accent hover:text-white rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                 >
                   <BookOpen size={18} />
                   {t('modules:session.header.grimoire_label')}
                 </button>
                 <button onClick={() => brainstormStore.reset()} className="px-12 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 transition-all hover:scale-105 active:scale-95">{t('session.forge_module.atelier.btn_finish')}</button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BrainstormOverlay;
