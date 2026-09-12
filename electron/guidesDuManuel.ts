import path from 'node:path';
import fs from 'fs-extra';
import { strictementSous } from './sousChemin';
import { DOSSIER_DU_MANUEL, type GuideDuManuel } from './formeDuManuel';

/* Réexportés pour les appelants du processus principal, qui n'ont pas à savoir
   que la forme vit à côté. Les écrans, eux, importent `formeDuManuel`. */
export { DOSSIER_DU_MANUEL, FAMILLES_DU_MANUEL, type GuideDuManuel } from './formeDuManuel';

/**
 * **Le manuel du meneur, lu depuis le disque.**
 *
 * Les guides de `documentation/User Guides/` sont la documentation que David
 * écrit et relit ; elle vivait jusqu'ici **hors de l'application**, dans un
 * dossier qu'il fallait ouvrir à côté. Ce module la fait entrer dans GM-OS.
 *
 * ⚠️ **Ils sont lus, jamais écrits.** Rien ici n'expose d'écriture : un manuel
 * qu'on peut modifier depuis l'écran qui le consulte est un manuel qui finit par
 * mentir sans qu'on sache quand. Il se corrige dans le dépôt, comme le reste.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI TOUT CHARGER D'UN COUP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 456 Ko de markdown au total, mesurés. C'est assez peu pour tenir en mémoire, et
 * c'est ce qui rend la **recherche instantanée** : elle porte sur le corps des
 * guides, pas seulement sur leurs titres, et une recherche qui doit relire le
 * disque à chaque frappe n'est pas une recherche, c'est une attente.
 *
 * *Si le manuel devait dépasser quelques mégaoctets, ce choix serait à refaire —
 * et la mesure est écrite ici pour qu'on sache quand.*
 */

/** Le premier titre de niveau 1, sans son `#`. */
function titreDuGuide(contenu: string, nom: string): string {
    const ligne = contenu.split('\n').find(l => l.startsWith('# '));
    if (!ligne) {
        /* Pas de titre : on rend le nom de fichier nettoyé plutôt qu'une chaîne
           vide — *un guide sans titre doit rester cliquable.* */
        return nom.replace(/\.md$/, '').replace(/^\d+-/, '').replace(/-/g, ' ');
    }
    return ligne.slice(2).trim();
}

function familleDuGuide(nom: string): string {
    const premier = nom[0];
    return premier >= '0' && premier <= '9' ? premier : 'autres';
}

/**
 * Lit tous les guides du manuel.
 *
 * `racine` est la racine de l'application (`APP_ROOT`). Le dossier absent n'est
 * pas une erreur : il rend une liste vide, et l'écran dira qu'il n'y a rien —
 * *une installation sans son manuel doit démarrer quand même.*
 */
export async function lireLesGuides(racine: string): Promise<GuideDuManuel[]> {
    const dossier = path.join(racine, DOSSIER_DU_MANUEL);
    if (!(await fs.pathExists(dossier))) return [];

    const entrees = await fs.readdir(dossier, { withFileTypes: true });
    const noms = entrees
        .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.md'))
        .map(e => e.name)
        /* L'ordre des numéros EST l'ordre de lecture voulu — l'index le dit :
           « le dossier se lit donc dans le même ordre que cet index ». */
        .sort((a, b) => a.localeCompare(b, 'fr'));

    const guides: GuideDuManuel[] = [];
    for (const nom of noms) {
        const complet = path.join(dossier, nom);

        /*
          Le nom vient de `readdir`, donc du disque : il ne peut pas sortir du
          dossier. La garde est là pour le jour où un appelant passera autre
          chose — *une lecture de fichier sans garde est une lecture de fichier
          qui attend son premier appelant distrait.*
        */
        if (!strictementSous(complet, dossier)) continue;

        try {
            const contenu = await fs.readFile(complet, 'utf-8');
            guides.push({
                nom,
                titre: titreDuGuide(contenu, nom),
                famille: familleDuGuide(nom),
                contenu,
            });
        } catch (err) {
            /* Un guide illisible ne doit pas emporter les cinquante et un
               autres. On le signale et on continue. */
            console.warn(`[Manuel] Guide illisible, ignoré : ${nom}`, err);
        }
    }

    return guides;
}
