import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import type { GameDriver } from '../../../types/drivers';

/**
 * Les pilotes qui désignent un modèle de fiche inexistant, réparés.
 *
 * **Le défaut, relevé le 2026-08-14 en relisant l'état persisté.** La Forge
 * fabriquait un `custom-template-<horodatage>`, le posait dans
 * `driver.templateId`, puis appelait `addSheetTemplate` — qui impose son propre
 * `tpl-<horodatage>`. Le pilote gardait donc une référence vers un identifiant
 * **qui n'a jamais existé**, et son vrai modèle traînait sans propriétaire.
 *
 * La cause est corrigée à la source : la Forge reçoit désormais l'identifiant
 * au lieu de le supposer. Mais les bases existantes portent la casse — le
 * pilote « Within » de David en est un cas réel — et un correctif qui laisse
 * les données déjà abîmées ne corrige que la moitié du problème.
 *
 * **Ce que ça coûte quand ce n'est pas réparé.** `AddEntityForm` donne
 * `driver.templateId` à chaque nouveau personnage, puis `CombatCard` cherche le
 * modèle par cet identifiant. Introuvable : **pas de fiche**, sans erreur, sans
 * champ en rouge. Le silence habituel.
 *
 * **On ne répare que ce dont on est certain.** Associer au jugé rattacherait un
 * pilote au modèle d'un autre jeu, ce qui est bien pire qu'un lien cassé : un
 * lien cassé se voit, une mauvaise fiche se joue. Trois conditions, toutes
 * requises :
 *
 * 1. le pilote vise un `custom-template-<horodatage>` — la signature exacte de
 *    ce défaut, et d'aucun autre ;
 * 2. cet identifiant ne désigne aucun modèle existant ;
 * 3. **un seul** modèle orphelin porte un horodatage dans la fenêtre qui suit.
 *    Les deux étaient créés dans la même fonction, à quelques millisecondes
 *    l'un de l'autre ; au-delà, on ne sait plus, et on ne devine pas.
 */

/** La fenêtre au-delà de laquelle deux horodatages ne parlent plus du même geste. */
const FENETRE_MS = 10_000;

/** L'horodatage que porte un identifiant fabriqué, ou `null`. */
function horodatage(id: string): number | null {
    const trouve = id.match(/(\d{10,})$/);
    return trouve ? Number(trouve[1]) : null;
}

export interface ReparationDeLien {
    driverId: string;
    driverName: string;
    ancienTemplateId: string;
    nouveauTemplateId: string;
}

/**
 * Rend les pilotes corrigés et la liste de ce qui a été rattaché.
 *
 * Ne modifie rien sur place : les tableaux d'origine sont rendus tels quels
 * quand il n'y a rien à faire, pour qu'un `set` de store ne déclenche pas un
 * rendu à chaque hydratation.
 */
export function reparerLiensDeGabarit(
    drivers: readonly GameDriver[],
    templates: readonly SheetTemplate[],
): { drivers: GameDriver[]; reparations: ReparationDeLien[] } {
    const idsConnus = new Set(templates.map(t => t.id));
    const reclames = new Set(drivers.map(d => d.templateId).filter(Boolean));
    const orphelins = templates.filter(t => !reclames.has(t.id));

    const reparations: ReparationDeLien[] = [];
    const corriges = drivers.map(driver => {
        const vise = driver.templateId;
        if (!vise || idsConnus.has(vise) || !vise.startsWith('custom-template-')) return driver;

        const quand = horodatage(vise);
        if (quand === null) return driver;

        const candidats = orphelins.filter(t => {
            const leur = horodatage(t.id);
            return leur !== null && leur >= quand && leur - quand <= FENETRE_MS;
        });
        // Deux candidats dans la même fenêtre : on ne tranche pas à pile ou face.
        if (candidats.length !== 1) return driver;

        reparations.push({
            driverId: driver.id,
            driverName: driver.name,
            ancienTemplateId: vise,
            nouveauTemplateId: candidats[0].id,
        });
        return { ...driver, templateId: candidats[0].id };
    });

    return reparations.length > 0
        ? { drivers: corriges, reparations }
        : { drivers: drivers as GameDriver[], reparations };
}
