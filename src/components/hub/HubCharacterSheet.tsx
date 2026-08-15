import React, { useState, memo } from 'react';
import { Heart, ChevronLeft, Package, BookOpen, PenTool, Shield, Layout } from 'lucide-react';
import { aUneJaugeDeVie, fractionDeVie, pointsDeVieApres } from '../../modules/combat/logic/SanteDuCombattant';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { useClientStore } from '../../stores/useClientStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';
import { ResolvedImage } from '../ResolvedImage';
import type { SheetSection, SheetField } from '../../data/defaultSheetTemplates';
import type { PlayerCharacter, Campaign, SheetTemplate } from '../../modules/session/store/types';
import { resolveSheetTemplate } from '../../modules/session/logic/templateResolver';

interface HubCharacterSheetProps {
    onClose: () => void;
}

/**
 * HubCharacterSheet - Main Wrapper
 * Gère la sélection du personnage et injecte une 'key' pour réinitialiser l'état lors d'un changement.
 */
const HubCharacterSheet: React.FC<HubCharacterSheetProps> = ({ onClose }) => {
    const { characterId } = useClientStore();
    const { players, campaigns, remoteUpdateCharacterVitals, customSheetTemplates, remoteUpdateCharacterNarrative } = useSessionOSStore();

    const playerWithChar = players.find(p => p.characters.some(c => c.id === characterId));
    const character = playerWithChar?.characters.find(c => c.id === characterId);

    if (!character || !playerWithChar) return null;

    return (
        <HubCharacterSheetContent 
            key={character.id}
            character={character}
            playerId={playerWithChar.id}
            onClose={onClose}
            remoteUpdateCharacterVitals={remoteUpdateCharacterVitals}
            customSheetTemplates={customSheetTemplates}
            remoteUpdateCharacterNarrative={remoteUpdateCharacterNarrative}
            campaigns={campaigns}
        />
    );
};

interface ContentProps {
    character: PlayerCharacter;
    playerId: string;
    onClose: () => void;
    remoteUpdateCharacterVitals: (playerId: string, charId: string, updates: { hp?: number; mp?: number; ap?: number }) => void;
    customSheetTemplates: SheetTemplate[];
    remoteUpdateCharacterNarrative: (playerId: string, charId: string, updates: { description?: string; playerNotes?: string; inventory?: string }) => void;
    campaigns: Campaign[];
}

const HubCharacterSheetContent: React.FC<ContentProps> = ({ 
    character, playerId, onClose, remoteUpdateCharacterVitals, customSheetTemplates, remoteUpdateCharacterNarrative, campaigns
}) => {
    // État local pour une saisie fluide
    const [localDescription, setLocalDescription] = useState(character.description ?? '');
    const [localPlayerNotes, setLocalPlayerNotes] = useState(character.playerNotes ?? '');
    const [localInventory, setLocalInventory] = useState(character.inventory ?? '');

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const template = resolveSheetTemplate(character, campaigns, allTemplates);

    const hubOptions = character.hubOptions ?? { showHP: true, showMP: true, showAP: true, showInventory: true, showRelations: true };

    const handleUpdateHP = (delta: number) => {
        // Sans jauge, il n'y a rien à ajuster : `pointsDeVieApres` rend `null`
        // plutôt que de créer des points de vie que le système n'a pas.
        const newHP = pointsDeVieApres(character, delta);
        if (newHP !== null && newHP !== character.hp) {
            remoteUpdateCharacterVitals(playerId, character.id, { hp: newHP });
        }
    };

    const saveNarrative = () => {
        remoteUpdateCharacterNarrative(playerId, character.id, { 
            description: localDescription,
            playerNotes: localPlayerNotes,
            inventory: localInventory
        });
    };

    return (
        <div className="fixed inset-0 z-[150] bg-app-bg/95 backdrop-blur-3xl p-4 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <button 
                    onClick={onClose}
                    title="Fermer la fiche"
                    className="flex items-center gap-2 px-4 py-2 bg-app-surface/40 border border-app-border rounded-2xl text-[10px] font-black text-app-text/40 uppercase tracking-widest hover:text-app-text hover:bg-app-surface/60 transition-all group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour
                </button>
                <div className="text-right">
                    <h2 className="text-3xl font-black text-app-text uppercase tracking-tighter leading-none mb-1">{character.name}</h2>
                    <div className="flex items-center justify-end gap-2">
                        <div className="px-2 py-0.5 bg-accent/10 border border-accent/30 rounded text-[9px] font-black text-accent uppercase tracking-widest flex items-center gap-1.5 shadow-glow-accent/5">
                            <Shield size={10} />
                            SYSTÈME : {template.name}
                        </div>
                        <div className="w-1 h-1 rounded-full bg-app-text/20" />
                        <span className="text-[10px] font-bold text-app-text/40 uppercase tracking-widest">{character.classRace || 'Agent Nexus'}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
                    
                    {/* Portrait & Vitals */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-app-border/20 shadow-2xl bg-app-surface">
                            {character.portraitUrl ? (
                                <ResolvedImage src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-app-text/10">
                                    <Shield size={80} />
                                </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-app-bg to-transparent opacity-80" />
                        </div>

                        {/*
                          **Le bloc entier disparaît sans jauge.** Il affichait
                          « undefined / undefined » et une barre en `NaN` pour
                          les jeux qui ne comptent pas la santé en points — les
                          points de vie ne sont que le détail d'un modèle sur
                          cinq. Un panneau vide vaut mieux qu'un panneau faux.
                        */}
                        {hubOptions.showHP && aUneJaugeDeVie(character) && (
                            <section className="bg-app-surface/60 border border-app-border rounded-[2.5rem] p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Heart size={18} className="text-red-500" fill="currentColor" />
                                        <h3 className="text-xs font-black text-app-text uppercase tracking-widest">Points de Vie</h3>
                                    </div>
                                    <span className="text-xl font-black text-app-text font-mono">{character.hp} / {character.maxHp}</span>
                                </div>
                                <div className="h-3 bg-app-bg/40 rounded-full border border-app-border/10 p-[1px] mb-6">
                                    <div 
                                        className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-700"
                                        style={{ '--progress-width': `${(fractionDeVie(character) ?? 0) * 100}%`, width: 'var(--progress-width)' } as React.CSSProperties}
                                    />
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    <button onClick={() => handleUpdateHP(-5)} title="-5 HP" className="w-12 h-12 rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text/40 hover:text-red-500 hover:border-red-500/30 transition-all">-5</button>
                                    <button onClick={() => handleUpdateHP(-1)} title="-1 HP" className="w-10 h-10 rounded-lg bg-app-surface border border-app-border flex items-center justify-center text-app-text/40 hover:text-red-500 hover:border-red-500/30 transition-all">-1</button>
                                    <button onClick={() => handleUpdateHP(1)} title="+1 HP" className="w-10 h-10 rounded-lg bg-app-surface border border-app-border flex items-center justify-center text-app-text/40 hover:text-emerald-500 hover:border-emerald-500/30 transition-all">+1</button>
                                    <button onClick={() => handleUpdateHP(5)} title="+5 HP" className="w-12 h-12 rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text/40 hover:text-emerald-500 hover:border-emerald-500/30 transition-all">+5</button>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Stats & Notes */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {template.sections.map((section: SheetSection) => (
                            <section key={section.id} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xs font-black text-accent uppercase tracking-[0.2em]">{section.label}</h3>
                                    <div className="h-[1px] w-full bg-gradient-to-r from-accent/20 to-transparent" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {section.fields.map((field: SheetField) => {
                                        const value = character.sheetData?.[field.id] ?? field.defaultValue;
                                        return (
                                            <div key={field.id} className="p-4 bg-app-surface/40 border border-app-border/10 rounded-2xl">
                                                <span className="text-[9px] font-black text-app-text/30 uppercase tracking-widest">{field.label}</span>
                                                {field.type === 'gauge' ? (
                                                    <div className="space-y-2 mt-1">
                                                        <span className="text-lg font-black text-app-text font-mono">{String(value)}</span>
                                                        <div className="h-1 bg-app-bg/40 rounded-full overflow-hidden">
                                                            <div className="h-full bg-accent" style={{ '--gauge-width': `${(Number(value) / 100) * 100}%`, width: 'var(--gauge-width)' } as React.CSSProperties} />
                                                        </div>
                                                    </div>
                                                ) : field.type === 'checkbox' ? (
                                                    <span className={`text-sm font-black uppercase mt-1 block ${value ? 'text-emerald-500' : 'text-app-text/10'}`}>
                                                        {value ? 'OUI' : 'NON'}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-black text-app-text block mt-1 truncate">{String(value)}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-app-border/10">
                            <section className="space-y-4">
                                <h3 className="text-xs font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                                    <BookOpen size={14} /> Description
                                </h3>
                                <textarea 
                                    className="w-full bg-app-bg/40 border border-app-border/10 rounded-2xl p-4 text-sm text-app-text/80 focus:border-purple-500/40 outline-none min-h-[140px] resize-none"
                                    value={localDescription}
                                    onChange={(e) => setLocalDescription(e.target.value)}
                                    onBlur={saveNarrative}
                                    placeholder="Éditer la description publique..."
                                    title="Description du personnage"
                                />
                            </section>
 
                            <section className="space-y-4">
                                <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                    <PenTool size={14} /> Notes Perso
                                </h3>
                                <textarea 
                                    className="w-full bg-app-bg/40 border border-app-border/10 rounded-2xl p-4 text-sm text-amber-600/80 focus:border-amber-500/40 outline-none min-h-[140px] resize-none font-mono"
                                    value={localPlayerNotes}
                                    onChange={(e) => setLocalPlayerNotes(e.target.value)}
                                    onBlur={saveNarrative}
                                    placeholder="Vos notes personnelles..."
                                    title="Notes du joueur"
                                />
                            </section>
                        </div>

                        {hubOptions.showInventory && (
                            <section className="space-y-4 pt-8">
                                <h3 className="text-xs font-black text-app-text/60 uppercase tracking-widest flex items-center gap-2">
                                    <Package size={14} /> Inventaire
                                </h3>
                                <textarea 
                                    className="w-full bg-app-surface/20 border border-app-border/10 rounded-[2rem] p-6 text-sm text-app-text/60 italic font-mono focus:border-accent/40 outline-none min-h-[160px] resize-none"
                                    value={localInventory}
                                    onChange={(e) => setLocalInventory(e.target.value)}
                                    onBlur={saveNarrative}
                                    placeholder="Éditer l'inventaire..."
                                    title="Inventaire du personnage"
                                />
                            </section>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-6 flex items-center justify-between border-t border-app-border/10">
                <div className="flex items-center gap-3 opacity-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-app-text">Liaison Active</span>
                </div>
                <Layout size={12} className="text-app-text/10" />
            </div>
        </div>
    );
};

export default memo(HubCharacterSheet);
