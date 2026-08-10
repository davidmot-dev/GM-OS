import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useBrainstormStore,
  reserverLeCarnet,
  libererLeCarnet,
  abandonnerLaRequete,
  generationCourante,
} from '../store/useBrainstormStore';
import { forgeService } from '../../ForgeService';
import { useSessionOSStore } from '../../../session/useSessionOSStore';
import { useSessionStore } from '../../../../store/useSessionStore';
import { X, Zap, Sparkles, ChevronLeft, Shield, BookOpen, AlertTriangle, Users, Save, FolderTree } from 'lucide-react';
import DiscoveryUI from './DiscoveryUI';
import ForgeProgress from './ForgeProgress';
import {
  corpusChoisi,
  cheminDesFiches,
  cheminDesBrouillons,
  cheminDesPersonas,
} from '../../../../../electron/corpusSysteme';
import { slugFiche } from '../canevas';
import { ficheInventaire, lireInventaire } from '../inventaire';
import { slug } from '../../../../../electron/corpusSysteme';
import type { BrainstormCandidate } from '../types';

/** Ce que rend `ai:resolve-sections` — cf. `verifierLesCitations` dans `electron/bookIndex.ts`. */
interface ResolutionDesSections {
  /** Faux quand aucun index n'a pu être chargé : la fiche n'y est pour rien. */
  indexDisponible: boolean;
  sources: string[];
  resolutions: {
    demande: string;
    statut: 'exact' | 'approche' | 'introuvable';
    page?: number;
    entree?: string;
    score: number;
  }[];
  pagesDouteuses: number[];
  plage: { min: number; max: number } | null;
}

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
  // Rien de la campagne ouverte n'entre ici : l'atelier documente un livre.
  // La seule chose qu'on demande à Session OS est le chemin du retour au
  // Grimoire, qui lui y est resté.
  const setCurrentView = useSessionOSStore(s => s.setCurrentView);
  const setActiveModule = useSessionStore(s => s.setActiveModule);

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
  /**
   * Un inventaire vide et un inventaire indisponible ne se ressemblent pas.
   *
   * `ai:list-systems` vit dans le processus principal : sur une application
   * rechargée à chaud sans redémarrage, la poignée est absente. La liste serait
   * alors vide, la résolution retomberait sur l'identifiant du pilote — un
   * horodatage — et `aCreer` resterait faux faute d'inventaire pour en juger.
   * Le bandeau annoncerait donc un mauvais dossier **sans avertir**. On distingue
   * explicitement les deux cas plutôt que de laisser ce silence.
   */
  const [inventaireDisponible, setInventaireDisponible] = useState(true);
  /** Nom d'un corpus qui n'existe pas encore — un jeu qu'on documente en premier. */
  const [nouveauCorpus, setNouveauCorpus] = useState('');
  useEffect(() => {
    if (!window.appBridge?.ai?.listSystems) {
      setInventaireDisponible(false);
      return;
    }
    window.appBridge.ai.listSystems()
      .then(dossiers => { setDossiersSystemes(dossiers); setInventaireDisponible(true); })
      .catch(() => setInventaireDisponible(false));
  }, []);

  /**
   * Le corpus documenté : celui qu'on a choisi, et rien d'autre.
   *
   * **Documenter un corpus est une opération de bibliothèque, pas une opération
   * de campagne.** Le corpus de Dune est le même pour toutes les campagnes Dune.
   * Le déduire de la campagne active obligeait qui voulait l'enrichir à
   * réaffecter d'abord le pilote d'une campagne — et à en abîmer une au passage.
   *
   * Il a d'abord été rétrogradé en simple valeur par défaut, et cela n'a pas
   * suffi : un défaut hérité d'ailleurs reste un choix que personne n'a fait, et
   * la forge est repartie sur Blade Runner alors que Dune était visé. Le corpus
   * se **désigne** donc, ici, et la Forge s'en souvient d'une séance à l'autre.
   *
   * **Et il est mémoïsé, ce qui n'est pas un détail de performance.**
   * `corpusChoisi` construit un objet neuf à chaque appel. Recalculé à chaque
   * rendu, il changeait d'identité à chaque rendu — donc `releverLeDisque` aussi,
   * donc l'effet qui en dépend repartait, écrivait un tableau neuf dans l'état,
   * provoquait un rendu, et ainsi de suite : « Maximum update depth exceeded »,
   * relevé en pleine forge le 2026-08-10. Les dépendances réelles sont le
   * dossier choisi et l'inventaire des dossiers, tous deux stables.
   */
  const corpus = useMemo(
    () => (brainstormStore.corpusCible ? corpusChoisi(brainstormStore.corpusCible, dossiersSystemes) : null),
    [brainstormStore.corpusCible, dossiersSystemes],
  );

  /**
   * Ce qui est déjà forgé, lu sur le disque et non en mémoire de session.
   *
   * **Une fiche existe dans `rules/` ou elle n'existe pas.** La coche de la
   * liste des sujets venait de `savedCandidateIds`, vidé dès qu'on terminait :
   * on avait forgé une fiche, elle était bien enregistrée, et l'écran
   * l'affichait comme restant à faire. Le disque, lui, survit à la fermeture —
   * c'est ce qui rend la série de treize reprenable d'une séance à l'autre.
   */
  const [fichesPubliees, setFichesPubliees] = useState<string[]>([]);
  const [brouillonsEnAttente, setBrouillonsEnAttente] = useState<string[]>([]);

  const releverLeDisque = useCallback(async () => {
    if (!corpus || !window.appBridge?.ai?.listDir) return;
    const nomsEnSlugs = (noms: string[]) =>
      noms.filter(n => n.endsWith('.md')).map(n => n.replace(/\.md$/, ''));
    const [publiees, brouillons] = await Promise.all([
      window.appBridge.ai.listDir(cheminDesFiches(corpus)).catch(() => []),
      window.appBridge.ai.listDir(cheminDesBrouillons(corpus)).catch(() => []),
    ]);
    setFichesPubliees(nomsEnSlugs(publiees));
    setBrouillonsEnAttente(nomsEnSlugs(brouillons));
  }, [corpus]);

  // Au chargement, et après chaque écriture : l'écran suit le disque.
  useEffect(() => { void releverLeDisque(); }, [releverLeDisque, brainstormStore.step]);

  /** Sujets de l'inventaire qui n'ont pas encore de fiche sur le disque. */
  const restantAForger = brainstormStore.candidates
    .filter(c => !fichesPubliees.includes(c.id)).length;

  const cheminDeLaFiche = brainstormStore.activeCard && corpus
    ? `${cheminDesFiches(corpus)}/${brainstormStore.activeCard.slug}.md`
    : '';

  /**
   * Les sections citées, résolues en pages du livre — **pendant la revue**.
   *
   * **Pourquoi ici et pas ailleurs.** Les pages rendues par le carnet sont
   * fausses : neuf fiches Dune sur dix-sept citaient au-delà de la dernière page
   * du livre, dont une page 1279 pour un ouvrage qui s'arrête à 328. Les
   * gabarits v3 demandent donc des titres de section, vérifiables contre l'index
   * réel — mais le résolveur n'avait aucun appelant en production. *Une
   * vérification qu'il faut lancer à la main n'est pas une vérification, c'est
   * une intention.*
   *
   * La revue est le seul moment où elle vaut : après, la fiche est dans `rules/`
   * et l'Oracle la cite. Elle ne bloque pas la publication — une section
   * introuvable peut être un index incomplet autant qu'un titre inventé, et
   * c'est un humain qui tranche. Elle donne de quoi trancher.
   */
  const [resolution, setResolution] = useState<ResolutionDesSections | null>(null);
  const [resolutionEnCours, setResolutionEnCours] = useState(false);

  useEffect(() => {
    const carte = brainstormStore.activeCard;
    const resoudre = window.appBridge?.ai?.resolveSections;
    if (brainstormStore.step !== 'review' || !carte || !corpus || !resoudre) {
      setResolution(null);
      return;
    }
    let abandonne = false;
    setResolutionEnCours(true);
    resoudre(corpus.id, carte.content)
      .then(r => { if (!abandonne) setResolution(r); })
      .catch(() => { if (!abandonne) setResolution(null); })
      .finally(() => { if (!abandonne) setResolutionEnCours(false); });
    return () => { abandonne = true; };
  }, [brainstormStore.step, brainstormStore.activeCard, corpus]);

  /** Les candidats tirés d'un inventaire, quelle qu'en soit la provenance. */
  const construireCandidats = useCallback((inventaire: string) => {
    const candidats = lireInventaire(inventaire).map(entree => ({
      id: slugFiche(entree.sujet),
      title: entree.sujet,
      category: 'rule' as const,
      summary: entree.lu
        ? entree.mecanique || "Le carnet n'a pas résumé la mécanique."
        : "Le carnet n'a rien rendu sur ce sujet — à interroger pour lever le doute.",
      tags: [
        entree.lu ? entree.traite : 'sans reponse',
        ...(entree.horsCanevas ? ['hors canevas'] : []),
        ...entree.sections.slice(0, 3),
      ],
    }));
    // La « forge libre » du tableau de bord s'ajoute au canevas, elle ne le
    // remplace pas : demander au carnet de choisir ses sujets est exactement ce
    // qui faisait dériver la taxonomie d'un jeu à l'autre.
    //
    // Et elle ne se dédouble pas : taper « Poursuites » ne doit pas créer une
    // seconde ligne pour un sujet que l'inventaire porte déjà.
    const libre = brainstormStore.customSubject.trim();
    const slugLibre = libre ? slugFiche(libre) : '';
    const inedit = slugLibre && !candidats.some(c => c.id === slugLibre);

    brainstormStore.setCandidates(
      inedit
        ? [{ id: slugLibre, title: libre, category: 'rule' as const, summary: '', tags: ['hors canevas'] }, ...candidats]
        : candidats,
      inventaire,
    );
  }, [brainstormStore.customSubject, brainstormStore.setCandidates]);

  /**
   * Reprend l'inventaire déjà enregistré, sans rien demander au carnet.
   *
   * **Treize fiches, c'est une demi-heure : personne ne fait ça d'une traite.**
   * L'inventaire coûte soixante-douze secondes et disparaissait dès qu'on
   * fermait l'atelier — il fallait le repayer pour reprendre la série. Il est
   * sur le disque, sous forme de fiche : autant le relire.
   *
   * Le frontmatter n'appartient pas à la réponse du carnet : on le retire pour
   * que le tableau soit lu exactement comme il l'a été la première fois.
   */
  const reprendreInventaire = useCallback(async (): Promise<boolean> => {
    if (!corpus) return false;
    const chemin = `${cheminDesFiches(corpus)}/inventaire-des-mecaniques.md`;
    const enregistre = await window.appBridge?.ai?.readDoc?.(chemin);
    if (!enregistre) return false;
    construireCandidats(enregistre.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim());
    return true;
  }, [corpus, construireCandidats]);

  const handleDiscover = useCallback(async () => {
    if (!brainstormStore.notebookId) return;
    const gen = reserverLeCarnet();
    if (gen === null) return;
    brainstormStore.setProcessing(true);
    try {
      const { inventaire } = await forgeService.discoverCandidates(
        brainstormStore.notebookId,
        brainstormStore.selectedSourceIds
      );
      if (gen !== generationCourante()) return;   // abandonnée entre-temps
      construireCandidats(inventaire);
    } catch (err: unknown) {
      if (gen !== generationCourante()) return;
      brainstormStore.setError(messageErreur(err, t('session.forge_module.atelier.error_title')));
    } finally {
      libererLeCarnet(gen);
    }
  }, [brainstormStore.notebookId, brainstormStore.selectedSourceIds, t, brainstormStore.setProcessing, brainstormStore.setCandidates, brainstormStore.setError]);

  /**
   * Le sujet libre se répercute sans repayer l'inventaire.
   *
   * Il n'était injecté qu'à la construction de la liste : le taper alors que
   * l'inventaire était déjà affiché ne faisait rien, et rafraîchir coûtait
   * soixante-douze secondes de requête au carnet pour retrouver le même tableau.
   * Or le tableau est en mémoire — `inventaireBrut` — et la liste s'en
   * reconstruit sans rien demander à personne.
   */
  useEffect(() => {
    if (brainstormStore.step !== 'discovery') return;
    if (!brainstormStore.inventaireBrut) return;
    construireCandidats(brainstormStore.inventaireBrut);
  }, [brainstormStore.customSubject, brainstormStore.inventaireBrut, brainstormStore.step, construireCandidats]);

  useEffect(() => {
    if (brainstormStore.step === 'discovery' && brainstormStore.candidates.length === 0 && !brainstormStore.isProcessing && !brainstormStore.error) {
      // Le disque d'abord : une requête au carnet ne se paie que si rien n'a
      // encore été enregistré pour ce corpus.
      reprendreInventaire().then(repris => { if (!repris) handleDiscover(); });
    }
  }, [brainstormStore.step, brainstormStore.candidates.length, brainstormStore.isProcessing, brainstormStore.error, handleDiscover, reprendreInventaire]);

  /**
   * Cesse d'attendre la requête en cours.
   *
   * **Ne prétend pas l'arrêter** : le serveur poursuit et répondra dans le vide.
   * Le « X » de fermeture ne faisait que remettre l'affichage à zéro, en
   * laissant le verrou tenu — relancer une forge ne faisait alors rien, sans le
   * moindre message, jusqu'à ce que la requête retombe.
   */
  const handleAbandon = () => {
    abandonnerLaRequete();
    brainstormStore.setProcessing(false);
    brainstormStore.setStep('discovery');
  };

  /**
   * Passe la synthèse de l'inventaire en revue, comme une fiche.
   *
   * Elle n'a coûté aucune requête de plus : c'est la réponse du gabarit 1, qu'on
   * jetait après en avoir extrait la liste des sujets. La procédure la prescrit
   * comme fiche du corpus depuis l'origine — c'est elle qui donne à l'Oracle la
   * vue d'ensemble, là où chaque fiche donne un sujet.
   */
  const handleRevoirInventaire = () => {
    const brut = brainstormStore.inventaireBrut;
    if (!brut || !corpus) return;
    brainstormStore.reviewCard({
      id: 'inventaire-des-mecaniques',
      title: 'Inventaire des mécaniques',
      category: 'rule',
      summary: '',
      tags: [],
      content: ficheInventaire(brut, corpus.id),
      systemId: corpus.id,
      forgedAt: Date.now(),
      slug: 'inventaire-des-mecaniques',
      sections: [],
      avertissements: [],
    });
  };

  /** Rédige la fiche. **N'écrit rien** : la revue vient ensuite. */
  const handleForge = async (candidate: BrainstormCandidate) => {
    if (!brainstormStore.notebookId || !corpus) {
        brainstormStore.setError(t('session.forge_module.atelier.error_no_corpus'));
        return;
    }
    const gen = reserverLeCarnet();
    if (gen === null) return;
    brainstormStore.startForging();

    const cheminBrouillon = `${cheminDesBrouillons(corpus)}/${slugFiche(candidate.title)}.md`;
    try {
      /**
       * Une moitié déjà obtenue ne se repaie pas.
       *
       * Le brouillon partiel porte la première moitié — règle et valeurs — d'une
       * fiche dont la seconde requête a échoué. Le gabarit entier dépassait le
       * délai du serveur à 356 secondes ; scinder ne sert à rien si l'on rejoue
       * quand même les deux moitiés.
       */
      const partiel = await window.appBridge?.ai?.readDoc?.(cheminBrouillon);
      const moitieDeja = partiel && !/^##\s*À la table/m.test(partiel) ? partiel : undefined;

      const card = await forgeService.forgeCard(
        brainstormStore.notebookId,
        candidate,
        // Le frontmatter `systeme:` porte le nom du dossier de corpus : c'est
        // lui que le moteur de selection et le resolveur d'index emploient.
        corpus.id,
        brainstormStore.selectedSourceIds,
        {
          moitieDeja,
          // La première moitié part sur le disque AVANT la seconde requête :
          // c'est ce qui rend la scission utile plutôt que seulement plus lente.
          surMoitie: (regle) => { void window.appBridge?.ai?.writeDoc?.(cheminBrouillon, regle); },
        },
      );
      if (gen !== generationCourante()) return;   // abandonnée entre-temps

      // Le brouillon part sur le disque AVANT la revue. Une fiche coûte une à
      // deux minutes de génération : la perdre parce qu'on ferme la fenêtre est
      // un gâchis que rien ne justifie. Un brouillon n'engage rien — il est
      // hors de l'index de l'Oracle — et la revue devient une publication.
      await window.appBridge?.ai?.writeDoc?.(
        `${cheminDesBrouillons(corpus)}/${card.slug}.md`,
        card.content,
      );
      // Le slug définitif vient du sujet canonique : si la première moitié avait
      // été rangée sous un autre nom, son brouillon partiel resterait orphelin.
      if (`${cheminDesBrouillons(corpus)}/${card.slug}.md` !== cheminBrouillon) {
        await window.appBridge?.ai?.deleteDoc?.(cheminBrouillon);
      }
      brainstormStore.reviewCard(card);
    } catch (err: unknown) {
      if (gen !== generationCourante()) return;
      brainstormStore.setError(messageErreur(err, t('session.forge_module.atelier.error_title')));
    } finally {
      libererLeCarnet(gen);
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

      // Publiée, la fiche remplace son brouillon. Le garder ferait cohabiter
      // deux versions du même sujet — le défaut corrigé ce matin sur le corpus
      // v1, qu'il serait absurde de recréer ici.
      if (corpus) {
        await window.appBridge?.ai?.deleteDoc?.(`${cheminDesBrouillons(corpus)}/${card.slug}.md`);
      }
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
    if (!corpus) {
      brainstormStore.setError(t('session.forge_module.atelier.error_no_corpus'));
      return;
    }
    const gen = reserverLeCarnet();
    if (gen === null) return;
    brainstormStore.startPersonas();
    try {
      const resultat = await forgeService.forgePersonas(
        brainstormStore.notebookId,
        brainstormStore.selectedSourceIds
      );
      if (gen !== generationCourante()) return;   // abandonnée entre-temps
      brainstormStore.setPersonas(resultat);
    } catch (err: unknown) {
      if (gen !== generationCourante()) return;
      brainstormStore.setError(messageErreur(err, t('session.forge_module.atelier.error_title')));
    } finally {
      libererLeCarnet(gen);
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

            {/*
              Ce bouton choisit le corpus a documenter. Il ne touche PAS a la
              campagne : sa version precedente reecrivait `campaign.system`, si
              bien que vouloir enrichir le corpus de Dune obligeait a reaffecter
              le pilote d une campagne Blade Runner — ce qui est arrive.
            */}
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-0.5">
                {t('session.forge_module.atelier.corpus_label')}
              </span>
              <button
                onClick={() => brainstormStore.setError('SELECT_CORPUS')}
                className="flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-white transition-all group"
              >
                <Shield size={12} className={corpus ? 'text-purple-400' : 'text-red-500'} />
                {corpus ? (
                  <span className="font-mono">{corpus.id}</span>
                ) : (
                  <span className="text-red-500 italic">{t('session.forge_module.atelier.corpus_none')}</span>
                )}
              </button>
            </div>
          </div>
          
          <button
            onClick={() => { abandonnerLaRequete(); brainstormStore.reset(); }}
            className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all"
          >
            <X size={28} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-8">
          
          { (brainstormStore.error || !corpus) && (
            <div className={`mb-8 p-8 border rounded-[3rem] animate-in slide-in-from-top-4 shadow-xl transition-all duration-500 ${
              brainstormStore.error === 'SELECT_CORPUS' || (!corpus && !brainstormStore.error)
                ? 'bg-purple-600/10 border-purple-500/20 shadow-purple-900/10'
                : 'bg-[#ff4d4d]/10 border-[#ff4d4d]/20 shadow-red-900/10'
            }`}>

              {brainstormStore.error && brainstormStore.error !== 'SELECT_CORPUS' && (
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

              { (brainstormStore.error === 'SELECT_CORPUS' || !corpus) && (
                <div className="space-y-4 mb-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <FolderTree size={16} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black uppercase tracking-tight text-white font-display">
                          {t('session.forge_module.atelier.corpus_choose')}
                        </h4>
                        <p className="text-xs text-white/30 mt-0.5">
                          {t('session.forge_module.atelier.corpus_choose_hint')}
                        </p>
                      </div>
                    </div>
                    {brainstormStore.error === 'SELECT_CORPUS' && (
                      <button
                        onClick={() => brainstormStore.setError(null)}
                        className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                      >
                        {t('common:actions.cancel')}
                      </button>
                    )}
                  </div>

                  {/*
                    On liste les DOSSIERS de corpus, pas les pilotes. C'est ce
                    qu'on documente, et c'est ce que lisent le moteur de
                    selection, le resolveur d index et les personas. Choisir ici
                    n ecrit rien dans la campagne.
                  */}
                  <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {dossiersSystemes.map(dossier => {
                      const isSelected = corpus?.id === dossier;
                      return (
                        <button
                          key={dossier}
                          onClick={() => {
                            brainstormStore.setCorpusCible(dossier);
                            brainstormStore.setError(null);
                          }}
                          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left group relative overflow-hidden ${
                            isSelected
                              ? 'bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-900/20'
                              : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-purple-500/30'
                          }`}
                        >
                          <FolderTree size={16} className={isSelected ? 'text-purple-400' : 'text-white/20'} />
                          <p className={`text-xs font-mono truncate transition-colors ${
                            isSelected ? 'text-white' : 'text-white/60 group-hover:text-white'
                          }`}>
                            {dossier}
                          </p>
                        </button>
                      );
                    })}
                    {dossiersSystemes.length === 0 && (
                      <p className="col-span-3 text-xs text-white/30 italic py-6 text-center">
                        {t('session.forge_module.atelier.corpus_no_inventory')}
                      </p>
                    )}
                  </div>

                  {/*
                    Un systeme documente pour la premiere fois n'a pas encore de
                    dossier : la liste ci-dessus ne peut pas le proposer. Sans
                    cette entree, l'atelier serait ferme aux jeux nouveaux —
                    c'est-a-dire a ceux qui en ont le plus besoin.
                  */}
                  <div className="pt-4 mt-2 border-t border-white/5 flex items-center gap-3">
                    <input
                      value={nouveauCorpus}
                      onChange={e => setNouveauCorpus(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && slug(nouveauCorpus)) {
                          brainstormStore.setCorpusCible(slug(nouveauCorpus));
                          brainstormStore.setError(null);
                        }
                      }}
                      placeholder={t('session.forge_module.atelier.corpus_new_placeholder')}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/80 font-mono focus:outline-none focus:border-purple-500/50 placeholder:text-white/20"
                    />
                    <button
                      disabled={!slug(nouveauCorpus)}
                      onClick={() => {
                        brainstormStore.setCorpusCible(slug(nouveauCorpus));
                        brainstormStore.setError(null);
                      }}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        slug(nouveauCorpus)
                          ? 'bg-purple-600 text-white hover:bg-purple-500'
                          : 'bg-white/5 text-white/10 cursor-not-allowed'
                      }`}
                    >
                      {t('session.forge_module.atelier.corpus_new_button')}
                    </button>
                  </div>
                  {slug(nouveauCorpus) && (
                    <p className="text-[10px] text-white/30 font-mono">
                      systems/{slug(nouveauCorpus)}
                    </p>
                  )}
                </div>
              )}

              {brainstormStore.error && brainstormStore.error !== 'SELECT_CORPUS' && (
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
              corpus.aCreer || !inventaireDisponible
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-white/5 border-white/5'
            }`}>
              <FolderTree size={16} className={corpus.aCreer || !inventaireDisponible ? 'text-amber-400 mt-0.5' : 'text-purple-400/60 mt-0.5'} />
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
                    {/*
                      Choisi a la main, un dossier neuf est voulu — on l'annonce.
                      Deduit, il signale que les fiches partiraient loin de
                      l'index et des personas : c'est un avertissement.
                    */}
                    {corpus.raison === 'choisi'
                      ? t('session.forge_module.atelier.corpus_will_create')
                      : t('session.forge_module.atelier.corpus_new_folder')}
                  </p>
                )}
                {/*
                  L'avertissement de contradiction vivait ici : il disait qu'un
                  chemin déclaré désignait un autre dossier que le nom du
                  système. Il n'a plus de sujet — un corpus choisi à la main ne
                  se contredit avec rien, et c'est désormais le seul chemin.
                  `resoudreCorpus` continue de la produire côté lecture, où la
                  campagne décide encore.
                */}
                {!inventaireDisponible && (
                  <p className="text-xs text-amber-200/60 leading-relaxed mt-2">
                    {t('session.forge_module.atelier.corpus_no_inventory')}
                  </p>
                )}
              </div>
            </div>
          )}

          {brainstormStore.step === 'discovery' && (
            <>
              <DiscoveryUI
                fichesPubliees={fichesPubliees}
                brouillonsEnAttente={brouillonsEnAttente}
                onSelect={handleForge}
                onAbandon={handleAbandon}
                onEnregistrerInventaire={brainstormStore.inventaireBrut ? handleRevoirInventaire : undefined}
              />
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
              onAbandon={handleAbandon}
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

               {/*
                 Les sections citées, confrontées à l'index du livre.
                 C'est ce qui sépare une citation vérifiable d'une citation
                 plausible — et c'est le dernier moment où cela se regarde :
                 après, la fiche est dans `rules/` et l'Oracle la cite.
               */}
               {(resolutionEnCours || resolution) && (
                 <div className="p-8 bg-white/2 border border-white/5 rounded-[3rem]">
                   <div className="flex items-center gap-4 mb-5">
                     <BookOpen size={18} className="text-purple-400/60" />
                     <h4 className="text-sm font-black uppercase tracking-widest text-white/40 font-display">
                       {t('session.forge_module.atelier.sections_title')}
                     </h4>
                     {resolutionEnCours && (
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/20 animate-pulse">
                         {t('session.forge_module.atelier.sections_checking')}
                       </span>
                     )}
                   </div>

                   {resolution && !resolution.indexDisponible && (
                     // Pas d'index n'est pas une fiche fautive : on ne compte
                     // pas « zéro section résolue », ce serait l'en accuser.
                     <p className="text-xs text-white/30 leading-relaxed">
                       {t('session.forge_module.atelier.sections_no_index', { corpus: corpus?.id ?? '' })}
                     </p>
                   )}

                   {resolution?.indexDisponible && (() => {
                     const resolues = resolution.resolutions.filter(r => r.statut !== 'introuvable');
                     const perdues = resolution.resolutions.filter(r => r.statut === 'introuvable');
                     return (
                       <div className="space-y-4">
                         <p className="text-xs text-white/40 leading-relaxed">
                           {t('session.forge_module.atelier.sections_score', {
                             resolues: resolues.length,
                             total: resolution.resolutions.length,
                             sources: resolution.sources.join(', '),
                           })}
                         </p>

                         <div className="flex flex-wrap gap-2">
                           {resolution.resolutions.map((r, idx) => (
                             <span
                               key={`${r.demande}-${idx}`}
                               title={r.entree && r.entree !== r.demande ? r.entree : undefined}
                               className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border ${
                                 r.statut === 'exact'
                                   ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300/80'
                                   : r.statut === 'approche'
                                     ? 'bg-amber-500/10 border-amber-500/20 text-amber-200/80'
                                     : 'bg-red-500/10 border-red-500/20 text-red-300/70'
                               }`}
                             >
                               {r.demande}
                               <span className="ml-2 font-mono opacity-60">
                                 {r.page ? `p. ${r.page}` : t('session.forge_module.atelier.sections_unresolved')}
                               </span>
                             </span>
                           ))}
                         </div>

                         {perdues.length > 0 && (
                           // Ni accusation ni blanc-seing : une section introuvable
                           // peut venir d'un index incomplet autant que d'un titre
                           // inventé. C'est un humain qui tranche.
                           <p className="text-xs text-red-300/50 leading-relaxed">
                             {t('session.forge_module.atelier.sections_unresolved_hint')}
                           </p>
                         )}

                         {resolution.pagesDouteuses.length > 0 && (
                           <div className="flex items-start gap-3 pt-2">
                             <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                             <p className="text-xs text-red-300/60 leading-relaxed">
                               {t('session.forge_module.atelier.sections_impossible_pages', {
                                 pages: resolution.pagesDouteuses.join(', '),
                                 max: resolution.plage?.max ?? '?',
                               })}
                             </p>
                           </div>
                         )}
                       </div>
                     );
                   })()}
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

               {/*
                 Les trois actions n'ont pas le meme poids, et l'ecran disait le
                 contraire : « Terminer » etait le bouton le plus voyant alors
                 qu'il ferme tout. Sur dix-sept sujets, continuer est la regle et
                 terminer l'exception — se tromper de bouton coutait la serie en
                 cours. La suite domine donc, les deux sorties s'effacent.
               */}
               <div className="flex items-center justify-between gap-6 pt-8">
                 <div className="flex gap-3">
                   <button
                     onClick={() => brainstormStore.reset()}
                     className="px-6 py-3 text-white/30 hover:text-white/60 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                     {t('session.forge_module.atelier.btn_finish')}
                   </button>
                   {/*
                     Le Grimoire est resté dans Session OS : depuis le module
                     Forge, y aller demande de changer de module *et* de vue.
                     Poser la vue sans le module laissait l'écran sur la Forge,
                     le Grimoire ouvert derrière, invisible.
                   */}
                   <button
                     onClick={() => {
                       brainstormStore.reset();
                       setCurrentView('rule-workshop');
                       setActiveModule('dashboard');
                     }}
                     className="px-6 py-3 text-accent/50 hover:text-accent rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                   >
                     <BookOpen size={14} />
                     {t('modules:session.header.grimoire_label')}
                   </button>
                 </div>

                 <button
                   onClick={() => brainstormStore.setStep('discovery')}
                   className="px-14 py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-purple-900/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 text-base"
                   autoFocus
                 >
                   <Zap size={20} />
                   <span className="flex flex-col items-start leading-tight">
                     {t('session.forge_module.atelier.btn_forge_next')}
                     {restantAForger > 0 && (
                       <span className="text-[10px] font-bold text-white/50 normal-case tracking-normal">
                         {t('session.forge_module.atelier.remaining', { restant: restantAForger })}
                       </span>
                     )}
                   </span>
                 </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BrainstormOverlay;
