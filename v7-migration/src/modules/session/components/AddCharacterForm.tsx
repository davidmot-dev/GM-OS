import React, { useState } from 'react';
import { User, Shield, Heart, Image as ImageIcon, Gamepad2 } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';

export const AddCharacterForm: React.FC = () => {
    const { addCharacterToPlayer, selectedPlayerId, customSheetTemplates, activeCampaignId } = useSessionOSStore();
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
            campaignId: activeCampaignId, // Automatically link to active campaign
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
                    <div className="w-32 h-32 rounded-2xl bg-app-surface border-2 border-app-border overflow-hidden flex items-center justify-center transition-all group-hover:border-accent/50 group-hover:shadow-glow-accent/20">
                        {portraitUrl ? (
                            <img src={portraitUrl} alt="Portrait" className="w-full h-full object-cover object-top" />
                        ) : (
                            <User size={48} className="text-app-text/20 group-hover:text-accent transition-colors" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ImageIcon size={24} className="text-white" />
                        </div>
                    </div>
                </div>
                <p className="text-[10px] uppercase font-bold text-app-text/40 tracking-widest">Portrait de Personnage</p>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-app-text/40 uppercase tracking-wider pl-1">Nom du Personnage</label>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/40 pointer-events-none" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Aldric le Brave"
                            autoFocus
                            className="w-full bg-app-bg border border-app-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-app-text focus:ring-1 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-app-text/40 uppercase tracking-wider pl-1">Classe / Race</label>
                    <div className="relative">
                        <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/40 pointer-events-none" />
                        <input
                            type="text"
                            value={classRace}
                            onChange={(e) => setClassRace(e.target.value)}
                            placeholder="Ex: Humain Paladin"
                            className="w-full bg-app-bg border border-app-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-app-text focus:ring-1 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-app-text/40 uppercase tracking-wider pl-1">PV Max</label>
                    <div className="relative">
                        <Heart size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 pointer-events-none" />
                        <input
                            type="number"
                            value={maxHp}
                            onChange={(e) => setMaxHp(parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-full bg-app-bg border border-app-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-app-text focus:ring-1 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Template Selector */}
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-app-text/40 uppercase tracking-wider pl-1 flex items-center gap-1.5">
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
                                    ? 'bg-accent/10 border-accent/50 text-accent'
                                    : 'bg-app-bg border-app-border text-app-text/40 hover:text-app-text hover:border-app-border/60'
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
                    className="flex-1 px-4 py-3 rounded-xl border border-app-border text-app-text/40 font-bold text-sm hover:bg-app-surface hover:text-app-text/80 transition-all"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-accent hover:opacity-90 text-app-bg font-bold text-sm shadow-glow-accent/20 transition-all"
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
