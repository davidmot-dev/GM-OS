import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useSessionOSStore } from '../../modules/session/store/index';
import { MessageSquare, Send, X, Users, Shield, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HubMessengerProps {
    isOpen: boolean;
    onClose: () => void;
    characterId: string;
    characterName: string;
    selectedRecipientId: string;
    onRecipientChange: (id: string) => void;
}

export const HubMessenger: React.FC<HubMessengerProps> = memo(({ isOpen, onClose, characterId, characterName, selectedRecipientId, onRecipientChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    const messages = useSessionOSStore((state) => state.messages);
    const players = useSessionOSStore((state) => state.players);
    const activeCampaignId = useSessionOSStore((state) => state.activeCampaignId);
    const remoteSendMessage = useSessionOSStore((state) => state.remoteSendMessage);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Get all other characters in the campaign
    const otherCharacters = useMemo(() => {
        const others: { id: string; name: string; portrait: string; type: 'pc' | 'gm' | 'all' }[] = [
            { id: 'GM', name: 'Maître du Jeu', portrait: '', type: 'gm' },
            { id: 'all', name: 'Tous les Joueurs', portrait: '', type: 'all' }
        ];

        if (!activeCampaignId) return others;

        players.forEach(p => {
            p.characters.forEach(c => {
                // Ensure strict string comparison for campaign alignment
                const isSameCampaign = c.campaignId && String(c.campaignId) === String(activeCampaignId);
                if (c.id !== characterId && isSameCampaign) {
                    others.push({ id: c.id, name: c.name, portrait: c.portraitUrl, type: 'pc' });
                }
            });
        });

        return others;
    }, [players, characterId, activeCampaignId]);

    const selectedRecipient = otherCharacters.find(c => c.id === selectedRecipientId) || otherCharacters[0];

    // Filter messages for the current conversation
    const chatMessages = messages.filter(m => {
        // 1. General Channel ('all') - Show only broadcasts
        if (selectedRecipientId === 'all') {
            return m.toId === 'all' || !m.toId;
        }

        // 2. Private Channel (Specific Player or GM) - Show only direct dialogue
        // This naturally excludes broadcasts (toId === 'all')
        return (m.fromId === characterId && m.toId === selectedRecipientId) || 
               (m.fromId === selectedRecipientId && m.toId === characterId);
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatMessages, isOpen, selectedRecipientId]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        remoteSendMessage(
            selectedRecipientId, 
            selectedRecipient.name, 
            characterId, 
            characterName, 
            inputValue.trim()
        );
        setInputValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed top-4 bottom-28 right-4 w-80 md:w-96 bg-app-surface/95 backdrop-blur-2xl border border-app-border/40 z-[100] flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] rounded-[2.5rem] overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-app-border/20 flex items-center justify-between bg-app-surface/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/20 rounded-lg text-accent">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-app-text uppercase tracking-wider">Messagerie</h3>
                                <p className="text-ui-10 text-accent font-medium">Canal {selectedRecipient.type === 'gm' ? 'Direct MJ' : selectedRecipient.type === 'all' ? 'Général' : 'Privé'}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-app-text/10 rounded-full text-app-text/40 transition-colors"
                            title="Fermer la messagerie"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Recipient Selector (Dropdown) */}
                    <div className="px-4 py-3 bg-app-bg/40 border-b border-app-border/20 relative z-50">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-app-surface border border-app-border/40 hover:border-accent/40 rounded-xl transition-all shadow-sm"
                            title="Choisir le destinataire"
                        >
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <span className="text-app-text/60 mr-1 text-xs uppercase tracking-wider">À :</span>
                                {selectedRecipient.type === 'gm' ? (
                                    <Shield size={14} className="text-accent" />
                                ) : selectedRecipient.type === 'all' ? (
                                    <Users size={14} className="text-accent" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full overflow-hidden bg-app-surface border border-accent/40">
                                        {selectedRecipient.portrait ? (
                                            <img src={selectedRecipient.portrait} alt={selectedRecipient.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-ui-9 font-bold text-accent">
                                                {selectedRecipient.name[0]}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <span className={selectedRecipient.type !== 'pc' ? 'text-accent' : 'text-app-text'}>
                                    {selectedRecipient.name}
                                </span>
                            </div>
                            <ChevronDown size={16} className={`text-app-text/60 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-accent' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-[calc(100%+0.5rem)] left-4 right-4 bg-app-surface border border-app-border/60 shadow-2xl rounded-xl overflow-hidden backdrop-blur-3xl z-50 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-app-text/10"
                                >
                                    {otherCharacters.map((char) => (
                                        <button
                                            key={char.id}
                                            onClick={() => {
                                                onRecipientChange(char.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-app-text/5 transition-colors border-l-2 text-sm ${
                                                selectedRecipientId === char.id
                                                    ? 'bg-accent/10 border-accent font-bold text-accent'
                                                    : 'border-transparent text-app-text/80'
                                            }`}
                                        >
                                            {char.type === 'gm' ? (
                                                <Shield size={14} className={selectedRecipientId === char.id ? 'text-accent' : 'text-app-text/60'} />
                                            ) : char.type === 'all' ? (
                                                <Users size={14} className={selectedRecipientId === char.id ? 'text-accent' : 'text-app-text/60'} />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full overflow-hidden bg-app-bg border border-app-border/40">
                                                    {char.portrait ? (
                                                        <img src={char.portrait} alt={char.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-ui-10 font-bold">
                                                            {char.name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {char.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Messages List */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-app-text/10"
                    >
                        {chatMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30">
                                <MessageSquare size={48} className="mb-4" />
                                <p className="text-sm">Aucun message avec {selectedRecipient.name}.</p>
                                <p className="text-xs">Commencez la conversation !</p>
                            </div>
                        ) : (
                            chatMessages.map((msg) => {
                                const isMe = msg.fromId === characterId;
                                const isBroadcast = msg.toId === 'all';
                                
                                return (
                                    <div 
                                        key={msg.id}
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                                            isMe 
                                                ? 'bg-accent text-app-bg rounded-tr-none shadow-lg' 
                                                : 'bg-app-bg text-app-text rounded-tl-none border border-app-border'
                                        }`}>
                                            {msg.content}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {!isMe && (
                                                <span className="text-ui-9 font-bold text-accent uppercase tracking-tighter">
                                                    {msg.fromName}
                                                </span>
                                            )}
                                            {isBroadcast && <Users size={8} className="text-app-text/40" />}
                                            <span className="text-ui-9 text-app-text/40 uppercase tracking-tighter">
                                                {isMe ? 'VOUS' : ''} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-app-surface/50 border-t border-app-border/20">
                        <div className="relative">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                title="Entrer un message"
                                placeholder={`Message à ${selectedRecipient.name}...`}
                                className="w-full bg-app-bg border border-app-border/40 rounded-xl py-3 pl-4 pr-12 text-sm text-app-text placeholder-app-text/30 focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none min-h-[44px] max-h-32 transition-all"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                title="Envoyer le message"
                                className="absolute right-2 bottom-2 p-2 bg-accent hover:brightness-110 disabled:opacity-50 text-app-bg rounded-lg transition-all shadow-lg"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <p className="text-ui-10 text-app-text/40 mt-2 italic text-center">
                            {selectedRecipientId === 'all' 
                                ? 'Tout le monde pourra lire ce message.' 
                                : `Seul ${selectedRecipient.name} pourra lire ce message.`}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
