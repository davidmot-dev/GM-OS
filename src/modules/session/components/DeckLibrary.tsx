import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../useSessionOSStore';
import { 
    Plus, 
    Trash2, 
    Settings2, 
    Layers, 
    ArrowRight,
    Monitor,
    Smartphone,
    X,
    FolderOpen,
    Users,
    Lock,
    ChevronLeft,
} from 'lucide-react';
import { Panneau, Etiquette } from '../../../components/socle';
import type { CardFormat, CardOrientation } from '../store/types';
import { useDeckLibrary } from '../hooks/useDeckLibrary';

const DeckLibrary: React.FC = () => {
    const { t } = useTranslation();
    const { setCurrentView } = useSessionOSStore();
    const {
        isAdding,
        editingDeckId,
        filteredDecks,
        showAllDecks,
        setShowAllDecks,
        availableSystems,
        currentSystemId,
        form,
        setIsAdding,
        handleEdit,
        handleSave,
        handleDelete,
        handleSelect,
        handleToggleOuverture,
        resetForm
    } = useDeckLibrary();

    /* Le paquet que le lecteur a chargé — « En service » dans la liste. */
    const enService = useSessionOSStore(s => s.selectedDeckId);

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-app-bg">
            {/*
              **La bibliothèque des paquets** — refonte, L5, étape 2. Une
              ligne par paquet, ce qu'il est et à qui il est ouvert d'un coup
              d'œil ; Charger, Modifier, Supprimer.
            */}
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-app-border bg-app-surface/40 px-6 py-4 shrink-0">
                <div className="min-w-0">
                    <button
                        type="button"
                        onClick={() => setCurrentView('cockpit')}
                        className="flex items-center gap-1 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-colors hover:text-accent"
                    >
                        <ChevronLeft size={14} />{t('modules:session.deck_module.library.agencement.retour')}
                    </button>
                    <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-app-text">
                        Deck-OS <span className="text-gm-gold">//</span> {t('modules:session.deck_module.library.agencement.titre')}
                    </h1>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Etiquette ton="accent">{t('modules:session.deck_module.library.agencement.systeme_en_cours', { systeme: currentSystemId })}</Etiquette>
                        <Etiquette>{t('modules:session.deck_module.library.agencement.paquets', { count: filteredDecks.length })}</Etiquette>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg border border-app-border bg-app-bg/40 p-1">
                        {([true, false] as const).map(tous => (
                            <button
                                key={String(tous)}
                                type="button"
                                onClick={() => setShowAllDecks(tous)}
                                title={tous ? t('modules:session.deck_module.library.tooltip_filter_all') : t('modules:session.deck_module.library.tooltip_filter_active')}
                                className={`rounded-md px-3 py-1.5 text-ui-10 font-black uppercase tracking-widest transition-all ${
                                    showAllDecks === tous ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:text-app-text'
                                }`}
                            >
                                {tous ? t('modules:session.deck_module.library.filter_all') : t('modules:session.deck_module.library.agencement.systeme_actif')}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => { resetForm(); setIsAdding(true); }}
                        className="flex items-center gap-2 rounded-lg bg-gm-gold px-5 py-2.5 text-ui-10 font-black uppercase tracking-widest text-app-bg transition-all hover:brightness-110"
                    >
                        <Plus size={14} />
                        {t('modules:session.deck_module.library.new_deck')}
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                <div className="mx-auto flex max-w-5xl flex-col gap-3">
                    {/* Addition/Edit Form Card */}
                    {(isAdding || editingDeckId) && (
                        <div className="rounded-xl bg-app-surface-2 border border-gm-gold/40 p-6 space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-gm-gold text-xs font-black uppercase tracking-[0.2em]">
                                    {editingDeckId ? t('modules:session.deck_module.editor.title_edit') : t('modules:session.deck_module.editor.title_new')}
                                </h3>
                                <button type="button" onClick={resetForm} className="text-app-text/20 hover:text-app-text transition-all focus:outline-none"><X size={18} /></button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="deck-name" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 px-1">{t('modules:session.deck_module.editor.name_label')}</label>
                                        <input 
                                            id="deck-name"
                                            value={form.name}
                                            onChange={e => form.setName(e.target.value)}
                                            className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none"
                                            placeholder={t('modules:session.deck_module.editor.name_placeholder')}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="deck-system" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 px-1">{t('modules:session.deck_module.editor.system_label')}</label>
                                        <select 
                                            id="deck-system"
                                            value={form.systemId}
                                            onChange={e => form.setSystemId(e.target.value)}
                                            title={t('modules:session.deck_module.editor.system_placeholder')}
                                            className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none appearance-none font-bold"
                                        >
                                            {availableSystems.map(sys => (
                                                <option key={sys.id} value={sys.id}>
                                                    {('emoji' in sys ? sys.emoji : '⚙️')} {sys.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="deck-format" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 px-1">{t('modules:session.deck_module.editor.format_label')}</label>
                                        <select 
                                            id="deck-format"
                                            value={form.format}
                                            title={t('modules:session.deck_module.editor.format_label')}
                                            onChange={e => form.setFormat(e.target.value as CardFormat)}
                                            className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl py-2.5 px-4 text-ui-10 uppercase font-black tracking-widest focus:border-gm-gold/40 transition-all outline-none"
                                        >
                                            <option value="poker">{t('modules:session.deck_module.editor.formats.poker')}</option>
                                            <option value="tarot">{t('modules:session.deck_module.editor.formats.tarot')}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="deck-orientation" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 px-1">{t('modules:session.deck_module.editor.orientation_label')}</label>
                                        <select 
                                            id="deck-orientation"
                                            value={form.orientation}
                                            title={t('modules:session.deck_module.editor.orientation_label')}
                                            onChange={e => form.setOrientation(e.target.value as CardOrientation)}
                                            className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl py-2.5 px-4 text-ui-10 uppercase font-black tracking-widest focus:border-gm-gold/40 transition-all outline-none"
                                        >
                                            <option value="portrait">{t('modules:session.deck_module.editor.orientations.portrait')}</option>
                                            <option value="landscape">{t('modules:session.deck_module.editor.orientations.landscape')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="deck-extension-select" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 px-1">{t('modules:session.deck_module.editor.extension_label')}</label>
                                        <select 
                                            id="deck-extension-select"
                                            value={form.extension}
                                            title={t('modules:session.deck_module.editor.extension_tooltip')}
                                            onChange={e => form.setExtension(e.target.value)}
                                            className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none"
                                        >
                                            <option value=".jpg">.JPG</option>
                                            <option value=".jpeg">.JPEG</option>
                                            <option value=".png">.PNG</option>
                                            <option value=".webp">.WEBP</option>
                                            <option value=".bmp">.BMP</option>
                                            <option value=".img">.IMG</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="deck-padding" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 px-1">{t('modules:session.deck_module.editor.padding_label')}</label>
                                        <select 
                                            id="deck-padding"
                                            value={form.padding}
                                            title={t('modules:session.deck_module.editor.padding_tooltip')}
                                            onChange={e => form.setPadding(parseInt(e.target.value))}
                                            className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none"
                                        >
                                            <option value={0}>{t('modules:session.deck_module.editor.padding_none')}</option>
                                            <option value={2}>{t('modules:session.deck_module.editor.padding_2')}</option>
                                            <option value={3}>{t('modules:session.deck_module.editor.padding_3')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="deck-card-count" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 px-1">{t('modules:session.deck_module.editor.count_label')}</label>
                                    <input 
                                        id="deck-card-count"
                                        type="number"
                                        value={form.cardCount}
                                        onChange={e => form.setCardCount(parseInt(e.target.value) || 0)}
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none font-black"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="deck-folder-path" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 px-1 flex items-center gap-2">
                                        <FolderOpen size={10} /> {t('modules:session.deck_module.editor.path_label')}
                                    </label>
                                    <input 
                                        id="deck-folder-path"
                                        value={form.folderPath}
                                        onChange={e => form.setFolderPath(e.target.value)}
                                        className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl py-2.5 px-4 text-ui-10 font-mono tracking-tighter text-app-text/60 focus:border-gm-gold/40 transition-all outline-none"
                                        placeholder={t('modules:session.deck_module.editor.path_placeholder')}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="deck-extension-input" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 px-1">{t('modules:session.deck_module.editor.extension_label')}</label>
                                        <input 
                                            id="deck-extension-input"
                                            value={form.extension}
                                            onChange={e => form.setExtension(e.target.value)}
                                            className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl py-2 px-4 text-ui-10 font-mono text-app-text/60 focus:border-gm-gold/40 transition-all outline-none"
                                            placeholder=".png"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="deck-filename-pattern" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 px-1">{t('modules:session.deck_module.editor.pattern_label')}</label>
                                        <input 
                                            id="deck-filename-pattern"
                                            value={form.filenamePattern}
                                            onChange={e => form.setFilenamePattern(e.target.value)}
                                            className="w-full bg-app-bg/40 border border-app-text/5 rounded-xl py-2 px-4 text-ui-10 font-mono text-app-text/60 focus:border-gm-gold/40 transition-all outline-none"
                                            placeholder={t('modules:session.deck_module.editor.pattern_placeholder')}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={form.useDiscard}
                                            onChange={e => form.setUseDiscard(e.target.checked)}
                                            id="useDiscard"
                                            className="w-4 h-4 rounded bg-app-bg border-app-text/10 text-gm-gold focus:ring-gm-gold/30"
                                        />
                                        <label htmlFor="useDiscard" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 cursor-pointer">{t('modules:session.deck_module.editor.discard_label')}</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={form.startAtZero}
                                            onChange={e => form.setStartAtZero(e.target.checked)}
                                            id="startAtZero"
                                            className="w-4 h-4 rounded bg-app-bg border-app-text/10 text-gm-gold focus:ring-gm-gold/30"
                                        />
                                        <label htmlFor="startAtZero" className="text-ui-9 font-black uppercase tracking-widest text-app-text/40 cursor-pointer">{t('modules:session.deck_module.editor.start_zero_label')}</label>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={handleSave}
                                        className="px-6 py-2 bg-gm-gold text-app-bg rounded-xl text-ui-10 font-black uppercase tracking-widest shadow-glow-gold/20 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-gm-gold/50"
                                    >
                                        {editingDeckId ? t('modules:session.deck_module.editor.update_btn') : t('modules:session.deck_module.editor.validate_btn')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {filteredDecks.length === 0 && !isAdding && (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-app-border py-16 text-app-subtle">
                            <Layers size={48} strokeWidth={1} />
                            <span className="text-center text-xs font-black uppercase tracking-widest">
                                {t('modules:session.deck_module.library.empty_state')}<br/>
                                <span className="text-ui-10">{t('modules:session.deck_module.library.empty_state_filter_hint', { systemId: currentSystemId })}</span>
                            </span>
                            {!showAllDecks && (
                                <button onClick={() => setShowAllDecks(true)} className="text-ui-10 font-black uppercase tracking-widest text-gm-gold hover:underline">
                                    {t('modules:session.deck_module.library.show_all_btn')}
                                </button>
                            )}
                        </div>
                    )}

                    {filteredDecks.map(deck => {
                        const charge = enService === deck.id;
                        return (
                            <Panneau key={deck.id} className={charge ? 'border-accent' : ''}>
                                <div className="flex gap-4 p-4">
                                    <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md border border-app-border bg-app-surface-2">
                                        <img src={`/${deck.folderPath}/back${deck.extension || '.png'}`} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Etiquette ton="info">{deck.systemId}</Etiquette>
                                            <span className="flex items-center gap-1 text-ui-10 font-bold uppercase tracking-widest text-app-muted">
                                                {deck.orientation === 'portrait' ? <Smartphone size={11} /> : <Monitor size={11} />}
                                                {deck.format} — {deck.orientation}
                                            </span>
                                            {charge && <Etiquette ton="accent">{t('modules:session.deck_module.library.agencement.en_service')}</Etiquette>}
                                        </div>
                                        <h3 className="truncate font-display text-lg font-bold uppercase text-app-text">{deck.name}</h3>
                                        {/*
                                          **Ouvert aux joueurs, ou meneur seul.**

                                          Demandé par David le 2026-08-30. C'est à la
                                          fois le témoin et l'interrupteur : un réglage
                                          qu'il faudrait ouvrir le formulaire d'édition
                                          pour lire ne dirait rien de la liste. Le
                                          libellé annonce **l'état**, l'infobulle dit ce
                                          que le clic va produire.
                                        */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleOuverture(deck)}
                                                title={deck.ouvertAuxJoueurs
                                                    ? t('modules:session.deck_module.library.close_to_players')
                                                    : t('modules:session.deck_module.library.open_to_players')}
                                                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-ui-10 font-black uppercase tracking-widest transition-all ${deck.ouvertAuxJoueurs
                                                    ? 'border-etat-succes/40 bg-etat-succes/10 text-etat-succes'
                                                    : 'border-etat-alerte/40 bg-etat-alerte/10 text-etat-alerte'}`}
                                            >
                                                {deck.ouvertAuxJoueurs ? <Users size={11} /> : <Lock size={11} />}
                                                {deck.ouvertAuxJoueurs
                                                    ? t('modules:session.deck_module.library.players_can_draw')
                                                    : t('modules:session.deck_module.library.gm_only')}
                                            </button>
                                            <span className="text-ui-10 text-app-muted">
                                                {deck.ouvertAuxJoueurs
                                                    ? t('modules:session.deck_module.library.agencement.phrase_ouvert')
                                                    : t('modules:session.deck_module.library.agencement.phrase_ferme')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                                        <span className="text-right">
                                            <span className="font-display text-2xl font-bold text-app-text">{deck.cardCount}</span>
                                            <span className="ml-1 text-ui-10 font-black uppercase tracking-widest text-app-muted">{t('modules:session.deck_module.library.agencement.cartes')}</span>
                                        </span>
                                        <div className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(deck)}
                                                className="rounded-lg border border-app-border p-2 text-app-muted transition-all hover:text-app-text"
                                                title={t('modules:session.deck_module.library.edit_tooltip')}
                                            >
                                                <Settings2 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(deck.id)}
                                                className="rounded-lg border border-app-border p-2 text-app-muted transition-all hover:border-etat-danger/50 hover:text-etat-danger"
                                                title={t('modules:session.deck_module.library.delete_tooltip')}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { handleSelect(deck.id); setCurrentView('deck-player'); }}
                                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-ui-10 font-black uppercase tracking-widest transition-all ${
                                                    charge ? 'bg-accent text-app-on-accent hover:brightness-110' : 'border border-app-border text-accent hover:border-accent/50 hover:bg-accent/10'
                                                }`}
                                            >
                                                {t('modules:session.deck_module.library.load_btn')}
                                                <ArrowRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Panneau>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DeckLibrary;
