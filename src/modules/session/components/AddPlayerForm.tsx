import React, { useState } from 'react';
import { User, Mail, Image as ImageIcon } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';

export const AddPlayerForm: React.FC = () => {
    const { addPlayer } = useSessionOSStore();
    const { closeModal } = useModalStore();

    const [realName, setRealName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarMediaId, setAvatarMediaId] = useState('');
    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);

    const avatarUrl = useMediaUrl(avatarMediaId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!realName.trim()) return;

        addPlayer({
            realName,
            email: email || undefined,
            avatarUrl: avatarMediaId || `https://api.dicebear.com/9.x/adventurer/svg?seed=${realName}&backgroundColor=b6e3f4`,
            isOnline: false,
            characters: []
        });

        closeModal();
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-1">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3">
                <div className="relative group cursor-pointer" onClick={() => setIsMediaBrowserOpen(true)}>
                    <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden flex items-center justify-center transition-all group-hover:border-gm-gold/50 group-hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-slate-600 group-hover:text-gm-gold transition-colors" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ImageIcon size={20} className="text-white" />
                        </div>
                    </div>
                </div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Avatar du Joueur</p>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Nom du Joueur</label>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={realName}
                            onChange={(e) => setRealName(e.target.value)}
                            placeholder="Ex: Thomas D."
                            autoFocus
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-gm-gold/50 focus:border-gm-gold/50 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Email (Optionnel)</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="joueur@exemple.com"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-gm-gold/50 focus:border-gm-gold/50 focus:outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
                <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-800 hover:text-slate-200 transition-all"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gm-gold hover:bg-yellow-400 text-slate-950 font-bold text-sm shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all"
                >
                    Créer le Joueur
                </button>
            </div>

            {/* Media Browser Portal-like */}
            <MediaBrowser
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={(id) => {
                    setAvatarMediaId(id);
                    setIsMediaBrowserOpen(false);
                }}
                allowedTypes={['image']}
                title="Sélectionner l'Avatar"
            />
        </form>
    );
};
