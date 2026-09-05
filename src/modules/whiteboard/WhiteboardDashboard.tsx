import React, { useRef } from 'react';
import { DrawingCanvas, type DrawingCanvasRef } from './components/DrawingCanvas';
import WhiteboardToolbar from './components/WhiteboardToolbar';
import { useWhiteboardStore } from './useWhiteboardStore';
import { useMediaStore } from '../../stores/useMediaStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { 
    RotateCcw, 
    RotateCw, 
    Trash2, 
    Download,
    Cast
} from 'lucide-react';
import { gmCustom } from '../../stores/useModalStore';
import { useJournalStore } from '../journal/useJournalStore';
import { gmToast } from '../../stores/useToastStore';
import { useTranslation } from 'react-i18next';

const WhiteboardDashboard: React.FC = () => {
    const canvasRef = useRef<DrawingCanvasRef>(null);
    const { 
        clearBoard, 
        undo, 
        redo,
        projectionTarget,
        clearProjectedState,
        backgroundMode
    } = useWhiteboardStore();
    const { t, i18n } = useTranslation('modules');

    const { addMedia } = useMediaStore();
    const { selectedSessionId, sessions, addWikiEntry } = useSessionOSStore();
    const activeSession = sessions.find(s => s.id === selectedSessionId);
    const isSessionActive = activeSession?.status === 'active';

    const isLight = backgroundMode === 'light';

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

    return (
        <div className={`h-full w-full transition-colors duration-500 relative overflow-hidden flex flex-col ${isLight ? 'bg-white' : 'bg-app-bg'}`}>
            {/* Header / Info bar */}
            <div className={`flex items-center justify-between p-4 backdrop-blur-md border-b z-10 ${isLight ? 'bg-white/80 border-app-border/30' : 'bg-app-surface/50 border-app-border/20'}`}>
                <div className="flex flex-col gap-0.5">
                    {projectionTarget && (
                        <div className="flex items-center gap-2 mt-1 py-1 px-2 bg-accent/10 border border-accent/20 rounded-md">
                            <Cast size={12} className="text-accent animate-pulse" />
                            <span className="text-ui-9 font-black text-accent uppercase tracking-wider">
                                {t('whiteboard.projection.active', { target: projectionTarget === 'hub' ? t('whiteboard.projection.player_hub') : t('whiteboard.projection.monitor') })}
                            </span>
                            <button 
                                onClick={() => {
                                    if (projectionTarget === 'monitor' && window.appBridge?.image?.closeAllDisplays) {
                                        window.appBridge.image.closeAllDisplays();
                                    }
                                    clearProjectedState();
                                }}
                                className="ml-2 text-ui-8 text-accent hover:text-accent/80 font-bold uppercase transition-colors"
                            >
                                {t('whiteboard.actions.stop')}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => gmCustom('whiteboard-projection-select')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border font-black uppercase text-xs tracking-widest ${projectionTarget ? 'bg-app-surface text-app-text/40 border-app-border' : 'bg-accent/20 hover:bg-accent/30 text-accent border-accent/20'}`}
                        title={t('whiteboard.actions.project')}
                    >
                        <Cast size={14} />
                        {t('whiteboard.actions.project')}
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button onClick={undo} className="p-2 rounded-lg bg-app-surface/40 hover:bg-app-surface/60 text-app-text/60 transition-all border border-app-border" title={t('whiteboard.actions.undo')}>
                        <RotateCcw size={18} />
                    </button>
                    <button onClick={redo} className="p-2 rounded-lg bg-app-surface/40 hover:bg-app-surface/60 text-app-text/60 transition-all border border-app-border" title={t('whiteboard.actions.redo')}>
                        <RotateCw size={18} />
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <button onClick={clearBoard} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all border border-red-500/10" title={t('whiteboard.actions.clear')}>
                        <Trash2 size={18} />
                    </button>
                    {isSessionActive && (
                        <button 
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent text-xs font-black uppercase tracking-widest transition-all border border-accent/20"
                            title={t('whiteboard.actions.export_tooltip')}
                        >
                            <Download size={14} />
                            {t('whiteboard.actions.export')}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 relative bg-[radial-gradient(var(--app-border)_1px,transparent_1px)] [background-size:24px_24px]">
                <DrawingCanvas ref={canvasRef} />
                
                {/* Floating Toolbar */}
                <WhiteboardToolbar className="absolute left-6 top-1/2 -translate-y-1/2" />
            </div>

            {/* Decorative Grid Overlay (Subtle) */}
            <div className="absolute inset-0 pointer-events-none border border-app-border/10 rounded-3xl m-4" />
        </div>
    );
};

export default WhiteboardDashboard;
