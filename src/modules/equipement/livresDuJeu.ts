import { cheminDesFiches, corpusDeSupplement, systemePourLIndex, type Corpus } from '../../../electron/corpusSysteme';
import { champDeLaFiche } from '../forge/rules/lectureDuCorpus';
import type { SupplementDeclare } from '../forge/rules/supplements';
import { estUneFicheDEquipement, type FicheACataloguer } from './depuisLeCorpus';

/**
 * Les livres d'un jeu tels que l'aperçu « Remplir depuis le corpus » les lit —
 * registre § 203, étape C (02/11/2026) : le livre de base, puis chaque
 * supplément déclaré, avec leurs fiches relues qui portent un tableau
 * d'équipement.
 *
 * **Seule la lecture du disque vit ici** ; ce que les tableaux deviennent est
 * l'affaire de `remplirDepuisLesFiches`, qui s'essaie sans Electron.
 */
export interface LivreACataloguer {
    /** `jeu`, ou le slug du supplément. */
    cle: string;
    titre: string;
    /** Les fiches qui portent un tableau d'équipement, dans l'ordre du dossier. */
    fiches: FicheACataloguer[];
    /** Toutes les fiches du livre, pour dire « 8 fiches d'équipement sur 18 ». */
    total: number;
}

/**
 * Le titre que portera `source.livre`. Pour le livre de base, le `sources:` de
 * la fiche (« ALIEN, le jeu de rôle ») quand ce n'est pas un nom de fichier ;
 * un supplément garde le titre sous lequel David l'a déclaré.
 */
function titreDuLivreDeBase(fiches: readonly { contenu: string }[], repli: string): string {
    const source = fiches.map(f => champDeLaFiche(f.contenu, 'sources')).find(s => s && !/\.pdf$/i.test(s));
    return source || repli;
}

async function lireLeLivre(corpus: Corpus, cle: string, titre: string | null, repli: string): Promise<LivreACataloguer> {
    const ai = window.appBridge?.ai;
    const dossier = cheminDesFiches(corpus);
    const noms = ((await ai?.listDir?.(dossier).catch(() => [])) ?? []).filter(n => n.endsWith('.md')).sort();
    const lues = await Promise.all(noms.map(async nom => ({ chemin: `${dossier}/${nom}`, contenu: ((await ai?.readDoc?.(`${dossier}/${nom}`).catch(() => null)) as string | null) ?? '' })));
    const dEquipement = lues.filter(f => estUneFicheDEquipement(f.contenu));
    const livre = titre ?? titreDuLivreDeBase(dEquipement, repli);
    // Les pages : les sections que la fiche cite, résolues par l'index de CE livre.
    const fiches = await Promise.all(dEquipement.map(async f => {
        const verif = await ai?.resolveSections?.(systemePourLIndex(corpus), f.contenu).catch(() => null);
        const pages = (verif?.resolutions ?? []).flatMap(r => (r.page ? [{ titre: r.demande, page: r.page }] : []));
        return { ...f, livre, pages };
    }));
    return { cle, titre: titre ?? 'Livre de base', fiches, total: lues.length };
}

/** Le livre de base d'abord : ses noms font foi quand un supplément reprend le même objet. */
export async function lireLesLivresDuJeu(corpusDuJeu: Corpus, supplements: readonly SupplementDeclare[], nomDuJeu: string): Promise<LivreACataloguer[]> {
    const livres = [lireLeLivre(corpusDuJeu, 'jeu', null, nomDuJeu)];
    for (const s of supplements) {
        const corpus = corpusDeSupplement(corpusDuJeu, s.slug);
        if (corpus) livres.push(lireLeLivre(corpus, s.slug, s.titre, s.titre));
    }
    return Promise.all(livres);
}
