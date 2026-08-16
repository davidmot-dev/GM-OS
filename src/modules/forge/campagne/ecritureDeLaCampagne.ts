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
    /**
     * Plusieurs cibles convenaient également bien.
     *
     * **Un ex æquo est une ambiguïté, pas un choix.** On préfère ne rien poser
     * et le dire — c'est déjà le réflexe de `rabattreSurLeCanevas`, où deux
     * sujets à score égal renvoient au hors-canevas plutôt qu'au mauvais rang.
     */
    ambigu?: boolean;
}

/**
 * Un renvoi résolu **à peu près**, et qui mérite d'être relu.
 *
 * **Le cas réel du 2026-08-16 :** un indice désignait « Temple d'Ara-Manopell »
 * là où le lieu s'appelle « Temple d'Ara-Manopello ». Une lettre. Le lieu
 * existait, le renvoi était juste, et il a été jeté.
 *
 * *Un renvoi mal rattaché se voit et se corrige d'un clic ; un renvoi perdu
 * laisse une scène sans son lieu et ne dit plus rien après coup.* On rattache
 * donc, et on le signale — jamais l'un sans l'autre.
 */
export interface RenvoiApproche {
    depuis: string;
    champ: string;
    /** Ce que le modèle a écrit. */
    ecrit: string;
    /** Ce à quoi on l'a rattaché. */
    retenu: string;
}

/** Un objet déjà présent dans la campagne, laissé tel quel. */
export interface ObjetConserve {
    quoi: string;
    nom: string;
}

// ─────────────────────────────────────────────
// L'annuaire des noms
// ─────────────────────────────────────────────

/** Ce qu'une recherche dans l'annuaire a donné. */
type Trouvaille =
    | { etat: 'exact'; id: string }
    | { etat: 'approche'; id: string; nom: string }
    | { etat: 'ambigu' }
    | { etat: 'absent' };

/**
 * En deçà, deux noms ne se ressemblent plus : ils partagent un début.
 *
 * 0,85 laisse passer une lettre perdue sur quinze — la troncature du
 * 2026-08-16, « Manopell » pour « Manopello », vaut 0,95 — et écarte
 * « Le Sea-You » face à « Le Sea-You et la remontée du fleuve ».
 */
const SEUIL_DE_RESSEMBLANCE = 0.85;

/** Un nom trop court n'a pas assez de matière pour qu'une approche ait un sens. */
const LONGUEUR_MINIMALE = 4;

/**
 * Nom → identifiant, **par degrés**.
 *
 * **La consigne vise le meilleur cas, la résolution encaisse le cas réel.** On a
 * demandé au modèle la recopie exacte ; exiger l'exactitude ici ferait perdre
 * une scène entière pour un accent — puis, comme le 2026-08-16 l'a montré, pour
 * une lettre.
 *
 * Trois degrés, du plus sûr au plus tolérant :
 *
 * 1. **Égalité normalisée** — accents, casse et ponctuation absorbés. Silencieux.
 * 2. **Préfixe de mot entier**, dans un sens ou dans l'autre : « Milo » désigne
 *    « Milo Torricelli ». Signalé.
 * 3. **Préfixe partiel très proche** ({@link SEUIL_DE_RESSEMBLANCE}) : c'est la
 *    troncature, « Manopell » pour « Manopello ». Signalé.
 *
 * **Un ex æquo ne résout rien.** Deux « Milo » dans la campagne, et « Milo »
 * seul ne désigne plus personne : on rend `ambigu` plutôt que de tirer au sort.
 * Même règle que `rabattreSurLeCanevas`, pour la même raison — *une cible
 * plausible et fausse est pire qu'une cible absente, puisqu'elle ne se signale
 * pas.*
 *
 * Le premier inscrit gagne : un doublon de nom est déjà écarté en amont, et
 * réécrire l'entrée ferait pointer les renvois vers le dernier venu.
 */
class Annuaire {
    private readonly parNom = new Map<string, { id: string; nom: string }>();

    public inscrire(nom: string | undefined, id: string): void {
        const clef = normaliser(nom ?? '');
        if (!clef || this.parNom.has(clef)) return;
        this.parNom.set(clef, { id, nom: nom ?? '' });
    }

    public chercher(nom: string | undefined): Trouvaille {
        const clef = normaliser(nom ?? '');
        if (!clef) return { etat: 'absent' };

        const exact = this.parNom.get(clef);
        if (exact) return { etat: 'exact', id: exact.id };

        const candidats = [...this.parNom.entries()]
            .filter(([inscrit]) => proches(clef, inscrit))
            .map(([, valeur]) => valeur);

        if (candidats.length === 1) {
            return { etat: 'approche', id: candidats[0].id, nom: candidats[0].nom };
        }
        return candidats.length > 1 ? { etat: 'ambigu' } : { etat: 'absent' };
    }
}

/** Deux noms normalisés désignent-ils vraisemblablement la même chose ? */
function proches(a: string, b: string): boolean {
    if (a.length < LONGUEUR_MINIMALE || b.length < LONGUEUR_MINIMALE) return false;

    // Degré 2 — préfixe de mot entier. « Milo » pour « Milo Torricelli ».
    if (a.startsWith(`${b} `) || b.startsWith(`${a} `)) return true;

    // Degré 3 — troncature. « Manopell » pour « Manopello ».
    if (!a.startsWith(b) && !b.startsWith(a)) return false;
    return Math.min(a.length, b.length) / Math.max(a.length, b.length) >= SEUIL_DE_RESSEMBLANCE;
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
    /** Renvois rattaches a peu pres — poses, mais a relire. */
    approximatifs: RenvoiApproche[];
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
    const approximatifs: RenvoiApproche[] = [];
    const conserves: ObjetConserve[] = [];

    const campaignId = options.campaignId ?? neuf('c');
    const templateId = options.driver?.templateId || 'generic';

    /**
     * Cherche une cible, rattache ce qui s'approche, et **dit tout ce qui n'est
     * pas une égalité**.
     *
     * Trois issues, trois traitements : l'exact passe en silence, l'approché est
     * posé **et** signalé, l'absent comme l'ambigu ne sont pas posés et sont
     * signalés. Aucun cas ne se règle sans laisser de trace.
     */
    const resoudre = (
        annuaire: Annuaire,
        nom: string | undefined,
        depuis: string,
        champ: string,
    ): string | undefined => {
        if (!nom?.trim()) return undefined;

        const trouvaille = annuaire.chercher(nom);
        switch (trouvaille.etat) {
            case 'exact':
                return trouvaille.id;
            case 'approche':
                approximatifs.push({ depuis, champ, ecrit: nom, retenu: trouvaille.nom });
                return trouvaille.id;
            case 'ambigu':
                nonResolus.push({ depuis, champ, nom, ambigu: true });
                return undefined;
            default:
                nonResolus.push({ depuis, champ, nom });
                return undefined;
        }
    };

    // ── Les actes ────────────────────────────────
    const annuaireDesActes = new Annuaire();
    const actesExistants = (existant.actes ?? []).filter(a => a.campaignId === campaignId);
    for (const acte of actesExistants) annuaireDesActes.inscrire(acte.titre, acte.id);

    const actes: Acte[] = [];
    let ordreActe = apres(actesExistants);
    for (const projete of projet.actes) {
        if (!projete.titre?.trim()) continue;
        if (annuaireDesActes.chercher(projete.titre).etat === 'exact') {
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
        if (annuaireDesLieux.chercher(projete.name).etat === 'exact') {
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
        if (annuaireDuWiki.chercher(titre).etat === 'exact') {
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
        if (annuaireDesPnj.chercher(projete.name).etat === 'exact') {
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
        const faction = ((): string | undefined => {
            const ecrit = projete.faction?.trim();
            if (!ecrit) return undefined;

            const trouvaille = nomsDeFactions.chercher(ecrit);
            if (trouvaille.etat === 'exact') return ecrit;
            if (trouvaille.etat === 'approche') {
                // On ADOPTE le nom canonique : deux graphies d'une même faction
                // couperaient le graphe social en deux moitiés muettes.
                approximatifs.push({ depuis, champ: 'faction', ecrit, retenu: trouvaille.nom });
                return trouvaille.nom;
            }
            nonResolus.push({
                depuis, champ: 'faction', nom: ecrit,
                ...(trouvaille.etat === 'ambigu' ? { ambigu: true } : {}),
            });
            return ecrit;
        })();

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
        if (annuaireDesIndices.chercher(projete.title).etat === 'exact') {
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
        liensSurExistants, nonResolus, approximatifs, conserves,
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
