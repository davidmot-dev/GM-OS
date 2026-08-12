import React, { useEffect, useRef, useState } from 'react';
import { Zap, Radio, BookOpen, FileText, XCircle } from 'lucide-react';
import { useBrainstormStore } from '../store/useBrainstormStore';
import {
  ajouterAuJournal,
  formatDuree,
  type EvenementMcp,
} from '../../../../../electron/mcpActivity';

/**
 * L'écran d'attente de la Forge, avec ce qu'il faut pour ne pas douter.
 *
 * **Le problème qu'il résout.** Un appel MCP est un aller-retour : NotebookLM
 * rend sa réponse d'un bloc, à la fin. Il n'existe aucun moyen de montrer la
 * fiche s'écrire. Ce qui manquait n'était pas la fiche en train de naître, mais
 * la réponse à « est-ce que ça avance ou est-ce que c'est mort ? » — et le
 * compteur y répond à lui seul.
 *
 * **Deux sources, inégalement sûres.** Le compteur et les événements de requête
 * viennent du pont, qui sait toujours ce qu'il a envoyé et reçu. Les lignes du
 * serveur sont un bonus : rien ne garantit que le serveur NotebookLM en émette.
 * D'où l'ordre d'affichage — le compteur d'abord, le journal ensuite, et le
 * journal peut rester vide sans que l'écran cesse d'informer.
 */

interface ForgeProgressProps {
  titre: string;
  sousTitre: string;
  /** Cesse d'attendre. Ne prétend pas arrêter le serveur — il continue. */
  onAbandon?: () => void;
  /** Libellé du bouton d'abandon, quand « cesser d'attendre » serait un mensonge. */
  libelleAbandon?: string;
  /** Repère au-delà duquel l'attente devient anormale, en secondes. */
  seuilInquietude?: number;
  /**
   * Plafond au-delà duquel la requête est perdue. `0` quand il n'y en a pas.
   *
   * Le défaut est celui de `ForgeService.callMcpTool`. Une dérivation depuis le
   * corpus n'interroge aucun serveur MCP et dure un quart d'heure : lui
   * annoncer un abandon à dix minutes serait faux, et un compteur qui vire au
   * rouge sans raison finit par n'être plus lu.
   */
  plafondSecondes?: number;
  /**
   * Ce qui est interrogé, quand ce n'est pas le carnet.
   *
   * Le bandeau par défaut nomme le carnet NotebookLM et ses sources. Une forge
   * dérivée du corpus ne lui parle pas : afficher ses sources laisserait croire
   * qu'elles sont dans la boucle.
   */
  contexte?: { entete: string; detail: string };
}

/** `ForgeService` coupe à dix minutes : au-delà, la requête est perdue. */
const PLAFOND_PAR_DEFAUT = 600;

export const ForgeProgress: React.FC<ForgeProgressProps> = ({
  titre,
  sousTitre,
  onAbandon,
  libelleAbandon,
  seuilInquietude = 180,
  plafondSecondes = PLAFOND_PAR_DEFAUT,
  contexte,
}) => {
  /**
   * Le contexte de la requête, nommé plutôt qu'identifié.
   *
   * Le pont ne connaît que des identifiants — il dit l'étendue (« carnet
   * entier », « 3 sources filtrées »), pas les noms. Le carnet et le titre des
   * sources vivent ici. Les deux ensemble répondent à « qu'est-ce qui est
   * exactement en train d'être interrogé ? », question qui a manqué toute la
   * soirée du 2026-08-10 : une sélection de sources héritée d'un autre carnet
   * partait sans que rien ne l'affiche.
   */
  const { notebookTitre, sourcesDuCarnet, selectedSourceIds } = useBrainstormStore();
  // Un identifiant brut ne renseigne personne : quand le titre manque, on le dit
  // plutôt que d'afficher un UUID de trente-six caractères.
  const sourcesRetenues = selectedSourceIds
    .map(id => sourcesDuCarnet.find(s => s.id === id)?.titre)
    .filter((titre): titre is string => Boolean(titre));
  const sourcesSansNom = selectedSourceIds.length - sourcesRetenues.length;

  const [ecoule, setEcoule] = useState(0);
  const [journal, setJournal] = useState<EvenementMcp[]>([]);
  const finDuJournal = useRef<HTMLDivElement>(null);

  // Le compteur : la seule information garantie disponible.
  useEffect(() => {
    const debut = Date.now();
    const minuterie = setInterval(() => setEcoule(Date.now() - debut), 1000);
    return () => clearInterval(minuterie);
  }, []);

  // Le journal : présent si le pont l'expose, absent sans conséquence sinon.
  useEffect(() => {
    const desabonner = window.appBridge?.mcp?.onActivity?.((evenement) => {
      setJournal((precedent) => ajouterAuJournal(precedent, evenement));
    });
    return desabonner;
  }, []);

  useEffect(() => {
    finDuJournal.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [journal.length]);

  const secondes = Math.round(ecoule / 1000);
  const inquietant = secondes >= seuilInquietude;
  const critique = plafondSecondes > 0 && secondes >= plafondSecondes - 60;

  const couleur = (niveau: EvenementMcp['niveau']) => {
    if (niveau === 'erreur') return 'text-red-400';
    if (niveau === 'reponse') return 'text-emerald-400';
    if (niveau === 'requete') return 'text-purple-400';
    return 'text-white/40';
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-12 space-y-8 text-center animate-in zoom-in-95">
      <div className="w-32 h-32 relative">
        <div className="absolute inset-0 bg-purple-600/30 blur-3xl animate-pulse" />
        <div className="relative w-full h-full rounded-full border-4 border-dashed border-purple-500/50 flex items-center justify-center animate-spin-slow">
          <Zap size={48} className="text-purple-400" />
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-black uppercase tracking-widest text-white font-display mb-2">{titre}</h3>
        <p className="text-white/40 text-sm uppercase tracking-widest">{sousTitre}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className={`text-4xl font-black font-display tabular-nums transition-colors ${
          critique ? 'text-red-400' : inquietant ? 'text-amber-400' : 'text-white/60'
        }`}>
          {formatDuree(ecoule)}
        </p>
        {critique && (
          <p className="text-[10px] font-black uppercase tracking-widest text-red-400/60">
            La requête sera abandonnée à {formatDuree(plafondSecondes * 1000)}
          </p>
        )}
      </div>

      {onAbandon && (
        <button
          onClick={onAbandon}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/30 text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <XCircle size={14} /> {libelleAbandon ?? "Cesser d'attendre"}
        </button>
      )}

      {contexte && (
        <div className="w-full max-w-2xl bg-white/5 border border-white/5 rounded-[2rem] px-6 py-4 text-left space-y-2">
          <p className="flex items-center gap-3 text-xs text-white/60">
            <BookOpen size={14} className="text-purple-400/60 shrink-0" />
            <span className="font-bold">{contexte.entete}</span>
          </p>
          <p className="flex items-start gap-3 text-xs text-white/40">
            <FileText size={14} className="text-purple-400/40 shrink-0 mt-0.5" />
            <span>{contexte.detail}</span>
          </p>
        </div>
      )}

      {!contexte && (notebookTitre || sourcesRetenues.length > 0) && (
        <div className="w-full max-w-2xl bg-white/5 border border-white/5 rounded-[2rem] px-6 py-4 text-left space-y-2">
          {notebookTitre && (
            <p className="flex items-center gap-3 text-xs text-white/60">
              <BookOpen size={14} className="text-purple-400/60 shrink-0" />
              <span className="font-bold">{notebookTitre}</span>
            </p>
          )}
          <p className="flex items-start gap-3 text-xs text-white/40">
            <FileText size={14} className="text-purple-400/40 shrink-0 mt-0.5" />
            <span>
              {selectedSourceIds.length === 0
                ? `${sourcesDuCarnet.length} source${sourcesDuCarnet.length > 1 ? 's' : ''} — carnet entier`
                : [
                    ...sourcesRetenues,
                    ...(sourcesSansNom > 0
                      ? [`${sourcesSansNom} source${sourcesSansNom > 1 ? 's' : ''} au titre inconnu`]
                      : []),
                  ].join(' · ')}
            </span>
          </p>
        </div>
      )}

      {journal.length > 0 && (
        <div className="w-full max-w-2xl bg-black/40 border border-white/5 rounded-[2rem] p-6 text-left">
          <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest text-white/20">
            <Radio size={12} className="text-purple-400/60" /> Journal du pont
          </div>
          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1 font-mono text-xs">
            {journal.map((evenement, idx) => (
              <p key={idx} className={`leading-relaxed ${couleur(evenement.niveau)}`}>
                {evenement.message}
              </p>
            ))}
            <div ref={finDuJournal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgeProgress;
