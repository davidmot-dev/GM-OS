import type { MaisonDune } from '../../dice/systemes/conflitsDeDune';

/**
 * **La Maison du module, reflet de la fiche de Maison** — 2026-10-25.
 *
 * Décision de David : *« la fiche HTML fait foi »*. La fiche `dune-maison-fr` est la fiche de
 * groupe de la campagne (`Campaign.groupe.sheetData`, clés de la fiche telles quelles). Le module
 * « Dune : conflits et Maison » garde sa Maison pour le plateau des joueurs et la Menace de début
 * de séance : ce qu'elle partage avec la fiche — nom, monde, type, domaines, rôles, ennemis — se
 * **recalcule** depuis la fiche, au lieu de se saisir deux fois. Alliés et atouts de Maison, que
 * la fiche n'imprime pas, restent au module.
 *
 * Pur : la vue envoie la commande `maison` quand le reflet diffère.
 */

/** Ce que la fiche tient — les rubriques que le module ne saisit plus. */
export const RUBRIQUES_DE_LA_FICHE = ['nom', 'monde', 'type', 'domaines', 'roles', 'ennemis'] as const;
export type RubriqueDeLaFiche = typeof RUBRIQUES_DE_LA_FICHE[number];

const ROLES: [string, string][] = [
    ['lord', 'Seigneur'], ['consort', 'Consort'], ['heir', 'Héritier'], ['treasurer', 'Trésorier'],
    ['chamberlain', 'Chambellan'], ['constable', 'Connétable'], ['advisor', 'Conseiller'], ['envoy', 'Émissaire'],
    ['scholar', 'Érudit'], ['spymaster', 'Maître espion'], ['swordmaster', "Maître d'armes"], ['warmaster', 'Maître de guerre'],
    ['chief_physician', 'Médecin-chef'],
];
const MAX = 2000;
const texte = (v: unknown) => String(v ?? '').trim();
const borne = (s: string) => (s.length > MAX ? `${s.slice(0, MAX - 1)}…` : s);
const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Le type de la Maison, lu dans le texte de la fiche (p. 87) : 0 naissante … 3 Grande Maison. */
export function typeDeMaison(valeur: unknown): number | undefined {
    const t = sansAccents(texte(valeur));
    if (!t) return undefined;
    if (t.includes('grande')) return 3;
    if (t.includes('majeure')) return 2;
    if (t.includes('mineure')) return 1;
    if (t.includes('naissante')) return 0;
    return undefined;
}

/** Le reflet de la fiche, ou `null` quand la fiche de Maison est encore vierge. */
export function maisonDepuisLaFiche(fiche: Record<string, unknown> | undefined): Partial<MaisonDune> | null {
    const f = fiche ?? {};
    if (!Object.entries(f).some(([k, v]) => k.startsWith('house.') && texte(v))) return null;
    const roles = ROLES.map(([k, libelle]) => [libelle, texte(f[`house.roles.${k}`])])
        .filter(([, v]) => v).map(([l, v]) => `${l} : ${v}`).join(' · ');
    const ennemis = [0, 1, 2, 3].map(i => {
        const nom = texte(f[`house.enemies.${i}.name`]);
        if (!nom) return '';
        const precisions = [texte(f[`house.enemies.${i}.type`]), texte(f[`house.enemies.${i}.hatred`])].filter(Boolean).join(', ');
        return precisions ? `${nom} (${precisions})` : nom;
    }).filter(Boolean).join(' · ');
    const reflet: Partial<MaisonDune> = {
        nom: borne(texte(f['house.name'])), monde: borne(texte(f['house.homeworld'])),
        domaines: borne(texte(f['house.domains'])), roles: borne(roles), ennemis: borne(ennemis),
    };
    const type = typeDeMaison(f['house.type']);
    if (type !== undefined) reflet.type = type;
    return reflet;
}

/** Les rubriques du reflet qui diffèrent de la Maison du module — vide : rien à envoyer. */
export function ecartsDuReflet(maison: MaisonDune, reflet: Partial<MaisonDune> | null): Partial<MaisonDune> {
    if (!reflet) return {};
    return Object.fromEntries(Object.entries(reflet).filter(([k, v]) => maison[k as keyof MaisonDune] !== v)) as Partial<MaisonDune>;
}
