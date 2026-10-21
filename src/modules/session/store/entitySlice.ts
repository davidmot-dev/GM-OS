/**
 * Session-OS Store — Entity Slice
 *
 * Gère toutes les entités de jeu (PNJ, Monstres, PJ).
 * Intègre le système de santé modulaire via HealthInterpreter.
 *
 * @module session/store/entitySlice
 */

import type { CreateurDeSlice } from './contratDesSlices';
import type { Scene } from '../../../types/trame.types';
import { premiereFoisVu } from '../logic/ecranDeScene';
import { actualiserPersonnageDeVoyageur } from '../logic/ficheDeVoyageur';
import { projeterSanteVoyageur } from '../logic/santeDuVoyageur';
import i18next from 'i18next';
import { gmToast } from '../../../stores/useToastStore';
// import { useJournalStore } from '../../journal/useJournalStore'; // Broken by circular dependency
import { HealthInterpreter, listeOuVide } from '../logic/HealthInterpreter';
import { raconterLImpact } from '../../combat/logic/RecitDeLImpact';
import { dommagesDeTorg, ajouterLeChoc, direLesDommages } from '../../combat/logic/dommagesDeTorg';
import { cosmsDesIds, idsDesCosmsCourants, loiEnVigueur } from '../logic/cosmsCourants';
import { champDeSantePrincipale, maximumDeLaJauge, santeAlignee, santePrincipaleDeLaFiche, valeurDuChamp } from '../../combat/logic/SanteDuCombattant';
import { santePrincipaleDuPersonnage } from '../logic/santePrincipale';
import { CLE_PANIQUE_ALIEN, arreterLaPaniqueAlien, changerLeStressAlien } from '../../dice/systemes/paniqueAlien';
import { CLE_JET_ALIEN } from '../../dice/systemes/jetsAlien';
import { CLE_COMBAT_ALIEN, demanderUnCritique, lireLeCombatAlien } from '../../dice/systemes/combatAlien';
import { estUnAndroide } from '../../dice/systemes/paniqueAlien';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { piloteDuPersonnage } from '../logic/piloteDuPersonnage';
import { santeSelonLeJeu } from '../logic/santeDesAdversaires';
import { transfererLePersonnage } from '../logic/transfertDePersonnage';
import { tousLesPilotes } from './tousLesPilotes';
import type { GameDriver } from '../../../types/drivers';
import type { Campaign } from '../../../types/campaign.types';
import type {
    Entity,
    Player,
    PlayerCharacter,
    HealthSystem,
    EntityRelation,
    PersistenceBadge,
    DamageImpact,
} from './types';

/**
 * Le plateau de combat, atteint par le global.
 *
 * Un import direct fermerait un cycle entre les deux stores — c'est le même
 * accès que celui déjà retenu par `clotureDeSeance` et par `useCombatStore`
 * lui-même dans l'autre sens. On n'y déclare que ce qu'on appelle : hors combat
 * il n'y a pas de plateau, et chaque appel doit pouvoir ne rien trouver.
 */
const plateauDeCombat = () => (window as unknown as {
    useCombatStore?: {
        getState: () => {
            /** La scène à laquelle le combat en cours est rattaché, s'il l'est. */
            sceneId?: string | null;
            noterUnCoup?: (cibleId: string, impact: DamageImpact) => void;
            refleterLaFiche?: (
                cibleId: string,
                sante: { hp?: number; healthSystem?: HealthSystem; sheetData?: Record<string, string | number | boolean> },
            ) => void;
        };
    };
}).useCombatStore?.getState();

/**
 * Accorde le système de santé aux points de vie, quand il y en a.
 *
 * **`currentHp` et `maxHp` sont devenus facultatifs le 2026-08-15** : les
 * points de vie ne sont que le détail d'un modèle sur cinq. Sans eux, il n'y a
 * rien à accorder — on rend le système existant tel quel plutôt que d'y écrire
 * des `undefined`, ce qui produirait un état calculé sur `NaN`.
 */
export function syncHealthSystem(currentHp: number | undefined, maxHp: number | undefined, existingHealth?: HealthSystem): HealthSystem | undefined {
    if (typeof currentHp !== 'number' || typeof maxHp !== 'number' || maxHp <= 0) {
        return existingHealth;
    }
    // If there's an existing system that isn't HP, do not override it.
    if (existingHealth && existingHealth.type !== 'hp') {
        return existingHealth;
    }
    const health = existingHealth || HealthInterpreter.createDefault('hp');
    return {
        ...health,
        data: { ...health.data, current: currentHp, max: maxHp },
        state: currentHp <= 0 ? 'dead' : (currentHp / maxHp) <= 0.25 ? 'critical' : (currentHp / maxHp) <= 0.5 ? 'wounded' : 'healthy'
    };
}

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────

export interface EntitySliceState {
    entities: Entity[];
    players: Player[];
}

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export interface EntitySliceActions {
    // Entities (NPC / Monsters)
    addEntity: (entity: Omit<Entity, 'id'>) => void;
    updateEntity: (id: string, updates: Partial<Entity>) => void;
    deleteEntity: (id: string) => void;
    updateEntityHP: (entityId: string, hp: number) => void;
    updateEntityMaxHP: (entityId: string, maxHp: number) => void;
    updateEntityHealth: (entityId: string, health: HealthSystem) => void;
    /**
     * Montre ou cache un PNJ aux joueurs. La première fois qu'il est montré,
     * il reste « vu », avec la scène — celle donnée, sinon une scène en cours
     * qui le compte parmi ses PNJ.
     */
    toggleEntityVisibility: (entityId: string, sceneId?: string) => void;
    /**
     * Retient que les joueurs ont rencontré ce PNJ, sans le montrer aux tablettes
     * — la première fois seulement. Appelé quand son portrait est projeté
     * (David, 2026-10-13 : « projeter = rencontrer »). Un PJ n'est jamais marqué.
     */
    marquerRencontre: (entityId: string, sceneId?: string) => void;
    updateEntitySheetData: (id: string, fieldId: string, value: string | number | boolean) => void;
    autoSelectFirstEntity: () => void;

    // Players & Characters
    addPlayer: (player: Omit<Player, 'id'>) => void;
    deletePlayer: (playerId: string) => void;
    togglePlayerOnline: (playerId: string) => void;
    updatePlayer: (playerId: string, updates: Partial<Player>) => void;
    addCharacterToPlayer: (playerId: string, character: Omit<PlayerCharacter, 'id'>) => void;
    deleteCharacter: (playerId: string, characterId: string) => void;
    /**
     * **Faire passer un personnage d'un joueur à un autre.**
     *
     * Rend le motif du refus, ou `null` si le transfert a eu lieu — l'écran a
     * besoin de savoir pourquoi rien n'a bougé. La règle vit dans
     * `logic/transfertDePersonnage.ts`.
     */
    transfererLePersonnage: (
        deJoueurId: string,
        versJoueurId: string,
        personnageId: string,
    ) => import('../logic/transfertDePersonnage').RefusDeTransfert | null;
    linkCharacterToCampaign: (playerId: string, characterId: string, campaignId: string | null, templateId?: string) => void;
    updateCharacterHP: (playerId: string, characterId: string, hp: number) => void;
    updateCharacterMaxHP: (playerId: string, characterId: string, maxHp: number) => void;
    updateCharacterHealth: (playerId: string, characterId: string, health: HealthSystem) => void;
    updateCharacter: (playerId: string, characterId: string, updates: Partial<PlayerCharacter>) => void;
    updateCharacterSheetData: (playerId: string, characterId: string, fieldId: string, value: string | number | boolean) => void;
    updateCharacterVisuals: (playerId: string, characterId: string, updates: { portraitUrl?: string; tokenUrl?: string }) => void;
    updateCharacterNarrative: (playerId: string, characterId: string, updates: { description?: string; gmNotes?: string; playerNotes?: string; linkedDocumentIds?: string[]; inventory?: string }) => void;
    remoteUpdateCharacterNarrative: (playerId: string, characterId: string, updates: { description?: string; playerNotes?: string; inventory?: string }) => void;
    remoteUpdateCharacterSheetData: (playerId: string, characterId: string, updates: { sheetData?: Record<string, unknown>; description?: string; playerNotes?: string; inventory?: string; inventoryItems?: import('./types').InventoryItem[] }) => void;
    addLootToCharacter: (playerId: string, characterId: string, item: string) => void;
    updateCharacterHubOptions: (playerId: string, characterId: string, options: Partial<PlayerCharacter['hubOptions']>) => void;
    remoteUpdateCharacterVitals: (playerId: string, characterId: string, updates: { hp?: number; mp?: number; ap?: number }) => void;

    // Inventory Management (Structured)
    addInventoryItem: (playerId: string, characterId: string, item: Omit<import('./types').InventoryItem, 'id'>) => void;
    removeInventoryItem: (playerId: string, characterId: string, itemId: string) => void;
    remoteRemoveInventoryItem: (playerId: string, characterId: string, itemId: string) => void;

    // Health / Impact System
    handleApplyImpact: (targetId: string, targetType: 'pc' | 'npc', impact: DamageImpact) => void;
    addPersistenceBadge: (targetId: string, targetType: 'pc' | 'npc', badge: Omit<PersistenceBadge, 'id'>) => void;
    removePersistenceBadge: (targetId: string, targetType: 'pc' | 'npc', badgeId: string) => void;

    // Social Graph
    addRelation: (sourceId: string, sourceType: 'pc' | 'npc', relation: EntityRelation) => void;
    removeRelation: (sourceId: string, sourceType: 'pc' | 'npc', targetId: string) => void;
}

export type EntitySlice = EntitySliceState & EntitySliceActions;

// ─────────────────────────────────────────────
// Creator
// ─────────────────────────────────────────────

/**
 * **Une écriture touche-t-elle les données que la fiche HTML reflète ?**
 * `sheetData`, le narratif, l'inventaire — c'est d'eux que `donneesModifieesLe`
 * date la dernière écriture, pour arbitrer avec la fiche (option A de David,
 * 2026-10-03 : *« la dernière écriture gagne »*). Le portrait ou les PV seuls ne
 * comptent pas : la fiche n'en dit rien.
 */
const CLES_DES_DONNEES = ['sheetData', 'description', 'gmNotes', 'playerNotes', 'inventory', 'inventoryItems'] as const;
const toucheLesDonnees = (updates: Partial<PlayerCharacter>) => CLES_DES_DONNEES.some(k => k in updates);

export const createEntitySlice: CreateurDeSlice<EntitySlice> = (set, get) => ({
    // Initial State
    entities: [],
    players: [],

    // ─── Entities ────────────────────────────────

    addEntity: (entity) => {
        const defaultAvatar = 'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=NPC&backgroundColor=b6e3f4';

        /*
          **Tout adversaire naît avec le mécanisme de santé de son jeu, quel que
          soit l'écran qui le crée.**

          Demandé par David le 2026-08-15 : *« peux-tu utiliser le même modèle
          quand je crée un PNJ de zéro ? »* — et la question porte plus loin
          qu'elle n'en a l'air. **Trois chemins** créent des adversaires : le
          formulaire, l'export depuis NPC-OS (`NPCCard`), et la Forge de
          chronique. Deux le faisaient déjà ; le troisième écrivait `hp: 10,
          ac: 10, speed: 30` et aucun modèle.

          C'est le geste que `addCombatant` a déjà fait pour le combat : *huit
          écrans ajoutent des combattants et un seul connaît le pilote — on
          complète à cet endroit unique plutôt que d'en instruire sept, et
          surtout plutôt que d'en oublier un.* Ici il y en avait trois, et le
          quatrième à venir aurait été muet lui aussi.

          On ne complète **que ce qui manque** : le formulaire pose un seuil de
          défaite choisi par le meneur, qui vaut mieux que le plancher du pilote.
        */
        const pilote = entity.healthSystem ? null : (() => {
            /*
              Les campagnes et les pilotes vivent dans d'autres tranches du même
              store : `get()` les porte à l'exécution, mais son type ne connaît
              que celle-ci. On élargit ici plutôt que d'importer les autres
              tranches, ce qui fermerait un cycle.
            */
            const etat = get() as unknown as { campaigns?: Campaign[]; customGameDrivers?: GameDriver[] };
            const campagne = (etat.campaigns ?? []).find(c => c.id === entity.campaignId);
            return tousLesPilotes(etat.customGameDrivers ?? []).find(d => d.id === campagne?.system) ?? null;
        })();

        const newEntity: Entity = {
            ...entity,
            healthSystem: entity.healthSystem ?? santeSelonLeJeu(pilote, entity),
            avatar: entity.avatar || defaultAvatar,
            id: `e-${Date.now()}`
        };
        set((state) => ({ entities: [...state.entities, newEntity] }));
        gmToast(i18next.t('modules:session.toasts.entity_created', { name: newEntity.name }), 'success');
    },

    updateEntity: (id, updates) =>
        set((state) => ({
            entities: state.entities.map((e) => {
                if (e.id !== id) return e;
                const sheetData = updates.sheetData && e.sheetData?.[CLE_COMBAT_ALIEN] && !Object.hasOwn(updates.sheetData,CLE_COMBAT_ALIEN)
                    ? { ...updates.sheetData, [CLE_COMBAT_ALIEN]:e.sheetData[CLE_COMBAT_ALIEN] } : updates.sheetData;
                const base = { ...e, ...updates, ...(sheetData ? {sheetData} : {}) };
                const newEntity = base.sheetData?.__rddSante231 ? actualiserPersonnageDeVoyageur(base,
                    (get() as unknown as {customSheetTemplates?: SheetTemplate[]}).customSheetTemplates ?? [],e) : base;

                // Auto-sync HealthSystem
                const currentVal = updates.hp !== undefined ? updates.hp : newEntity.hp;
                const maxVal = updates.maxHp !== undefined ? updates.maxHp : newEntity.maxHp;
                newEntity.healthSystem = projeterSanteVoyageur(newEntity.sheetData ?? {},syncHealthSystem(currentVal, maxVal, newEntity.healthSystem));
                if (newEntity.healthSystem?.data.rdd) newEntity.status = (newEntity.healthSystem.data.rdd as {mort:boolean}).mort ? 'dead' : newEntity.healthSystem.state === 'healthy' ? 'alive' : 'injured';

                return newEntity;
            }),
        })),

    deleteEntity: (id) => {
        const entity = get().entities.find((e) => e.id === id);
        set((state) => ({ entities: state.entities.filter((e) => e.id !== id) }));
        if (entity) gmToast(i18next.t('modules:session.toasts.entity_deleted', { name: entity.name }), 'info');
    },

    updateEntityHP: (entityId: string, hp: number) =>
        set((state) => ({
            entities: state.entities.map((e) => {
                if (e.id !== entityId) return e;
                
                // Calcul du nouvel état de santé
                const nextHp = e.sheetData?.__rddSante231 ? hp : Math.max(0, hp);
                const status = nextHp <= 0 ? 'dead' : nextHp < e.maxHp * 0.25 ? 'injured' : 'alive';
                
                // Préparation de la mise à jour
                const updated = { ...e, hp: nextHp, status } as Entity;
                if (e.sheetData?.__rddSante231) updated.sheetData = {...e.sheetData,vie:nextHp};

                // Synchronisation forcée du HealthSystem
                updated.healthSystem = projeterSanteVoyageur(updated.sheetData ?? {},syncHealthSystem(nextHp, e.maxHp, e.healthSystem));
                if (updated.healthSystem?.data.rdd) updated.status = (updated.healthSystem.data.rdd as {mort:boolean}).mort ? 'dead' : updated.healthSystem.state === 'healthy' ? 'alive' : 'injured';
                
                return updated;
            }),
        })),

    updateEntityMaxHP: (entityId: string, maxHp: number) =>
        set((state) => ({
            entities: state.entities.map((e) => {
                if (e.id !== entityId) return e;
                
                const nextMax = Math.max(1, maxHp);
                const updated = { ...e, maxHp: nextMax } as Entity;

                // Synchronisation forcée du HealthSystem
                updated.healthSystem = syncHealthSystem(e.hp, nextMax, e.healthSystem);
                return updated;
            }),
        })),

    updateEntityHealth: (entityId: string, health) =>
        set((state) => ({
            entities: state.entities.map((e) => {
                if (e.id !== entityId) return e;
                const updated = { ...e, healthSystem: health } as Entity;
                // Sync back to standard HP fields if type is HP
                if (health.type === 'hp') {
                    updated.hp = Number(health.data.current) || 0;
                    updated.maxHp = Number(health.data.max) || 10;
                    updated.status = updated.hp <= 0 ? 'dead' : updated.hp < updated.maxHp * 0.25 ? 'injured' : 'alive';
                }
                return updated;
            }),
        })),

    toggleEntityVisibility: (entityId, sceneId) =>
        set((state) => ({
            entities: state.entities.map((e) => {
                if (e.id !== entityId) return e;
                const montre = !e.isVisibleByPlayers;
                return {
                    ...e,
                    isVisibleByPlayers: montre,
                    ...(montre && !e.vuParLesJoueurs
                        /* Les scènes vivent dans la tranche de la trame : ce `set` reçoit
                           le magasin entier, la tranche n'en connaît que sa part. */
                        ? { vuParLesJoueurs: premiereFoisVu(e, (state as { scenes?: Scene[] }).scenes ?? [], Date.now(), sceneId) }
                        : {}),
                };
            })
        })),

    marquerRencontre: (entityId, sceneId) =>
        set((state) => {
            const cible = state.entities.find(e => e.id === entityId);
            if (!cible || cible.type === 'pc' || cible.vuParLesJoueurs) return {};
            const vu = premiereFoisVu(cible, (state as { scenes?: Scene[] }).scenes ?? [], Date.now(), sceneId);
            return { entities: state.entities.map(e => e.id === entityId ? { ...e, vuParLesJoueurs: vu } : e) };
        }),

    updateEntitySheetData: (id, fieldId, value) => {
        const entite = get().entities.find(e => e.id === id);
        if (entite?.sheetData?.__rddSante231) {
            get().updateEntity(id,{sheetData:{...entite.sheetData,[fieldId]:value}});return;
        }
        set((state) => ({
            entities: state.entities.map((e) =>
                e.id === id ? { ...e, sheetData: { ...e.sheetData, [fieldId]: value } } : e
            ),
        }));
    },

    autoSelectFirstEntity: () => {
        // Implémentée dans le root store (dépend de activeCampaignId du campaignSlice)
    },

    // ─── Players & Characters ────────────────────

    addPlayer: (player) => {
        const id = `p-${crypto.randomUUID()}`;
        const newPlayer: Player = { ...player, id };
        set((state) => {
            if (state.players.some(p => p.id === id)) return state;
            return { players: [...state.players, newPlayer] };
        });
    },

    deletePlayer: (playerId) =>
        set((state) => ({ players: state.players.filter((p) => p.id !== playerId) })),

    togglePlayerOnline: (playerId) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId ? { ...p, isOnline: !p.isOnline } : p
            ),
        })),

    updatePlayer: (playerId, updates) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId ? { ...p, ...updates } : p
            ),
        })),

    addCharacterToPlayer: (playerId, character) => {
        const id = `pc-${crypto.randomUUID()}`;
        const defaultPortrait = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(character.name)}&backgroundColor=b6e3f4`;
        const newChar: PlayerCharacter = { 
            ...character, 
            portraitUrl: character.portraitUrl || defaultPortrait,
            id 
        };
        set((state) => ({
            players: state.players.map((p) => {
                if (p.id !== playerId) return p;
                if (p.characters.some(c => c.id === id)) return p;
                return { ...p, characters: [...p.characters, newChar] };
            }),
        }));
    },

    deleteCharacter: (playerId, characterId) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? { ...p, characters: p.characters.filter((c) => c.id !== characterId) }
                    : p
            ),
        })),

    /*
      **Le magasin ne décide de rien ici** : il demande à `transfererLePersonnage`
      et écrit ce qu'elle rend. Un refus rend la liste **par référence**, donc
      `set` ne réveille aucun abonné — la synchronisation vers les tablettes ne
      rediffuse pas la liste des joueurs pour un geste qui n'a pas eu lieu.
    */
    transfererLePersonnage: (deJoueurId, versJoueurId, personnageId) => {
        const { joueurs, refus } = transfererLePersonnage(
            get().players, deJoueurId, versJoueurId, personnageId,
        );
        if (refus === null) set({ players: joueurs });
        return refus;
    },

    linkCharacterToCampaign: (playerId, characterId, campaignId, templateId) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) => {
                              if (c.id !== characterId) return c;
                              
                              // Deep Correction: If template is generic or none, and a system is provided, use it.
                              const newTemplateId = (c.templateId === 'generic' || !c.templateId) && templateId 
                                ? templateId 
                                : c.templateId;
                                
                              return { ...c, campaignId, templateId: newTemplateId };
                          }),
                      }
                    : p
            ),
        })),

    updateCharacterHP: (playerId, characterId, hp) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) => {
                                if (c.id !== characterId) return c;
                                const nextHp = c.sheetData?.__rddSante231 ? hp : Math.max(0, hp);
                                const updated = { ...c, hp: nextHp } as PlayerCharacter;
                                if (c.sheetData?.__rddSante231) updated.sheetData = {...c.sheetData,vie:nextHp};
                                
                                // Synchronisation forcée du HealthSystem
                                updated.healthSystem = projeterSanteVoyageur(updated.sheetData ?? {},syncHealthSystem(nextHp, c.maxHp, c.healthSystem));
                                return updated;
                          }),
                      }
                    : p
            ),
        })),

    updateCharacterMaxHP: (playerId, characterId, maxHp) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) => {
                                if (c.id !== characterId) return c;
                                const nextMax = Math.max(1, maxHp);
                                const updated = { ...c, maxHp: nextMax } as PlayerCharacter;
                                
                                // Synchronisation forcée du HealthSystem
                                updated.healthSystem = syncHealthSystem(c.hp, nextMax, c.healthSystem);
                                return updated;
                          }),
                      }
                    : p
            ),
        })),

    updateCharacterHealth: (playerId, characterId, health) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) => {
                                if (c.id !== characterId) return c;
                                const updated = { ...c, healthSystem: health } as PlayerCharacter;
                                // Sync back to standard HP fields if type is HP
                                if (health.type === 'hp') {
                                    updated.hp = Number(health.data.current) || 0;
                                    updated.maxHp = Number(health.data.max) || 10;
                                    /*
                                      **Les points de vie suivent la fiche** (2026-10-16) — la Santé de
                                      Blade Runner, les PV de Cthulhu Hack : même règle que les cases de
                                      NOC ci-dessous. Un champ qui porte autre chose qu'un nombre n'est
                                      pas écrasé.
                                    */
                                    const etat = get() as unknown as { campaigns?: Campaign[]; customGameDrivers?: GameDriver[]; activeCampaignId?: string | null };
                                    const champ = champDeSantePrincipale(piloteDuPersonnage(c, etat.campaigns ?? [], etat.customGameDrivers ?? [], etat.activeCampaignId ?? null));
                                    const avant = champ ? c.sheetData?.[champ] : undefined;
                                    if (champ && (avant === undefined || avant === '' || Number.isFinite(Number(avant)))) {
                                        updated.sheetData = { ...c.sheetData, [champ]: updated.hp };
                                        updated.donneesModifieesLe = Date.now();
                                    }
                                }
                                /*
                                  **La jauge de la fiche suit les cases** — NOC, 2026-10-13 :
                                  la fiche porte « Blessures », la santé ses dix cases. Sans ce
                                  report, la fiche HTML et la tablette montreraient une autre
                                  blessure que le plateau. Le champ voyage avec la santé
                                  (`casesDeSante.champ`), comme les points de vie ci-dessus.
                                */
                                if (health.type === 'boxes' && typeof health.data.champ === 'string' && health.data.champ) {
                                    const cochees = listeOuVide<{ filled?: boolean }>(health.data.boxes).filter(b => b.filled).length;
                                    updated.sheetData = { ...c.sheetData, [health.data.champ]: cochees };
                                    updated.donneesModifieesLe = Date.now();
                                }
                                return updated;
                          }),
                      }
                    : p
            ),
        })),

    updateCharacter: (playerId, characterId, updates) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) => {
                                if (c.id !== characterId) return c;
                                // Une fiche HTML ancienne ne connaît pas le suivi de Panique :
                                // son écriture ne doit effacer ni les reçus ni les demandes.
                                const suivis = Object.fromEntries([CLE_PANIQUE_ALIEN, CLE_JET_ALIEN, CLE_COMBAT_ALIEN]
                                    .filter(cle => c.sheetData?.[cle] && updates.sheetData && !Object.hasOwn(updates.sheetData, cle))
                                    .map(cle => [cle, c.sheetData![cle]]));
                                const sheetData = updates.sheetData ? { ...updates.sheetData, ...suivis } : undefined;
                                const updated = actualiserPersonnageDeVoyageur({ ...c, ...updates, ...(sheetData ? { sheetData } : {}) },
                                    (get() as unknown as { customSheetTemplates?: SheetTemplate[] }).customSheetTemplates ?? [], c);
                                // La date de la dernière écriture des données — l'arbitre face à la fiche (`pousseeVersLaFiche.ts`).
                                if (toucheLesDonnees(updates) && updates.donneesModifieesLe === undefined) updated.donneesModifieesLe = Date.now();

                                // Auto-sync HealthSystem
                                const currentVal = updated.hp;
                                const maxVal = updated.maxHp;
                                updated.healthSystem = projeterSanteVoyageur(updated.sheetData ?? {}, syncHealthSystem(currentVal, maxVal, updated.healthSystem));
                                return updated;
                          }),
                      }
                    : p
            ),
        })),

    updateCharacterSheetData: (playerId, characterId, fieldId, value) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) => {
                              if (c.id !== characterId) return c;
                              const updated = actualiserPersonnageDeVoyageur({ ...c, sheetData: { ...c.sheetData, [fieldId]: value }, donneesModifieesLe: Date.now() },
                                  (get() as unknown as { customSheetTemplates?: SheetTemplate[] }).customSheetTemplates ?? [], c);
                              if (updated.hp !== c.hp || updated.maxHp !== c.maxHp || updated.sheetData?.__rddSante231) updated.healthSystem = projeterSanteVoyageur(updated.sheetData ?? {}, syncHealthSystem(updated.hp, updated.maxHp, updated.healthSystem));
                              return updated;
                          }),
                      }
                    : p
            ),
        })),

    updateCharacterVisuals: (playerId, characterId, updates) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId ? { ...c, ...updates } : c
                          ),
                      }
                    : p
            ),
        })),

    updateCharacterNarrative: (playerId, characterId, updates) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId ? { ...c, ...updates } : c
                          ),
                      }
                    : p
            ),
        })),

    remoteUpdateCharacterNarrative: (playerId, characterId, updates) => {
        // Mettre à jour le store local (tablette) pour un retour visuel immédiat
        get().updateCharacterNarrative(playerId, characterId, updates);

        /*
          **Un seul chemin, et c'est celui-ci.** Il y en avait deux en
          apparence — `appBridge.remote.broadcastToTablets` quand le pont
          existe, cet événement sinon — mais ⛔ **le préload n'a jamais exposé
          `broadcastToTablets`** : la garde était toujours fausse, et tout est
          passé par ici depuis le premier jour, y compris chez le meneur.
          `useHubSync` le réachemine vers la socket (voir sa liste
          `AREACHEMINER`). *Une branche morte qui double une branche vivante
          n'est pas une sécurité : c'est un commentaire qui ment.* (2026-09-09)
        */
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('session:update-character-narrative', {
                detail: { playerId, characterId, updates }
            }));
        }
    },

    /**
     * **Ce que la fiche du joueur impose, remonté au meneur.**
     *
     * Le chemin qui manquait depuis le début du chantier des fiches : la tablette
     * savait afficher, elle ne savait pas écrire. Sans lui, un joueur remplit sa
     * fiche sur sa tablette et **rien n'arrive** — la pire des issues, parce qu'il
     * ne l'apprend qu'à la séance suivante.
     *
     * Calqué sur `remoteUpdateCharacterNarrative` et **pas** sur
     * `remoteUpdateCharacterVitals`, qui ne diffusait rien avant T4/J1 (06/10).
     *
     * Il écrit d'abord chez lui pour que l'écran suive tout de suite, puis
     * diffuse. Sur la tablette, `useHubSync` capte l'événement et le passe au
     * meneur ; dans une fenêtre Electron, le pont s'en charge.
     */
    remoteUpdateCharacterSheetData: (playerId, characterId, updates) => {
        // `sheetData` se FUSIONNE, il ne se remplace pas : la fiche ne connaît
        // que les champs de la table, et écraser l'objet entier perdrait tout ce
        // que le meneur tient à côté.
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                        ...p,
                        characters: p.characters.map((c) =>
                            c.id === characterId
                                ? {
                                    ...c,
                                    ...(updates.description !== undefined ? { description: updates.description } : {}),
                                    ...(updates.playerNotes !== undefined ? { playerNotes: updates.playerNotes } : {}),
                                    ...(updates.inventory !== undefined ? { inventory: updates.inventory } : {}),
                                    ...(updates.inventoryItems ? { inventoryItems: updates.inventoryItems } : {}),
                                    sheetData: { ...c.sheetData, ...(updates.sheetData ?? {}) },
                                    donneesModifieesLe: Date.now(),
                                }
                                : c
                        ),
                    }
                    : p
            ),
        }));

        if (typeof window === 'undefined') return;
        /* Chemin unique — voir le commentaire de `updateCharacterNarrative`. */
        window.dispatchEvent(new CustomEvent('session:update-character-sheet-data', {
            detail: { playerId, characterId, updates }
        }));
    },

    addLootToCharacter: (playerId, characterId, item) => {
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId
                                  ? { ...c, inventory: `${c.inventory ?? ''}\n- ${item}`.trim() }
                                  : c
                          ),
                      }
                    : p
            ),
        }));
    },

    addInventoryItem: (playerId, characterId, item) => {
        const newItem: import('./types').InventoryItem = { 
            ...item, 
            id: `it-${crypto.randomUUID()}` 
        };
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                        ...p,
                        characters: p.characters.map((c) =>
                            c.id === characterId
                                ? { ...c, inventoryItems: [...(c.inventoryItems ?? []), newItem], donneesModifieesLe: Date.now() }
                                : c
                        ),
                    }
                    : p
            ),
        }));
    },

    removeInventoryItem: (playerId, characterId, itemId) => {
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                        ...p,
                        characters: p.characters.map((c) =>
                            c.id === characterId
                                ? { ...c, inventoryItems: (c.inventoryItems ?? []).filter(i => i.id !== itemId), donneesModifieesLe: Date.now() }
                                : c
                        ),
                    }
                    : p
            ),
        }));
    },

    remoteRemoveInventoryItem: (playerId: string, characterId: string, itemId: string) => {
        // 1. Mise à jour locale (tablette) pour feedback immédiat
        get().removeInventoryItem(playerId, characterId, itemId);

        // 2. Broadcast vers le Master (pont WebSocket) via un CustomEvent capturé par useHubSync
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('session:remove-inventory-item', {
                detail: { playerId, characterId, itemId }
            }));
        }
    },

    updateCharacterHubOptions: (playerId, characterId, options) =>
        set((state) => ({
            players: state.players.map((p) =>
                p.id === playerId
                    ? {
                          ...p,
                          characters: p.characters.map((c) =>
                              c.id === characterId
                                  ? { ...c, hubOptions: { ...(c.hubOptions ?? { showHP: true, showMP: true, showAP: true, showInventory: true, showRelations: true }), ...options } }
                                  : c
                          ),
                      }
                    : p
            ),
        })),

    remoteUpdateCharacterVitals: (playerId, characterId, updates) => {
        const player = get().players.find((p) => p.id === playerId);
        const character = player?.characters.find((c) => c.id === characterId);

        if (!player || !character) return;
        if (updates.hp === undefined || !Number.isFinite(updates.hp)) return;

        // Apply updates locally
        if (updates.hp !== undefined) get().updateCharacterHP(playerId, characterId, updates.hp);

        // Notify MJ
        const messageParts = [];
        if (updates.hp !== undefined) messageParts.push(`PV: ${updates.hp}/${character.maxHp}`);

        if (messageParts.length > 0) {
            const store = get() as unknown as import('./index').SessionOSStore;
            store.addRemoteNotification?.({
                type: 'vitals_update',
                characterId,
                characterName: character.name,
                playerName: player.realName,
                message: i18next.t('modules:session.toasts.remote_vitals_update', { details: messageParts.join(', ') }),
            });
        }
        // T4/J1, 06/10 : la jauge locale ne suffisait pas ; le meneur doit l'apprendre.
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('session:update-character-vitals', {
                detail: { playerId, characterId, updates: { hp: updates.hp } },
            }));
        }
    },

    // ─── Health / Impact System ───────────────────

    handleApplyImpact: (targetId, targetType, impactSaisi) => {
        const { entities, players } = get();
        // Même lecture du magasin entier que `santeSelonLeJeu` plus haut : la tranche ne connaît que ses champs.
        const etat = get() as unknown as { campaigns?: Campaign[]; customGameDrivers?: GameDriver[]; activeCampaignId?: string | null; scenes?: Scene[] };
        const campaigns = etat.campaigns ?? [];
        const customGameDrivers = etat.customGameDrivers ?? [];
        const activeCampaignId = etat.activeCampaignId ?? null;

        /*
          **Les dommages selon la règle du jeu** — Torg, 2026-10-13. Quand le
          pilote déclare `combat.dommages`, la valeur saisie est un total de
          dommages : on lit la Résistance de la cible, la table donne les
          Blessures (le coup qui frappe la santé) et le Choc (ajouté au champ de
          la fiche, plafonné). Le journal et l'écran disent le calcul.
        */
        const selonLeJeu = (pilote: GameDriver | null | undefined, fiche: Record<string, unknown> | undefined) => {
            const regle = pilote?.combat?.dommages;
            if (!regle || regle.mecanique !== 'torg' || impactSaisi.isRecovery) return null;
            const resistance = valeurDuChamp(fiche, regle.resistance) ?? 0;
            const d = dommagesDeTorg(impactSaisi.value, resistance);
            const max = maximumDeLaJauge(regle.choc, pilote?.combat?.statsToTrack, fiche);
            const choc = ajouterLeChoc(valeurDuChamp(fiche, regle.choc) ?? 0, d.choc, max);
            /*
              **Deux Lois du Monde se disent ici, sans s'appliquer seules** (Torg,
              2026-10-14). La Ténacité (Pan-Pacifica) est un choix du joueur ; la
              Souffrance (Tharkold) profite à l'attaquant, que ce calcul ne connaît
              pas — l'initiative de Torg se joue par camp.
            */
            const cosms = cosmsDesIds(pilote?.cosms, idsDesCosmsCourants(campaigns.find(c => c.id === activeCampaignId), etat.scenes ?? []));
            const tenacite = choc.ko ? loiEnVigueur(cosms, 'tenacite') : undefined;
            const souffrance = d.blessures > 0 ? loiEnVigueur(cosms, 'souffrance') : undefined;
            const lois = [
                tenacite ? `${tenacite.nom} : s'il est chargé en possibilités, il peut encaisser 1 Blessure pour effacer tout son Choc` : '',
                souffrance ? `${souffrance.nom} : l'attaquant récupère 1 point de Choc` : '',
            ].filter(Boolean);
            return {
                impact: { ...impactSaisi, value: d.blessures },
                fiche: d.choc > 0 ? { [regle.choc]: choc.valeur } : {},
                texte: direLesDommages(impactSaisi.value, resistance, d, choc.ko) + lois.map(l => ` — ${l}`).join(''),
            };
        };
        const piloteOuvert = tousLesPilotes(customGameDrivers).find(d => d.id === campaigns.find(c => c.id === activeCampaignId)?.system);


        /*
          **Le coup est compté au combat en cours, s'il y en a un.**

          Les dégâts arrivent par deux chemins : le pupitre du tracker, et ce
          panneau-ci. Le récit de fin de combat — le seul événement de combat que
          le résumé par IA reçoive — n'aurait connu que le premier, alors que
          c'est par celui-ci que passent les impacts qu'on voit au journal.
          `noterUnCoup` accepte l'identifiant de la fiche et ne fait rien si
          personne sur le plateau ne lui correspond.
        */
        if (targetType === 'npc') {
            const entity = entities.find((e) => e.id === targetId);
            if (!entity) return;
            const regle = selonLeJeu(piloteOuvert, entity.sheetData);
            const impact = regle?.impact ?? impactSaisi;
            plateauDeCombat()?.noterUnCoup?.(targetId, impact);
            if (regle && Object.keys(regle.fiche).length > 0) {
                get().updateEntity(targetId, { sheetData: { ...(entity.sheetData ?? {}), ...regle.fiche } });
            }
            if (regle) gmToast(`${entity.name} — ${regle.texte}`, 'info');

            const humainAlien = !!piloteOuvert?.combat.alien && lireLeCombatAlien(entity.sheetData ?? {}).humain;
            const baseHealth = humainAlien ? santeAlignee(entity.healthSystem || HealthInterpreter.createDefault('hp'),santePrincipaleDeLaFiche(piloteOuvert,entity.sheetData)) ?? HealthInterpreter.createDefault('hp') : entity.healthSystem || HealthInterpreter.createDefault('hp');
            const updatedHealth = HealthInterpreter.calculateNextState(baseHealth, impact);
            const newHp = (updatedHealth.data.current as number) ?? entity.hp;
            
            get().updateEntityHealth(targetId, updatedHealth);
            get().updateEntityHP(targetId, newHp);
            if (humainAlien && piloteOuvert?.combat.alien) {
                const f = get().entities.find(e => e.id === targetId)?.sheetData ?? {};
                const suivi = lireLeCombatAlien(f), a = piloteOuvert.combat.alien;
                const nouveau = !impact.isRecovery && impact.value > 0 && newHp === 0 && !estUnAndroide({ mecanique:'alien',stress:a.stress,androide:a.androide,agilite:'',empathie:'' },f)
                    ? demanderUnCritique(suivi,`alien-pnj-${crypto.randomUUID()}`) : suivi;
                get().updateEntity(targetId,{sheetData:{...f,[a.sante]:newHp,[CLE_COMBAT_ALIEN]:nouveau},status:nouveau.mort?'dead':newHp<=0?'injured':'alive'});
            }

            /*
              **Le plateau doit l'apprendre, sinon il l'écrasera.**

              `syncCombatantToSession` ne va que du combattant vers la fiche.
              Sans ce retour, le combattant garde ses points de vie d'avant, le
              récit de fin de combat les annonce, et la prochaine
              synchronisation les réécrit par-dessus le travail de ce panneau —
              c'est ainsi qu'un soin disparaissait sans laisser de trace.
            */
            plateauDeCombat()?.refleterLaFiche?.(targetId, {
                hp: newHp, healthSystem: updatedHealth, ...(regle ? { sheetData: regle.fiche } : {}),
            });

            if (typeof window !== 'undefined' && window.useJournalStore) {
                window.useJournalStore.getState().addEvent({
                    type: 'COMBAT',
                    title: i18next.t('modules:session.events.impact_title', { name: entity.name }),
                    content: (regle ? `${regle.texte}\n` : '') + raconterLImpact(impact, {
                        hp: newHp, maxHp: entity.maxHp, healthSystem: updatedHealth,
                    }),
                    /*
                      **La scène se lit sur le plateau, pas ici.** Un coup porté
                      depuis ce panneau appartient au combat en cours ; sans ce
                      rattachement, la moitié des impacts d'une même scène
                      seraient groupables et l'autre non, selon la porte
                      empruntée. Hors combat il n'y a pas de plateau, et
                      l'événement n'a pas de scène — ce qui est vrai.
                    */
                    sceneId: plateauDeCombat()?.sceneId ?? undefined,
                });
            }
        } else {
            const player = players.find((p) =>
                p.characters.some((c) => c.id === targetId)
            );
            const character = player?.characters.find((c) => c.id === targetId);
            if (!player || !character) return;
            const piloteDuPJ = piloteDuPersonnage(character, campaigns, customGameDrivers, activeCampaignId);
            const regle = selonLeJeu(piloteDuPJ, character.sheetData);
            const impact = regle?.impact ?? impactSaisi;
            plateauDeCombat()?.noterUnCoup?.(targetId, impact);
            if (regle && Object.keys(regle.fiche).length > 0) {
                get().updateCharacter(player.id, targetId, { sheetData: { ...character.sheetData, ...regle.fiche } });
            }
            if (regle) gmToast(`${character.name} — ${regle.texte}`, 'info');

            /*
              **La santé principale part de la fiche** (2026-10-16) : pour un jeu en
              points de vie, le coup s'applique aux PV que la fiche porte, pas à une
              santé née à 10 / 10 et jamais relue. `updateCharacterHealth` les y
              réécrit ensuite.
            */
            const actuel = get().players.find(p => p.id === player.id)?.characters.find(c => c.id === targetId) ?? character;
            const principale = santePrincipaleDuPersonnage(actuel, piloteDuPJ, campaigns,
                (get() as unknown as { customSheetTemplates?: SheetTemplate[] }).customSheetTemplates);
            const baseHealth = santeAlignee(actuel.healthSystem || character.healthSystem || HealthInterpreter.createDefault('hp'), principale)
                ?? HealthInterpreter.createDefault('hp');
            const updatedHealth = HealthInterpreter.calculateNextState(baseHealth, impact);
            const newHp = (updatedHealth.data.current as number) ?? character.hp;
            
            get().updateCharacterHealth(player.id, targetId, updatedHealth);
            get().updateCharacterHP(player.id, targetId, newHp);

            // Alien p. 103 : un coup qui fait effectivement perdre de la Santé
            // augmente le Stress une seule fois, pas d'un point par dégât.
            const alien = piloteDuPJ?.jet?.panique?.suites;
            let suiteDeStress = '';
            if (alien?.mecanique === 'alien' && !impact.isRecovery
                && (newHp < Number(baseHealth.data.current) || (piloteDuPJ?.combat.alien && Number(baseHealth.data.current) === 0 && impact.value > 0))) {
                const courant = get().players.find(p => p.id === player.id)?.characters.find(c => c.id === targetId);
                if (courant) {
                    const fiche = courant.sheetData ?? {};
                    const maj = changerLeStressAlien(alien, fiche, `alien-degat-${crypto.randomUUID()}`, 1);
                    const fin = newHp === 0 ? arreterLaPaniqueAlien({ ...fiche, ...maj }, piloteDuPJ?.jet?.panique?.champ) : {};
                    const critique = piloteDuPJ?.combat.alien && newHp === 0 && !estUnAndroide(alien, fiche)
                        ? { [CLE_COMBAT_ALIEN]: demanderUnCritique(lireLeCombatAlien(fiche), `alien-critique-${crypto.randomUUID()}`) } : {};
                    get().updateCharacter(player.id, targetId, { sheetData: { ...fiche, ...maj, ...fin, ...critique } });
                    if (typeof maj[alien.stress] === 'number') suiteDeStress = `Stress ${Number(fiche[alien.stress]) || 0} → ${maj[alien.stress]} (dégâts subis).\n`;
                    if (newHp === 0) suiteDeStress += 'Brisé : la panique prend fin.\n';
                }
            }

            // Même retour que pour une entité : voir la branche ci-dessus.
            plateauDeCombat()?.refleterLaFiche?.(targetId, {
                hp: newHp, healthSystem: updatedHealth,
            });

            if (typeof window !== 'undefined' && window.useJournalStore) {
                window.useJournalStore.getState().addEvent({
                    type: 'COMBAT',
                    title: i18next.t('modules:session.events.impact_title', { name: character.name }),
                    content: (regle ? `${regle.texte}\n` : '') + suiteDeStress + raconterLImpact(impact, {
                        hp: newHp, maxHp: character.maxHp, healthSystem: updatedHealth,
                    }),
                    // Même rattachement que pour une entité : voir la branche ci-dessus.
                    sceneId: plateauDeCombat()?.sceneId ?? undefined,
                });
            }
        }
    },

    addPersistenceBadge: (targetId, targetType, badge) => {
        const newBadge: PersistenceBadge = { ...badge, id: `badge-${Date.now()}` };

        if (targetType === 'npc') {
            set((state) => ({
                entities: state.entities.map((e) =>
                    e.id === targetId
                        ? {
                              ...e,
                              healthSystem: e.healthSystem
                                  ? { ...e.healthSystem, badges: [...e.healthSystem.badges, newBadge] }
                                  : undefined,
                          }
                        : e
                ),
            }));
        } else {
            set((state) => ({
                players: state.players.map((p) => ({
                    ...p,
                    characters: p.characters.map((c) =>
                        c.id === targetId
                            ? {
                                  ...c,
                                  healthSystem: c.healthSystem
                                      ? { ...c.healthSystem, badges: [...c.healthSystem.badges, newBadge] }
                                      : undefined,
                              }
                            : c
                    ),
                })),
            }));
        }
    },

    removePersistenceBadge: (targetId, targetType, badgeId) => {
        if (targetType === 'npc') {
            set((state) => ({
                entities: state.entities.map((e) =>
                    e.id === targetId
                        ? {
                              ...e,
                              healthSystem: e.healthSystem
                                  ? {
                                        ...e.healthSystem,
                                        badges: e.healthSystem.badges.filter((b) => b.id !== badgeId),
                                    }
                                  : undefined,
                          }
                        : e
                ),
            }));
        } else {
            set((state) => ({
                players: state.players.map((p) => ({
                    ...p,
                    characters: p.characters.map((c) =>
                        c.id === targetId
                            ? {
                                  ...c,
                                  healthSystem: c.healthSystem
                                      ? {
                                            ...c.healthSystem,
                                            badges: c.healthSystem.badges.filter((b) => b.id !== badgeId),
                                        }
                                      : undefined,
                              }
                            : c
                    ),
                })),
            }));
        }
    },

    // ─── Social Graph ─────────────────────────────

    addRelation: (sourceId, sourceType, relation) => {
        if (sourceType === 'npc') {
            set((state) => ({
                entities: state.entities.map((e) =>
                    e.id === sourceId
                        ? { ...e, relations: [...(e.relations ?? []), relation] }
                        : e
                ),
            }));
        } else {
            set((state) => ({
                players: state.players.map((p) => ({
                    ...p,
                    characters: p.characters.map((c) =>
                        c.id === sourceId
                            ? { ...c, relations: [...(c.relations ?? []), relation] }
                            : c
                    ),
                })),
            }));
        }
    },

    removeRelation: (sourceId, sourceType, targetId) => {
        if (sourceType === 'npc') {
            set((state) => ({
                entities: state.entities.map((e) =>
                    e.id === sourceId
                        ? {
                              ...e,
                              relations: (e.relations ?? []).filter((r) => r.targetId !== targetId),
                          }
                        : e
                ),
            }));
        } else {
            set((state) => ({
                players: state.players.map((p) => ({
                    ...p,
                    characters: p.characters.map((c) =>
                        c.id === sourceId
                            ? {
                                  ...c,
                                  relations: (c.relations ?? []).filter((r) => r.targetId !== targetId),
                              }
                            : c
                    ),
                })),
            }));
        }
    },
});
