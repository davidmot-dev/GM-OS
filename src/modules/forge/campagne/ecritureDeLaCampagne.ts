/**
 * Du projet aux objets : les noms deviennent des identifiants.
 *
 * **Ce module ne touche à rien.** Il rend des objets prêts à écrire, et la liste
 * de ce qui n'a pas pu se résoudre. C'est ce découpage qui permet de montrer au
 * meneur ce qui va se passer *avant* que sa campagne ne bouge — et c'est aussi
 * lui qui rend possible le § 6.3 du plan.
 *
 * ---
 *
 * **ON NE JETTE PLUS EN SILENCE.** `crossDomainHelpers.ts:42` fait
 * `.filter(r => r.targetId)` : une relation dont le nom ne tombe pas juste
 * disparaît **sans un mot**. Sur une relation, la perte est discrète. Sur une
 * scène, elle serait invisible et grave — une scène amputée de ses PNJ et de ses
 * indices a l'aspect exact d'une scène qui n'en avait pas, et l'écran
 * annoncerait un succès.
 *
 * Ici, chaque renvoi qui ne trouve pas sa cible est **rendu**, avec l'objet qui
 * le portait, le champ visé et le nom écrit. Le renvoi est abandonné — on ne
 * fabrique pas de cible —, mais il est dit. *On répare plutôt qu'on ne refuse,
 * et on dit ce qu'on a réparé.*
 *
 * ---
 *
 * **REFORGER N'ÉCRASE RIEN.** Un objet dont le nom existe déjà dans la campagne
 * n'est ni recréé, ni réécrit : la Forge adopte l'identifiant existant pour ses
 * renvois et signale qu'elle l'a conservé. Sans cela, une seconde forge
 * doublerait tous les PNJ — et les corrections de la semaine passée
 * cohabiteraient avec une copie neuve qui les ignore. *Si retravailler une
 * séance efface le travail de la semaine précédente, le meneur cessera de
 * retravailler.*
 */

import type { Acte, Scene } from '../../../types/trame.types';
import type { Entity, EntityRelation } from '../../../types/entity.types';
import type { AtlasMap, WikiEntry, Clue } from '../../../types/chronicle.types';
import type { Campaign } from '../../../types/campaign.types';
import type { GameDriver } from '../../../types/drivers';
import { santeSelonLeJeu } from '../../session/logic/santeDesAdversaires';
import { normaliser } from '../rules/canevas';
import type {
    ProjetDeCampagne, PnjProjete, IndiceProjete,
} from './ForgeDeCampagne';

// ─────────────────────────────────────────────
// Ce qui n'a pas abouti
// ─────────────────────────────────────────────

/** Un renvoi que la Forge n'a pas su résoudre — et qu'elle refuse de taire. */
export interface RenvoiNonResolu {
    /** L'objet qui portait le renvoi : « scène « Le bal » ». */
    depuis: string;
    /** Le champ visé : « lieu », « pnj », « porteur ». */
    champ: string;
    /** Le nom que le modèle a écrit, et qui ne désigne rien. */
    nom: string;
}

/** Un objet déjà présent dans la campagne, laissé tel quel. */
export interface ObjetConserve {
    quoi: string;
    nom: string;
}

// ─────────────────────────────────────────────
// L'annuaire des noms
// ─────────────────────────────────────────────

/**
 * Nom → identifiant, à la tolérance près.
 *
 * **La comparaison passe par `normaliser`, et c'est un choix.** On a demandé au
 * modèle la recopie exacte ; exiger l'exactitude à la résolution ferait perdre
 * une scène entière pour un accent, une majuscule ou un article. *La consigne
 * vise le meilleur cas, la résolution encaisse le cas réel.*
 *
 * Le premier inscrit gagne : un doublon de nom est déjà écarté en amont, et
 * réécrire l'entrée ferait pointer les renvois vers le dernier venu.
 */
class Annuaire {
    private readonly parNom = new Map<string, string>();

    public inscrire(nom: string | undefined, id: string): void {
        const clef = normaliser(nom ?? '');
        if (!clef || this.parNom.has(clef)) return;
        this.parNom.set(clef, id);
    }

    public trouver(nom: string | undefined): string | undefined {
        const clef = normaliser(nom ?? '');
        return clef ? this.parNom.get(clef) : undefined;
    }
}

// ─────────────────────────────────────────────
// L'écriture
// ─────────────────────────────────────────────

/** Ce que la campagne porte déjà, pour ne rien doubler ni rien écraser. */
export interface ExistantDeLaCampagne {
    actes?: readonly Acte[];
    scenes?: readonly Scene[];
    entities?: readonly Entity[];
    atlasMaps?: readonly AtlasMap[];
    wikiEntries?: readonly WikiEntry[];
    clues?: readonly Clue[];
}

export interface OptionsDEcriture {
    /** Campagne visée. Absent : la Forge en crée une. */
    campaignId?: string;
    /** Le jeu, tel que le `jeu:` des fiches le déclare. */
    systeme?: string;
    /** Le pilote du jeu — il donne le modèle de santé des PNJ. */
    driver?: GameDriver | null;
    existant?: ExistantDeLaCampagne;
    /** Injectable pour les tests : par défaut, préfixe + horodatage + aléa. */
    identifiant?: (prefixe: string) => string;
}

export interface EcritureDeLaCampagne {
    campaignId: string;
    /** Les champs de la campagne, et si elle est à créer. */
    campagne?: { creee: boolean; champs: Partial<Campaign> };
    actes: Acte[];
    scenes: Scene[];
    entities: Entity[];
    atlasMaps: AtlasMap[];
    wikiEntries: WikiEntry[];
    clues: Clue[];
    /**
     * Les liens dont la source est un personnage **déjà présent**.
     *
     * Ils ne peuvent pas voyager avec `entities`, qui ne porte que les objets
     * neufs. Les rendre à part est la seule façon de ne pas les perdre : une
     * seconde forge décrit surtout des liens entre personnages qui existaient
     * déjà, et c'est précisément ce qu'un enrichissement apporte.
     */
    liensSurExistants: { entityId: string; relation: EntityRelation }[];
    nonResolus: RenvoiNonResolu[];
    conserves: ObjetConserve[];
}

function identifiantParDefaut(prefixe: string): string {
    return `${prefixe}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Le rang suivant, pour une liste déjà ordonnée. */
function apres(elements: readonly { ordre: number }[]): number {
    return elements.reduce((max, e) => Math.max(max, e.ordre), 0) + 1;
}

/**
 * Projette un projet de campagne en objets de jeu.
 *
 * L'ordre des étages est celui de la Forge, et pour la même raison : chaque
 * étage ne peut désigner que ce que les précédents ont inscrit à l'annuaire.
 */
export function ecrireLaCampagne(
    projet: ProjetDeCampagne,
    options: OptionsDEcriture = {},
): EcritureDeLaCampagne {
    const neuf = options.identifiant ?? identifiantParDefaut;
    const existant = options.existant ?? {};
    const nonResolus: RenvoiNonResolu[] = [];
    const conserves: ObjetConserve[] = [];

    const campaignId = options.campaignId ?? neuf('c');
    const templateId = options.driver?.templateId || 'generic';

    /** Cherche une cible et consigne l'échec plutôt que de le taire. */
    const resoudre = (
        annuaire: Annuaire,
        nom: string | undefined,
        depuis: string,
        champ: string,
    ): string | undefined => {
        if (!nom?.trim()) return undefined;
        const id = annuaire.trouver(nom);
        if (!id) nonResolus.push({ depuis, champ, nom });
        return id;
    };

    // ── Les actes ────────────────────────────────
    const annuaireDesActes = new Annuaire();
    const actesExistants = (existant.actes ?? []).filter(a => a.campaignId === campaignId);
    for (const acte of actesExistants) annuaireDesActes.inscrire(acte.titre, acte.id);

    const actes: Acte[] = [];
    let ordreActe = apres(actesExistants);
    for (const projete of projet.actes) {
        if (!projete.titre?.trim()) continue;
        if (annuaireDesActes.trouver(projete.titre)) {
            conserves.push({ quoi: 'acte', nom: projete.titre });
            continue;
        }
        const id = neuf('acte');
        annuaireDesActes.inscrire(projete.titre, id);
        actes.push({
            id,
            campaignId,
            ordre: ordreActe++,
            titre: projete.titre,
            resume: projete.resume ?? '',
            ...(projete.notesDuMeneur ? { notesDuMeneur: projete.notesDuMeneur } : {}),
        });
    }

    // ── Les lieux ────────────────────────────────
    const annuaireDesLieux = new Annuaire();
    for (const carte of existant.atlasMaps ?? []) {
        if (carte.campaignId === campaignId) annuaireDesLieux.inscrire(carte.name, carte.id);
    }

    const atlasMaps: AtlasMap[] = [];
    for (const projete of projet.lieux) {
        if (!projete.name?.trim()) continue;
        if (annuaireDesLieux.trouver(projete.name)) {
            conserves.push({ quoi: 'lieu', nom: projete.name });
            continue;
        }
        const id = neuf('am');
        annuaireDesLieux.inscrire(projete.name, id);
        atlasMaps.push({
            id,
            campaignId,
            name: projete.name,
            // Faute d'illustration, le type le plus neutre. `battlemap` aurait
            // annoncé un plan de combat pour une contrée entière.
            type: projete.type ?? 'region',
            narrativeDescription: projete.narrativeDescription ?? '',
            gmNotes: projete.gmNotes ?? '',
            fileUrl: '',
            isVideo: false,
            linkedEntities: [],
        });
    }

    // ── Les factions et le savoir ────────────────
    const annuaireDuWiki = new Annuaire();
    for (const entree of existant.wikiEntries ?? []) {
        if (entree.campaignId === campaignId) annuaireDuWiki.inscrire(entree.title, entree.id);
    }

    const wikiEntries: WikiEntry[] = [];
    const inscrireAuWiki = (
        titre: string | undefined,
        contenu: string | undefined,
        categorie: WikiEntry['category'],
        tags: string[],
        quoi: string,
    ) => {
        if (!titre?.trim()) return;
        if (annuaireDuWiki.trouver(titre)) {
            conserves.push({ quoi, nom: titre });
            return;
        }
        const id = neuf('we');
        annuaireDuWiki.inscrire(titre, id);
        wikiEntries.push({
            id, campaignId, title: titre, content: contenu ?? '',
            category: categorie, tags, imageUrls: [], linkedEntityIds: [],
        });
    };

    /** L'annuaire des factions est séparé : `Entity.faction` porte un NOM, pas un identifiant. */
    const nomsDeFactions = new Annuaire();
    for (const faction of projet.factions) {
        if (faction.title?.trim()) nomsDeFactions.inscrire(faction.title, faction.title);
        inscrireAuWiki(faction.title, faction.content, 'organization', ['faction'], 'faction');
    }

    // ── Les PNJ ──────────────────────────────────
    const annuaireDesPnj = new Annuaire();
    for (const entite of existant.entities ?? []) {
        if (entite.campaignId === campaignId) annuaireDesPnj.inscrire(entite.name, entite.id);
    }

    const entities: Entity[] = [];
    for (const projete of projet.pnj) {
        if (!projete.name?.trim()) continue;
        if (annuaireDesPnj.trouver(projete.name)) {
            conserves.push({ quoi: 'personnage', nom: projete.name });
            continue;
        }
        const id = neuf('e');
        annuaireDesPnj.inscrire(projete.name, id);
        const depuis = `personnage « ${projete.name} »`;
        /*
          **La faction est un cas à part, et le seul.** `Entity.faction` porte du
          texte libre, pas un identifiant : une faction que la Forge n'a pas
          créée reste lisible sur la fiche du PNJ. On garde donc ce que le modèle
          a écrit — le jeter appauvrirait le personnage sans rien gagner — mais on
          le signale, parce qu'une faction hors liste est presque toujours le
          signe d'un nom mal recopié.
        */
        const faction = projete.faction?.trim()
            ? nomsDeFactions.trouver(projete.faction) ?? projete.faction
            : undefined;
        if (projete.faction?.trim() && !nomsDeFactions.trouver(projete.faction)) {
            nonResolus.push({ depuis, champ: 'faction', nom: projete.faction });
        }

        entities.push(construireLePnj(projete, {
            id, campaignId, templateId,
            driver: options.driver ?? null,
            lieuId: resoudre(annuaireDesLieux, projete.lieu, depuis, 'lieu'),
            ...(faction ? { faction } : {}),
        }));
    }

    // ── Les liens ────────────────────────────────
    //
    // Portés par l'entité source : c'est là que `Entity.relations` vit.
    const liensSurExistants: { entityId: string; relation: EntityRelation }[] = [];
    for (const lien of projet.relations) {
        const depuis = `lien « ${lien.source} » → « ${lien.cible} »`;
        const sourceId = resoudre(annuaireDesPnj, lien.source, depuis, 'source');
        const cibleId = resoudre(annuaireDesPnj, lien.cible, depuis, 'cible');
        // Un lien d'un personnage vers lui-même n'apprend rien et encombre le
        // graphe social : c'est un doublon de nom, pas une relation.
        if (!sourceId || !cibleId || sourceId === cibleId) continue;

        const relation: EntityRelation = {
            targetId: cibleId,
            targetType: 'npc',
            type: lien.type as EntityRelation['type'],
            description: lien.description ?? '',
        };

        const source = entities.find(e => e.id === sourceId);
        // La source peut être un personnage conservé, que cette écriture ne
        // produit pas. Le lien part alors à part, pour être posé sur l'existant.
        if (source) source.relations = [...(source.relations ?? []), relation];
        else liensSurExistants.push({ entityId: sourceId, relation });
    }

    // ── Les indices ──────────────────────────────
    const annuaireDesIndices = new Annuaire();
    for (const indice of existant.clues ?? []) {
        if (indice.campaignId === campaignId) annuaireDesIndices.inscrire(indice.title, indice.id);
    }

    const clues: Clue[] = [];
    for (const projete of projet.indices) {
        if (!projete.title?.trim()) continue;
        if (annuaireDesIndices.trouver(projete.title)) {
            conserves.push({ quoi: 'indice', nom: projete.title });
            continue;
        }
        const id = neuf('clue');
        annuaireDesIndices.inscrire(projete.title, id);
        clues.push(construireLIndice(projete, {
            id,
            campaignId,
            ownerId: resoudre(annuaireDesPnj, projete.porteur, `indice « ${projete.title} »`, 'porteur'),
            locationId: resoudre(annuaireDesLieux, projete.lieu, `indice « ${projete.title} »`, 'lieu'),
        }));
    }

    // ── Les scènes ───────────────────────────────
    const scenesExistantes = existant.scenes ?? [];
    const rangParActe = new Map<string, number>();
    const scenes: Scene[] = [];

    for (const projete of projet.scenes) {
        if (!projete.titre?.trim()) continue;
        const depuis = `scène « ${projete.titre} »`;
        const acteId = resoudre(annuaireDesActes, projete.acte, depuis, 'acte');
        // Sans acte, la scène serait orpheline dès sa naissance — la règle
        // qu'`ajouterScene` applique déjà. On ne fabrique pas de rattachement.
        if (!acteId) continue;

        if (!rangParActe.has(acteId)) {
            rangParActe.set(acteId, apres(scenesExistantes.filter(s => s.acteId === acteId)));
        }
        const ordre = rangParActe.get(acteId)!;
        rangParActe.set(acteId, ordre + 1);

        const lieuDeLaScene = resoudre(annuaireDesLieux, projete.lieu, depuis, 'lieu');

        scenes.push({
            id: neuf('scene'),
            campaignId,
            acteId,
            ordre,
            titre: projete.titre,
            resume: projete.resume ?? '',
            ...(projete.notesDuMeneur ? { notesDuMeneur: projete.notesDuMeneur } : {}),
            // Une scène tirée du livre est une scène préparée : c'est l'origine
            // qui distingue le prévu de l'improvisé, et le remplissage se calcule.
            origine: 'preparee',
            ...(lieuDeLaScene ? { lieuId: lieuDeLaScene } : {}),
            entiteIds: (projete.pnj ?? [])
                .map(nom => resoudre(annuaireDesPnj, nom, depuis, 'pnj'))
                .filter((id): id is string => !!id),
            indiceIds: (projete.indices ?? [])
                .map(titre => resoudre(annuaireDesIndices, titre, depuis, 'indice'))
                .filter((id): id is string => !!id),
            creeeLe: Date.now(),
        });
    }

    // ── Le savoir, en dernier : il ne sert de cible à personne ──
    for (const entree of projet.savoir) {
        inscrireAuWiki(
            entree.title,
            entree.content,
            (entree.category as WikiEntry['category']) ?? 'lore',
            entree.tags ?? [],
            'entrée',
        );
    }

    return {
        campaignId,
        ...(projet.campagne
            ? {
                campagne: {
                    creee: !options.campaignId,
                    champs: {
                        name: projet.campagne.name,
                        description: projet.campagne.description ?? '',
                        synopsis: projet.campagne.synopsis ?? '',
                        ...(options.systeme ? { system: options.systeme } : {}),
                    },
                },
            }
            : {}),
        actes, scenes, entities, atlasMaps, wikiEntries, clues,
        liensSurExistants, nonResolus, conserves,
    };
}

/**
 * Un PNJ, à l'échelle de son jeu.
 *
 * **Ni classe d'armure, ni vitesse, ni initiative inventées**, et des points de
 * vie à zéro plutôt qu'à dix : `Entity.hp` est obligatoire, il faut écrire
 * quelque chose, et écrire dix poserait les points de vie de D&D sur un jeu qui
 * n'en a pas. `aUneJaugeDeVie` exige un maximum strictement positif — à zéro,
 * aucun écran n'affiche de barre, et `healthSystem` porte seul le vrai modèle.
 * *L'absence n'est pas un zéro, mais elle ne se déguise pas non plus en dix.*
 */
function construireLePnj(
    projete: PnjProjete,
    contexte: {
        id: string; campaignId: string; templateId: string;
        driver: GameDriver | null; lieuId?: string; faction?: string;
    },
): Entity {
    return {
        id: contexte.id,
        campaignId: contexte.campaignId,
        name: projete.name,
        type: projete.type ?? 'npc',
        role: projete.role ?? 'neutral',
        status: 'alive',
        avatar: '',
        // `santeSelonLeJeu` lit les points RENDUS par la Forge, donc avant le repli.
        healthSystem: santeSelonLeJeu(contexte.driver, projete),
        hp: projete.hp ?? 0,
        maxHp: projete.maxHp ?? 0,
        ac: 0,
        speed: 0,
        initiative: 0,
        description: projete.description ?? '',
        roleplayingNotes: projete.roleplayingNotes ?? '',
        gmSecretInfo: projete.gmSecretInfo ?? '',
        linkedMapIds: contexte.lieuId ? [contexte.lieuId] : [],
        templateId: contexte.templateId,
        ...(contexte.faction ? { faction: contexte.faction } : {}),
        relations: [],
    };
}

/**
 * Un indice, et son moment.
 *
 * `campaignMoment` porte le **titre** de l'acte et non son identifiant : c'est
 * un champ de texte libre, lu par des écrans qui l'affichent tel quel. Le
 * traduire en identifiant l'aurait rendu illisible partout où il s'affiche.
 */
function construireLIndice(
    projete: IndiceProjete,
    contexte: { id: string; campaignId: string; ownerId?: string; locationId?: string },
): Clue {
    return {
        id: contexte.id,
        campaignId: contexte.campaignId,
        title: projete.title,
        content: projete.content ?? '',
        isRevealed: false,
        ...(contexte.ownerId ? { ownerId: contexte.ownerId } : {}),
        ...(contexte.locationId ? { locationId: contexte.locationId } : {}),
        ...(projete.acte ? { campaignMoment: projete.acte } : {}),
    };
}
