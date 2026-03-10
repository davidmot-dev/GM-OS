import React, { useState } from 'react';
import { Shield, Heart, Image as ImageIcon, Wind, Zap, Lock, BookOpen, Skull, Users, ArrowLeft } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import type { Entity } from '../useSessionOSStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { gmToast } from '../../../stores/useToastStore';

const AddEntityForm: React.FC = () => {
    const { addEntity, setIsAddingEntity, activeCampaignId } = useSessionOSStore();

    const [name, setName] = useState('');
    const [type, setType] = useState<Entity['type']>('npc');
    const [role, setRole] = useState<Entity['role']>('neutral');
    const [description, setDescription] = useState('');
    const [maxHp, setMaxHp] = useState(10);
    const [ac, setAc] = useState(10);
    const [speed, setSpeed] = useState(30);
    const [initiative, setInitiative] = useState(0);
    const [avatarMediaId, setAvatarMediaId] = useState('');
    const [roleplayingNotes, setRoleplayingNotes] = useState('');
    const [gmSecretInfo, setGmSecretInfo] = useState('');
    
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
    const avatarUrl = useMediaUrl(avatarMediaId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !activeCampaignId) return;

        addEntity({
            name,
            type,
            role,
            status: 'alive',
            avatar: avatarMediaId || 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + name,
            hp: maxHp,
            maxHp,
            ac,
            speed,
            initiative,
            description,
            roleplayingNotes,
            gmSecretInfo,
            linkedMapIds: [],
            campaignId: activeCampaignId,
        });

        gmToast(`${name} créé avec succès !`);
        setIsAddingEntity(false);
    };

    return (
        <div className="flex-1 h-full bg-app-bg/40 p-10 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header / Back Button */}
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => setIsAddingEntity(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border text-app-text/40 hover:text-accent hover:border-accent/50 rounded-xl transition-all font-bold text-sm uppercase tracking-widest group"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    Annuler
                </button>
                <h2 className="text-2xl font-black text-white tracking-widest uppercase italic">Nouveau Personnage</h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-12 flex-1 overflow-hidden">
                {/* Left Col: Media Selection */}
                <div className="w-full md:w-[400px] flex-shrink-0 flex flex-col gap-6">
                    <div 
                        className="aspect-[4/5] rounded-3xl overflow-hidden border-2 border-accent/10 shadow-2xl relative group bg-app-surface cursor-pointer"
                        onClick={() => setIsMediaBrowserOpen(true)}
                    >
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Portrait" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-app-text/10 group-hover:text-accent transition-colors">
                                <ImageIcon size={64} className="mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Choisir un portrait</p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ImageIcon size={32} className="text-white" />
                        </div>
                    </div>

                    {/* Type & Role Selector */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-app-text/40 pl-1 flex items-center gap-2">
                                <Users size={12} /> Type d'Entité
                            </p>
                            <div className="flex gap-2">
                                {(['pc', 'npc', 'monster'] as const).map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                            type === t ? 'bg-accent text-white border-accent' : 'bg-app-surface border-app-border text-app-text/40 hover:border-app-border/60'
                                        }`}
                                    >
                                        {t === 'pc' ? 'Joueur' : t === 'npc' ? 'PNJ' : 'Monstre'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-app-text/40 pl-1 flex items-center gap-2">
                                <Skull size={12} /> Alignement / Rôle
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {(['ally', 'neutral', 'hostile', 'boss'] as const).map(r => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r)}
                                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                            role === r ? 'bg-white text-app-bg border-white' : 'bg-app-surface border-app-border text-app-text/40 hover:border-app-border/60'
                                        }`}
                                    >
                                        {r === 'ally' ? 'Allié' : r === 'neutral' ? 'Neutre' : r === 'hostile' ? 'Hostile' : 'Boss'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Fields */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-accent pl-1">Nom complet / Titre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Baron Varick l'Imposteur"
                            className="w-full bg-app-surface/50 border border-app-border rounded-2xl px-6 py-4 text-xl font-bold text-white focus:ring-1 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all placeholder:text-app-text/10"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-app-text/40 pl-1 italic">Sous-titre / Description courte</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Humain Paladin de l'Ordre d'Or"
                            className="w-full bg-app-surface/30 border border-app-border rounded-xl px-4 py-2 text-sm text-app-text/60 focus:ring-1 focus:ring-accent/50 focus:outline-none placeholder:text-app-text/10"
                        />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'HP Max', val: maxHp, set: setMaxHp, icon: <Heart size={14} className="text-red-400" /> },
                            { label: 'AC', val: ac, set: setAc, icon: <Shield size={14} className="text-blue-400" /> },
                            { label: 'Speed', val: speed, set: setSpeed, icon: <Wind size={14} className="text-emerald-400" /> },
                            { label: 'Init', val: initiative, set: setInitiative, icon: <Zap size={14} className="text-amber-400" /> },
                        ].map((stat, i) => (
                            <div key={i} className="bg-app-surface/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1 group hover:border-accent/20 transition-all">
                                {stat.icon}
                                <input
                                    type="number"
                                    value={stat.val}
                                    onChange={(e) => stat.set(parseInt(e.target.value) || 0)}
                                    className="w-full bg-transparent border-none text-center text-white font-black text-sm focus:ring-0"
                                />
                                <span className="text-[9px] uppercase font-bold text-app-text/20 tracking-wider">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Roleplaying Notes */}
                        <div className="p-4 rounded-2xl bg-app-surface/30 border border-white/5 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen size={14} className="text-app-text/40" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Notes d'Interprétation</h4>
                            </div>
                            <textarea
                                className="w-full bg-transparent border-none text-app-text/60 text-xs leading-relaxed resize-none focus:ring-0 placeholder:text-app-text/10 min-h-[80px]"
                                value={roleplayingNotes}
                                onChange={(e) => setRoleplayingNotes(e.target.value)}
                                placeholder="Comment jouer ce personnage, sa voix, ses tics..."
                            />
                        </div>

                        {/* Secret GM Notes */}
                        <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex flex-col gap-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                                <Lock size={48} className="text-accent" />
                            </div>
                            <div className="flex items-center gap-2 mb-1 relative z-10">
                                <Lock size={14} className="text-accent" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Informations Secrètes</h4>
                            </div>
                            <textarea
                                className="w-full bg-transparent border-none text-app-text/60 text-xs leading-relaxed resize-none focus:ring-0 placeholder:text-app-text/10 min-h-[80px] relative z-10"
                                value={gmSecretInfo}
                                onChange={(e) => setGmSecretInfo(e.target.value)}
                                placeholder="Ses vraies intentions, ses secrets..."
                            />
                        </div>
                    </div>
                </div>
            </form>

            {/* Sticky Actions */}
            <div className="mt-8 pt-6 border-t border-app-border flex justify-end gap-4">
                 <button
                    onClick={() => setIsAddingEntity(false)}
                    className="px-8 py-3 rounded-xl bg-app-surface hover:bg-app-surface/80 text-app-text/60 font-bold text-xs transition-all border border-white/5"
                >
                    Annuler
                </button>
                <button
                    onClick={handleSubmit}
                    className="px-12 py-3 rounded-xl bg-accent hover:bg-accent/80 text-white font-black text-xs transition-all shadow-glow-accent"
                >
                    Créer le Personnage
                </button>
            </div>

            <MediaBrowser
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={(id) => {
                    setAvatarMediaId(id);
                    setIsMediaBrowserOpen(false);
                }}
                allowedTypes={['image']}
                title="Portrait du Personnage"
            />
        </div>
    );
};

export default AddEntityForm;
