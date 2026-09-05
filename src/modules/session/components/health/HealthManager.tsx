import React, { useState } from 'react';
import { useSessionOSStore, type HealthSystem, type PersistenceBadge } from '../../useSessionOSStore';
import { HealthInterpreter } from '../../logic/HealthInterpreter';
import { DamageCalculator } from '../../logic/DamageCalculator';
import { HealthBarDriver } from './HealthBarDriver';
import { ClockDriver } from './ClockDriver';
import { WoundLevelsDriver } from './WoundLevelsDriver';
import { HarmBoxesDriver } from './HarmBoxesDriver';
import { AnatomicalSilhouette, type PartStatus } from './AnatomicalSilhouette';
import { typesDeDegats, nommerLeType } from '../../../combat/logic/TypesDeDegats';
import { Plus, Minus, Heart, Settings2, Swords, Crosshair } from 'lucide-react';

/**
 * **Où partent les coups, quand ce n'est pas sur le porteur de la barre.**
 *
 * Décision de David, 2026-08-29 : sur une ligne de Combat-OS, « Dégâts » et
 * « Soins » frappent **la cible choisie sur cette ligne**, pas le combattant
 * qui la porte. Tom vise Henri : c'est Henri qui encaisse.
 *
 * Deux garde-fous décidés avec lui, et ils tiennent ensemble :
 *
 * 1. **Sans cible, on retombe sur le porteur** — le comportement d'avant. Rien
 *    ne devient inatteignable : la liste des cibles exclut le porteur de la
 *    ligne, donc l'interdire rendrait un combattant intouchable depuis sa
 *    propre ligne.
 * 2. **Le panneau écrit toujours qui il va toucher.** *Une redirection qui ne se
 *    voit pas est un coup porté au mauvais personnage sans que rien ne le dise*
 *    — et c'est irrattrapable en séance, parce qu'on ne le découvre qu'au
 *    prochain regard sur la barre du voisin.
 *
 * La barre de vie, elle, **ne suit pas** : cliquer la barre de Tom touche Tom.
 * C'est sa barre ; le geste dit déjà de qui il parle.
 */
export interface CibleDesCoups {
  /**
   * L'identifiant de la **fiche** visée — personnage ou entité — et non celui
   * du combattant. C'est ce que `storeApplyImpact` attend, et ce que le Combat-OS
   * range dans `sourcePlayerId` / `sourceEntityId`.
   *
   * ⚠ `sourcePlayerId` porte l'identifiant du **personnage**, pas du joueur,
   * malgré son nom. Vérifié dans `useCombatStore` (`sourcePlayerId: pj.id`).
   */
  id: string;
  type: 'pc' | 'npc';
  /** Le nom, écrit à l'écran : voir le garde-fou 2 ci-dessus. */
  nom: string;
  /** Sa santé, quand la cible vit hors du magasin (combattant autonome). */
  healthSystem?: HealthSystem;
  /** Où réécrire sa santé après le coup. */
  onHealthChange?: (newHealth: HealthSystem) => void;
}

interface HealthManagerProps {
  id: string;
  type: 'pc' | 'npc';
  /** Optional: Initial health system if the bearer is not in store (standalone mode) */
  initialHealthSystem?: HealthSystem;
  /** Callback for when health changes (useful for standalone mode updates) */
  onHealthChange?: (newHealth: HealthSystem) => void;
  /**
   * La cible vers qui rediriger les **boutons** Dégâts / Soins.
   *
   * Absente — c'est le cas de la fiche de PNJ, qui n'a pas de notion de cible —
   * le panneau se comporte exactement comme avant.
   */
  cibleDesCoups?: CibleDesCoups | null;
}

export const HealthManager: React.FC<HealthManagerProps> = ({ id, type, initialHealthSystem, onHealthChange, cibleDesCoups }) => {
  const { 
    players, 
    entities, 
    updateCharacterHP,
    updateCharacterMaxHP,
    updateEntityHP,
    updateEntityMaxHP,
    updateCharacterHealth, 
    updateEntityHealth, 
    handleApplyImpact: storeApplyImpact
  } = useSessionOSStore();
  
  const [internalHealth, setInternalHealth] = useState<HealthSystem | null>(null);
  const [impactValue, setImpactValue] = useState(1);
  const [lastImpactType, setLastImpactType] = useState<string | undefined>(undefined);
  /**
   * Le type de dégâts choisi pour le prochain coup.
   *
   * Il **persiste entre deux clics** à dessein : une bagarre au fusil est une
   * suite de coups balistiques, et redemander le type à chaque fois ferait de
   * ce panneau — la porte rapide — une seconde boîte de dialogue.
   *
   * `undefined` tant que le meneur n'a rien choisi : le pilote n'est pas encore
   * lu à cette ligne, et surtout **la liste change avec la campagne**. On résout
   * plus bas, contre la liste du moment.
   */
  const [impactType, setImpactType] = useState<string | undefined>(undefined);
  const [isHealing, setIsHealing] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  /** Ce que le dernier coup n'a pas changé, quand il n'a rien changé. */
  const [sansEffet, setSansEffet] = useState<string | null>(null);

  // Reactive Driver Selector
  const activeDriver = useSessionOSStore(state => {
    const campaign = state.campaigns.find(c => c.id === state.activeCampaignId);
    return campaign ? state.getGameDriver(campaign.system) : null;
  });

  /**
   * **Le porteur de la barre** — celui dont ce panneau montre la santé.
   *
   * Il s'appelait `target`, ce qui devient franchement dangereux depuis qu'une
   * vraie cible existe : deux sens opposés sur le même mot, dans le fichier qui
   * décide qui encaisse. *C'est exactement la classe de confusion que ce projet
   * paie en boucle.* Renommé le 2026-08-29.
   */
  const porteur = type === 'pc'
    ? players.flatMap(p => p.characters).find(c => c.id === id)
    : entities.find(e => e.id === id);

  /** La fiche visée, quand elle existe dans le magasin. */
  const ficheDeLaCible = cibleDesCoups
    ? (cibleDesCoups.type === 'pc'
        ? players.flatMap(p => p.characters).find(c => c.id === cibleDesCoups.id)
        : entities.find(e => e.id === cibleDesCoups.id))
    : undefined;

  /*
    Le choix du meneur est confronté à la liste du jeu courant : changer de
    campagne peut retirer le type retenu, et frapper avec un type que le pilote
    ne connaît plus ne correspondrait à aucune étiquette de résistance.
  */
  const typesDisponibles = typesDeDegats(activeDriver);
  const typeChoisi = impactType && typesDisponibles.includes(impactType)
    ? impactType
    : typesDisponibles[0];

  /**
   * **L'affichage local s'efface dès que le magasin parle.**
   *
   * ⚠ Défaut **préexistant**, trouvé le 2026-08-30 en cherchant pourquoi un soin
   * semblait sans effet. `internalHealth` a la priorité sur la santé du magasin
   * et **n'était jamais remis à zéro** : dès qu'on avait touché une ligne une
   * fois, sa barre cessait définitivement de suivre la fiche.
   *
   * Inoffensif tant que chaque ligne n'était modifiée que par elle-même — le
   * cache local disait alors la même chose que le magasin. **Il ne l'est plus
   * depuis que les coups arrivent d'une autre ligne** : Russ soigne Tom, la
   * fiche de Tom monte, et la barre de Tom reste figée sur sa dernière valeur
   * locale. *La donnée juste et l'écran menteur, encore.*
   *
   * On compare la référence : `handleApplyImpact` construit un nouvel objet à
   * chaque coup. Sans porteur — combattant autonome — rien ne change jamais ici,
   * et le cache local reste seul maître, ce qui est le bon comportement.
   */
  const santeDuMagasin = porteur?.healthSystem;
  React.useEffect(() => {
    if (santeDuMagasin) setInternalHealth(null);
  }, [santeDuMagasin]);

  // 1. Resolve Current Health State
  // Priority: Internal State (Immediate Feedback) > Store Target > initialHealthSystem > Default
  const defaultType = activeDriver?.combat?.defaultHealthType || 'hp';
  
  let health: HealthSystem;
  if (internalHealth) {
    health = internalHealth;
  } else if (porteur?.healthSystem) {
    health = porteur.healthSystem;
  } else if (initialHealthSystem) {
    health = initialHealthSystem;
  } else if (porteur) {
     health = HealthInterpreter.createDefault(defaultType);
  } else {
     health = HealthInterpreter.createDefault(defaultType);
  }

  // NOTE: We don't return null if the bearer is missing, to allow standalone combatants.
  // if (!porteur) return null; // Removed to fix standalone bug

  const triggerImpact = (isRecovery: boolean, partId?: string, versLaCible = false) => {
    /*
      **Le type de dégâts part avec le coup, et il n'est pas décoratif.**

      Ce panneau n'en proposait aucun : `translateRoll` ne recevait que
      `isRecovery` et la localisation, si bien que `DamageImpact.type` restait
      vide sur ce chemin. Deux conséquences, relevées le 2026-08-19 en relisant
      un vrai journal — le fil écrivait « Encaisse **2** » sans jamais dire de
      quoi, et surtout `HealthInterpreter.processResistances` sortait aussitôt
      (`if (!impact.type …) return impact`) : **les résistances et les
      vulnérabilités des fiches étaient purement et simplement ignorées dès
      qu'on frappait par ici.** Le pupitre du tracker, lui, les appliquait.

      Décision de David du 2026-08-19 : une seule règle pour les deux portes.
      Les nombres encaissés par ce chemin peuvent donc changer, et c'est le but.

      **Jamais sur un soin.** `processResistances` l'ignore déjà, mais le récit
      de l'impact, lui, écrirait « Récupère **2** (Physique) ».
    */
    /** Deux états de santé disent-ils la même chose ? Vaut pour les cinq moteurs. */
    const memeEtat = (a: HealthSystem, b: HealthSystem) => JSON.stringify(a) === JSON.stringify(b);

    const impact = DamageCalculator.translateRoll(impactValue, activeDriver?.id || 'generic', {
        isRecovery,
        location: partId,
        ...(isRecovery ? {} : { type: typeChoisi }),
    });
    
    /*
      **Le coup part sur la cible, et alors il ne touche RIEN d'ici.**

      Ni `internalHealth`, ni `onHealthChange`, ni l'animation : ce sont les
      trois choses qui décrivent la barre visible, celle du porteur, et il
      n'encaisse pas. *La donnée juste et l'écran menteur* est le défaut que ce
      projet répare le plus souvent ; le faire exprès serait pire.

      Le retour visuel a bien lieu — **sur la ligne de la cible**, dont la barre
      change parce que le magasin a changé. C'est le bon endroit : on regarde
      celui qui prend le coup.
    */
    if (versLaCible && cibleDesCoups) {
        const avant = ficheDeLaCible?.healthSystem
            ?? cibleDesCoups.healthSystem
            ?? HealthInterpreter.createDefault(defaultType);
        const apres = HealthInterpreter.calculateNextState(avant, impact);

        /*
          **Un seul écrivain, et c'est le magasin quand la cible a une fiche.**

          `handleApplyImpact` met la fiche à jour **et** reflète le résultat sur
          le plateau (`refleterLaFiche`) — c'est précisément ce qui a été ajouté
          le 2026-08-19. Y ajouter un `updateCombatant` rappellerait
          `syncCombatantToSession`, c'est-à-dire *la fonction qui annulait les
          soins ce jour-là* en réécrivant les points de vie périmés du plateau
          par-dessus la fiche.

          Ma première version faisait les deux. Elle ne se voyait pas sur une
          fiche présente — les deux calculs partent de la même base et
          concordent — mais c'était **deux écrivains pour une même vérité**, et
          ce projet n'a jamais gagné à en garder deux.

          `onHealthChange` ne sert donc plus qu'au combattant **autonome**, celui
          qui n'a pas de fiche : là, personne d'autre n'enregistrerait le coup.
        */
        if (ficheDeLaCible) {
            storeApplyImpact(cibleDesCoups.id, cibleDesCoups.type, impact);
        } else {
            cibleDesCoups.onHealthChange?.(apres);
        }

        /*
          **Dire quand le coup ne change rien.** Un soin sur une cible déjà au
          maximum est un `Math.min` qui fait son travail — et à l'écran c'est
          indiscernable d'une panne. *Le silence est ce qui transforme une borne
          correcte en bogue apparent.*
        */
        const sansRien = memeEtat(avant, apres);
        setSansEffet(sansRien
            ? `${cibleDesCoups.nom} : aucun changement — ${isRecovery ? 'déjà au maximum' : 'déjà au plus bas'}`
            : null);
        if (sansRien) setTimeout(() => setSansEffet(null), 5000);
        return;
    }

    // 1. Update Persistent Store if the bearer exists
    if (porteur) {
        storeApplyImpact(id, type, impact);
    }

    // 2. Local Logic for immediate feedback and standalone mode
    const nextHealth = HealthInterpreter.calculateNextState(health, impact);
    setInternalHealth(nextHealth);
    if (onHealthChange) onHealthChange(nextHealth);

    // Visual Feedback
    setLastImpactType(impact.type || 'generic');
    setIsHealing(isRecovery);
    if (!isRecovery) {
        setIsDamaged(true);
        setTimeout(() => setIsDamaged(false), 400);
    }
    
    setTimeout(() => {
        setLastImpactType(undefined);
        setIsHealing(false);
    }, 3000);
  };

  const handleCycleEngine = () => {
    const engines: HealthSystem['type'][] = ['hp', 'clocks', 'anatomy', 'wounds', 'boxes'];
    const currentIndex = engines.indexOf(health.type);
    const nextType = engines[(currentIndex + 1) % engines.length];
    
    const nextHealth = HealthInterpreter.createDefault(nextType);

    if (porteur) {
        if (type === 'pc') {
            const player = players.find(p => p.characters.some(c => c.id === id));
            if (player) updateCharacterHealth(player.id, id, nextHealth);
        } else {
            updateEntityHealth(id, nextHealth);
        }
    }

    setInternalHealth(nextHealth);
    if (onHealthChange) onHealthChange(nextHealth);
  };

  return (
    <div className="flex flex-col gap-2 group/health-manager relative">
      {/* HUD Header (Engine Switcher & Status) */}
      <div className="flex justify-between items-center px-2">
          <button 
            onClick={handleCycleEngine}
            className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-all cursor-pointer group/engine"
            title="Changer de moteur"
          >
            <Settings2 size={10} className="group-hover/engine:rotate-90 transition-transform duration-500" />
            <span className="text-ui-9 font-black uppercase tracking-[0.2em]">
              {health.type === 'hp' && 'Points de Vie'}
              {health.type === 'clocks' && 'Horloges'}
              {health.type === 'anatomy' && 'Anatomie'}
              {health.type === 'wounds' && 'Blessures'}
              {health.type === 'boxes' && 'Stress'}
            </span>
          </button>

          <div className={`px-2 py-0.5 rounded-md text-ui-8 font-black uppercase tracking-widest border transition-all ${
              health.state === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
              health.state === 'dead' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 
              health.state === 'critical' ? 'bg-red-600/20 text-red-500 border-red-500/40 shadow-glow-red/40 animate-pulse' :
              health.state === 'wounded' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
              'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
              {health.state === 'healthy' && 'Stable'}
              {health.state === 'scratched' && 'Égratigné'}
              {health.state === 'wounded' && 'Blessé'}
              {health.state === 'critical' && 'Critique'}
              {health.state === 'dead' && 'K.O'}
          </div>
      </div>

      {/* Main Layout Row (Visual + Controls) */}
      <div className={`flex items-center gap-6 bg-white/[0.03] border border-white/[0.05] p-2 px-4 rounded-2xl hover:bg-white/[0.05] transition-all duration-300 relative 
        ${['anatomy', 'wounds'].includes(health.type) ? 'h-48' : 'h-20'}
        ${isDamaged ? 'animate-gmos-shake animate-gmos-glitch-damage' : ''}
        ${['wounded', 'critical'].includes(health.state) ? 'animate-gmos-pulse-warning select-none' : ''}
        ${health.state === 'dead' ? 'grayscale opacity-50 saturate-0' : ''}
      `}>
        <div 
            className="flex-1 px-1 h-full flex flex-col justify-center min-w-0 cursor-pointer"
            onClick={() => triggerImpact(false)}
            onContextMenu={(e) => {
                e.preventDefault();
                triggerImpact(true);
            }}
            title={cibleDesCoups
                ? `Clic : dégâts sur ${porteur?.name ?? 'ce personnage'} · Clic droit : soins — la barre ne suit PAS la cible`
                : 'Clic gauche : dégâts | Clic droit : soins'}
        >
            {health.type === 'hp' && (
                <HealthBarDriver 
                    current={Number(health.data.current) ?? (porteur as any)?.hp ?? 0}
                    max={Number(health.data.max) ?? (porteur as any)?.maxHp ?? 10}
                    onCurrentChange={(val) => {
                        if (type === 'pc') {
                            const player = players.find(p => p.characters.some(c => c.id === id));
                            if (player) updateCharacterHP(player.id, id, val);
                        } else {
                            updateEntityHP(id, val);
                        }
                    }}
                    onMaxChange={(val) => {
                        if (type === 'pc') {
                            const player = players.find(p => p.characters.some(c => c.id === id));
                            if (player) updateCharacterMaxHP(player.id, id, val);
                        } else {
                            updateEntityMaxHP(id, val);
                        }
                    }}
                    lastDamageType={lastImpactType}
                    isHealing={isHealing}
                />
            )}
            {health.type === 'clocks' && <ClockDriver filled={Number(health.data.filled)} total={Number(health.data.segments)} />}
            {health.type === 'anatomy' && (
                <AnatomicalSilhouette 
                    parts={health.data.parts as Record<string, { status: PartStatus }>} 
                    onPartClick={(partId, isRecovery) => triggerImpact(isRecovery, partId)} 
                />
            )}
            {health.type === 'wounds' && (
                <WoundLevelsDriver 
                    levels={health.data.levels as string[]} 
                    currentIndex={health.data.currentIndex as number} 
                    onLevelClick={(index) => {
                        const nextHealth = {
                            ...health,
                            data: { ...health.data, currentIndex: index },
                            state: index === (health.data.levels as string[]).length - 1 ? 'dead' :
                                   index >= ((health.data.levels as string[]).length / 2) ? 'critical' :
                                   index >= 0 ? 'wounded' : 'healthy'
                        } as HealthSystem;
                        
                        if (type === 'pc') {
                            const player = players.find(p => p.characters.some(c => c.id === id));
                            if (player) updateCharacterHealth(player.id, id, nextHealth);
                        } else {
                            updateEntityHealth(id, nextHealth);
                        }
                    }}
                />
            )}
            {health.type === 'boxes' && (
                <HarmBoxesDriver 
                    boxes={health.data.boxes as { label: string, filled: boolean }[]} 
                />
            )}
        </div>

        {/* Vertical Divider Line (More subtle) */}
        <div className="w-[1px] h-10 bg-white/5 shrink-0" />

        {/* MJ Direct Controls area (Readable & Compact) */}
        <div className="flex-1 flex flex-col items-end justify-center gap-1 px-2">
            {/*
              **Qui va encaisser, écrit noir sur blanc.** Les boutons font 44 px
              et ne peuvent pas porter un nom ; la ligne, si. Sans elle, le
              meneur cliquerait « Dégâts » sur la ligne de Tom en croyant frapper
              Tom, et ne s'en apercevrait qu'au prochain regard sur Henri.
            */}
            {cibleDesCoups && (
                <div
                    className="flex items-center gap-1 text-ui-8 font-black uppercase tracking-widest text-primary/90 pr-1"
                    title={`Les dégâts et les soins de cette ligne partent sur ${cibleDesCoups.nom}`}
                >
                    <Crosshair size={9} className="shrink-0" />
                    <span className="truncate max-w-[120px]">→ {cibleDesCoups.nom}</span>
                </div>
            )}

            {/*
              *Un coup borné à zéro reste un coup sans effet, et le silence le
              fait passer pour une panne.* C'est ce message qui manquait.
            */}
            {sansEffet && (
                <p role="status" className="text-ui-8 font-black uppercase tracking-widest text-amber-400 text-right max-w-[190px] leading-tight">
                    {sansEffet}
                </p>
            )}

            {/* Action buttons (Stacked Icon + Value) */}
            <div className="flex items-center gap-3 bg-black/40 p-1 px-2 rounded-xl border border-white/10">
                <button
                  onClick={() => triggerImpact(false, undefined, true)}
                  className="flex flex-col items-center justify-center w-11 h-11 rounded-lg hover:bg-rose-500/20 transition-all group/dmg"
                  title={cibleDesCoups ? `Infliger dégâts à ${cibleDesCoups.nom}` : 'Infliger dégâts'}
                >
                    <Swords size={18} className="text-rose-500 group-hover/dmg:rotate-12 transition-transform" />
                    <span className="text-ui-7 font-black uppercase tracking-widest text-rose-500/80">Dégats</span>
                </button>
                
                {/* Impact value display area */}
                <div className="flex flex-col items-center min-w-[60px] gap-0.5">
                   <input 
                        type="number" 
                        value={impactValue} 
                        onChange={(e) => setImpactValue(parseInt(e.target.value) || 1)}
                        className="w-14 bg-transparent text-center font-display font-black text-xl outline-none text-white focus:text-accent transition-all p-0 m-0 leading-none"
                        style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                        title="Intensité"
                    />
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setImpactValue(v => Math.max(1, v - 1))} 
                            className="text-white/40 hover:text-white transition-colors p-1"
                            title="Moins"
                        >
                            <Minus size={14} />
                        </button>
                        <button 
                            onClick={() => setImpactValue(v => v + 1)} 
                            className="text-white/40 hover:text-white transition-colors p-1"
                            title="Plus"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                {/*
                  Le type se choisit ici, à côté de l'intensité, et non dans une
                  boîte à part : c'est le même geste, et ce panneau est la porte
                  rapide. Il ne concerne que les dégâts — un soin l'ignore.
                */}
                <select
                    value={typeChoisi}
                    onChange={(e) => setImpactType(e.target.value)}
                    className="max-w-[92px] bg-black/40 border border-white/10 rounded-lg px-1.5 py-1 text-ui-9 font-black uppercase tracking-wider text-slate-300 outline-none focus:border-primary/50 transition-colors cursor-pointer"
                    title="Type de dégâts — appliqué aux résistances de la fiche"
                >
                    {typesDisponibles.map(jeton => (
                        <option key={jeton} value={jeton} className="bg-slate-900 normal-case">
                            {nommerLeType(jeton)}
                        </option>
                    ))}
                </select>

                <button
                  onClick={() => triggerImpact(true, undefined, true)}
                  className="flex flex-col items-center justify-center w-11 h-11 rounded-lg hover:bg-emerald-500/20 transition-all group/heal"
                  title={cibleDesCoups ? `Soigner ${cibleDesCoups.nom}` : 'Soigner'}
                >
                    <Heart size={18} className="text-emerald-400 group-hover/heal:scale-110 transition-transform" />
                    <span className="text-ui-7 font-black uppercase tracking-widest text-emerald-400/80">Soins</span>
                </button>
            </div>
        </div>

        {/* Overlay Badges */}
        {health.badges && health.badges.length > 0 && (
            <div className="absolute top-1 right-3 flex gap-1 pt-1 pr-1">
                {health.badges.slice(0, 5).map((badge: PersistenceBadge) => (
                    <div key={badge.id} className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-glow-accent" title={badge.label} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default HealthManager;
