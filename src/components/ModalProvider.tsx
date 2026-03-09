import React, { useState, useEffect } from 'react';
import { useModalStore } from '../stores/useModalStore';
import { AlertCircle, HelpCircle, Edit3, UserPlus, ShieldPlus, BookOpen, Users, Play, Cast } from 'lucide-react';
import { AddPlayerForm } from '../modules/session/components/AddPlayerForm';
import { AddCharacterForm } from '../modules/session/components/AddCharacterForm';
import CampaignForm from '../modules/session/components/CampaignForm';
import NpcDetail from '../modules/session/components/NpcDetail';
import { FavoriteFullDossier } from '../modules/favorite/components/FavoriteFullDossier';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { SessionSelectModal } from '../modules/session/components/SessionSelectModal';
import SessionNotesModal from '../modules/session/components/SessionNotesModal';
import SessionSummaryModal from '../modules/session/components/SessionSummaryModal';
import LightSceneSelector from '../modules/light/components/LightSceneSelector';
import MapProjectionModal from '../modules/map/components/MapProjectionModal';
import WhiteboardProjectionModal from '../modules/whiteboard/components/WhiteboardProjectionModal';

const ModalProvider: React.FC = () => {
    const { type, message, onConfirm, onCancel, onPromptConfirm, defaultValue, confirmLabel, cancelLabel, customVariant, closeModal } = useModalStore();
    const [promptValue, setPromptValue] = useState((defaultValue as string) || '');

    // Synchronize promptValue when defaultValue changes (crucial for multiple prompts)
    useEffect(() => {
        if (type === 'prompt') {
            setPromptValue((defaultValue as string) || '');
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
                if (customVariant === 'favorite-dossier') return <ShieldPlus className="text-gm-cyan" size={24} />;
                if (customVariant === 'session-select') return <Play className="text-gm-gold" size={24} fill="currentColor" />;
                if (customVariant === 'session-notes') return <BookOpen className="text-gm-gold" size={24} />;
                if (customVariant === 'session-summary') return <Edit3 className="text-gm-gold" size={24} />;
                if (customVariant === 'light-scene-select') return null;
                if (customVariant === 'map-projection-select') return <Cast className="text-indigo-400" size={24} />;
                if (customVariant === 'whiteboard-projection-select') return <Cast className="text-indigo-400" size={24} />;
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
                if (customVariant === 'favorite-dossier') return 'Dossier Entité';
                if (customVariant === 'session-select') return 'Lancer une Session';
                if (customVariant === 'session-notes') return 'Notes de Session';
                if (customVariant === 'session-summary') return 'Résumé de Session';
                if (customVariant === 'map-projection-select') return 'Projection de Carte';
                if (customVariant === 'whiteboard-projection-select') return 'Projection du Whiteboard';
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
                customVariant === 'favorite-dossier'
                ? 'max-w-7xl'
                : (customVariant === 'npc-detail' || customVariant === 'campaign-edit' || customVariant === 'campaign-add' || customVariant === 'session-notes' || customVariant === 'session-summary')
                ? 'max-w-5xl' 
                : customVariant === 'light-scene-select'
                ? 'max-w-fit !bg-transparent !border-none !shadow-none'
                : type === 'custom' 
                ? 'max-w-md' 
                : 'max-w-sm'
            } w-full outline-none focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                {customVariant !== 'light-scene-select' && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-obsidian-light/50 border-b border-gray-800">
                        {getIcon()}
                        <h3 className="text-lg font-bold font-display text-slate-200 uppercase tracking-tighter">
                            {getTitle()}
                        </h3>
                    </div>
                )}

                {/* Body */}
                <div className={customVariant === 'light-scene-select' ? '' : 'p-6 text-slate-300'}>
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
                    {type === 'custom' && customVariant === 'favorite-dossier' && (
                        <div className="max-h-[85vh] overflow-y-auto custom-scrollbar -m-6">
                            <FavoriteFullDossier />
                        </div>
                    )}
                    {type === 'custom' && customVariant === 'session-select' && <SessionSelectModal />}
                    {type === 'custom' && customVariant === 'session-notes' && (
                        <div className="max-h-[85vh] overflow-y-auto custom-scrollbar -m-6">
                            <SessionNotesModal />
                        </div>
                    )}
                    {type === 'custom' && customVariant === 'session-summary' && (
                        <div className="max-h-[85vh] overflow-y-auto custom-scrollbar -m-6">
                            <SessionSummaryModal />
                        </div>
                    )}
                    {type === 'custom' && customVariant === 'light-scene-select' && (
                        <LightSceneSelector data={defaultValue as { type: 'music' | 'sound'; playlistId?: string; padIndex?: number; padId?: string; }} />
                    )}
                    {type === 'custom' && customVariant === 'map-projection-select' && <MapProjectionModal />}
                    {type === 'custom' && customVariant === 'whiteboard-projection-select' && <WhiteboardProjectionModal />}
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
