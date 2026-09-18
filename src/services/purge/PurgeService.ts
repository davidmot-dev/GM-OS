import { resoudreCorpus } from '../../../electron/corpusSysteme';
import { resoudreCorpusDeCampagne } from '../../../electron/corpusDeCampagne';
import type { GroupeDuCorpus } from '../../../electron/groupesDuCorpus';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { tousLesPilotes } from '../../modules/session/store/tousLesPilotes';
import { sessionBackupManager, fautIlSauvegarder } from '../../modules/session/logic/SessionBackupManager';
import {
    recenserLesDetenteurs, purgerLesDetenteurs,
    type RecensementDesDetenteurs,
} from './typesDeLaPurge';
import {
    LES_DETENTEURS_DE_CAMPAGNE, cibleDeLaCampagne, type CibleCampagne,
} from './detenteursDeLaCampagne';
import {
    LES_DETENTEURS_DE_PILOTE, cibleDuPilote, campagnesDuPilote, type CiblePilote,
} from './detenteursDuPilote';

/**
 * **Repartir de zéro sur un jeu ou sur une campagne — vraiment.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE BESOIN, DIT PAR DAVID LE 2026-09-18
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * *« Quand je les efface il reste des résidus qui polluent la tentative
 * suivante. »* Le diagnostic a donné deux causes, et la seconde n'est pas un
 * oubli :
 *
 * 1. Les suppressions ne nettoyaient que leur propre magasin — huit collections
 *    pour une campagne, **une ligne** pour un pilote.
 * 2. Le dossier du corpus restait entier, et la Forge **enrichit** un corpus
 *    existant. La tentative précédente revenait donc dans la suivante, en
 *    silence, parce que la Forge faisait exactement ce qu'on lui avait demandé.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS RÈGLES, ET ELLES VIENNENT TOUTES D'UN INCIDENT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **On montre avant d'agir.** `apercu…` ne touche à rien et nomme tout, module
 * par module et lot par lot. C'est la forme prise par le nettoyage des médias
 * après qu'un bouton unique eut effacé sans confirmation ni liste.
 *
 * **On prend un instantané d'abord.** Les campagnes de ce projet ont été perdues
 * deux fois. La sauvegarde automatique a fait son premier sauvetage réel le
 * 2026-09-11 ; ici, elle passe **avant** la purge, avec un motif qui dit quoi.
 * ⛔ On ne se contente pas de l'appeler : `sauvegarderMaintenant` ne lève jamais
 * et ne rend rien, donc on lit son verdict et on vérifie que la date a bougé —
 * *un filet qu'on ne vérifie pas n'est pas un filet, c'est une intention.*
 *
 * **On déplace, on ne détruit pas.** Les fichiers partent en quarantaine sous
 * `docs/_purges/`, arborescence gardée. Les remettre est un glisser-déposer.
 *
 * ⚠️ Ce que ce service ne fait **jamais** : toucher aux sauvegardes, au miroir
 * des médias, ou aux médias eux-mêmes. Une image sert souvent à plusieurs
 * campagnes ; c'est `MediaCleanupService` qui sait répondre à cette question, et
 * lui seul. *Deux services qui décident du sort d'un même fichier, c'est le
 * motif qu'on passe l'année à démonter.*
 */

export type GenrePurge = 'campagne' | 'pilote';

/** Ce qu'une purge ferait, avant de la faire. */
export interface ApercuDePurge {
    genre: GenrePurge;
    /** Le nom affiché de la cible — c'est lui qu'on redemande en confirmation. */
    nom: string;
    /** Ce que les magasins détiennent. */
    donnees: RecensementDesDetenteurs;
    /** Le dossier du corpus, s'il existe — `systems/alien`. */
    corpusRelatif?: string;
    /** Ses lots de fichiers, à cocher un par un. Vide si aucun dossier. */
    corpus: GroupeDuCorpus[];
    /**
     * Les campagnes qui jouent ce pilote. ⛔ **Non vide, l'écran refuse.**
     * Toujours vide pour une purge de campagne.
     */
    campagnesQuiJouent: { id: string; nom: string }[];
    /**
     * Les **autres** pilotes qui habitent le même dossier de corpus.
     *
     * ⚠️ Un avertissement, pas un barrage — la différence est voulue. Deux
     * pilotes peuvent partager un corpus tout à fait légitimement : `resoudreCorpus`
     * rapproche par nom affiché, donc « Alien » et « Alien — maison » tombent
     * tous deux sur `systems/alien`, et c'est souvent exprès. Mais déplacer les
     * fiches sans le dire viderait le corpus de l'autre en silence, et il
     * faudrait des semaines pour relier la panne au geste.
     */
    autresPilotesDuCorpus: string[];
    /** Faux quand le pont Electron manque : on ne promet pas ce qu'on ne peut pas faire. */
    disqueAccessible: boolean;
}

/** Ce qu'une purge a réellement fait. */
export interface BilanDePurge {
    ok: boolean;
    modulesPurges: string[];
    modulesEnEchec: string[];
    fichiersDeplaces: number;
    octetsDeplaces: number;
    /** Où retrouver ce qui a été déplacé. Vide si rien n'a bougé sur le disque. */
    quarantaine: string;
    /** Ce qui a empêché la purge d'avoir lieu. Vide quand tout s'est bien passé. */
    refus?: string;
    /**
     * Rempli quand la purge a eu lieu **sans** instantané préalable, avec la
     * raison. *Un filet absent se dit ; il ne se déduit pas d'un silence.*
     */
    sansInstantane?: string;
}

/** Ce que l'écran renvoie : les modules cochés, et les lots de fichiers cochés. */
export interface ChoixDePurge {
    modules: string[];
    /** Les clés des lots de `apercu.corpus` retenus. */
    lotsDuCorpus: string[];
}

const pont = () => window.appBridge?.purge;

// ─────────────────────────────────────────────────────────────────────────────
// Où vit le corpus
// ─────────────────────────────────────────────────────────────────────────────

/**
 * La racine du corpus d'un pilote, résolue **exactement comme le fait la
 * lecture**.
 *
 * C'est la règle d'août, et elle vaut ici plus que partout ailleurs : une purge
 * qui résout autrement que l'Oracle ne nettoierait pas le dossier que la Forge
 * va retrouver — elle en viderait un autre.
 */
async function corpusDuPilote(driverId: string): Promise<string | undefined> {
    const etat = useSessionOSStore.getState();
    const pilote = tousLesPilotes(etat.customGameDrivers).find(d => d.id === driverId);
    if (!pilote) return undefined;

    const dossiersConnus = await pont()?.dossiers('systems').catch(() => [] as string[])
        ?? await window.appBridge?.ai?.listSystems?.().catch(() => [] as string[])
        ?? [];

    /* `systemPath` de la campagne n'entre pas ici : il est souverain pour LIRE,
       mais il appartient à une campagne, et une purge de pilote n'en vise
       aucune. Le pilote répond de son propre corpus. */
    const corpus = resoudreCorpus({
        systemId: pilote.id,
        systemName: pilote.name,
        corpusId: pilote.corpusId,
        ragPath: pilote.ragPath,
        dossiersConnus,
    });
    return corpus.racine;
}

/** La racine du corpus d'une campagne, même principe. */
async function corpusDeLaCampagnePurgee(campaignId: string): Promise<string | undefined> {
    const campagne = useSessionOSStore.getState().campaigns.find(c => c.id === campaignId);
    if (!campagne) return undefined;

    /*
      ⚠️ **On ne passe PAS par `ai:list-dir`.** Il ne rend que des fichiers, donc
      la liste des dossiers de campagnes est toujours vide — le seul appelant
      existant en souffre depuis toujours sans que ça se voie. Ici ça se verrait
      très bien : on purgerait le mauvais dossier.
    */
    const dossiersConnus = await pont()?.dossiers('campaigns').catch(() => [] as string[]) ?? [];

    const corpus = resoudreCorpusDeCampagne({
        nom: campagne.name,
        campaignPath: campagne.campaignPath,
        dossiersConnus,
    });
    /* `aCreer` veut dire : aucun dossier de ce nom sur le disque. Rien à purger,
       et surtout rien à annoncer — *l'absence n'est pas un zéro, c'est un
       silence.* */
    return corpus.aCreer ? undefined : corpus.racine;
}

/**
 * Les autres pilotes qui résolvent vers le **même** dossier.
 *
 * On ne compare pas les identifiants ni les noms : on résout, et on compare le
 * résultat. *Deux pilotes qui portent des noms différents peuvent très bien
 * habiter le même dossier — c'est même le cas normal quand la Forge fabrique un
 * identifiant horodaté et que le rapprochement se fait par le nom affiché.*
 */
async function autresPilotesDuMemeCorpus(
    driverId: string, corpusRelatif: string | undefined,
): Promise<string[]> {
    if (!corpusRelatif) return [];

    const dossiersConnus = await pont()?.dossiers('systems').catch(() => [] as string[]) ?? [];
    return tousLesPilotes(useSessionOSStore.getState().customGameDrivers)
        .filter(d => d.id !== driverId)
        .filter(d => resoudreCorpus({
            systemId: d.id,
            systemName: d.name,
            corpusId: d.corpusId,
            ragPath: d.ragPath,
            dossiersConnus,
        }).racine === corpusRelatif)
        .map(d => d.name);
}

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu
// ─────────────────────────────────────────────────────────────────────────────

async function lotsDuCorpus(relatif: string | undefined): Promise<GroupeDuCorpus[]> {
    if (!relatif) return [];
    const inventaire = await pont()?.inventaireDuCorpus(relatif).catch(() => null);
    return inventaire?.trouve ? inventaire.groupes : [];
}

export async function apercuDeLaCampagne(campaignId: string): Promise<ApercuDePurge | null> {
    const cible = cibleDeLaCampagne(campaignId);
    if (!cible) return null;

    const corpusRelatif = await corpusDeLaCampagnePurgee(campaignId);
    return {
        genre: 'campagne',
        nom: cible.nom,
        donnees: recenserLesDetenteurs(LES_DETENTEURS_DE_CAMPAGNE, cible),
        corpusRelatif,
        corpus: await lotsDuCorpus(corpusRelatif),
        campagnesQuiJouent: [],
        autresPilotesDuCorpus: [],
        disqueAccessible: !!pont(),
    };
}

export async function apercuDuPilote(driverId: string): Promise<ApercuDePurge | null> {
    const corpusRelatif = await corpusDuPilote(driverId);
    const cible = cibleDuPilote(driverId, corpusRelatif);
    if (!cible) return null;

    return {
        genre: 'pilote',
        nom: cible.nom,
        donnees: recenserLesDetenteurs(LES_DETENTEURS_DE_PILOTE, cible),
        corpusRelatif,
        corpus: await lotsDuCorpus(corpusRelatif),
        campagnesQuiJouent: campagnesDuPilote(driverId),
        autresPilotesDuCorpus: await autresPilotesDuMemeCorpus(driverId, corpusRelatif),
        disqueAccessible: !!pont(),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Exécution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'instantané d'avant-purge.
 *
 * *Copier AVANT de diagnostiquer* est le premier réflexe d'incident de ce
 * projet ; purger est un incident qu'on provoque exprès. Après cet instantané,
 * les deux moitiés de la purge sont rattrapables : les fichiers par la
 * quarantaine, les données par ce fichier.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ POURQUOI ON NE SE CONTENTE PAS D'APPELER, ET D'ESPÉRER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `sauvegarderMaintenant` **ne lève jamais** et ne rend rien : un refus comme un
 * échec se journalisent, et l'appelant reçoit le même `undefined` que pour une
 * réussite. Un `try/catch` autour aurait donc *toujours* laissé passer — un
 * garde-fou qui a l'air d'en être un, ce qui est pire que pas de garde-fou.
 *
 * On demande donc son verdict au juge, qui est pur et public, **avant** — et on
 * vérifie ensuite que la date de dernière sauvegarde a bougé, ce que seule une
 * écriture réussie fait.
 *
 * Les trois refus qui arrêtent tout sont ceux qui décrivent un état où l'on ne
 * doit toucher à rien : une fenêtre secondaire, une écriture pas encore ouverte
 * (la base n'est pas relue), et les données de démonstration. Les deux autres —
 * pas de campagne, pas de pont — décrivent une situation où il n'y a rien à
 * sauver ; on avance, et **on le dit dans le bilan** plutôt que d'interdire un
 * geste légitime.
 */
async function instantanePrealable(
    genre: GenrePurge, nom: string,
): Promise<{ refus?: string; sansInstantane?: string }> {
    const verdict = fautIlSauvegarder(useSessionOSStore.getState());

    if (!verdict.ecrire) {
        if (verdict.raison === 'aucune-campagne' || verdict.raison === 'pont-absent') {
            return { sansInstantane: `Aucun instantané préalable (${verdict.details})` };
        }
        return { refus: `Sauvegarde préalable impossible — ${verdict.details} Rien n'a été purgé.` };
    }

    const avant = useSessionOSStore.getState().lastBackupAt;
    await sessionBackupManager.sauvegarderMaintenant(
        `avant la purge ${genre === 'pilote' ? 'du pilote' : 'de la campagne'} « ${nom} »`,
        /* Une purge FAIT baisser la taille du fichier, et c'est voulu — sans ce
           drapeau, la garde anti-écrasement refuserait précisément la sauvegarde
           dont on a le plus besoin. */
        { baisseAttendue: true },
    );

    if (useSessionOSStore.getState().lastBackupAt === avant) {
        return { refus: "La sauvegarde préalable n'a pas abouti : rien n'a été purgé." };
    }
    return {};
}

/** Les chemins des lots cochés, à plat. */
function cheminsRetenus(corpus: GroupeDuCorpus[], lotsChoisis: readonly string[]): string[] {
    const choisis = new Set(lotsChoisis);
    return corpus.filter(g => choisis.has(g.cle)).flatMap(g => g.fichiers);
}

async function executer(
    apercu: ApercuDePurge,
    choix: ChoixDePurge,
    purgerLesMagasins: () => { purges: string[]; echecs: string[] },
): Promise<BilanDePurge> {
    const vide: BilanDePurge = {
        ok: false, modulesPurges: [], modulesEnEchec: [],
        fichiersDeplaces: 0, octetsDeplaces: 0, quarantaine: '',
    };

    /*
      Le recensement incomplet interdit la purge, comme chez son voisin des
      médias : un magasin qui n'a pas su répondre peut très bien ne pas savoir
      rendre, et le meneur aurait confirmé une liste qui n'était pas la vraie.
    */
    if (!apercu.donnees.complet) {
        return { ...vide, refus: `Modules muets au recensement : ${apercu.donnees.modulesEnEchec.join(', ')}.` };
    }

    const instantane = await instantanePrealable(apercu.genre, apercu.nom);
    if (instantane.refus) return { ...vide, refus: instantane.refus };

    const chemins = cheminsRetenus(apercu.corpus, choix.lotsDuCorpus);
    let fichiersDeplaces = 0;
    let octetsDeplaces = 0;
    let quarantaine = '';
    const echecsDeFichiers: string[] = [];

    /*
      **Le disque d'abord, les magasins ensuite.** Si le déplacement échoue, on
      s'arrête avec des données intactes et un dossier intact — un état que le
      meneur reconnaît. Dans l'autre ordre, un échec du disque laisserait un
      pilote supprimé et son corpus en place : le pire des deux mondes, et
      précisément l'état qu'il essayait de quitter.
    */
    if (chemins.length > 0 && apercu.corpusRelatif && pont()) {
        const bilan = await pont()!.mettreEnQuarantaine(apercu.corpusRelatif, chemins, apercu.nom);
        fichiersDeplaces = bilan.deplaces;
        octetsDeplaces = bilan.octets;
        quarantaine = bilan.destination;
        echecsDeFichiers.push(...bilan.echecs);
        if (!bilan.ok && bilan.deplaces === 0) {
            return { ...vide, quarantaine, refus: "Aucun fichier n'a pu être déplacé : les données sont intactes." };
        }
    }

    const { purges, echecs } = purgerLesMagasins();

    return {
        ok: echecs.length === 0 && echecsDeFichiers.length === 0,
        modulesPurges: purges,
        modulesEnEchec: echecs,
        fichiersDeplaces,
        octetsDeplaces,
        quarantaine,
        sansInstantane: instantane.sansInstantane,
    };
}

export async function purgerLaCampagne(
    campaignId: string, apercu: ApercuDePurge, choix: ChoixDePurge,
): Promise<BilanDePurge> {
    /*
      ⚠️ La cible est **reconstruite ici**, et pas portée par l'aperçu : entre
      l'affichage et le clic, le meneur a pu jouer une scène. Ce qui doit rester
      identique, c'est la liste que l'on a montrée — donc les fichiers ; les
      scènes, elles, doivent être celles d'aujourd'hui, sinon on laisserait
      derrière un combat garé sur une scène créée entre-temps.
    */
    const cible: CibleCampagne | null = cibleDeLaCampagne(campaignId);
    if (!cible) {
        return {
            ok: false, modulesPurges: [], modulesEnEchec: [], fichiersDeplaces: 0,
            octetsDeplaces: 0, quarantaine: '', refus: 'Cette campagne n’existe plus.',
        };
    }
    return executer(apercu, choix,
        () => purgerLesDetenteurs(LES_DETENTEURS_DE_CAMPAGNE, cible, choix.modules));
}

export async function purgerLePilote(
    driverId: string, apercu: ApercuDePurge, choix: ChoixDePurge,
): Promise<BilanDePurge> {
    const cible: CiblePilote | null = cibleDuPilote(driverId, apercu.corpusRelatif);
    if (!cible) {
        return {
            ok: false, modulesPurges: [], modulesEnEchec: [], fichiersDeplaces: 0,
            octetsDeplaces: 0, quarantaine: '', refus: 'Ce pilote n’existe plus.',
        };
    }

    /*
      ⛔ **Le barrage est revérifié à l'exécution.** Il est déjà posé à
      l'affichage, mais l'aperçu peut dater de plusieurs minutes, et rattacher
      une campagne à un jeu est un geste d'un clic. *Une garde qui ne vit que
      dans l'écran est une garde qu'un aller-retour contourne.*
    */
    const attachees = campagnesDuPilote(driverId);
    if (attachees.length > 0) {
        return {
            ok: false, modulesPurges: [], modulesEnEchec: [], fichiersDeplaces: 0,
            octetsDeplaces: 0, quarantaine: '',
            refus: `${attachees.length} campagne(s) jouent encore ce pilote : ${attachees.map(c => c.nom).join(', ')}.`,
        };
    }

    return executer(apercu, choix,
        () => purgerLesDetenteurs(LES_DETENTEURS_DE_PILOTE, cible, choix.modules));
}

/** Ouvre le dossier des quarantaines — le geste qui rend la réversibilité vraie. */
export async function ouvrirLaQuarantaine(): Promise<void> {
    await pont()?.ouvrirLaQuarantaine();
}
