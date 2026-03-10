import React from 'react';
import { useModalStore } from '../stores/useModalStore';
import { 
    AlertCircle, HelpCircle, Edit3, UserPlus, ShieldPlus, BookOpen, Users, Play, Cast, 
    History as LucideHistory, X
} from 'lucide-react';
import { AddPlayerForm } from '../modules/session/components/AddPlayerForm';
import { AddCharacterForm } from '../modules/session/components/AddCharacterForm';
import CampaignForm from '../modules/session/components/CampaignForm';
import { SessionSelectModal } from '../modules/session/components/SessionSelectModal';
import NpcDetail from '../modules/session/components/NpcDetail';
import { FavoriteFullDossier } from '../modules/favorite/components/FavoriteFullDossier';
import { MediaBrowser } from './MediaBrowser';
import { TimelineEventForm } from '../modules/session/components/TimelineEventForm';
import { WikiEntryForm } from '../modules/session/components/WikiEntryForm';
import GlobalSettingsModal from './GlobalSettingsModal';

const ModalProvider: React.FC = () => {
    const { 
        type, message, onConfirm, onCancel, onPromptConfirm, 
        defaultValue, confirmLabel, cancelLabel, customVariant, 
        isMediaHubOpen, closeModal, closeMediaHub 
    } = useModalStore();

    if (!type && !isMediaHubOpen) return null;

    return (
        <>
            {type === 'alert' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <AlertCircle size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Attention</h3>
                        </div>
                        <p className="text-slate-300 mb-6 leading-relaxed">{message}</p>
                        <button
                            onClick={onConfirm || closeModal}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                        >
                            {confirmLabel || 'OK'}
                        </button>
                    </div>
                </div>
            )}

            {type === 'confirm' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <HelpCircle size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Confirmation</h3>
                        </div>
                        <p className="text-slate-300 mb-6 leading-relaxed">{message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel || closeModal}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                            >
                                {cancelLabel || 'Annuler'}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm?.();
                                    closeModal();
                                }}
                                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-600/20"
                            >
                                {confirmLabel || 'Confirmer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {type === 'prompt' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Edit3 size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-white">Saisie</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">{message}</p>
                        <input
                            type="text"
                            autoFocus
                            defaultValue={defaultValue as string}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onPromptConfirm?.(e.currentTarget.value);
                                    closeModal();
                                }
                            }}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                            >
                                {cancelLabel || 'Annuler'}
                            </button>
                            <button
                                onClick={(e) => {
                                    const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                                    onPromptConfirm?.(input.value);
                                    closeModal();
                                }}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                            >
                                {confirmLabel || 'Valider'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {type === 'custom' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className={`bg-slate-900 border border-slate-800/50 rounded-[2rem] overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 flex flex-col ${
                        customVariant === 'global-settings' || customVariant === 'favorite-dossier' || customVariant === 'npc-detail'
                            ? 'max-w-6xl w-full h-[90vh]' 
                            : 'max-w-2xl w-full max-h-[90vh]'
                    }`}>
                        {/* Header unifié pour les modals custom */}
                        {customVariant !== 'global-settings' && (
                            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                        {customVariant === 'player-add' && <UserPlus size={18} />}
                                        {customVariant === 'character-add' && <ShieldPlus size={18} />}
                                        {customVariant === 'campaign-add' && <BookOpen size={18} />}
                                        {customVariant === 'campaign-edit' && <Edit3 size={18} />}
                                        {customVariant === 'npc-detail' && <Users size={18} />}
                                        {customVariant === 'session-select' && <Play size={18} />}
                                        {customVariant === 'map-projection-select' && <Cast size={18} />}
                                        {customVariant === 'whiteboard-projection-select' && <Cast size={18} />}
                                        {customVariant === 'timeline-event-add' && <LucideHistory size={18} />}
                                        {customVariant === 'timeline-event-edit' && <LucideHistory size={18} />}
                                        {customVariant === 'wiki-entry-add' && <BookOpen size={18} />}
                                        {customVariant === 'wiki-entry-edit' && <BookOpen size={18} />}
                                    </div>
                                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                                        {customVariant === 'player-add' && 'Ajouter un Joueur'}
                                        {customVariant === 'character-add' && 'Nouveau Personnage'}
                                        {customVariant === 'campaign-add' && 'Nouvelle Campagne'}
                                        {customVariant === 'campaign-edit' && 'Modifier la Campagne'}
                                        {customVariant === 'npc-detail' && 'Détails du PNJ'}
                                        {customVariant === 'session-select' && 'Choisir une Session'}
                                        {customVariant === 'map-projection-select' && 'Projeter la Carte'}
                                        {customVariant === 'whiteboard-projection-select' && 'Projeter le Tableau'}
                                        {customVariant === 'timeline-event-add' && 'Ajouter un Événement'}
                                        {customVariant === 'timeline-event-edit' && 'Modifier l\'Événement'}
                                        {customVariant === 'wiki-entry-add' && 'Nouvelle Entrée Wiki'}
                                        {customVariant === 'wiki-entry-edit' && 'Modifier l\'Entrée Wiki'}
                                    </h3>
                                </div>
                                <button onClick={closeModal} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {customVariant === 'player-add' && <AddPlayerForm />}
                            {customVariant === 'character-add' && <AddCharacterForm />}
                            {customVariant === 'campaign-add' && <CampaignForm onClose={closeModal} />}
                            {customVariant === 'campaign-edit' && <CampaignForm campaign={defaultValue as any} onClose={closeModal} />}
                            {customVariant === 'session-select' && <SessionSelectModal />}
                            {customVariant === 'npc-detail' && <NpcDetail embeddedId={defaultValue as string} />}
                            {customVariant === 'favorite-dossier' && <FavoriteFullDossier />}
                            {customVariant === 'timeline-event-add' && <TimelineEventForm onClose={closeModal} />}
                            {customVariant === 'timeline-event-edit' && <TimelineEventForm event={defaultValue as any} onClose={closeModal} />}
                            {customVariant === 'wiki-entry-add' && <WikiEntryForm onClose={closeModal} />}
                            {customVariant === 'wiki-entry-edit' && <WikiEntryForm entry={defaultValue as any} onClose={closeModal} />}
                            {customVariant === 'global-settings' && <GlobalSettingsModal onClose={closeModal} />}
                        </div>
                    </div>
                </div>
            )}

            {isMediaHubOpen && (
                <MediaBrowser 
                    isOpen={true} 
                    onClose={closeMediaHub} 
                    onSelect={(id) => {
                        console.log("Media selected:", id);
                        closeMediaHub();
                    }} 
                />
            )}
        </>
    );
};

export default ModalProvider;
