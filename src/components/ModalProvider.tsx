import React, { useState, useEffect } from 'react';
import { useModalStore } from '../stores/useModalStore';
import { useTranslation } from 'react-i18next';
import { 
    AlertCircle, HelpCircle, Edit3, UserPlus, ShieldPlus, BookOpen, Users, Play, Cast, 
    History as LucideHistory, X, Lightbulb, Zap, Settings2, Sparkles, Package, MessageSquare
} from 'lucide-react';
import type { Campaign, WikiEntry, TimelineEvent, SessionModuleSnapshot } from '../modules/session/useSessionOSStore';
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
import LightSceneSelector from '../modules/light/components/LightSceneSelector';
import MapProjectionModal from '../modules/map/components/MapProjectionModal';
import WhiteboardProjectionModal from '../modules/whiteboard/components/WhiteboardProjectionModal';
import SessionNotesModal from '../modules/session/components/SessionNotesModal';
import SessionSummaryModal from '../modules/session/components/SessionSummaryModal';
import SessionFeedbackModal from '../modules/session/components/SessionFeedbackModal';
import SnapshotVisualizerModal from '../modules/session/components/SnapshotVisualizerModal';
import DamageCalculator from '../modules/combat/components/DamageCalculator';
import DangerZonePresetEditor from '../modules/map/components/DangerZonePresetEditor';
import NarrativeModal from '../modules/map/components/NarrativeModal';
// Secondary imports consolidated above
import LootOS from '../modules/session/components/LootOS';
import { NetworkQRCodeModal } from './NetworkQRCodeModal';

const ModalProvider: React.FC = () => {
    const { 
        type, message, onConfirm, onCancel, onPromptConfirm, 
        defaultValue, confirmLabel, cancelLabel, customVariant, 
        isMediaHubOpen, isNetworkModalOpen, closeModal, closeMediaHub 
    } = useModalStore();

    const { t } = useTranslation(['common']);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (type === 'prompt' && defaultValue !== undefined) {
            setInputValue(defaultValue as string);
        }
    }, [type, defaultValue]);

    if (!type && !isMediaHubOpen && !isNetworkModalOpen) return null;

    return (
        <>
            {type === 'alert' && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <AlertCircle size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-white">{t('common:attention')}</h3>
                        </div>
                        <p className="text-slate-300 mb-6 leading-relaxed">{message}</p>
                        {/*
                          Même piège que celui du bouton d'annulation ci-dessous,
                          et corrigé en même temps : aucun appelant ne passe
                          aujourd'hui d'`onConfirm` à `gmAlert`, donc personne ne
                          l'a jamais rencontré. Le premier qui le ferait
                          obtiendrait une alerte qu'on ne peut plus fermer.
                        */}
                        <button
                            onClick={() => { closeModal(); onConfirm?.(); }}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                        >
                            {confirmLabel || t('common:ok')}
                        </button>
                    </div>
                </div>
            )}

            {type === 'confirm' && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                <HelpCircle size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-white">{t('common:confirmation')}</h3>
                        </div>
                        <p className="text-slate-300 mb-6 leading-relaxed">{message}</p>
                        <div className="flex gap-3">
                            {/*
                              **`onCancel || closeModal` : ou l'un, ou l'autre — jamais les deux.**

                              Un appelant qui fournissait un `onCancel` obtenait
                              un bouton d'annulation qui n'annulait rien : la
                              boîte restait à l'écran pour toujours. Signalé par
                              David le 2026-08-30 sur la suppression d'une
                              atmosphère de Music-OS, dont l'`onCancel` est un
                              `() => {}` — le cas le plus pur : ne rien faire, et
                              ne pas fermer non plus.

                              Le second appelant touché était le garde-fou de
                              reprise de séance : « Reprendre et abandonner »
                              abandonnait bien les requêtes du Cortex, puis
                              laissait la boîte plantée devant le meneur.

                              **On ferme AVANT d'exécuter le rappel**, et l'ordre
                              n'est pas indifférent : l'`onCancel` du choix de
                              source dans `PlaylistManager` ouvre une autre boîte.
                              Fermer après l'aurait effacée aussitôt ouverte.
                            */}
                            <button
                                onClick={() => { closeModal(); onCancel?.(); }}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                            >
                                {cancelLabel || t('common:cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm?.();
                                    closeModal();
                                }}
                                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-amber-600/20"
                            >
                                {confirmLabel || t('common:confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {type === 'prompt' && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <Edit3 size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-white">{t('common:prompt_title')}</h3>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">{message}</p>
                        <input
                            type="text"
                            autoFocus
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                            title={t('common:prompt_title')}
                            placeholder={t('common:placeholder_input')}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onPromptConfirm?.(inputValue);
                                    closeModal();
                                }
                            }}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
                            >
                                {cancelLabel || t('common:cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    onPromptConfirm?.(inputValue);
                                    closeModal();
                                }}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                            >
                                {confirmLabel || t('common:validate')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {type === 'custom' && (
                <div role="dialog" aria-modal="true" className={`fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 ${
                    customVariant === 'campaign-add' || customVariant === 'campaign-edit' ? 'p-0' : 'p-4'
                }`}>
                    <div className={`bg-slate-900 border border-slate-800/50 overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 flex flex-col ${
                        customVariant === 'campaign-add' || customVariant === 'campaign-edit'
                            ? 'w-full h-full rounded-none'
                            : customVariant === 'global-settings' || customVariant === 'favorite-dossier' || customVariant === 'npc-detail' || customVariant === 'session-summary' || customVariant === 'session-notes' || customVariant === 'session-feedback' || customVariant === 'danger-preset-editor' || customVariant === 'loot-os'
                                ? 'max-w-6xl w-full h-[90vh] rounded-[2rem]' 
                                : 'max-w-2xl w-full max-h-[90vh] rounded-[2rem]'
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
                                        {customVariant === 'light-scene-select' && <Lightbulb size={18} />}
                                        {customVariant === 'session-notes' && <Edit3 size={18} />}
                                        {customVariant === 'session-summary' && <BookOpen size={18} />}
                                        {customVariant === 'session-feedback' && <MessageSquare size={18} />}
                                        {customVariant === 'snapshot-viewer' && <Cast size={18} />}
                                        {customVariant === 'damage-calc' && <Zap size={18} />}
                                        {customVariant === 'danger-preset-editor' && <Settings2 size={18} />}
                                        {customVariant === 'narrative-display' && <Sparkles size={18} />}
                                        {customVariant === 'loot-os' && <Package size={18} />}
                                    </div>
                                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">
                                        {customVariant === 'player-add' && t('common:modals.player_add')}
                                        {customVariant === 'character-add' && t('common:modals.character_add')}
                                        {customVariant === 'campaign-add' && t('common:modals.campaign_add')}
                                        {customVariant === 'campaign-edit' && t('common:modals.campaign_edit')}
                                        {customVariant === 'npc-detail' && t('common:modals.npc_detail')}
                                        {customVariant === 'session-select' && t('common:modals.session_select')}
                                        {customVariant === 'map-projection-select' && t('common:modals.map_projection')}
                                        {customVariant === 'whiteboard-projection-select' && t('common:modals.whiteboard_projection')}
                                        {customVariant === 'timeline-event-add' && t('common:modals.timeline_event_add')}
                                        {customVariant === 'timeline-event-edit' && t('common:modals.timeline_event_edit')}
                                        {customVariant === 'wiki-entry-add' && t('common:modals.wiki_entry_add')}
                                        {customVariant === 'wiki-entry-edit' && t('common:modals.wiki_entry_edit')}
                                        {customVariant === 'light-scene-select' && t('common:modals.light_scene_select')}
                                        {customVariant === 'session-notes' && t('common:modals.session_notes')}
                                        {customVariant === 'session-summary' && t('common:modals.session_summary')}
                                        {customVariant === 'session-feedback' && t('common:modals.session_feedback')}
                                        {customVariant === 'snapshot-viewer' && t('common:modals.snapshot_viewer')}
                                        {customVariant === 'damage-calc' && t('common:modals.damage_calc')}
                                        {customVariant === 'danger-preset-editor' && t('common:modals.danger_preset_editor')}
                                        {customVariant === 'narrative-display' && t('common:modals.narrative_oracle')}
                                        {customVariant === 'loot-os' && t('common:modals.loot_os')}
                                    </h3>
                                </div>
                                <button 
                                    onClick={closeModal} 
                                    className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all"
                                    title={t('common:close_window')}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {customVariant === 'player-add' && <AddPlayerForm />}
                            {customVariant === 'character-add' && <AddCharacterForm />}
                            {customVariant === 'campaign-add' && <CampaignForm isNew onClose={closeModal} />}
                            {customVariant === 'campaign-edit' && <CampaignForm campaign={defaultValue as Campaign} onClose={closeModal} />}
                            {customVariant === 'session-select' && <SessionSelectModal />}
                            {customVariant === 'npc-detail' && <NpcDetail embeddedId={defaultValue as string} />}
                            {customVariant === 'favorite-dossier' && <FavoriteFullDossier />}
                            {customVariant === 'timeline-event-add' && <TimelineEventForm onClose={closeModal} />}
                            {customVariant === 'timeline-event-edit' && <TimelineEventForm event={defaultValue as TimelineEvent} onClose={closeModal} />}
                            {customVariant === 'wiki-entry-add' && <WikiEntryForm onClose={closeModal} />}
                            {customVariant === 'wiki-entry-edit' && <WikiEntryForm entry={defaultValue as WikiEntry} onClose={closeModal} />}
                            {customVariant === 'light-scene-select' && <LightSceneSelector data={defaultValue as { type: 'music' | 'sound' | 'ambient'; playlistId?: string; padIndex?: number; padId?: string; trackIndex?: number }} />}
                            {customVariant === 'map-projection-select' && <MapProjectionModal />}
                            {customVariant === 'whiteboard-projection-select' && <WhiteboardProjectionModal />}
                            {customVariant === 'session-notes' && <SessionNotesModal />}
                            {customVariant === 'session-summary' && <SessionSummaryModal />}
                            {customVariant === 'session-feedback' && <SessionFeedbackModal />}
                            {customVariant === 'snapshot-viewer' && (
                                <SnapshotVisualizerModal 
                                    isOpen={true} 
                                    onClose={closeModal} 
                                    snapshot={(defaultValue as { snapshot: SessionModuleSnapshot; sessionName: string })?.snapshot} 
                                    sessionName={(defaultValue as { snapshot: SessionModuleSnapshot; sessionName: string })?.sessionName || 'Session'} 
                                />
                            )}
                            {customVariant === 'damage-calc' && <DamageCalculator />}
                            {customVariant === 'danger-preset-editor' && <DangerZonePresetEditor />}
                            {customVariant === 'narrative-display' && <NarrativeModal />}
                            {customVariant === 'loot-os' && <LootOS />}
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

            <NetworkQRCodeModal />
        </>
    );
};

export default ModalProvider;
