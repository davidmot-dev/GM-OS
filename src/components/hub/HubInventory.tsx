import React, { useState, memo } from 'react';
import { Package, Send, User, ChevronRight, X, Clock, Trash2 } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import { type FavoriteEntity } from '../../modules/favorite/useFavoriteStore';
import { type InventoryItem, type PlayerCharacter } from '../../modules/session/store/types';
import { motion, AnimatePresence } from 'framer-motion';

interface HubInventoryProps {
    items: FavoriteEntity[]; // Legacy favorites
    structuredItems?: InventoryItem[]; // New structured inventory
    characters?: (PlayerCharacter & { playerId?: string })[]; // Potential recipients
    currentCharacterId?: string;
    transferRequests?: any[]; // To show pending status
    onSelectItem: (item: any) => void;
}

export const HubInventory: React.FC<HubInventoryProps> = memo(({ 
    items, 
    structuredItems = [], 
    characters = [], 
    currentCharacterId,
    transferRequests = [], 
    onSelectItem 
}) => {
    const [transferringItem, setTransferringItem] = useState<InventoryItem | null>(null);

    const otherCharacters = characters.filter(c => c.id !== currentCharacterId);

    const handleRequestTransfer = (recipientId: string) => {
        if (!transferringItem) return;

        // Dispatch custom event for useHubSync to pick up
        window.dispatchEvent(new CustomEvent('session:request-item-transfer', {
            detail: {
                fromCharId: currentCharacterId,
                toCharId: recipientId,
                item: transferringItem
            }
        }));

        setTransferringItem(null);
    };

    const handleDropItem = (item: InventoryItem) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir jeter "${item.name}" ? Cette action est définitive.`)) return;

        // Dispatch custom event for useHubSync to pick up
        window.dispatchEvent(new CustomEvent('session:remove-inventory-item', {
            detail: {
                playerId: characters.find(c => c.id === currentCharacterId)?.playerId || '',
                characterId: currentCharacterId,
                itemId: item.id
            }
        }));
    };

    return (
        <div className="w-full h-full p-4 overflow-hidden flex flex-col pointer-events-auto relative">
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-app-text flex items-center gap-4">
                        <Package className="text-accent" size={30} />
                        Inventaire
                    </h2>
                    <p className="text-[10px] text-app-text/30 font-bold uppercase tracking-[0.5em]">Trésors, reliques et possessions personnelles.</p>
                </div>
                <div className="flex gap-2">
                    <div className="text-[10px] font-black bg-accent/10 border border-accent/20 px-6 py-2 rounded-full text-accent uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        {structuredItems.length + items.length} Objets
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar-minimal pr-4 pb-32">
                <div className="space-y-12">
                    {/* Structured Inventory Section */}
                    <section className="space-y-6">
                        <h3 className="text-xs font-black text-app-text/40 uppercase tracking-[0.3em] px-4 flex items-center gap-2">
                            <div className="w-1 h-4 bg-accent rounded-full" />
                            Sac à Dos (Interactif)
                        </h3>
                        
                        {structuredItems.length > 0 ? (
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                                {structuredItems.map((item) => {
                                    const isPending = (transferRequests || []).some(r => r.item.id === item.id && r.status === 'pending');
                                    return (
                                        <div 
                                            key={item.id}
                                            className={`group relative flex flex-col gap-2 p-3 rounded-[1.5rem] bg-accent/5 border border-white/5 transition-all duration-500 shadow-lg ${isPending ? 'opacity-50 grayscale' : 'hover:border-accent/40'}`}
                                        >
                                            <div className="relative aspect-square w-full rounded-[1.2rem] overflow-hidden bg-black/40 flex items-center justify-center">
                                                <Package className={`${isPending ? 'text-app-text/20' : 'text-accent/20 group-hover:scale-110'} transition-transform duration-700`} size={32} />
                                                {isPending && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                                        <Clock size={16} className="text-accent animate-pulse" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-accent/20 border border-accent/30 text-[6px] font-black text-accent uppercase tracking-tighter">
                                                    {isPending ? 'Wait...' : item.rarity}
                                                </div>
                                            </div>
                                            
                                            <div className="px-1 text-center space-y-0.5">
                                                <h3 className="text-[9px] font-black text-app-text uppercase tracking-wider truncate" title={item.name}>{item.name}</h3>
                                                <p className="text-[7px] font-bold text-app-text/40 uppercase tracking-widest">Qty: {item.quantity}</p>
                                            </div>

                                            <div className="flex gap-1.5 mt-1">
                                                <button 
                                                    disabled={isPending}
                                                    onClick={() => setTransferringItem(item)}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border transition-all text-[7px] font-black uppercase tracking-widest ${
                                                        isPending 
                                                            ? 'bg-app-bg/40 text-app-text/20 border-white/5 cursor-not-allowed'
                                                            : 'bg-accent/20 hover:bg-accent/40 text-accent border-accent/20'
                                                    }`}
                                                    title="Donner"
                                                >
                                                    <Send size={10} />
                                                </button>
                                                <button 
                                                    disabled={isPending}
                                                    onClick={() => handleDropItem(item)}
                                                    className={`aspect-square flex items-center justify-center py-1.5 rounded-lg border transition-all text-red-400 border-red-400/20 bg-red-400/10 hover:bg-red-400/20`}
                                                    title="Jeter"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="mx-4 p-8 border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.02] text-center">
                                <p className="text-[10px] font-bold text-app-text/20 uppercase tracking-widest">Votre sac à dos est vide</p>
                            </div>
                        )}
                    </section>

                    {/* Legacy / Favorites Section */}
                    {items.length > 0 && (
                        <section className="space-y-6">
                            <h3 className="text-xs font-black text-app-text/40 uppercase tracking-[0.3em] px-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-app-text/20 rounded-full" />
                                Objets Scannés (Atlas)
                            </h3>
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">
                                {items.map((item) => (
                                    <button 
                                        key={item.id}
                                        onClick={() => onSelectItem(item)}
                                        className="group text-left relative flex flex-col gap-2 p-3 rounded-[1.5rem] bg-app-surface/40 border border-app-border/10 hover:bg-app-surface/80 hover:border-accent/30 transition-all duration-500 w-full"
                                    >
                                        <div className="relative aspect-square w-full rounded-[1.2rem] overflow-hidden bg-app-bg shadow-lg flex items-center justify-center">
                                            {item.imageUrl ? (
                                                <ResolvedImage src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                            ) : (
                                                <Package className="text-app-text/20" size={32} />
                                            )}
                                        </div>
                                        <div className="px-1 text-center">
                                            <h3 className="text-[9px] font-black text-app-text uppercase tracking-wider truncate">{item.name}</h3>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {(items.length === 0 && structuredItems.length === 0) && (
                        <div className="py-32 flex flex-col items-center justify-center text-center gap-8 border-2 border-dashed border-app-border/20 rounded-[4rem] bg-app-surface/20 w-full">
                            <div className="p-12 bg-app-surface/40 rounded-full border border-app-border/10">
                                <Package size={80} className="text-app-text/5" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-sm font-black uppercase tracking-[0.4em] text-app-text/20">Inventaire Vide</p>
                                <p className="max-w-xs text-[10px] text-app-text/10 font-bold uppercase leading-relaxed">
                                    Vous ne possédez aucun objet pour le moment.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transfer Modal Overlay */}
            <AnimatePresence>
                {transferringItem && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl pointer-events-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-app-surface border border-accent/30 rounded-[3rem] p-8 shadow-glow-accent/20 flex flex-col gap-8"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-app-text uppercase tracking-tighter">Donner un objet</h3>
                                <button onClick={() => setTransferringItem(null)} className="p-2 hover:bg-white/5 rounded-full text-app-text/40 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex items-center gap-6 p-6 bg-accent/5 border border-accent/10 rounded-3xl">
                                <div className="w-20 h-20 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                                    <Package size={40} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">{transferringItem.type}</span>
                                    <h4 className="text-xl font-black text-app-text uppercase">{transferringItem.name}</h4>
                                    <p className="text-xs text-app-text/40">{transferringItem.description}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-app-text/40 uppercase tracking-[0.4em] px-2">Choisir le destinataire</p>
                                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {otherCharacters.map(char => (
                                        <button
                                            key={char.id}
                                            onClick={() => handleRequestTransfer(char.id)}
                                            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-accent/10 hover:border-accent/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-app-bg flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-accent/40 transition-colors">
                                                    {char.portraitUrl ? <ResolvedImage src={char.portraitUrl} className="w-full h-full object-cover" /> : <User size={20} className="text-app-text/20" />}
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-sm font-black text-app-text uppercase tracking-tight group-hover:text-accent transition-colors">{char.name}</span>
                                                    <span className="text-[9px] font-bold text-app-text/30 uppercase tracking-widest">{char.classRace}</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-app-text/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                    {otherCharacters.length === 0 && (
                                        <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                            <p className="text-xs font-bold text-app-text/20 uppercase tracking-widest italic">Aucun autre membre dans l'équipe</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4">
                                <div className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                                    <Clock size={16} />
                                </div>
                                <p className="text-[10px] font-bold text-amber-500/80 leading-relaxed uppercase tracking-wider">
                                    Le Maître du Jeu doit valider l'échange avant qu'il ne soit effectif.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
