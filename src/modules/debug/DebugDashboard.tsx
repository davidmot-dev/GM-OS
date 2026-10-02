import React, { useState, useMemo } from 'react';
import { useDebugStore } from '../../stores/useDebugStore';
import type { LogLevel, LogEntry } from '../../stores/useDebugStore';
import { 
    Terminal, 
    Search, 
    Trash2, 
    ChevronDown, 
    ChevronRight, 
    Copy, 
    AlertCircle, 
    Info, 
    AlertTriangle,
    Bug,
    Download,
    ArrowDownCircle,
    Filter
} from 'lucide-react';
import { gmToast } from '../../stores/useToastStore';
import { saveAs } from 'file-saver';

const LEVEL_ICONS: Record<LogLevel, React.ReactNode> = {
    info: <Info size={14} className="text-etat-info" />,
    warn: <AlertTriangle size={14} className="text-etat-alerte" />,
    error: <AlertCircle size={14} className="text-etat-danger" />,
    debug: <Bug size={14} className="text-app-muted" />,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
    info: 'border-etat-info/20 bg-etat-info/5 text-etat-info',
    warn: 'border-etat-alerte/20 bg-etat-alerte/5 text-etat-alerte',
    error: 'border-etat-danger/20 bg-etat-danger/5 text-etat-danger',
    debug: 'border-app-border/20 bg-app-muted/5 text-app-text',
};

const MODULE_COLORS: Record<string, string> = {
    SOUND: 'text-gm-violet border-gm-violet/30 bg-gm-violet/10',
    LIGHT: 'text-gm-cyan border-gm-cyan/30 bg-gm-cyan/10',
    MIDI: 'text-gm-gold border-gm-gold/30 bg-gm-gold/10',
    MUSIC: 'text-gm-emerald border-gm-emerald/30 bg-gm-emerald/10',
    MAP: 'text-gm-crimson border-gm-crimson/30 bg-gm-crimson/10',
    KEY: 'text-accent border-accent/30 bg-accent/10',
    SYSTEM: 'text-app-muted border-app-border/30 bg-app-muted/10',
};

const DebugDashboard: React.FC = () => {
    const { logs, clearLogs } = useDebugStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
    const [moduleFilter, setModuleFilter] = useState<string | 'all'>('all');
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const availableModules = useMemo(() => {
        const modules = new Set<string>();
        logs.forEach(log => {
            if (log.module) modules.add(log.module);
        });
        return Array.from(modules).sort();
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
            const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
            const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 (log.module?.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesLevel && matchesModule && matchesSearch;
        });
    }, [logs, levelFilter, moduleFilter, searchQuery]);

    React.useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = 0; // Prepending logs: top is newest
        }
    }, [logs, autoScroll]);

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        saveAs(blob, `gm-os-logs-${new Date().toISOString()}.json`);
        gmToast('Logs exportés avec succès !');
    };

    const handleCopyAll = () => {
        const text = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.module || 'SYS'}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(text);
        gmToast('Logs copiés dans le presse-papier !');
    };

    return (
        <div className="h-full flex flex-col bg-app-bg/40 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-app-text/5 bg-app-bg/60 backdrop-blur-xl flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-app-bg/50 border border-app-text/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-app-text focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-ui-10 font-bold ${
                                autoScroll 
                                ? 'bg-accent/20 border-accent/30 text-accent' 
                                : 'bg-app-text/5 border-app-text/10 text-app-subtle'
                            }`}
                            title="Auto-scroll"
                        >
                            <ArrowDownCircle size={14} />
                            {autoScroll ? 'AUTO' : 'MANUAL'}
                        </button>

                        <div className="h-4 w-px bg-app-text/10 mx-1" />

                        <button
                            onClick={handleExport}
                            className="p-2 rounded-xl border border-app-text/10 bg-app-text/5 text-app-muted hover:text-app-text hover:bg-app-text/10 transition-all"
                            title="Exporter JSON"
                        >
                            <Download size={16} />
                        </button>
                        <button
                            onClick={handleCopyAll}
                            className="p-2 rounded-xl border border-app-text/10 bg-app-text/5 text-app-muted hover:text-app-text hover:bg-app-text/10 transition-all"
                            title="Copier tout"
                        >
                            <Copy size={16} />
                        </button>
                        <button
                            onClick={clearLogs}
                            className="p-2 rounded-xl border border-app-text/10 bg-app-text/5 text-app-muted hover:text-etat-danger hover:bg-etat-danger/10 transition-all"
                            title="Effacer"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-app-bg/50 border border-app-text/10 rounded-xl p-1">
                        {(['all', 'info', 'warn', 'error', 'debug'] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => setLevelFilter(level)}
                                className={`px-2.5 py-1 rounded-lg text-ui-9 font-black uppercase tracking-tighter transition-all ${
                                    levelFilter === level 
                                    ? 'bg-accent text-app-on-accent shadow-lg shadow-accent/20' 
                                    : 'text-app-subtle hover:text-app-text hover:bg-app-text/5'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 flex-1 overflow-x-auto custom-scrollbar no-scrollbar">
                        <Filter size={12} className="text-app-subtle flex-shrink-0" />
                        <button
                            onClick={() => setModuleFilter('all')}
                            className={`px-2 py-0.5 rounded-full border text-ui-9 font-bold transition-all whitespace-nowrap ${
                                moduleFilter === 'all'
                                ? 'bg-accent/20 border-accent/30 text-accent'
                                : 'bg-app-text/5 border-app-text/10 text-app-subtle'
                            }`}
                        >
                            ALL MODULES
                        </button>
                        {availableModules.map(mod => (
                            <button
                                key={mod}
                                onClick={() => setModuleFilter(mod)}
                                className={`px-2 py-0.5 rounded-full border text-ui-9 font-bold transition-all whitespace-nowrap ${
                                    moduleFilter === mod
                                    ? 'bg-accent/20 border-accent/30 text-accent'
                                    : 'bg-app-text/5 border-app-text/10 text-app-subtle'
                                }`}
                            >
                                {mod}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logs Area */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto custom-scrollbar p-1 scroll-smooth"
            >
                <div className="min-w-full inline-block align-middle">
                    {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-app-subtle opacity-20">
                            <Terminal size={64} className="mb-4" />
                            <p className="text-xl font-black uppercase tracking-widest italic tracking-[0.2em]">No logs detected</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {filteredLogs.map((log) => (
                                <LogRow 
                                    key={log.id} 
                                    log={log} 
                                    isExpanded={expandedLogId === log.id}
                                    onToggle={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const LogRow: React.FC<{ 
    log: LogEntry; 
    isExpanded: boolean; 
    onToggle: () => void;
}> = ({ log, isExpanded, onToggle }) => {
    const time = new Date(log.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
    });

    const moduleStyle = log.module ? (MODULE_COLORS[log.module] || 'text-app-subtle border-app-text/10 bg-app-text/5') : '';

    return (
        <div className={`group border-l-2 transition-all ${LEVEL_COLORS[log.level]} ${isExpanded ? 'bg-app-text/5 border-app-text/40' : 'border-transparent hover:bg-app-text/5'}`}>
            <div 
                className="flex items-start gap-4 p-3 cursor-pointer select-none"
                onClick={onToggle}
            >
                <div className="flex items-center gap-2 mt-0.5">
                    {isExpanded ? <ChevronDown size={14} className="text-app-subtle" /> : <ChevronRight size={14} className="text-app-subtle" />}
                    <span className="text-ui-10 font-mono text-app-subtle opacity-60 w-24">[{time}]</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {LEVEL_ICONS[log.level]}
                    </div>

                    {log.module && (
                        <div className={`flex-shrink-0 px-2 py-0.5 rounded border text-ui-9 font-black uppercase tracking-widest ${moduleStyle}`}>
                            {log.module}
                        </div>
                    )}
                </div>

                <div className="flex-1 font-mono text-xs leading-5 break-all">
                    {log.message}
                </div>
            </div>

            {isExpanded && !!log.data && (
                <div className="px-12 pb-4">
                    <div className="bg-app-bg/80 rounded-xl border border-app-text/5 p-4 overflow-x-auto custom-scrollbar shadow-inner">
                        <pre className="text-ui-11 font-mono text-gm-cyan">
                            {JSON.stringify(log.data, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebugDashboard;
