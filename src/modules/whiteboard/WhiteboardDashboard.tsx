import React, { useRef } from 'react';
import { DrawingCanvas, type DrawingCanvasRef } from './components/DrawingCanvas';
import WhiteboardToolbar from './components/WhiteboardToolbar';
import { couleursDuTableau } from './papierDuTableau';
import { useWhiteboardStore } from './useWhiteboardStore';
import { useMediaStore } from '../../stores/useMediaStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import {
    RotateCcw,
    RotateCw,
    Trash2,
    Download,
    Cast,
    Ruler,
} from 'lucide-react';
import { gmCustom } from '../../stores/useModalStore';
import { useJournalStore } from '../journal/useJournalStore';
import { gmToast } from '../../stores/useToastStore';
import { useTranslation } from 'react-i18next';
import { PAPIER } from './papierDuTableau';
import { TAILLE_DE_CASE } from './logic/dessinerUnTrace';
import { Bouton, Etiquette, EnTeteDeModule } from '../../components/socle';
import { useRegimeDInterface } from '../session/hooks/useRegimeDInterface';
import { seanceOuverteDe } from '../session/logic/seanceOuverte';

/** Les trois épaisseurs du pied, en pixels. */
const EPAISSEURS = [2, 5, 10] as const;
const etiquetteDuPied = 'text-ui-10 font-black uppercase tracking-widest text-app-muted';

/**
 * **Le tableau blanc** — refonte, L6, maquette retenue
 * (`stitch/preparation/preparation-tableau-blanc.png`) : **la surface au plus
 * large**, une barre d'outils compacte à gauche (crayon, gomme, rectangle,
 * cercle, pion, cible, laser), l'épaisseur, les couleurs et la règle en pied ;
 * Annuler, Rétablir, Tout effacer, Projeter en tête.
 *
 * L'en-tête et le pied sont **hors du papier** : ils suivent le thème, quand le
 * papier suit le choix du meneur. Le bandeau d'avant était posé sur la feuille,
 * et le texte du thème s'y lisait mal sur un papier clair.
 */
const WhiteboardDashboard: React.FC = () => {
    const canvasRef = useRef<DrawingCanvasRef>(null);
    const {
        clearBoard,
        undo,
        redo,
        undoStack,
        redoStack,
        paths,
        projectionTarget,
        clearProjectedState,
        backgroundMode,
        currentTool,
        setTool,
        currentColor,
        setColor,
        currentWidth,
        setWidth,
    } = useWhiteboardStore();
    const { t, i18n } = useTranslation('modules');
    const regime = useRegimeDInterface();

    const { addMedia } = useMediaStore();
    /*
      ⛔ **La séance ouverte, lue par la règle commune** (2026-10-03). L'export
      cherchait `selectedSessionId` — la séance *sélectionnée* dans une liste,
      pas celle qui joue : une séance lancée depuis le cockpit pouvait être
      ouverte sans être sélectionnée, et l'export se disait « hors séance ».
      `seanceOuverteDe` tranche pour tout le dépôt : la campagne fait autorité.
    */
    const { campaigns, activeCampaignId, sessions, addWikiEntry } = useSessionOSStore();
    const activeSession = seanceOuverteDe(campaigns, sessions, activeCampaignId);
    const isSessionActive = activeSession !== null;
    const unite = useSessionOSStore(s => s.getActiveDriver()?.tactical?.uniteDeDistance);

    const isLight = backgroundMode === 'light';
    const papier = PAPIER[isLight ? 'clair' : 'sombre'];

    const handleExport = async () => {
        if (!canvasRef.current || !isSessionActive || !activeSession) {
            gmToast(t('whiteboard.export.error_session'), "error");
            return;
        }

        try {
            const blob = await canvasRef.current.getBlob();
            if (!blob) return;

            // 1. Create file and add to Media Hub
            const filename = `whiteboard-${new Date().toISOString().split('T')[0]}-${Date.now()}.png`;
            const file = new File([blob], filename, { type: 'image/png' });
            const { activeCampaignId } = useSessionOSStore.getState();
            const mediaId = await addMedia(file, ['whiteboard'], activeCampaignId ? [activeCampaignId] : []);

            // 2. Add to Wiki
            addWikiEntry({
                campaignId: activeSession.campaignId,
                title: t('whiteboard.export.wiki_title', { date: new Date().toLocaleDateString(i18n.language) }),
                content: t('whiteboard.export.wiki_content', { date: new Date().toLocaleString(i18n.language) }),
                category: 'other',
                tags: ['whiteboard', 'snapshot', 'export'],
                imageUrls: [mediaId],
                linkedEntityIds: []
            });

            // 3. Add to Journal
            useJournalStore.getState().addEvent({
                type: 'SYSTEM',
                title: t('whiteboard.export.journal_title'),
                content: t('whiteboard.export.journal_content'),
                metadata: { mediaId, filename }
            });

            gmToast(t('whiteboard.export.success'), "success");
        } catch (err) {
            console.error('[Whiteboard] Export failed:', err);
            gmToast(t('whiteboard.export.error_generic'), "error");
        }
    };

    const arreterLaProjection = () => {
        if (projectionTarget === 'monitor' && window.appBridge?.image?.closeAllDisplays) {
            window.appBridge.image.closeAllDisplays();
        }
        clearProjectedState();
    };

    return (
        <div className="flex h-full min-h-0 flex-col gap-3 p-4 text-app-text">
            <EnTeteDeModule
                titre={t('whiteboard.title')}
                etat={projectionTarget && (
                    <Etiquette ton="accent">
                        <Cast size={11} className="animate-pulse" />
                        {t('whiteboard.projection.active', { target: projectionTarget === 'hub' ? t('whiteboard.projection.player_hub') : t('whiteboard.projection.monitor') })}
                    </Etiquette>
                )}
                actions={<>
                    <Bouton aLaTable={regime.aLaTable} icone={<RotateCcw size={15} />} onClick={undo} disabled={undoStack.length === 0}>
                        {t('whiteboard.actions.undo')}
                    </Bouton>
                    <Bouton aLaTable={regime.aLaTable} icone={<RotateCw size={15} />} onClick={redo} disabled={redoStack.length === 0}>
                        {t('whiteboard.actions.redo')}
                    </Bouton>
                    {/* Tout effacer s'annule : pas de confirmation, Annuler suffit. */}
                    <Bouton aLaTable={regime.aLaTable} variante="danger" icone={<Trash2 size={15} />} onClick={clearBoard} disabled={paths.length === 0}>
                        {t('whiteboard.actions.clear')}
                    </Bouton>
                    {isSessionActive && (
                        <Bouton aLaTable={regime.aLaTable} icone={<Download size={15} />} onClick={handleExport} title={t('whiteboard.actions.export_tooltip')}>
                            {t('whiteboard.actions.export')}
                        </Bouton>
                    )}
                    {projectionTarget ? (
                        <Bouton aLaTable={regime.aLaTable} icone={<Cast size={15} />} onClick={arreterLaProjection}>
                            {t('whiteboard.actions.stop')}
                        </Bouton>
                    ) : (
                        <Bouton aLaTable={regime.aLaTable} variante="accent" icone={<Cast size={15} />} onClick={() => gmCustom('whiteboard-projection-select')}>
                            {t('whiteboard.actions.project')}
                        </Bouton>
                    )}
                </>}
            />

            {/* ── La surface, au plus large ── */}
            <div
                className={`relative min-h-0 flex-1 overflow-hidden rounded-xl border border-app-border transition-colors duration-500 ${papier.fond}`}
                style={{
                    backgroundImage: 'radial-gradient(var(--app-border) 1px, transparent 1px)',
                    backgroundSize: `${TAILLE_DE_CASE}px ${TAILLE_DE_CASE}px`,
                }}
            >
                <DrawingCanvas ref={canvasRef} />
                <WhiteboardToolbar meneur className="absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* ── Le pied : épaisseur, couleurs, règle ── */}
            <div role="toolbar" aria-label={t('whiteboard.footer.label')} className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-app-border bg-app-surface px-4 py-2">
                <div className="flex items-center gap-2">
                    <span className={etiquetteDuPied}>{t('whiteboard.footer.width')}</span>
                    {EPAISSEURS.map(e => (
                        <button
                            key={e}
                            onClick={() => setWidth(e)}
                            aria-pressed={currentWidth === e}
                            className={`flex min-h-9 items-center gap-2 rounded-lg px-3 font-mono text-xs font-bold transition-colors ${
                                currentWidth === e ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:text-app-text'
                            }`}
                        >
                            <span className="rounded-full bg-current" style={{ width: e + 2, height: e + 2 }} />
                            {e} px
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className={etiquetteDuPied}>{t('whiteboard.footer.color')}</span>
                    {couleursDuTableau(isLight).map(couleur => (
                        <button
                            key={couleur}
                            onClick={() => setColor(couleur)}
                            aria-pressed={currentColor === couleur}
                            title={couleur}
                            className={`size-7 rounded-md border border-app-border transition-transform hover:scale-110 ${
                                currentColor === couleur ? 'ring-2 ring-accent ring-offset-2 ring-offset-app-surface' : ''
                            }`}
                            style={{ backgroundColor: couleur }}
                        />
                    ))}
                </div>
                <button
                    onClick={() => setTool(currentTool === 'regle' ? 'brush' : 'regle')}
                    aria-pressed={currentTool === 'regle'}
                    title={t('whiteboard.footer.ruler_tooltip', { unit: unite || t('whiteboard.footer.ruler_default_unit') })}
                    className={`ml-auto flex min-h-9 items-center gap-2 rounded-lg border px-3 text-ui-10 font-black uppercase tracking-widest transition-colors ${
                        currentTool === 'regle' ? 'border-accent bg-accent/15 text-accent' : 'border-app-border text-app-muted hover:text-app-text'
                    }`}
                >
                    <Ruler size={15} />
                    {t('whiteboard.tools.regle')}
                    <span className="font-mono">{currentTool === 'regle' ? t('whiteboard.footer.on') : t('whiteboard.footer.off')}</span>
                </button>
            </div>
        </div>
    );
};

export default WhiteboardDashboard;
