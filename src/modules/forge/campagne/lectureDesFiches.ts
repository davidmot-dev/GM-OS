/**
 * Lire les fiches d'une campagne, telles qu'elles sont sur le disque.
 *
 * **Le jumeau de `lireFichesDuCorpus`, et il diffère sur trois points.** La
 * Forge Système lit des fiches qui n'ont qu'un axe — un sujet, un jeu, une
 * réponse. Une campagne en a deux : dix sujets, et pour deux d'entre eux, un
 * découpage par acte. Une fiche de campagne porte donc `partie:` en plus de
 * `sujet:`, et **la perdre reviendrait à mélanger les PNJ des trois actes dans
 * une seule invite** — exactement ce que le second axe de découpage existe pour
 * éviter.
 *
 * Elle porte aussi `jeu:`, écrit par l'Atelier alors qu'il n'en avait aucun
 * usage (§ « Les fiches portent le jeu », 2026-08-15). C'est ici qu'il sert :
 * la Forge y prend le modèle de santé des PNJ et le gabarit de fiche, sans
 * redemander au meneur ce qui était déjà écrit.
 *
 * **Le troisième point est un écart volontaire.** La fiche « Règles propres à
 * cette campagne » est lue puis **mise à part** : son contenu ne doit alimenter
 * aucun objet de jeu. Décision de David du 2026-08-15 — *le pilote appartient au
 * jeu, pas à la campagne*. On ne la jette pas pour autant : l'écran doit pouvoir
 * dire qu'elle existe et qu'elle n'a nourri personne, sinon son absence des
 * groupes se lirait comme un oubli.
 */

import {
    cheminDesFichesDeCampagne, type CorpusDeCampagne,
} from '../../../../electron/corpusDeCampagne';
import {
    champDeLaFiche, corpsDeLaFiche, type AccesAuxFiches, type FichierIgnore,
} from '../rules/lectureDuCorpus';
import { CLEF_DES_REGLES_PROPRES, clefCanoniqueDeCampagne } from './canevasDeCampagne';

/** Une fiche de campagne, prête à nourrir un groupe de la Forge. */
export interface FicheDeCampagneLue {
    /**
     * Le sujet **rabattu sur le canevas** quand il s'y laisse ramener.
     *
     * Le carnet rend « Personnages non joueurs majeurs » là où le canevas dit
     * « Personnages non joueurs » ; les groupes désignent leurs fiches par la
     * clé canonique. Rabattre ici plutôt qu'à l'appariement évite que chaque
     * groupe ne réinvente sa tolérance.
     */
    sujet: string;
    /** Le sujet tel que la fiche l'écrit — à afficher, jamais à apparier. */
    sujetEcrit: string;
    /** Le titre de l'acte qui borne cette fiche, pour les deux sujets par acte. */
    partie?: string;
    /** Le corps de la fiche, frontmatter retiré. */
    contenu: string;
}

export interface LectureDesFichesDeCampagne {
    /** Le dossier lu — à afficher, parce qu'un dossier vide et un mauvais dossier se ressemblent. */
    chemin: string;
    fiches: FicheDeCampagneLue[];
    /**
     * Les fiches lues mais délibérément tenues hors des groupes.
     *
     * Aujourd'hui : celle des règles propres à la campagne. Distinctes des
     * `ignorees`, qui sont des échecs de lecture — *ne pas confondre ce qu'on
     * n'a pas su lire avec ce qu'on a choisi de ne pas employer.*
     */
    ecartees: { sujet: string; raison: string }[];
    ignorees: FichierIgnore[];
    /**
     * Le jeu déclaré par les fiches, s'il l'est.
     *
     * Rendu ici plutôt que cherché plus tard : c'est la seule lecture du disque
     * de toute la Forge, et le redemander obligerait à rouvrir les fichiers.
     */
    jeu?: string;
}

/** Le pont, quand il est là. */
function accesParDefaut(): AccesAuxFiches {
    const ai = window.appBridge?.ai;
    if (!ai?.listDir || !ai?.readDoc) {
        throw new Error(
            "Le pont de lecture des fichiers n'est pas disponible : relancez l'application.",
        );
    }
    return { listDir: ai.listDir, readDoc: ai.readDoc };
}

/**
 * Toutes les fiches publiées d'une campagne.
 *
 * Lit `fiches/` et **jamais `drafts/`** : un brouillon n'a pas été relu, et une
 * campagne forgée depuis des brouillons porterait des faits que personne n'a
 * vérifiés — c'est déjà la règle de l'index de l'Oracle, elle n'a aucune raison
 * de fléchir ici.
 *
 * Ne lève que si le pont manque : un dossier absent rend une lecture vide, ce
 * qui est l'état normal d'une campagne que l'Atelier n'a pas encore travaillée.
 */
export async function lireLesFichesDeLaCampagne(
    corpus: CorpusDeCampagne,
    acces: AccesAuxFiches = accesParDefaut(),
): Promise<LectureDesFichesDeCampagne> {
    const chemin = cheminDesFichesDeCampagne(corpus);
    const noms = (await acces.listDir(chemin).catch(() => [] as string[]))
        .filter(nom => nom.endsWith('.md'));

    const fiches: FicheDeCampagneLue[] = [];
    const ecartees: { sujet: string; raison: string }[] = [];
    const ignorees: FichierIgnore[] = [];
    let jeu: string | undefined;

    const lus = await Promise.all(
        noms.map(async nom => ({
            nom,
            contenu: await acces.readDoc(`${chemin}/${nom}`).catch(() => null),
        })),
    );

    for (const { nom, contenu } of lus) {
        if (!contenu || !contenu.trim()) {
            ignorees.push({ fichier: nom, raison: 'fichier vide ou illisible' });
            continue;
        }

        const sujetEcrit = champDeLaFiche(contenu, 'sujet');
        if (!sujetEcrit) {
            ignorees.push({ fichier: nom, raison: 'aucun « sujet: » dans le frontmatter' });
            continue;
        }

        // Le jeu se prend sur la première fiche qui le déclare. Elles viennent
        // toutes de la même campagne : une divergence signalerait un mélange de
        // dossiers, et c'est alors le dossier qu'il faut regarder, pas la fiche.
        jeu = jeu || champDeLaFiche(contenu, 'jeu') || undefined;

        const corps = corpsDeLaFiche(contenu);
        if (!corps) {
            ignorees.push({ fichier: nom, raison: 'frontmatter seul, aucun contenu' });
            continue;
        }

        const sujet = clefCanoniqueDeCampagne(sujetEcrit) ?? sujetEcrit;
        if (sujet === CLEF_DES_REGLES_PROPRES) {
            ecartees.push({
                sujet: sujetEcrit,
                raison: "les règles appartiennent au jeu, jamais à la campagne : cette fiche ne sert qu'à l'Oracle",
            });
            continue;
        }

        const partie = champDeLaFiche(contenu, 'partie');
        fiches.push({ sujet, sujetEcrit, contenu: corps, ...(partie ? { partie } : {}) });
    }

    return { chemin, fiches, ecartees, ignorees, ...(jeu ? { jeu } : {}) };
}

/**
 * Les actes que les fiches attestent, dans l'ordre où elles les nomment.
 *
 * **Lus des fiches et non de la structure**, parce que c'est ce dont la Forge
 * dispose : la réponse de structure a été consommée par l'Atelier et n'est nulle
 * part sur le disque, tandis que chaque fiche par acte porte son `partie:`. Un
 * acte dont aucune fiche ne parle n'existe pas pour la Forge — et c'est juste :
 * elle n'aurait rien à en projeter.
 */
export function partiesDesFiches(fiches: readonly FicheDeCampagneLue[]): string[] {
    const vues: string[] = [];
    for (const fiche of fiches) {
        if (fiche.partie && !vues.includes(fiche.partie)) vues.push(fiche.partie);
    }
    return vues;
}
