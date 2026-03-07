import React, { useState, useEffect } from 'react';
import { useModalStore } from '../stores/useModalStore';
import { AlertCircle, HelpCircle, Edit3, UserPlus, ShieldPlus, BookOpen, Users } from 'lucide-react';
import { AddPlayerForm } from '../modules/session/components/AddPlayerForm';
import { AddCharacterForm } from '../modules/session/components/AddCharacterForm';
import CampaignForm from '../modules/session/components/CampaignForm';
import NpcDetail from '../modules/session/components/NpcDetail';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';

const ModalProvider: React.FC = () => {
    const { type, message, onConfirm, onCancel, onPromptConfirm, defaultValue, confirmLabel, cancelLabel, customVariant, closeModal } = useModalStore();
    const [promptValue, setPromptValue] = useState(defaultValue || '');

    // Synchronize promptValue when defaultValue changes (crucial for multiple prompts)
    useEffect(() => {
        if (type === 'prompt') {
            setPromptValue(defaultValue || '');
        }
    }, [defaultValue, type]);

    if (!type) return null;

    const handleConfirm = () => {
        closeModal();
        if (type === 'prompt' && onPromptConfirm) {
            onPromptConfirm(promptValue);
        } else if (onConfirm) {
            onConfirm();
        }
    };

    const handleCancel = () => {
        closeModal();
        if (onCancel) onCancel();
    };

    const getIcon = () => {
        switch (type) {
            case 'alert': return <AlertCircle className="text-gm-crimson" size={24} />;
            case 'prompt': return <Edit3 className="text-gm-violet" size={24} />;
            case 'custom':
                if (customVariant === 'player-add') return <UserPlus className="text-gm-gold" size={24} />;
                if (customVariant === 'character-add') return <ShieldPlus className="text-gm-gold" size={24} />;
                if (customVariant === 'campaign-add' || customVariant === 'campaign-edit') return <BookOpen className="text-gm-gold" size={24} />;
                if (customVariant === 'npc-detail') return <Users className="text-gm-gold" size={24} />;
                return <HelpCircle className="text-gm-cyan" size={24} />;
            default: return <HelpCircle className="text-gm-cyan" size={24} />;
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'alert': return 'Alerte';
            case 'prompt': return 'Saisie';
            case 'custom':
                if (customVariant === 'player-add') return 'Nouveau Joueur';
                if (customVariant === 'character-add') return 'Nouveau Personnage';
                if (customVariant === 'campaign-add') return 'Nouvelle Campagne';
                if (customVariant === 'campaign-edit') return 'Éditer la Campagne';
                if (customVariant === 'npc-detail') return 'Détails du PNJ';
                return 'Options';
            default: return 'Confirmation';
        }
    };

    const getBtnColor = () => {
        switch (type) {
            case 'alert': return 'bg-gm-crimson hover:bg-red-400 shadow-glow-crimson';
            case 'prompt': return 'bg-gm-violet hover:bg-violet-400 shadow-glow-violet';
            default: return 'bg-gm-cyan hover:bg-cyan-400 shadow-glow-cyan';
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl ${
                customVariant === 'npc-detail' || customVariant === 'campaign-edit' || customVariant === 'campaign-add' 
                ? 'max-w-5xl' 
                : type === 'custom' 
                ? 'max-w-md' 
                : 'max-w-sm'
            } w-full outline-none focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-obsidian-light/50 border-b border-gray-800">
                    {getIcon()}
                    <h3 className="text-lg font-bold font-display text-slate-200 uppercase tracking-tighter">
                        {getTitle()}
                    </h3>
                </div>

                {/* Body */}
                <div className="p-6 text-slate-300">
                    {message && <p className="text-sm mb-4 leading-relaxed">{message}</p>}
                    {type === 'prompt' && (
                        <input
                            type="text"
                            value={promptValue}
                            onChange={(e) => setPromptValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            autoFocus
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gm-violet/50 focus:border-gm-violet"
                        />
                    )}
                    {type === 'custom' && customVariant === 'player-add' && <AddPlayerForm />}
                    {type === 'custom' && customVariant === 'character-add' && <AddCharacterForm />}
                    {type === 'custom' && customVariant === 'campaign-add' && <CampaignForm onClose={closeModal} />}
                    {type === 'custom' && customVariant === 'campaign-edit' && (
                        <CampaignForm 
                            campaign={useSessionOSStore.getState().campaigns.find(c => c.id === (defaultValue as { campaignId: string })?.campaignId)} 
                            onClose={closeModal} 
                        />
                    )}
                    {type === 'custom' && customVariant === 'npc-detail' && (
                        <div className="max-h-[85vh] overflow-y-auto custom-scrollbar -m-6">
                            <NpcDetail embeddedId={(defaultValue as { entityId: string })?.entityId} />
                        </div>
                    )}
                </div>

                {/* Footer (only for standard modals) */}
                {type !== 'custom' && (
                    <div className="flex justify-end gap-3 px-4 py-3 bg-slate-900/50 border-t border-slate-800">
                        {(type === 'confirm' || type === 'prompt') && (
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                            >
                                {cancelLabel || 'Annuler'}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`px-6 py-2 rounded-xl text-sm font-bold text-slate-950 shadow-lg transition-all ${getBtnColor()}`}
                            autoFocus={type !== 'prompt'}
                        >
                            {confirmLabel || (type === 'prompt' ? 'Valider' : 'OK')}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ModalProvider;
