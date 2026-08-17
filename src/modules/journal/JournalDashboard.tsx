import React, { useState } from 'react';
import { useJournalStore } from './useJournalStore';
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
  MapPin,
  FileText,
  Settings,
  HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { gmToast } from '../../stores/useToastStore';
import { useTranslation } from 'react-i18next';

const eventIcons: Record<string, React.ReactNode> = {
  AUDIO: <Music className="size-4 text-blue-400" />,
  COMBAT: <Swords className="size-4 text-red-400" />,
  NPC: <User className="size-4 text-emerald-400" />,
  LOCATION: <MapPin className="size-4 text-amber-400" />,
  NOTE: <FileText className="size-4 text-slate-400" />,
  SYSTEM: <Settings className="size-4 text-indigo-400" />,
  ORACLE: <HelpCircle className="size-4 text-purple-400" />
};

const JournalDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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
    updateJournalNote
  } = useJournalStore();

  const activeJournal = journals.find(j => j.id === activeJournalId);
  const events = activeJournal?.events || [];
  const hasAISummary = events.some(e => e.title === t('modules:journal.events.ai_summary'));

  const handleAISummary = async () => {
    if (!activeJournalId || events.length === 0) return;
    
    setIsSummarizing(true);
    try {
      await generateAISummary(activeJournalId);
      gmToast(t('modules:journal.messages.summary_generated'), "success");
    } catch (err) {
      console.error(err);
      gmToast(t('modules:journal.messages.summary_error'), "error");
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
    } catch (err: any) {
      gmToast(err.message || t('modules:journal.messages.sync_error'), "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    if (!activeJournal) return;
    const content = JSON.stringify(activeJournal, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${activeJournal.title.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  return (
    <div className="flex h-full bg-app-bg text-slate-200 overflow-hidden">
      {/* Sidebar - Journal List */}
      <aside className="w-80 border-r border-app-border flex flex-col bg-app-surface/20">
        <header className="p-6 border-b border-app-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Book className="size-6 text-accent" />
              {t('modules:journal.dashboard.title')}
            </h2>
            <button 
              onClick={() => {
                const defaultName = t('modules:journal.messages.default_session_name', {
                  date: format(new Date(), 'dd/MM/yyyy HH:mm')
                });
                useJournalStore.getState().addJournal(defaultName);
                gmToast(t('modules:journal.messages.new_journal_created', { name: defaultName }), 'success');
              }}
              className="p-2 bg-accent/10 hover:bg-accent/20 rounded-lg text-accent transition-all active:scale-95"
              title={t('modules:journal.dashboard.new_journal')}
            >
              <Plus className="size-5" />
            </button>
          </div>
          
          <button 
            onClick={() => toggleRecording()}
            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all border shadow-lg ${
              isRecording 
                ? 'bg-red-500/20 border-red-500/50 text-red-500 animate-pulse' 
                : 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20'
            }`}
          >
            {isRecording ? <StopCircle className="size-4" /> : <Mic className="size-4" />}
            {isRecording ? t('modules:journal.dashboard.session_in_progress') : t('modules:journal.dashboard.new_session')}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {journals.map((j) => (
            <div
              key={j.id}
              onClick={() => setActiveJournal(j.id)}
              className={`w-full group text-left p-4 rounded-xl border transition-all relative overflow-hidden cursor-pointer ${
                activeJournalId === j.id 
                  ? 'bg-accent/10 border-accent/40 shadow-glow-accent/10' 
                  : 'bg-app-surface/40 border-app-border/40 hover:border-accent/20'
              }`}
            >
              {activeJournalId === j.id && (
                <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
              )}
              <div className="flex justify-between items-start">
                <span className={`text-xs font-bold leading-tight ${activeJournalId === j.id ? 'text-accent' : 'text-slate-300'}`}>
                  {j.title}
                </span>
                <button 
                   onClick={(e) => { e.stopPropagation(); deleteJournal(j.id); }}
                   className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-all"
                   title={t('modules:journal.dashboard.delete_session')}
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3 text-[9px] text-slate-500 font-mono uppercase tracking-tighter">
                <span className="flex items-center gap-1"><Clock className="size-2.5" /> {j.duration || '--:--'}</span>
                <span className="flex items-center gap-1"><Book className="size-2.5" /> {j.events.length}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content - Selected Journal */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-20 border-b border-app-border flex items-center justify-between px-8 bg-app-surface/10 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-black tracking-tight text-white italic truncate max-w-md">
              {activeJournal?.title || t('modules:journal.dashboard.select_session')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleAISummary}
              disabled={isSummarizing || !activeJournalId || events.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-lg ${
                isSummarizing 
                  ? 'bg-accent/20 text-accent/50 cursor-wait animate-pulse' 
                  : 'bg-accent text-slate-950 hover:scale-105 active:scale-95 shadow-glow-accent/30'
              } disabled:opacity-20 disabled:grayscale`}
            >
              {isSummarizing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {isSummarizing ? t('modules:journal.dashboard.analyzing') : t('modules:journal.dashboard.summarize_ia')}
            </button>

            {hasAISummary && (
              <button 
                onClick={handleSyncToNotebook}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all border shadow-lg ${
                  isSyncing 
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-400/50 animate-pulse' 
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 shadow-glow-blue/20'
                }`}
              >
                {isSyncing ? <Loader2 className="size-4 animate-spin" /> : <Book className="size-4" />}
                {t('modules:journal.dashboard.sync_notebook')}
              </button>
            )}

            <button 
              onClick={handleExport}
              disabled={!activeJournal}
              className="p-2.5 bg-app-surface border border-app-border hover:bg-app-bg rounded-xl text-slate-400 hover:text-white transition-all shadow-lg disabled:opacity-20"
              title={t('modules:journal.dashboard.export_journal')}
            >
              <Download className="size-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-app-bg/50">
          {!activeJournalId ? (
            <div className="h-full flex flex-col items-center justify-center text-app-text-muted opacity-50 space-y-6">
              <History className="size-24 animate-pulse" />
              <div className="text-center">
                <p className="text-2xl font-black uppercase tracking-widest italic mb-2">{t('modules:journal.dashboard.empty_history')}</p>
                <p className="text-sm font-medium tracking-tight">{t('modules:journal.dashboard.empty_desc')}</p>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-app-text-muted opacity-50 space-y-3">
              <Book className="size-16" />
              <p className="text-lg font-bold italic tracking-tighter">{t('modules:journal.dashboard.ready_for_adventure')}</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {events.map((event) => (
                  <div 
                    key={event.id}
                    className="group relative bg-app-surface/30 border border-app-border/20 rounded-2xl p-6 hover:border-accent/40 transition-all hover:bg-app-surface/40 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-app-surface/50 rounded-xl shadow-inner border border-app-border/30">
                            {eventIcons[event.type]}
                          </div>
                          <div className="flex flex-col">
                            <h3 className="text-sm font-bold text-app-text-bright leading-none mb-1">
                              {event.title}
                            </h3>
                            <span className="text-[10px] uppercase tracking-widest text-app-text-muted font-black font-mono opacity-50">
                              {format(event.timestamp, 'HH:mm:ss')}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-app-text-muted leading-relaxed whitespace-pre-wrap pl-1 border-l-2 border-app-border/10 ml-5 mt-1">
                          {event.content}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => removeEvent(activeJournalId, event.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 rounded-xl text-slate-600 hover:text-red-400 transition-all"
                        title={t('modules:journal.dashboard.delete_event')}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/*
                **Le résumé a sa place à lui depuis le 2026-08-17.**

                Il était enregistré comme un ÉVÉNEMENT du journal, donc il
                s'affichait dans le fil — et `summarizeSession` le relisait à la
                passe suivante, se résumant lui-même. En le sortant du flux, il
                fallait lui rendre un écran : un artefact qu'on produit et qu'on
                ne voit pas est un artefact qu'on croit perdu.

                Sa date est affichée parce qu'elle se périme : un résumé plus
                vieux que les derniers événements ne les raconte pas.
              */}
              {activeJournal?.resumeIA && (
                <div className="mt-16 pt-12 border-t border-app-border/30">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-inner">
                      <Sparkles className="size-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase tracking-[0.2em] text-accent">
                        {t('modules:journal.events.ai_summary')}
                      </h3>
                      {activeJournal.resumeGenereLe && (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-80">
                          {format(activeJournal.resumeGenereLe, 'dd/MM/yyyy à HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="bg-app-surface/20 border border-app-border/40 rounded-2xl p-6 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap shadow-inner">
                    {activeJournal.resumeIA}
                  </div>
                </div>
              )}

              {/* Final Note Section */}
              <div className="mt-16 pt-12 border-t border-app-border/30">
                <div className="flex items-center gap-4 mb-6">
                  <div className="size-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-inner">
                    <FileText className="size-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-[0.2em] text-accent">{t('modules:journal.dashboard.final_note_title')}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-80">{t('modules:journal.dashboard.final_note_desc')}</p>
                  </div>
                </div>
                <textarea
                  value={activeJournal?.finalNote || ''}
                  onChange={(e) => {
                    if (activeJournalId) {
                      updateJournalNote(activeJournalId, e.target.value);
                    }
                  }}
                  placeholder={t('modules:journal.dashboard.final_note_placeholder')}
                  className="w-full h-48 bg-app-surface/20 border border-app-border/40 rounded-2xl p-6 text-sm text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-accent/40 focus:bg-accent/5 transition-all resize-none custom-scrollbar shadow-inner leading-relaxed"
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default JournalDashboard;
