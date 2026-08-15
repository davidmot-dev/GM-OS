/**
 * Où vit le corpus d'une campagne — une question, une réponse, un seul endroit.
 *
 * **Symétrique de `corpusSysteme.ts`, et pour la même raison.** Là-bas, quatre
 * mécanismes concurrents désignaient le dossier d'un système et n'étaient
 * d'accord ni entre eux ni, surtout, **entre la lecture et l'écriture** : la
 * lecture retrouvait `docs/systems/dune` par un repli sur le nom affiché,
 * l'écriture n'avait pas ce repli et déposait les personas dans
 * `systems/custom-1754…/gems.json`, qui n'existe pas. Un `catch {}` avalait le
 * vide, et **les personas de Dune n'ont jamais servi sans que rien ne le dise**.
 *
 * On ne rejoue pas ce scénario du côté des campagnes. Ici il n'existe encore
 * qu'un seul champ — `campaign.campaignPath`, le « Chemin des Notes » — et
 * **aucun code n'écrit dedans**. C'est le bon moment pour poser la convention,
 * avant qu'un second mécanisme n'apparaisse.
 *
 * **La convention.** `docs/campaigns/<slug-du-nom>/`, avec :
 * - `fiches/` — les fiches sourcées, produites par l'Atelier de campagne ;
 * - `drafts/` — ce qui revient du carnet et n'a pas encore été relu ;
 * - `fiches-v1/` — les fiches supplantées par une reforge.
 *
 * Mêmes noms que côté système, à un près : `fiches/` au lieu de `rules/`,
 * puisqu'on ne range précisément **pas** des règles ici (décision de David du
 * 2026-08-15 : le pilote appartient au jeu, pas à la campagne).
 *
 * Module sans dépendance à `electron` ni à `node` : utilisable des deux côtés du
 * pont, et testé en environnement node — comme son jumeau.
 */

import { normaliseChemin, slug } from './corpusSysteme';

/** Dossier racine des campagnes, relatif à `docs/`. */
export const DOSSIER_CAMPAGNES = 'campaigns';

export type RaisonCorpusDeCampagne =
    /** « Chemin des Notes » de la fiche de campagne. Déclaré, donc souverain. */
    | 'chemin-declare'
    /** `campaigns/<slug du nom>` — la convention. */
    | 'convention'
    /** Ni nom ni chemin : il faut bien écrire quelque part. */
    | 'defaut';

export interface CorpusDeCampagne {
    /** Racine relative à `docs/` — par exemple `campaigns/agents-de-dune`. */
    racine: string;
    /** Nom du dossier seul — `agents-de-dune`. */
    id: string;
    raison: RaisonCorpusDeCampagne;
    /** Vrai quand le dossier n'existe pas encore parmi ceux connus. */
    aCreer: boolean;
    /**
     * Dossier que la **convention** aurait désigné, quand il diffère du chemin
     * déclaré.
     *
     * On ne change rien — le déclaré reste souverain, c'est la règle et elle est
     * explicite — mais on le dit. Une campagne renommée après coup garde son
     * ancien chemin déclaré, et ça se lit alors entre les lignes : c'est
     * exactement la contradiction que `corpusSysteme` a appris à annoncer après
     * qu'un pilote nommé « Dune » eut porté `systems/blade-runner`.
     */
    contradiction?: string;
}

export interface DemandeCorpusDeCampagne {
    /** Nom de la campagne, tel qu'il s'affiche. */
    nom?: string;
    /** « Chemin des Notes » de la fiche de campagne. */
    campaignPath?: string;
    /**
     * Dossiers présents sous `docs/campaigns/`.
     *
     * Sans cette liste, `aCreer` ne peut rien dire : on ne sait pas distinguer
     * un dossier absent d'un dossier qu'on n'a pas regardé. Il vaut alors
     * `false` — *l'absence n'est pas un zéro*, et annoncer une création qu'on
     * n'a pas vérifiée serait une affirmation, pas un silence.
     */
    dossiersConnus?: readonly string[];
}

function dernierSegment(chemin: string): string {
    const segments = chemin.split('/').filter(Boolean);
    return segments[segments.length - 1] ?? '';
}

/**
 * Résout la racine du corpus d'une campagne.
 *
 * **L'ordre est un ordre d'autorité, pas de commodité** : ce qui est déclaré à
 * la main l'emporte sur la convention. Ne rend jamais `null` — même sans
 * correspondance il faut un endroit où écrire, et `aCreer` dit alors que ce sera
 * un dossier neuf, ce qui mérite d'être montré avant d'écrire.
 */
export function resoudreCorpusDeCampagne(demande: DemandeCorpusDeCampagne): CorpusDeCampagne {
    const connus = demande.dossiersConnus;
    const parConvention = slug(demande.nom ?? '');

    const rendre = (racine: string, raison: RaisonCorpusDeCampagne): CorpusDeCampagne => {
        const id = dernierSegment(racine);
        const corpus: CorpusDeCampagne = {
            racine,
            id,
            raison,
            aCreer: !!connus && !connus.some(d => normaliseChemin(d) === normaliseChemin(id)),
        };
        if (parConvention && parConvention !== id) corpus.contradiction = parConvention;
        return corpus;
    };

    // 1. Le chemin déclaré sur la campagne. Explicite, donc souverain — et c'est
    //    déjà ce que `RAGService` transmet au moteur comme périmètre prioritaire.
    if (demande.campaignPath?.trim()) {
        return rendre(normaliseChemin(demande.campaignPath), 'chemin-declare');
    }

    // 2. La convention.
    if (parConvention) {
        return rendre(`${DOSSIER_CAMPAGNES}/${parConvention}`, 'convention');
    }

    // 3. Une campagne sans nom ni chemin. Rare, mais on ne refuse pas d'écrire.
    return rendre(`${DOSSIER_CAMPAGNES}/sans-nom`, 'defaut');
}

/**
 * Dossier des fiches de campagne.
 *
 * `fiches/` et non `rules/` : ce qu'on range ici décrit une histoire, pas un
 * système. Le nom du dossier est la première chose qu'on lit en ouvrant le
 * disque, et il ne doit pas laisser croire qu'on y a mis des règles.
 */
export function cheminDesFichesDeCampagne(corpus: CorpusDeCampagne): string {
    return `${corpus.racine}/fiches`;
}

/**
 * Dossier des brouillons — une fiche revenue du carnet, pas encore relue.
 *
 * Même rôle et même nom que côté système : une fiche coûte une à deux minutes de
 * carnet et serait perdue si l'atelier se fermait pendant la revue. Le brouillon
 * s'écrit dès le retour — un brouillon n'engage rien — et la revue devient une
 * *publication*, à froid, plus tard.
 *
 * À exclure de l'index de l'Oracle : une fiche non relue ne doit pas être citée
 * en séance.
 */
export function cheminDesBrouillonsDeCampagne(corpus: CorpusDeCampagne): string {
    return `${corpus.racine}/drafts`;
}

/**
 * Dossier des fiches supplantées par une reforge.
 *
 * **Sans lui, une reforge laisse l'ancienne fiche derrière elle** : le slug est
 * neuf, rien n'est écrasé, et les deux versions se retrouvent en concurrence
 * dans l'index — l'Oracle citant alors indifféremment l'une ou l'autre. Défaut
 * relevé sur le corpus de règles le 2026-08-14, et il n'y a aucune raison qu'il
 * épargne les campagnes.
 */
export function cheminDesFichesSupplanteesDeCampagne(corpus: CorpusDeCampagne): string {
    return `${corpus.racine}/fiches-v1`;
}
