import React, { useState } from 'react';
import { useCombatStore, type Combatant } from '../useCombatStore';
import { X, Shield, Plus, Minus, PlusCircle, Edit2, Link2, Brain, Crosshair, Sparkles, Loader2 } from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import { gmPrompt } from '../../../stores/useModalStore';
import { useSessionOSStore, type Entity } from '../../session/useSessionOSStore';
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
        applyDamage,
        setTarget,
        setInitiative, // Kept setInitiative as it's used for the initiative input
        addStatus, // Kept addStatus as it's used for adding statuses
        removeStatus // Kept removeStatus as it's used for removing statuses
    } = useCombatStore();

    const { entities, players, customSheetTemplates } = useSessionOSStore();
    
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

    // Calcul de couleur HP
    let hpColorClass = 'text-green-400';
    if (combatant.hp <= 0) hpColorClass = 'text-gray-500';
    else if (combatant.hp <= combatant.hpMax * 0.25) hpColorClass = 'text-red-500';
    else if (combatant.hp <= combatant.hpMax * 0.5) hpColorClass = 'text-yellow-400';

    const handleHpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        updateCombatant(combatant.id, { hp: val });
    };

    const handleInitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        setInitiative(combatant.id, val);
    };

    const isDead = combatant.hp <= 0;

    // Faction styling
    const factionColors = {
        player: 'border-gm-cyan/50 ring-gm-cyan/20 bg-gm-cyan/5',
        enemy: 'border-gm-crimson/50 ring-gm-crimson/20 bg-gm-crimson/5',
        neutral: 'border-amber-500/50 ring-amber-500/20 bg-amber-500/5',
        ally: 'border-emerald-500/50 ring-emerald-500/20 bg-emerald-500/5'
    };
    const factionClass = factionColors[combatant.faction] || factionColors.enemy;

    // Target Info
    const currentTarget = combatants.find(c => c.id === combatant.targetId);

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
        <div className={`relative flex flex-col p-3 mb-2 rounded-xl transition-all duration-300 border ${factionClass} ${isActive ? 'ring-2 ring-white/50 shadow-glow-white scale-[1.02] z-10' : ''
            } ${isDead && !isActive ? 'opacity-50 grayscale' : ''}`}>

            <div className="flex items-center w-full">
                {/* Initiative Input */}
                <div className="flex flex-col items-center mr-5 shrink-0">
                    <span className="text-[10px] text-app-text/50 uppercase font-black tracking-[0.2em] mb-1.5 mr-0.5">INIT</span>
                    <input
                        type="number"
                        value={(!combatant.init || Number.isNaN(combatant.init)) ? '' : combatant.init}
                        placeholder="0"
                        onChange={handleInitChange}
                        className="w-20 h-14 bg-app-bg text-app-text rounded-xl text-center text-2xl font-black border border-app-border shadow-inner focus:ring-2 focus:ring-gm-crimson/50 transition-all"
                    />
                </div>

                {/* Avatar / Icon */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-app-bg flex items-center justify-center border-2 border-gm-crimson/50 shrink-0">
                    <ResolvedImage 
                        src={combatant.avatar} 
                        alt={combatant.name} 
                        className="w-full h-full object-cover" 
                        fallback={<Shield className={combatant.isPlayer ? 'text-gm-violet' : 'text-gm-crimson'} size={24} />}
                    />
                </div>

                {/* Info : Name & Statuses */}
                <div className="flex-1 ml-4 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 relative group/name">
                        <div 
                            className="font-bold text-lg text-app-text truncate max-w-[200px] cursor-pointer hover:text-gm-crimson transition-colors flex items-center gap-2" 
                            title="Cliquer pour renommer"
                            onClick={() => {
                                gmPrompt(`Renommer ${combatant.name} :`, combatant.name, (newName: string) => {
                                    if (newName.trim()) updateCombatant(combatant.id, { name: newName.trim() });
                                });
                            }}
                        >
                            {combatant.name}
                            <Edit2 size={12} className="opacity-0 group-hover/name:opacity-50 transition-opacity" />
                        </div>
                        {combatant.isPlayer && <span className="text-[10px] bg-gm-cyan/20 text-gm-cyan px-1.5 rounded uppercase font-bold">PJ</span>}
                        {!combatant.isPlayer && <span className="text-[10px] bg-gm-crimson/20 text-gm-crimson px-1.5 rounded uppercase font-bold">PNJ</span>}
                        
                        <button
                            className={`text-app-text/50 hover:text-app-text transition-colors p-1 rounded hover:bg-app-surface/50 ${showStatusMenu ? 'text-app-text bg-app-surface/50' : ''}`}
                            onClick={() => setShowStatusMenu(!showStatusMenu)}
                            title="Ajouter une altération d'état"
                        >
                            <PlusCircle size={16} />
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
                                    className="inline-flex items-center gap-1 bg-app-bg px-2 py-0.5 rounded text-xs border border-app-border/50 group cursor-pointer hover:bg-red-500/20"
                                    onClick={() => removeStatus(combatant.id, status.id)}
                                    title="Cliquer pour dissiper"
                                >
                                    <span>{status.icon}</span>
                                    <span className={status.duration > 0 ? "text-app-text/70" : "text-gm-cyan"}>
                                        {status.duration > 0 ? `${status.duration}t` : '∞'}
                                    </span>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Cortex Suggested Action */}
                    {(suggestedAction || isSuggesting) && (
                        <div className="mt-2 text-xs bg-accent/10 border border-accent/20 rounded p-2 text-app-text/80 shadow-inner flex items-start gap-2 relative">
                            {suggestedAction && !isSuggesting && (
                                <button 
                                    onClick={() => setSuggestedAction(null)}
                                    className="absolute -top-1 -right-1 bg-black/60 rounded-full p-0.5 text-app-text/40 hover:text-red-400 transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            )}
                            <Brain size={12} className="text-accent mt-0.5 shrink-0" />
                            <div className="flex-1">
                                {isSuggesting ? (
                                    <span className="text-accent animate-pulse font-medium italic">Le Cortex analyse la situation tactique...</span>
                                ) : (
                                    <span className="italic leading-snug">
                                        {suggestedAction}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Health Control */}
                <div className="flex flex-col items-center mx-4 bg-app-bg/50 rounded-lg p-2 border border-gm-crimson/20 relative group">
                    {combatant.sourcePlayerId && (
                        <div className="absolute -top-1 -right-1 text-accent animate-pulse" title="Synchronisé avec la fiche">
                            <Link2 size={10} />
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            className="text-app-text/40 hover:text-app-text hover:bg-app-surface/50 rounded p-1"
                            onClick={() => updateCombatant(combatant.id, { hp: combatant.hp - 1 })}
                            title="Réduire les PV"
                        >
                            <Minus size={14} />
                        </button>
                        <input
                            type="number"
                            value={combatant.hp ?? 0}
                            onChange={handleHpChange}
                            title="Points de vie actuels"
                            className={`w-14 bg-transparent text-center text-xl font-bold p-0 border-none focus:ring-0 ${hpColorClass}`}
                        />
                        <button
                            className="text-app-text/40 hover:text-app-text hover:bg-app-surface/50 rounded p-1"
                            onClick={() => updateCombatant(combatant.id, { hp: combatant.hp + 1 })}
                            title="Augmenter les PV"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                    <span className="text-xs text-app-text/50 mt-1">/ {combatant.hpMax} PV</span>
                </div>

                {/* Targeting Indicator */}
                <div className="flex flex-col gap-1 min-w-[120px] items-end pr-2 group/target">
                    <div className="flex items-center gap-1.5 text-[8px] font-black text-app-text/30 uppercase tracking-widest">
                        <Crosshair size={10} className={currentTarget ? 'text-gm-cyan animate-pulse' : ''} />
                        <span>Cible</span>
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

            {/* Extra Stats Bars (Dynamic from System) */}
            {activeDriver?.ui_config?.gauges && activeDriver.ui_config.gauges.length > 0 ? (
                <div className="mt-3 flex gap-3 px-2">
                    {activeDriver.ui_config.gauges.map((gaugeConfig: any, idx: number) => {
                        // Extract value from sheetData
                        const sheetData = sourceCharacter?.sheetData as Record<string, string | number> | undefined;
                        const sheetValRaw = sheetData?.[gaugeConfig.fieldId];
                        const val = typeof sheetValRaw === 'number' ? sheetValRaw : parseInt(String(sheetValRaw || 0), 10);
                        
                        // Attempt to find max from template, default to 10
                        let max = 10;
                        const fieldDef = sourceTemplate?.sections.flatMap(s => s.fields).find((f: any) => f.id === gaugeConfig.fieldId);
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
                                <div key={idx} className="flex-1 flex flex-col gap-1">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[8px] font-black uppercase tracking-tighter text-app-text/40">{gaugeConfig.label}</span>
                                        <span className="text-[8px] font-bold text-app-text/60">{val}</span>
                                    </div>
                                    <div className="flex gap-0.5 h-2">
                                        {Array.from({ length: segments }).map((_, sIdx) => (
                                            <div 
                                                key={sIdx}
                                                className={`flex-1 rounded-sm border border-white/5 transition-all duration-300 ${
                                                    sIdx < activeSegments 
                                                        ? (gaugeConfig.color.startsWith('bg-') ? gaugeConfig.color : '') 
                                                        : 'bg-app-bg/50'
                                                }`}
                                                style={{ 
                                                    backgroundColor: sIdx < activeSegments && !gaugeConfig.color.startsWith('bg-') ? gaugeConfig.color : undefined 
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        // Style: Neon (Cyberpunk glow)
                        if (gaugeConfig.style === 'neon') {
                            const color = gaugeConfig.color.startsWith('bg-') ? '' : gaugeConfig.color;
                            return (
                                <div key={idx} className="flex-1 flex flex-col gap-1">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[8px] font-black uppercase tracking-tighter text-app-text/40 drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]">{gaugeConfig.label}</span>
                                        <span className="text-[8px] font-bold text-app-text/60">{val}</span>
                                    </div>
                                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(255,255,255,0.5)] ${gaugeConfig.color.startsWith('bg-') ? gaugeConfig.color : ''}`}
                                            style={{ 
                                                width: `${percent}%`,
                                                backgroundColor: color || undefined,
                                                boxShadow: color ? `0 0 10px ${color}` : undefined
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        // Default Style: Bar
                        return (
                            <div key={idx} className="flex-1 flex flex-col gap-1">
                                <div className="flex justify-between items-center px-0.5">
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-app-text/40">{gaugeConfig.label}</span>
                                    <span className="text-[8px] font-bold text-app-text/60">{val}</span>
                                </div>
                                <div className="h-1 bg-app-bg rounded-full overflow-hidden border border-white/5">
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
                activeDriver && activeDriver.combat.statsToTrack.length > 0 && (
                    <div className="mt-3 flex gap-3 px-2">
                        {activeDriver.combat.statsToTrack
                            .filter(stat => !stat.isMainHP) // show all non-HP tracked stats as fallback gauges
                            .map((stat, idx) => {
                                const sheetData = sourceCharacter?.sheetData as Record<string, string | number> | undefined;
                                const sheetValRaw = sheetData?.[stat.fieldId];
                                const val = typeof sheetValRaw === 'number' ? sheetValRaw : parseInt(String(sheetValRaw || 0), 10);
                                
                                // Attempt to find max from template, default to 10
                                let max = 10;
                                const fieldDef = sourceTemplate?.sections.flatMap(s => s.fields).find((f: any) => f.id === stat.fieldId);
                                if (fieldDef && fieldDef.type === 'number' && fieldDef.defaultValue) {
                                    max = Number(fieldDef.defaultValue);
                                }
                                max = Math.max(max, val > 0 ? val : 10); // Ensure max is at least 10 or current value if higher

                                const percent = Math.min(100, Math.max(0, (val / max) * 100));
                            
                            let barColor = 'bg-indigo-500';
                            if (stat.label.toLowerCase().includes('san')) barColor = 'bg-purple-500';
                            if (stat.label.toLowerCase().includes('mp') || stat.label.toLowerCase().includes('mana')) barColor = 'bg-blue-500';
                            if (stat.label.toLowerCase().includes('xp') || stat.label.toLowerCase().includes('exp')) barColor = 'bg-amber-500';

                            return (
                                <div key={idx} className="flex-1 flex flex-col gap-1">
                                    <div className="flex justify-between items-center px-0.5">
                                        <span className="text-[8px] font-black uppercase tracking-tighter text-app-text/40">{stat.label}</span>
                                        <span className="text-[8px] font-bold text-app-text/60">{val} / {max}</span>
                                    </div>
                                    <div className="h-1 bg-app-bg rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className={`h-full ${barColor} transition-all duration-500 shadow-sm`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
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
