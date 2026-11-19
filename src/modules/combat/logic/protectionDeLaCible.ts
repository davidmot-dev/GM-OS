import { facesDuNiveau } from '../../dice/desEchelonnes';

/**
 * **La protection d'un combattant, lue sur sa fiche** — Blade Runner (carnet « ÉQUIPEMENT DE
 * PROTECTION ») : à chaque coup subi, deux dés du niveau de sa protection ; chaque réussite retire
 * un point de dégâts. Lue par la carte (`ProtectionDuCombattant`, 2026-10-16) et, depuis le
 * 19/11/2026, par « Appliquer à [cible] » (registre § 263, T9) : une seule lecture pour les deux.
 *
 * `null` : le pilote ne déclare pas de protection, ou la fiche n'en porte pas (« Aucune », vide).
 */
export interface ProtectionLue {
    nom: string;
    niveau: string;
    nombre: number;
    faces: number;
}

export function protectionLue(
    regle: { champ: string; des?: number; label?: string; nomSur?: string } | undefined,
    valeurs: Record<string, unknown>,
): ProtectionLue | null {
    if (!regle) return null;
    const niveau = valeurs[regle.champ];
    // Une lettre seule (« C », « C (D8) ») : « Aucune » ou « Sans » ne sont pas un D12.
    const faces = /^\s*[A-D](?![\p{L}])/iu.test(String(niveau ?? '')) ? facesDuNiveau(niveau) : null;
    if (!faces) return null;
    return {
        nom: (regle.nomSur && String(valeurs[regle.nomSur] ?? '').trim()) || regle.label || 'Protection',
        niveau: String(niveau).toUpperCase(),
        nombre: Math.max(1, regle.des ?? 2),
        faces,
    };
}
