import React from 'react';
import { useMapStore, type MapTool, type FogMode } from '../useMapStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { gmConfirm, gmCustom } from '../../../stores/useModalStore';
import {
    Upload, EyeOff, Eye, Paintbrush, Square, Circle,
    Cast, Maximize, Users, MousePointer2, PlusCircle, Trash2, MapPin
} from 'lucide-react';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useHardwareStore } from '../../../stores/useHardwareStore';
import { type MapToken } from '../useMapStore';
import { type Combatant } from '../../combat/useCombatStore';

const ToolButton = ({ tool, currentTool, setTool, icon: Icon, label }: { tool: MapTool, currentTool: MapTool, setTool: (t: MapTool) => void, icon: React.ElementType, label: string }) => {
    const isActive = currentTool === tool;
    return (
        <button
            className={`p-2 rounded flex flex-col items-center justify-center gap-1 transition-colors w-[70px] ${isActive
                ? 'bg-accent shadow-glow-accent text-slate-950'
                : 'bg-app-bg hover:bg-app-surface text-slate-300 border border-app-border/50'
                }`}
            onClick={() => setTool(tool)}
            title={label}
        >
            <Icon size={20} className={isActive ? 'text-slate-950' : 'text-accent'} />
            <span className="text-[10px] uppercase font-bold">{label}</span>
        </button>
    );
};

const ModeButton = ({ mode, fogMode, setFogMode, icon: Icon, label }: { mode: FogMode, fogMode: FogMode, setFogMode: (m: FogMode) => void, icon: React.ElementType, label: string }) => {
    const isActive = fogMode === mode;
    const activeColor = mode === 'reveal' ? 'bg-green-500' : 'bg-red-500';
    const textColor = mode === 'reveal' ? 'text-green-500' : 'text-red-500';
    const shadow = mode === 'reveal' ? 'shadow-[0_0_15px_-3px_rgba(34,197,94,0.4)]' : 'shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]';

    return (
        <button
            className={`flex-1 py-2 flex items-center justify-center gap-2 rounded transition-all border ${isActive
                ? `${activeColor} ${shadow} text-white border-transparent`
                : `bg-app-bg border-app-border hover:bg-app-surface ${textColor}`
                }`}
            onClick={() => setFogMode(mode)}
        >
            <Icon size={18} />
            <span className="font-bold">{label}</span>
        </button>
    );
};

const MapControls: React.FC = () => {
    const {
        mapUrl, setMap,
        setFogDataUrl,
        currentTool, setTool,
        fogMode, setFogMode,
        brushSize, setBrushSize,
        addToken, tokens, clearTokens,
        triggerFogCommand,
        resetView,

        // Grid Settings
        isGridEnabled, setGridEnabled,
        gridSize, setGridSize,
        gridOpacity, setGridOpacity,

        // Projection Actions
        projectionTarget, clearProjectedState
    } = useMapStore();
    const { getDisplayLabel } = useHardwareStore();

    const combatants = useCombatStore(state => state.combatants);
    const { mediaList } = useMediaStore();

    const [isMediaBrowserOpen, setIsMediaBrowserOpen] = React.useState(false);

    const handleMediaSelect = (mediaId: string) => {
        const media = mediaList.find(m => m.id === mediaId);
        if (!media) return;

        const isVideo = media.type === 'video';
        setMap(mediaId, isVideo, media.name.replace(/\.[^/.]+$/, "")); // Pass mediaId directly
        setFogDataUrl(null); // Reset fog on new map
    };

    const handleRevealAll = () => {
        gmConfirm("Voulez-vous RÉVÉLER toute la carte ?", () => {
            triggerFogCommand('reveal_all');
        });
    };

    const handleHideAll = () => {
        gmConfirm("Voulez-vous MASQUER toute la carte ?", () => {
            triggerFogCommand('hide_all');
        });
    };

    const handleClearTokens = () => {
        if (tokens.length === 0) return;
        gmConfirm(`Voulez-vous SUPPRIMER les ${tokens.length} pions de la carte ?`, () => {
            clearTokens();
        });
    };

    const handleClearMap = () => {
        if (!mapUrl) return;
        gmConfirm("Voulez-vous RETIRER la carte actuelle ? Cela supprimera également tous les pions.", () => {
            setMap(null);
            setFogDataUrl(null);
            clearTokens();
        });
    };


    return (
        <aside className="w-80 bg-app-surface border-l border-app-border flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="p-4 border-b border-app-border bg-app-bg/30">
                <h2 className="text-accent font-display font-bold text-xl flex items-center gap-2">
                    <span className="text-2xl">🗺️</span> Map OS
                </h2>
                <p className="text-gray-400 text-xs mt-1">Plateau tactique synchronisé.</p>
            </div>

            {/* Content Array */}
            <div className="p-4 flex flex-col gap-6">

                {/* Import Section */}
                <section>
                    <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-2 font-bold px-1">Carte & Plan</h3>
                    <div className="flex gap-2">
                        <button
                            className="flex-1 bg-app-bg hover:bg-app-surface p-3 rounded-lg flex items-center justify-center gap-2 border border-app-border transition-colors text-sm"
                            onClick={() => setIsMediaBrowserOpen(true)}
                        >
                            <Upload size={18} className="text-accent" />
                            <span>Importer Média</span>
                        </button>
                        {mapUrl && (
                            <button
                                className="bg-rose-500/10 hover:bg-rose-500/20 p-3 rounded-lg flex items-center justify-center border border-rose-500/30 transition-colors text-rose-500"
                                onClick={handleClearMap}
                                title="Retirer la carte"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </section>

                <hr className="border-gray-800" />

                {/* Tools Section */}
                <section>
                    <div className="flex justify-between items-end mb-3 px-1">
                        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold">Outils Fog of War</h3>
                        <div className="flex gap-1">
                            <button
                                className="text-gray-400 hover:text-green-500 transition-colors p-1 flex items-center gap-1"
                                onClick={handleRevealAll}
                                title="Tout révéler"
                            >
                                <Eye size={16} />
                            </button>
                            <button
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 flex items-center gap-1"
                                onClick={handleHideAll}
                                title="Tout masquer"
                            >
                                <EyeOff size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-4">
                        <ModeButton mode="reveal" fogMode={fogMode} setFogMode={setFogMode} icon={Eye} label="Révéler" />
                        <ModeButton mode="hide" fogMode={fogMode} setFogMode={setFogMode} icon={EyeOff} label="Masquer" />
                    </div>

                    {/* Tool Grid */}
                    <div className="flex gap-2 flex-wrap mb-4">
                        <ToolButton tool="move_token" currentTool={currentTool} setTool={setTool} icon={MousePointer2} label="Pions" />
                        <ToolButton tool="brush" currentTool={currentTool} setTool={setTool} icon={Paintbrush} label="Pinceau" />
                        <ToolButton tool="rect" currentTool={currentTool} setTool={setTool} icon={Square} label="Zone" />
                        <ToolButton tool="circle" currentTool={currentTool} setTool={setTool} icon={Circle} label="Rond" />
                        <ToolButton tool="ping" currentTool={currentTool} setTool={setTool} icon={MapPin} label="Ping" />
                    </div>

                    {/* Brush Size Slider */}
                    {currentTool === 'brush' && (
                        <div className="bg-app-bg/20 p-3 rounded border border-app-border">
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                                <span>Taille Pinceau</span>
                                <span className="text-accent font-mono">{brushSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="20"
                                max="200"
                                step="10"
                                value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="w-full accent-accent"
                            />
                        </div>
                    )}
                </section>

                <hr className="border-gray-800" />

                {/* Grid Settings */}
                <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold">Grille Tactique</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isGridEnabled} 
                                onChange={(e) => setGridEnabled(e.target.checked)} 
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                    </div>

                    {isGridEnabled && (
                        <div className="flex flex-col gap-3 bg-app-bg/20 p-3 rounded border border-app-border">
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                    <span>Taille de Grille</span>
                                    <span className="text-accent font-mono">{gridSize}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="200"
                                    step="10"
                                    value={gridSize}
                                    onChange={(e) => setGridSize(parseInt(e.target.value))}
                                    className="w-full h-1 accent-accent bg-gray-700 rounded-lg cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                    <span>Opacité</span>
                                    <span className="text-accent font-mono">{Math.round(gridOpacity * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={gridOpacity}
                                    onChange={(e) => setGridOpacity(parseFloat(e.target.value))}
                                    className="w-full h-1 accent-accent bg-gray-700 rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </section>

                <hr className="border-gray-800" />

                {/* Tokens Section */}
                <section className="flex-1 flex flex-col min-h-[300px]">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <h3 className="text-xs text-slate-400 uppercase tracking-wider font-bold text-gm-emerald">Pions du Combat</h3>
                        <button
                            onClick={handleClearTokens}
                            className={`p-1 rounded transition-colors ${tokens.length > 0 ? 'text-gray-400 hover:text-rose-500' : 'text-gray-700 cursor-not-allowed'}`}
                            title="Vider la carte"
                            disabled={tokens.length === 0}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {combatants.length === 0 ? (
                        <div className="bg-app-bg/10 border border-app-border border-dashed rounded-lg flex flex-col items-center justify-center p-4 text-center">
                                <Users size={32} className="text-gray-600 mb-2" />
                                <p className="text-sm text-gray-500">Aucun combattant actif.</p>
                                <p className="text-xs text-gray-600 mt-1">Ajoutez-les depuis le Combat OS.</p>
                            </div>
                        ) : (
                            combatants.map(combatant => (
                                <MapCombatantItem
                                    key={combatant.id}
                                    combatant={combatant}
                                    tokens={tokens}
                                    addToken={addToken}
                                    setTool={setTool}
                                />
                            ))
                        )}
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 px-1 border-t border-gray-800 pt-2 text-center">
                        Astuce : Modifiez la taille et les stats depuis le Combat OS.
                    </div>
                </section>

                {/* Projection Action */}
                <section className="mt-auto pt-4 border-t border-gray-800 flex flex-col gap-3">
                    {projectionTarget && (
                        <div className="px-1 flex flex-col gap-2">
                            <div className="w-full flex flex-col items-center justify-center gap-1 p-3 bg-accent/10 border border-accent/20 rounded-xl text-accent shadow-inner">
                                <div className="flex items-center gap-2">
                                    <Cast size={16} className="animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">Projection Active</span>
                                </div>
                                <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter tabular-nums truncate max-w-full">Vers : {getDisplayLabel(projectionTarget)}</span>
                            </div>
                            <button
                                onClick={() => {
                                    if (projectionTarget === 'monitor' && window.appBridge?.image?.closeAllDisplays) {
                                        window.appBridge.image.closeAllDisplays();
                                    }
                                    clearProjectedState();
                                }}
                                className="w-full py-1 text-[10px] text-slate-500 hover:text-rose-400 transition-colors uppercase font-bold tracking-widest"
                            >
                                Arrêter la projection
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 px-1">
                        <button
                            onClick={() => gmCustom('map-projection-select')}
                            className={`group flex flex-col items-center justify-center gap-2 p-4 border rounded-xl transition-all shadow-lg ${projectionTarget
                                ? 'bg-app-surface/50 border-app-border text-slate-400'
                                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100 hover:bg-indigo-500/20 active:scale-95'
                                }`}
                        >
                            <Cast className={projectionTarget ? 'text-slate-500' : 'text-accent group-hover:scale-110 transition-transform'} />
                            <span className="text-[10px] font-bold uppercase tracking-tight">Projeter</span>
                        </button>
                        <button
                            onClick={resetView}
                            className="flex flex-col items-center justify-center gap-2 p-4 bg-app-surface/40 hover:bg-app-surface border border-app-border/50 rounded-xl transition-all group shadow-lg"
                        >
                            <Maximize className="text-slate-400 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-tight text-white/80">Recadrer</span>
                        </button>
                    </div>
                </section>

            </div>

            <MediaBrowser 
                isOpen={isMediaBrowserOpen}
                onClose={() => setIsMediaBrowserOpen(false)}
                onSelect={handleMediaSelect}
                allowedTypes={['image', 'video']}
                title="Sélectionner une Carte / Plan"
            />
        </aside>
    );
};

export default MapControls;

interface MapCombatantItemProps {
    combatant: Combatant;
    tokens: MapToken[];
    addToken: (token: Omit<MapToken, 'id'>) => void;
    setTool: (tool: MapTool) => void;
}

const MapCombatantItem: React.FC<MapCombatantItemProps> = ({ combatant, tokens, addToken, setTool }) => {
    const isOnMap = tokens.some(t => t.linkedCombatantId === combatant.id);

    return (
        <div className="flex items-center justify-between p-2 bg-app-bg/30 border border-app-border rounded">
            <div className="flex items-center gap-3 overflow-hidden">
                {combatant.avatar ? (
                    <img src={combatant.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-app-border" />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-app-surface border border-app-border flex items-center justify-center">
                        <span className="text-[10px] uppercase text-gm-crimson">{combatant.name.substring(0, 2)}</span>
                    </div>
                )}
                <span className="text-sm text-slate-200 truncate">{combatant.name}</span>
            </div>
            <button
                disabled={isOnMap}
                onClick={() => {
                    addToken({
                        name: combatant.name,
                        avatar: combatant.avatar || '',
                        x: 200 + Math.random() * 100,
                        y: 200 + Math.random() * 100,
                        size: 1,
                        linkedCombatantId: combatant.id
                    });
                    setTool('move_token');
                }}
                className={`p-1.5 rounded transition-colors ${isOnMap ? 'text-gray-600 cursor-not-allowed' : 'text-gm-emerald hover:bg-gm-emerald/20 hover:text-green-400'}`}
                title={isOnMap ? "Déjà sur la carte" : "Ajouter sur la carte"}
            >
                <PlusCircle size={18} />
            </button>
        </div>
    );
};
