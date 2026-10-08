import React, { useState } from 'react';
import { useModalStore } from '../stores/useModalStore';
import { useFermetureParEchap } from '../hooks/useFermetureParEchap';
import { useTranslation } from 'react-i18next';
import {
    AlertCircle, HelpCircle, Edit3, UserPlus, ShieldPlus, BookOpen, Users, Play, Cast,
    History as LucideHistory, X, Lightbulb, Zap, Settings2, Sparkles, Package, MessageSquare,
    Keyboard, Swords, ScrollText, Music2, Shapes } from 'lucide-react';
import type { Campaign, WikiEntry, TimelineEvent, SessionModuleSnapshot } from '../modules/session/useSessionOSStore';
import { AddPlayerForm } from '../modules/session/components/AddPlayerForm';
import { AddCharacterForm } from '../modules/session/components/AddCharacterForm';
import CampaignForm from '../modules/session/components/CampaignForm';
import { SessionSelectModal } from '../modules/session/components/SessionSelectModal';
import NpcDetail from '../modules/session/components/NpcDetail';
import { FavoriteFullDossier } from '../modules/favorite/components/FavoriteFullDossier';
import { TimelineEventForm } from '../modules/session/components/TimelineEventForm';
import { WikiEntryForm } from '../modules/session/components/WikiEntryForm';
import AtelierDesAdversaires from '../modules/combat/components/AtelierDesAdversaires';
import FicheDuCombattant from '../modules/combat/components/FicheDuCombattant';
import GlobalSettingsModal from './GlobalSettingsModal';
import LightSceneSelector from '../modules/light/components/LightSceneSelector';
import MapProjectionModal from '../modules/map/components/MapProjectionModal';
import WhiteboardProjectionModal from '../modules/whiteboard/components/WhiteboardProjectionModal';
import SessionNotesModal from '../modules/session/components/SessionNotesModal';
import SessionSummaryModal from '../modules/session/components/SessionSummaryModal';
import SessionFeedbackModal from '../modules/session/components/SessionFeedbackModal';
import SnapshotVisualizerModal from '../modules/session/components/SnapshotVisualizerModal';
import DamageCalculator from '../modules/combat/components/DamageCalculator';
import { EditeurDePastille } from '../modules/music/components/EditeurDePastille';
import DangerZonePresetEditor from '../modules/map/components/DangerZonePresetEditor';
import NarrativeModal from '../modules/map/components/NarrativeModal';
// Secondary imports consolidated above
import LootOS from '../modules/session/components/LootOS';
import { NetworkQRCodeModal } from './NetworkQRCodeModal';
import VitrineDuSocle from './socle/VitrineDuSocle';
import { CadreDeSurcouche, BoutonPrincipal, BoutonSecondaire } from './socle/CadreDeSurcouche';

// Chaque ouverture porte sa saisie ; une nouvelle valeur initiale la remonte.
const SaisieDuPrompt: React.FC = () => {
    const { message, defaultValue, onPromptConfirm, confirmLabel, cancelLabel, closeModal } = useModalStore();
    const { t } = useTranslation(['common']);
    const [inputValue, setInputValue] = useState(() => typeof defaultValue === 'string' ? defaultValue : '');
    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[150] flex items-center justify-center bg-app-bg/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <CadreDeSurcouche
                titre={t('common:prompt_title')}
                icone={<Edit3 size={18} />}
                onFermer={closeModal}
                libelleFermer={t('common:close_window')}
                pied={<>
                    <BoutonSecondaire onClick={closeModal}>{cancelLabel || t('common:cancel')}</BoutonSecondaire>
                    <BoutonPrincipal onClick={() => { onPromptConfirm?.(inputValue); closeModal(); }}>{confirmLabel || t('common:validate')}</BoutonPrincipal>
                </>}
            >
                {/* Le libellé au-dessus du champ : c'est la question posée. */}
                <label className="flex flex-col gap-2 px-5 py-4">
                    <span className="text-sm font-bold text-app-text">{message}</span>
                    <input
                        type="text"
                        autoFocus
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-2.5 font-medium text-app-text outline-none transition-all focus:border-accent"
                        title={t('common:prompt_title')}
                        placeholder={t('common:placeholder_input')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onPromptConfirm?.(inputValue);
                                closeModal();
                            }
                        }}
                    />
                </label>
            </CadreDeSurcouche>
        </div>
    );
};

const ModalProvider: React.FC = () => {
    const {
        type, message, onConfirm, onCancel,
        defaultValue, confirmLabel, cancelLabel, customVariant,
        isNetworkModalOpen, closeModal
    } = useModalStore();

    const { t } = useTranslation(['common']);
    /*
      **Échap ferme la boîte — les quatre types, d'un seul endroit.**

      ⛔ Aucun ne l'écoutait. Ça se voyait sur les Paramètres, signalés par
      David le 2026-09-12 (« Échap ne ferme pas les Paramètres, et le modal
      avale alors tous les clics ») — mais les Paramètres ne sont qu'**une
      variante `custom` sur vingt-neuf**, et `alert`, `confirm` et `prompt`
      étaient logées à la même enseigne. *Un défaut signalé sur un écran en
      cachait une trentaine.*

      ⛔ **Échap prend toujours la sortie qui n'exécute rien.** Sur un
      `confirm` c'est la voie d'annulation, jamais la confirmation : une touche
      frappée par réflexe ne doit pas supprimer une campagne. Sur un `prompt`,
      la saisie est abandonnée, pas validée.

      ⚠️ L'ordre `closeModal()` **puis** le rappel est celui des boutons, et il
      n'est pas indifférent : l'`onCancel` du choix de source de `PlaylistManager`
      ouvre une autre boîte, que fermer après effacerait aussitôt ouverte. La
      raison complète est en tête du bouton d'annulation, plus bas.
    */
    const fermerParEchap = () => {
        if (type === 'alert') { closeModal(); onConfirm?.(); return; }
        if (type === 'confirm') { closeModal(); onCancel?.(); return; }
        closeModal();
    };
    useFermetureParEchap(!!type, fermerParEchap, `boîte ${type ?? ''}`.trim());

    if (!type && !isNetworkModalOpen) return null;

    return (
        <>
            {type === 'alert' && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-[150] flex items-center justify-center bg-app-bg/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    {/*
                      Même piège que celui du bouton d'annulation ci-dessous,
                      et corrigé en même temps : aucun appelant ne passe
                      aujourd'hui d'`onConfirm` à `gmAlert`, donc personne ne
                      l'a jamais rencontré. Le premier qui le ferait
                      obtiendrait une alerte qu'on ne peut plus fermer.
                    */}
                    <CadreDeSurcouche
                        titre={t('common:attention')}
                        icone={<AlertCircle size={18} />}
                        tonIcone="info"
                        onFermer={() => { closeModal(); onConfirm?.(); }}
                        libelleFermer={t('common:close_window')}
                        pied={<BoutonPrincipal autoFocus onClick={() => { closeModal(); onConfirm?.(); }}>{confirmLabel || t('common:ok')}</BoutonPrincipal>}
                    >
                        <p className="px-5 py-4 leading-relaxed text-app-text">{message}</p>
                    </CadreDeSurcouche>
                </div>
            )}

            {type === 'confirm' && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-[150] flex items-center justify-center bg-app-bg/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    {/*
                      **`onCancel || closeModal` : ou l'un, ou l'autre — jamais les deux.**

                      Un appelant qui fournissait un `onCancel` obtenait
                      un bouton d'annulation qui n'annulait rien : la
                      boîte restait à l'écran pour toujours. Signalé par
                      David le 2026-08-30 sur la suppression d'une
                      atmosphère de Music-OS, dont l'`onCancel` est un
                      `() => {}` — le cas le plus pur : ne rien faire, et
                      ne pas fermer non plus.

                      **On ferme AVANT d'exécuter le rappel**, et l'ordre
                      n'est pas indifférent : l'`onCancel` du choix de
                      source dans `PlaylistManager` ouvre une autre boîte.
                      Fermer après l'aurait effacée aussitôt ouverte.

                      ⭐ **« Annuler » a le focus** (maquette retenue) : Entrée
                      frappée par réflexe ne confirme rien.
                    */}
                    <CadreDeSurcouche
                        titre={t('common:confirmation')}
                        icone={<HelpCircle size={18} />}
                        tonIcone="alerte"
                        onFermer={() => { closeModal(); onCancel?.(); }}
                        libelleFermer={t('common:close_window')}
                        pied={<>
                            <BoutonSecondaire autoFocus onClick={() => { closeModal(); onCancel?.(); }}>{cancelLabel || t('common:cancel')}</BoutonSecondaire>
                            <BoutonPrincipal ton="alerte" onClick={() => { onConfirm?.(); closeModal(); }}>{confirmLabel || t('common:confirm')}</BoutonPrincipal>
                        </>}
                    >
                        <p className="px-5 py-4 leading-relaxed text-app-text">{message}</p>
                    </CadreDeSurcouche>
                </div>
            )}

            {type === 'prompt' && <SaisieDuPrompt key={typeof defaultValue === 'string' ? defaultValue : ''} />}

            {type === 'custom' && (
                <div role="dialog" aria-modal="true" className={`fixed inset-0 z-[150] flex items-center justify-center bg-app-bg/80 backdrop-blur-md animate-in fade-in duration-300 ${
                    customVariant === 'campaign-add' || customVariant === 'campaign-edit' ? 'p-0' : 'p-4'
                }`}>
                    <div data-cadre-de-surcouche="" className={`bg-app-surface border border-app-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col ${
                        customVariant === 'campaign-add' || customVariant === 'campaign-edit'
                            ? 'w-full h-full rounded-none'
                            : customVariant === 'global-settings' || customVariant === 'favorite-dossier' || customVariant === 'npc-detail' || customVariant === 'session-summary' || customVariant === 'session-notes' || customVariant === 'session-feedback' || customVariant === 'danger-preset-editor' || customVariant === 'loot-os' || customVariant === 'aide-du-meneur' || customVariant === 'vitrine-du-socle'
                                ? 'max-w-6xl w-full h-[90vh] rounded-xl'
                                : 'max-w-2xl w-full max-h-[90vh] rounded-xl'
                    }`}>
                        {/* Header unifié pour les modals custom */}
                        {customVariant !== 'global-settings' && (
                            <div className="px-5 py-3 border-b border-app-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg border border-accent/40 bg-accent/10 flex items-center justify-center text-accent">
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
                                        {customVariant === 'music-pad-edit' && <Music2 size={18} />}
                                        {customVariant === 'narrative-display' && <Sparkles size={18} />}
                                        {customVariant === 'loot-os' && <Package size={18} />}
                                        {customVariant === 'aide-du-meneur' && <Keyboard size={18} />}
                                        {customVariant === 'atelier-adversaires' && <Swords size={18} />}
                                        {customVariant === 'fiche-combattant' && <ScrollText size={18} />}
                                        {customVariant === 'vitrine-du-socle' && <Shapes size={18} />}
                                    </div>
                                    <h3 className="font-display font-bold text-app-text uppercase tracking-wider text-sm">
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
                                        {/* Littéral, comme le reste de l'écran d'aide : il n'a qu'un lecteur. */}
                                        {customVariant === 'aide-du-meneur' && 'Écran du Meneur'}
                                        {/* Littéral, comme au-dessus : cet écran n'a qu'un lecteur. */}
                                        {customVariant === 'atelier-adversaires' && 'Atelier des adversaires'}
                                        {customVariant === 'fiche-combattant' && 'Fiche du combattant'}
                                        {/* Littéral comme ses voisins : cet écran n'a qu'un lecteur. */}
                                        {customVariant === 'music-pad-edit' && 'Pastille'}
                                        {/* Littéral : un écran de refonte, pour un seul lecteur. */}
                                        {customVariant === 'vitrine-du-socle' && 'Vitrine du socle'}
                                    </h3>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-app-muted transition-colors hover:bg-app-text/5 hover:text-app-text"
                                    title={t('common:close_window')}
                                    aria-label={t('common:close_window')}
                                >
                                    <span className="rounded border border-app-border px-1.5 py-0.5 font-mono text-ui-9 font-bold">Échap</span>
                                    <X size={18} />
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
                            {customVariant === 'vitrine-du-socle' && <VitrineDuSocle />}
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
                            {customVariant === 'music-pad-edit' && (
                                <EditeurDePastille
                                    playlistId={(defaultValue as { playlistId: string; padIndex: number }).playlistId}
                                    padIndex={(defaultValue as { playlistId: string; padIndex: number }).padIndex}
                                    onClose={closeModal}
                                />
                            )}
                            {customVariant === 'narrative-display' && <NarrativeModal />}
                            {customVariant === 'loot-os' && <LootOS />}
                            {customVariant === 'atelier-adversaires' && (
                                <AtelierDesAdversaires
                                    onClose={closeModal}
                                    jeuDemande={(defaultValue as { jeuId?: string } | undefined)?.jeuId}
                                />
                            )}
                            {customVariant === 'fiche-combattant' && <FicheDuCombattant />}
                            {customVariant === 'global-settings' && <GlobalSettingsModal onClose={closeModal} />}
                        </div>
                    </div>
                </div>
            )}

            {/*
              **Le Media Hub était monté ici ET dans `App.tsx`, sur le même
              drapeau `isMediaHubOpen`.** Ouvrir le Hub depuis la barre latérale
              empilait donc deux navigateurs plein écran identiques, chacun avec
              son abonnement au magasin et son champ d'import. Rien ne le
              laissait voir — ils sont superposés au pixel près, et fermer l'un
              baisse le drapeau des deux.

              C'est celui d'`App.tsx` qui reste : il est rendu sans attendre le
              morceau chargé à la demande de ce fichier, donc le Hub s'ouvre
              tout de suite. Trouvé le 2026-09-04.
            */}

            <NetworkQRCodeModal />
        </>
    );
};

export default ModalProvider;
