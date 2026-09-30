import React, { useState } from 'react';
import { useCombatStore, type Combatant } from '../useCombatStore';
import { X, Shield, PlusCircle, Edit2, Brain, Crosshair, Sparkles, Loader2, Zap, User, Swords, ShieldCheck, Users, ScrollText } from 'lucide-react';
import { ResolvedImage } from '../../../components/ResolvedImage';
import { Select } from '../../../components/common/Select';
import { gmPrompt, gmCustom } from '../../../stores/useModalStore';
import { useSessionOSStore, type Entity } from '../../session/useSessionOSStore';
import { HealthManager } from '../../session/components/health/HealthManager';
import { estHorsDeCombat, santeAffichee } from '../logic/SanteDuCombattant';
import type { HealthSystem } from '../../session/useSessionOSStore';
import { Bouton } from '../../../components/socle';
import { useRegimeDInterface } from '../../session/hooks/useRegimeDInterface';
import { useTacticalAIStore } from '../../tactical-ai/useTacticalAIStore';
import { aiService } from '../../ai/AIService';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { ficheDuCombattant } from '../logic/ficheDuCombattant';
import { DiceEngine } from '../../dice/DiceEngine';
import { deCourant, ecrireLeDe } from '../../dice/ressourcesDUsure';
import { useDiceStore } from '../../../stores/useDiceStore';
import { useTranslation } from 'react-i18next';

const PRESET_STATUSES = [
    { name: 'poison', icon: '🤢', duration: 3 },
    { name: 'fire', icon: '🔥', duration: 3 },
    { name: 'stunned', icon: '💫', duration: 1 },
    { name: 'prone', icon: '⏬', duration: 0 },
    { name: 'bleeding', icon: '🩸', duration: 3 },
    { name: 'exhausted', icon: '🔋', duration: 5 },
    { name: 'blinded', icon: '🕶️', duration: 2 },
    { name: 'frightened', icon: '😱', duration: 2 },
    { name: 'confused', icon: '🌀', duration: 2 },
    { name: 'charmed', icon: '💖', duration: 5 },
    { name: 'grappled', icon: '⚓', duration: 0 },
    { name: 'restrained', icon: '🕸️', duration: 0 },
    { name: 'hidden', icon: '👤', duration: 0 },
    { name: 'blessed', icon: '✨', duration: 10 },
    { name: 'cursed', icon: '💀', duration: 10 },
    { name: 'cold', icon: '❄️', duration: 3 },
    { name: 'invisible', icon: '👻', duration: 10 },
    { name: 'concentration', icon: '🧠', duration: 0 },
    { name: 'heal', icon: '🩹', duration: 1 },
    { name: 'lightning', icon: '⚡', duration: 1 },
    { name: 'dead', icon: '💀', duration: 0 },
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

    const { t } = useTranslation(['modules', 'common']);
    const regime = useRegimeDInterface();

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
    /*
      **Une seule porte vers la fiche d'un combattant** — voir
      `logic/ficheDuCombattant.ts`. Les deux voies d'affichage de cette carte
      lisaient la fiche differemment : celle des jauges avait son repli vers
      `combatant.sheetData`, celle de `statsToTrack` non. Les adversaires de la
      Fabrique, qui n'ont pas de fiche en campagne, y affichaient donc des
      ZEROS — et un zero se lit comme une valeur, jamais comme une absence de
      lecteur.
    */
    const ficheLue = ficheDuCombattant(
        combatant,
        sourceCharacter as { sheetData?: Record<string, unknown>; templateId?: string } | undefined,
        allTemplates,
        useSessionOSStore.getState().getActiveDriver()?.templateId,
    );
    const sourceTemplate = ficheLue.gabarit ?? undefined;

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

    // L'état calculé fait autorité ; sans jauge ni système de santé, personne
    // n'est déclaré mort faute d'information.
    const isDead = estHorsDeCombat(combatant);

    // Note: factionColors logic is available for future data-driven styling if needed 

    // Target Info
    const currentTarget = combatants.find(c => c.id === combatant.targetId);

    /** Écrire un champ de la fiche, par le chemin de son porteur — PJ, PNJ, ou combattant autonome. */
    const ecrireSurLaFiche = (fieldId: string, newVal: string | number) => {
        if (combatant.isPlayer && combatant.sourcePlayerId) {
            const player = players.find(p => p.characters.some(c => c.id === combatant.sourcePlayerId));
            if (player) {
                updateCharacterSheetData(player.id, combatant.sourcePlayerId, fieldId, newVal);
            }
        } else if (combatant.sourceEntityId) {
            updateEntitySheetData(combatant.sourceEntityId, fieldId, newVal);
        } else {
            // Standalone update
            updateCombatant(combatant.id, { 
                sheetData: { ...(combatant.sheetData || {}), [fieldId]: newVal }
            });
        }
    };

    const handleGaugeClick = (e: React.MouseEvent, fieldId: string, delta: number) => {
        e.preventDefault();
        e.stopPropagation();

        const sheetData = (sourceCharacter?.sheetData || combatant.sheetData) as Record<string, string | number | boolean> | undefined;
        const currentVal = Number(sheetData?.[fieldId] || 0);
        /*
          ⛔ **Un champ qui n'est pas un nombre ne se décrémente pas** (2026-09-30).
          Chez Cthulhu Hack, la Torche vaut « D8 » : `Number("D8")` rend NaN, et
          un clic écrivait NaN dans la fiche — le dé du personnage perdu. Un dé
          de ressource se LANCE (voir `lancerLaRessource`), il ne se compte pas.
        */
        if (!Number.isFinite(currentVal)) return;
        ecrireSurLaFiche(fieldId, Math.max(0, currentVal + delta));
    };

    /*
      **Le dé de ressource, lancé depuis la carte** (Cthulhu Hack, 2026-09-30) :
      un 1 ou un 2 le fait descendre, et la fiche le garde. Même moteur et même
      écriture que Dice-OS et la tablette.
    */
    const lancerLaRessource = (fieldId: string, label: string, de: number) => {
        const res = DiceEngine.rollUsure(de);
        const apres = res.usure!.apres;
        if (apres !== de) ecrireSurLaFiche(fieldId, ecrireLeDe(apres));
        useDiceStore.getState().setLastRoll({
            ...res,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date(),
            title: `${combatant.name} — ${label} d${de}`,
        });
    };

    /** Une ressource à dé d'usure : son dé, en bouton qui le lance. Rien d'autre ne s'y écrit. */
    const deDeRessource = (fieldId: string, label: string, valeur: unknown) => {
        const de = deCourant(valeur);
        if (de === undefined) return null;
        return (
            <button
                key={fieldId}
                type="button"
                disabled={de === null}
                onClick={(e) => { e.stopPropagation(); if (de !== null) lancerLaRessource(fieldId, label, de); }}
                title={de === null ? `${label} : épuisée` : `Lancer ${label} (d${de}) — un 1 ou un 2 la fait descendre`}
                className="flex-1 flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border border-app-border bg-app-bg/50 hover:border-accent/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="text-ui-10 font-black uppercase tracking-wider text-app-muted truncate">{label}</span>
                <span className={`font-mono text-sm font-black ${de === null ? 'text-etat-danger' : 'text-accent'}`}>
                    {de === null ? 'épuisée' : `d${de}`}
                </span>
            </button>
        );
    };

    const handleSuggestAction = async () => {
        setIsSuggesting(true);
        setSuggestedAction(null);
        try {
            const tacticalContext = myAdvices.filter(a => a.type === 'range' || a.type === 'dispel').map(a => a.message).join('. ');
            const prompt = t('modules:ai.prompt', {
                name: combatant.name,
                hp: combatant.hp,
                hpMax: combatant.hpMax,
                ac: combatant.extraStats?.ac?.value || '?',
                statuses: combatant.statuses.map(s => t(`combat.status.presets.${s.name.toLowerCase()}`, { defaultValue: s.name })).join(', ') || t('common:status.none'),
                tacticalContext: tacticalContext || t('combat.card.target_none'),
                target: currentTarget?.name || t('combat.card.target_none')
            });
            
            /*
              **Un conseil de combat n'a pas besoin de tout le lore de la
              campagne** — axe F.3 du plan du 2026-08-07, fait le 2026-08-21.

              Cet appel partait nu : RAG complet ET contexte vivant complet —
              PNJ, indices révélés, historique — pour répondre « que fait ce
              combattant ? » alors que l'invite porte déjà ses points de vie,
              sa CA, ses états, sa cible et sa situation tactique.

              `systemOnly` restreint au corpus du système, et la question trie
              les fiches par sujet depuis le 2026-08-19 : une demande de combat
              ramène les règles de combat. `lite` réduit le contexte vivant au
              groupe et aux PNJ, ce que ce conseil est le seul à devoir savoir.

              C'est du prefill payé à chaque suggestion, en pleine partie, sur
              un geste dont l'intérêt est d'être immédiat.
            */
            const response = await aiService.generateText(prompt, undefined, 'sage', { systemOnly: true }, true);
            setSuggestedAction(response.text.trim());
        } catch (error) {
            console.error("[CombatCard] Erreur Cortex:", error);
            setSuggestedAction(t('combat.messages.ai_unavailable'));
        } finally {
            setIsSuggesting(false);
        }
    };

    /*
      **La hiérarchie de la carte** — phase 4, L1, étape 2 de Combat
      (2026-09-30), d'après la maquette retenue avec Stitch.

      Trois lignes : **qui** (initiative, nom, camp, altérations, cible), **sa
      santé** (la jauge sur toute la largeur, puis les gestes : dégâts, soins,
      fiche, calculer), et **les jauges du jeu** avec leurs chiffres. Avant, tout
      tenait sur une ligne et le panneau de santé débordait sur la colonne de la
      cible (« Magique » par-dessus « Fiche ») ; le nom s'arrêtait à « Roy ».

      ⚠️ **Pas de `<Panneau>` ici** : il coupe ce qui dépasse, et les listes du
      camp et de la cible s'ouvrent en position absolue, sans portail.
    */
    const nomDuCombattant = (
        <button
            type="button"
            className={`min-w-0 max-w-[30ch] truncate text-left font-display font-black text-app-text tracking-tight hover:text-accent transition-colors flex items-center gap-2 group/name ${regime.aLaTable ? 'text-2xl' : 'text-lg'} ${isDead ? 'line-through decoration-2' : ''}`}
            title={`${combatant.name} — ${t('combat.card.rename')}`}
            onClick={() => {
                gmPrompt(t('combat.card.rename_prompt', { name: combatant.name }), combatant.name, (newName: string) => {
                    if (newName.trim()) updateCombatant(combatant.id, { name: newName.trim() });
                });
            }}
        >
            <span className="truncate">{combatant.name}</span>
            <Edit2 size={13} className="shrink-0 opacity-0 group-hover/name:opacity-50 transition-opacity" />
        </button>
    );

    return (
        <article
            data-combattant={combatant.id}
            data-hors-de-combat={isDead ? '' : undefined}
            className={`relative flex flex-col gap-3 p-4 mb-3 rounded-xl border bg-app-surface shadow-sm transition-all duration-500 ${
            isActive ? 'border-accent border-l-4 ring-2 ring-accent/30 shadow-glow-accent/20' : 'border-app-border'
            } ${isDead && !isActive ? 'opacity-75 grayscale' : ''}`}>

            {/* ── 1. Qui : initiative, nom, camp, altérations — et la cible ── */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0">
                <div className="flex flex-col items-center shrink-0 rounded-lg bg-app-bg/50 border border-app-border px-1.5 py-1">
                    <span className="text-ui-10 font-black uppercase tracking-widest text-app-muted">INIT</span>
                    <input
                        type="number"
                        value={(!combatant.init || Number.isNaN(combatant.init)) ? '' : combatant.init}
                        placeholder="0"
                        onChange={handleInitChange}
                        title="Initiative"
                        className={`bg-transparent text-accent text-center font-display font-black outline-none placeholder:text-accent/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${regime.aLaTable ? 'w-16 h-10 text-3xl' : 'w-14 h-9 text-2xl'}`}
                    />
                </div>

                <div className="w-11 h-11 rounded-full overflow-hidden bg-app-bg/50 flex items-center justify-center border border-app-border shrink-0">
                    <ResolvedImage
                        src={combatant.avatar}
                        alt={combatant.name}
                        className="w-full h-full object-cover"
                        fallback={<Shield className={combatant.isPlayer ? 'text-accent' : 'text-gm-crimson'} size={22} />}
                    />
                </div>

                {nomDuCombattant}

                <Select
                    value={combatant.faction}
                    onChange={(value) => updateCombatant(combatant.id, { faction: value as any })}
                    options={[
                        { value: 'player', label: t('combat.card.faction.player'), icon: <User size={12} /> },
                        { value: 'enemy', label: t('combat.card.faction.enemy'), icon: <Swords size={12} /> },
                        { value: 'ally', label: t('combat.card.faction.ally'), icon: <ShieldCheck size={12} /> },
                        { value: 'neutral', label: t('combat.card.faction.neutral'), icon: <Users size={12} /> }
                    ]}
                    className="min-w-[110px]"
                    title={t('combat.card.faction_change')}
                    renderOption={(opt) => (
                        <span className={`text-ui-10 font-black uppercase tracking-wider ${
                            opt.value === 'enemy' ? 'text-etat-danger' :
                            opt.value === 'ally' ? 'text-etat-succes' :
                            opt.value === 'player' ? 'text-etat-info' :
                            'text-app-muted'
                        }`}>
                            {opt.label}
                        </span>
                    )}
                />

                {/* Les altérations, en badges ; un clic les retire. */}
                {combatant.statuses.map(status => (
                    <span
                        key={status.id}
                        className="inline-flex items-center gap-1 bg-app-bg/60 px-2 py-0.5 rounded text-xs border border-app-border cursor-pointer hover:bg-etat-danger/20 transition-colors"
                        onClick={() => removeStatus(combatant.id, status.id)}
                        title={t('combat.card.status_remove', { name: t(`combat.status.presets.${status.name.toLowerCase()}`, { defaultValue: status.name }) })}
                    >
                        <span>{status.icon}</span>
                        <span className={status.duration > 0 ? "text-app-muted" : "text-gm-cyan"}>
                            {status.duration > 0 ? `${status.duration}t` : '∞'}
                        </span>
                    </span>
                ))}

                <button
                    className={`text-app-muted hover:text-accent transition-colors p-1 rounded hover:bg-app-bg/50 ${showStatusMenu ? 'text-accent bg-app-bg/50' : ''}`}
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    title={t('combat.card.status_add')}
                >
                    <PlusCircle size={18} />
                </button>

                {!combatant.isPlayer && (
                    <button
                        className={`text-app-muted hover:text-accent transition-colors p-1 rounded hover:bg-app-bg/50 ${isSuggesting ? 'animate-pulse text-accent' : ''}`}
                        onClick={handleSuggestAction}
                        disabled={isSuggesting}
                        title={t('combat.card.cortex_advice')}
                    >
                        {isSuggesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    </button>
                )}

                {/* Tactical Advice Badge */}
                {myAdvices.length > 0 && (
                    <div
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-ui-10 font-bold uppercase transition-all animate-pulse cursor-help ${
                            hasHighPriority ? 'bg-gm-crimson/20 text-gm-crimson border border-gm-crimson/30' : 'bg-accent/10 text-accent border border-accent/20'
                        }`}
                        title={myAdvices.map(a => a.message).join('\n')}
                    >
                        <Brain size={10} />
                        <span>Tactical</span>
                    </div>
                )}

                <div className="ml-auto flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1.5 text-ui-10 font-black uppercase tracking-widest text-app-muted">
                        <Crosshair size={12} className={currentTarget ? 'text-accent' : ''} />
                        {t('combat.card.target')}
                    </span>
                    <Select
                        value={combatant.targetId || ''}
                        onChange={(value) => setTarget(combatant.id, value || null)}
                        placeholder={t('combat.card.target_none')}
                        options={[
                            { value: '', label: t('combat.card.target_none') },
                            ...combatants
                                .filter(c => c.id !== combatant.id)
                                .map(c => ({
                                    value: c.id,
                                    label: c.name,
                                    icon: <Crosshair size={12} />
                                }))
                        ]}
                        className="w-44"
                        title={t('combat.card.target_select')}
                    />
                    <button
                        className="w-8 h-8 flex items-center justify-center text-app-muted hover:text-etat-danger hover:bg-etat-danger/10 rounded-full transition-colors shrink-0"
                        onClick={() => removeCombatant(combatant.id)}
                        title={t('combat.card.delete')}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Cortex Suggested Action (Absolute Overlay) */}
            {(suggestedAction || isSuggesting) && (
                <div className="absolute bottom-2 left-6 right-6 z-50 text-ui-11 bg-app-surface/95 backdrop-blur-xl border border-accent/40 rounded-lg p-3 text-app-text/90 shadow-2xl flex items-start gap-2 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 cursor-default">
                    {suggestedAction && !isSuggesting && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSuggestedAction(null);
                            }}
                            className="absolute -top-1 -right-1 bg-app-bg/80 rounded-full p-1 text-app-text/60 hover:text-etat-danger transition-colors shadow-lg border border-app-text/10"
                            title={t('combat.card.cortex_close')}
                        >
                            <X size={12} />
                        </button>
                    )}
                    <div className="bg-accent/20 p-1.5 rounded-full shrink-0 animate-pulse border border-accent/30">
                        <Brain size={14} className="text-accent" />
                    </div>
                    <div className="flex-1 pr-4">
                        {isSuggesting ? (
                            <div className="flex flex-col gap-1">
                                <span className="text-accent font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
                                    {t('combat.card.cortex_analyzing')}
                                    <Loader2 size={10} className="animate-spin" />
                                </span>
                                <span className="text-ui-10 text-app-text/40 italic">{t('combat.card.cortex_thinking')}</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <span className="text-accent font-black uppercase tracking-widest text-ui-10 mb-0.5 opacity-80 flex items-center gap-1.5">
                                    <Sparkles size={10} />
                                    {t('combat.card.cortex_title')}
                                </span>
                                <span className="italic leading-normal text-app-text">
                                    {suggestedAction}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── 2. Sa santé, puis les gestes : dégâts, soins, fiche, calculer ── */}
            <HealthManager
                id={combatant.isPlayer ? combatant.sourcePlayerId! : combatant.sourceEntityId!}
                type={combatant.isPlayer ? 'pc' : 'npc'}
                initialHealthSystem={santeAffichee(combatant) as HealthSystem | undefined}
                onHealthChange={(newHealth) => {
                  updateCombatant(combatant.id, { healthSystem: newHealth });
                }}
                disposition="carte"
                /*
                  **Les boutons Dégâts / Soins de cette ligne partent sur la
                  cible** (décision de David, 2026-08-29) : Tom vise Henri,
                  c'est Henri qui encaisse. Sans cible, ils retombent sur le
                  porteur de la ligne, comme avant — la liste des cibles
                  exclut le porteur, donc l'interdire rendrait un combattant
                  intouchable depuis sa propre ligne.

                  La barre de vie, elle, ne suit pas : elle appartient au
                  porteur, et la cliquer parle de lui.
                */
                cibleDesCoups={currentTarget ? {
                  id: (currentTarget.isPlayer ? currentTarget.sourcePlayerId : currentTarget.sourceEntityId) ?? currentTarget.id,
                  type: currentTarget.isPlayer ? 'pc' : 'npc',
                  nom: currentTarget.name,
                  healthSystem: currentTarget.healthSystem,
                  onHealthChange: (newHealth) => {
                    updateCombatant(currentTarget.id, { healthSystem: newHealth });
                  },
                } : null}
                actionsDeCarte={<>
                    {/*
                      **Revoir la fiche — demandé par David le 2026-09-03.**
                      Il n'existait aucun moyen de relire les caractéristiques
                      d'un adversaire fabriqué : elles vivent sur le combattant,
                      et seules les deux ou trois jauges du pilote étaient
                      montrées.
                    */}
                    <Bouton
                        aLaTable={regime.aLaTable}
                        icone={<ScrollText size={14} />}
                        onClick={() => gmCustom('fiche-combattant', { combatantId: combatant.id })}
                        title="Revoir la fiche de ce combattant"
                    >
                        Fiche
                    </Bouton>
                    <Bouton
                        variante="accent"
                        aLaTable={regime.aLaTable}
                        icone={<Zap size={14} className="fill-current" />}
                        onClick={() => {
                            const ids = [combatant.id];
                            if (combatant.targetId) ids.push(combatant.targetId);
                            gmCustom('damage-calc', { targetIds: ids });
                        }}
                        title={t('combat.card.calculate_tooltip')}
                    >
                        {t('combat.card.calculate')}
                    </Bouton>
                </>}
            />

            {activeDriver?.ui_config?.gauges && activeDriver.ui_config.gauges.length > 0 ? (
                <div className="flex gap-6 px-3">
                    {activeDriver.ui_config.gauges.map((gaugeConfig: { fieldId: string; label: string; style: string; color: string }, idx: number) => {
                        // Extract value from sheetData (persistent or local)
                        const sheetData = (sourceCharacter?.sheetData || combatant.sheetData) as Record<string, string | number | boolean> | undefined;
                        const sheetValRaw = sheetData?.[gaugeConfig.fieldId];
                        const ressource = deDeRessource(gaugeConfig.fieldId, gaugeConfig.label, sheetValRaw);
                        if (ressource) return ressource;
                        const val = typeof sheetValRaw === 'number'? sheetValRaw : parseInt(String(sheetValRaw || 0), 10);
                        
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

                        /*
                          **La couleur déclarée vaut pour les trois styles.**

                          Défaut D4 du § 12l : seul `bar` lisait `color`. `segmented` et
                          `neon` peignaient `bg-primary` quoi qu'il arrive — et
                          l'exemple que la Forge produit elle-même combine
                          `segmented` et un héxadécimal, soit exactement le cas
                          ignoré. Une couleur qu'on choisit sans qu'elle s'applique
                          est pire qu'une couleur qu'on ne peut pas choisir.

                          Deux écritures coexistent (une classe Tailwind, un
                          héxadécimal) : la classe passe par `className`, le reste
                          par `style`, jamais les deux.
                        */
                        const couleur = gaugeConfig.color?.trim() ?? '';
                        const couleurEnClasse = couleur.startsWith('bg-');
                        const classeRemplie = couleurEnClasse ? couleur : (couleur ? '' : 'bg-primary');
                        const styleRempli = couleurEnClasse || !couleur ? undefined : { backgroundColor: couleur };
                        /* Le chiffre suit la jauge — sauf quand la couleur est une classe de fond,
                           qui ne dit rien de la couleur du texte : le doré du thème reprend la main. */
                        const styleDuChiffre = styleRempli ? { color: couleur } : undefined;

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
                                        <span className="stitch-label text-app-text">{gaugeConfig.label}</span>
                                        <span className="text-ui-12 font-black text-primary drop-shadow-[0_0_3px_rgba(231,176,8,0.3)]" style={styleDuChiffre}>{val} <span className="opacity-50">/ {max}</span></span>
                                    </div>
                                    <div className="flex gap-1 h-2.5 bg-app-bg/40 p-0.5 rounded-sm border border-app-border/20">
                                        {Array.from({ length: segments }).map((_, sIdx) => (
                                            <div 
                                                key={sIdx}
                                                className={`flex-1 rounded-sm transition-all duration-300 ${
                                                    sIdx < activeSegments 
                                                        ? `${classeRemplie} shadow-glow-gold`
                                                        : 'bg-app-surface/60 border border-app-border/20'
                                                }`}
                                                style={sIdx < activeSegments ? styleRempli : undefined}
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
                                        <span className="stitch-label text-app-text">{gaugeConfig.label}</span>
                                        <span className="text-ui-12 font-black text-primary" style={styleDuChiffre}>{val} <span className="opacity-50">/ {max}</span></span>
                                    </div>
                                    <div className="h-3 bg-app-bg/60 rounded-full overflow-hidden border border-app-border/30 p-[1.5px]">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-glow-gold ${classeRemplie}`}
                                            style={{ width: `${percent}%`, ...styleRempli }}
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
                                    <span className="text-ui-10 font-black uppercase tracking-wider text-app-text/80">{gaugeConfig.label}</span>
                                    <span className="text-ui-10 font-bold text-app-text/90">{val} <span className="opacity-50">/ {max}</span></span>
                                </div>
                                <div className="h-2 bg-app-bg/40 border border-app-border/20 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 shadow-sm ${classeRemplie}`}
                                        style={{ width: `${percent}%`, ...styleRempli }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /*
                  Fallback to legacy stats mapping if no ui_config is present.
                  Rien à suivre : pas de rangée — elle laissait un vide en bas
                  de chaque carte (2026-09-30).
                */
                    (activeDriver?.combat?.statsToTrack ?? []).some(stat => !stat.isMainHP) && <div className="flex gap-6 px-3">
                        {activeDriver?.combat?.statsToTrack
                            .filter(stat => !stat.isMainHP)
                            .map((stat, idx) => {
                                const ressource = deDeRessource(stat.fieldId, stat.label, ficheLue.valeurs[stat.fieldId]);
                                if (ressource) return ressource;
                                const val = Number(ficheLue.valeurs[stat.fieldId] ?? 0);
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
                                            <span className="stitch-label text-app-text/70">{stat.label}</span>
                                            <span className="text-ui-11 font-black text-primary">{val} <span className="opacity-50">/ {max}</span></span>
                                        </div>
                                        <div className="flex gap-1 h-1.5 bg-app-bg/40 p-[1px] rounded-full border border-app-border/20">
                                            {Array.from({ length: segments }).map((_, sIdx) => {
                                                const isFilled = sIdx < activeSegments;
                                                return (
                                                    <div 
                                                        key={sIdx}
                                                        className={`flex-1 rounded-full transition-all duration-300 ${
                                                            isFilled 
                                                                ? 'bg-primary shadow-glow-gold' 
                                                                : 'bg-app-surface/60 border border-app-border/10'
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
                            <span className="text-sm text-app-text/70">{t('combat.status.duration')}</span>
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
                                    title={t('combat.status.infinite')}
                                />
                                <button
                                    className="px-2 py-0.5 bg-app-surface hover:bg-app-surface/80 rounded-r text-app-text"
                                    onClick={() => setCustomDuration(customDuration + 1)}
                                >+</button>
                            </div>
                            <span className="text-xs text-app-text/50 italic ml-2">({t('combat.status.infinite')})</span>
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
                                    <span className="text-app-text/80">{t(`combat.status.presets.${status.name}`)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
};

export default CombatCard;
