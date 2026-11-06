import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, ChevronRight, RefreshCw, CheckCircle2, MinusCircle, HelpCircle, Save, FileClock, Pencil, Trash2, Plus } from 'lucide-react';
import { useBrainstormStore } from '../store/useBrainstormStore';
import ForgeProgress from './ForgeProgress';
import type { BrainstormCandidate } from '../types';
import { sujetLibre } from '../sujetLibre';

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
  // « sans reponse » n'est pas « traite » : c'est le carnet qui s'est tu, et le
  // compteur de couverture ne doit surtout pas les additionner.
  if (!marque || marque === 'sans reponse') return 'inconnu';
  return 'traite';
}

interface DiscoveryUIProps {
  /** Slugs des fiches présentes dans `rules/` — la vérité durable. */
  fichesPubliees?: string[];
  /** Slugs des brouillons en attente de revue, complets ou partiels. */
  brouillonsEnAttente?: string[];
  /** Cesse d'attendre l'inventaire en cours. */
  onAbandon?: () => void;
  /** Passe la synthèse en revue pour l'enregistrer comme fiche du corpus. */
  onEnregistrerInventaire?: () => void;
  /** Redemande l'inventaire au carnet — coûteux, donc explicite. */
  onRelancer?: () => void;
  /** Forge la fiche du sujet retenu. La liste ne décide pas, elle propose. */
  onSelect: (candidate: BrainstormCandidate) => void;
  /**
   * Titre du supplément documenté — § 185, 01/11/2026. Avec lui, la liste n'est
   * plus le canevas : ce sont les sujets que le carnet propose, et David les
   * renomme, les écarte ou en ajoute avant de forger.
   */
  supplement?: string;
  onRenommer?: (id: string, titre: string) => void;
  onEcarter?: (id: string) => void;
  onAjouter?: (titre: string) => void;
}

const DiscoveryUI: React.FC<DiscoveryUIProps> = ({
  onSelect,
  onAbandon,
  onEnregistrerInventaire,
  onRelancer,
  fichesPubliees = [],
  brouillonsEnAttente = [],
  supplement,
  onRenommer,
  onEcarter,
  onAjouter,
}) => {
  const { t } = useTranslation(['modules']);
  const { candidates, isProcessing, startDiscovery } = useBrainstormStore();
  /** Le sujet en cours de renommage, et le texte tapé. */
  const [enEdition, setEnEdition] = useState<{ id: string; titre: string } | null>(null);
  const [ajout, setAjout] = useState('');
  const validerLeRenommage = () => {
    if (enEdition && enEdition.titre.trim()) onRenommer?.(enEdition.id, enEdition.titre);
    setEnEdition(null);
  };
  const ajouter = () => {
    if (!ajout.trim()) return;
    onAjouter?.(ajout);
    setAjout('');
  };

  const duCanevas = candidates.filter(c => !c.tags.includes('hors canevas'));
  // Le sujet tapé à gauche, s'il est dans la liste : en tête, et dit (06/11/2026).
  const libre = candidates.find(c => sujetLibre(c.tags) !== null);
  const libreRetrouve = libre && sujetLibre(libre.tags) === 'retrouve';
  const librePublie = libre && fichesPubliees.includes(libre.id);
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
          <div className="p-3 bg-gm-violet/20 rounded-2xl border border-gm-violet/30">
            <Sparkles className="text-gm-violet" size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-app-text font-display">{t('session.forge_module.atelier.inventory_title')}</h3>
            <p className="text-xs text-app-text/40 uppercase tracking-widest">
              {supplement
                ? `Supplément « ${supplement} » — les sujets proposés par le carnet, à retenir ou non`
                : t('session.forge_module.atelier.inventory_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {candidates.length > 0 && (
            <div className="text-right">
              {/* Un supplément n'a pas de canevas : il n'y a pas de couverture à compter. */}
              {!supplement && (
                <p className="text-ui-10 font-black uppercase tracking-widest text-gm-violet/60">
                  {t('session.forge_module.atelier.coverage', { traites, total: duCanevas.length })}
                </p>
              )}
              {/*
                L'avancement de la serie, lu sur le disque. C'est la reponse a
                « ou en suis-je ? » quand on reprend treize fiches en plusieurs
                seances — et elle survit a la fermeture, contrairement a la
                memoire de session qui la portait avant.
              */}
              <p className="text-ui-10 font-black uppercase tracking-widest text-etat-succes/60 mt-0.5">
                {t('session.forge_module.atelier.forged_count', {
                  forgees: candidates.filter(c => fichesPubliees.includes(c.id)).length,
                  total: candidates.length,
                })}
              </p>
            </div>
          )}
          {onEnregistrerInventaire && (
            <button
              onClick={onEnregistrerInventaire}
              className="flex items-center gap-2 px-5 py-2.5 bg-app-text/5 hover:bg-gm-violet/20 border border-app-text/5 hover:border-gm-violet/40 text-app-text/60 hover:text-app-text rounded-xl text-ui-10 font-black uppercase tracking-widest transition-all"
            >
              <Save size={14} /> {t('session.forge_module.atelier.save_inventory')}
            </button>
          )}
          <button
            onClick={() => (onRelancer ? onRelancer() : startDiscovery())}
            className="p-3 hover:bg-app-text/5 rounded-xl text-app-text/40 hover:text-gm-violet transition-all group"
            title={t('session.forge_module.atelier.redemander_inventaire')}
          >
            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </div>
      </div>

      {/*
        Un sujet déjà inventorié ne s'ajoutait pas, sans un mot : David a tapé un sujet de COC
        déjà publié, et « il n'y a rien qui se passe dans la forge » (06/11/2026).
      */}
      {libre && libreRetrouve && (
        <p
          role="status"
          data-sujet-libre={libre.id}
          className="flex items-start gap-2 px-6 py-4 rounded-2xl border border-gm-violet/30 bg-gm-violet/5 text-xs text-app-text/70 leading-relaxed"
        >
          <Sparkles size={14} className="mt-0.5 shrink-0 text-gm-violet" />
          {t(librePublie
            ? 'session.forge_module.atelier.custom_subject_found_published'
            : 'session.forge_module.atelier.custom_subject_found', { sujet: libre.title })}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {candidates.map((candidate, idx) => {
          const statut = etat(candidate);
          const horsCanevas = candidate.tags.includes('hors canevas');
          // On compare des slugs de fichier, pas des identifiants de session :
          // c'est le nom sous lequel la fiche a réellement été écrite.
          const enregistre = fichesPubliees.includes(candidate.id);
          const enBrouillon = !enregistre && brouillonsEnAttente.includes(candidate.id);
          const estLeSujetLibre = candidate === libre;

          if (supplement && enEdition?.id === candidate.id) {
            return (
              <div key={idx} className="bg-app-surface/60 border border-gm-violet/50 p-6 rounded-[2rem] flex items-center gap-3">
                <input
                  autoFocus
                  value={enEdition.titre}
                  onChange={e => setEnEdition({ id: candidate.id, titre: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter') validerLeRenommage();
                    if (e.key === 'Escape') { e.stopPropagation(); setEnEdition(null); }
                  }}
                  aria-label="Nouveau nom du sujet"
                  className="flex-1 bg-app-text/5 border border-app-text/10 rounded-xl px-4 py-3 text-sm text-app-text focus:outline-none focus:border-gm-violet/50"
                />
                <button type="button" onClick={validerLeRenommage} className="px-4 py-3 rounded-xl bg-gm-violet text-app-bg text-ui-10 font-black uppercase tracking-widest">
                  Renommer
                </button>
              </div>
            );
          }

          return (
            // L'enveloppe est la case de la grille ; le bouton doit la remplir
            // (`w-full h-full`), sinon il prend la largeur de son texte : les
            // cartes débordaient l'une sur l'autre (vu par David le 01/11).
            <div key={idx} className="relative group/sujet min-w-0">
            <button
              onClick={() => onSelect(candidate)}
              aria-current={estLeSujetLibre ? 'true' : undefined}
              className={`group relative w-full h-full bg-app-surface/60 border p-6 rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-6 shadow-xl ${
                estLeSujetLibre ? 'border-gm-violet/60 ring-1 ring-gm-violet/40' :
                statut === 'traite' ? 'border-app-border/10 hover:border-gm-violet/50 hover:bg-gm-violet/5' : 'border-app-border/10 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="p-4 bg-gm-violet/10 rounded-2xl group-hover:bg-gm-violet/20 transition-colors">
                {statut === 'non' ? <MinusCircle className="text-app-text/30" size={24} />
                  : statut === 'inconnu' ? <HelpCircle className="text-etat-alerte/60" size={24} />
                  : <Zap className="text-gm-violet" size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                {/*
                  Le titre tronque, les marques non. `truncate` et `flex` sur le
                  meme element se contredisent : le texte long deborde et pousse
                  la coche hors de la zone visible — une fiche bien enregistree
                  s affichait alors comme restant a faire, uniquement parce que
                  son sujet etait long.
                */}
                <h4 className="text-lg font-black text-app-text mb-1 font-display group-hover:text-gm-violet transition-colors flex items-center gap-2 min-w-0">
                  <span className="truncate">{candidate.title}</span>
                  {enregistre && <CheckCircle2 size={14} className="text-etat-succes shrink-0" />}
                  {enBrouillon && (
                    <FileClock
                      size={14}
                      className="text-etat-alerte shrink-0"
                      aria-label={t('session.forge_module.atelier.draft_pending')}
                    />
                  )}
                </h4>
                <p className="text-ui-10 text-app-text/40 uppercase tracking-widest font-bold">
                  {statut === 'non' ? t('session.forge_module.atelier.not_covered')
                    : statut === 'inconnu' ? t('session.forge_module.atelier.not_read')
                    : horsCanevas ? t('session.forge_module.atelier.off_canvas')
                    : t('session.forge_module.subtitle')}
                </p>
                {candidate.summary && (
                  <p className="text-xs text-app-text/50 mt-2 line-clamp-2 normal-case tracking-normal font-normal">{candidate.summary}</p>
                )}
              </div>
              <ChevronRight className="text-app-text/20 group-hover:text-gm-violet group-hover:translate-x-1 transition-all shrink-0" size={20} />
            </button>
            {/*
              Renommer et écarter, hors du bouton de la carte : un bouton dans
              un bouton n'est pas du HTML valide, et le clic forgerait la fiche.
              Une fiche déjà publiée ne se renomme pas ici — son fichier garde
              son nom ; on écarte seulement de la liste.
            */}
            {supplement && (
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover/sujet:opacity-100 focus-within:opacity-100 transition-opacity">
                {!enregistre && (
                  <button
                    type="button"
                    onClick={() => setEnEdition({ id: candidate.id, titre: candidate.title })}
                    title="Renommer le sujet"
                    aria-label={`Renommer ${candidate.title}`}
                    className="p-2 rounded-lg bg-app-bg/80 text-app-text/40 hover:text-gm-violet"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onEcarter?.(candidate.id)}
                  title="Écarter le sujet"
                  aria-label={`Écarter ${candidate.title}`}
                  className="p-2 rounded-lg bg-app-bg/80 text-app-text/40 hover:text-etat-danger"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
            </div>
          );
        })}

        {candidates.length === 0 && !supplement && (
          <div className="col-span-2 py-20 bg-app-surface/20 border-2 border-dashed border-app-border/10 rounded-[3rem] flex flex-col items-center justify-center text-center opacity-40 italic">
             <RefreshCw size={48} className="mb-4" />
             <p>{t('session.forge_module.atelier.discovery_empty')}</p>
          </div>
        )}

        {/*
          Un supplément n'interroge pas le carnet de lui-même : il faut d'abord
          retenir sa source, sinon l'inventaire lirait aussi le livre de base.
        */}
        {candidates.length === 0 && supplement && (
          <div className="col-span-2 py-16 bg-app-surface/20 border-2 border-dashed border-app-border/10 rounded-[3rem] flex flex-col items-center justify-center text-center gap-4">
            <p className="text-sm text-app-text/50 max-w-md">
              Aucun inventaire pour ce supplément. Retenez sa seule source dans le Bac à contexte,
              puis demandez au carnet la liste de ses règles.
            </p>
            <button
              type="button"
              onClick={() => (onRelancer ? onRelancer() : startDiscovery())}
              className="flex items-center gap-2 px-6 py-3 bg-gm-violet text-app-bg rounded-xl text-ui-10 font-black uppercase tracking-widest"
            >
              <Sparkles size={14} /> Demander l'inventaire
            </button>
          </div>
        )}
      </div>

      {supplement && candidates.length > 0 && (
        <div className="flex items-center gap-3">
          <input
            value={ajout}
            onChange={e => setAjout(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') ajouter(); }}
            placeholder="Ajouter un sujet que le carnet n'a pas proposé"
            aria-label="Sujet à ajouter"
            className="flex-1 bg-app-text/5 border border-app-text/10 rounded-xl px-4 py-3 text-xs text-app-text/80 focus:outline-none focus:border-gm-violet/50 placeholder:text-app-text/20"
          />
          <button
            type="button"
            disabled={!ajout.trim()}
            onClick={ajouter}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-ui-10 font-black uppercase tracking-widest bg-gm-violet text-app-bg disabled:bg-app-text/5 disabled:text-app-text/10"
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscoveryUI;
