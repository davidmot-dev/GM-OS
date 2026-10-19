import type { MediaItem } from '../../../stores/useMediaStore';
import type { Atmosphere } from '../../sound/useSoundStore';
import type { Playlist } from '../../music/useMusicStore';
import type { LightScene } from '../../light/useLightStore';
import type { ImageMedia, ImageFolder, Diaporama } from '../../image/types';
import type { StoryboardMoment } from '../../storyboard/useStoryboardStore';
import { idDeCase, numeroDeCase } from '../../light/logic/ratelierDeLaCampagne';
import { tuilePorteUnEtat } from '../../light/logic/tuilePorteUnEtat';
import { reecrireLesIdentifiants, type Fabrique } from './clonerLaCampagne';
import type { LigneDuRecensement } from './recensementDeLArchive';

/**
 * **L'archive des médias d'une campagne (`.gmos-medias`)** — lot E5 du chantier
 * des archives (2026-10-19, `documentation/Planning/2026-10-18-chantier-archives-de-campagne.md`).
 *
 * L'archive de campagne (`.gmos`) emporte *ce qui fait la campagne*. Celle-ci
 * emporte *ce qui se réutilise* : on la réimporte **dans une autre campagne**
 * du même univers pour y retrouver ses images, ses sons, ses musiques et ses
 * éclairages. Décisions de David (§ 7) : **tous les médias de la campagne**, et
 * les **fichiers audio copiés dans l'archive**.
 *
 * Ce fichier est **pur** : il rassemble à partir d'instantanés des magasins, et
 * planifie un import sans rien écrire. Les écritures sont dans `NexusService`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TROIS RÈGLES DE L'IMPORT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. **Un média garde son identifiant.** Un média déjà là reçoit l'étiquette de
 *    la campagne cible ; un média absent revient sous son identifiant d'origine
 *    (`restaurerUnMedia`). Pas de doublon, et tout ce qui le désigne — un pad,
 *    une carte — le trouve. *Un identifiant neuf donne un disque plein et des
 *    liens morts, le pire résultat parce qu'il a l'air d'une réussite* (leçon du
 *    miroir des médias, 29/08).
 * 2. **Ambiances, playlists et tuiles sont COPIÉES pour la cible.** Les
 *    réétiqueter les retirerait à la campagne d'origine, si elle est sur ce
 *    poste. Sauf quand la cible EST la campagne d'origine (réimport « tel
 *    quel ») : alors on garde les identifiants, et la fusion remplace.
 * 3. **Une tuile ne s'écrase jamais.** Elle prend la case de même numéro dans
 *    le râtelier de la cible si elle est libre ou vide, sinon la suivante.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IMAGE-OS, ET RIEN D'AUTRE — décision de David, 2026-10-19
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Image-OS n'a pas d'étiquette de campagne : on emporte **ce que la campagne
 * utilise** — les images et diaporamas appelés par ses moments de storyboard,
 * et les images dont le média est étiqueté pour elle — avec leurs dossiers. À
 * l'import, ce qui est déjà là **n'est pas remplacé** : la bibliothèque d'Image-OS
 * est commune, la version du poste est la plus récente.
 *
 * ⛔ **Le reste ne s'archive pas, et c'est voulu** : réglages et brouillard des
 * cartes, paquets de cartes, tables aléatoires, calendriers, ambiances et
 * playlists sans étiquette. *Ils n'appartiennent pas à une campagne* (David) :
 * ils restent sur le poste.
 */

export const NEXUS_MEDIAS_EXTENSION = '.gmos-medias';

export interface NexusMediasState {
    /** La campagne d'où viennent les médias — pour le dire, et pour le réimport « tel quel ». */
    origine: { campaignId: string; campaignName: string; system?: string };
    /** Les fiches du Media Hub ; les octets voyagent dans `assets/`, sous `originalRef` = l'identifiant. */
    medias: MediaItem[];
    atmospheres: Atmosphere[];
    playlists: Playlist[];
    tuilesDeLumiere: LightScene[];
    /** Ce qu'Image-OS tient pour la campagne (2026-10-19). Facultatif : rien n'oblige une archive à en porter. */
    imageOs?: { images: ImageMedia[]; dossiers: ImageFolder[]; diaporamas: Diaporama[] };
}

/** La bibliothèque d'Image-OS, telle que l'archive la lit. */
export interface BibliothequeDImageOs {
    mediaList: readonly ImageMedia[];
    folders: readonly ImageFolder[];
    diaporamas: readonly Diaporama[];
}

/**
 * **Ce qu'Image-OS tient pour une campagne** : les images et diaporamas que ses
 * moments appellent, les images dont le média est étiqueté pour elle (`etiquetes`,
 * des identifiants du Media Hub), et les dossiers qui les rangent — parents
 * compris, pour que le rangement revienne entier.
 */
export function ceQuImageOsTientPourLaCampagne(
    campaignId: string,
    moments: readonly StoryboardMoment[],
    bibliotheque: BibliothequeDImageOs,
    etiquetes: ReadonlySet<string>,
): { images: ImageMedia[]; dossiers: ImageFolder[]; diaporamas: Diaporama[] } {
    const siens = moments.filter(m => m.campaignId === campaignId);
    const diaporamasAppeles = new Set(siens.map(m => m.diaporamaId).filter((id): id is string => !!id));
    const diaporamas = bibliotheque.diaporamas.filter(d => diaporamasAppeles.has(d.id));
    const appelees = new Set<string>([
        ...siens.map(m => m.imageMediaId).filter((id): id is string => !!id),
        ...diaporamas.flatMap(d => d.imageIds),
    ]);
    const images = bibliotheque.mediaList.filter(i => appelees.has(i.id) || etiquetes.has(i.path));

    const parId = new Map(bibliotheque.folders.map(f => [f.id, f]));
    const dossiers = new Map<string, ImageFolder>();
    for (const image of images) {
        let id = image.folderId ?? null;
        while (id && !dossiers.has(id) && parId.has(id)) {
            const dossier = parId.get(id)!;
            dossiers.set(id, dossier);
            id = dossier.parentId ?? null;
        }
    }
    return { images, dossiers: [...dossiers.values()], diaporamas };
}

const estUnMedia = (ref: string | null | undefined): ref is string => !!ref && ref.startsWith('m-');
const estUnFichier = (ref: string | null | undefined): ref is string =>
    !!ref && !ref.startsWith('m-') && !/^(https?:|blob:|data:)/.test(ref);

/** Les références de fichiers que portent des ambiances et des playlists. */
function referencesDesSons(atmospheres: readonly Atmosphere[], playlists: readonly Playlist[]): string[] {
    return [
        ...atmospheres.flatMap(a => Object.values(a.pads ?? {}).map(p => p.filePath)),
        ...playlists.flatMap(pl => (pl.pads ?? []).filter(p => p.type === 'local').map(p => p.url)),
    ].filter((r): r is string => !!r);
}

/**
 * **Ce qu'emporte l'archive des médias d'une campagne.**
 *
 * Les médias du Media Hub étiquetés pour elle, **plus** ceux que ses ambiances
 * et playlists désignent sans qu'ils portent l'étiquette — un son du hub glissé
 * dans un pad n'est pas étiqueté pour autant, et sans lui le pad serait muet.
 *
 * `fichiers` : les chemins du disque (sons et musiques hors Media Hub), copiés
 * dans l'archive par le pont Electron.
 */
export function rassemblerLesMedias(
    campagne: { id: string; name: string; system?: string },
    magasins: {
        mediaList: readonly MediaItem[]; atmospheres: readonly Atmosphere[]; playlists: readonly Playlist[]; scenes: Record<string, LightScene>;
        /** Image-OS et les moments qui l'appellent (2026-10-19). Absents : l'archive n'en porte pas. */
        imageOs?: BibliothequeDImageOs; moments?: readonly StoryboardMoment[];
    },
): { state: NexusMediasState; fichiers: string[] } {
    const atmospheres = magasins.atmospheres.filter(a => a.campagneId === campagne.id);
    const playlists = magasins.playlists.filter(p => p.campagneId === campagne.id);
    const tuilesDeLumiere = Object.values(magasins.scenes).filter(t => t.campagneId === campagne.id);
    const etiquetes = new Set(magasins.mediaList.filter(m => (m.campaignIds ?? []).includes(campagne.id)).map(m => m.id));
    const imageOs = magasins.imageOs
        ? ceQuImageOsTientPourLaCampagne(campagne.id, magasins.moments ?? [], magasins.imageOs, etiquetes)
        : undefined;
    // Ce que les pads ET Image-OS désignent : un média du hub part, un fichier du disque est copié.
    const references = [...referencesDesSons(atmospheres, playlists), ...(imageOs?.images ?? []).map(i => i.path)];
    const designes = new Set(references.filter(estUnMedia));
    const medias = magasins.mediaList.filter(m => etiquetes.has(m.id) || designes.has(m.id));
    return {
        state: {
            origine: { campaignId: campagne.id, campaignName: campagne.name, system: campagne.system },
            medias, atmospheres, playlists, tuilesDeLumiere,
            ...(imageOs ? { imageOs } : {}),
        },
        fichiers: [...new Set(references.filter(estUnFichier))],
    };
}

/** L'aperçu et le bilan d'une archive des médias, comptés pareil. */
export function recenserLesMedias(state: NexusMediasState): LigneDuRecensement[] {
    const parType = (t: MediaItem['type']) => state.medias.filter(m => m.type === t).length;
    const lignes: [string, number][] = [
        ['images', parType('image')],
        ['sons', parType('audio')],
        ['vidéos', parType('video')],
        ['documents', parType('document')],
        ['ambiances sonores', state.atmospheres.length],
        ['playlists', state.playlists.length],
        ['tuiles de lumière', state.tuilesDeLumiere.length],
        ["images d'Image-OS", state.imageOs?.images.length ?? 0],
        ['diaporamas', state.imageOs?.diaporamas.length ?? 0],
    ];
    return lignes.filter(([, n]) => n > 0).map(([libelle, nombre]) => ({ libelle, nombre }));
}

const auHasard: Fabrique = prefixe => `${prefixe}-${crypto.randomUUID()}`;

/**
 * **Où vont les ambiances, playlists et tuiles de l'archive**, dans la campagne
 * `cible`. Ne touche à rien : rend ce qu'il faut poser.
 *
 * @param casesLocales toutes les tuiles du poste, tous râteliers confondus
 */
export function planifierLImportDesMedias(
    archive: NexusMediasState,
    cible: string,
    casesLocales: Record<string, LightScene>,
    nouvelId: Fabrique = auHasard,
): { atmospheres: Atmosphere[]; playlists: Playlist[]; tuilesDeLumiere: LightScene[]; telQuel: boolean; imageOs?: NexusMediasState['imageOs'] } {
    const telQuel = cible === archive.origine.campaignId;
    const table = new Map<string, string>();

    if (!telQuel) {
        for (const a of archive.atmospheres) table.set(a.id, nouvelId('atm'));
        for (const pl of archive.playlists) {
            table.set(pl.id, nouvelId('pl'));
            for (const pad of pl.pads ?? []) table.set(pad.id, nouvelId('pad'));
        }

        /*
          Les tuiles : le même numéro dans le râtelier de la cible s'il est libre
          ou vide, sinon le premier numéro qui l'est. Une case « vide » est une
          case que `casesAGarnir` a posée et que personne n'a réglée.
        */
        const prises = new Set<string>();
        const libre = (id: string) => !prises.has(id) && (!casesLocales[id]
            || (casesLocales[id].campagneId === cible && !tuilePorteUnEtat(casesLocales[id])));
        /*
          Deux passes : d'abord chaque tuile qui peut garder son numéro, ensuite
          les autres dans la première case libre. En une passe, une tuile
          déplacée prendrait la case d'une suivante qui pouvait rester à sa place.
        */
        const triees = [...archive.tuilesDeLumiere].sort((a, b) => numeroDeCase(a.id) - numeroDeCase(b.id));
        const aPlacer = [];
        for (const tuile of triees) {
            const meme = idDeCase(cible, numeroDeCase(tuile.id) || 1);
            if (libre(meme)) { prises.add(meme); table.set(tuile.id, meme); } else aPlacer.push(tuile);
        }
        for (const tuile of aPlacer) {
            let id = idDeCase(cible, 1);
            for (let n = 2; !libre(id); n++) id = idDeCase(cible, n);
            prises.add(id);
            table.set(tuile.id, id);
        }
    }

    const r = <T>(v: T) => reecrireLesIdentifiants(v, table);
    return {
        telQuel,
        // Image-OS est commun : ses identifiants restent, et l'import n'ajoute que ce qui manque.
        imageOs: archive.imageOs,
        atmospheres: archive.atmospheres.map(a => ({ ...r(a), campagneId: cible })),
        playlists: archive.playlists.map(pl => ({ ...r(pl), campagneId: cible })),
        tuilesDeLumiere: archive.tuilesDeLumiere.map(t => ({ ...r(t), campagneId: cible })),
    };
}

/**
 * Les sons qui venaient d'un **fichier du disque** sont entrés au Media Hub sous
 * un identifiant neuf : on y fait pointer les pads. `entres` : chemin d'origine
 * → identifiant du Media Hub.
 */
export function pointerVersLesMediasEntres<T extends { atmospheres: Atmosphere[]; playlists: Playlist[]; imageOs?: NexusMediasState['imageOs'] }>(
    plan: T, entres: Record<string, string>,
): T {
    const nouveau = (ref: string | null) => (ref && entres[ref]) || ref;
    return {
        ...plan,
        ...(plan.imageOs ? { imageOs: { ...plan.imageOs, images: plan.imageOs.images.map(i => ({ ...i, path: nouveau(i.path) ?? i.path })) } } : {}),
        atmospheres: plan.atmospheres.map(a => ({
            ...a,
            pads: Object.fromEntries(Object.entries(a.pads ?? {}).map(([k, p]) => [k, { ...p, filePath: nouveau(p.filePath) }])),
        })),
        playlists: plan.playlists.map(pl => ({
            ...pl,
            pads: (pl.pads ?? []).map(p => (p.type === 'local' ? { ...p, url: nouveau(p.url) ?? p.url } : p)),
        })),
    };
}

/**
 * **Ce qu'Image-OS reçoit** : ce qui manque, et rien d'autre. Une image, un
 * dossier ou un diaporama déjà là (même identifiant) reste tel qu'il est — la
 * version du poste est la plus récente, et Image-OS est commun à toutes les
 * campagnes. Rend les listes complétées et le nombre de chaque ajout.
 */
export function completerImageOs(
    local: BibliothequeDImageOs,
    arrivee: NonNullable<NexusMediasState['imageOs']>,
): { mediaList: ImageMedia[]; folders: ImageFolder[]; diaporamas: Diaporama[]; ajouts: { images: number; dossiers: number; diaporamas: number } } {
    const ajouter = <T extends { id: string }>(la: readonly T[], venus: readonly T[]) => {
        const deja = new Set(la.map(x => x.id));
        const nouveaux = venus.filter(x => !deja.has(x.id));
        return { liste: [...la, ...nouveaux], n: nouveaux.length };
    };
    const images = ajouter(local.mediaList, arrivee.images);
    const dossiers = ajouter(local.folders, arrivee.dossiers);
    const diaporamas = ajouter(local.diaporamas, arrivee.diaporamas);
    return {
        mediaList: images.liste, folders: dossiers.liste, diaporamas: diaporamas.liste,
        ajouts: { images: images.n, dossiers: dossiers.n, diaporamas: diaporamas.n },
    };
}
