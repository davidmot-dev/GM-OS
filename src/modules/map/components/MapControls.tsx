import React from 'react';
import { useMapStore, type MapTool, type FogMode } from '../useMapStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { gmAlert, gmConfirm } from '../../../stores/useModalStore';
import {
    Upload, EyeOff, Eye, Paintbrush, Square, Circle,
    Save, Users, MousePointer2, PlusCircle, Trash2
} from 'lucide-react';
import { MediaBrowser } from '../../../components/MediaBrowser';
import { useMediaStore } from '../../../stores/useMediaStore';
import { useMediaUrl } from '../../../hooks/useMediaUrl';
import { type MapToken } from '../useMapStore';
import { type Combatant } from '../../combat/useCombatStore';

const ToolButton = ({ tool, currentTool, setTool, icon: Icon, label }: { tool: MapTool, currentTool: MapTool, setTool: (t: MapTool) => void, icon: React.ElementType, label: string }) => {
    const isActive = currentTool === tool;
    return (
        <button
            className={`p-2 rounded flex flex-col items-center justify-center gap-1 transition-colors w-[70px] ${isActive
                ? 'bg-gm-cyan shadow-glow-cyan text-obsidian'
                : 'bg-obsidian hover:bg-obsidian-light text-slate-300 border border-gray-700/50'
                }`}
            onClick={() => setTool(tool)}
            title={label}
        >
            <Icon size={20} className={isActive ? 'text-obsidian' : 'text-gm-cyan'} />
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
                : `bg-obsidian border-gray-700 hover:bg-obsidian-light ${textColor}`
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
        fogDataUrl, setFogDataUrl,
        currentTool, setTool,
        fogMode, setFogMode,
        brushSize, setBrushSize,
        addToken, tokens, clearTokens,
        triggerFogCommand
    } = useMapStore();

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
        gmConfirm("Voulez-vous RETIRER la carte actuelle ?", () => {
            setMap(null);
            setFogDataUrl(null);
        });
    };

    const handleProjectMap = () => {
        const win = window as unknown as { appBridge?: { sendMapUpdate?: (data: unknown) => void } };
        if (win.appBridge && win.appBridge.sendMapUpdate) {
            win.appBridge.sendMapUpdate({
                mapUrl,
                isVideo: mapUrl?.endsWith('mp4') || mapUrl?.endsWith('webm'),
                fogDataUrl,
                tokens
            });
            console.log("Map projectée via IPC.");
        } else {
            console.warn("L'objet window.appBridge.sendMapUpdate n'est pas disponible (Hors mode Desktop).");
            gmAlert("Projection impossible: L'application bureau (Electron/Tauri) n'est pas détectée.");
        }
    };

    return (
        <aside className="w-80 bg-obsidian-dark border-l border-gray-800 flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 bg-obsidian-light/30">
                <h2 className="text-gm-cyan font-display font-bold text-xl flex items-center gap-2">
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
                            className="flex-1 bg-obsidian-light hover:bg-gray-700/60 p-3 rounded-lg flex items-center justify-center gap-2 border border-gray-700 transition-colors text-sm"
                            onClick={() => setIsMediaBrowserOpen(true)}
                        >
                            <Upload size={18} className="text-gm-cyan" />
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
                    </div>

                    {/* Brush Size Slider */}
                    {currentTool === 'brush' && (
                        <div className="bg-obsidian-light/20 p-3 rounded border border-gray-800">
                            <div className="flex justify-between text-xs text-slate-400 mb-2">
                                <span>Taille du pinceau</span>
                                <span>{brushSize}px</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="w-full accent-gm-cyan"
                            />
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
                            <div className="bg-obsidian-light/10 border border-gray-800 border-dashed rounded-lg flex flex-col items-center justify-center p-4 text-center">
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
                <section className="mt-auto">
                    <button
                        className="w-full py-3 bg-gm-cyan hover:bg-cyan-400 text-obsidian rounded font-bold shadow-glow-cyan flex items-center justify-center gap-2 transition-colors"
                        onClick={handleProjectMap}
                    >
                        <Save size={18} />
                        Projeter la Carte
                    </button>
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
    const resolvedAvatar = useMediaUrl(combatant.avatar);
    const isOnMap = tokens.some(t => t.linkedCombatantId === combatant.id);

    return (
        <div className="flex items-center justify-between p-2 bg-obsidian-light/30 border border-gray-800 rounded">
            <div className="flex items-center gap-2 truncate">
                {combatant.avatar && resolvedAvatar ? (
                    <img src={resolvedAvatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-obsidian-dark border border-gray-700 flex items-center justify-center">
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
