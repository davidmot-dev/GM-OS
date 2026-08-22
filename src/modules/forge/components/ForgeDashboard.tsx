import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Hammer, FileUp, Globe, X, Rocket, Zap, Sparkles, ChevronRight, Shield, Layers, AlertTriangle, Terminal, Users, FolderTree } from 'lucide-react';
import { forgeService } from '../ForgeService';
import ForgeProgress from '../rules/components/ForgeProgress';
import RevueDuPilote from './RevueDuPilote';
import PanneauDesPersonas from '../corpus/PanneauDesPersonas';
import PanneauDesFiches from '../corpus/PanneauDesFiches';
import { lireFichesDuCorpus } from '../rules/lectureDuCorpus';
import { GROUPES } from '../rules/GroupesDeChamps';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { gmToast } from '../../../stores/useToastStore';
import { gmConfirm } from '../../../stores/useModalStore';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { tousLesPilotes } from '../../session/store/tousLesPilotes';
import { enrichirLePilote } from '../rules/enrichirLePilote';
import { useAIStore } from '../../../stores/useAIStore';
import { useBrainstormStore } from '../rules/store/useBrainstormStore';
import { corpusChoisi, corpusPourNouveauSysteme, slug, sousDossiersDuCorpus } from '../../../../electron/corpusSysteme';
import { useForgeStore, type LacuneDuPilote } from '../store/useForgeStore';
import { lireNature } from '../rules/familleDuCorpus';
import {
  declarationAffichee, fusionnerLaDeclaration, type DeclarationSaisie,
} from '../rules/declarationDuCorpus';
import { SelecteurDeMoteur } from '../../ai/SelecteurDeMoteur';

interface NotebookSource {
  id: string;
  title: string;
  source_type: string;
}

interface Notebook {
  id: string;
  title: string;
  sources?: NotebookSource[];
  source_count?: number;
  sources_count?: number;
}

/*
  **Plus de `mode`.** Il n'existait que pour basculer vers la Forge de chronique,
  retirée le 2026-08-16 : ce tableau de bord ne sert plus qu'à un seul métier,
  documenter un système de jeu.
*/

/**
 * Ce que le corpus ne couvre pas — **et qui ne doit pas se perdre**.
 *
 * Chaque ligne nomme un groupe de champs qu'aucune fiche n'a rempli. C'est la
 * seule sortie qui dise où le corpus est muet, et elle vaut surtout *après*
 * l'enregistrement : elle liste les fiches que l'Atelier doit produire avant
 * qu'une seconde dérivation vaille la peine. D'où sa survie à `reset()`.
 */
const JournalDesLacunes: React.FC<{ lacunes: LacuneDuPilote[] }> = ({ lacunes }) => {
  const { t } = useTranslation(['modules']);
  if (lacunes.length === 0) return null;

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 space-y-3">
      <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 font-display">
        <AlertTriangle size={14} /> {t('modules:session.forge_module.corpus_forge.gaps_title')}
      </h4>
      <ul className="space-y-2">
        {lacunes.map((lacune, i) => (
          <li key={`${lacune.groupe}-${i}`} className="text-xs text-app-text/70">
            <span className="font-bold">
              {GROUPES.find(g => g.id === lacune.groupe)?.label ?? lacune.groupe}
            </span>
            <span className="opacity-60"> — {lacune.raison}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-app-text/40 leading-relaxed">
        {t('modules:session.forge_module.corpus_forge.gaps_hint')}
      </p>
    </div>
  );
};

const ForgeDashboard: React.FC = () => {
  const { t, i18n } = useTranslation(["modules"]);
  /*
    La campagne active n'entre plus ici. Les pilotes et les modèles de fiche
    sont un catalogue global — ils vivent dans le store de session mais ne
    dépendent d'aucune campagne —, et c'est tout ce dont la Forge a besoin.
  */
  const {
    saveGameDriver, addSheetTemplate, updateSheetTemplate,
    customGameDrivers, customSheetTemplates,
  } = useSessionOSStore();


  // ... tabs state etc ...

  const allDrivers = tousLesPilotes(customGameDrivers);

  const [activeTab, setActiveTab] = useState<'structure' | 'rules'>('structure');
  /**
   * N'enrichir que le pilote, sans toucher à la fiche de personnage.
   *
   * **Coché par défaut, et c'est un choix.** Une fiche écrite à la main nomme
   * rarement ses champs comme une dérivation les nommerait — `hp` contre
   * `points_de_vie`, `mentalHealth` contre `sante_mentale`. L'ajout se faisant
   * par identifiant, la fusion produirait des doublons de jauges sur toutes les
   * fiches de personnage. Le défaut protège donc ce qui existe ; décocher est un
   * geste délibéré.
   */
  const [piloteSeulement, setPiloteSeulement] = useState(true);

  // Stores
  const forgeStore = useForgeStore();
  const brainstormStore = useBrainstormStore();

  // Logs & UI Local State
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  /**
   * Ce que la dernière lecture du corpus a trouvé.
   *
   * Le dossier lu s'affiche pendant l'attente parce qu'un dossier vide et un
   * mauvais dossier se ressemblent — et qu'une forge partie vers le mauvais
   * corpus a déjà coûté une soirée le 2026-08-10.
   */
  const [lectureDuCorpus, setLectureDuCorpus] = useState<{ chemin: string; nombre: number } | null>(null);
  
  // NotebookLM Integration State
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<Notebook | null>(null);
  const [notebookSources, setNotebookSources] = useState<NotebookSource[]>([]);

  /**
   * Les dossiers de corpus, et celui qui est vise.
   *
   * Le menu ci-dessous designe un DOSSIER de `docs/systems/`, pas un pilote :
   * c est ce que lisent la selection RAG, le resolveur d index et les personas.
   * La campagne active ne fournit qu une valeur par defaut, et rien n est ecrit
   * dans ses donnees.
   */
  const [dossiersSystemes, setDossiersSystemes] = useState<string[]>([]);
  /**
   * L'inventaire des dossiers, relu **à la demande**.
   *
   * Il ne se lisait qu'au montage, ce qui suffisait tant que rien ne pouvait
   * naître depuis cet écran. Un corpus ouvert ci-dessous doit apparaître dans
   * le menu sans relancer l'application — sinon on vient de créer un dossier
   * qu'on ne peut toujours pas choisir, ce qui est le défaut d'origine sous une
   * autre forme.
   */
  const inventorierLesCorpus = React.useCallback(
    () => (window.appBridge?.ai?.listSystems?.() ?? Promise.resolve([]))
      .then(setDossiersSystemes)
      .catch(() => setDossiersSystemes([])),
    [],
  );
  useEffect(() => { void inventorierLesCorpus(); }, [inventorierLesCorpus]);

  /**
   * Le corpus visé : celui qu'on a choisi, et rien d'autre.
   *
   * La campagne active en fournissait la valeur par défaut. Un défaut hérité
   * d'ailleurs reste un choix que personne n'a fait : le 2026-08-10, il a
   * envoyé une forge Dune vers `systems/blade-runner`. La Forge est un module,
   * elle n'a pas de campagne — le corpus se désigne ci-dessous.
   */
  const corpusVise = brainstormStore.corpusCible
    ? corpusChoisi(brainstormStore.corpusCible, dossiersSystemes)
    : null;

  /**
   * Les corpus qui se déclarent **famille**, et celui qu'on a désigné.
   *
   * **Pourquoi une déclaration et non une convention de nom.** Le préfixe
   * `srd-` du dossier aurait suffi aujourd'hui, mais il ferait dépendre le
   * comportement d'un nom que personne ne s'est engagé à tenir. Un corpus dit
   * ce qu'il est dans son `corpus.json` ; son absence en fait un jeu, ce qui
   * laisse les neuf corpus existants intacts — *on ne fait pas payer une
   * nouveauté à l'existant.*
   *
   * **Et la famille se DÉSIGNE, elle ne se devine pas.** On aurait pu la
   * déduire du `dice.engine` du pilote, mais ce champ naît au milieu de la
   * dérivation, après le groupe qui en aurait besoin. Surtout, c'est la règle
   * du corpus : *un défaut hérité d'ailleurs reste un choix que personne n'a
   * fait* — le 2026-08-10, il a envoyé une forge Dune vers Blade Runner.
   */
  const [famillesConnues, setFamillesConnues] = useState<string[]>([]);
  /**
   * De quoi relire la liste après une déclaration.
   *
   * **Sans elle, on aurait déclaré une famille sans la voir apparaître** — et
   * la seule façon de le vérifier aurait été de recharger la fenêtre, ce que
   * l'écran existe précisément pour éviter.
   */
  const [relectureDesFamilles, setRelectureDesFamilles] = useState(0);
  useEffect(() => {
    let annule = false;
    (async () => {
      const trouvees: string[] = [];
      for (const dossier of dossiersSystemes) {
        const brut = await window.appBridge?.ai?.readDoc?.(`systems/${dossier}/corpus.json`).catch(() => null);
        if (lireNature(brut)?.nature === 'famille') trouvees.push(dossier);
      }
      if (!annule) setFamillesConnues(trouvees);
    })();
    return () => { annule = true; };
  }, [dossiersSystemes, relectureDesFamilles]);

  /**
   * La langue déclarée par un corpus, lue à la demande.
   *
   * Lue au lancement plutôt que gardée en état : un `corpus.json` corrigé entre
   * deux forges doit valoir tout de suite, sans redémarrer l'application.
   */
  const langueDuCorpus = async (dossier: string): Promise<string | undefined> => {
    const brut = await window.appBridge?.ai?.readDoc?.(`systems/${dossier}/corpus.json`).catch(() => null);
    return lireNature(brut)?.langue ?? i18n.language;
  };

  /**
   * Ce que le corpus visé déclare de lui-même, et de quoi le changer.
   *
   * **Le réglage n'avait pas d'écran.** Un corpus dit sa nature, son moteur et
   * sa langue dans `corpus.json` ; les trois se saisissaient à la main, dans un
   * éditeur de texte, hors de l'application — l'un des deux restes « code » du
   * corpus au § 5 de la réconciliation. *On répète qu'une valeur qu'on ne peut
   * pas corriger à la main est une valeur qu'on subit ; celle-ci ne se
   * corrigeait QUE à la main, ce qui revient au même.*
   */
  const [declaration, setDeclaration] = useState<DeclarationSaisie>({ nature: 'jeu', moteur: '', langue: '' });
  /*
    **On dépend de l'IDENTIFIANT, pas de l'objet.** `corpusVise` est recomposé à
    chaque rendu : en dépendre relirait le fichier à chaque frappe de clavier
    ailleurs dans l'écran.
  */
  const idDuCorpusVise = corpusVise?.id ?? null;
  useEffect(() => {
    let annule = false;
    (async () => {
      if (!idDuCorpusVise) return;
      const brut = await window.appBridge?.ai?.readDoc?.(`systems/${idDuCorpusVise}/corpus.json`).catch(() => null);
      if (!annule) setDeclaration(declarationAffichee(brut));
    })();
    return () => { annule = true; };
  }, [idDuCorpusVise]);

  /**
   * Enregistre la déclaration, **sans perdre ce que le fichier portait déjà**.
   *
   * C'est la leçon du trousseau de clés : *retaper une clé détruisait les
   * autres*, parce qu'on réécrivait le coffre entier depuis ce qu'un seul écran
   * connaissait. On relit, on fusionne, on écrit.
   */
  const enregistrerLaDeclaration = async (saisie: DeclarationSaisie) => {
    if (!corpusVise) return;
    setDeclaration(saisie);

    const chemin = `systems/${corpusVise.id}/corpus.json`;
    const brut = await window.appBridge?.ai?.readDoc?.(chemin).catch(() => null);
    const { json, erreur } = fusionnerLaDeclaration(brut, saisie);

    if (erreur) {
      gmToast(erreur);
      return;
    }
    const ecrit = await window.appBridge?.ai?.writeDoc?.(chemin, json!).catch(() => false);
    if (!ecrit) {
      gmToast("La déclaration n'a pas pu être écrite sur le disque.");
      return;
    }
    // La liste des socles se relit tout de suite : déclarer une famille sans la
    // voir apparaître obligerait à recharger la fenêtre.
    setRelectureDesFamilles(n => n + 1);
  };

  /**
   * Ouvrir le corpus d'un jeu que **personne n'a encore documenté**.
   *
   * **Le défaut qu'il corrige, relevé par David le 2026-08-21 :** « je ne sais
   * pas créer de nouveau corpus dans l'Atelier de Règles ». Le menu ci-dessous
   * ne propose que les dossiers présents sur le disque — c'est sa raison d'être
   * — et le bouton « Analyser » exige un corpus choisi. Un jeu neuf n'avait donc
   * aucune porte : la seule création de corpus vivait au bout de
   * `handleForgeSave`, c'est-à-dire *après* une dérivation, alors que la
   * procédure va dans l'autre sens — les fiches d'abord, le pilote ensuite.
   *
   * Le geste existait pourtant déjà, dans `BrainstormOverlay`, sous un
   * commentaire qui disait exactement ce qu'il fallait : « sans cette entrée,
   * l'atelier serait fermé aux jeux nouveaux ». Mais l'overlay ne s'affiche
   * qu'une fois l'atelier lancé : **la création était enfermée derrière la
   * porte qu'elle devait ouvrir.**
   *
   * **Les dossiers naissent tout de suite**, et non à la première fiche. Trois
   * `mkdir` rendent le corpus visible partout ailleurs — l'onglet Structure, le
   * grimoire, la sélection RAG — au lieu de le laisser à l'état d'intention
   * dans un champ de saisie que fermer suffit à perdre. Et `sousDossiersDuCorpus`
   * les crée tous les trois : un corpus sans `index/` ni `personas/` se paie en
   * `catch {}` silencieux, ce que le corpus de Dune a déjà coûté.
   */
  const [nouveauCorpus, setNouveauCorpus] = useState('');
  const [ouvertureEnCours, setOuvertureEnCours] = useState(false);

  const ouvrirUnCorpus = async () => {
    const id = slug(nouveauCorpus);
    if (!id || ouvertureEnCours) return;
    setOuvertureEnCours(true);
    try {
      const corpus = corpusChoisi(id, dossiersSystemes);
      const creerCorpus = window.appBridge?.ai?.createCorpus;
      // Annoncé par ce qui a réellement eu lieu : rejoindre un corpus existant
      // et en ouvrir un neuf ne se confondent pas.
      const crees = creerCorpus
        ? await creerCorpus(sousDossiersDuCorpus(corpus)).catch(() => null)
        : null;

      if (crees === null) {
        const message = t('modules:session.forge_module.corpus_unavailable', { racine: corpus.racine });
        addLog(message);
        gmToast(message, 'warning');
      } else if (crees.length > 0) {
        const message = t('modules:session.forge_module.corpus_created', { racine: corpus.racine, nombre: crees.length });
        addLog(message);
        gmToast(message, 'success');
      } else {
        const message = t('modules:session.forge_module.corpus_joined', { racine: corpus.racine });
        addLog(message);
        gmToast(message, 'info');
      }

      /*
        On vise le corpus même quand le pont est indisponible : le dossier
        manquera, mais l'atelier écrira au bon endroit et la première fiche le
        créera. Refuser ici laisserait l'écran exactement dans l'impasse qu'on
        vient de corriger.
      */
      await inventorierLesCorpus();
      brainstormStore.setCorpusCible(id);
      setNouveauCorpus('');
    } finally {
      setOuvertureEnCours(false);
    }
  };

  const [familleCible, setFamilleCible] = useState<string | null>(null);
  const familleVisee = familleCible ? corpusChoisi(familleCible, dossiersSystemes) : null;
  const [isLoadingNotebooks, setIsLoadingNotebooks] = useState(false);
  const [importingSources, setImportingSources] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (logEndRef.current) {
      // `nearest` : on suit le journal dans son cadre, sans emporter la page
      // entière à chaque ligne — une dérivation en écrit une vingtaine.
      logEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [logs]);

  // Quarante lignes : une dérivation en écrit une par groupe, une par lacune et
  // une par fichier écarté. À dix, elle effaçait ses propres lacunes.
  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-40), `> ${msg}`]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      for (const f of files) {
        const isPdf = f.type === 'application/pdf' || f.name.endsWith('.pdf');
        const isMarkdown = f.name.endsWith('.md') || f.name.endsWith('.txt') || f.name.endsWith('.csv') || f.name.endsWith('.json');
        
        let content = '';
        if (isMarkdown) {
          const reader = new FileReader();
          const textPromise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
          });
          reader.readAsText(f);
          content = await textPromise;
        } else {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
          });
          reader.readAsDataURL(f);
          content = await base64Promise;
        }

        forgeStore.addContextItem({
          name: f.name,
          type: isPdf ? 'pdf' : isMarkdown ? 'text' : 'image',
          content,
          mimeType: f.type
        });
        addLog(`LOADED: ${f.name}`);
      }
    }
  };

  const handleOpenNotebookLM = async () => {
    setIsNotebookModalOpen(true);
    setIsLoadingNotebooks(true);
    addLog(t('modules:session.forge_module.notebook.connecting'));
    try {
      const result = await forgeService.callMcpTool<{ notebooks?: Notebook[], data?: { notebooks: Notebook[] }, content?: string }>('notebooklm-mcp-server', 'notebook_list', { max_results: 100 });
      
      const rawData = result.notebooks || result.data?.notebooks || result.content;
      let notebooksToSet: Notebook[] = [];

      if (typeof rawData === 'string') {
        try {
          const parsed = JSON.parse(rawData);
          notebooksToSet = (parsed.notebooks || parsed.data || (Array.isArray(parsed) ? parsed : [])) as Notebook[];
        } catch {
          notebooksToSet = [];
        }
      } else if (Array.isArray(rawData)) {
        notebooksToSet = rawData as Notebook[];
      } else if (rawData && typeof rawData === 'object') {
        const obj = rawData as Record<string, unknown>;
        notebooksToSet = (obj.notebooks || obj.data || []) as Notebook[];
      }

      setNotebooks(notebooksToSet);
      addLog(t('modules:session.forge_module.notebook.linked_count', { count: notebooksToSet.length || 0 }));
    } catch (err) {
      addLog(t('modules:session.forge_module.notebook.fetch_error'));
      console.error(err);
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  const handleNotebookSelect = async (notebookId: string) => {
    setIsLoadingNotebooks(true);
    addLog(t('modules:session.forge_module.notebook.browsing', { id: notebookId }));
    try {
      const result = await forgeService.callMcpTool<{ notebook?: unknown, sources?: unknown, content?: unknown }>('notebooklm-mcp-server', 'notebook_get', { notebook_id: notebookId });

      // Le client Gemini Notebook renvoie les sources **à côté** du carnet et
      // non dedans : `{ notebook: {...}, sources: [...] }`. Lire `.sources` sur
      // le seul objet `notebook` donnait une liste vide, sans erreur.
      const siblingSources = Array.isArray(result.sources)
        ? (result.sources as Array<{ id?: string; title?: string; source_type?: string }>).map(s => ({
            id: s.id || 'unknown',
            title: s.title || 'Untitled Source',
            source_type: s.source_type || 'archive',
          }))
        : null;

      let notebookData = result.notebook || result.content;
      if (typeof notebookData === 'string') {
        try {
          const parsed = JSON.parse(notebookData);
          notebookData = parsed.notebook || parsed;
        } catch { /* use as is */ }
      }

      if (Array.isArray(notebookData) && notebookData[0]) {
        const raw = notebookData[0] as unknown[];
        const title = raw[0] as string;
        const sourcesRaw = (raw[1] || []) as Array<[Array<string>, string]>;
        
        const mappedSources: NotebookSource[] = sourcesRaw.map(s => ({
          id: s[0]?.[0] || 'unknown',
          title: s[1] || 'Untitled Source',
          source_type: 'archive'
        }));

        const mappedNotebook: Notebook = {
          id: notebookId,
          title: title,
          sources: mappedSources
        };

        setSelectedNotebook(mappedNotebook);
        setNotebookSources(mappedSources);
        brainstormStore.setSourcesDuCarnet(mappedSources.map(s => ({ id: s.id, titre: s.title })));
        addLog(t('modules:session.forge_module.notebook.sources_extracted', { count: mappedSources.length }));
      } else if (notebookData && typeof notebookData === 'object') {
        const data = notebookData as Notebook & { sources?: NotebookSource[] };
        const sources = siblingSources ?? data.sources ?? [];
        setSelectedNotebook({ ...data, sources });
        setNotebookSources(sources);
        brainstormStore.setSourcesDuCarnet(sources.map(s => ({ id: s.id, titre: s.title })));
        addLog(t('modules:session.forge_module.notebook.sources_extracted', { count: sources.length }));
      } else {
        throw new Error("Notebook data not found in response");
      }
    } catch (err) {
      addLog(t('modules:session.forge_module.notebook.sources_fetch_error'));
      console.error(err);
    } finally {
      setIsLoadingNotebooks(false);
    }
  };

  const handleSourceImport = async (sourceId: string, title: string) => {
    if (importingSources.has(sourceId)) return;
    
    gmConfirm(
      t('modules:session.forge_module.notebook.import_confirm', { title }),
      async () => {
        addLog(t('modules:session.forge_module.notebook.importing', { title }));
        setImportingSources(prev => new Set(prev).add(sourceId));
        
        try {
          const result = await forgeService.callMcpTool<{ content: unknown }>('notebooklm-mcp-server', 'source_get_content', { source_id: sourceId });
          
          let content = result.content;
          if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
            try {
              const parsed = JSON.parse(content);
              content = parsed.content || parsed;
            } catch { /* use as is */ }
          }

          forgeStore.addContextItem({
            name: `[NB] ${title}`,
            type: 'text',
            content: typeof content === 'string' ? content : JSON.stringify(content),
            mimeType: 'text/plain'
          });
          addLog(t('modules:session.forge_module.notebook.import_success', { title }));
          gmToast(t('modules:session.forge_module.notebook.import_success', { title }), "success");
          
          setImportingSources(prev => {
            const next = new Set(prev);
            next.delete(sourceId);
            return next;
          });

        } catch (err: any) {
          addLog(t('modules:session.forge_module.notebook.import_error'));
          console.error(err);
          
          if (err.message?.includes('MCP_AUTH_EXPIRED')) {
            gmToast("Authentification NotebookLM expirée. Tentative de reconnexion forcée...", "warning");
            handleReconnect();
          } else {
            gmToast(t('modules:session.forge_module.notebook.import_error'), "error");
          }

          setImportingSources(prev => {
            const next = new Set(prev);
            next.delete(sourceId);
            return next;
          });
        }
      }
    );
  };

  const handleReconnect = async () => {
    addLog("REBOOTING MCP NEURAL BRIDGE...");
    try {
      await forgeService.callMcpTool('notebooklm-mcp-server', 'refresh_auth', {});
      addLog("BRIDGE RESTORED. PLEASE TRY AGAIN.");
      gmToast("Connexion rétablie. Vous pouvez réessayer l'import.", "success");
    } catch (err) {
      addLog("RECONNECTION FAILED. CHECK BROWSER LOGIN.");
      gmToast("Échec de la reconnexion. Vérifiez votre session Google.", "error");
    }
  };

  const removeContextItem = (index: number) => {
    forgeStore.removeContextItem(index);
    addLog("ITEM DISCARDED FROM CONTEXT.");
  };

  const startAnalysis = async () => {
    if (forgeStore.contextItems.length === 0) {
      console.warn("No context items!");
      return;
    }

    const { activeProvider } = useAIStore.getState();
    console.error(`[Forge] Provider: ${activeProvider}, Items: ${forgeStore.contextItems.length}`);

    forgeStore.startAnalysis();
    setLogs([]);
    addLog("IGNITING FORGE CORE...");
    
    try {
      console.error("[Forge] Calling forgeService.forgeSystem...");
      const result = await forgeService.forgeSystem(forgeStore.contextItems, forgeStore.userInstructions, forgeStore.targetSystemName);

      /*
        **Ce que la Forge n'a pas lu s'écrit AVANT le succès.** Annoncé après,
        « SUCCESS » aurait déjà emporté la lecture : le meneur croirait avoir
        forgé depuis tout ce qu'il a déposé. Ces lignes sont la dernière
        troncature muette du chemin IA, et le journal les attendait — son
        commentaire annonce « une ligne par fichier écarté » depuis le 20/08.
      */
      (result.ecarts ?? []).forEach(addLog);
      forgeStore.completeAnalysis(result);
      addLog("SUCCESS: UNIFIED SYSTEM CORE CONSTRUCTED.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "FORGING FAILED.";
      addLog(`ERROR: ${errorMsg}`);
      forgeStore.setError(errorMsg);
      console.error(err);
    }
  };

  /**
   * La Forge dérivée : le pilote sort des **fiches du corpus**, pas du livre.
   *
   * **Ce que cette voie remplace.** `startAnalysis` consolide jusqu'à 100 000
   * caractères de livre et les envoie d'un seul appel. Mesuré le 2026-08-12 :
   * le budget d'invite réel est d'environ 8 000 tokens — 77 % étaient jetés en
   * silence. Ici chaque groupe de champs reçoit les deux ou trois fiches qui le
   * concernent, et chaque valeur du pilote devient traçable jusqu'à une page
   * vérifiée.
   *
   * Comptez un quart d'heure pour huit groupes : d'où le compteur, d'où
   * l'abandon, et d'où le journal — quinze minutes sans nouvelle ne se
   * distinguent pas d'une panne.
   */
  const forgerDepuisLeCorpus = async () => {
    if (!corpusVise || forgeStore.isProcessing) return;

    const cle = (suffixe: string) => `modules:session.forge_module.corpus_forge.${suffixe}`;
    forgeStore.startAnalysis('corpus');
    setLogs([]);
    setLectureDuCorpus(null);

    try {
      const { chemin, fiches, ignorees } = await lireFichesDuCorpus(corpusVise);
      addLog(t(cle('reading'), { chemin }));
      setLectureDuCorpus({ chemin, nombre: fiches.length });

      // Un fichier écarté est dit, pas avalé : un corpus qu'on croit lu et qui
      // ne l'est qu'à moitié est le genre de trou qui se découvre trop tard.
      for (const ignoree of ignorees) {
        addLog(t(cle('ignored'), { fichier: ignoree.fichier, raison: ignoree.raison }));
      }

      if (fiches.length === 0) {
        const message = t(cle('empty'), { chemin });
        addLog(message);
        forgeStore.setError(message);
        gmToast(message, 'warning');
        return;
      }
      addLog(t(cle('read_count'), { nombre: fiches.length }));

      /*
        **Le socle commun, s'il y en a un.** Un SRD porte ce qu'un livre de jeu
        suppose connu — la mécanique de poussée de YZE, absente du corpus
        d'Alien en v3. Il ne sert qu'aux groupes que le jeu ne couvre pas : le
        jeu l'emporte toujours, sans quoi on forgerait un pilote générique et
        faux, pire qu'un pilote incomplet.

        Un échec de lecture n'arrête pas la dérivation : la famille est un
        supplément, pas une dépendance.
      */
      let fichesDeLaFamille: typeof fiches = [];
      if (familleVisee) {
        const lue = await lireFichesDuCorpus(familleVisee).catch(() => null);
        fichesDeLaFamille = lue?.fiches ?? [];
        addLog(
          fichesDeLaFamille.length > 0
            ? `SOCLE COMMUN : ${familleVisee.id}, ${fichesDeLaFamille.length} fiches lues.`
            : `SOCLE COMMUN : ${familleVisee.id} n'a rendu aucune fiche.`,
        );
      }

      const { resultat, echecs, comblements, interrompue } = await forgeService.forgeSystemDepuisCorpus(fiches, {
        fichesDeLaFamille,
        onProgres: (groupe, rang, total) =>
          forgeStore.setProgression({ label: groupe.label, rang, total }),
        // L'état est relu à chaque groupe : la valeur capturée à la fermeture
        // serait celle du premier rendu, et le bouton n'arrêterait rien.
        abandonne: () => useForgeStore.getState().arretDemande,
        // Aucune fiche ne dit comment le jeu s'appelle : le dossier, si.
        corpus: corpusVise.id,
        /*
          **La langue du corpus, sinon celle de l'interface.** Réglage demandé
          par David le 2026-08-17 : il forge parfois depuis des livres anglais et
          veut un résultat en français. Le déclaré l'emporte toujours — c'est
          tout l'intérêt d'un réglage par corpus.
        */
        langue: await langueDuCorpus(corpusVise.id),
      });

      forgeStore.completeAnalysis(
        { driver: resultat.driver ?? {}, template: resultat.template ?? {} },
        echecs,
      );
      if (interrompue) addLog(t(cle('aborted')));
      addLog(t(cle('done'), { remplis: GROUPES.length - echecs.length, lacunes: echecs.length }));

      /*
        **Un comblement se dit.** Il n'est ni un échec ni un succès ordinaire :
        le champ a été rempli, mais depuis le socle commun et non depuis le
        livre du jeu. C'est exactement ce qu'un humain doit relire — le socle
        décrit ce que plusieurs jeux ont en commun, et chacun le modifie.
      */
      for (const comble of comblements) {
        const groupe = GROUPES.find(g => g.id === comble.groupe);
        addLog(
          `COMBLÉ PAR LE SOCLE : ${groupe?.label ?? comble.groupe} — le corpus du jeu ne dit rien ` +
          'sur ce sujet, ces valeurs viennent de la famille et sont à vérifier.',
        );
      }
      for (const echec of echecs) {
        const groupe = GROUPES.find(g => g.id === echec.groupe);
        addLog(`${(groupe?.label ?? echec.groupe).toUpperCase()} : ${echec.raison}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'DÉRIVATION IMPOSSIBLE.';
      addLog(`ERROR: ${message}`);
      forgeStore.setError(message);
      gmToast(message, 'error');
      console.error(err);
    }
  };

  /**
   * Enregistre le pilote forgé — **et son corpus avec lui**.
   *
   * **Le défaut corrigé le 2026-08-10.** La Forge créait un pilote portant
   * `custom-${Date.now()}` et rien autour : aucun `corpusId`, aucun dossier. Un
   * pilote nommé « Dune : Aventures dans l'Imperium » naissait donc sans savoir
   * où vit son corpus, et c'est ce trou que `resoudreCorpus` rebouchait par
   * déduction à chaque lecture et à chaque écriture — jusqu'au jour où la
   * déduction échouait en silence, laissant les personas de Dune inertes.
   *
   * Deux gestes, donc, et le second n'est pas cosmétique : un corpus complet
   * mais vide **dit ce qu'il attend** ; un corpus absent ne dit rien.
   */
  /**
   * Le corpus auquel un pilote **sera** rattaché, calculé au même endroit que
   * l'enregistrement le fera.
   *
   * **Pourquoi extraite plutôt que recopiée.** La revue montre désormais ce
   * rattachement avant qu'on enregistre, et un affichage qui recalculerait la
   * destination de son côté finirait par annoncer autre chose que ce qui est
   * écrit. L'écart serait invisible : les deux chemins seraient plausibles.
   * C'est la règle déjà tenue par `electron/corpusSysteme.ts`, où l'écriture
   * résout comme la lecture pour exactement cette raison.
   */
  const corpusDeDestination = (nomDuPilote?: string) => {
    const nom = nomDuPilote || forgeStore.targetSystemName.trim();
    if (forgeStore.source === 'corpus' && corpusVise) return corpusVise;
    return nom ? corpusPourNouveauSysteme(nom, dossiersSystemes) : null;
  };

  const handleForgeSave = async () => {
    if (!forgeStore.analysisResult) return;

    /*
      Le nom peut manquer, et le refus doit alors s'expliquer.
      La version précédente sortait en silence quand `driver.name` ou
      `template.name` était vide : le bouton ne faisait rien, sans un mot. Or un
      pilote dérivé du corpus perd son nom dès que le groupe « Identité » n'a
      rien rendu — c'est un cas courant, pas une anomalie. La destination
      renseignée à gauche en tient lieu ; à défaut, on dit pourquoi on s'arrête.
    */
    const nom = forgeStore.analysisResult.driver.name || forgeStore.targetSystemName.trim();
    if (!nom) {
      const message = t('modules:session.forge_module.corpus_forge.cannot_save');
      addLog(message);
      gmToast(message, 'warning');
      return;
    }

    /*
      **ENRICHIR PLUTÔT QUE DOUBLER.** Jusqu'au 2026-08-16, l'enregistrement
      faisait `custom-${Date.now()}` sans condition : le sélecteur « Destination »
      ne servait qu'à NOMMER. Reforger un jeu déjà documenté produisait donc un
      pilote jumeau à côté de celui que les campagnes désignent, et un gabarit
      jumeau à côté de celui que les fiches de personnage désignent.

      Troisième forme du même défaut dans la journée — campagnes en double le
      matin, fiches d'acte l'après-midi. Ici elle coûtait le plus cher :
      `sheetData` est indexé par `field.id`, donc un gabarit remplacé vide des
      fiches déjà remplies, sans erreur ni champ en rouge.

      La cible ne peut être qu'un pilote PERSONNALISÉ : les pilotes de référence
      livrés avec le code ne s'éditent pas, on en dérive un neuf.
    */
    const cible = customGameDrivers.find(d => d.name === forgeStore.targetSystemName.trim());
    const driverId = cible?.id ?? `custom-${Date.now()}`;

    /*
      Le corpus se décide ici, par le même ordre d'autorité que la lecture : un
      nom qui désigne un dossier réel le rejoint, sinon on en crée un.

      **Sauf quand le pilote vient d'un corpus désigné** : il est alors rattaché
      à celui-là, sans repasser par le nom. Un pilote dérivé de
      `systems/alien` et nommé « Alien : le Jeu de Rôle » se serait vu créer un
      `systems/alien-le-jeu-de-role` voisin et vide, pendant que ses fiches
      seraient restées dans le premier.
    */
    const corpus = corpusDeDestination(forgeStore.analysisResult.driver.name)
      ?? corpusPourNouveauSysteme(nom, dossiersSystemes);

    const template: SheetTemplate = {
      ...forgeStore.analysisResult.template as SheetTemplate,
      isBuiltin: false,
      // Le nom du modèle est un libellé, pas une règle : le déduire ne fait
      // courir aucun risque, alors qu'un modèle sans nom est illisible dans les
      // menus. Ses SECTIONS, elles, ne s'inventent pas — leur absence est dite
      // à l'écran plutôt que comblée.
      name: forgeStore.analysisResult.template.name || `Fiche — ${nom}`,
    };

    /*
      **Le modèle d'abord, et le pilote reçoit l'identifiant qu'on lui a donné.**

      L'ordre inverse a produit un défaut visible dans l'état persisté au
      2026-08-14 : on fabriquait ici un `custom-template-<horodatage>`, on le
      posait dans `driver.templateId`, puis `addSheetTemplate` imposait son
      propre `tpl-<horodatage>` — c'est son droit, la duplication d'un modèle en
      dépend. Le pilote gardait donc une référence vers un identifiant qui n'a
      jamais existé. Le pilote « Within » en porte encore la trace.

      Ce que ça coûtait : `AddEntityForm` donne `driver.templateId` à chaque
      nouveau personnage, et `CombatCard` cherche ensuite le modèle par cet
      identifiant. Introuvable — donc pas de fiche, sans une erreur ni un champ
      en rouge. Le défaut habituel.

      On ne suppose plus l'identifiant, on le reçoit.
    */
    if (cible) {
      /*
        **On verse, on ne remplace pas.** `enrichirLePilote` remplit ce qui est
        vide, laisse ce qui est pourvu, et complète le gabarit par AJOUT seul —
        aucune section renommée, aucun champ retiré, parce que les fiches de
        personnage sont indexées par `field.id`.

        Ce qu'on écarte est DIT : une valeur dérivée qu'on ne pose pas reste une
        information que le meneur voudra peut-être arbitrer.
      */
      const gabaritExistant = customSheetTemplates.find(t => t.id === cible.templateId);
      /*
        **Pourquoi on peut vouloir laisser la fiche tranquille**, relevé sur
        Cthulhu Hack le 2026-08-16. La fiche de David nomme ses champs `hp`,
        `mentalHealth`, `capacitesSpeciales` ; la dérivation nomme les mêmes
        choses `points_de_vie`, `sante_mentale`, `capacites`. L'ajout se fait par
        identifiant : il aurait produit deux jauges de points de vie, deux de
        santé mentale et une section Capacités en double.

        C'est le cas NORMAL d'une fiche écrite à la main avant toute forge — et
        aucune fusion automatique ne peut deviner que deux identifiants désignent
        la même chose. On laisse donc le choix, plutôt que de trancher à la place
        du meneur.
      */
      const { driver, template: gabarit, journal } = enrichirLePilote(
        { driver: cible, ...(gabaritExistant && !piloteSeulement ? { template: gabaritExistant } : {}) },
        {
          driver: forgeStore.analysisResult.driver,
          ...(piloteSeulement ? {} : { template: forgeStore.analysisResult.template }),
        },
      );

      /*
        Trois cas, et un seul crée quelque chose. La fiche visée est mise à jour
        (ajouts seuls) ; on la laisse intacte si le meneur l'a demandé ; et un
        pilote qui n'en avait AUCUNE en reçoit une neuve — c'est une création,
        pas un écrasement.
      */
      const idDuGabarit = gabarit
        ? (updateSheetTemplate(gabarit.id, gabarit), gabarit.id)
        : (piloteSeulement ? cible.templateId : addSheetTemplate(template));

      saveGameDriver({
        ...driver,
        ...(idDuGabarit ? { templateId: idDuGabarit } : {}),
        corpusId: driver.corpusId || corpus.id,
      });

      if (piloteSeulement) {
        addLog('FICHE DE PERSONNAGE laissée intacte, à la demande : la dérivation n\'y a rien ajouté.');
      }

      addLog(`ENRICHISSEMENT de « ${cible.name} » — ${journal.remplis.length} champs remplis, `
        + `${journal.conserves.length} laissés en place, `
        + `${journal.sectionsAjoutees.length} sections et ${journal.champsAjoutes.length} champs ajoutés.`);
      for (const chemin of journal.remplis) addLog(`  rempli : ${chemin}`);
      // Ce qui diverge se lit un par un : c'est là que le meneur arbitre.
      for (const chemin of journal.conserves) addLog(`  conservé (la dérivation proposait autre chose) : ${chemin}`);
      gmToast(
        `« ${cible.name} » enrichi : ${journal.remplis.length} champs remplis, rien d'écrasé.`,
        'success',
      );
    } else {
      const templateId = addSheetTemplate(template);

      const driver: GameDriver = {
        ...forgeStore.analysisResult.driver as GameDriver,
        id: driverId,
        templateId,
        author: 'User',
        version: '1.0.0',
        name: nom,
        corpusId: corpus.id,
      };

      saveGameDriver(driver);
    }

    // La création est annoncée par ce qu'elle a réellement fait, pas par ce
    // qu'elle a tenté : rejoindre un corpus existant et en créer un neuf sont
    // deux situations qu'il ne faut pas confondre.
    const creerCorpus = window.appBridge?.ai?.createCorpus;
    const crees = creerCorpus
      ? await creerCorpus(sousDossiersDuCorpus(corpus)).catch(() => null)
      : null;
    if (crees === null) {
      addLog(t('modules:session.forge_module.corpus_unavailable', { racine: corpus.racine }));
    } else if (crees.length > 0) {
      addLog(t('modules:session.forge_module.corpus_created', { racine: corpus.racine, nombre: crees.length }));
    } else {
      addLog(t('modules:session.forge_module.corpus_joined', { racine: corpus.racine }));
    }

    addLog(t('modules:session.forge_module.sync_success'));
    forgeStore.reset();
  };

  return (
    <div className="h-full overflow-y-auto p-8 pt-6 flex flex-col gap-8 animate-in fade-in duration-500 custom-scrollbar bg-app-bg text-app-text font-sans">
      {/* Header Section */}
      {/* Navigation Tabs */}
      <div className="flex gap-4 p-1 bg-app-surface/40 rounded-2xl border border-app-border/10 w-fit self-center">
        <button
          onClick={() => setActiveTab('structure')}
          className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'structure' 
              ? 'bg-accent text-app-text shadow-glow-accent/20' 
              : 'text-app-text/40 hover:bg-app-text/5'
          }`}
        >
          {t('modules:session.forge_module.tabs.structure') || 'Structure Système'}
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'rules' 
              ? 'bg-purple-600 text-app-text shadow-glow-purple/20' 
              : 'text-app-text/40 hover:bg-app-text/5'
          }`}
        >
          {t('modules:session.forge_module.tabs.rules') || 'Atelier de Règles'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 pb-20 flex-1 min-h-0">
        {/* Left Column: Context & Discovery */}
        <div className="col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          
          {activeTab === 'structure' ? (
            <>
              {/* Metadata / Output Target */}
              <div className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col gap-3 hover:border-accent/30 transition-all">
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display">
                   <Rocket size={14} className="animate-pulse" /> {t('modules:session.forge_module.destination_label')}
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="relative group">
                    <select 
                      value={allDrivers.find(d => d.name === forgeStore.targetSystemName)?.id || ''} 
                      onChange={(e) => {
                        const driver = allDrivers.find(d => d.id === e.target.value);
                        if (driver) forgeStore.setTargetName(driver.name);
                        else if (e.target.value === 'NEW') forgeStore.setTargetName('');
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white/80 focus:outline-none focus:border-accent/50 appearance-none cursor-pointer transition-all hover:bg-white/10"
                    >
                      <option value="" disabled className="bg-app-bg text-white/40">-- Choisir un Driver --</option>
                      {allDrivers.map(d => (
                        <option key={d.id} value={d.id} className="bg-app-bg text-white">
                          {d.emoji} {d.name}
                        </option>
                      ))}
                      <option value="NEW" className="bg-app-bg text-accent font-black">+ CRÉER UN NOUVEAU SYSTÈME</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-accent transition-colors">
                      <ChevronRight size={14} className="rotate-90" />
                    </div>
                  </div>

                  <div className="relative">
                    <input 
                      type="text"
                      value={forgeStore.targetSystemName} 
                      onChange={(e) => forgeStore.setTargetName(e.target.value)} 
                      placeholder={t('modules:session.forge_module.destination_placeholder')} 
                      className="w-full bg-white/2 border-b border-white/10 p-2 text-sm text-white/80 focus:outline-none focus:border-accent/50 transition-all placeholder:text-white/10 font-sans italic" 
                    />
                    {!allDrivers.find(d => d.name === forgeStore.targetSystemName) && forgeStore.targetSystemName && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[8px] font-black text-accent uppercase tracking-widest animate-pulse">
                        <Sparkles size={10} /> Nouveau
                      </div>
                    )}
                  </div>

                  {/*
                      Le choix n'a de sens que sur un pilote PERSONNALISÉ visé :
                      une création n'a rien à préserver, et un pilote de
                      référence ne s'édite pas.
                  */}
                  {customGameDrivers.some(d => d.name === forgeStore.targetSystemName.trim()) && (
                    <label className="flex items-start gap-3 p-3 rounded-xl bg-white/2 border border-white/10 cursor-pointer hover:bg-white/5 transition-all">
                      <input
                        type="checkbox"
                        checked={piloteSeulement}
                        onChange={e => setPiloteSeulement(e.target.checked)}
                        className="mt-0.5 accent-accent"
                      />
                      <span className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-app-text/70">
                          Ne pas toucher à la fiche de personnage
                        </span>
                        <span className="text-[11px] text-app-text/40 leading-relaxed">
                          {piloteSeulement
                            ? "Seul le pilote est enrichi. La fiche existante reste telle quelle — ses champs, leurs identifiants, et les valeurs déjà saisies sur les personnages."
                            : "La dérivation ajoutera ses sections et ses champs manquants. Si elle nomme « points_de_vie » ce que ta fiche appelle « hp », tu obtiendras les deux."}
                        </span>
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/*
                La Forge dérivée du corpus.

                Elle est au-dessus du bac à contexte, et ce n'est pas un hasard
                d'agencement : c'est désormais la voie normale. Le pilote se
                projette des fiches déjà vérifiées ; déposer le livre reste
                possible en dessous, pour un jeu qu'aucun atelier n'a documenté.
              */}
              <div className="bg-purple-500/10 rounded-2xl border border-purple-500/20 p-5 flex flex-col gap-3 hover:border-purple-500/40 transition-all">
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 font-display">
                  <Layers size={14} /> {t('modules:session.forge_module.corpus_forge.label')}
                </h2>
                <p className="text-[10px] text-app-text/40 leading-relaxed">
                  {t('modules:session.forge_module.corpus_forge.hint')}
                </p>

                <div className="relative group">
                  <select
                    value={corpusVise?.id || ''}
                    onChange={(e) => brainstormStore.setCorpusCible(e.target.value || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white/80 focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer transition-all hover:bg-white/10"
                  >
                    <option value="" disabled className="bg-app-bg text-white/40">
                      {t('modules:session.forge_module.corpus_forge.choose')}
                    </option>
                    {dossiersSystemes.map(dossier => (
                      <option key={dossier} value={dossier} className="bg-app-bg text-white font-mono">
                        {dossier}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-purple-400 transition-colors">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>

                {/*
                  **Ce que ce corpus déclare de lui-même.** Trois champs qui
                  vivaient dans un fichier, hors de l'application : on ne devrait
                  pas avoir à ouvrir un éditeur de texte pour dire qu'un SRD est
                  un socle.

                  Il n'apparaît qu'une fois le corpus choisi — régler la nature
                  de « aucun corpus » n'a pas de sens, et un champ qui ne mord
                  sur rien invite à croire qu'il a agi.
                */}
                {corpusVise && (
                  <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                      Ce corpus est
                    </span>
                    <div className="flex gap-2">
                      {([
                        { valeur: 'jeu' as const, libelle: 'Un jeu' },
                        { valeur: 'famille' as const, libelle: 'Un socle commun' },
                      ]).map(choix => (
                        <button
                          key={choix.valeur}
                          onClick={() => void enregistrerLaDeclaration({ ...declaration, nature: choix.valeur })}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            declaration.nature === choix.valeur
                              ? 'bg-purple-600 text-white'
                              : 'bg-white/5 text-white/40 hover:bg-white/10'
                          }`}
                        >
                          {choix.libelle}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/*
                        Le moteur ne sert à personne AUJOURD'HUI — le socle se
                        choisit à la main dans le menu ci-dessous. Il est ici
                        parce que le fichier le documente, et le libellé le dit
                        plutôt que de laisser croire qu'il agit.
                      */}
                      <label className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-widest text-white/25">
                          Moteur (non lu)
                        </span>
                        <input
                          value={declaration.moteur ?? ''}
                          onChange={e => setDeclaration({ ...declaration, moteur: e.target.value })}
                          onBlur={() => void enregistrerLaDeclaration(declaration)}
                          placeholder="2d20, yze…"
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white/70 focus:outline-none focus:border-purple-500/50"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase tracking-widest text-white/25">
                          Langue de forge
                        </span>
                        <input
                          value={declaration.langue ?? ''}
                          onChange={e => setDeclaration({ ...declaration, langue: e.target.value })}
                          onBlur={() => void enregistrerLaDeclaration(declaration)}
                          placeholder={i18n.language}
                          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[11px] font-mono text-white/70 focus:outline-none focus:border-purple-500/50"
                        />
                      </label>
                    </div>
                    <p className="text-[9px] text-white/25 leading-relaxed">
                      Un socle commun ne se forge pas en pilote : il sert à combler les sujets
                      qu&apos;un corpus de jeu ne couvre pas. Vider un champ retire la déclaration.
                    </p>
                  </div>
                )}

                {/*
                  **Le socle commun, facultatif et désigné.** Il n'apparaît que
                  si un corpus se déclare famille : sans SRD, l'écran est
                  exactement celui d'avant. C'est la contrainte que David a
                  posée — « je n'ai pas de SRD pour tous les systèmes ».
                */}
                {famillesConnues.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Socle commun (facultatif)
                    </label>
                    <select
                      value={familleCible ?? ''}
                      onChange={(e) => setFamilleCible(e.target.value || null)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-[11px] font-bold text-white/70 focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer transition-all hover:bg-white/10"
                    >
                      <option value="" className="bg-app-bg text-white/40">Aucun — ce jeu seul</option>
                      {famillesConnues.map(f => (
                        <option key={f} value={f} className="bg-app-bg text-white font-mono">{f}</option>
                      ))}
                    </select>
                    <p className="text-[9px] text-white/25 leading-relaxed">
                      Sert uniquement aux sujets que le corpus du jeu ne couvre pas. Le jeu
                      l'emporte toujours, et chaque comblement est signalé.
                    </p>
                  </div>
                )}

                <button
                  onClick={forgerDepuisLeCorpus}
                  disabled={!corpusVise || forgeStore.isProcessing}
                  className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                    !corpusVise || forgeStore.isProcessing
                      ? 'bg-white/5 text-white/10 cursor-not-allowed'
                      : 'bg-purple-600 text-white shadow-glow-purple/30 hover:scale-105 active:scale-95'
                  }`}
                >
                  {t('modules:session.forge_module.corpus_forge.button')}
                </button>
                {!corpusVise && (
                  <p className="text-[10px] text-amber-300/60 leading-relaxed">
                    {t('modules:session.forge_module.corpus_forge.required')}
                  </p>
                )}
              </div>

              {/*
                **Les personas du corpus, ici et nulle part ailleurs pour les
                écrire.** `ForgeOS` pose la règle : on documente un corpus dans
                ce module, jamais depuis une campagne — c'est ce qui a évité
                qu'on réaffecte le pilote d'une campagne Blade Runner pour
                enrichir Dune. L'éditeur du moteur de règles les montre aussi,
                mais en lecture seule, avec un renvoi ici.

                Repliées par défaut : on vient dans cet écran pour forger, et
                huit zones de texte ouvertes repousseraient le reste hors de vue.
              */}
              {corpusVise && (
                <details className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 group">
                  <summary className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display cursor-pointer list-none">
                    <Users size={14} /> Personas du corpus
                    <ChevronRight size={12} className="ml-auto transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-5">
                    <PanneauDesPersonas
                      pilote={{ id: corpusVise.id, corpusId: corpusVise.id }}
                      compact
                    />
                  </div>
                </details>
              )}

              {/*
                **Le nettoyage à la main, à côté de ce qui le rend nécessaire.**
                L'archivage automatique ne couvre que ce que la Forge publie
                elle-même ; un corpus se répare aussi après une reforge ratée ou
                un import. Et surtout, cet écran est le seul à montrer les
                doublons de sujet — ce que le test d'unicité trouvait depuis le
                2026-08-11 sans que rien ne le rende visible dans l'application.
              */}
              {corpusVise && (
                <details className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 group">
                  <summary className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display cursor-pointer list-none">
                    <FolderTree size={14} /> Fiches du corpus
                    <ChevronRight size={12} className="ml-auto transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-5">
                    <PanneauDesFiches corpusId={corpusVise.id} />
                  </div>
                </details>
              )}

              {/* User Instructions Extension */}
              <div className="bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col gap-3 hover:border-accent/30 transition-all">
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent font-display">
                   <Sparkles size={14} className="text-amber-500" /> {t('modules:session.forge_module.intentions_label')}
                </h2>
                <textarea 
                  value={forgeStore.userInstructions} 
                  onChange={(e) => forgeStore.setInstructions(e.target.value)} 
                  placeholder={t('modules:session.forge_module.intentions_placeholder')} 
                  className="w-full bg-transparent text-xs text-app-text/60 focus:outline-none placeholder:text-app-text/20 font-sans border border-app-border/10 rounded-xl p-3 focus:border-accent/50 transition-all min-h-[100px] resize-none" 
                />
              </div>
            </>
          ) : (
            <>
              {/* Rules Atelier Settings */}
              <div className="bg-purple-500/10 rounded-2xl border border-purple-500/20 p-5 flex flex-col gap-4 animate-in slide-in-from-left-4">
                {/*
                  Ce menu choisit le CORPUS a documenter, pas le pilote de la
                  campagne. Sa version precedente appelait `updateCampaign` :
                  choisir « Dune » ici reassignait le pilote de la campagne
                  active — une campagne Blade Runner se retrouvait avec celui de
                  Dune — pendant que son « Chemin des Regles » continuait de
                  l emporter sur la resolution. On croyait forger Dune, on
                  forgeait Blade Runner en abimant une campagne au passage.

                  L atelier avait ete decouple ; ce point d entree-ci ne l etait
                  pas. Documenter un corpus reste une operation de bibliotheque.
                */}
                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 font-display">
                   <Shield size={14} /> {t('modules:session.forge_module.atelier.corpus_label')}
                </h2>

                <div className="relative group">
                  <select
                    value={corpusVise?.id || ''}
                    onChange={(e) => brainstormStore.setCorpusCible(e.target.value || null)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold text-white/80 focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer transition-all hover:bg-white/10"
                  >
                    <option value="" disabled className="bg-app-bg text-white/40">
                      {t('modules:session.forge_module.atelier.corpus_choose')}
                    </option>
                    {dossiersSystemes.map(dossier => (
                      <option key={dossier} value={dossier} className="bg-app-bg text-white font-mono">
                        {dossier}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-purple-400 transition-colors">
                    <ChevronRight size={14} className="rotate-90" />
                  </div>
                </div>

                {/*
                  La porte des jeux neufs. Le menu ci-dessus ne peut pas
                  proposer un dossier qui n'existe pas — c'est sa raison
                  d'etre —, et l'atelier ne demarre pas sans corpus vise :
                  sans cette entree, documenter un jeu par ses fiches est
                  impossible tant qu'on ne l'a pas d'abord derive d'un livre,
                  ce qui est l'ordre inverse de la procedure.
                */}
                <div className="flex items-center gap-2">
                  <input
                    value={nouveauCorpus}
                    onChange={e => setNouveauCorpus(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') void ouvrirUnCorpus(); }}
                    placeholder={t('modules:session.forge_module.atelier.corpus_new_placeholder')}
                    className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[11px] text-white/80 font-mono focus:outline-none focus:border-purple-500/50 placeholder:text-white/20"
                  />
                  <button
                    disabled={!slug(nouveauCorpus) || ouvertureEnCours}
                    onClick={() => void ouvrirUnCorpus()}
                    className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                      slug(nouveauCorpus) && !ouvertureEnCours
                        ? 'bg-purple-600 text-white hover:bg-purple-500'
                        : 'bg-white/5 text-white/10 cursor-not-allowed'
                    }`}
                  >
                    {t('modules:session.forge_module.atelier.corpus_new_button')}
                  </button>
                </div>
                {/*
                  Le dossier s'affiche avant d'etre cree : « Reves de Dragons »
                  donne `reves-de-dragons`, et c'est ce nom-la que le grimoire,
                  la selection RAG et les personas iront chercher. Le voir
                  d'avance evite le corpus jumeau, cree a une lettre pres de
                  celui qui porte deja les fiches.
                */}
                {slug(nouveauCorpus) && (
                  <p className="text-[10px] text-white/30 font-mono -mt-1">
                    systems/{slug(nouveauCorpus)}
                    {dossiersSystemes.some(d => d === slug(nouveauCorpus)) && (
                      <span className="text-amber-400/70 not-italic"> — existe deja, sera rejoint</span>
                    )}
                  </p>
                )}

                <div className="h-px bg-white/5 my-1" />

                <h2 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 font-display">
                   <Sparkles size={14} /> {t('modules:session.forge_module.atelier.custom_subject_label')}
                </h2>
                <textarea 
                  value={brainstormStore.customSubject} 
                  onChange={(e) => brainstormStore.setCustomSubject(e.target.value)} 
                  placeholder={t('modules:session.forge_module.atelier.custom_subject_placeholder')} 
                  className="w-full bg-white/5 text-xs text-app-text/80 focus:outline-none placeholder:text-white/10 font-sans border border-white/10 rounded-xl p-4 focus:border-purple-500/50 transition-all min-h-[120px] resize-none" 
                />
                {/*
                  Deux conditions, pas une. Le corpus n'a plus de valeur par
                  défaut : sans lui, l'atelier partirait sans savoir où écrire,
                  et ne le découvrirait qu'au moment d'enregistrer — une fiche
                  et deux minutes plus tard. On le bloque ici, et on dit
                  laquelle des deux manque.
                */}
                <button
                  disabled={!selectedNotebook || !corpusVise}
                  onClick={() => {
                    brainstormStore.setNotebook(selectedNotebook?.id || '', selectedNotebook?.title);
                    brainstormStore.startDiscovery();
                  }}
                  className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                    !selectedNotebook || !corpusVise ? 'bg-white/5 text-white/10 cursor-not-allowed' : 'bg-purple-600 text-white shadow-glow-purple/30 hover:scale-105 active:scale-95'
                  }`}
                >
                  {t('modules:session.forge_module.atelier.analyze_button')}
                </button>
                {!corpusVise && (
                  <p className="text-[10px] text-amber-300/60 leading-relaxed">
                    {t('modules:session.forge_module.atelier.corpus_required')}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Context Bin (Common to both tabs) */}
          <div className="flex-1 bg-app-surface/40 rounded-2xl border border-app-border/10 p-5 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-2xl font-black uppercase tracking-tighter text-accent font-display">
                <FileUp className="w-6 h-6" /> {t('modules:session.forge_module.context_title')}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleOpenNotebookLM}
                  className="p-2.5 hover:bg-accent/10 rounded-xl text-accent transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-accent/20"
                >
                  <Globe className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => (document.getElementById('forge-file-input') as HTMLInputElement)?.click()}
                  className="p-2.5 hover:bg-app-text/5 rounded-xl text-app-text/40 transition-all hover:scale-110 active:scale-90 border border-transparent hover:border-app-border/10"
                >
                  <FileUp className="w-6 h-6" />
                </button>
              </div>
              <input 
                id="forge-file-input"
                type="file" 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {(activeTab === 'structure' ? forgeStore.contextItems : notebookSources.filter(s => brainstormStore.selectedSourceIds.includes(s.id))).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-app-border/20 flex items-center justify-center mb-4 text-app-text">
                    <Rocket className="w-8 h-8" />
                  </div>
                  <p className="text-sm">{t('modules:session.forge_module.atelier.empty_sources')}</p>
                </div>
              )}
              
              {activeTab === 'structure' ? forgeStore.contextItems.map((item, idx) => (
                <div key={idx} className="group relative bg-app-text/5 p-4 rounded-xl border border-app-border/10 hover:border-accent/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/20 rounded-lg"><FileUp className="w-5 h-5 text-accent" /></div>
                    <div className="flex-1 min-w-0 text-app-text">
                      <p className="text-xs font-bold truncate">{item.name}</p>
                    </div>
                    <button onClick={() => removeContextItem(idx)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              )) : notebookSources.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => {
                    const current = brainstormStore.selectedSourceIds;
                    if (current.includes(s.id)) {
                      brainstormStore.setSources(current.filter(id => id !== s.id));
                    } else {
                      brainstormStore.setSources([...current, s.id]);
                    }
                  }}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                    brainstormStore.selectedSourceIds.includes(s.id) ? 'bg-purple-600/20 border-purple-500/50 shadow-glow-purple/10' : 'bg-app-text/5 border-app-border/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${brainstormStore.selectedSourceIds.includes(s.id) ? 'bg-purple-500 text-white' : 'bg-white/5 text-app-text/40'}`}>
                      <Globe className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold truncate flex-1">{s.title}</p>
                    {brainstormStore.selectedSourceIds.includes(s.id) && <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Forge Action Button */}
            {activeTab === 'structure' && (
              <div className="flex flex-col gap-2 mt-4">
                {/*
                  **Le moteur de cette Forge — axe J, et le MÊME composant que
                  l'atelier de campagne.**

                  Le § 8 du plan est explicite : les deux Forges ne sont pas des
                  doublons, mais leur plomberie partagée l'est — *« une
                  préoccupation partagée corrigée dans un seul de ses deux
                  exemplaires »* est le bug de la migration Gemini du 07/08. On
                  ne refabrique pas ce motif ici.

                  Affiché juste au-dessus du bouton, parce que c'est là que le
                  choix se fait : *« choix explicite à chaque lancement ».*
                */}
                <SelecteurDeMoteur forge="systeme" />
                <button 
                  onClick={startAnalysis}
                  disabled={forgeStore.contextItems.length === 0 || forgeStore.isProcessing}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
                    forgeStore.contextItems.length === 0 || forgeStore.isProcessing
                      ? 'bg-app-text/5 text-app-text/20 cursor-not-allowed' 
                      : 'bg-accent text-white shadow-glow-accent/20 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {forgeStore.isProcessing ? (
                    <>
                      <Zap className="w-5 h-5 animate-spin" />
                      {t('modules:session.forge_module.atelier.transmuting')}
                    </>
                  ) : (
                    <>
                      <Hammer className="w-5 h-5" />
                      {t('modules:session.forge_module.atelier.forge_button')}
                    </>
                  )}
                </button>
                
                {/*
                  Cet abandon-ci ne vaut que pour la forge par documents : il
                  rend la main sans rien arrêter, ce qui est acceptable pour un
                  appel unique qu'on cesse d'attendre. Le laisser paraître
                  pendant une dérivation serait un mensonge — l'écran
                  redeviendrait inerte pendant que huit groupes continueraient
                  de tourner, puis le résultat surgirait de nulle part. La
                  dérivation a son propre abandon, qui arrête la boucle.
                */}
                {forgeStore.isProcessing && forgeStore.source !== 'corpus' && (
                  <button
                    onClick={() => {
                      forgeStore.stopAnalysis();
                      addLog("TRANSMUTATION ABORTED MANUALLY.");
                      gmToast("Transmutation annulée", "info");
                    }}
                    className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    {t('modules:session.forge_module.atelier.abort_forge')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Content */}
        <div className="col-span-8 bg-app-surface/40 rounded-2xl border border-app-border/10 flex flex-col overflow-hidden shadow-2xl min-h-[600px] text-app-text relative">
          
          {activeTab === 'structure' ? (
            /*
              Trois états, dans l'ordre où ils comptent : ce qui tourne, ce qui
              est sorti, ce qu'on attend. La dérivation a son propre écran
              d'attente — un quart d'heure sans nouvelle ne se distingue pas
              d'une panne.
            */
            forgeStore.isProcessing && forgeStore.source === 'corpus' ? (
              <ForgeProgress
                titre={t('modules:session.forge_module.corpus_forge.progress_title')}
                sousTitre={
                  forgeStore.progression
                    ? t('modules:session.forge_module.corpus_forge.progress_group', {
                        rang: forgeStore.progression.rang,
                        total: forgeStore.progression.total,
                        groupe: forgeStore.progression.label,
                      })
                    : t('modules:session.forge_module.corpus_forge.reading', {
                        chemin: lectureDuCorpus?.chemin ?? corpusVise?.racine ?? '',
                      })
                }
                contexte={{
                  entete: lectureDuCorpus?.chemin ?? corpusVise?.racine ?? '',
                  detail: t('modules:session.forge_module.corpus_forge.progress_detail', {
                    nombre: lectureDuCorpus?.nombre ?? 0,
                    chemin: lectureDuCorpus?.chemin ?? corpusVise?.racine ?? '',
                  }),
                }}
                /* Aucun serveur MCP dans la boucle, donc aucune coupure à dix
                   minutes à annoncer ; et un quart d'heure est ici la normale,
                   pas l'anomalie. */
                plafondSecondes={0}
                seuilInquietude={1200}
                onAbandon={forgeStore.arretDemande ? undefined : () => {
                  forgeStore.demanderArret();
                  addLog(t('modules:session.forge_module.corpus_forge.abort'));
                }}
                libelleAbandon={t('modules:session.forge_module.corpus_forge.abort')}
              />
            ) : forgeStore.analysisResult ? (
              <div className="flex-1 p-8 overflow-y-auto space-y-8 custom-scrollbar">
                <h3 className="text-3xl font-black uppercase tracking-tighter font-display">{t('modules:session.forge_module.atelier.adn_built')}</h3>
                <div className="h-1 w-20 bg-accent rounded-full" />

                {/*
                  La revue complète, et pas un résumé.

                  Ce panneau montrait quatre valeurs — un nom, un moteur de dés,
                  deux libellés — pour un pilote qui en compte une quarantaine,
                  avec un bouton ENREGISTRER juste en dessous. Les identifiants
                  qui cassent en silence n'y figuraient pas. *La fiche se montre
                  avant d'être écrite* vaut ici comme à l'Atelier.
                */}
                <RevueDuPilote
                  driver={forgeStore.analysisResult.driver}
                  template={forgeStore.analysisResult.template}
                  corpusId={corpusDeDestination(forgeStore.analysisResult.driver.name)?.id}
                />

                {/* Un pilote sans nom n'est pas enregistrable : on dit laquelle
                    des deux sources manque, plutôt que de laisser un bouton ne
                    rien faire. */}
                {!forgeStore.analysisResult.driver.name && (
                  <p className="text-xs text-amber-300/70 leading-relaxed">
                    {t('modules:session.forge_module.corpus_forge.unnamed')}
                  </p>
                )}

                <div className="p-8 bg-accent rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-xl">{t('modules:session.forge_module.atelier.ready_title')}</p>
                    <p className="text-white/60 text-xs">{t('modules:session.forge_module.atelier.ready_desc')}</p>
                  </div>
                  <button
                    onClick={handleForgeSave}
                    className="px-8 py-4 bg-white text-accent rounded-xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    {t('modules:session.forge_module.atelier.btn_save')}
                  </button>
                </div>

                <JournalDesLacunes lacunes={forgeStore.lacunes} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6 overflow-y-auto custom-scrollbar">
                 <Rocket size={64} className="text-accent/20 animate-bounce" />
                 <h3 className="text-2xl font-bold font-display uppercase">{t('modules:session.forge_module.atelier.waiting_transmutation')}</h3>
                 <p className="text-app-text/40 max-w-md mx-auto">{t('modules:session.forge_module.atelier.transmutation_waiting_desc')}</p>
                 {/* Le journal des lacunes survit à l'enregistrement : c'est là
                     qu'il sert, puisqu'il dit ce que l'Atelier doit documenter
                     avant de reforger. */}
                 <div className="w-full max-w-2xl text-left"><JournalDesLacunes lacunes={forgeStore.lacunes} /></div>
              </div>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6 relative overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
               <Sparkles size={64} className="text-purple-400/20 animate-pulse" />
               <h3 className="text-2xl font-bold font-display uppercase text-purple-400">{t('modules:session.forge_module.atelier.brainstorm_title')}</h3>
               <p className="text-app-text/40 max-w-md mx-auto">{t('modules:session.forge_module.atelier.brainstorm_desc')}</p>

               {/*
                 L'atelier est monte une seule fois, globalement, par App.tsx.
                 Le monter aussi ici en creait une SECONDE instance : deux effets
                 identiques partaient de front vers le carnet, qui n'en honorait
                 qu'une partie. Il est en `fixed inset-0`, il n'a aucun besoin de
                 vivre dans cet arbre.
               */}
            </div>
          )}

          {/*
            Le journal, enfin affiché.

            `addLog` existait depuis toujours, `logs` était tenu à jour, et
            **rien ne le rendait** : la création d'un corpus, son échec faute de
            pont, les erreurs de forge et les fichiers écartés partaient dans un
            état que personne ne lisait. Un message qu'on n'affiche pas est un
            message qu'on n'a pas écrit.
          */}
          {logs.length > 0 && (
            <div className="shrink-0 border-t border-app-border/10 bg-black/40 px-6 py-4">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-app-text/20">
                <Terminal size={12} className="text-accent/60" /> Journal de la Forge
              </div>
              <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1 font-mono text-[11px] text-app-text/50">
                {logs.map((ligne, idx) => (
                  <p key={idx} className="leading-relaxed break-words">{ligne}</p>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* NotebookLM Modal Overlay (Keep same logic) */}
      {isNotebookModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-app-bg/80 backdrop-blur-sm animate-in fade-in">
           <div className="w-full max-w-4xl bg-app-bg border border-accent/20 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[70vh] text-app-text font-sans">
              <div className="p-6 border-b border-app-border/10 flex items-center justify-between bg-accent/5">
                 <h2 className="text-xl font-bold uppercase tracking-wider text-accent flex items-center gap-3 font-display">
                   <Globe className="w-6 h-6" /> {t('modules:session.forge_module.notebook.title')}
                 </h2>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={handleReconnect}
                      title="Forcer la reconnexion"
                      className="p-2 hover:bg-accent/10 rounded-full text-accent transition-all hover:rotate-180 duration-500"
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsNotebookModalOpen(false)} className="p-2 hover:bg-app-text/5 rounded-full text-app-text/40 transition-colors"><X /></button>
                 </div>
              </div>
              <div className="flex-1 flex overflow-hidden">
                 <div className="w-1/3 border-r border-app-border/10 overflow-y-auto p-4 space-y-2 bg-app-surface/20">
                    {isLoadingNotebooks && notebooks.length === 0 ? (
                      <div className="flex items-center justify-center h-40"><Zap className="w-8 h-8 text-accent animate-spin" /></div>
                    ) : (
                      notebooks.map(nb => (
                        <button 
                          key={nb.id} 
                          onClick={() => handleNotebookSelect(nb.id)} 
                          className={`w-full text-left p-4 rounded-2xl transition-all border ${
                            selectedNotebook?.id === nb.id 
                              ? 'bg-accent/20 border-accent/40 text-accent' 
                              : 'border-transparent hover:bg-app-text/5 text-app-text/40'
                          }`}
                        >
                          <div className="text-xs font-bold uppercase tracking-widest font-display">{nb.title}</div>
                        </button>
                      ))
                    )}
                 </div>
                 <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {selectedNotebook ? (
                      <div className="flex flex-col h-full gap-4">
                         <div className="grid grid-cols-1 gap-3">
                            {notebookSources.map(s => (
                              <div key={s.id} className="flex items-center justify-between p-4 bg-app-surface/40 rounded-2xl border border-app-border/10 hover:border-accent/30 transition-all">
                                <span className="text-sm font-medium">{s.title}</span>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleSourceImport(s.id, s.title)} 
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                      forgeStore.contextItems.some(item => item.name === `[NB] ${s.title}`)
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-accent/20 text-accent hover:bg-accent hover:text-white'
                                    }`}
                                  >
                                    {t('modules:session.forge_module.atelier.source_adn_btn')}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const current = brainstormStore.selectedSourceIds;
                                      if (current.includes(s.id)) {
                                        brainstormStore.setSources(current.filter(id => id !== s.id));
                                      } else {
                                        brainstormStore.setSources([...current, s.id]);
                                      }
                                    }}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                      brainstormStore.selectedSourceIds.includes(s.id)
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    }`}
                                  >
                                    {t('modules:session.forge_module.atelier.source_atelier_btn')}
                                  </button>
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20 italic">
                        <Rocket className="w-16 h-16 mb-4 text-app-text" />
                        <p>Sélectionnez un carnet</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ForgeDashboard;
