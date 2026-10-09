import React, { useEffect, useMemo, useState } from 'react';
import { useJournalStore } from './useJournalStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import {
  Book,
  History,
  Trash2,
  Download,
  Plus,
  Clock,
  Mic,
  StopCircle,
  Sparkles,
  Loader2,
  Music,
  Swords,
  User,
  UserRound,
  MapPin,
  FileText,
  Settings,
  HelpCircle,
  Dices,
  Radio,
  ScrollText,
} from 'lucide-react';
import { format } from 'date-fns';
import { gmToast } from '../../stores/useToastStore';
import { useTranslation } from 'react-i18next';
import CompteRenduDeSeance from './CompteRenduDeSeance';
import RevueDeSeance from './RevueDeSeance';
import { leFichierDuCompteRendu } from './compteRendu';
import { natureDe } from './curation';
import type { JournalEvent, JournalEventType } from './types';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';
import HorsDePortee from '../session/components/HorsDePortee';
import { gmConfirm } from '../../stores/useModalStore';
import { Panneau, Bouton, Etiquette, EnTeteDeModule } from '../../components/socle';
import { messageDException } from '../../utils/messageDException';

/**
 * **Chaque type, sa couleur et son pictogramme** — des catégories, pas des
 * états : un combat n'est pas une erreur. Les classes sont écrites en toutes
 * lettres, Tailwind ne voit pas une classe composée à l'exécution.
 */
const TYPES: Record<JournalEventType, { icone: React.ElementType; teinte: string }> = {
  COMBAT: { icone: Swords, teinte: 'text-gm-crimson border-gm-crimson/40 bg-gm-crimson/10' },
  NPC: { icone: User, teinte: 'text-gm-emerald border-gm-emerald/40 bg-gm-emerald/10' },
  // Le PJ se distingue du PNJ d'un coup d'œil : c'est la ligne qu'on cherche
  // en relisant le fil.
  PJ: { icone: UserRound, teinte: 'text-gm-cyan border-gm-cyan/40 bg-gm-cyan/10' },
  LOCATION: { icone: MapPin, teinte: 'text-gm-gold border-gm-gold/40 bg-gm-gold/10' },
  NOTE: { icone: FileText, teinte: 'text-app-text border-app-border bg-app-surface-2' },
  DICE: { icone: Dices, teinte: 'text-gm-violet border-gm-violet/40 bg-gm-violet/10' },
  ORACLE: { icone: HelpCircle, teinte: 'text-gm-violet border-gm-violet/40 bg-gm-violet/10' },
  AUDIO: { icone: Music, teinte: 'text-accent border-accent/40 bg-accent/10' },
  SYSTEM: { icone: Settings, teinte: 'text-app-muted border-app-border bg-app-surface-2' },
};

const titreDeZone = 'flex items-center gap-2 font-display text-base font-bold uppercase tracking-wider text-app-text';

/**
 * **Le journal de jeu** — refonte, L6, maquette retenue le 2026-09-27
 * (`stitch/meneur/meneur-journal.png`). David a choisi **le fil puis la revue,
 * sur une seule page** : 1. pendant la partie, le fil ; 2. après la partie, le
 * compte rendu et la revue scène par scène ; la note de fin ; à gauche, les
 * journaux de la campagne.
 *
 * « Filtrage par type d'extrait » (trois cases) n'existe pas dans le module :
 * le seul filtre est la bascule trace / chronique, et la maquette ne la
 * remplace pas.
 */
const JournalDashboard: React.FC = () => {
    /**
     * **Axe N — ce qui est à portée de main.** Le journal est le troisième des
     * cinq modules dédoublés.
     *
     * ⚠️ *Trouvé en chemin le 2026-08-23* : les deux suppressions de cet écran
     * n'avaient **aucune confirmation**, et elles sont invisibles jusqu'au
     * survol. *Une action qu'on ne voit pas venir ne peut pas s'éviter.*
     */
    const regime = useRegimeDInterface();
  const { t } = useTranslation();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [chroniqueSeule, setChroniqueSeule] = useState(false);
  const {
    journals,
    activeJournalId,
    setActiveJournal,
    removeEvent,
    deleteJournal,
    isRecording,
    toggleRecording,
    generateAISummary,
    syncToNotebook,
    updateJournalNote,
    reparerLesTitresDeCampagne
  } = useJournalStore();

  /*
    **Les journaux d'avant portent un identifiant en guise de titre.**

    `launchSession` passait `session.campaignId` à `startJournal`, qui fige le
    titre à l'ouverture de la séance : corriger l'appelant ne répare que les
    séances à venir. On répare ici les anciennes, une fois, à l'ouverture de
    l'écran — c'est le moment où l'on sait que les deux stores sont là, ce qu'une
    migration `persist` ne pourrait pas garantir entre deux stores indépendants.

    L'action ne réécrit rien quand il n'y a rien à réécrire, donc cet effet ne se
    rappelle pas lui-même.
  */
  const campagnes = useSessionOSStore(s => s.campaigns);
  const activeCampaignId = useSessionOSStore(s => s.activeCampaignId);
  useEffect(() => {
    reparerLesTitresDeCampagne(campagnes ?? []);
  }, [campagnes, reparerLesTitresDeCampagne]);

  const activeJournal = journals.find(j => j.id === activeJournalId);
  const events = useMemo(() => activeJournal?.events ?? [], [activeJournal]);
  const campagneDuJournal = (campagnes ?? []).find(c => c.id === (activeJournal?.campaignId ?? activeCampaignId));
  /*
    **Le résumé se lit sur son champ, comme partout ailleurs.**

    Ce garde cherchait encore un ÉVÉNEMENT dont le titre égale la traduction de
    `ai_summary` — la forme d'avant le 2026-08-17, quand le résumé vivait dans
    `journal.events`. Depuis qu'il vit sur `journal.resumeIA`, la condition est
    toujours fausse : **le bouton « envoyer au carnet » ne pouvait plus jamais
    apparaître**, alors que `syncToNotebook` derrière lui fonctionnait.

    Même fragilité que celle déjà corrigée dans `syncToNotebook` : une relation
    structurelle ne s'établit pas sur une chaîne d'affichage.
  */
  const hasAISummary = !!activeJournal?.resumeIA?.trim();

  /**
   * Le fil affiché, et ce que la bascule en retire. **Le plus récent en haut**
   * — choisi par David le 2026-10-03, comme la maquette : pendant la partie,
   * c'est la dernière ligne qu'on cherche. Le magasin garde l'ordre d'arrivée ;
   * seul l'affichage le retourne.
   */
  const fil = (chroniqueSeule ? events.filter(e => natureDe(e) === 'chronique') : events)
    .slice().sort((a, b) => b.timestamp - a.timestamp);
  const tracesMasquees = events.length - fil.length;
  /** Les types présents dans ce journal, pour la légende — et combien de chacun. */
  const typesPresents = useMemo(() => {
    const compte = new Map<JournalEventType, number>();
    events.forEach(e => compte.set(e.type, (compte.get(e.type) ?? 0) + 1));
    return (Object.keys(TYPES) as JournalEventType[]).filter(ty => compte.has(ty)).map(ty => [ty, compte.get(ty)!] as const);
  }, [events]);

  const handleAISummary = async () => {
    if (!activeJournalId || events.length === 0) return;

    setIsSummarizing(true);
    try {
      await generateAISummary(activeJournalId);
      gmToast(t('modules:journal.messages.summary_generated'), "success");
    } catch (err) {
      console.error(err);
      // Le message du store plutôt qu'un texte générique : « il n'y a rien à
      // résumer » et « le modèle n'a pas répondu » ne se corrigent pas pareil.
      gmToast(
        err instanceof Error && err.message
          ? err.message
          : t('modules:journal.messages.summary_error'),
        "error",
      );
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSyncToNotebook = async () => {
    if (!activeJournalId) return;

    setIsSyncing(true);
    try {
      await syncToNotebook(activeJournalId);
      gmToast(t('modules:journal.messages.sync_success'), "success");
    } catch (err: unknown) {
      gmToast(messageDException(err, () => t('modules:journal.messages.sync_error')), "error");
    } finally {
      setIsSyncing(false);
    }
  };

  /*
    **Exporter rend le compte rendu, plus le magasin.**

    Ceci téléchargeait `JSON.stringify(activeJournal)` : la forme interne du
    store — identifiants, horodatages en millisecondes, natures, métadonnées —
    dans un fichier que **rien ne sait relire**, puisqu'il n'existe aucun import
    de journal. Le seul lecteur possible était donc un humain, à qui l'on
    tendait la structure de données plutôt que le texte.

    `rendreLeCompteRendu` existait, testé, et le bouton « Copier » l'utilisait
    déjà : les deux gestes qui sortent une séance de l'application n'en
    sortaient pas la même chose. *Un artefact qu'on croit perdu est souvent un
    artefact dont un seul lecteur connaît le chemin.*

    L'URL est révoquée après le clic : sans cela, le contenu de chaque séance
    exportée reste en mémoire jusqu'à la fermeture de la fenêtre.
  */
  const handleExport = () => {
    if (!activeJournal) return;
    const { nom, contenu, type } = leFichierDuCompteRendu(activeJournal);
    const url = URL.createObjectURL(new Blob([contenu], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nom;
    a.click();
    URL.revokeObjectURL(url);
  };

  const nouveauJournal = () => {
    const defaultName = t('modules:journal.messages.default_session_name', {
      date: format(new Date(), 'dd/MM/yyyy HH:mm')
    });
    useJournalStore.getState().addJournal(defaultName);
    gmToast(t('modules:journal.messages.new_journal_created', { name: defaultName }), 'success');
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4 text-app-text">
      <EnTeteDeModule
        titre={t('modules:journal.fil.title')}
        surtitre={[campagneDuJournal?.name, activeJournal?.title].filter(Boolean).join(' · ') || undefined}
        etat={<>
          {isRecording && <Etiquette ton="danger"><Radio size={11} className="animate-pulse" /> {t('modules:journal.fil.recording')}</Etiquette>}
          {activeJournal && <Etiquette ton="neutre">{t('modules:journal.fil.events_count', { count: events.length })}</Etiquette>}
        </>}
        actions={<>
          <Bouton
            aLaTable={regime.aLaTable}
            variante="accent"
            icone={isSummarizing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            onClick={handleAISummary}
            disabled={isSummarizing || !activeJournalId || events.length === 0}
          >
            {isSummarizing ? t('modules:journal.dashboard.analyzing') : t('modules:journal.dashboard.summarize_ia')}
          </Bouton>
          {hasAISummary && (
            <Bouton
              aLaTable={regime.aLaTable}
              icone={isSyncing ? <Loader2 size={15} className="animate-spin" /> : <Book size={15} />}
              onClick={handleSyncToNotebook}
              disabled={isSyncing}
            >
              {t('modules:journal.dashboard.sync_notebook')}
            </Bouton>
          )}
          <Bouton aLaTable={regime.aLaTable} icone={<Download size={15} />} onClick={handleExport} disabled={!activeJournal} title={t('modules:journal.dashboard.export_journal')}>
            {t('modules:journal.fil.export')}
          </Bouton>
        </>}
      />

      <div className="flex min-h-0 flex-1 gap-4">
        {/* ── À gauche : la campagne et ses journaux ── */}
        <aside className="flex w-72 shrink-0 flex-col gap-3">
          <Panneau className="flex shrink-0 flex-col gap-3 p-4">
            {campagneDuJournal && (
              <div>
                <p className="text-ui-10 font-black uppercase tracking-widest text-app-muted">{t('modules:journal.fil.campaign')}</p>
                <p className="truncate font-display text-lg font-bold text-app-text">{campagneDuJournal.name}</p>
              </div>
            )}
            <Bouton aLaTable={regime.aLaTable} icone={<Plus size={15} />} onClick={nouveauJournal}>
              {t('modules:journal.dashboard.new_journal')}
            </Bouton>
            <Bouton
              aLaTable={regime.aLaTable}
              variante={isRecording ? 'danger' : 'neutre'}
              icone={isRecording ? <StopCircle size={15} /> : <Mic size={15} />}
              onClick={() => toggleRecording()}
              aria-pressed={isRecording}
            >
              {isRecording ? t('modules:journal.dashboard.session_in_progress') : t('modules:journal.dashboard.new_session')}
            </Bouton>
          </Panneau>

          <p className="flex items-center justify-between px-1 text-ui-10 font-black uppercase tracking-widest text-app-muted">
            {t('modules:journal.fil.journals')}
            <span>{journals.length}</span>
          </p>
          <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
            {journals.map((j) => {
              const actif = activeJournalId === j.id;
              const enCours = !j.endTimestamp;
              return (
                <div
                  key={j.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={actif}
                  onClick={() => setActiveJournal(j.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setActiveJournal(j.id); }}
                  className={`group relative cursor-pointer rounded-lg border p-3 transition-colors ${
                    actif ? 'border-accent bg-accent/10' : 'border-app-border bg-app-surface/60 hover:border-accent/50'
                  }`}
                >
                  {actif && <span className="absolute inset-y-0 left-0 w-1 rounded-l-lg bg-accent" />}
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-bold leading-tight ${actif ? 'text-accent' : 'text-app-text'}`}>{j.title}</span>
                    <HorsDePortee regime={regime} libelle={t('modules:journal.dashboard.delete_session')} compact surInvitation icone={<Trash2 className="size-3" />}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          /*
                            **La confirmation manquait entièrement.** Un survol
                            involontaire suivi d'un clic effaçait un journal de
                            séance et tous ses événements, sans un mot.
                          */
                          gmConfirm(
                            t('modules:journal.dashboard.delete_session_confirm', { title: j.title }),
                            () => deleteJournal(j.id),
                          );
                        }}
                        className="rounded p-1 text-app-muted opacity-0 transition-all hover:bg-etat-danger/15 hover:text-etat-danger group-hover:opacity-100"
                        title={t('modules:journal.dashboard.delete_session')}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </HorsDePortee>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 whitespace-nowrap text-xs text-app-muted">
                    <Etiquette ton={enCours ? 'accent' : 'neutre'}>
                      {enCours ? t('modules:journal.fil.open') : t('modules:journal.fil.closed')}
                    </Etiquette>
                    <span className="flex items-center gap-1 font-mono"><Clock className="size-3" /> {j.duration || '--:--'}</span>
                    <span>{t('modules:journal.fil.events_count', { count: j.events.length })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Le journal choisi, en deux zones ── */}
        <section aria-label={t('modules:journal.fil.title')} className="-mr-2 min-w-0 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {!activeJournalId ? (
            <Panneau vide className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <History size={40} className="text-app-subtle" />
              <p className="font-display text-lg text-app-text">{t('modules:journal.dashboard.empty_history')}</p>
              <p className="text-sm text-app-muted">{t('modules:journal.dashboard.empty_desc')}</p>
            </Panneau>
          ) : (
            <div className="flex flex-col gap-4">
              {/* 1. Pendant la partie — le fil */}
              <Panneau className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className={titreDeZone}><span className="text-accent">1.</span> {t('modules:journal.fil.zone_live')}</h2>
                    <p className="mt-0.5 text-xs text-app-muted">{t('modules:journal.fil.zone_live_desc')}</p>
                  </div>
                  <div role="radiogroup" aria-label={t('modules:journal.fil.filter')} className="flex overflow-hidden rounded-lg border border-app-border">
                    {[false, true].map(seule => (
                      <button
                        key={String(seule)}
                        role="radio"
                        aria-checked={chroniqueSeule === seule}
                        onClick={() => setChroniqueSeule(seule)}
                        className={`px-3 py-2 text-ui-10 font-black uppercase tracking-widest transition-colors ${
                          chroniqueSeule === seule ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:text-app-text'
                        }`}
                      >
                        {seule ? t('modules:journal.fil.chronicle_only') : t('modules:journal.fil.all')}
                      </button>
                    ))}
                  </div>
                </div>

                {typesPresents.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 border-y border-app-border py-2">
                    {typesPresents.map(([type, n]) => (
                      <PastilleDeType key={type} type={type} suffixe={` ${n}`} />
                    ))}
                  </div>
                )}

                {events.length === 0 ? (
                  <p className="py-10 text-center text-sm italic text-app-muted">{t('modules:journal.dashboard.ready_for_adventure')}</p>
                ) : (
                  <ol className="flex flex-col gap-1.5">
                    {fil.map(event => (
                      <LigneDuFil
                        key={event.id}
                        evenement={event}
                        supprimer={
                          <HorsDePortee regime={regime} libelle={t('modules:journal.dashboard.delete_event')} compact surInvitation icone={<Trash2 className="size-3.5" />}>
                            <button
                              onClick={() => gmConfirm(
                                t('modules:journal.dashboard.delete_event_confirm'),
                                () => removeEvent(activeJournalId, event.id),
                              )}
                              className="rounded p-1 text-app-muted opacity-0 transition-all hover:bg-etat-danger/15 hover:text-etat-danger group-hover:opacity-100"
                              title={t('modules:journal.dashboard.delete_event')}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </HorsDePortee>
                        }
                      />
                    ))}
                  </ol>
                )}
                {tracesMasquees > 0 && (
                  <p className="text-center text-ui-10 text-app-subtle">{t('modules:journal.fil.traces_hidden', { count: tracesMasquees })}</p>
                )}
              </Panneau>

              {/* 2. Après la partie — compte rendu et revue */}
              {events.length > 0 && activeJournal && (
                <Panneau className="flex flex-col gap-6 p-4">
                  <div>
                    <h2 className={titreDeZone}><span className="text-accent">2.</span> {t('modules:journal.fil.zone_after')}</h2>
                    <p className="mt-0.5 text-xs text-app-muted">{t('modules:journal.fil.zone_after_desc')}</p>
                  </div>
                  {/*
                    **Le compte rendu a sa place a lui depuis le 2026-08-17.**

                    Le résumé était enregistré comme un ÉVÉNEMENT du journal, donc il
                    s'affichait dans le fil — et `summarizeSession` le relisait à la
                    passe suivante, se résumant lui-même.
                  */}
                  <CompteRenduDeSeance journal={activeJournal} />
                  {/*
                    **La revue vient APRÈS le compte rendu dans l'écran, et avant lui
                    dans l'ordre des étapes.** On la lit en descendant : on cure ce
                    qu'on vient de trouver insuffisant. *Un résumé raté se relance ;
                    une curation ratée fausse tout ce qui en découle.*
                  */}
                  <RevueDeSeance journal={activeJournal} />
                </Panneau>
              )}

              {/* La note de fin de séance */}
              <Panneau className="flex flex-col gap-3 p-4">
                <div>
                  <h2 className={titreDeZone}><ScrollText size={16} className="text-accent" /> {t('modules:journal.dashboard.final_note_title')}</h2>
                  <p className="mt-0.5 text-xs text-app-muted">{t('modules:journal.dashboard.final_note_desc')}</p>
                </div>
                <textarea
                  value={activeJournal?.finalNote || ''}
                  onChange={(e) => {
                    if (activeJournalId) {
                      updateJournalNote(activeJournalId, e.target.value);
                    }
                  }}
                  placeholder={t('modules:journal.dashboard.final_note_placeholder')}
                  className="h-40 w-full resize-y rounded-lg border border-app-border bg-app-bg p-4 text-sm leading-relaxed text-app-text placeholder:text-app-subtle focus:border-accent/60 focus:outline-none custom-scrollbar"
                />
                {/* Elle s'écrit à chaque frappe : un bouton « Enregistrer » mentirait. */}
                <p className="text-right text-ui-10 text-app-subtle">{t('modules:journal.fil.note_autosave')}</p>
              </Panneau>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/** Le type d'un événement, en pastille de sa couleur. */
const PastilleDeType: React.FC<{ type: JournalEventType; suffixe?: string }> = ({ type, suffixe }) => {
  const { t } = useTranslation();
  const { icone: Icone, teinte } = TYPES[type] ?? TYPES.SYSTEM;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-ui-9 font-black uppercase tracking-wider ${teinte}`}>
      <Icone size={11} />{t(`modules:journal.fil.types.${type}`)}{suffixe}
    </span>
  );
};

/**
 * **Une ligne du fil.** La chronique se lit — un titre, son texte, sur une
 * carte ; la trace se survole — une ligne plus discrète, sur le fond. *On ne
 * supprime pas, on distingue* : c'est la règle de la revue, déjà.
 */
const LigneDuFil: React.FC<{ evenement: JournalEvent; supprimer: React.ReactNode }> = ({ evenement, supprimer }) => {
  const { t } = useTranslation();
  const chronique = natureDe(evenement) === 'chronique';
  return (
    <li className={`group grid grid-cols-[4.5rem_auto_1fr_auto] items-start gap-3 rounded-lg px-3 py-2 ${
      chronique ? 'border border-app-border bg-app-surface-2/60' : ''
    }`}>
      <span className={`pt-0.5 font-mono text-xs ${chronique ? 'font-bold text-accent' : 'text-app-subtle'}`}>
        {format(evenement.timestamp, 'HH:mm:ss')}
      </span>
      <PastilleDeType type={evenement.type} />
      {chronique ? (
        <div className="min-w-0">
          <p className="text-sm font-bold text-app-text">{evenement.title}</p>
          {evenement.content && <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-app-muted">{evenement.content}</p>}
        </div>
      ) : (
        <p className="min-w-0 truncate pt-0.5 text-xs text-app-subtle" title={evenement.content}>
          {evenement.title}{evenement.content ? ` — ${evenement.content}` : ''}
        </p>
      )}
      <span className="flex items-center gap-1">
        {supprimer}
        <Etiquette ton={chronique ? 'accent' : 'neutre'}>{chronique ? t('modules:journal.fil.chronicle') : t('modules:journal.fil.trace')}</Etiquette>
      </span>
    </li>
  );
};

export default JournalDashboard;
