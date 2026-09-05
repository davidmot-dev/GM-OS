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
    Lock
} from 'lucide-react';
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

    return (
        <div className="flex flex-col h-full w-full bg-[#0a0a0c] p-8 gap-8 overflow-y-auto custom-scrollbar">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gm-gold/10 flex items-center justify-center border border-gm-gold/20">
                        <Layers className="text-gm-gold" size={24} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white/80">
                            Deck-OS <span className="text-white/20 px-2">//</span> 
                            <span className="text-gm-gold">{t('modules:session.deck_module.library.title')}</span>
                        </h1>
                        <p className="text-ui-10 text-white/40 font-bold uppercase tracking-widest mt-1">{t('modules:session.deck_module.library.subtitle')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={() => setShowAllDecks(!showAllDecks)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-ui-10 tracking-widest uppercase transition-all border ${
                            showAllDecks 
                            ? 'bg-gm-gold/20 border-gm-gold text-gm-gold shadow-glow-gold/10' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                        }`}
                        title={showAllDecks ? t('modules:session.deck_module.library.tooltip_filter_active') : t('modules:session.deck_module.library.tooltip_filter_all')}
                    >
                        <Layers size={14} />
                        {showAllDecks ? t('modules:session.deck_module.library.filter_all') : t('modules:session.deck_module.library.filter_system')}
                    </button>

                    <button 
                        type="button"
                        onClick={() => { resetForm(); setIsAdding(true); }}
                        className="flex items-center gap-2 bg-gm-gold hover:bg-yellow-500 text-black font-black px-6 py-2.5 rounded-xl text-ui-10 tracking-widest uppercase transition-all shadow-glow-gold/20 focus:outline-none focus:ring-2 focus:ring-gm-gold/50"
                    >
                        <Plus size={14} />
                        {t('modules:session.deck_module.library.new_deck')}
                    </button>
                </div>
            </header>

            {/* Decks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDecks.length === 0 && !isAdding && (
                    <div className="col-span-full py-20 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-white/10 gap-4">
                        <Layers size={48} strokeWidth={1} />
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-widest text-center">
                                {t('modules:session.deck_module.library.empty_state')}<br/>
                                <span className="text-ui-10 opacity-40">{t('modules:session.deck_module.library.empty_state_filter_hint', { systemId: currentSystemId })}</span>
                            </span>
                            {!showAllDecks && (
                                <button 
                                    onClick={() => setShowAllDecks(true)}
                                    className="mt-4 text-ui-10 font-black uppercase tracking-widest text-gm-gold hover:underline"
                                >
                                    {t('modules:session.deck_module.library.show_all_btn')}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {filteredDecks.map(deck => (
                    <div 
                        key={deck.id}
                        className="group relative h-48 rounded-[2rem] bg-[#121215] border border-white/5 hover:border-gm-gold/30 p-6 flex flex-col justify-between transition-all duration-500 shadow-xl overflow-hidden"
                    >
                        {/* Decorative Background Image (Card Back) */}
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                            <img 
                                src={`/${deck.folderPath}/back${deck.extension || '.png'}`} 
                                alt="" 
                                className="w-full h-full object-cover opacity-[0.05] group-hover:opacity-[0.15] group-hover:scale-110 transition-all duration-700 grayscale brightness-200"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent opacity-80" />
                        </div>
                        
                        {/* Decorative Background Icon (Subtle Fallback) */}
                        <Layers className="absolute -right-8 -bottom-8 text-white/5 group-hover:text-gm-gold/5 transition-all rotate-12 z-0" size={160} />
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div className="space-y-1">
                                <h3 className="text-white font-black uppercase tracking-widest text-sm">{deck.name}</h3>
                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 rounded bg-white/5 text-ui-8 font-black text-white/40 uppercase tracking-tighter">
                                        {deck.systemId}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-gm-gold/10 text-ui-8 font-black text-gm-gold uppercase tracking-tighter">
                                        {t('modules:session.deck_module.library.card_count', { count: deck.cardCount })}
                                    </span>
                                </div>
                                {/*
                                  **Ouvert aux joueurs, ou meneur seul.**

                                  Demandé par David le 2026-08-30. C'est à la
                                  fois le témoin et l'interrupteur : un réglage
                                  qu'il faudrait ouvrir le formulaire d'édition
                                  pour lire ne dirait rien de la grille. Le
                                  libellé annonce **l'état**, l'infobulle dit ce
                                  que le clic va produire.
                                */}
                                <button
                                    type="button"
                                    onClick={() => handleToggleOuverture(deck)}
                                    title={deck.ouvertAuxJoueurs
                                        ? t('modules:session.deck_module.library.close_to_players')
                                        : t('modules:session.deck_module.library.open_to_players')}
                                    className={`mt-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-ui-8 font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-1 ${deck.ouvertAuxJoueurs
                                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 focus:ring-emerald-500/40'
                                        : 'border-white/10 bg-white/5 text-white/30 hover:text-white/60 focus:ring-white/20'}`}
                                >
                                    {deck.ouvertAuxJoueurs ? <Users size={10} /> : <Lock size={10} />}
                                    {deck.ouvertAuxJoueurs
                                        ? t('modules:session.deck_module.library.players_can_draw')
                                        : t('modules:session.deck_module.library.gm_only')}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => handleEdit(deck)}
                                    className="p-2 rounded-lg bg-white/5 text-white/20 hover:text-white transition-all focus:outline-none focus:ring-1 focus:ring-white/20"
                                    title={t('modules:session.deck_module.library.edit_tooltip')}
                                >
                                    <Settings2 size={14} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleDelete(deck.id)}
                                    className="p-2 rounded-lg bg-white/5 text-white/20 hover:text-red-500 transition-all focus:outline-none focus:ring-1 focus:ring-red-500/40"
                                    title={t('modules:session.deck_module.library.delete_tooltip')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3 text-ui-9 font-bold text-white/20 uppercase tracking-widest">
                                {deck.orientation === 'portrait' ? <Smartphone size={12} /> : <Monitor size={12} />}
                                {deck.format} — {deck.orientation}
                            </div>
                            <button 
                                type="button"
                                onClick={() => { handleSelect(deck.id); setCurrentView('deck-player'); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-gm-gold hover:text-black rounded-xl text-ui-9 font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-gm-gold/40"
                            >
                                {t('modules:session.deck_module.library.load_btn')}
                                <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Addition/Edit Form Card */}
                {(isAdding || editingDeckId) && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-1 h-auto rounded-[2rem] bg-gradient-to-br from-[#1a1a20] to-[#0d0d0f] border border-gm-gold/30 p-8 space-y-6 shadow-glow-gold/10 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-gm-gold text-xs font-black uppercase tracking-[0.2em]">
                                {editingDeckId ? t('modules:session.deck_module.editor.title_edit') : t('modules:session.deck_module.editor.title_new')}
                            </h3>
                            <button type="button" onClick={resetForm} className="text-white/20 hover:text-white transition-all focus:outline-none"><X size={18} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-name" className="text-ui-9 font-black uppercase tracking-widest text-white/40 px-1">{t('modules:session.deck_module.editor.name_label')}</label>
                                    <input 
                                        id="deck-name"
                                        value={form.name}
                                        onChange={e => form.setName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none"
                                        placeholder={t('modules:session.deck_module.editor.name_placeholder')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-system" className="text-ui-9 font-black uppercase tracking-widest text-white/40 px-1">{t('modules:session.deck_module.editor.system_label')}</label>
                                    <select 
                                        id="deck-system"
                                        value={form.systemId}
                                        onChange={e => form.setSystemId(e.target.value)}
                                        title={t('modules:session.deck_module.editor.system_placeholder')}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none appearance-none font-bold"
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
                                    <label htmlFor="deck-format" className="text-ui-9 font-black uppercase tracking-widest text-white/40 px-1">{t('modules:session.deck_module.editor.format_label')}</label>
                                    <select 
                                        id="deck-format"
                                        value={form.format}
                                        title={t('modules:session.deck_module.editor.format_label')}
                                        onChange={e => form.setFormat(e.target.value as CardFormat)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-ui-10 uppercase font-black tracking-widest focus:border-gm-gold/40 transition-all outline-none"
                                    >
                                        <option value="poker">{t('modules:session.deck_module.editor.formats.poker')}</option>
                                        <option value="tarot">{t('modules:session.deck_module.editor.formats.tarot')}</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-orientation" className="text-ui-9 font-black uppercase tracking-widest text-white/40 px-1">{t('modules:session.deck_module.editor.orientation_label')}</label>
                                    <select 
                                        id="deck-orientation"
                                        value={form.orientation}
                                        title={t('modules:session.deck_module.editor.orientation_label')}
                                        onChange={e => form.setOrientation(e.target.value as CardOrientation)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-ui-10 uppercase font-black tracking-widest focus:border-gm-gold/40 transition-all outline-none"
                                    >
                                        <option value="portrait">{t('modules:session.deck_module.editor.orientations.portrait')}</option>
                                        <option value="landscape">{t('modules:session.deck_module.editor.orientations.landscape')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-extension-select" className="text-ui-9 font-black uppercase tracking-widest text-white/40 px-1">{t('modules:session.deck_module.editor.extension_label')}</label>
                                    <select 
                                        id="deck-extension-select"
                                        value={form.extension}
                                        title={t('modules:session.deck_module.editor.extension_tooltip')}
                                        onChange={e => form.setExtension(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none"
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
                                    <label htmlFor="deck-padding" className="text-ui-9 font-black uppercase tracking-widest text-white/40 px-1">{t('modules:session.deck_module.editor.padding_label')}</label>
                                    <select 
                                        id="deck-padding"
                                        value={form.padding}
                                        title={t('modules:session.deck_module.editor.padding_tooltip')}
                                        onChange={e => form.setPadding(parseInt(e.target.value))}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none"
                                    >
                                        <option value={0}>{t('modules:session.deck_module.editor.padding_none')}</option>
                                        <option value={2}>{t('modules:session.deck_module.editor.padding_2')}</option>
                                        <option value={3}>{t('modules:session.deck_module.editor.padding_3')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="deck-card-count" className="text-ui-9 font-black uppercase tracking-widest text-white/40 px-1">{t('modules:session.deck_module.editor.count_label')}</label>
                                <input 
                                    id="deck-card-count"
                                    type="number"
                                    value={form.cardCount}
                                    onChange={e => form.setCardCount(parseInt(e.target.value) || 0)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none font-black"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="deck-folder-path" className="text-ui-9 font-black uppercase tracking-widest text-white/40 px-1 flex items-center gap-2">
                                    <FolderOpen size={10} /> {t('modules:session.deck_module.editor.path_label')}
                                </label>
                                <input 
                                    id="deck-folder-path"
                                    value={form.folderPath}
                                    onChange={e => form.setFolderPath(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-ui-10 font-mono tracking-tighter text-white/60 focus:border-gm-gold/40 transition-all outline-none"
                                    placeholder={t('modules:session.deck_module.editor.path_placeholder')}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-extension-input" className="text-ui-9 font-black uppercase tracking-widest text-white/40 px-1">{t('modules:session.deck_module.editor.extension_label')}</label>
                                    <input 
                                        id="deck-extension-input"
                                        value={form.extension}
                                        onChange={e => form.setExtension(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-4 text-ui-10 font-mono text-white/60 focus:border-gm-gold/40 transition-all outline-none"
                                        placeholder=".png"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-filename-pattern" className="text-ui-9 font-black uppercase tracking-widest text-white/40 px-1">{t('modules:session.deck_module.editor.pattern_label')}</label>
                                    <input 
                                        id="deck-filename-pattern"
                                        value={form.filenamePattern}
                                        onChange={e => form.setFilenamePattern(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-4 text-ui-10 font-mono text-white/60 focus:border-gm-gold/40 transition-all outline-none"
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
                                        className="w-4 h-4 rounded bg-black border-white/10 text-gm-gold focus:ring-gm-gold/30"
                                    />
                                    <label htmlFor="useDiscard" className="text-ui-9 font-black uppercase tracking-widest text-white/40 cursor-pointer">{t('modules:session.deck_module.editor.discard_label')}</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={form.startAtZero}
                                        onChange={e => form.setStartAtZero(e.target.checked)}
                                        id="startAtZero"
                                        className="w-4 h-4 rounded bg-black border-white/10 text-gm-gold focus:ring-gm-gold/30"
                                    />
                                    <label htmlFor="startAtZero" className="text-ui-9 font-black uppercase tracking-widest text-white/40 cursor-pointer">{t('modules:session.deck_module.editor.start_zero_label')}</label>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-gm-gold text-black rounded-xl text-ui-10 font-black uppercase tracking-widest shadow-glow-gold/20 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-gm-gold/50"
                                >
                                    {editingDeckId ? t('modules:session.deck_module.editor.update_btn') : t('modules:session.deck_module.editor.validate_btn')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeckLibrary;
