import React, { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { Swords, MapPin, Monitor, Heart, Shield, Wind, Zap, Lock, BookOpen, ArrowLeft, Edit2, Check, Image as ImageIcon, Users } from 'lucide-react';
import { useMapStore } from '../../map/useMapStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useImageStore } from '../../image/useImageStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { gmToast } from '../../../stores/useToastStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useModalStore } from '../../../stores/useModalStore';

interface NpcDetailProps {
    embeddedId?: string;
}

const NpcDetail: React.FC<NpcDetailProps> = ({ embeddedId }) => {
    const { entities, selectedEntityId, setSelectedEntity, updateEntity, atlasMaps } = useSessionOSStore();
    const { closeModal } = useModalStore();
    const { addToken } = useMapStore();

    const currentId = embeddedId || selectedEntityId;
    const [isEditing, setIsEditing] = useState(false);
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);

    const selectedNpc = entities.find(e => e.id === currentId);
    const resolvedAvatar = useMediaUrl(selectedNpc?.avatar);

    const handleClose = () => {
        if (embeddedId) {
            closeModal();
        } else {
            setSelectedEntity(null);
        }
    };

    if (!selectedNpc) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-950/20 text-slate-600 italic text-sm p-20">
                Sélectionnez un PNJ pour afficher ses détails
            </div>
        );
    }

    const handleSendToMap = () => {
        const { selectedAtlasMapId } = useSessionOSStore.getState();
        
        // 1. Add visual token to Map-OS
        addToken({
            name: selectedNpc.name,
            avatar: selectedNpc.avatar,
            x: 200, // Move away from corner
            y: 200,
            size: 1,
        });

        // 2. Link NPC to the active Atlas map if we have one
        if (selectedAtlasMapId && !selectedNpc.linkedMapIds.includes(selectedAtlasMapId)) {
            updateEntity(selectedNpc.id, {
                linkedMapIds: [...selectedNpc.linkedMapIds, selectedAtlasMapId]
            });
        }

        gmToast(`${selectedNpc.name} placé sur la carte`);
    };

    const handleAddToCombat = () => {
        useCombatStore.getState().addCombatant({
            name: selectedNpc.name,
            init: selectedNpc.initiative,
            hp: selectedNpc.hp,
            hpMax: selectedNpc.maxHp,
            avatar: selectedNpc.avatar,
            isPlayer: false,
            sourceEntityId: selectedNpc.id,
            statuses: []
        });
        gmToast(`${selectedNpc.name} ajouté au combat !`);
    };

    const linkedMaps = atlasMaps.filter(m => selectedNpc.linkedMapIds.includes(m.id));

    return (
        <div className="flex-1 h-full bg-slate-950/40 p-10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header / Back Button */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={handleClose}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-gm-gold hover:border-gm-gold/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    {embeddedId ? 'Fermer' : 'Retour à la Galerie'}
                </button>

                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl border transition-all font-bold text-sm uppercase tracking-widest ${
                        isEditing 
                        ? 'bg-gm-gold text-slate-950 border-gm-gold shadow-glow-gold' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-white/30'
                    }`}
                >
                    {isEditing ? <Check size={18} /> : <Edit2 size={18} />}
                    {isEditing ? 'Terminer l\'édition' : 'Editer la fiche'}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-12 flex-1 overflow-hidden">

                {/* Left Col: Cinematic Portrait */}
                <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col gap-6">
                    <div 
                        className={`aspect-[4/5] rounded-3xl overflow-hidden border-2 shadow-2xl relative group bg-slate-900 transition-all ${
                            isEditing ? 'border-gm-gold cursor-pointer hover:shadow-glow-gold' : 'border-gm-gold/10 shadow-amber-500/5'
                        }`}
                        onClick={() => isEditing && setIsMediaBrowserOpen(true)}
                    >
                        <img
                            src={resolvedAvatar || undefined}
                            alt={selectedNpc.name}
                            className="w-full h-full object-cover"
                        />
                        {isEditing ? (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ImageIcon size={48} className="text-white" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                    </div>

                    {/* Status Badge */}
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-1">Vigueur & État</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['alive', 'injured', 'dead', 'unknown'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updateEntity(selectedNpc.id, { status: s })}
                                        className={`py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                            selectedNpc.status === s 
                                            ? 'bg-white text-slate-950 border-white' 
                                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                        }`}
                                    >
                                        {s === 'alive' ? 'Vivant' : s === 'injured' ? 'Blessé' : s === 'dead' ? 'Mort' : 'Inconnu'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900/50 border border-slate-800">
                            <div className={`w-2 h-2 rounded-full ${
                                selectedNpc.status === 'alive' ? 'bg-emerald-500' : 
                                selectedNpc.status === 'injured' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                                selectedNpc.status === 'dead' ? 'bg-red-500' : 'bg-slate-500'}`} 
                            />
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-300">
                                {selectedNpc.status === 'alive' ? 'Vivant' : 
                                 selectedNpc.status === 'injured' ? 'Blessé' :
                                 selectedNpc.status === 'dead' ? 'Mort' : 'Statut Inconnu'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Right Col: Stats & Lore */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        {isEditing ? (
                            <>
                                <input 
                                    type="text"
                                    value={selectedNpc.name}
                                    onChange={(e) => updateEntity(selectedNpc.id, { name: e.target.value })}
                                    className="bg-slate-900/50 border border-gm-gold/30 rounded-xl px-4 py-2 text-2xl font-black text-white focus:outline-none focus:border-gm-gold transition-all"
                                />
                                <input 
                                    type="text"
                                    value={selectedNpc.description}
                                    onChange={(e) => updateEntity(selectedNpc.id, { description: e.target.value })}
                                    className="bg-slate-900/30 border border-slate-800 rounded-lg px-4 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-slate-600 transition-all font-medium italic"
                                />
                            </>
                        ) : (
                            <>
                                <h2 className="text-4xl font-display font-black text-gm-gold leading-tight tracking-tight mb-1">
                                    {selectedNpc.name}
                                </h2>
                                <p className="text-slate-400 text-sm font-medium italic">{selectedNpc.description}</p>
                            </>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3">
                        {isEditing ? (
                            <>
                                <div className="bg-slate-900/40 border border-gm-gold/20 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group">
                                    <Heart size={14} className="text-red-400" />
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            value={selectedNpc.hp}
                                            onChange={(e) => updateEntity(selectedNpc.id, { hp: parseInt(e.target.value) || 0 })}
                                            className="w-10 bg-transparent text-center text-white font-black text-xs border-b border-white/10 focus:outline-none"
                                        />
                                        <span className="text-slate-600">/</span>
                                        <input 
                                            type="number" 
                                            value={selectedNpc.maxHp}
                                            onChange={(e) => updateEntity(selectedNpc.id, { maxHp: parseInt(e.target.value) || 0 })}
                                            className="w-10 bg-transparent text-center text-white font-black text-xs border-b border-white/10 focus:outline-none"
                                        />
                                    </div>
                                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Health Points</span>
                                </div>
                                <div className="bg-slate-900/40 border border-gm-gold/20 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group">
                                    <Shield size={14} className="text-blue-400" />
                                    <input 
                                        type="number" 
                                        value={selectedNpc.ac}
                                        onChange={(e) => updateEntity(selectedNpc.id, { ac: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-transparent text-center text-white font-black text-xs border-b border-white/10 focus:outline-none"
                                    />
                                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Armor Class</span>
                                </div>
                                <div className="bg-slate-900/40 border border-gm-gold/20 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group">
                                    <Wind size={14} className="text-emerald-400" />
                                    <input 
                                        type="number" 
                                        value={selectedNpc.speed}
                                        onChange={(e) => updateEntity(selectedNpc.id, { speed: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-transparent text-center text-white font-black text-xs border-b border-white/10 focus:outline-none"
                                    />
                                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Movement</span>
                                </div>
                                <div className="bg-slate-900/40 border border-gm-gold/20 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group">
                                    <Zap size={14} className="text-amber-400" />
                                    <input 
                                        type="number" 
                                        value={selectedNpc.initiative}
                                        onChange={(e) => updateEntity(selectedNpc.id, { initiative: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-transparent text-center text-white font-black text-xs border-b border-white/10 focus:outline-none"
                                    />
                                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Initiative</span>
                                </div>
                            </>
                        ) : (
                            [
                                { label: 'HP', val: `${selectedNpc.hp}/${selectedNpc.maxHp}`, icon: <Heart size={14} className="text-red-400" /> },
                                { label: 'AC', val: selectedNpc.ac, icon: <Shield size={14} className="text-blue-400" /> },
                                { label: 'Speed', val: `${selectedNpc.speed} ft`, icon: <Wind size={14} className="text-emerald-400" /> },
                                { label: 'Init', val: `+${selectedNpc.initiative}`, icon: <Zap size={14} className="text-amber-400" /> },
                            ].map((stat, i) => (
                                <div key={i} className="bg-slate-900/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-gm-gold/20 transition-all">
                                    {stat.icon}
                                    <span className="text-white font-black text-xs">{stat.val}</span>
                                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider transition-colors group-hover:text-slate-500">{stat.label}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Text Areas */}
                    <div className="flex flex-col gap-4">
                        {/* Roleplaying Notes */}
                        <div className="p-4 rounded-2xl bg-slate-900/30 border border-white/5 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen size={14} className="text-slate-400" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes d'Interprétation</h4>
                            </div>
                            <textarea
                                className="w-full bg-transparent border-none text-slate-300 text-xs leading-relaxed resize-none focus:ring-0 placeholder:text-slate-700 min-h-[80px]"
                                value={selectedNpc.roleplayingNotes}
                                onChange={(e) => updateEntity(selectedNpc.id, { roleplayingNotes: e.target.value })}
                                placeholder="Comment jouer ce personnage..."
                            />
                        </div>

                        {/* Secret GM Notes */}
                        <div className="p-4 rounded-2xl bg-amber-950/5 border border-gm-gold/20 flex flex-col gap-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                                <Lock size={48} className="text-gm-gold" />
                            </div>
                            <div className="flex items-center gap-2 mb-1 relative z-10">
                                <Lock size={14} className="text-gm-gold" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gm-gold">Informations Secrètes</h4>
                            </div>
                            <textarea
                                className="w-full bg-transparent border-none text-slate-300 text-xs leading-relaxed resize-none focus:ring-0 placeholder:text-slate-700 min-h-[80px] relative z-10"
                                value={selectedNpc.gmSecretInfo}
                                onChange={(e) => updateEntity(selectedNpc.id, { gmSecretInfo: e.target.value })}
                                placeholder="Secrets, complots, intentions cachées..."
                            />
                        </div>
                    </div>

                    {/* Linked Maps */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin size={14} className="text-slate-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Présent sur les cartes</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {linkedMaps.length > 0 ? linkedMaps.map(map => (
                                <div
                                    key={map.id}
                                    className="px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-300 font-bold hover:border-gm-gold/30 transition-all cursor-pointer flex items-center gap-2 group"
                                >
                                    <MapPin size={10} className="text-slate-600 group-hover:text-gm-gold" />
                                    {map.name}
                                </div>
                            )) : (
                                <p className="text-[10px] text-slate-700 italic">Aucune carte liée</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {!isEditing && (
                <div className="mt-8 flex gap-4 pt-4 border-t border-slate-800">
                    <button
                        onClick={handleAddToCombat}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl text-xs transition-all border border-white/5 active:scale-[0.98]"
                    >
                        <Swords size={16} />
                        Envoyer au Combat
                    </button>
                    <button
                        onClick={handleSendToMap}
                        className="flex-1 flex items-center justify-center gap-2 border border-gm-gold/50 text-gm-gold hover:bg-gm-gold/10 font-bold py-3 rounded-xl text-xs transition-all active:scale-[0.98]"
                    >
                        <MapPin size={16} />
                        Placer sur la Carte
                    </button>
                    <button
                        onClick={() => useImageStore.getState().projectEntity(selectedNpc)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gm-gold hover:bg-yellow-400 text-slate-950 font-black py-3 rounded-xl text-xs transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] active:scale-[0.98]"
                    >
                        <Monitor size={16} />
                        Projeter au Hub
                    </button>
                </div>
            )}

            <MediaBrowser
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={(id) => {
                    updateEntity(selectedNpc.id, { avatar: id });
                    setIsMediaBrowserOpen(false);
                }}
                allowedTypes={['image']}
                title="Changer le Portrait"
            />
        </div>
    );
};

export default NpcDetail;
