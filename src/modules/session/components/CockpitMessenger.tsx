import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    MessageSquare, 
    ChevronDown, 
    User, 
    Shield, 
    Save, 
    Clock,
    Filter,
    Send
} from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import type { Player, PlayerCharacter, SessionMessage } from '../store/types';
import { format } from 'date-fns';

export const CockpitMessenger: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { messages, players, sendDirectMessage, saveMessageToJournal, activeCampaignId } = useSessionOSStore();
    const [selectedFilter, setSelectedFilter] = useState<'all' | string>('all');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [messageInput, setMessageInput] = useState('');

    // Get characters from online players AND characters who have sent messages
    const activeCharacters = useMemo(() => {
        // 1. Get characters from online players (filtered by active campaign)
        const onlineChars = players
            .filter((p: Player) => p.isOnline)
            .flatMap((p: Player) => 
                (p.characters || [])
                    .filter((c: PlayerCharacter) => c.campaignId === activeCampaignId)
                    .map((c: PlayerCharacter) => ({ id: c.id, name: c.name }))
            );

        // 2. Get characters from message history (in case they went offline)
        const historyChars = messages
            .filter((m: SessionMessage) => m.fromId !== 'GM')
            .map((m: SessionMessage) => ({ id: m.fromId, name: m.fromName }));

        // 3. Merge, deduplicate and sort
        const combined = [...onlineChars, ...historyChars];
        const uniqueMap = new Map<string, string>();
        combined.forEach((char: { id: string, name: string }) => uniqueMap.set(char.id, char.name));

        return Array.from(uniqueMap.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [messages, players, activeCampaignId]);

    const filteredMessages = selectedFilter === 'all' 
        ? messages 
        : messages.filter(m => m.fromId === selectedFilter || m.toId === selectedFilter);

    const getCharacterName = (id: string, name: string) => {
        if (id === 'GM') return t('session.messenger.gm_label');
        return name;
    };

    const handleSend = () => {
        if (!messageInput.trim()) return;
        
        const recipientName = selectedFilter === 'all' 
            ? t('session.messenger.all_players')
            : (activeCharacters.find(c => c.id === selectedFilter)?.name || t('session.messenger.player_label'));
            
        sendDirectMessage(selectedFilter, recipientName, messageInput.trim());
        setMessageInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col gap-2 bg-app-surface/20 rounded-xl border border-app-border/30 overflow-hidden backdrop-blur-md shadow-inner">
            {/* Header / Filter Selector */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-app-border/20 bg-app-surface/40">
                <div className="flex items-center gap-2 text-app-text/60">
                    <MessageSquare size={14} className="text-accent" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('modules:session.messenger.title')}</span>
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-app-bg/40 border border-app-border/30 hover:border-accent/40 transition-colors"
                    >
                        <Filter size={10} className="text-accent/60" />
                        <span className="text-[9px] font-bold uppercase truncate max-w-[60px]">
                            {selectedFilter === 'all' ? t('modules:session.messenger.filter_all') : (activeCharacters.find(c => c.id === selectedFilter)?.name || t('modules:session.messenger.player_label'))}
                        </span>
                        <ChevronDown size={10} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isFilterOpen && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-app-surface border border-app-border shadow-2xl rounded-lg z-50 overflow-hidden py-1">
                            <button 
                                onClick={() => { setSelectedFilter('all'); setIsFilterOpen(false); }}
                                className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-accent/10 transition-colors ${selectedFilter === 'all' ? 'text-accent font-bold' : 'text-app-text/70'}`}
                            >
                                {t('modules:session.messenger.filter_all')}
                            </button>
                            {activeCharacters.map(char => (
                                <button 
                                    key={char.id}
                                    onClick={() => { setSelectedFilter(char.id); setIsFilterOpen(false); }}
                                    className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-accent/10 transition-colors ${selectedFilter === char.id ? 'text-accent font-bold' : 'text-app-text/70'}`}
                                >
                                    {char.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Message Feed */}
            <div className="h-48 overflow-y-auto px-2 py-2 flex flex-col gap-3 custom-scrollbar">
                {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-4">
                        <MessageSquare size={24} />
                        <span className="text-[10px] mt-1 italic uppercase tracking-widest">{t('modules:session.messenger.no_message')}</span>
                    </div>
                ) : (
                    filteredMessages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex flex-col gap-1 group relative ${msg.fromId === 'GM' ? 'items-end' : 'items-start'}`}
                        >
                            <div className="flex items-center gap-1.5 opacity-50 px-1">
                                {msg.fromId === 'GM' ? <Shield size={8} className="text-accent" /> : <User size={8} />}
                                <span className="text-[8px] font-bold uppercase truncate max-w-[100px]">
                                    {getCharacterName(msg.fromId, msg.fromName)}
                                </span>
                                <span className="text-[8px] font-mono">{format(msg.timestamp, 'HH:mm')}</span>
                            </div>
                            
                            <div className={`px-2.5 py-1.5 rounded-lg text-xs max-w-[90%] break-words border ${
                                msg.fromId === 'GM' 
                                    ? 'bg-accent/10 border-accent/20 text-accent/90' 
                                    : 'bg-app-surface/60 border-app-border/40 text-app-text/90 shadow-sm'
                            }`}>
                                {msg.content}
                            </div>

                            {/* Action overlay (GM Only for player messages) */}
                            {msg.fromId !== 'GM' && (
                                <button 
                                    onClick={() => saveMessageToJournal(msg.id)}
                                    title={t('modules:session.messenger.tooltip_save_journal')}
                                    className="absolute -right-1 -top-1 p-1 rounded-full bg-gm-gold text-black scale-0 group-hover:scale-100 transition-all shadow-lg hover:bg-white active:scale-90"
                                >
                                    <Save size={10} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
            
            {/* GM Input Area */}
            <div className="flex items-center gap-1.5 p-2 bg-app-bg/60 border-t border-app-border/30">
                <input 
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedFilter === 'all' ? t('modules:session.messenger.write_to_all') : t('modules:session.messenger.write_to_recipient', { recipient: (activeCharacters.find(c => c.id === selectedFilter)?.name || '...') })}
                    className="flex-1 bg-app-surface/60 border border-app-border/40 rounded-lg py-1.5 px-3 text-[11px] placeholder:text-app-text/30 focus:outline-none focus:border-accent/50 transition-colors"
                />
                <button 
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                    title={t('modules:session.messenger.tooltip_send')}
                    className="p-1.5 rounded-lg bg-accent/20 hover:bg-accent/40 text-accent transition-all disabled:opacity-20 disabled:scale-95 active:scale-90"
                >
                    <Send size={14} />
                </button>
            </div>
            
            <div className="px-2 py-1.5 bg-app-surface/40 border-t border-app-border/10 flex justify-between items-center">
                 <div className="flex items-center gap-1 opacity-30">
                    <Clock size={8} />
                    <span className="text-[8px] font-mono uppercase tracking-tighter text-app-text/40">{t('modules:session.messenger.session_only')}</span>
                 </div>
                 <div className="w-1 h-1 rounded-full bg-accent/40 animate-pulse" />
            </div>
        </div>
    );
};
