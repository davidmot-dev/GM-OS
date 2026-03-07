import React, { useState } from 'react';
import { User, Shield, Heart, Image as ImageIcon, Gamepad2 } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';

export const AddCharacterForm: React.FC = () => {
    const { addCharacterToPlayer, selectedPlayerId, customSheetTemplates } = useSessionOSStore();
    const { closeModal } = useModalStore();

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const [name, setName] = useState('');
    const [classRace, setClassRace] = useState('');
    const [maxHp, setMaxHp] = useState(10);
    const [portraitMediaId, setPortraitMediaId] = useState('');
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
    const [templateId, setTemplateId] = useState(allTemplates[0]?.id ?? 'generic');

    const portraitUrl = useMediaUrl(portraitMediaId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !selectedPlayerId) return;

        addCharacterToPlayer(selectedPlayerId, {
            name,
            classRace,
            maxHp,
            hp: maxHp,
            portraitUrl: portraitMediaId || 'https://api.dicebear.com/9.x/adventurer/svg?seed=' + name,
            campaignId: null,
            templateId,
            sheetData: {},
        });

        closeModal();
    };

    if (!selectedPlayerId) {
        return (
            <div className="p-4 text-center text-red-400">
                Erreur : Aucun joueur sélectionné.
                <button onClick={closeModal} className="mt-4 block w-full px-4 py-2 bg-slate-800 rounded-lg">Fermer</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-1">
            {/* Portrait Section */}
            <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => setIsMediaBrowserOpen(true)}>
                    <div className="w-32 h-32 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center transition-all group-hover:border-gm-gold/50 group-hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                        {portraitUrl ? (
                            <img src={portraitUrl} alt="Portrait" className="w-full h-full object-cover object-top" />
                        ) : (
                            <User size={48} className="text-slate-600 group-hover:text-gm-gold transition-colors" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ImageIcon size={24} className="text-white" />
                        </div>
                    </div>
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Portrait de Personnage</p>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Nom du Personnage</label>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Aldric le Brave"
                            autoFocus
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-gm-gold/50 focus:border-gm-gold/50 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Classe / Race</label>
                    <div className="relative">
                        <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={classRace}
                            onChange={(e) => setClassRace(e.target.value)}
                            placeholder="Ex: Humain Paladin"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-gm-gold/50 focus:border-gm-gold/50 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">PV Max</label>
                    <div className="relative">
                        <Heart size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                        <input
                            type="number"
                            value={maxHp}
                            onChange={(e) => setMaxHp(parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-gm-gold/50 focus:border-gm-gold/50 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                    <Gamepad2 size={12} /> Système de Jeu
                </label>
                <div className="flex flex-wrap gap-2">
                    {allTemplates.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTemplateId(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                templateId === t.id
                                    ? 'bg-gm-gold/10 border-gm-gold/50 text-gm-gold'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                        >
                            {t.emoji} {t.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
                <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-800 hover:text-slate-200 transition-all"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gm-gold hover:bg-yellow-400 text-slate-950 font-bold text-sm shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all"
                >
                    Ajouter
                </button>
            </div>

            {/* Media Browser Portal-like */}
            <MediaBrowser
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={(id) => {
                    setPortraitMediaId(id);
                    setIsMediaBrowserOpen(false);
                }}
                allowedTypes={['image']}
                title="Portrait du Personnage"
            />
        </form>
    );
};
