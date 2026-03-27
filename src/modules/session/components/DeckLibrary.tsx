/**
 * DeckLibrary — Gestionnaire de collection Deck-OS
 * 
 * Permet de déclarer, modifier et supprimer des paquets de cartes.
 * 
 * @module session/components/DeckLibrary
 */

import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    Plus, 
    Trash2, 
    Settings2, 
    Layers, 
    ArrowRight,
    Search,
    Monitor,
    Smartphone,
    X,
    FolderOpen
} from 'lucide-react';
import type { DeckManifest, CardFormat, CardOrientation } from '../store/types';

const DeckLibrary: React.FC = () => {
    const { decks, addDeck, deleteDeck, setCurrentView } = useSessionOSStore();
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [systemId, setSystemId] = useState('generic');
    const [folderPath, setFolderPath] = useState('assets/decks/generic/test-deck');
    const [cardCount, setCardCount] = useState(54);
    const [format, setFormat] = useState<CardFormat>('poker');
    const [orientation, setOrientation] = useState<CardOrientation>('portrait');
    const [useDiscard, setUseDiscard] = useState(true);

    const handleAdd = () => {
        if (!name || !folderPath) return;
        addDeck({
            name,
            systemId,
            folderPath,
            cardCount,
            format,
            orientation,
            useDiscard
        });
        setIsAdding(false);
        // Reset form
        setName('');
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0c] p-8 gap-8 overflow-y-auto custom-scrollbar">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gm-gold/10 flex items-center justify-center border border-gm-gold/20">
                        <Layers className="text-gm-gold" size={24} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white/80">
                            Deck-OS <span className="text-white/20 px-2">//</span> 
                            <span className="text-gm-gold">Bibliothèque Tactique</span>
                        </h1>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Gestion des paquets de cartes et éléments narratifs</p>
                    </div>
                </div>

                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-gm-gold hover:bg-yellow-500 text-black font-black px-6 py-2.5 rounded-xl text-[10px] tracking-widest uppercase transition-all shadow-glow-gold/20"
                >
                    <Plus size={14} />
                    Nouveau Paquet
                </button>
            </header>

            {/* Decks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.length === 0 && !isAdding && (
                    <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-white/10 gap-4">
                        <Layers size={48} strokeWidth={1} />
                        <span className="text-xs font-black uppercase tracking-widest">Aucun paquet enregistré</span>
                    </div>
                )}

                {decks.map(deck => (
                    <div 
                        key={deck.id}
                        className="group relative h-48 rounded-[2rem] bg-[#121215] border border-white/5 hover:border-gm-gold/30 p-6 flex flex-col justify-between transition-all duration-500 shadow-xl overflow-hidden"
                    >
                        {/* Decorative Background Icon */}
                        <Layers className="absolute -right-8 -bottom-8 text-white/5 group-hover:text-gm-gold/5 transition-all rotate-12" size={160} />
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-white font-black uppercase tracking-widest text-sm">{deck.name}</h3>
                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-black text-white/40 uppercase tracking-tighter">
                                        {deck.systemId}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-gm-gold/10 text-[8px] font-black text-gm-gold uppercase tracking-tighter">
                                        {deck.cardCount} cartes
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-lg bg-white/5 text-white/20 hover:text-white transition-all">
                                    <Settings2 size={14} />
                                </button>
                                <button 
                                    onClick={() => deleteDeck(deck.id)}
                                    className="p-2 rounded-lg bg-white/5 text-white/20 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                                {deck.orientation === 'portrait' ? <Smartphone size={12} /> : <Monitor size={12} />}
                                {deck.format} — {deck.orientation}
                            </div>
                            <button 
                                onClick={() => setCurrentView('deck-player')}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-gm-gold hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                                Charger
                                <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Addition Form Card */}
                {isAdding && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-1 h-auto rounded-[2rem] bg-gradient-to-br from-[#1a1a20] to-[#0d0d0f] border border-gm-gold/30 p-8 space-y-6 shadow-glow-gold/10 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-gm-gold text-xs font-black uppercase tracking-[0.2em]">Initialisation Deck</h3>
                            <button onClick={() => setIsAdding(false)} className="text-white/20 hover:text-white transition-all"><X size={18} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Nom du Paquet</label>
                                <input 
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none"
                                    placeholder="ex: Drama Deck Torg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Format</label>
                                    <select 
                                        value={format}
                                        onChange={e => setFormat(e.target.value as CardFormat)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-[10px] uppercase font-black tracking-widest focus:border-gm-gold/40 transition-all outline-none"
                                    >
                                        <option value="poker">POKER (2.5x3.5)</option>
                                        <option value="tarot">TAROT (2.75x4.75)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Orientation</label>
                                    <select 
                                        value={orientation}
                                        onChange={e => setOrientation(e.target.value as CardOrientation)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-[10px] uppercase font-black tracking-widest focus:border-gm-gold/40 transition-all outline-none"
                                    >
                                        <option value="portrait">PORTRAIT</option>
                                        <option value="landscape">PAYSAGE</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1 flex items-center gap-2">
                                    <FolderOpen size={10} /> Chemin Assets (Relatif à /public)
                                </label>
                                <input 
                                    value={folderPath}
                                    onChange={e => setFolderPath(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-[10px] font-mono tracking-tighter text-white/60 focus:border-gm-gold/40 transition-all outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={useDiscard}
                                        onChange={e => setUseDiscard(e.target.checked)}
                                        id="useDiscard"
                                        className="w-4 h-4 rounded bg-black border-white/10 text-gm-gold focus:ring-gm-gold/30"
                                    />
                                    <label htmlFor="useDiscard" className="text-[9px] font-black uppercase tracking-widest text-white/40">Gérer Défausse</label>
                                </div>
                                <button 
                                    onClick={handleAdd}
                                    className="px-6 py-2 bg-gm-gold text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow-gold/20 active:scale-95 transition-all"
                                >
                                    Valider
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeckLibrary;
