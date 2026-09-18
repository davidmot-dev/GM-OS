import path from 'node:path';
import fs from 'fs-extra';
import { ipcMain, shell } from 'electron';
import { strictementSous } from './sousChemin';
import { racineDuCorpus } from './perimetreDeLInstance';
import {
    corpusVise, nomDeLaQuarantaine, DOSSIER_DES_PURGES, RACINES_PURGEABLES,
} from './cheminDuCorpus';
import {
    grouperLeCorpus,
    type FichierDuCorpus, type GenreDeCorpus,
    type InventaireDuCorpus, type BilanDeQuarantaine,
} from './groupesDuCorpus';

/**
 * **Retirer un corpus du chemin de la Forge — sans le détruire.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE MODULE FAIT, ET CE QU'IL NE FAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il **déplace**. Jamais il ne supprime.
 *
 * Ce choix est celui de David (2026-09-18), et il tient à une histoire : les
 * campagnes de ce projet ont été perdues deux fois, et la première tentative de
 * sauvegarde automatique avait elle-même vidé l'application. *Dans une maison
 * qui a déjà brûlé, on ne pose pas d'allumettes près du rideau.* Les fichiers
 * retirés d'un corpus atterrissent donc dans `docs/_purges/<horodatage>-<nom>/`,
 * en gardant leur arborescence : les remettre en place est un glisser-déposer,
 * et personne n'a de mécanisme de restauration à écrire ni à maintenir.
 *
 * ⛔ **Le dossier de quarantaine vit sous `docs/`, donc l'Oracle le verrait.**
 * Une fiche « effacée » qui continue d'être citée serait pire que la pollution
 * qu'on vient corriger — on aurait déplacé le problème, littéralement. D'où le
 * `.ragignore` posé à la racine des purges **avant** le premier déplacement :
 * l'exclusion doit exister avant le fichier qu'elle exclut, pas après.
 *
 * ⚠️ Ce module ne connaît rien des pilotes ni des campagnes : il ne sait que
 * des chemins. Ce qui décide *quel* corpus purger vit côté rendu, dans
 * `detenteursDuPilote.ts`, et ce qui décide *quoi* dedans vit dans
 * `groupesDuCorpus.ts`. Trois questions, trois endroits.
 */

/** Tous les fichiers sous un dossier, chemins relatifs en `/`, avec leur taille. */
async function inventorier(racine: string, prefixe = ''): Promise<FichierDuCorpus[]> {
    const entrees = await fs.readdir(path.join(racine, prefixe), { withFileTypes: true });
    const trouves: FichierDuCorpus[] = [];

    for (const entree of entrees) {
        const relatif = prefixe ? `${prefixe}/${entree.name}` : entree.name;
        if (entree.isDirectory()) {
            trouves.push(...await inventorier(racine, relatif));
            continue;
        }
        if (!entree.isFile()) continue;
        const stats = await fs.stat(path.join(racine, relatif));
        trouves.push({ chemin: relatif, octets: stats.size });
    }
    return trouves;
}

/**
 * Retire les dossiers vides laissés derrière, de la feuille vers la racine.
 *
 * Sans ça, purger `rules/` laisse un `rules/` vide — et la prochaine forge
 * retrouverait un corpus « existant » au lieu d'un corpus neuf. *Ce qui décide
 * de « rejoint » ou « neuf », c'est la présence du dossier, pas son contenu.*
 * Le dossier du corpus lui-même part s'il ne reste plus rien.
 */
async function retirerLesDossiersVides(dossier: string, racineAProteger: string): Promise<void> {
    if (!await fs.pathExists(dossier)) return;
    const entrees = await fs.readdir(dossier, { withFileTypes: true });

    for (const entree of entrees) {
        if (entree.isDirectory()) {
            await retirerLesDossiersVides(path.join(dossier, entree.name), racineAProteger);
        }
    }

    if (!strictementSous(dossier, racineAProteger) && path.resolve(dossier) !== path.resolve(racineAProteger)) return;
    const reste = await fs.readdir(dossier);
    if (reste.length === 0) await fs.rmdir(dossier);
}

export function registerPurgeHandlers(): void {
    const racine = () => racineDuCorpus(process.env, process.env.APP_ROOT || '');

    /**
     * Ce qu'un corpus contient, rangé en lots — **et rien n'est touché.**
     *
     * Deux temps, comme le nettoyage des médias : on nomme d'abord, on agit
     * ensuite. *Ce qu'on ne peut pas défaire, on doit au moins pouvoir le
     * regarder d'abord* — et ici on peut le défaire, ce qui n'est pas une
     * raison pour se dispenser de montrer.
     */
    ipcMain.handle('purge:inventaire-corpus', async (_e, demande: string): Promise<InventaireDuCorpus> => {
        const vide = (relatif: string, genre: GenreDeCorpus | null): InventaireDuCorpus =>
            ({ trouve: false, relatif, genre, groupes: [], fichiers: 0, octets: 0 });

        const cible = corpusVise(racine(), demande);
        if (!cible) {
            console.warn(`[Purge] Chemin refusé (ce n'est pas un corpus) : ${demande}`);
            return vide(demande, null);
        }
        if (!await fs.pathExists(cible.absolu)) return vide(cible.relatif, cible.genre);

        const fichiers = await inventorier(cible.absolu);
        const groupes = grouperLeCorpus(fichiers, cible.genre);
        return {
            trouve: true,
            relatif: cible.relatif,
            genre: cible.genre,
            groupes,
            fichiers: fichiers.length,
            octets: fichiers.reduce((somme, f) => somme + f.octets, 0),
        };
    });

    /**
     * Déplace en quarantaine **exactement** les fichiers nommés.
     *
     * La liste vient de l'aperçu que le meneur a lu et coché. On ne recense pas
     * une seconde fois : *un second recensement trancherait à nouveau, et il
     * confirmerait une liste qui n'est plus celle qu'il a vue.* Même règle que
     * `MediaCleanupService.performCleanup`, pour la même raison.
     */
    ipcMain.handle('purge:quarantaine', async (
        _e, demande: string, chemins: string[], etiquette: string,
    ): Promise<BilanDeQuarantaine> => {
        const cible = corpusVise(racine(), demande);
        if (!cible) {
            console.error(`[Purge] Refus : ${demande} n'est pas un corpus.`);
            return { ok: false, destination: '', deplaces: 0, octets: 0, echecs: [demande] };
        }

        const quarantaine = path.join(racine(), DOSSIER_DES_PURGES, nomDeLaQuarantaine(etiquette, new Date()));
        await fs.ensureDir(quarantaine);

        /*
          ⛔ Le `.ragignore` AVANT le premier déplacement. Posé après, il
          existerait une fenêtre — courte, mais réelle — pendant laquelle une
          réindexation ferait entrer dans l'Oracle des fiches qu'on vient de
          retirer d'un corpus.
        */
        const exclusion = path.join(racine(), DOSSIER_DES_PURGES, '.ragignore');
        if (!await fs.pathExists(exclusion)) {
            await fs.writeFile(
                exclusion,
                "# Ce qui est ici a été retiré d'un corpus : l'Oracle ne doit plus le citer.\n"
                + "# Les fichiers restent lisibles et déplaçables à la main — c'est tout leur intérêt.\n"
                + '**\n',
                'utf-8',
            );
        }

        let deplaces = 0;
        let octets = 0;
        const echecs: string[] = [];

        for (const relatif of chemins) {
            const source = path.resolve(cible.absolu, relatif);
            if (!strictementSous(source, cible.absolu)) {
                console.error(`[Purge] Refus : ${relatif} sort du corpus.`);
                echecs.push(relatif);
                continue;
            }
            try {
                if (!await fs.pathExists(source)) continue;   // déjà parti : rien à faire
                const stats = await fs.stat(source);
                if (!stats.isFile()) { echecs.push(relatif); continue; }

                const destination = path.join(quarantaine, cible.relatif, relatif);
                await fs.ensureDir(path.dirname(destination));
                await fs.move(source, destination, { overwrite: false });
                deplaces++;
                octets += stats.size;
            } catch (error) {
                console.error(`[Purge] ${relatif} :`, error);
                echecs.push(relatif);
            }
        }

        await retirerLesDossiersVides(cible.absolu, cible.absolu);

        /*
          L'index garde les fiches déplacées jusqu'à sa prochaine passe : sans ce
          rappel, l'Oracle citerait encore, ce soir, ce que le meneur vient de
          retirer. On ne l'attend pas — c'est une remise à niveau, pas une étape
          de la purge.
        */
        try {
            const { RAGEngine } = await import('./RAGEngine');
            void RAGEngine.getInstance().updateIndex();
        } catch (error) {
            console.warn('[Purge] Réindexation non déclenchée :', error);
        }

        return { ok: echecs.length === 0, destination: quarantaine, deplaces, octets, echecs };
    });

    /**
     * Les dossiers présents sous `systems/` ou sous `campaigns/`.
     *
     * ⚠️ **Il manquait pour les campagnes, et ça ne se voyait pas.**
     * `ai:list-systems` existe pour les systèmes ; côté campagnes, le seul
     * appelant (`corpusDeLaCampagne`) passe par `ai:list-dir`, **qui ne rend que
     * des fichiers** — `e.isFile()`. Il reçoit donc toujours une liste vide, et
     * `resoudreCorpusDeCampagne` conclut « dossier à créer » pour un dossier qui
     * existe. C'est exactement le défaut que le commentaire de `RAGService`
     * décrit pour les systèmes, resté en place de l'autre côté.
     *
     * Une purge qui se trompe de dossier serait la pire version de ce défaut :
     * elle ne rendrait pas une liste vide, elle déplacerait les fichiers de
     * quelqu'un d'autre. D'où ce canal, qui pose la question à laquelle
     * `ai:list-dir` ne sait pas répondre.
     */
    ipcMain.handle('purge:dossiers', async (_e, racineDemandee: string): Promise<string[]> => {
        if (!Object.prototype.hasOwnProperty.call(RACINES_PURGEABLES, racineDemandee)) return [];
        const dossier = path.join(racine(), racineDemandee);
        if (!await fs.pathExists(dossier)) return [];
        const entrees = await fs.readdir(dossier, { withFileTypes: true });
        return entrees.filter(e => e.isDirectory()).map(e => e.name);
    });

    /** Ouvre le dossier des quarantaines. Le bouton qui rend la réversibilité vraie. */
    ipcMain.handle('purge:ouvrir-quarantaine', async () => {
        const dossier = path.join(racine(), DOSSIER_DES_PURGES);
        await fs.ensureDir(dossier);
        void shell.openPath(dossier);
    });
}
