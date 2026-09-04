import i18next from 'i18next';
import type { GameDriver } from '../../../types/drivers';

/**
 * **Les mots du butin viennent du jeu, pas de l'écran.**
 *
 * Loot-OS annonçait « Objets Magiques » et « pièces d'or » à Blade Runner comme
 * à Alien : l'échelle commune→légendaire et la monnaie étaient écrites en dur
 * dans le panneau **et** dans l'invite de l'IA. Même faute que les points de vie
 * à `10` — *une valeur qui dépend du jeu ne peut pas vivre en dur dans un écran.*
 *
 * Sans déclaration dans le pilote, on reste **neutre** plutôt que médiéval :
 * « valeur », « objets remarquables », et l'échelle générique de secours. Aucun
 * pilote existant ne change de comportement.
 */

/** L'échelle de secours, quand le pilote n'en déclare pas. */
const RARETES_DE_SECOURS = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;

export interface PalierDeRarete {
    id: string;
    label: string;
}

/** Les paliers de ce jeu, du plus banal au plus rare. */
export function raretesDuJeu(driver: GameDriver | null | undefined): PalierDeRarete[] {
    const declarees = driver?.vocabulaireDuButin?.raretes;
    if (Array.isArray(declarees) && declarees.length > 0) return declarees;

    return RARETES_DE_SECOURS.map(id => ({
        id,
        label: i18next.t(`modules:loot.rarities.${id}`),
    }));
}

/** Comment ce jeu nomme ce palier — son identifiant brut si personne ne le dit. */
export function libelleDeRarete(driver: GameDriver | null | undefined, rarete?: string): string {
    const id = rarete || 'common';
    const palier = raretesDuJeu(driver).find(p => p.id === id);
    return palier?.label || id;
}

/**
 * Ce palier sort-il de l'ordinaire ?
 *
 * **Le premier palier est celui qui ne compte pas** — c'est ce que « commune »
 * voulait dire, sans l'imposer à un jeu qui appelle ça autrement.
 */
export function estRemarquable(driver: GameDriver | null | undefined, rarete?: string): boolean {
    if (!rarete) return false;
    const paliers = raretesDuJeu(driver);
    const banal = paliers[0]?.id;
    return rarete !== banal && rarete !== 'currency';
}

/** Le nom de la monnaie de ce jeu, s'il en déclare une. */
export function nomDeLaMonnaie(driver: GameDriver | null | undefined): string | undefined {
    const monnaie = driver?.vocabulaireDuButin?.monnaie?.trim();
    return monnaie || undefined;
}

/**
 * La place d'un palier dans l'échelle, comptée **depuis le haut** : 0 pour le
 * plus rare, 1 pour celui d'en dessous, et ainsi de suite. `-1` si le palier
 * n'est pas dans l'échelle du jeu.
 *
 * Sert à colorer un badge sans nommer « légendaire » ni « épique » dans un
 * écran : c'est la position qui se voit, pas le mot.
 */
export function rangDepuisLeSommet(driver: GameDriver | null | undefined, rarete?: string): number {
    if (!rarete) return -1;
    const paliers = raretesDuJeu(driver);
    const i = paliers.findIndex(p => p.id === rarete);
    return i < 0 ? -1 : paliers.length - 1 - i;
}
