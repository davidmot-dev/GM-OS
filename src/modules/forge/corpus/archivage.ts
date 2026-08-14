import { cheminDesFiches, cheminDesArchives, type Corpus } from '../../../../electron/corpusSysteme';
import { sujetDuFrontmatter } from '../rules/fichesSupplantees';

/**
 * Lire et écarter les fiches d'un corpus, sans jamais en perdre une.
 *
 * **Pourquoi ce module existe.** L'archivage automatique posé à la publication
 * ne couvre que ce que la Forge écrit elle-même. David, le 2026-08-14 : *« il
 * serait bon que je puisse faire ce nettoyage moi-même »* — et il a raison, un
 * corpus se répare aussi à la main, après une reforge ratée, un import, ou un
 * défaut de lecture comme celui des numéros en toutes lettres.
 *
 * **Écarter, jamais supprimer.** Les fiches partent dans `rules-v1/`, exclu de
 * l'index de l'Oracle par le `.ragignore` racine. Elles sortent du corpus
 * vivant sans quitter le disque : comparer une fiche à celle qu'elle remplace a
 * déjà servi, et une reforge ratée doit pouvoir se rattraper.
 */

/** Une fiche du corpus, telle que l'écran de nettoyage la montre. */
export interface FicheDuDossier {
    nom: string;
    /** Le `sujet:` du frontmatter, ou `null` — une fiche sans sujet n'entre dans aucun groupe. */
    sujet: string | null;
    /** Un autre fichier du dossier porte-t-il le même sujet ? */
    enDouble: boolean;
}

/** Le pont, réduit à ce dont l'archivage a besoin. */
type PontFichiers = NonNullable<NonNullable<Window['appBridge']>['ai']>;

/**
 * Les fiches publiées d'un corpus, avec leur sujet et les doublons signalés.
 *
 * Le doublon se juge sur le **sujet normalisé**, jamais sur le nom : c'est le
 * seul lien qui survive à une reforge, puisque le slug est justement ce qui
 * change. Une fiche sans sujet n'est jamais en double — elle n'entre dans aucun
 * groupe, donc elle ne peut être la concurrente de personne.
 */
export async function lireLesFiches(corpus: Corpus, pont: PontFichiers): Promise<FicheDuDossier[]> {
    const dossier = cheminDesFiches(corpus);
    const noms = (await pont.listDir?.(dossier).catch(() => [] as string[]) ?? [])
        .filter(nom => nom.endsWith('.md'))
        .sort();

    const lues = await Promise.all(noms.map(async nom => ({
        nom,
        sujet: sujetDuFrontmatter((await pont.readDoc?.(`${dossier}/${nom}`).catch(() => '')) ?? ''),
    })));

    const comptes = new Map<string, number>();
    for (const f of lues) {
        if (!f.sujet) continue;
        const clef = f.sujet.trim().toLowerCase();
        comptes.set(clef, (comptes.get(clef) ?? 0) + 1);
    }

    return lues.map(f => ({
        ...f,
        enDouble: !!f.sujet && (comptes.get(f.sujet.trim().toLowerCase()) ?? 0) > 1,
    }));
}

/**
 * Déplace une fiche vers `rules-v1/`. Rend le motif d'échec, ou `null`.
 *
 * **On relit avant d'écrire, et on n'efface qu'après avoir écrit.** Un
 * archivage qui poserait un fichier vide détruirait la fiche au lieu de la
 * mettre de côté ; un effacement avant écriture la perdrait si le disque
 * refusait. L'ordre n'est pas négociable.
 */
export async function archiverUneFiche(
    corpus: Corpus,
    nom: string,
    pont: PontFichiers,
): Promise<string | null> {
    const source = `${cheminDesFiches(corpus)}/${nom}`;
    try {
        const contenu = await pont.readDoc?.(source);
        if (!contenu) return 'la fiche n\'a pas pu être relue — rien n\'a été déplacé.';

        const ecrit = await pont.writeDoc?.(`${cheminDesArchives(corpus)}/${nom}`, contenu);
        if (!ecrit) return "l'écriture dans rules-v1/ a été refusée — rien n'a été déplacé.";

        const efface = await pont.deleteDoc?.(source);
        if (!efface) return 'la copie est dans rules-v1/, mais l\'original n\'a pas pu être effacé.';
        return null;
    } catch (erreur) {
        return erreur instanceof Error ? erreur.message : String(erreur);
    }
}
