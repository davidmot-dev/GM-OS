import { GridEngine, type GridPoint } from './GridEngine';
import type { Combatant } from '../../combat/useCombatStore';
import type { MapToken, DangerZone } from '../../map/types';
import type { TacticalConfig } from '../../../types/drivers';
import { decrireLaSante } from '../../combat/logic/SanteDuCombattant';
import { postureEnvers } from '../../combat/logic/OrdreDuTour';

export interface TacticalContext {
    actor: Combatant;
    actorToken?: MapToken;
    /**
     * Ce que ce jeu COMPTE — « cases », « zones », « mètres ».
     *
     * Portée par le contexte et non relue du pilote au moment d'écrire : le
     * rapport se compose à partir de ce qu'on lui donne, et c'est ce qui le
     * rend testable sans pilote.
     */
    uniteDeDistance: string;
    /**
     * Ceux qui ne sont d'aucun camp — **nommés plutôt que rangés en cibles**.
     *
     * Le rapport les taisait en les comptant parmi les ennemis. Les dire permet
     * au meneur de voir qu'une faction n'a pas été précisée, et au modèle de ne
     * pas proposer de les attaquer.
     */
    neutres: { combatant: Combatant; token?: MapToken; distance: number }[];
    /**
     * **Ce que le rapport SAIT, distingué de ce qu'il SUPPOSE.**
     *
     * Le rapport présentait tout au même rang : une distance mesurée sur une
     * grille calibrée et une distance calculée sur une grille par défaut de
     * 50 px s'y lisaient pareil. *Un conseil de placement fondé sur une unité
     * arbitraire est faux sans jamais se plaindre.*
     */
    fiabilite: {
        /** Comment le jeton de l'acteur a été trouvé — ou pas du tout. */
        acteurResoluPar: 'identifiant' | 'nom' | null;
        /** Ceux que l'analyse n'a pas pu placer, nommés au lieu d'être tus. */
        sansJeton: string[];
        /** La grille est-elle affichée, donc vraisemblablement calibrée ? */
        grilleActivee?: boolean;
        gridSize: number;
    };
    enemies: { combatant: Combatant; token?: MapToken; distance: number; rangeCategory: string; rangeLabel: string }[];
    allies: { combatant: Combatant; token?: MapToken; distance: number }[];
    isFlanked: boolean;
    flankedBy: string[];
    nearbyDangerZones: DangerZone[];
    factionStatus: {
        alliesHealthPercent: number;
        enemiesHealthPercent: number;
    };
    macroContext?: string; // Neural Liaison snapshot
}

/**
 * Service chargé de traduire l'état brut des stores (Combat + Map) 
 * en un rapport narratif compréhensible par l'IA.
 */
export class TacticalNarrativeService {
    
    /**
     * Génère un rapport contextuel complet pour un combattant donné.
     */
    static getSituationalReport(
        actor: Combatant,
        allCombatants: Combatant[],
        allTokens: MapToken[],
        dangerZones: DangerZone[],
        gridSize: number = 50,
        macroContext?: string,
        /**
         * Les portées du pilote — **et sans elles, on décrit un autre jeu**.
         *
         * `GridEngine.getRangeInfo` accepte cette configuration depuis
         * toujours ; deux appelants sur trois la passaient. Celui-ci, qui est
         * précisément **celui qui décrit la scène à l'IA**, l'omettait : il
         * classait les distances avec les bandes par défaut pendant que le
         * pilote en déclarait d'autres.
         *
         * Le piège qui l'a caché si longtemps : les valeurs par défaut de
         * `GridEngine` sont `contact −3, courte 0, moyenne −1, longue −2,
         * extreme −3` — **exactement celles d'Alien**. Le manque était donc
         * invisible sur le seul jeu où on le cherchait. Il ne se serait vu que
         * sur Dune, dont les portées montent de 0 à 4.
         */
        tacticalConfig?: TacticalConfig,
        /**
         * La grille de la carte est-elle affichée ?
         *
         * **Le seul signal disponible sur la calibration.** `gridSize` vaut
         * 50 px par défaut : sur une carte dont la grille n'a jamais été réglée,
         * toutes les distances — donc toutes les portées — sont arbitraires, et
         * le rapport ne le disait nulle part. Une grille affichée a
         * vraisemblablement été réglée ; une grille éteinte, non.
         */
        grilleActivee?: boolean,
    ): string {
        const context = this.buildContext(
            actor, allCombatants, allTokens, dangerZones, gridSize, macroContext, tacticalConfig,
            grilleActivee,
        );
        return this.formatNarrativePrompt(context);
    }

    /**
     * Construit un objet structuré contenant toutes les données tactiques pertinentes.
     */
    /**
     * Le jeton d'un combattant, **et par quoi on l'a trouvé**.
     *
     * *L'appariement par nom est un repli, pas une méthode.* Casse et espaces
     * de bord sont normalisés, rien de plus : « Garde 1 » et « Garde #1 » ne se
     * lient pas. Le dire permet au rapport de qualifier ce qu'il avance —
     * `identifiant` est une mesure, `nom` est une supposition.
     */
    private static jetonDe(tokens: MapToken[], combattant: Combatant): {
        token?: MapToken;
        par: 'identifiant' | 'nom' | null;
    } {
        const parIdentifiant = tokens.find(t => t.linkedCombatantId === combattant.id);
        if (parIdentifiant) return { token: parIdentifiant, par: 'identifiant' };

        const parNom = tokens.find(t =>
            t.name.toLowerCase().trim() === combattant.name.toLowerCase().trim());
        if (parNom) return { token: parNom, par: 'nom' };

        return { token: undefined, par: null };
    }

    private static buildContext(
        actor: Combatant,
        allCombatants: Combatant[],
        allTokens: MapToken[],
        dangerZones: DangerZone[],
        gridSize: number,
        macroContext?: string,
        tacticalConfig?: TacticalConfig,
        grilleActivee?: boolean,
    ): TacticalContext {
        const { token: actorToken, par: acteurResoluPar } = this.jetonDe(allTokens, actor);
        
        const allies: TacticalContext['allies'] = [];
        const enemies: TacticalContext['enemies'] = [];
        const neutres: TacticalContext['neutres'] = [];
        const sansJeton: Combatant[] = [];

        if (actorToken) {
            const actorPoint: GridPoint = { x: actorToken.x, y: actorToken.y };

            allCombatants.forEach(c => {
                if (c.id === actor.id) return;
                
                const { token } = this.jetonDe(allTokens, c);
                if (!token) {
                    /*
                      **Un combattant sans jeton était omis en silence.** Il
                      disparaissait de l'analyse — ni allié, ni cible, ni
                      mention —, et le conseil se fondait alors sur une table
                      incomplète sans que rien ne l'indique. On le NOMME : le
                      meneur voit qui manque, et le modèle sait que sa vue est
                      partielle.
                    */
                    sansJeton.push(c);
                    return;
                }

                const distancePx = GridEngine.calculateDistance(actorPoint, { x: token.x, y: token.y });
                const distanceUnits = GridEngine.pxToUnits(distancePx, gridSize);
                const rangeInfo = GridEngine.getRangeInfo(distanceUnits, tacticalConfig);

                /*
                  **Une égalité de factions n'est pas une alliance.** Un PNJ
                  marqué `ally` n'est pas `player` : il tombait donc du côté des
                  cibles, et le Cortex proposait de tuer l'allié que le meneur
                  venait de déclarer. La posture vient désormais de `campDe`,
                  l'unique écriture de « qui est de mon côté » — celle que
                  l'écran d'alternance utilisait déjà.
                */
                const posture = postureEnvers(c, actor);

                if (posture === 'neutre') {
                    // Ni allié ni cible : on le NOMME au lieu de le ranger
                    // d'office parmi les adversaires. *Un neutre listé en cible
                    // fait proposer de l'attaquer.*
                    neutres.push({ combatant: c, token, distance: distanceUnits });
                } else if (posture === 'allie') {
                    allies.push({ combatant: c, token, distance: distanceUnits });
                } else {
                    enemies.push({ 
                        combatant: c, 
                        token, 
                        distance: distanceUnits, 
                        rangeCategory: rangeInfo.category,
                        rangeLabel: rangeInfo.label 
                    });
                }
            });
        }

        // Flanking check on actor
        let isFlanked = false;
        let flankedBy: string[] = [];
        if (actorToken) {
            const enemiesData = enemies
                .filter(e => e.token)
                .map(e => ({
                    point: { x: e.token!.x, y: e.token!.y },
                    unitsToTarget: e.distance,
                    name: e.combatant.name
                }));
            
            const flankResult = GridEngine.checkFlanking(
                { point: { x: actorToken.x, y: actorToken.y }, name: actor.name },
                enemiesData
            );
            isFlanked = flankResult.isFlanked;
            flankedBy = flankResult.flankers;
        }

        // Danger zones check
        const nearbyDangerZones = actorToken ? dangerZones.filter(dz => {
            const dist = GridEngine.calculateDistance({ x: actorToken.x, y: actorToken.y }, { x: dz.x, y: dz.y });
            const distUnits = GridEngine.pxToUnits(dist, gridSize);
            // Zones typically have a radius or size. We check if actor is within 2 units of the zone edge (simplified)
            return distUnits <= (dz.radius || 2) + 1;
        }) : [];

        /*
          **La déroute se comptait sur la même égalité fautive**, donc un allié
          déclaré gonflait la santé du camp d'en face. La « Morphologie du
          Combat » est l'un des rares éléments stratégiques du rapport : la
          fausser, c'est faire conseiller une retraite devant ses propres
          renforts. Les neutres ne comptent dans aucun des deux camps.
        */
        const myFaction = allCombatants.filter(c => postureEnvers(c, actor) === 'allie');
        const enemyFaction = allCombatants.filter(c => postureEnvers(c, actor) === 'hostile');
        
        const myHealth = GridEngine.checkFactionRout(myFaction);
        const enemyHealth = GridEngine.checkFactionRout(enemyFaction);

        return {
            actor,
            actorToken,
            enemies,
            allies,
            neutres,
            isFlanked,
            flankedBy,
            nearbyDangerZones,
            factionStatus: {
                alliesHealthPercent: Math.round(myHealth.currentPercent),
                enemiesHealthPercent: Math.round(enemyHealth.currentPercent)
            },
            macroContext,
            // Sans déclaration, « unités » : le mot ne prétend ni grille, ni
            // mètre, ni zone. *On ne remplace pas une convention inventée par
            // une autre.*
            uniteDeDistance: tacticalConfig?.uniteDeDistance || 'unités',
            fiabilite: {
                acteurResoluPar,
                sansJeton: sansJeton.map(c => c.name),
                grilleActivee,
                gridSize,
            },
        };
    }

    /**
     * Transforme le contexte en une chaîne de caractères narrative optimisée pour le prompt IA.
     */
    private static formatNarrativePrompt(ctx: TacticalContext): string {
        const { actor, actorToken, enemies, allies, neutres, isFlanked, flankedBy, nearbyDangerZones, factionStatus, macroContext } = ctx;
        const unite = ctx.uniteDeDistance;
        const fiabilite = ctx.fiabilite;

        let prompt = `## ANALYSE TACTIQUE MICRO : ${actor.name}\n`;
        // Quatrième écrit à annoncer des points de vie sans regarder le modèle
        // de santé — trouvé le 2026-08-15 en corrigeant les portées, alors que
        // la cartographie de la veille ne l'avait pas relevé.
        const santeActeur = decrireLaSante(actor);
        prompt += `- Santé : ${santeActeur ?? 'non chiffrée par ce système'}. Faction : ${actor.faction}.\n`;
        
        if (actor.statuses.length > 0) {
            prompt += `- États actifs : ${actor.statuses.map(s => s.name).join(', ')}.\n`;
        }

        if (!actorToken) {
            /*
              **L'information etait la, la consigne manquait.** Le rapport
              ecrivait bien « Absent de la carte » — une ligne discrete parmi
              d'autres — et RIEN n'interdisait au modele de conseiller un
              deplacement quand meme. *Le defaut n'etait pas l'absence
              d'information, c'etait l'absence d'instruction.*
            */
            prompt += `- Note : Absent de la carte Atlas. AUCUNE POSITION CONNUE : `
                + `ne conseille aucun déplacement ni aucune portée. `
                + `Tiens-toi à ce qui ne dépend pas du terrain — santé, états, moral.` + String.fromCharCode(10);
        } else {
            prompt += `- Position : Valide (Atlas).\n`;
            
            if (isFlanked) {
                prompt += `- ALERTE : FLANQUÉ par ${flankedBy.join(' et ')} !\n`;
            }

            if (enemies.length > 0) {
                prompt += `- Proximité Ennemi :\n`;
                enemies.sort((a, b) => a.distance - b.distance).forEach(e => {
                    const santeEnnemi = decrireLaSante(e.combatant);
                    /*
                      **« cases » était écrit en dur, sur tous les systèmes.**
                      Alien compte en zones, d'autres en mètres ou en pieds :
                      *une convention d'un système appliquée à tous.* Le pilote
                      la déclare désormais ; sans elle on écrit « unités », qui
                      ne prétend rien plutôt que d'affirmer une grille.

                      Et la portée s'annonce sous le nom que CE jeu lui donne —
                      « au toucher » plutôt que « Contact ». La Forge collectait
                      ces cinq libellés depuis les fiches, et rien ne les lisait.
                    */
                    prompt += `  * ${e.combatant.name} à ${e.distance} ${unite} [Portée ${e.rangeLabel}]`
                        + (santeEnnemi ? `. Santé : ${santeEnnemi}` : '') + '.\n';
                });
            } else {
                prompt += `- Aucun ennemi sur carte.\n`;
            }

            /*
              **Les nommer, et dire ce qu'on ne sait pas d'eux.** Un combattant
              ajoute sans faction precisee arrive ici : le taire le laisserait
              hors du conseil, le ranger en cible le ferait attaquer. La phrase
              dit les deux — ils existent, et leur camp n'est pas etabli.
            */
            if (neutres.length > 0) {
                prompt += `- Ni alliés ni cibles (faction non établie) : `
                    + neutres.map(n => `${n.combatant.name} à ${n.distance} ${unite}`).join(', ')
                    + '. Ne propose pas de les attaquer sans que le meneur ait tranché.' + String.fromCharCode(10);
            }

            if (allies.length > 0) {
                const closeAllies = allies.filter(a => a.distance <= 2);
                if (closeAllies.length > 0) {
                    prompt += `- Soutien direct (alliés < 2 cases) : ${closeAllies.map(a => a.combatant.name).join(', ')}.\n`;
                }
            }

            if (nearbyDangerZones.length > 0) {
                prompt += `- RISQUES TERRAIN : ${nearbyDangerZones.map(dz => dz.name || 'Zone de danger').join(', ')}.\n`;
            }
        }

        /*
          **Ce qui est mesure, et ce qui est suppose.** Le rapport presentait
          tout au meme rang. Une distance lue sur une grille reglee et une
          distance calculee sur les 50 px par defaut s'y lisaient pareil — et un
          conseil de placement fonde sur une unite arbitraire est faux sans
          jamais se plaindre.

          On ne dit que ce qui EST douteux : un rapport qui se justifie a chaque
          ligne finit non lu, et la ligne qui compte s'y noie.
        */
        const doutes: string[] = [];
        if (fiabilite.acteurResoluPar === 'nom') {
            doutes.push("la position de l'acteur est appariée par son NOM et non par un lien : "
                + 'un homonyme la rendrait fausse');
        }
        if (fiabilite.grilleActivee === false) {
            doutes.push(`la grille de la carte est éteinte : l'échelle vaut ${fiabilite.gridSize} px `
                + 'par défaut, donc les distances et les portées sont indicatives');
        }
        if (fiabilite.sansJeton.length > 0) {
            doutes.push('absents de la carte, donc hors de cette analyse : '
                + fiabilite.sansJeton.join(', '));
        }
        if (doutes.length > 0) {
            prompt += `- FIABILITÉ DES ENTRÉES — ${doutes.join(' ; ')}.` + String.fromCharCode(10);
        }

        prompt += `- Morphologie du Combat : Allies ${factionStatus.alliesHealthPercent}% vs Enemies ${factionStatus.enemiesHealthPercent}%\n`;

        if (macroContext) {
            prompt += `\n## CONTEXTE GLOBAL (Neural Liaison)\n${macroContext}\n`;
        }

        return prompt;
    }
}
