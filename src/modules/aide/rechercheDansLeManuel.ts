import type { GuideDuManuel } from '../../../electron/formeDuManuel';

/**
 * **Chercher dans le manuel — titres, sections et corps.**
 *
 * La recherche universelle (`Ctrl+K`) sait mener à un guide ; elle ne sait pas
 * dire **où** dans le guide, ni montrer la phrase qui répond. C'est ce que ce
 * moteur ajoute : il cherche dans les 456 Ko de markdown, rend la section qui
 * porte la réponse et l'extrait qui l'entoure.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LES DEUX CÔTÉS SONT DÉACCENTUÉS, ET C'EST UNE LEÇON PAYÉE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-08-23, l'Oracle déaccentuait **le mot cherché et pas le corps** : le
 * mot « réussite » était invisible dans treize fiches sur vingt-et-une. Le
 * défaut ne se voit pas — la recherche répond, elle répond juste moins.
 *
 * Ici les deux passent par `sansAccent`. *Une normalisation appliquée d'un seul
 * côté est pire qu'aucune : elle donne l'illusion de fonctionner.*
 */

/** Minuscules et sans diacritiques — appliqué au texte ET à la requête. */
export function sansAccent(texte: string): string {
    return texte
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();
}

export interface ResultatDuManuel {
    guide: GuideDuManuel;
    /** Le titre de la section `##` qui porte la réponse, s'il y en a une. */
    section: string | null;
    /** Une phrase autour de la première occurrence, pour choisir sans ouvrir. */
    extrait: string;
    /** Plus il est haut, plus le guide répond. Sert au tri, pas à l'affichage. */
    rang: number;
    /** Nombre d'occurrences dans le corps — affiché quand il y en a plusieurs. */
    occurrences: number;
}

/**
 * Les mots de la requête, vides écartés.
 *
 * ⚠️ **Tous doivent être présents.** Une recherche « jet caché » qui rendrait les
 * guides parlant de jets *ou* de cachettes rendrait le manuel entier — et un
 * moteur qui rend tout ne rend rien.
 */
function motsDe(requete: string): string[] {
    return sansAccent(requete).split(/\s+/).filter(m => m.length > 0);
}

/**
 * La section `##` qui porte une position donnée.
 *
 * ⚠️ **Un titre qui CONTIENT le mot est la bonne section**, pas la précédente.
 * La première version coupait le contenu à la position et cherchait dedans :
 * quand le mot tombait dans le titre lui-même, ce titre était tronqué, ne
 * correspondait plus, et c'est la section d'avant qui était annoncée. Chercher
 * « réussite » renvoyait donc vers « Les modes de jet ».
 *
 * On compare donc au **début** de chaque titre, sur le contenu entier.
 */
function sectionPortant(contenu: string, position: number): string | null {
    let trouve: string | null = null;
    for (const titre of contenu.matchAll(/^##+\s+(.+)$/gm)) {
        if (titre.index! > position) break;
        trouve = titre[1].trim();
    }
    return trouve;
}

/**
 * Un extrait centré sur la position, coupé aux espaces.
 *
 * On ne coupe pas au milieu d'un mot : un extrait qui commence par « …ussite »
 * demande un effort de lecture pour rien.
 */
function extraitAutour(contenu: string, position: number, largeur = 160): string {
    const debut = Math.max(0, position - largeur / 2);
    const fin = Math.min(contenu.length, position + largeur / 2);

    let morceau = contenu.slice(debut, fin).replace(/\s+/g, ' ').trim();
    if (debut > 0) morceau = morceau.replace(/^\S*\s/, '… ');
    if (fin < contenu.length) morceau = morceau.replace(/\s\S*$/, ' …');
    return morceau;
}

/**
 * Cherche dans le manuel.
 *
 * Le classement répond à « où est la réponse ? » plutôt qu'à « où le mot
 * apparaît-il le plus ? » : **un titre qui porte le mot bat un corps qui le
 * répète dix fois**, parce qu'un guide intitulé « Projeter un jet » répond mieux
 * à *projeter un jet* qu'une page qui en parle en passant.
 */
export function chercherDansLeManuel(
    guides: GuideDuManuel[],
    requete: string,
): ResultatDuManuel[] {
    const mots = motsDe(requete);
    if (mots.length === 0) return [];

    const resultats: ResultatDuManuel[] = [];

    for (const guide of guides) {
        const titre = sansAccent(guide.titre);
        const corps = sansAccent(guide.contenu);

        /* Tous les mots, sinon rien — voir `motsDe`. */
        if (!mots.every(m => titre.includes(m) || corps.includes(m))) continue;

        let rang = 0;
        for (const mot of mots) {
            if (titre.includes(mot)) rang += 100;
            /* Une section qui porte le mot vaut mieux qu'une phrase perdue. */
            if (new RegExp(`^##+\\s.*${mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm').test(corps)) rang += 25;
        }

        /*
          La fréquence départage, elle ne décide pas : plafonnée à 20 points pour
          qu'un guide long ne gagne pas contre un guide juste.
        */
        const premier = mots[0];
        const occurrences = corps.split(premier).length - 1;
        rang += Math.min(occurrences, 20);

        const position = corps.indexOf(premier);
        resultats.push({
            guide,
            section: position >= 0 ? sectionPortant(guide.contenu, position) : null,
            extrait: position >= 0 ? extraitAutour(guide.contenu, position) : guide.titre,
            rang,
            occurrences,
        });
    }

    /* À rang égal, l'ordre des numéros — celui du manuel, donc celui que David a
       voulu. *Un tri instable ferait danser la liste entre deux frappes.* */
    return resultats.sort((a, b) => b.rang - a.rang || a.guide.nom.localeCompare(b.guide.nom, 'fr'));
}
