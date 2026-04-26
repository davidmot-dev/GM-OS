import React from 'react';
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
    FolderOpen
} from 'lucide-react';
import type { CardFormat, CardOrientation } from '../store/types';
import { useDeckLibrary } from '../hooks/useDeckLibrary';

const DeckLibrary: React.FC = () => {
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
                            <span className="text-gm-gold">Bibliothèque Tactique</span>
                        </h1>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Gestion des paquets de cartes et éléments narratifs</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={() => setShowAllDecks(!showAllDecks)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] tracking-widest uppercase transition-all border ${
                            showAllDecks 
                            ? 'bg-gm-gold/20 border-gm-gold text-gm-gold shadow-glow-gold/10' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20'
                        }`}
                        title={showAllDecks ? "Filtrer par système actif" : "Afficher tous les systèmes"}
                    >
                        <Layers size={14} />
                        {showAllDecks ? 'Tout Voir' : 'Filtre Système'}
                    </button>

                    <button 
                        type="button"
                        onClick={() => { resetForm(); setIsAdding(true); }}
                        className="flex items-center gap-2 bg-gm-gold hover:bg-yellow-500 text-black font-black px-6 py-2.5 rounded-xl text-[10px] tracking-widest uppercase transition-all shadow-glow-gold/20 focus:outline-none focus:ring-2 focus:ring-gm-gold/50"
                    >
                        <Plus size={14} />
                        Nouveau Paquet
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
                                Aucun paquet disponible pour ce système<br/>
                                <span className="text-[10px] opacity-40">(Filtre : Generic + {currentSystemId})</span>
                            </span>
                            {!showAllDecks && (
                                <button 
                                    onClick={() => setShowAllDecks(true)}
                                    className="mt-4 text-[10px] font-black uppercase tracking-widest text-gm-gold hover:underline"
                                >
                                    Afficher tous les paquets
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
                                    <span className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-black text-white/40 uppercase tracking-tighter">
                                        {deck.systemId}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-gm-gold/10 text-[8px] font-black text-gm-gold uppercase tracking-tighter">
                                        {deck.cardCount} cartes
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => handleEdit(deck)}
                                    className="p-2 rounded-lg bg-white/5 text-white/20 hover:text-white transition-all focus:outline-none focus:ring-1 focus:ring-white/20"
                                    title="Modifier la configuration"
                                >
                                    <Settings2 size={14} />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => handleDelete(deck.id)}
                                    className="p-2 rounded-lg bg-white/5 text-white/20 hover:text-red-500 transition-all focus:outline-none focus:ring-1 focus:ring-red-500/40"
                                    title="Supprimer le paquet"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                                {deck.orientation === 'portrait' ? <Smartphone size={12} /> : <Monitor size={12} />}
                                {deck.format} — {deck.orientation}
                            </div>
                            <button 
                                type="button"
                                onClick={() => { handleSelect(deck.id); setCurrentView('deck-player'); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-gm-gold hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all focus:outline-none focus:ring-2 focus:ring-gm-gold/40"
                            >
                                Charger
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
                                {editingDeckId ? 'Modification Deck' : 'Initialisation Deck'}
                            </h3>
                            <button type="button" onClick={resetForm} className="text-white/20 hover:text-white transition-all focus:outline-none"><X size={18} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-name" className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Nom du Paquet</label>
                                    <input 
                                        id="deck-name"
                                        value={form.name}
                                        onChange={e => form.setName(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none"
                                        placeholder="ex: Drama Deck Torg"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-system" className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Référentiel Système</label>
                                    <select 
                                        id="deck-system"
                                        value={form.systemId}
                                        onChange={e => form.setSystemId(e.target.value)}
                                        title="Sélectionner le système de jeu"
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
                                    <label htmlFor="deck-format" className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Format</label>
                                    <select 
                                        id="deck-format"
                                        value={form.format}
                                        title="Format de la carte"
                                        onChange={e => form.setFormat(e.target.value as CardFormat)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-[10px] uppercase font-black tracking-widest focus:border-gm-gold/40 transition-all outline-none"
                                    >
                                        <option value="poker">POKER (2.5x3.5)</option>
                                        <option value="tarot">TAROT (2.75x4.75)</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-orientation" className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Orientation</label>
                                    <select 
                                        id="deck-orientation"
                                        value={form.orientation}
                                        title="Orientation de la carte"
                                        onChange={e => form.setOrientation(e.target.value as CardOrientation)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-[10px] uppercase font-black tracking-widest focus:border-gm-gold/40 transition-all outline-none"
                                    >
                                        <option value="portrait">PORTRAIT</option>
                                        <option value="landscape">PAYSAGE</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-extension-select" className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Extension</label>
                                    <select 
                                        id="deck-extension-select"
                                        value={form.extension}
                                        title="Format de fichier image"
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
                                    <label htmlFor="deck-padding" className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Zero Padding</label>
                                    <select 
                                        id="deck-padding"
                                        value={form.padding}
                                        title="Nombre de chiffres pour la numérotation"
                                        onChange={e => form.setPadding(parseInt(e.target.value))}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none"
                                    >
                                        <option value={0}>Aucun (1, 2, ...)</option>
                                        <option value={2}>2 chiffres (01, 02, ...)</option>
                                        <option value={3}>3 chiffres (001, 002, ...)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="deck-card-count" className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Nombre de Cartes</label>
                                <input 
                                    id="deck-card-count"
                                    type="number"
                                    value={form.cardCount}
                                    onChange={e => form.setCardCount(parseInt(e.target.value) || 0)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs focus:border-gm-gold/40 transition-all outline-none font-black"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="deck-folder-path" className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1 flex items-center gap-2">
                                    <FolderOpen size={10} /> Chemin Assets (Relatif à /public)
                                </label>
                                <input 
                                    id="deck-folder-path"
                                    value={form.folderPath}
                                    onChange={e => form.setFolderPath(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-4 text-[10px] font-mono tracking-tighter text-white/60 focus:border-gm-gold/40 transition-all outline-none"
                                    placeholder="assets/decks/system/deck-id"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-extension-input" className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Extension</label>
                                    <input 
                                        id="deck-extension-input"
                                        value={form.extension}
                                        onChange={e => form.setExtension(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-4 text-[10px] font-mono text-white/60 focus:border-gm-gold/40 transition-all outline-none"
                                        placeholder=".png"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="deck-filename-pattern" className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Pattern Nom ({'{n}'})</label>
                                    <input 
                                        id="deck-filename-pattern"
                                        value={form.filenamePattern}
                                        onChange={e => form.setFilenamePattern(e.target.value)}
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-4 text-[10px] font-mono text-white/60 focus:border-gm-gold/40 transition-all outline-none"
                                        placeholder="card_{n}"
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
                                    <label htmlFor="useDiscard" className="text-[9px] font-black uppercase tracking-widest text-white/40 cursor-pointer">Gérer Défausse</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={form.startAtZero}
                                        onChange={e => form.setStartAtZero(e.target.checked)}
                                        id="startAtZero"
                                        className="w-4 h-4 rounded bg-black border-white/10 text-gm-gold focus:ring-gm-gold/30"
                                    />
                                    <label htmlFor="startAtZero" className="text-[9px] font-black uppercase tracking-widest text-white/40 cursor-pointer">Commencer à 0</label>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-gm-gold text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-glow-gold/20 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-gm-gold/50"
                                >
                                    {editingDeckId ? 'Mettre à jour' : 'Valider'}
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
