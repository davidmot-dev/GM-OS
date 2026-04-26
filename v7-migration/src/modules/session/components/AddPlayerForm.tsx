import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Image as ImageIcon } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useModalStore } from '../../../stores/useModalStore';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaUrl } from '../../../hooks/useMediaUrl';

export const AddPlayerForm: React.FC = () => {
    const { t } = useTranslation(['modules']);
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
                    <div className="w-24 h-24 rounded-full bg-app-surface border-2 border-app-border overflow-hidden flex items-center justify-center transition-all group-hover:border-accent/50 group-hover:shadow-glow-accent/20">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-app-text/20 group-hover:text-accent transition-colors" />
                        )}
                        <div className="absolute inset-0 bg-app-bg/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ImageIcon size={20} className="text-white" />
                        </div>
                    </div>
                </div>
                <p className="text-[10px] uppercase font-bold text-app-text/40 tracking-widest">{t('modules:session.players.avatar_label')}</p>
            </div>

            {/* Inputs */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-app-text/40 uppercase tracking-wider pl-1">{t('modules:session.players.real_name_label')}</label>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/20 pointer-events-none" />
                        <input
                            type="text"
                            value={realName}
                            onChange={(e) => setRealName(e.target.value)}
                            placeholder={t('modules:session.players.real_name_placeholder')}
                            autoFocus
                            className="w-full bg-app-surface border border-app-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-app-text/90 focus:ring-1 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-app-text/40 uppercase tracking-wider pl-1">{t('modules:session.players.email_label')}</label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text/20 pointer-events-none" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="joueur@exemple.com"
                            className="w-full bg-app-surface border border-app-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-app-text/90 focus:ring-1 focus:ring-accent/50 focus:border-accent/50 focus:outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2">
                <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-app-border text-app-text/40 font-bold text-sm hover:bg-app-surface hover:text-app-text/80 transition-all"
                >
                    {t('modules:session.players.cancel')}
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-accent hover:brightness-110 text-app-bg font-bold text-sm shadow-glow-accent/10 transition-all active:scale-95"
                >
                    {t('modules:session.players.create_confirm')}
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
                title={t('modules:session.players.avatar_select_title')}
            />
        </form>
    );
};
