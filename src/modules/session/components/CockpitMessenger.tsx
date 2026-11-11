import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MessageSquare,
    User,
    Shield,
    Save,
    Clock,
    Filter,
    Send
} from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { format } from 'date-fns';
import { filDuLecteur } from '../../../../electron/destinatairesDesMessages';
import { MESSAGES_PAR_CAMPAGNE } from '../logic/filDesMessages';
import { destinatairesDuMeneur } from '../logic/destinatairesDuMeneur';

export const CockpitMessenger: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const { messages: tousLesMessages, players, sendDirectMessage, saveMessageToJournal, activeCampaignId } = useSessionOSStore();
    /*
      **Le fil du meneur, de la campagne active** (2026-10-12). Le magasin garde
      aussi ce que deux joueurs se disent, pour le rendre à une tablette
      rechargée ; le meneur ne le voit pas (décision de David : gardés mais
      cachés). Même règle que le serveur et la tablette du meneur.
    */
    const messages = useMemo(
        () => filDuLecteur(tousLesMessages, activeCampaignId, { role: 'meneur' }, MESSAGES_PAR_CAMPAGNE),
        [tousLesMessages, activeCampaignId],
    );
    const [selectedFilter, setSelectedFilter] = useState<'all' | string>('all');
    const [messageInput, setMessageInput] = useState('');

    /*
      **Tous les personnages de la campagne, en ligne ou non, puis ceux du fil**
      (11/11) — la liste ne gardait que les joueurs en ligne et ceux qui avaient
      écrit. Voir `destinatairesDuMeneur`.
    */
    const activeCharacters = useMemo(
        () => destinatairesDuMeneur(players, messages, activeCampaignId),
        [messages, players, activeCampaignId],
    );

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
                    <span className="text-ui-10 font-bold uppercase tracking-wider">{t('modules:session.messenger.title')}</span>
                </div>
                
                {/*
                  ⛔ **Un `<select>` natif, plus un menu maison** (11/11, « je ne vois pas tous
                  les joueurs ») : le menu s'ouvrait DANS ce cadre, qui coupe ce qui dépasse
                  (`overflow-hidden`), et ne défilait pas — tout ce qui passait sous le bord
                  était invisible et inatteignable. Le navigateur dessine la liste d'un
                  `<select>` par-dessus tout, et la fait défiler.
                */}
                <label className="flex items-center gap-1 px-2 py-1 rounded-md bg-app-bg/40 border border-app-border/30 hover:border-accent/40 focus-within:border-accent/60 transition-colors">
                    <Filter size={10} className="text-accent/60 shrink-0" aria-hidden />
                    <span className="sr-only">{t('modules:session.messenger.player_label')}</span>
                    <select
                        value={selectedFilter}
                        onChange={e => setSelectedFilter(e.target.value)}
                        className="bg-transparent text-ui-9 font-bold uppercase max-w-[9rem] truncate outline-none cursor-pointer"
                    >
                        <option value="all">{t('modules:session.messenger.filter_all')}</option>
                        {activeCharacters.map(char => (
                            <option key={char.id} value={char.id}>
                                {char.enLigne ? char.name : `${char.name} · hors ligne`}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {/* Message Feed */}
            <div className="h-48 overflow-y-auto px-2 py-2 flex flex-col gap-3 custom-scrollbar">
                {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 py-4">
                        <MessageSquare size={24} />
                        <span className="text-ui-10 mt-1 italic uppercase tracking-widest">{t('modules:session.messenger.no_message')}</span>
                    </div>
                ) : (
                    filteredMessages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex flex-col gap-1 group relative ${msg.fromId === 'GM' ? 'items-end' : 'items-start'}`}
                        >
                            <div className="flex items-center gap-1.5 opacity-50 px-1">
                                {msg.fromId === 'GM' ? <Shield size={8} className="text-accent" /> : <User size={8} />}
                                <span className="text-ui-8 font-bold uppercase truncate max-w-[100px]">
                                    {getCharacterName(msg.fromId, msg.fromName)}
                                </span>
                                <span className="text-ui-8 font-mono">{format(msg.timestamp, 'HH:mm')}</span>
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
                                    className="absolute -right-1 -top-1 p-1 rounded-full bg-gm-gold text-app-bg scale-0 group-hover:scale-100 transition-all shadow-lg hover:bg-app-text active:scale-90"
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
                    className="flex-1 bg-app-surface/60 border border-app-border/40 rounded-lg py-1.5 px-3 text-ui-11 placeholder:text-app-text/30 focus:outline-none focus:border-accent/50 transition-colors"
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
                    <span className="text-ui-8 font-mono uppercase tracking-tighter text-app-text/40">{t('modules:session.messenger.session_only')}</span>
                 </div>
                 <div className="w-1 h-1 rounded-full bg-accent/40 animate-pulse" />
            </div>
        </div>
    );
};
