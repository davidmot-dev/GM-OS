import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/** Une campagne n'écrase pas les pilotes du poste. NP-C2 : rendre cet écart lisible,
 * même lorsque deux variantes ont exactement la même version (COC 3d6, Shadowrun). */
export function signalerDependancesConservees(
    demandes: readonly GameDriver[] = [], installes: readonly GameDriver[] = [],
    gabaritsDemandes: readonly SheetTemplate[] = [], gabaritsInstalles: readonly SheetTemplate[] = [],
): string[] {
    const regles = (p: GameDriver) => JSON.stringify([p.version, p.templateId, p.dice, p.jet, p.combat]);
    return demandes.flatMap(d => {
        const present = installes.find(p => p.id === d.id);
        if (!present) return [];
        const ficheArchive = gabaritsDemandes.find(f => f.id === d.templateId);
        const ficheLocale = gabaritsInstalles.find(f => f.id === d.templateId);
        const ficheDifferente = ficheArchive && ficheLocale
            && JSON.stringify(ficheArchive.sections) !== JSON.stringify(ficheLocale.sections);
        if (regles(d) === regles(present) && !ficheDifferente) return [];
        return [`⚠️ Pilote « ${present.name} » installé (${present.version}) conservé ; l’archive demande ${d.version} avec une version, des règles ou un gabarit différents. Pour changer le pilote, importez son .gmos-driver avec « Remplacer ». Vérifiez ensuite la fiche des personnages dans « Diagnostic et reprise de fiche ».`];
    });
}
