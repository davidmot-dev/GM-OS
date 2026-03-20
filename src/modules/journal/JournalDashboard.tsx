import React from 'react';
import { useJournalStore } from './useJournalStore';
import { format } from 'date-fns';
import { 
  Book, 
  Music, 
  Swords, 
  MapPin, 
  StickyNote, 
  Settings, 
  Search,
  Trash2,
  Download,
  Notebook as NotebookIcon,
  Clock,
  ChevronRight,
  History
} from 'lucide-react';
import type { JournalEvent, JournalEventType } from './types';

const eventIcons: Record<JournalEventType, React.ReactElement> = {
  AUDIO: <Music className="size-4 text-blue-400" />,
  COMBAT: <Swords className="size-4 text-red-400" />,
  NPC: <Book className="size-4 text-purple-400" />,
  LOCATION: <MapPin className="size-4 text-green-400" />,
  NOTE: <StickyNote className="size-4 text-yellow-400" />,
  SYSTEM: <Settings className="size-4 text-gray-400" />,
  ORACLE: <Search className="size-4 text-cyan-400" />,
};

const JournalDashboard: React.FC = () => {
  const { 
    journals, 
    activeJournalId, 
    setActiveJournal, 
    removeEvent, 
    deleteJournal,
    isRecording,
    toggleRecording 
  } = useJournalStore();

  const activeJournal = journals.find(j => j.id === activeJournalId);
  const events = activeJournal?.events || [];

  const handleExport = () => {
    if (!activeJournal) return;

    const text = [
      `Journal: ${activeJournal.title}`,
      `Début: ${format(activeJournal.startTimestamp, 'dd/MM/yyyy HH:mm:ss')}`,
      activeJournal.endTimestamp ? `Fin: ${format(activeJournal.endTimestamp, 'dd/MM/yyyy HH:mm:ss')}` : 'En cours...',
      activeJournal.duration ? `Durée: ${activeJournal.duration}` : '',
      '\n--- ÉVÉNEMENTS ---\n',
      ...events.map(e => `[${format(e.timestamp, 'HH:mm:ss')}] ${e.title}\n${e.content}`)
    ].join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${activeJournal.title.replace(/\s+/g, '_')}.txt`;
    a.click();
  };

  return (
    <div className="flex h-full bg-app-bg -my-6 -mr-6 ml-6 rounded-l-3xl border-y border-l border-app-border/50 shadow-2xl overflow-hidden">
      {/* Sidebar: Journal List */}
      <aside className="w-72 border-r border-app-border/30 bg-app-surface/10 flex flex-col">
        <header className="p-6 border-b border-app-border/30 flex items-center gap-3">
          <History className="size-5 text-accent" />
          <h2 className="font-bold text-app-text-bright">Historique</h2>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {journals.length === 0 ? (
            <p className="text-xs text-app-text-muted text-center py-8">Aucun journal enregistré</p>
          ) : (
            journals.map(j => (
              <div
                key={j.id}
                onClick={() => setActiveJournal(j.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all group cursor-pointer ${
                  j.id === activeJournalId 
                    ? 'bg-accent/10 border-accent/40 text-app-text-bright' 
                    : 'bg-app-surface/30 border-transparent hover:bg-app-surface/50 text-app-text-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold truncate pr-2">{j.title}</span>
                  {j.id === activeJournalId && isRecording && (
                    <span className="size-2 bg-red-500 rounded-full animate-pulse shadow-glow-red" />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] opacity-60">
                  <div className="flex items-center gap-1">
                    <Clock className="size-2.5" />
                    <span>{j.duration || 'En cours...'}</span>
                  </div>
                  <span 
                    onClick={(e) => { e.stopPropagation(); deleteJournal(j.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1 cursor-pointer"
                    title="Supprimer le journal"
                  >
                    <Trash2 className="size-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Content: Event Feed */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b border-app-border/30 bg-app-surface/20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-accent/10 rounded-xl text-accent">
              <NotebookIcon className="size-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-app-text-bright">
                {activeJournal?.title || 'Journal-OS'}
              </h1>
              <div className="flex items-center gap-3 text-[10px] text-app-text-muted uppercase tracking-wider font-mono">
                {activeJournal?.duration && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Clock className="size-3" /> {activeJournal.duration}
                  </span>
                )}
                <span>{events.length} Événements</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeJournalId && (
              <button 
                onClick={() => toggleRecording()}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isRecording 
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                    : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                }`}
              >
                {isRecording ? '● Enregistrement' : '○ En pause'}
              </button>
            )}
            
            <button 
              onClick={handleExport}
              disabled={!activeJournal}
              className="p-2 hover:bg-app-surface/40 rounded-lg transition-colors text-app-text-muted hover:text-app-text-bright disabled:opacity-30"
              title="Exporter le journal"
            >
              <Download className="size-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-app-bg/50">
          {!activeJournalId ? (
            <div className="h-full flex flex-col items-center justify-center text-app-text-muted opacity-50 space-y-4">
              <History className="size-16 animate-pulse" />
              <div className="text-center">
                <p className="text-lg font-bold">Sélectionnez un journal</p>
                <p className="text-sm">Vos sessions passées apparaissent dans la barre latérale.</p>
              </div>
            </div>
          ) : events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-app-text-muted opacity-50 space-y-2">
              <Book className="size-12" />
              <p>Aucun événement dans ce journal.</p>
            </div>
          ) : (
            events.map((event: JournalEvent) => (
              <div 
                key={event.id}
                className="group relative bg-app-surface/30 border border-app-border/20 rounded-xl p-4 hover:border-accent/40 transition-all hover:bg-app-surface/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-app-surface/50 rounded-lg shadow-inner">
                      {eventIcons[event.type]}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-app-text-muted font-bold font-mono">
                      {format(event.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => removeEvent(activeJournalId, event.id)}
                    title="Supprimer l'événement"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded text-app-text-muted hover:text-red-400 transition-all"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
                
                <h3 className="text-sm font-bold text-app-text-bright mb-1 flex items-center gap-2">
                  <ChevronRight className="size-3 text-accent" />
                  {event.title}
                </h3>
                <p className="text-xs text-app-text-muted leading-relaxed whitespace-pre-wrap pl-5 border-l border-app-border/20 ml-1.5 mt-2 italic shadow-sm">
                  {event.content}
                </p>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
};

export default JournalDashboard;
