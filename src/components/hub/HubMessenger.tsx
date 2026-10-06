import { useFermetureParEchap } from '../../hooks/useFermetureParEchap';
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useSessionOSStore } from '../../modules/session/store/index';
import { Send, Users, Shield, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bouton, EnTeteDeModule } from '../socle';

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

    useFermetureParEchap(isOpen, () => {
        if (isDropdownOpen) setIsDropdownOpen(false);
        else onClose();
    }, 'Messagerie tablette');

    return (
        <AnimatePresence>
            {isOpen && <motion.section role="dialog" aria-label="Messagerie" aria-modal="true" data-messagerie-joueur=""
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                className="fixed inset-3 z-[150] flex min-h-0 flex-col border border-app-border bg-app-surface shadow-2xl lg:left-auto lg:w-[440px]">
                <EnTeteDeModule habillage="libre" className="flex shrink-0 items-start justify-between gap-3 border-b border-app-border p-3">
                    <div className="space-y-1"><h2 className="text-[24px] font-bold text-app-text">Messagerie</h2>
                        <p className="text-[14px] text-accent">Canal {selectedRecipient.type === 'gm' ? 'Direct MJ' : selectedRecipient.type === 'all' ? 'Général' : 'Privé'}</p>
                    </div>
                    <Bouton cibleTactile onClick={onClose} title="Fermer la messagerie">Fermer</Bouton>
                </EnTeteDeModule>
                <div className="relative shrink-0 border-b border-app-border p-3">
                    <Bouton habillage="libre" cibleTactile onClick={() => setIsDropdownOpen(!isDropdownOpen)} aria-expanded={isDropdownOpen}
                        title="Choisir le destinataire" className="flex w-full items-center justify-between gap-3 border border-app-border bg-app-bg p-3 text-left">
                        <span className="min-w-0 break-words text-[14px] text-app-text">À : {selectedRecipient.name}</span>
                        <ChevronDown size={16} className="shrink-0 text-accent" />
                    </Bouton>
                    {isDropdownOpen && <div className="absolute inset-x-3 top-full z-10 max-h-[35dvh] overflow-auto border border-app-border bg-app-surface">
                        {otherCharacters.map(char => <Bouton habillage="libre" cibleTactile key={char.id}
                            onClick={() => { onRecipientChange(char.id); setIsDropdownOpen(false); }}
                            aria-pressed={selectedRecipientId === char.id}
                            className={`flex w-full items-center gap-3 p-3 text-left text-[14px] ${selectedRecipientId === char.id ? 'bg-accent/10 text-accent' : 'text-app-text'}`}>
                            {char.type === 'gm' ? <Shield size={16} /> : <Users size={16} />}{char.name}
                        </Bouton>)}
                    </div>}
                </div>
                <div ref={scrollRef} role="log" aria-label="Conversation" className="min-h-0 flex-1 space-y-4 overflow-auto p-3">
                    {chatMessages.length === 0 ? <p className="text-[14px] text-app-muted">Aucun message avec {selectedRecipient.name}. Commencez la conversation !</p> : chatMessages.map(msg => {
                        const isMe = msg.fromId === characterId;
                        return <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <p className={`max-w-[90%] whitespace-pre-wrap break-words p-3 text-[16px] leading-relaxed ${isMe ? 'bg-accent text-app-on-accent' : 'border border-app-border bg-app-bg text-app-text'}`}>{msg.content}</p>
                            <p className="mt-1 text-[14px] text-app-muted">{isMe ? 'VOUS' : msg.fromName} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>;
                    })}
                </div>
                <div className="shrink-0 space-y-2 border-t border-app-border p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
                    <div className="flex items-end gap-2">
                        <textarea value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyPress}
                            title="Entrer un message" placeholder={`Message à ${selectedRecipient.name}...`} rows={2}
                            className="min-h-[60px] min-w-0 flex-1 resize-y border border-app-border bg-app-bg p-3 text-[16px] text-app-text placeholder:text-app-muted" />
                        <Bouton cibleTactile onClick={handleSend} disabled={!inputValue.trim()} title="Envoyer le message" variante="accent" icone={<Send size={16} />}>Envoyer</Bouton>
                    </div>
                    <p className="text-[14px] text-app-muted">{selectedRecipientId === 'all' ? 'Tout le monde pourra lire ce message.' : `Seul ${selectedRecipient.name} pourra lire ce message.`}</p>
                </div>
            </motion.section>}
        </AnimatePresence>
    );
});
