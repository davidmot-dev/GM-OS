/**
 * **Le catalogue des effets — une liste de DONNÉES, plus une liste de balises.**
 *
 * ──────────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE
 * ──────────────────────────────────────────────────────────────────────────────────
 *
 * Les quarante-huit effets vivaient en `<option>` dans `BulbFooter`, à
 * l'intérieur d'un `<select>`. Ça tenait tant qu'il n'y avait qu'un seul écran
 * pour les choisir.
 *
 * David, le 2026-09-18 : *« je pense que la liste déroulante n'est plus adaptée
 * avec 40 items, je pense qu'il faut passer par un écran volant. »* Et un écran
 * volant a besoin de **données** — pour chercher, pour grouper, pour compter.
 * *Une liste qui n'existe que sous forme de balises ne peut être lue que par le
 * navigateur.*
 *
 * ⚠️ **L'ordre de ce tableau est celui de l'écran.** Les catégories s'y suivent
 * comme elles s'affichent, et les effets dans chacune aussi : c'est lui qui fait
 * foi, et il n'y a pas de tri ailleurs.
 *
 * ⛔ **Ajouter un effet, c'est ajouter une ligne ici** — puis un `case` dans le
 * moteur et un nom dans les deux langues. `catalogueDesEffets.test.ts` vérifie
 * les trois, et refuse qu'il en manque un.
 */

/** Les six familles, dans l'ordre où elles s'affichent. */
export const CATEGORIES = ['urban', 'nature', 'fantasy', 'space', 'alerts', 'misc'] as const;

export type CategorieDEffet = typeof CATEGORIES[number];

export interface EffetDuCatalogue {
    /** L'identifiant que le moteur reconnaît — `stores`, `aube-doree`… */
    valeur: string;
    categorie: CategorieDEffet;
    /**
     * La classe Tailwind qui donne sa couleur au nom dans la liste.
     *
     * ⚠️ C'est un **repère de lecture**, pas la couleur que la lampe rendra :
     * trente-six effets écrivent leur palette eux-mêmes, et aucune classe CSS ne
     * peut la prédire. Elle sert à retrouver un effet de l'œil, rien de plus.
     */
    teinte: string;
}

/**
 * Les deux entrées qui ne sont pas des effets logiciels : `none` arrête tout,
 * `colorloop` est natif à l'ampoule et ne coûte aucune commande au pont.
 */
export const HORS_CATALOGUE = ['none', 'colorloop'] as const;

export const CATALOGUE_DES_EFFETS: EffetDuCatalogue[] = [
    { valeur: 'lumiere-ville', categorie: 'urban', teinte: 'text-amber-500' },
    { valeur: 'terminal', categorie: 'urban', teinte: 'text-green-500' },
    { valeur: 'cyber-night', categorie: 'urban', teinte: 'text-fuchsia-500' },
    { valeur: 'neon', categorie: 'urban', teinte: 'text-pink-500' },
    { valeur: 'stroboscope', categorie: 'urban', teinte: 'text-white' },
    { valeur: 'police', categorie: 'urban', teinte: 'text-blue-500' },
    { valeur: 'sirene', categorie: 'urban', teinte: 'text-red-500' },
    { valeur: 'panne', categorie: 'urban', teinte: 'text-amber-200' },
    { valeur: 'chute-de-tension', categorie: 'urban', teinte: 'text-amber-300' },
    { valeur: 'foret-profonde', categorie: 'nature', teinte: 'text-emerald-600' },
    { valeur: 'aurore', categorie: 'nature', teinte: 'text-cyan-400' },
    { valeur: 'crepuscule', categorie: 'nature', teinte: 'text-orange-600' },
    { valeur: 'underwater', categorie: 'nature', teinte: 'text-cyan-500' },
    { valeur: 'abysses', categorie: 'nature', teinte: 'text-blue-800' },
    { valeur: 'lever-soleil', categorie: 'nature', teinte: 'text-orange-400' },
    { valeur: 'aube-doree', categorie: 'nature', teinte: 'text-amber-300' },
    { valeur: 'stores', categorie: 'nature', teinte: 'text-amber-100' },
    { valeur: 'lightning', categorie: 'nature', teinte: 'text-app-text/70' },
    { valeur: 'candle', categorie: 'fantasy', teinte: 'text-amber-500' },
    { valeur: 'fire', categorie: 'fantasy', teinte: 'text-red-500' },
    { valeur: 'incendie', categorie: 'fantasy', teinte: 'text-orange-600' },
    { valeur: 'torche', categorie: 'fantasy', teinte: 'text-orange-400' },
    { valeur: 'lave', categorie: 'fantasy', teinte: 'text-orange-700' },
    { valeur: 'arcane', categorie: 'fantasy', teinte: 'text-purple-400' },
    { valeur: 'dragon', categorie: 'fantasy', teinte: 'text-orange-500' },
    { valeur: 'holy', categorie: 'fantasy', teinte: 'text-yellow-300' },
    { valeur: 'fantome', categorie: 'fantasy', teinte: 'text-blue-200' },
    { valeur: 'neant', categorie: 'space', teinte: 'text-violet-900' },
    { valeur: 'trou-noir', categorie: 'space', teinte: 'text-indigo-950' },
    { valeur: 'hyperspace', categorie: 'space', teinte: 'text-cyan-300' },
    { valeur: 'reacteur', categorie: 'space', teinte: 'text-blue-100' },
    { valeur: 'sonar', categorie: 'space', teinte: 'text-cyan-400' },
    { valeur: 'passerelle', categorie: 'space', teinte: 'text-sky-300' },
    { valeur: 'alien', categorie: 'space', teinte: 'text-purple-700' },
    { valeur: 'warp', categorie: 'space', teinte: 'text-indigo-300' },
    { valeur: 'alerte', categorie: 'alerts', teinte: 'text-red-600' },
    { valeur: 'fusillade', categorie: 'alerts', teinte: 'text-orange-300' },
    { valeur: 'deflagration', categorie: 'alerts', teinte: 'text-orange-200' },
    { valeur: 'impact', categorie: 'alerts', teinte: 'text-red-400' },
    { valeur: 'heartbeat', categorie: 'alerts', teinte: 'text-red-600' },
    { valeur: 'radiation', categorie: 'alerts', teinte: 'text-emerald-400' },
    { valeur: 'toxique', categorie: 'alerts', teinte: 'text-lime-400' },
    { valeur: 'glitch', categorie: 'alerts', teinte: 'text-green-400' },
    { valeur: 'tv', categorie: 'alerts', teinte: 'text-cyan-200' },
    { valeur: 'disco', categorie: 'misc', teinte: 'text-fuchsia-400' },
    { valeur: 'flashlight', categorie: 'misc', teinte: 'text-white' },
    { valeur: 'breathing', categorie: 'misc', teinte: 'text-app-text/60' },
    { valeur: 'zen', categorie: 'misc', teinte: 'text-slate-100' },
];
