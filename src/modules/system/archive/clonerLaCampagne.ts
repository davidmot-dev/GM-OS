import type { NexusCampaignState } from './nexus.types';

/**
 * **Cloner une campagne sans qu'elle pointe vers l'original** — lot E3 du
 * chantier des archives (2026-10-19, `documentation/Planning/2026-10-18-chantier-archives-de-campagne.md`).
 *
 * L'ancien clonage donnait de nouveaux identifiants à tout, mais ne réécrivait,
 * dans les scènes, que `acteId`. Le lieu, les PNJ, les indices, les
 * enchaînements, les passages par séance, le moment de storyboard, les
 * battlemaps — et, sur la campagne, les positions et trajets du graphe rangés
 * par identifiant — désignaient encore l'original : une copie montrait une trame
 * sans liens. Les personnages, eux, gardaient leur identifiant et leur campagne,
 * et le joueur se retrouvait avec deux fois le même.
 *
 * **On ne réécrit pas champ par champ** : un champ ajouté demain serait oublié en
 * silence, et les identifiants se cachent aussi DANS des clés composées — un lien
 * du graphe est rangé sous `["enchainement","scene-…","scene-…"]`, un groupe
 * sous `groupe:acte-…`. On dresse **une table** ancien → nouvel identifiant pour
 * tout ce qu'on copie, puis on la remplace **partout**, dans les valeurs et dans
 * les clés, en ne touchant qu'un identifiant entier.
 *
 * Ce qui n'est pas copié n'est pas dans la table, donc n'est pas touché : les
 * morceaux de musique, les médias, les paquets de cartes, les PNJ d'autres
 * campagnes, les bibliothèques de sons et de playlists (qu'on ne doit surtout pas
 * rattacher à la copie : elles sont partagées).
 */

/** Les collections qu'on copie, et le préfixe de leurs nouveaux identifiants. */
const COLLECTIONS = [
    ['entities', 'npc'],
    ['sessions', 'sess'],
    ['atlasMaps', 'map'],
    ['wikiEntries', 'wiki'],
    ['timelineEvents', 'te'],
    ['clues', 'clue'],
    ['actes', 'acte'],
    ['scenes', 'scene'],
    ['rencontres', 'renc'],
    ['journaux', 'jour'],
    // Lot E2 (2026-10-19) : ce que l'archive emporte désormais hors de la trame.
    ['moments', 'moment'],
    ['favoris', 'fav'],
    ['messages', 'msg'],
    ['lootPool', 'loot'],
    ['lootHistory', 'lh'],
    ['lootReserve', 'loot'],
] as const satisfies readonly (readonly [keyof NexusCampaignState, string])[];

type Fabrique = (prefixe: string) => string;
const auHasard: Fabrique = prefixe => `${prefixe}-${crypto.randomUUID()}`;

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** La table ancien → nouvel identifiant, pour tout ce que la copie emporte. */
export function tableDuClonage(state: NexusCampaignState, nouvelId: Fabrique = auHasard): Map<string, string> {
    const table = new Map<string, string>();
    const noter = (ancien: unknown, prefixe: string) => {
        if (typeof ancien === 'string' && ancien && !table.has(ancien)) table.set(ancien, nouvelId(prefixe));
    };
    noter(state.campaign.id, 'camp');
    for (const [cle, prefixe] of COLLECTIONS) {
        for (const x of (state[cle] as { id?: unknown }[] | undefined) ?? []) noter(x?.id, prefixe);
    }
    /*
      Les tuiles de Light-OS de la campagne portent son identifiant DANS le leur
      (`SCENE_<campagne>_NN`, `ratelierDeLaCampagne.idDeCase`), collé à un tiret
      bas : le remplacement par identifiant entier ne les verrait pas. On les
      renomme ici, pour que le râtelier de la copie soit le sien — et qu'un moment
      de storyboard qui désigne une tuile désigne la tuile de la copie.
    */
    const ancienne = state.campaign.id, nouvelle = table.get(ancienne)!;
    for (const tuile of state.tuilesDeLumiere ?? []) {
        if (tuile.id.startsWith(`SCENE_${ancienne}_`)) table.set(tuile.id, `SCENE_${nouvelle}_${tuile.id.slice(`SCENE_${ancienne}_`.length)}`);
    }
    // Les personnages de CETTE campagne : la copie a les siens.
    for (const joueur of state.players ?? []) {
        for (const p of joueur.characters ?? []) {
            if (p.campaignId === state.campaign.id) noter(p.id, 'char');
        }
    }
    return table;
}

/**
 * Remplace, partout dans `valeur`, chaque identifiant de la table — dans les
 * chaînes et dans les clés d'objets, identifiant entier seulement (`c1` ne
 * touche pas `c10`). Ne modifie pas `valeur`.
 */
export function reecrireLesIdentifiants<T>(valeur: T, table: Map<string, string>): T {
    if (table.size === 0) return valeur;
    const source = `(?<![A-Za-z0-9_-])(${[...table.keys()].sort((a, b) => b.length - a.length).map(echapper).join('|')})(?![A-Za-z0-9_-])`;
    const contient = new RegExp(source);
    const partout = new RegExp(source, 'g');
    const chaine = (s: string) => table.get(s) ?? (contient.test(s) ? s.replace(partout, m => table.get(m) ?? m) : s);
    const parcourir = (v: unknown): unknown => {
        if (typeof v === 'string') return chaine(v);
        if (Array.isArray(v)) return v.map(parcourir);
        if (v && typeof v === 'object') {
            return Object.fromEntries(Object.entries(v).map(([k, x]) => [chaine(k), parcourir(x)]));
        }
        return v;
    };
    return parcourir(valeur) as T;
}

/** La copie d'une campagne : tout ce qu'elle emporte, réécrit vers ses nouveaux identifiants. */
export function clonerLaCampagne(state: NexusCampaignState, nouvelId: Fabrique = auHasard): NexusCampaignState {
    const table = tableDuClonage(state, nouvelId);
    const r = <T>(v: T) => reecrireLesIdentifiants(v, table);
    const copie: NexusCampaignState = { ...state };
    copie.campaign = { ...r(state.campaign), name: `${state.campaign.name} (Copie)` };
    for (const [cle] of COLLECTIONS) {
        if (state[cle] !== undefined) (copie as unknown as Record<string, unknown>)[cle] = r(state[cle]);
    }
    // Les joueurs gardent leur identifiant ; seuls leurs personnages de cette campagne changent.
    copie.players = r(state.players);
    if (state.modulesDuJeu !== undefined) copie.modulesDuJeu = r(state.modulesDuJeu);
    // Lot E2 : les combats préparés suivent leurs scènes (rangés par identifiant de scène), les tuiles leur râtelier.
    if (state.combatsGares !== undefined) copie.combatsGares = r(state.combatsGares);
    if (state.tuilesDeLumiere !== undefined) copie.tuilesDeLumiere = r(state.tuilesDeLumiere);
    if (state.reservesDeTable !== undefined) copie.reservesDeTable = r(state.reservesDeTable);
    return copie;
}
