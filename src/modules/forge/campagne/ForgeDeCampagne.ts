/**
 * La Forge de campagne : les fiches deviennent des objets de jeu.
 *
 * **Elle ne lit plus le livre, elle lit les fiches** — et un étage à la fois,
 * dans l'ordre de leurs dépendances, chacun ne pouvant désigner que ce que les
 * précédents ont créé. C'est le mécanisme de `forgeSystemDepuisCorpus`, transposé
 * à la narration ; il n'y en a pas deux, parce que deux boucles concurrentes
 * finiraient par ne plus traiter les échecs de la même façon.
 *
 * **Ce qu'elle rend n'est pas encore dans le magasin.** Elle produit un *projet*
 * — des objets nommés, dont les renvois sont des **noms** et non des
 * identifiants. La résolution des noms et l'écriture viennent après, et
 * séparément : c'est ce qui permet au meneur de tout relire avant que quoi que
 * ce soit ne touche sa campagne, et c'est aussi ce qui laisse la place au
 * signalement des non-résolus plutôt qu'à leur filtrage silencieux
 * (`crossDomainHelpers.ts:42`).
 */

import { AIService } from '../../ai/AIService';
import type { GameDriver } from '../../../types/drivers';
import {
    GROUPES_DE_LA_TRAME, promptDuGroupe, fichesDuGroupe,
    type GroupeDeLaTrame, type VocabulaireDeLaTrame,
} from './GroupesDeLaTrame';
import { partiesDesFiches, type FicheDeCampagneLue } from './lectureDesFiches';
import { lireLaStructure } from './structureDeCampagne';
import { normaliser } from '../rules/canevas';

// ─────────────────────────────────────────────
// Ce que la Forge produit
// ─────────────────────────────────────────────

export interface ChampsDeCampagne {
    name: string;
    description?: string;
    synopsis?: string;
}

export interface ActeProjete {
    titre: string;
    resume?: string;
    notesDuMeneur?: string;
}

export interface LieuProjete {
    name: string;
    type?: 'battlemap' | 'world-map' | 'region' | 'city' | 'dungeon';
    narrativeDescription?: string;
    gmNotes?: string;
}

export interface EntreeProjetee {
    title: string;
    content?: string;
    category?: string;
    tags?: string[];
}

export interface PnjProjete {
    name: string;
    type?: 'npc' | 'monster';
    role?: 'ally' | 'neutral' | 'hostile' | 'boss';
    description?: string;
    faction?: string;
    lieu?: string;
    roleplayingNotes?: string;
    gmSecretInfo?: string;
    hp?: number;
    maxHp?: number;
    /** L'acte où la passe qui l'a produit se tenait. Le premier, s'il revient. */
    acte?: string;
}

export interface RelationProjetee {
    source: string;
    cible: string;
    type: string;
    description?: string;
}

export interface IndiceProjete {
    title: string;
    content?: string;
    porteur?: string;
    lieu?: string;
    acte?: string;
}

export interface SceneProjetee {
    titre: string;
    resume?: string;
    notesDuMeneur?: string;
    lieu?: string;
    pnj?: string[];
    indices?: string[];
    /** L'acte de la passe. Toujours renseigné : ce groupe ne se forge que par acte. */
    acte: string;
}

/** Une campagne entière, nommée mais pas encore écrite. */
export interface ProjetDeCampagne {
    campagne?: ChampsDeCampagne;
    actes: ActeProjete[];
    lieux: LieuProjete[];
    factions: EntreeProjetee[];
    pnj: PnjProjete[];
    relations: RelationProjetee[];
    indices: IndiceProjete[];
    scenes: SceneProjetee[];
    savoir: EntreeProjetee[];
}

export function projetVide(): ProjetDeCampagne {
    return { actes: [], lieux: [], factions: [], pnj: [], relations: [], indices: [], scenes: [], savoir: [] };
}

/** Une passe qui n'a rien rendu, et pourquoi. */
export interface EchecDeForge {
    groupe: string;
    acte?: string;
    raison: string;
}

/**
 * Ce que la Forge a dû combler ou n'a pas pu obtenir, sans que ce soit un échec.
 *
 * *Un manque annoncé se corrige ; un manque tu se joue à table.* Cette liste est
 * la raison pour laquelle la Forge ne se contente pas de rendre des objets.
 */
export interface LacuneDeForge {
    quoi: string;
    consequence: string;
}

export interface ResultatDeForge {
    projet: ProjetDeCampagne;
    echecs: EchecDeForge[];
    lacunes: LacuneDeForge[];
    interrompue: boolean;
}

/** Où en est la forge, à l'usage de l'écran. */
export interface AvancementDeForge {
    groupe: GroupeDeLaTrame;
    acte?: string;
    /** Passes terminées, celle-ci comprise. */
    rang: number;
    /**
     * Passes prévues **en l'état des connaissances**.
     *
     * Il grandit une fois, quand les actes sont connus : les deux groupes par
     * acte valent alors une passe par acte. Annoncer un total faux dès le départ
     * aurait été plus confortable et moins vrai.
     */
    total: number;
}

// ─────────────────────────────────────────────
// La boucle
// ─────────────────────────────────────────────

const SYSTEM_PROMPT =
    "Tu es l'archiviste de la Forge GM-OS. Tu rends EXCLUSIVEMENT un objet JSON compact et "
    + 'valide, sans texte avant ni après. Si les fiches ne permettent pas de répondre, rends un '
    + 'objet vide {}.';

/** Le vocabulaire disponible pour l'étage suivant, relu du projet en cours. */
export function vocabulaireDuProjet(projet: ProjetDeCampagne): VocabulaireDeLaTrame {
    return {
        actes: projet.actes.map(a => a.titre).filter(Boolean),
        lieux: projet.lieux.map(l => l.name).filter(Boolean),
        factions: projet.factions.map(f => f.title).filter(Boolean),
        pnj: projet.pnj.map(p => p.name).filter(Boolean),
        indices: projet.indices.map(i => i.title).filter(Boolean),
    };
}

/** Les entrées d'un tableau rendu par le modèle, ou rien s'il n'a pas rendu de tableau. */
function tableau<T>(reponse: unknown, clef: string): T[] {
    const valeur = (reponse as Record<string, unknown> | null | undefined)?.[clef];
    return Array.isArray(valeur) ? (valeur as T[]) : [];
}

/**
 * Range ce qu'une passe a rendu, en écartant les doublons de nom.
 *
 * **Le dédoublonnage n'est pas cosmétique.** Un PNJ pivot est décrit dans deux
 * actes — c'est même le signe qu'il compte. Sans cette passe, la campagne
 * porterait deux Milo Torricelli, les renvois se répartiraient au hasard entre
 * les deux, et le meneur en corrigerait un sur deux sans jamais comprendre
 * pourquoi l'autre reste faux. On garde la **première** occurrence : c'est celle
 * de l'acte le plus précoce, donc celle qui présente le personnage.
 */
function ajouterSansDoublon<T>(existants: T[], nouveaux: T[], nom: (item: T) => string): number {
    const vus = new Set(existants.map(item => normaliser(nom(item))));
    let ajoutes = 0;
    for (const item of nouveaux) {
        const clef = normaliser(nom(item));
        if (!clef || vus.has(clef)) continue;
        vus.add(clef);
        existants.push(item);
        ajoutes += 1;
    }
    return ajoutes;
}

/**
 * Ce qu'une passe a rendu, et ce qu'on en a gardé.
 *
 * **Les deux nombres ne disent pas la même chose, et les confondre a failli
 * coûter un faux échec.** Un PNJ pivot est décrit dans deux actes : la seconde
 * passe rend un personnage et n'en ajoute aucun. Compter les seuls objets
 * *retenus* aurait fait consigner « le modèle n'a rien rendu d'exploitable » sur
 * une réponse parfaitement juste — et le meneur serait allé chercher une panne
 * là où il n'y avait qu'une redite. *Un échec annoncé à tort use la confiance
 * dans tous les autres.*
 */
interface Recolte {
    /** Objets présents dans la réponse du modèle. */
    rendus: number;
    /** Objets réellement ajoutés au projet — les doublons ne comptent pas. */
    retenus: number;
}

/** Range la réponse d'une passe dans le projet. */
function recolter(
    projet: ProjetDeCampagne,
    groupe: GroupeDeLaTrame,
    reponse: unknown,
    acte?: string,
): Recolte {
    const ranger = <T>(cible: T[], items: T[], nom: (item: T) => string): Recolte =>
        ({ rendus: items.length, retenus: ajouterSansDoublon(cible, items, nom) });

    switch (groupe.id) {
        case 'campagne': {
            const champs = (reponse as { campagne?: ChampsDeCampagne } | null)?.campagne;
            if (!champs?.name) return { rendus: 0, retenus: 0 };
            projet.campagne = champs;
            return { rendus: 1, retenus: 1 };
        }
        case 'actes':
            return ranger(projet.actes, tableau<ActeProjete>(reponse, 'actes'), a => a.titre);
        case 'lieux':
            return ranger(projet.lieux, tableau<LieuProjete>(reponse, 'lieux'), l => l.name);
        case 'factions':
            return ranger(projet.factions, tableau<EntreeProjetee>(reponse, 'factions'), f => f.title);
        case 'pnj':
            return ranger(
                projet.pnj,
                tableau<PnjProjete>(reponse, 'pnj').map(p => ({ ...p, ...(acte ? { acte } : {}) })),
                p => p.name,
            );
        case 'relations': {
            // Les relations ne se dédoublonnent pas par nom : deux personnages
            // peuvent être liés de deux façons, et la paire n'est pas un nom.
            const liens = tableau<RelationProjetee>(reponse, 'relations')
                .filter(r => r.source && r.cible && r.type);
            projet.relations.push(...liens);
            return { rendus: liens.length, retenus: liens.length };
        }
        case 'indices':
            return ranger(projet.indices, tableau<IndiceProjete>(reponse, 'indices'), i => i.title);
        case 'scenes': {
            /*
              **Les scènes ne se dédoublonnent PAS entre actes.** Deux actes
              peuvent porter une scène du même nom — « Le retour à l'hôtel » — et
              ce sont deux scènes. Le dédoublonnage se fait donc dans la passe,
              où deux titres identiques sont bien une répétition du modèle.
            */
            const dansLaPasse: SceneProjetee[] = [];
            const recolte = ranger(
                dansLaPasse,
                tableau<SceneProjetee>(reponse, 'scenes').map(s => ({ ...s, acte: acte ?? '' })),
                s => s.titre,
            );
            projet.scenes.push(...dansLaPasse);
            return recolte;
        }
        case 'savoir':
            return ranger(projet.savoir, tableau<EntreeProjetee>(reponse, 'savoir'), e => e.title);
        default:
            return { rendus: 0, retenus: 0 };
    }
}

export interface OptionsDeForge {
    /** Le pilote du jeu, tiré du `jeu:` des fiches. */
    driver?: GameDriver;
    /**
     * La langue dans laquelle écrire la prose — un code, `fr`, `en`…
     *
     * Vient de la campagne (`Campaign.langueDeForge`), avec la langue de
     * l'interface pour repli. Absente, aucune consigne n'est posée et le modèle
     * suit la langue des fiches — le comportement d'avant le 2026-08-17.
     */
    langue?: string;
    groupes?: readonly GroupeDeLaTrame[];
    onProgres?: (avancement: AvancementDeForge) => void;
    /** Consulté avant chaque passe. Vrai : on s'arrête et on rend l'acquis. */
    abandonne?: () => boolean;
    /** Injectable pour les tests : par défaut, `AIService.generateJSON`. */
    appeler?: (prompt: string, schema: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Les actes, **lus localement et jamais demandés à un modèle**.
 *
 * **Le défaut du 2026-08-16, et il était total.** Les actes étaient un groupe
 * comme les autres : on servait la fiche de structure à un modèle en lui
 * demandant la liste des parties. Or cette fiche est un **tableau à quatre
 * colonnes**, dont la dernière énumère les titres de chapitre du livre. Sur « Le
 * secret de Milo », le modèle a aplati cette colonne : trente actes nommés
 * « Introduction », « Explorer l'usine », « Le Sea-You »… Aucune fiche ne
 * portant ces titres en `partie:`, les soixante passes de PNJ et de scènes qui
 * ont suivi sont toutes tombées à vide.
 *
 * **`lireLaStructure` sait déjà faire ce travail, exactement.** Elle est
 * déterministe, testée, connaît les trois formes que le carnet emploie — et
 * surtout, **c'est elle qui a produit les `partie:` des fiches** au moment de
 * l'atelier. Relire la même fiche avec la même fonction garantit des titres
 * identiques au caractère près : l'appariement acte ↔ fiches cesse d'être un
 * pari sur la constance du modèle.
 *
 * *On demande au carnet ce qu'il sait produire, on fabrique localement ce qui
 * doit être exact.* La règle était écrite dans `ServiceDeCampagne` ; je ne l'ai
 * pas appliquée ici.
 */
export function etablirLesActes(
    fiches: readonly FicheDeCampagneLue[],
): { actes: ActeProjete[]; lacune?: LacuneDeForge } {
    const structure = fiches.find(f => normaliser(f.sujet) === normaliser('Structure en actes'));

    if (structure) {
        const lus = lireLaStructure(structure.contenu);
        if (lus.length > 0) {
            return {
                actes: lus.map(a => ({
                    titre: a.titre,
                    ...(a.enjeu ? { resume: a.enjeu } : {}),
                })),
            };
        }
    }

    /*
      **Le repli sur le `partie:` des fiches**, pour tout corpus antérieur au
      2026-08-16 : l'Atelier lisait la structure et la gardait en mémoire. Les
      titres survivent — chaque fiche par acte porte le sien —, les enjeux non.
      On comble donc les titres et on l'ANNONCE, plutôt que de faire inventer un
      enjeu. *Un acte sans enjeu se corrige à la main en trente secondes ; un
      enjeu inventé se joue.*
    */
    const titres = partiesDesFiches(fiches);
    if (titres.length === 0) return { actes: [] };

    return {
        actes: titres.map(titre => ({ titre })),
        lacune: {
            quoi: "les actes ont été reconstitués depuis le « partie: » des fiches",
            consequence: structure
                ? "la fiche de structure existe mais n'a pas pu être lue : ses enjeux sont perdus, "
                  + 'les titres viennent des fiches. À relire à la main.'
                : "leurs titres sont justes, mais leur enjeu est vide : la structure n'a pas été "
                  + "enregistrée par l'Atelier. À écrire à la main, ou à reforger après une "
                  + 'nouvelle lecture de la structure.',
        },
    };
}

/**
 * Projette les fiches d'une campagne en objets de jeu.
 *
 * Ne lève jamais sur une passe ratée : un groupe qui échoue est consigné et les
 * suivants continuent avec le vocabulaire réellement acquis. **C'est ce qui
 * justifie de recalculer le vocabulaire à chaque tour** plutôt qu'une fois pour
 * toutes — sinon les étages suivants désigneraient des objets qu'un échec a
 * empêché d'exister.
 */
export async function forgerLaCampagne(
    fiches: readonly FicheDeCampagneLue[],
    options: OptionsDeForge = {},
): Promise<ResultatDeForge> {
    const groupes = options.groupes ?? GROUPES_DE_LA_TRAME;
    const projet = projetVide();
    const echecs: EchecDeForge[] = [];
    const lacunes: LacuneDeForge[] = [];
    let interrompue = false;
    let rang = 0;

    const appeler = options.appeler ?? ((prompt, schema) =>
        AIService.getInstance().generateJSON<unknown>(prompt, SYSTEM_PROMPT, [], {
            lite: true, sansPersona: true, schema,
        }));

    /*
      **Les actes sont établis AVANT la boucle, et sans appel au modèle.** Ils ne
      sortent pas d'une invite : ils se lisent dans la fiche de structure avec la
      fonction qui a produit le `partie:` des fiches. C'est ce qui rend
      l'appariement acte ↔ fiches exact par construction.
    */
    const structure = etablirLesActes(fiches);
    projet.actes.push(...structure.actes);
    if (structure.lacune) lacunes.push(structure.lacune);

    /** Les actes connus. Fixés d'emblée : plus rien ne les fait varier en cours de route. */
    const actesConnus = () => projet.actes.map(a => a.titre).filter(Boolean);

    const total = () => {
        const parActe = groupes.filter(g => g.parActe).length;
        const passesParActe = Math.max(actesConnus().length, 1) * parActe;
        return groupes.length - parActe + passesParActe;
    };

    for (const [index, groupe] of groupes.entries()) {
        const passes: (string | undefined)[] = groupe.parActe
            ? (actesConnus().length > 0 ? actesConnus() : [undefined])
            : [undefined];

        if (groupe.parActe && actesConnus().length === 0) {
            echecs.push({
                groupe: groupe.id,
                raison: "aucun acte n'a pu être établi : ce groupe se forge acte par acte",
            });
            continue;
        }

        for (const acte of passes) {
            if (options.abandonne?.()) {
                interrompue = true;
                break;
            }

            const retenues = fichesDuGroupe(groupe, fiches, acte);
            if (retenues.length === 0) {
                // Une passe sans fiche ne part pas : l'appel coûterait des
                // minutes pour que le modèle comble un vide, ce qui est
                // l'inverse exact du but de la Forge.
                echecs.push({
                    groupe: groupe.id,
                    ...(acte ? { acte } : {}),
                    raison: 'aucune fiche ne couvre ce sujet',
                });
                continue;
            }

            rang += 1;
            options.onProgres?.({ groupe, ...(acte ? { acte } : {}), rang, total: total() });

            const contexte = {
                vocabulaire: vocabulaireDuProjet(projet),
                ...(acte ? { acte } : {}),
                ...(options.driver ? { driver: options.driver } : {}),
                ...(options.langue ? { langue: options.langue } : {}),
            };

            try {
                const reponse = await appeler(
                    promptDuGroupe(groupe, retenues, contexte),
                    groupe.schema(contexte),
                );
                // Seul un vide *rendu* est un échec. Une passe qui ne fait que
                // redire ce qu'on sait déjà a bien répondu.
                if (recolter(projet, groupe, reponse, acte).rendus === 0) {
                    echecs.push({
                        groupe: groupe.id,
                        ...(acte ? { acte } : {}),
                        raison: "le modèle n'a rien rendu d'exploitable",
                    });
                }
            } catch (erreur) {
                echecs.push({
                    groupe: groupe.id,
                    ...(acte ? { acte } : {}),
                    raison: erreur instanceof Error ? erreur.message : String(erreur),
                });
            }
        }

        if (interrompue) {
            // Les groupes non traités sont des lacunes comme les autres : le
            // journal doit dire qu'ils manquent, pas laisser croire qu'ils sont
            // couverts. Repris tel quel de `forgeSystemDepuisCorpus`.
            for (const restant of groupes.slice(index)) {
                echecs.push({ groupe: restant.id, raison: 'forge interrompue avant ce groupe' });
            }
            break;
        }
    }

    return { projet, echecs, lacunes, interrompue };
}
