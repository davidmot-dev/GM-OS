import type { NexusCampaignState } from './nexus.types';

/**
 * **Ce que porte une archive de campagne, compté** — lot E6 du chantier des
 * archives (2026-10-19).
 *
 * Une seule liste sert deux fois : à l'**aperçu**, avant que rien n'entre, et au
 * **bilan**, après. *Deux décomptes écrits séparément finiraient par ne plus dire
 * pareil, et le bilan démentirait l'aperçu sans que rien ne soit faux.*
 *
 * Ce qui vaut zéro n'est pas listé : une archive d'avant le 19/10 n'a ni
 * storyboard ni tuiles, et « 0 tuile de lumière » laisserait croire qu'elle les a
 * perdues.
 */
export interface LigneDuRecensement {
    libelle: string;
    nombre: number;
}

const taille = (v: unknown): number =>
    Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0;

export function recenserLArchive(state: NexusCampaignState): LigneDuRecensement[] {
    const personnages = (state.players ?? [])
        .flatMap(j => j.characters ?? [])
        .filter(p => p.campaignId === state.campaign.id).length;
    const lignes: [string, number][] = [
        ['PNJ', taille(state.entities)],
        ['personnages', personnages],
        ['lieux', taille(state.atlasMaps)],
        ['actes', taille(state.actes)],
        ['scènes', taille(state.scenes)],
        ['rencontres', taille(state.rencontres)],
        ['indices', taille(state.clues)],
        ['entrées de wiki', taille(state.wikiEntries)],
        ['événements de chronologie', taille(state.timelineEvents)],
        ['séances', taille(state.sessions)],
        ['journaux', taille(state.journaux)],
        ['moments de storyboard', taille(state.moments)],
        ['combats préparés', taille(state.combatsGares)],
        ['tuiles de lumière', taille(state.tuilesDeLumiere)],
        ['favoris', taille(state.favoris)],
        ['objets de butin', taille(state.lootPool)],
        ['messages', taille(state.messages)],
        ['ambiances sonores', taille(state.atmospheres)],
        ['playlists', taille(state.playlists)],
    ];
    return lignes.filter(([, n]) => n > 0).map(([libelle, nombre]) => ({ libelle, nombre }));
}

/** « 12 PNJ · 30 scènes · … » — pour le bilan et le journal. */
export function enUneLigne(lignes: readonly LigneDuRecensement[]): string {
    return lignes.length ? lignes.map(l => `${l.nombre} ${l.libelle}`).join(' · ') : 'rien';
}
