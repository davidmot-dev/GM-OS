import React, { useState } from 'react';
import { useCombatStore, type Combatant } from '../useCombatStore';
import { X, Shield, PlusCircle, Edit2, Brain, Crosshair, Sparkles, Loader2, Zap } from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import { gmPrompt, gmCustom } from '../../../stores/useModalStore';
import { useSessionOSStore, type Entity } from '../../session/useSessionOSStore';
import { HealthManager } from '../../session/components/health/HealthManager';
import { useTacticalAIStore } from '../../tactical-ai/useTacticalAIStore';
import { aiService } from '../../ai/AIService';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';

const PRESET_STATUSES = [
    { name: 'Poison', icon: '🤢', duration: 3 },
    { name: 'En feu', icon: '🔥', duration: 3 },
    { name: 'Étourdi', icon: '💫', duration: 1 },
    { name: 'À terre', icon: '⏬', duration: 0 },
    { name: 'Saignement', icon: '🩸', duration: 3 },
    { name: 'Épuisé', icon: '🔋', duration: 5 },
    { name: 'Aveuglé', icon: '🕶️', duration: 2 },
    { name: 'Effrayé', icon: '😱', duration: 2 },
    { name: 'Confus', icon: '🌀', duration: 2 },
    { name: 'Charmé', icon: '💖', duration: 5 },
    { name: 'Agrippé', icon: '⚓', duration: 0 },
    { name: 'Entravé', icon: '🕸️', duration: 0 },
    { name: 'Caché', icon: '👤', duration: 0 },
    { name: 'Béni', icon: '✨', duration: 10 },
    { name: 'Maudit', icon: '💀', duration: 10 },
    { name: 'Froid', icon: '❄️', duration: 3 },
    { name: 'Invisibilité', icon: '👻', duration: 10 },
    { name: 'Concentration', icon: '🧠', duration: 0 },
    { name: 'Soin', icon: '🩹', duration: 1 },
    { name: 'Foudre', icon: '⚡', duration: 1 },
    { name: 'Mort', icon: '💀', duration: 0 },
];

interface CombatCardProps {
    combatant: Combatant;
    isActive: boolean;
}

const CombatCard: React.FC<CombatCardProps> = ({ combatant, isActive }) => {
    const { 
        updateCombatant, 
        removeCombatant, 
        combatants,
        setTarget,
        setInitiative, // Kept setInitiative as it's used for the initiative input
        addStatus, // Kept addStatus as it's used for adding statuses
        removeStatus // Kept removeStatus as it's used for removing statuses
    } = useCombatStore();

    const { 
        entities, players, customSheetTemplates,
        updateCharacterSheetData, updateEntitySheetData 
    } = useSessionOSStore();
    
    // Source data for dynamic stats
    const sourceCharacter = combatant.isPlayer 
        ? players.flatMap(p => p.characters).find(c => c.id === combatant.sourcePlayerId)
        : (entities as Entity[]).find(e => e.id === combatant.sourceEntityId);
    
    // Fetch template to know the max values for fields if possible
    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...(customSheetTemplates || [])];
    const sourceTemplate = allTemplates.find(t => t.id === sourceCharacter?.templateId);

    const activeDriver = useSessionOSStore.getState().getActiveDriver();
    
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [customDuration, setCustomDuration] = useState<number>(3);

    // AI Suggestions (Cortex)
    const [suggestedAction, setSuggestedAction] = useState<string | null>(null);
    const [isSuggesting, setIsSuggesting] = useState(false);

    // Tactical Brain Integration
    const activeAdvices = useTacticalAIStore((state) => state.activeAdvices);
    const myAdvices = activeAdvices.filter(a => a.sourceId === combatant.id);
    const hasHighPriority = myAdvices.some(a => a.priority >= 1);

    const handleInitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        setInitiative(combatant.id, val);
    };

    const isDead = combatant.hp <= 0;

    // Note: factionColors logic is available for future data-driven styling if needed 

    // Target Info
    const currentTarget = combatants.find(c => c.id === combatant.targetId);

    const handleGaugeClick = (e: React.MouseEvent, fieldId: string, delta: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        const sheetData = sourceCharacter?.sheetData as Record<string, string | number> | undefined;
        const currentVal = Number(sheetData?.[fieldId] || 0);
        const newVal = Math.max(0, currentVal + delta);
        
        if (combatant.isPlayer && combatant.sourcePlayerId) {
            // Correctly find the player ID to which this character belongs
            const player = players.find(p => p.characters.some(c => c.id === combatant.sourcePlayerId));
            if (player) {
                updateCharacterSheetData(player.id, combatant.sourcePlayerId, fieldId, newVal);
            }
        } else if (combatant.sourceEntityId) {
            updateEntitySheetData(combatant.sourceEntityId, fieldId, newVal);
        }
    };

    const handleSuggestAction = async () => {
        setIsSuggesting(true);
        setSuggestedAction(null);
        try {
            const tacticalContext = myAdvices.filter(a => a.type === 'range' || a.type === 'dispel').map(a => a.message).join('. ');
            const prompt = `En tant que Cerveau Tactique de GM-OS, propose de manière extrêmement concise (max 2 phrases) la meilleure action pour le PNJ/Monstre "${combatant.name}". 
            Variables actuelles : PV: ${combatant.hp}/${combatant.hpMax}, Classe d'Armure: ${combatant.extraStats?.ac?.value || 'inconnue'}, Statuts actifs: ${combatant.statuses.map(s => s.name).join(', ') || 'Aucun'}. 
            Contexte de positionnement : ${tacticalContext || 'Cible hors de vue ou aucune donnée de distance'}.
            Environnement: (Cible déclarée: ${currentTarget?.name || 'Aucune'}). 
            Ne mets pas de texte introductif, donne juste directement l'action conseillée en français.`;
            
            const response = await aiService.generateText(prompt);
            setSuggestedAction(response.text.trim());
        } catch (error) {
            console.error("[CombatCard] Erreur Cortex:", error);
            setSuggestedAction("Le Cortex est indisponible pour le moment.");
        } finally {
            setIsSuggesting(false);
        }
    };

    return (
        <div className={`relative flex flex-col p-4 mb-3 transition-all duration-500 stitch-card rounded-xl ${
            isActive ? 'ring-2 ring-primary/40 shadow-glow-gold scale-[1.01] z-10' : ''
            } ${isDead && !isActive ? 'opacity-40 grayscale blur-[0.5px]' : ''}`}>

            <div className="flex items-center w-full">
                {/* Initiative Block */}
                <div className="flex flex-col items-center mr-6 shrink-0 bg-slate-800/40 rounded-lg p-3 border-l-4 border-gm-gold shadow-glow-gold">
                    <span className="stitch-label mb-1">INIT</span>
                    <input
                        type="number"
                        value={(!combatant.init || Number.isNaN(combatant.init)) ? '' : combatant.init}
                        placeholder="0"
                        onChange={handleInitChange}
                        className="w-16 h-12 bg-transparent text-primary text-center text-2xl font-black outline-none transition-all placeholder:text-primary/20"
                    />
                </div>

                {/* Avatar / Icon */}
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800/50 flex items-center justify-center border-2 border-primary/30 ring-4 ring-primary/5 shrink-0 shadow-lg">
                    <ResolvedImage 
                        src={combatant.avatar} 
                        alt={combatant.name} 
                        className="w-full h-full object-cover brightness-110" 
                        fallback={<Shield className={combatant.isPlayer ? 'text-primary' : 'text-gm-crimson'} size={28} />}
                    />
                </div>

                {/* Info : Name & Statuses */}
                <div className="flex-initial ml-6 flex flex-col justify-center min-w-[180px] max-w-[320px]">
                    <div className="flex items-center gap-3 relative group/name">
                        <div 
                            className="font-black text-xl text-white tracking-tight truncate max-w-[220px] cursor-pointer hover:text-primary transition-colors flex items-center gap-2" 
                            title="Cliquer pour renommer"
                            onClick={() => {
                                gmPrompt(`Renommer ${combatant.name} :`, combatant.name, (newName: string) => {
                                    if (newName.trim()) updateCombatant(combatant.id, { name: newName.trim() });
                                });
                            }}
                        >
                            {combatant.name}
                            <Edit2 size={14} className="opacity-0 group-hover/name:opacity-50 transition-opacity" />
                        </div>
                        {combatant.isPlayer && <span className="text-[9px] bg-primary text-slate-900 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">PJ</span>}
                        
                        <div className="relative flex items-center gap-1 group/faction">
                            <select 
                                value={combatant.faction}
                                onChange={(e) => updateCombatant(combatant.id, { faction: e.target.value as 'player' | 'enemy' | 'neutral' | 'ally' })}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter outline-none cursor-pointer border transition-all appearance-none pr-4 ${
                                    combatant.faction === 'enemy' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    combatant.faction === 'ally' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                    combatant.faction === 'player' ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' :
                                    'bg-slate-700 text-slate-300 border-slate-600'
                                }`}
                                title="Changer l'allégeance"
                            >
                                <option value="player">PJ</option>
                                <option value="enemy">Hostile</option>
                                <option value="ally">Allié</option>
                                <option value="neutral">Neutre</option>
                            </select>
                            <div className="absolute right-1 pointer-events-none opacity-40 group-hover/faction:opacity-100">
                                <PlusCircle size={8} />
                            </div>
                        </div>
                        
                        <button
                            className={`text-slate-400 hover:text-primary transition-colors p-1 rounded hover:bg-white/5 ${showStatusMenu ? 'text-primary bg-white/5' : ''}`}
                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                            title="Lancer une altération d'état"
                        >
                            <PlusCircle size={18} />
                        </button>

                        {!combatant.isPlayer && (
                            <button
                                className={`text-app-text/50 hover:text-accent transition-colors p-1 rounded hover:bg-app-surface/50 ${isSuggesting ? 'animate-pulse text-accent' : ''}`}
                                onClick={handleSuggestAction}
                                disabled={isSuggesting}
                                title="Demander conseil au Cortex (Action suggérée)"
                            >
                                {isSuggesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            </button>
                        )}

                        {/* Tactical Advice Badge */}
                        {myAdvices.length > 0 && (
                            <div 
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase transition-all animate-pulse cursor-help ${
                                    hasHighPriority ? 'bg-gm-crimson/20 text-gm-crimson border border-gm-crimson/30' : 'bg-accent/10 text-accent border border-accent/20'
                                }`}
                                title={myAdvices.map(a => a.message).join('\n')}
                            >
                                <Brain size={10} />
                                <span>Tactical</span>
                            </div>
                        )}
                    </div>

                    {combatant.statuses.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {combatant.statuses.map(status => (
                                <span
                                    key={status.id}
                                    className="inline-flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded text-xs border border-white/5 group cursor-pointer hover:bg-red-500/20 transition-colors"
                                    onClick={() => removeStatus(combatant.id, status.id)}
                                    title={`Dissiper l'effet ${status.name}`}
                                >
                                    <span>{status.icon}</span>
                                    <span className={status.duration > 0 ? "text-app-text/70" : "text-gm-cyan"}>
                                        {status.duration > 0 ? `${status.duration}t` : '∞'}
                                    </span>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Cortex Suggested Action (Absolute Overlay) */}
                    {(suggestedAction || isSuggesting) && (
                        <div className="absolute bottom-2 left-6 right-6 z-50 text-[11px] bg-slate-950/90 backdrop-blur-xl border border-accent/40 rounded-lg p-3 text-app-text/90 shadow-2xl flex items-start gap-2 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 motion-safe:scale-100 hover:scale-[1.02] transition-transform cursor-default">
                            {suggestedAction && !isSuggesting && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSuggestedAction(null);
                                    }}
                                    className="absolute -top-1 -right-1 bg-black/80 rounded-full p-1 text-app-text/60 hover:text-red-400 transition-colors shadow-lg border border-white/10"
                                >
                                    <X size={12} />
                                </button>
                            )}
                            <div className="bg-accent/20 p-1.5 rounded-full shrink-0 animate-pulse border border-accent/30 shadow-glow-accent/20">
                                <Brain size={14} className="text-accent" />
                            </div>
                            <div className="flex-1 pr-4">
                                {isSuggesting ? (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-accent font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
                                            Cortex Analyze...
                                            <Loader2 size={10} className="animate-spin" />
                                        </span>
                                        <span className="text-[10px] text-app-text/40 italic">Scénario tactique en cours de calcul...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-accent font-black uppercase tracking-widest text-[9px] mb-0.5 opacity-80 flex items-center gap-1.5">
                                            <Sparkles size={10} />
                                            Conseil Tactique
                                        </span>
                                        <span className="italic leading-normal text-white drop-shadow-sm">
                                            {suggestedAction}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modular Health Manager - Expanded to fill void */}
                <div className="mx-6 flex-1 min-w-[200px] transition-all duration-500">
                  <HealthManager 
                    id={combatant.isPlayer ? combatant.sourcePlayerId! : combatant.sourceEntityId!} 
                    type={combatant.isPlayer ? 'pc' : 'npc'} 
                  />
                </div>

                {/* Targeting Indicator - Compact to leave space for Health */}
                <div className="flex flex-col gap-1.5 min-w-[120px] shrink-0 items-end pr-2 group/target relative">
                    <div className="flex items-center gap-2 stitch-label opacity-60">
                        <Crosshair size={12} className={currentTarget ? 'text-primary animate-pulse' : ''} />
                        <span>CIBLE</span>
                    </div>
                    <select 
                        value={combatant.targetId || ''}
                        onChange={(e) => setTarget(combatant.id, e.target.value || null)}
                        className={`bg-black/40 text-[10px] border rounded px-1 py-0.5 outline-none w-full max-w-[120px] transition-all group-hover/target:border-accent/40 ${
                            currentTarget ? 'text-accent border-accent/20' : 'text-app-text/30 border-app-border/30'
                        }`}
                        title="Sélectionner une cible"
                    >
                        <option value="">Aucune</option>
                        {combatants
                            .filter(c => c.id !== combatant.id)
                            .map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))
                        }
                    </select>

                    {/* Quick Calculator Button */}
                    <button
                        onClick={() => {
                            const ids = [combatant.id];
                            if (combatant.targetId) ids.push(combatant.targetId);
                            gmCustom('damage-calc', { targetIds: ids });
                        }}
                        className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-slate-900/60 border border-primary/50 hover:bg-primary text-primary hover:text-slate-950 rounded-lg text-[10px] font-black transition-all uppercase tracking-[0.2em] shadow-glow-gold/20 active:scale-95"
                        title="Ouvrir le calculateur de dégâts pour ce groupe"
                    >
                        <Zap size={14} className="fill-current" />
                        <span>CALCULER</span>
                    </button>
                    {currentTarget && (
                        <div className="flex items-center gap-1 mt-0.5 max-w-[120px]">
                             <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping shrink-0" />
                             <span className="text-[9px] text-accent font-black uppercase truncate" title={`Cible actuelle : ${currentTarget.name}`}>
                                {currentTarget.name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Delete button */}
                <button
                    className="w-8 h-8 flex items-center justify-center text-app-text/40 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
                    onClick={() => removeCombatant(combatant.id)}
                    title="Supprimer du combat"
                >
                    <X size={18} />
                </button>
            </div>

            {activeDriver?.ui_config?.gauges && activeDriver.ui_config.gauges.length > 0 ? (
                <div className="mt-4 flex gap-6 px-3">
                    {activeDriver.ui_config.gauges.map((gaugeConfig: { fieldId: string; label: string; style: string; color: string }, idx: number) => {
                        // Extract value from sheetData
                        const sheetData = sourceCharacter?.sheetData as Record<string, string | number> | undefined;
                        const sheetValRaw = sheetData?.[gaugeConfig.fieldId];
                        const val = typeof sheetValRaw === 'number' ? sheetValRaw : parseInt(String(sheetValRaw || 0), 10);
                        
                        // Attempt to find max from template, default to 10
                        let max = 10;
                        const fieldDef = sourceTemplate?.sections.flatMap(s => s.fields).find((f: { id: string; type: string; defaultValue?: string | number | boolean }) => f.id === gaugeConfig.fieldId);
                        if (fieldDef && fieldDef.type === 'number' && fieldDef.defaultValue) {
                            max = Number(fieldDef.defaultValue);
                        }
                        // If it's something like Sanity or Stress, the max might be known, but 10 is a safe UI default for grids
                        // We take the max of 10 or the current value if it exceeds 10
                        max = Math.max(max, val > 0 ? val : 10);

                        const percent = Math.min(100, Math.max(0, (val / max) * 100));
                        
                        // Style: Segmented (e.g. for Stress or boxes)
                        if (gaugeConfig.style === 'segmented') {
                            const segments = Math.max(2, Math.min(10, max)); // cap segments for display
                            const activeSegments = Math.round((percent / 100) * segments);
                            
                            return (
                                <div 
                                    key={idx} 
                                    className="flex-1 flex flex-col gap-1.5 cursor-pointer select-none group/gauge"
                                    onClick={(e) => handleGaugeClick(e, gaugeConfig.fieldId, -1)}
                                    onContextMenu={(e) => handleGaugeClick(e, gaugeConfig.fieldId, 1)}
                                    title={`${gaugeConfig.label}: ${val}/${max} (L-Click: -1 | R-Click: +1)`}
                                >
                                    <div className="flex items-center justify-between px-1">
                                        <span className="stitch-label text-slate-200">{gaugeConfig.label}</span>
                                        <span className="text-[12px] font-black text-primary drop-shadow-[0_0_3px_rgba(231,176,8,0.3)]">{val}</span>
                                    </div>
                                    <div className="flex gap-1 h-2.5 bg-slate-900/40 p-0.5 rounded-sm border border-white/5">
                                        {Array.from({ length: segments }).map((_, sIdx) => (
                                            <div 
                                                key={sIdx}
                                                className={`flex-1 rounded-sm transition-all duration-300 ${
                                                    sIdx < activeSegments 
                                                        ? 'bg-primary shadow-glow-gold' 
                                                        : 'bg-slate-800/60 border border-white/5'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        // Style: Neon (Cyberpunk glow)
                        if (gaugeConfig.style === 'neon') {
                            return (
                                <div 
                                    key={idx} 
                                    className="flex-1 flex flex-col gap-1.5 cursor-pointer select-none"
                                    onClick={(e) => handleGaugeClick(e, gaugeConfig.fieldId, -1)}
                                    onContextMenu={(e) => handleGaugeClick(e, gaugeConfig.fieldId, 1)}
                                    title={`${gaugeConfig.label}: ${val}/${max} (L-Click: -1 | R-Click: +1)`}
                                >
                                    <div className="flex justify-between items-center px-1">
                                        <span className="stitch-label text-slate-200">{gaugeConfig.label}</span>
                                        <span className="text-[12px] font-black text-primary">{val}</span>
                                    </div>
                                    <div className="h-3 bg-slate-900/90 rounded-full overflow-hidden border border-white/20 p-[1.5px]">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000 ease-out bg-primary shadow-glow-gold"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        // Default Style: Bar
                        return (
                            <div 
                                key={idx} 
                                className="flex-1 flex flex-col gap-1 cursor-pointer select-none"
                                onClick={(e) => handleGaugeClick(e, gaugeConfig.fieldId, -1)}
                                onContextMenu={(e) => handleGaugeClick(e, gaugeConfig.fieldId, 1)}
                                title={`${gaugeConfig.label}: ${val}/${max} (L-Click: -1 | R-Click: +1)`}
                            >
                                <div className="flex justify-between items-center px-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-app-text/80">{gaugeConfig.label}</span>
                                    <span className="text-[10px] font-bold text-app-text/90">{val}</span>
                                </div>
                                <div className="h-2 bg-app-bg border border-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 shadow-sm ${gaugeConfig.color.startsWith('bg-') ? gaugeConfig.color : ''}`}
                                        style={{ 
                                            width: `${percent}%`,
                                            backgroundColor: gaugeConfig.color.startsWith('bg-') ? undefined : gaugeConfig.color 
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Fallback to legacy stats mapping if no ui_config is present */
                    <div className="mt-4 flex gap-6 px-3">
                        {activeDriver?.combat?.statsToTrack
                            .filter(stat => !stat.isMainHP)
                            .map((stat, idx) => {
                                const sheetData = sourceCharacter?.sheetData as Record<string, string | number> | undefined;
                                const val = Number(sheetData?.[stat.fieldId] || 0);
                                let max = 10;
                                const fieldDef = sourceTemplate?.sections.flatMap(s => s.fields).find((f: { id: string; type: string; defaultValue?: string | number | boolean }) => f.id === stat.fieldId);
                                if (fieldDef && fieldDef.type === 'number' && fieldDef.defaultValue) max = Number(fieldDef.defaultValue);
                                max = Math.max(max, val > 0 ? val : 10);

                                const segments = 10;
                                const activeSegments = Math.round((val / max) * segments);

                                return (
                                    <div 
                                        key={idx} 
                                        className="flex-1 flex flex-col gap-1.5 cursor-pointer select-none group/gauge"
                                        onClick={(e) => handleGaugeClick(e, stat.fieldId, -1)}
                                        onContextMenu={(e) => handleGaugeClick(e, stat.fieldId, 1)}
                                        title={`${stat.label}: ${val}/${max} (L-Click: -1 | R-Click: +1)`}
                                    >
                                        <div className="flex items-center justify-between px-1">
                                            <span className="stitch-label text-slate-200">{stat.label}</span>
                                            <span className="text-[11px] font-black text-primary">{val}</span>
                                        </div>
                                        <div className="flex gap-1 h-1.5 bg-slate-900/40 p-[1px] rounded-full border border-white/5">
                                            {Array.from({ length: segments }).map((_, sIdx) => {
                                                const isFilled = sIdx < activeSegments;
                                                return (
                                                    <div 
                                                        key={sIdx}
                                                        className={`flex-1 rounded-full transition-all duration-300 ${
                                                            isFilled 
                                                                ? 'bg-primary shadow-glow-gold' 
                                                                : 'bg-slate-800/60 border border-white/10' // Increased contrast for empty segments
                                                        }`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
            )}

            {/* Expansible Status Panel */}
            {showStatusMenu && (
                <div className="mt-3 pt-3 border-t border-app-border/50 w-full animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 bg-app-bg/50 p-2 rounded border border-app-border w-fit">
                            <span className="text-sm text-app-text/70">Durée :</span>
                            <div className="flex items-center">
                                <button
                                    className="px-2 py-0.5 bg-app-surface hover:bg-app-surface/80 rounded-l text-app-text"
                                    onClick={() => setCustomDuration(Math.max(0, customDuration - 1))}
                                >-</button>
                                <input
                                    type="number"
                                    min="0"
                                    value={customDuration}
                                    onChange={(e) => setCustomDuration(parseInt(e.target.value) || 0)}
                                    className="w-12 bg-app-bg text-center text-app-text py-0.5 border-y border-app-border outline-none text-sm custom-scrollbar"
                                    title="0 = Infini"
                                />
                                <button
                                    className="px-2 py-0.5 bg-app-surface hover:bg-app-surface/80 rounded-r text-app-text"
                                    onClick={() => setCustomDuration(customDuration + 1)}
                                >+</button>
                            </div>
                            <span className="text-xs text-app-text/50 italic ml-2">(0 = Infini)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_STATUSES.map((status, idx) => (
                                <button
                                    key={idx}
                                    className="flex items-center gap-1.5 bg-app-bg hover:bg-gm-crimson/20 border border-app-border hover:border-gm-crimson/50 px-2 py-1.5 rounded transition-colors text-sm"
                                    onClick={() => {
                                        addStatus(combatant.id, { ...status, duration: customDuration });
                                        setShowStatusMenu(false);
                                    }}
                                >
                                    <span>{status.icon}</span>
                                    <span className="text-app-text/80">{status.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CombatCard;
