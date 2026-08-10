import React, { useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBrainstormStore } from '../store/useBrainstormStore';
import { forgeService } from '../../ForgeService';
import { useSessionOSStore } from '../../../session/useSessionOSStore';
import { X, Zap, Sparkles, ChevronLeft, Shield, BookOpen, AlertTriangle, Users, Save, FolderTree } from 'lucide-react';
import { DEFAULT_GAME_DRIVERS } from '../../../../data/defaultGameDrivers';
import DiscoveryUI from './DiscoveryUI';
import ForgeProgress from './ForgeProgress';
import {
  resoudreCorpus,
  cheminDesFiches,
  cheminDesPersonas,
} from '../../../../../electron/corpusSysteme';
import { slugFiche } from '../canevas';
import type { BrainstormCandidate } from '../types';

/**
 * BrainstormOverlay
 * Interface premium pour l'Atelier de Règles.
 *
 * **La boucle est pilotée par le canevas, pas par le carnet.** L'inventaire rend
 * les treize sujets ; le carnet ne choisit plus ce qu'il juge « intéressant à
 * formaliser », faute de quoi la taxonomie dérive d'un jeu à l'autre.
 *
 * **Et la fiche se montre avant d'être écrite.** Une fiche posée dans `rules/`
 * est aussitôt lue par le RAG et citée en séance : c'est l'artefact qui porte le
 * plus d'autorité, il ne peut pas être celui qui reçoit le moins de revue.
 */
export const BrainstormOverlay: React.FC = () => {
  const { t } = useTranslation(['modules', 'common']);
  const brainstormStore = useBrainstormStore();
  const { activeCampaignId, campaigns, updateCampaign, customGameDrivers, setCurrentView } = useSessionOSStore();

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);
  const allDrivers = [...DEFAULT_GAME_DRIVERS, ...customGameDrivers];

  const messageErreur = (err: unknown, defaut: string): string =>
    err instanceof Error && err.message ? err.message : defaut;

  /**
   * Dossiers réellement présents sous `docs/systems/`.
   *
   * Sans cet inventaire, le rapprochement par nom affiché est impossible — on ne
   * reconnaît pas un dossier dont on ignore l'existence — et la résolution
   * retombe sur l'identifiant du pilote, qui est un horodatage.
   */
  const [dossiersSystemes, setDossiersSystemes] = useState<string[]>([]);
  useEffect(() => {
    window.appBridge?.ai?.listSystems?.().then(setDossiersSystemes).catch(() => setDossiersSystemes([]));
  }, []);

  /**
   * Où vit le corpus de ce système. Une seule question, une seule réponse — et
   * la même que celle du moteur de sélection, ce qui est tout l'enjeu : une
   * écriture qui ne résout pas comme la lecture écrit à côté sans le dire.
   */
  const corpus = activeCampaign?.system
    ? resoudreCorpus({
        systemId: activeCampaign.system,
        systemName: allDrivers.find(d => d.id === activeCampaign.system)?.name,
        systemPath: activeCampaign.systemPath,
        corpusId: allDrivers.find(d => d.id === activeCampaign.system)?.corpusId,
        ragPath: allDrivers.find(d => d.id === activeCampaign.system)?.ragPath,
        dossiersConnus: dossiersSystemes,
      })
    : null;

  const cheminDeLaFiche = brainstormStore.activeCard && corpus
    ? `${cheminDesFiches(corpus)}/${brainstormStore.activeCard.slug}.md`
    : '';

  const handleDiscover = useCallback(async () => {
    if (!brainstormStore.notebookId) return;
    brainstormStore.setProcessing(true);
    try {
      const discovered = await forgeService.discoverCandidates(
        brainstormStore.notebookId,
        brainstormStore.selectedSourceIds
      );

      // La « forge libre » du tableau de bord s'ajoute au canevas, elle ne le
      // remplace pas : demander au carnet de choisir ses sujets est exactement
      // ce qui faisait dériver la taxonomie d'un jeu à l'autre.
      const libre = brainstormStore.customSubject.trim();
      brainstormStore.setCandidates(
        libre
          ? [{ id: slugFiche(libre), title: libre, category: 'rule' as const, summary: '', tags: ['hors canevas'] }, ...discovered]
          : discovered
      );
    } catch (err: unknown) {
      brainstormStore.setError(messageErreur(err, t('session.forge_module.atelier.error_title')));
    }
  }, [brainstormStore.notebookId, brainstormStore.selectedSourceIds, t, brainstormStore.setProcessing, brainstormStore.setCandidates, brainstormStore.setError]);

  useEffect(() => {
    if (brainstormStore.step === 'discovery' && brainstormStore.candidates.length === 0 && !brainstormStore.isProcessing && !brainstormStore.error) {
      handleDiscover();
    }
  }, [brainstormStore.step, brainstormStore.candidates.length, brainstormStore.isProcessing, brainstormStore.error, handleDiscover]);

  /** Rédige la fiche. **N'écrit rien** : la revue vient ensuite. */
  const handleForge = async (candidate: BrainstormCandidate) => {
    if (!brainstormStore.notebookId || !activeCampaign?.system) {
        brainstormStore.setError(t('session.forge_module.atelier.error_no_system'));
        return;
    }
    brainstormStore.startForging();
    try {
      const card = await forgeService.forgeCard(
        brainstormStore.notebookId,
        candidate,
        activeCampaign.system,
        brainstormStore.selectedSourceIds
      );
      brainstormStore.reviewCard(card);
    } catch (err: unknown) {
      brainstormStore.setError(messageErreur(err, t('session.forge_module.atelier.error_title')));
    }
  };

  /** Écrit la fiche relue. C'est le seul endroit qui touche au disque. */
  const handleSaveCard = async () => {
    const card = brainstormStore.activeCard;
    if (!card || !cheminDeLaFiche) return;
    brainstormStore.setProcessing(true);
    try {
      console.log(`[Forge] Saving document to: ${cheminDeLaFiche}`);
      const saveSuccess = await window.appBridge?.ai?.writeDoc(cheminDeLaFiche, card.content);
      if (!saveSuccess) throw new Error(t('session.forge_module.atelier.error_write'));
      brainstormStore.markSaved(card.id);
    } catch (err: unknown) {
      brainstormStore.setError(messageErreur(err, t('session.forge_module.atelier.error_write')));
    }
  };

  /**
   * La passe personas : prompt A puis prompt B, dans la même conversation.
   * Deux requêtes, un chemin de sortie fixe — c'est l'étape la plus vite
   * rentable, et elle ne dépend d'aucune autre.
   */
  const handlePersonas = async () => {
    if (!brainstormStore.notebookId) {
      brainstormStore.setError(t('session.forge_module.atelier.error_no_notebook'));
      return;
    }
    if (!activeCampaign?.system) {
      brainstormStore.setError(t('session.forge_module.atelier.error_no_system'));
      return;
    }
    brainstormStore.startPersonas();
    try {
      const resultat = await forgeService.forgePersonas(
        brainstormStore.notebookId,
        brainstormStore.selectedSourceIds
      );
      brainstormStore.setPersonas(resultat);
    } catch (err: unknown) {
      brainstormStore.setError(messageErreur(err, t('session.forge_module.atelier.error_title')));
    }
  };

  /**
   * Écrit `systems/<id>/gems.json` — **ce chemin et pas un autre**. `AIService`
   * n'en lit aucun autre, et un fichier rangé ailleurs est perdu en silence.
   */
  const handleSavePersonas = async () => {
    const resultat = brainstormStore.personas;
    if (!resultat || !corpus) return;
    brainstormStore.setProcessing(true);
    try {
      const ecrit = await window.appBridge?.ai?.writeDoc(
        cheminDesPersonas(corpus),
        JSON.stringify(resultat.personas, null, 2)
      );
      if (!ecrit) throw new Error(t('session.forge_module.atelier.error_write'));
      // La fiche de voix est l'archive de ce qui a produit les personas : elle
      // n'est lue par personne, mais sans elle on ne sait plus d'où elles sortent.
      await window.appBridge?.ai?.writeDoc(`${corpus.racine}/personas/fiche-de-voix.md`, resultat.voix);
      brainstormStore.markSaved('personas');
    } catch (err: unknown) {
      brainstormStore.setError(messageErreur(err, t('session.forge_module.atelier.error_write')));
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

          {/*
            Le corpus visé, annoncé avant d'écrire quoi que ce soit.
            Un dossier neuf n'est pas une erreur en soi — un système inédit en
            crée forcément un — mais c'en est une quand l'index et les personas
            vivent ailleurs, et c'est exactement ce qui s'est produit sans que
            rien ne le dise pendant des semaines.
          */}
          {corpus && (
            <div className={`mb-6 px-6 py-4 rounded-2xl border flex items-start gap-4 ${
              corpus.aCreer
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-white/5 border-white/5'
            }`}>
              <FolderTree size={16} className={corpus.aCreer ? 'text-amber-400 mt-0.5' : 'text-purple-400/60 mt-0.5'} />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                  {t('session.forge_module.atelier.corpus_target')}
                  <span className="ml-2 text-white/40 normal-case tracking-normal font-normal">
                    ({t(`session.forge_module.atelier.corpus_reason_${corpus.raison}`)})
                  </span>
                </p>
                <p className={`text-sm font-mono ${corpus.aCreer ? 'text-amber-400' : 'text-purple-400/80'}`}>
                  {corpus.racine}
                </p>
                {corpus.aCreer && (
                  <p className="text-xs text-amber-200/60 leading-relaxed mt-2">
                    {t('session.forge_module.atelier.corpus_new_folder')}
                  </p>
                )}
              </div>
            </div>
          )}

          {brainstormStore.step === 'discovery' && (
            <>
              <DiscoveryUI onSelect={handleForge} />
              {!brainstormStore.isProcessing && brainstormStore.candidates.length > 0 && (
                <div className="max-w-4xl mx-auto px-6 pb-6 flex justify-center">
                  <button
                    onClick={handlePersonas}
                    className="flex items-center gap-3 px-8 py-3 bg-white/5 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/40 text-white/60 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    <Users size={16} /> {t('session.forge_module.atelier.personas_button')}
                  </button>
                </div>
              )}
            </>
          )}

          {(brainstormStore.step === 'forging' || (brainstormStore.step === 'personas' && brainstormStore.isProcessing)) && (
            <ForgeProgress
              titre={t('session.forge_module.atelier.forging_title')}
              sousTitre={brainstormStore.step === 'personas'
                ? t('session.forge_module.atelier.personas_processing')
                : t('session.forge_module.atelier.forging_subtitle')}
            />
          )}

          {brainstormStore.step === 'review' && brainstormStore.activeCard && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center justify-between">
                 <button
                   onClick={() => brainstormStore.setStep('discovery')}
                   className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors"
                 >
                   <ChevronLeft size={16} /> {t('session.forge_module.atelier.back_to_subjects')}
                 </button>
                 <div className="text-right">
                   <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{t('session.forge_module.atelier.review_title')}</p>
                   <p className="text-xs text-amber-400/60 font-bold">{t('session.forge_module.atelier.review_subtitle')}</p>
                 </div>
               </div>

               {brainstormStore.activeCard.avertissements.length > 0 && (
                 <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[3rem]">
                   <div className="flex items-center gap-4 mb-4">
                     <AlertTriangle size={20} className="text-amber-400" />
                     <h4 className="text-sm font-black uppercase tracking-widest text-amber-400 font-display">
                       {t('session.forge_module.atelier.review_warnings')}
                     </h4>
                   </div>
                   <ul className="space-y-2 text-sm text-amber-200/60 leading-relaxed list-disc pl-6">
                     {brainstormStore.activeCard.avertissements.map((avis, idx) => <li key={idx}>{avis}</li>)}
                   </ul>
                 </div>
               )}

               <div className="bg-black/40 border border-white/5 rounded-[3rem] p-12 relative">
                 <div className="absolute top-8 right-12 text-[10px] font-black uppercase tracking-widest text-white/10">Markdown Construct</div>
                 <div className="prose prose-invert max-w-none">
                   <h1 className="text-4xl font-black uppercase tracking-tighter text-white font-display mb-4">{brainstormStore.activeCard.title}</h1>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-8">
                     {t('session.forge_module.atelier.review_path')} <span className="text-purple-400/60">{cheminDeLaFiche}</span>
                   </p>
                   <div className="text-white/60 leading-relaxed font-sans text-base whitespace-pre-wrap">
                     {brainstormStore.activeCard.content}
                   </div>
                 </div>
               </div>

               <div className="flex justify-end gap-6 pt-8">
                 <button onClick={() => brainstormStore.setStep('discovery')} className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all">{t('session.forge_module.atelier.btn_discard')}</button>
                 <button
                   onClick={handleSaveCard}
                   disabled={brainstormStore.isProcessing}
                   className="px-12 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                 >
                   <Save size={18} /> {t('session.forge_module.atelier.btn_save_card')}
                 </button>
               </div>
            </div>
          )}

          {brainstormStore.step === 'personas' && brainstormStore.personas && !brainstormStore.isProcessing && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center justify-between">
                 <button
                   onClick={() => brainstormStore.setStep('discovery')}
                   className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors"
                 >
                   <ChevronLeft size={16} /> {t('session.forge_module.atelier.back_to_subjects')}
                 </button>
                 <div className="text-right">
                   <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{t('session.forge_module.atelier.personas_title')}</p>
                   <p className="text-xs text-amber-400/60 font-bold">{t('session.forge_module.atelier.review_subtitle')}</p>
                 </div>
               </div>

               {brainstormStore.personas.avertissements.length > 0 && (
                 <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[3rem]">
                   <div className="flex items-center gap-4 mb-4">
                     <AlertTriangle size={20} className="text-amber-400" />
                     <h4 className="text-sm font-black uppercase tracking-widest text-amber-400 font-display">
                       {t('session.forge_module.atelier.review_warnings')}
                     </h4>
                   </div>
                   <ul className="space-y-2 text-sm text-amber-200/60 leading-relaxed list-disc pl-6">
                     {brainstormStore.personas.avertissements.map((avis, idx) => <li key={idx}>{avis}</li>)}
                   </ul>
                 </div>
               )}

               <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                 {t('session.forge_module.atelier.personas_path')}{' '}
                 <span className="text-purple-400/60">{corpus ? cheminDesPersonas(corpus) : ''}</span>
               </p>

               <div className="grid grid-cols-2 gap-4">
                 {Object.entries(brainstormStore.personas.personas).map(([clef, texte]) => (
                   <div key={clef} className="bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-3">
                     <div className="flex items-center justify-between">
                       <h4 className="text-sm font-black uppercase tracking-widest text-purple-400 font-display">{clef}</h4>
                       <span className="text-[10px] font-bold text-white/20">{texte.length}</span>
                     </div>
                     <p className="text-sm text-white/50 leading-relaxed">{texte}</p>
                   </div>
                 ))}
               </div>

               <div className="flex justify-end gap-6 pt-8">
                 <button onClick={() => brainstormStore.setStep('discovery')} className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all">{t('session.forge_module.atelier.btn_discard')}</button>
                 <button
                   onClick={handleSavePersonas}
                   disabled={brainstormStore.isProcessing}
                   className="px-12 py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                 >
                   <Save size={18} /> {t('session.forge_module.atelier.btn_save_personas')}
                 </button>
               </div>
            </div>
          )}

          {brainstormStore.step === 'saved' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
               <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[3rem] flex items-center gap-8">
                 <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-glow-emerald/30">
                   <Zap size={32} className="text-white" />
                 </div>
                 <div>
                   <h3 className="text-2xl font-black uppercase text-emerald-400 font-display tracking-tight">{t('session.forge_module.atelier.saved_title')}</h3>
                   <p className="text-sm text-emerald-400/40 uppercase font-black tracking-widest mt-1">{t('session.forge_module.atelier.saved_subtitle')}</p>
                 </div>
               </div>

               <div className="flex justify-end gap-6 pt-8">
                 <button onClick={() => brainstormStore.setStep('discovery')} className="px-10 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all">{t('session.forge_module.atelier.btn_back')}</button>
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
