import React, { useState } from 'react';
import { Heart, ChevronLeft, Package, BookOpen, PenTool, Shield, Layout } from 'lucide-react';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { useClientStore } from '../../stores/useClientStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';
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
        const newHP = Math.max(0, Math.min(character.maxHp, character.hp + delta));
        if (newHP !== character.hp) {
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
        <div className="fixed inset-0 z-[150] bg-slate-950/98 backdrop-blur-3xl p-4 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour
                </button>
                <div className="text-right">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1">{character.name}</h2>
                    <div className="flex items-center justify-end gap-2">
                        <div className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 shadow-glow-cyan/5">
                            <Shield size={10} />
                            SYSTÈME : {template.name}
                        </div>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{character.classRace || 'Agent Nexus'}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
                    
                    {/* Portrait & Vitals */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
                            {character.portraitUrl ? (
                                <img src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-800">
                                    <Shield size={80} />
                                </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950 to-transparent opacity-80" />
                        </div>

                        {hubOptions.showHP && (
                            <section className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-6 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Heart size={18} className="text-red-500" fill="currentColor" />
                                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Points de Vie</h3>
                                    </div>
                                    <span className="text-xl font-black text-white font-mono">{character.hp} / {character.maxHp}</span>
                                </div>
                                <div className="h-3 bg-black/40 rounded-full border border-white/5 p-[1px] mb-6">
                                    <div 
                                        className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-700"
                                        style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-center gap-3">
                                    <button onClick={() => handleUpdateHP(-5)} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/30 transition-all">-5</button>
                                    <button onClick={() => handleUpdateHP(-1)} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/30 transition-all">-1</button>
                                    <button onClick={() => handleUpdateHP(1)} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-green-400 hover:border-green-500/30 transition-all">+1</button>
                                    <button onClick={() => handleUpdateHP(5)} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-green-400 hover:border-green-500/30 transition-all">+5</button>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Stats & Notes */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {template.sections.map((section: SheetSection) => (
                            <section key={section.id} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em]">{section.label}</h3>
                                    <div className="h-[1px] w-full bg-gradient-to-r from-cyan-400/20 to-transparent" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {section.fields.map((field: SheetField) => {
                                        const value = character.sheetData?.[field.id] ?? field.defaultValue;
                                        return (
                                            <div key={field.id} className="p-4 bg-slate-900/40 border border-white/5 rounded-2xl">
                                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{field.label}</span>
                                                {field.type === 'gauge' ? (
                                                    <div className="space-y-2 mt-1">
                                                        <span className="text-lg font-black text-white font-mono">{value}</span>
                                                        <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                                                            <div className="h-full bg-cyan-500" style={{ width: `${(Number(value) / 100) * 100}%` }} />
                                                        </div>
                                                    </div>
                                                ) : field.type === 'checkbox' ? (
                                                    <span className={`text-sm font-black uppercase mt-1 block ${value ? 'text-emerald-400' : 'text-white/10'}`}>
                                                        {value ? 'OUI' : 'NON'}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-black text-white block mt-1 truncate">{value}</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                            <section className="space-y-4">
                                <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                    <BookOpen size={14} /> Description
                                </h3>
                                <textarea 
                                    className="w-full bg-slate-950/40 border border-white/5 rounded-2xl p-4 text-sm text-slate-400 focus:border-purple-500/40 outline-none min-h-[140px] resize-none"
                                    value={localDescription}
                                    onChange={(e) => setLocalDescription(e.target.value)}
                                    onBlur={saveNarrative}
                                    placeholder="Éditer la description publique..."
                                    title="Description du personnage"
                                />
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                    <PenTool size={14} /> Notes Perso
                                </h3>
                                <textarea 
                                    className="w-full bg-slate-950/40 border border-white/5 rounded-2xl p-4 text-sm text-amber-500/80 focus:border-amber-500/40 outline-none min-h-[140px] resize-none font-mono"
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
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Package size={14} /> Inventaire
                                </h3>
                                <textarea 
                                    className="w-full bg-slate-900/20 border border-white/5 rounded-[2rem] p-6 text-sm text-slate-400 italic font-mono focus:border-cyan-500/40 outline-none min-h-[160px] resize-none"
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

            <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/5">
                <div className="flex items-center gap-3 opacity-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Liaison Active</span>
                </div>
                <Layout size={12} className="text-white/10" />
            </div>
        </div>
    );
};

export default HubCharacterSheet;
