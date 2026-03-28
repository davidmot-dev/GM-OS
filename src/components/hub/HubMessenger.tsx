import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSessionOSStore } from '../../modules/session/store/index';
import { MessageSquare, Send, X, Users, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HubMessengerProps {
    isOpen: boolean;
    onClose: () => void;
    characterId: string;
    characterName: string;
}

export const HubMessenger: React.FC<HubMessengerProps> = ({ isOpen, onClose, characterId, characterName }) => {
    const [inputValue, setInputValue] = useState('');
    const [selectedRecipientId, setSelectedRecipientId] = useState<string>('GM');
    
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

        players.forEach(p => {
            p.characters.forEach(c => {
                if (c.id !== characterId && c.campaignId === activeCampaignId) {
                    others.push({ id: c.id, name: c.name, portrait: c.portraitUrl, type: 'pc' });
                }
            });
        });

        return others;
    }, [players, characterId, activeCampaignId]);

    const selectedRecipient = otherCharacters.find(c => c.id === selectedRecipientId) || otherCharacters[0];

    // Filter messages for the current conversation
    const chatMessages = messages.filter(m => {
        // Broadcasts are always visible
        if (m.toId === 'all' || !m.toId) return true;

        if (selectedRecipientId === 'GM') {
            // Conv with GM: me to GM or GM to me
            return (m.fromId === characterId && m.toId === 'GM') || 
                   (m.fromId === 'GM' && m.toId === characterId);
        } else {
            // Conv with specific player: me to them or them to me
            // (GM still sees all, but here we filter for the tablet UI)
            return (m.fromId === characterId && m.toId === selectedRecipientId) || 
                   (m.fromId === selectedRecipientId && m.toId === characterId);
        }
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
                    className="fixed top-4 bottom-28 right-4 w-80 md:w-96 bg-slate-950/90 backdrop-blur-2xl border border-white/10 z-[100] flex flex-col shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Messagerie</h3>
                                <p className="text-[10px] text-indigo-400 font-medium">Canal {selectedRecipient.type === 'gm' ? 'Direct MJ' : selectedRecipient.type === 'all' ? 'Général' : 'Privé'}</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                            title="Fermer la messagerie"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Recipient Selector */}
                    <div className="px-4 py-2 bg-black/40 border-b border-white/5 overflow-x-auto flex items-center gap-2 no-scrollbar">
                        {otherCharacters.map((char) => (
                            <button
                                key={char.id}
                                onClick={() => setSelectedRecipientId(char.id)}
                                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                                    selectedRecipientId === char.id
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                            >
                                {char.type === 'gm' ? (
                                    <Shield size={12} />
                                ) : char.type === 'all' ? (
                                    <Users size={12} />
                                ) : (
                                    <div className="w-4 h-4 rounded-full overflow-hidden bg-gray-700">
                                        {char.portrait ? (
                                            <img src={char.portrait} alt={char.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">
                                                {char.name[0]}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {char.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>

                    {/* Messages List */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
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
                                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' 
                                                : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                                        }`}>
                                            {msg.content}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            {!isMe && (
                                                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">
                                                    {msg.fromName}
                                                </span>
                                            )}
                                            {isBroadcast && <Users size={8} className="text-gray-500" />}
                                            <span className="text-[9px] text-gray-500 uppercase tracking-tighter">
                                                {isMe ? 'VOUS' : ''} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white/5 border-t border-white/10">
                        <div className="relative">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={`Message à ${selectedRecipient.name}...`}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none min-h-[44px] max-h-32 transition-all"
                                rows={1}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className="absolute right-2 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg transition-all shadow-lg"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 italic text-center">
                            {selectedRecipientId === 'all' 
                                ? 'Tout le monde pourra lire ce message.' 
                                : `Seul ${selectedRecipient.name} pourra lire ce message.`}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
