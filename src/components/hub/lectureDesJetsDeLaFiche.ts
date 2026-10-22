import { caracteristiquesDeSauvegarde } from '../../modules/dice/jetDepuisLaFiche';
import { deCourant, ressourcesDUsure } from '../../modules/dice/ressourcesDUsure';
import type { GameDriver } from '../../types/drivers';

/** Les Sauvegardes et les ressources que la fiche permet de demander — vide, rien à montrer. */
export function lireLesJetsDeLaFiche(
    pilote: GameDriver | null | undefined,
    gabarit: { sections: { id: string; fields: { id: string; label: string }[] }[] },
    sheetData: Record<string, unknown>,
) {
    const sauvegardes = caracteristiquesDeSauvegarde(pilote, gabarit)
        .map(c => ({ ...c, valeur: Number(sheetData[c.fieldId]) }))
        .filter(c => Number.isFinite(c.valeur));
    const ressources = ressourcesDUsure(pilote, sheetData)
        .map(r => ({ ...r, de: deCourant(sheetData[r.fieldId]) }));
    return { sauvegardes, ressources };
}
