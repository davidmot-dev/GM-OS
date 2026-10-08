import React, { useState, memo } from 'react';
import { Package, Send, User, ChevronRight, Clock, Trash2 } from 'lucide-react';
import { ResolvedImage } from '../ResolvedImage';
import { type FavoriteEntity } from '../../modules/favorite/useFavoriteStore';
import { type InventoryItem, type PlayerCharacter } from '../../modules/session/store/types';
import type { TransferRequest } from '../../types/player.types';
import { motion, AnimatePresence } from 'framer-motion';
import { Bouton, EnTeteDeModule, Etiquette, GabaritDeModule, Panneau } from '../socle';

interface HubInventoryProps {
    items: FavoriteEntity[]; // Legacy favorites
    structuredItems?: InventoryItem[]; // New structured inventory
    characters?: (PlayerCharacter & { playerId?: string })[]; // Potential recipients
    currentCharacterId?: string;
    transferRequests?: TransferRequest[]; // To show pending status
    onSelectItem: (item: FavoriteEntity) => void;
    commandes?: React.ReactNode;
    informations?: React.ReactNode;
}

export const HubInventory: React.FC<HubInventoryProps> = memo(({ 
    items, 
    structuredItems = [], 
    characters = [], 
    currentCharacterId,
    transferRequests = [], 
    onSelectItem, commandes, informations
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
        <div data-inventaire-joueur="" className="w-full h-full min-h-0 pointer-events-auto relative">
            <GabaritDeModule className="mx-auto max-w-7xl" barreDOutils={commandes} entete={
            <EnTeteDeModule habillage="libre" className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <h2 className="text-[24px] font-bold text-app-text flex items-center gap-3">
                        <Package className="text-accent" size={24} />
                        Inventaire
                    </h2>
                    <p className="text-[14px] text-app-muted">Trésors, reliques et possessions personnelles.</p>
                </div>
                <div className="flex gap-2">
                    <Etiquette ton="accent" className="text-[14px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                        {structuredItems.length + items.length} Objets
                    </Etiquette>
                </div>
            </EnTeteDeModule>}>

            <div className="pb-2">
                <div className="space-y-6">
                    {informations}
                    {/* Structured Inventory Section */}
                    <section className="space-y-6">
                        <h3 className="text-[14px] font-bold text-app-muted flex items-center gap-2">
                            <div className="w-1 h-4 bg-accent rounded-full" />
                            Sac à Dos (Interactif)
                        </h3>
                        
                        {structuredItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {structuredItems.map((item) => {
                                    const isPending = (transferRequests || []).some(r => r.item.id === item.id && r.status === 'pending');
                                    return (
                                        <Panneau as="div"
                                            key={item.id}
                                            className="group min-w-0 flex flex-col gap-3 p-3"
                                        >
                                            <div className="relative h-16 w-full rounded-lg overflow-hidden bg-app-bg/40 flex items-center justify-center">
                                                <Package className={`${isPending ? 'text-app-text/20' : 'text-accent/20 group-hover:scale-110'} transition-transform duration-700`} size={32} />
                                                {isPending && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-app-bg/40 backdrop-blur-[2px]">
                                                        <Clock size={16} className="text-accent animate-pulse" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 px-2 py-1 bg-app-surface text-[14px] text-accent">
                                                    {isPending ? 'En attente' : item.rarity}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <h3 className="text-[16px] font-bold text-app-text break-words" title={item.name}>{item.name}</h3>
                                                <p className="text-[14px] text-app-muted">Quantité : {item.quantity}</p>
                                                {item.description && <p className="text-[14px] text-app-muted break-words">{item.description}</p>}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                                <Bouton variante="accent" cibleTactile
                                                    disabled={isPending}
                                                    onClick={() => setTransferringItem(item)}
                                                    className="min-w-0 px-2"
                                                    title="Donner"
                                                >
                                                    <Send size={16} /><span className="text-[12px] tracking-normal">Donner</span>
                                                </Bouton>
                                                <Bouton variante="danger" cibleTactile
                                                    disabled={isPending}
                                                    onClick={() => handleDropItem(item)}
                                                    className="min-w-0 px-2"
                                                    title="Jeter"
                                                >
                                                    <Trash2 size={16} /><span className="text-[12px] tracking-normal">Jeter</span>
                                                </Bouton>
                                            </div>
                                        </Panneau>
                                    );
                                })}
                            </div>
                        ) : (
                            <Panneau as="div" vide className="p-6 text-center">
                                <p className="text-[14px] text-app-muted">Votre sac à dos est vide</p>
                            </Panneau>
                        )}
                    </section>

                    {/* Legacy / Favorites Section */}
                    {items.length > 0 && (
                        <section className="space-y-6">
                            <h3 className="text-[14px] font-bold text-app-muted flex items-center gap-2">
                                <div className="w-1 h-4 bg-app-text/20 rounded-full" />
                                Objets Scannés (Atlas)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {items.map((item) => (
                                    <Bouton habillage="libre" cibleTactile
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
                                            <h3 className="text-[16px] font-bold text-app-text break-words">{item.name}</h3>
                                        </div>
                                    </Bouton>
                                ))}
                            </div>
                        </section>
                    )}

                    {(items.length === 0 && structuredItems.length === 0) && (
                        <Panneau as="div" vide className="p-6 flex flex-col items-center text-center gap-3 w-full">
                            <div className="p-12 bg-app-surface/40 rounded-full border border-app-border/10">
                                <Package size={80} className="text-app-text/5" />
                            </div>
                            <div className="space-y-3">
                                <p className="text-[16px] font-bold text-app-text">Inventaire Vide</p>
                                <p className="max-w-xs text-[14px] text-app-muted leading-relaxed">
                                    Vous ne possédez aucun objet pour le moment.
                                </p>
                            </div>
                        </Panneau>
                    )}
                </div>
            </div>

            </GabaritDeModule>
            {/* Transfer Modal Overlay */}
            <AnimatePresence>
                {transferringItem && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        role="dialog" aria-modal="true" aria-label="Donner un objet"
                        className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-app-bg/90 pointer-events-auto"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-lg"
                        >
                            <Panneau as="div" niveau={3} className="w-full max-h-[calc(100dvh-24px)] overflow-y-auto p-4 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[20px] font-bold text-app-text">Donner un objet</h3>
                                <Bouton cibleTactile onClick={() => setTransferringItem(null)} className="min-w-[44px] px-2" title="Fermer le don">
                                    Fermer
                                </Bouton>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-accent/5 border border-accent/10 rounded-lg">
                                <div className="size-10 shrink-0 flex items-center justify-center text-accent">
                                    <Package size={40} />
                                </div>
                                <div className="min-w-0 flex flex-col">
                                    <span className="text-[14px] text-accent mb-1">{transferringItem.type}</span>
                                    <h4 className="text-[16px] font-bold text-app-text break-words">{transferringItem.name}</h4>
                                    <p className="text-[14px] text-app-muted break-words">{transferringItem.description}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[14px] font-bold text-app-muted">Choisir le destinataire</p>
                                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {otherCharacters.map(char => (
                                        <Bouton habillage="libre" cibleTactile
                                            key={char.id}
                                            onClick={() => handleRequestTransfer(char.id)}
                                            className="flex items-center justify-between p-4 rounded-2xl bg-app-text/5 border border-app-text/5 hover:bg-accent/10 hover:border-accent/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-app-bg flex items-center justify-center overflow-hidden border border-app-text/10 group-hover:border-accent/40 transition-colors">
                                                    {char.portraitUrl ? <ResolvedImage src={char.portraitUrl} className="w-full h-full object-cover" /> : <User size={20} className="text-app-text/20" />}
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-[14px] font-bold text-app-text break-words">{char.name}</span>
                                                    <span className="text-[14px] text-app-muted break-words">{char.classRace}</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="text-app-text/20 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                        </Bouton>
                                    ))}
                                    {otherCharacters.length === 0 && (
                                        <div className="py-8 text-center bg-app-text/5 rounded-2xl border border-dashed border-app-text/10">
                                            <p className="text-[14px] text-app-muted">Aucun autre membre dans l'équipe</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-etat-alerte/10 border border-etat-alerte/20 p-4 rounded-2xl flex items-center gap-4">
                                <div className="size-8 rounded-full bg-etat-alerte/20 flex items-center justify-center text-etat-alerte shrink-0">
                                    <Clock size={16} />
                                </div>
                                <p className="text-[14px] text-etat-alerte leading-relaxed">
                                    Le Maître du Jeu doit valider l'échange avant qu'il ne soit effectif.
                                </p>
                            </div>
                            </Panneau>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
