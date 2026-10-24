import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **Qui se sert encore d'un gabarit ou d'un pilote** — audit des clés, 2026-10-24.
 *
 * La corbeille du tableau des modèles filtrait une liste et rien d'autre : des
 * personnages, des PNJ ou des campagnes gardaient l'identifiant d'un modèle
 * disparu. Elle refuse désormais ce qui sert encore ; la gomme (purge) sait
 * défaire un jeu et tout ce qui en dépend.
 */
interface EtatLu {
    players: { characters: { name: string; templateId?: string }[] }[];
    entities: { name: string; templateId?: string }[];
    customGameDrivers: { name: string; templateId?: string }[];
    campaigns: { name: string; system?: string }[];
}

export function usagesDuGabarit(s: EtatLu, id: string): string[] {
    return [
        ...s.players.flatMap(p => p.characters).filter(c => c.templateId === id).map(c => c.name),
        ...s.entities.filter(e => e.templateId === id).map(e => e.name),
        ...s.customGameDrivers.filter(d => d.templateId === id).map(d => `pilote ${d.name}`),
    ];
}

export function usagesDuPilote(s: EtatLu, id: string): string[] {
    return s.campaigns.filter(c => c.system === id).map(c => `campagne ${c.name}`);
}

/** La liste dite au meneur : quatre noms, puis le compte du reste. */
export function direLesUsages(usages: readonly string[]): string {
    return `${usages.slice(0, 4).join(', ')}${usages.length > 4 ? ` et ${usages.length - 4} autre(s)` : ''}`;
}

/**
 * **La copie garde tout le gabarit** : elle ne reprenait que le nom, l'emoji, les
 * sections et le carnet, et perdait `reglesDeFiche` — une copie du Livret du
 * voyageur n'avait plus aucune mécanique de Rêve de Dragon — et les personas.
 * Seuls l'identifiant et la marque « livré d'usine » ne se copient pas.
 */
export function copieDuGabarit(gabarit: SheetTemplate, nom: string): Omit<SheetTemplate, 'id' | 'isBuiltin'> {
    const { id: _id, isBuiltin: _usine, ...reste } = structuredClone(gabarit);
    return { ...reste, name: nom };
}
