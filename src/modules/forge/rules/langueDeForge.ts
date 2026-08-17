/**
 * Dans quelle langue une forge écrit sa prose.
 *
 * **Le manque, relevé par David le 2026-08-17** : il forge parfois depuis des
 * livres anglais et veut un résultat en français. Aucune invite de forge ne
 * disait la langue — ni la Forge Système, ni la Forge de campagne — si bien que
 * le modèle suivait celle du corpus. La capacité existait pourtant à côté :
 * `AIService` conditionne déjà trois invites sur `i18n.language`, dont l'Oracle
 * qui dit « Réponds impérativement en français ».
 *
 * **Un réglage par corpus et par campagne**, décidé par David contre ma
 * proposition de suivre l'interface. Le raisonnement se tient : un corpus est
 * anglais ou français une fois pour toutes, et un meneur peut vouloir garder une
 * campagne dans sa langue d'origine pendant que le reste passe en français. La
 * langue de l'interface reste le repli, jamais le maître.
 */

/**
 * Les langues que la consigne sait nommer, par leur endonyme.
 *
 * On écrit le nom **dans la langue demandée** — « réponds en français », pas
 * « réponds en French ». Un code inconnu passe tel quel plutôt que d'être
 * refusé : mieux vaut une consigne approximative qu'aucune consigne.
 */
export const LANGUES: Readonly<Record<string, string>> = {
    fr: 'français',
    en: 'English',
    es: 'español',
    de: 'Deutsch',
    it: 'italiano',
    pt: 'português',
};

/** Le nom d'une langue tel que la consigne l'emploiera. */
export function nomDeLaLangue(code: string | null | undefined): string | null {
    const propre = code?.trim().toLowerCase().split('-')[0];
    if (!propre) return null;
    return LANGUES[propre] ?? propre;
}

/**
 * Ce qui l'emporte : le réglage déclaré, sinon l'interface.
 *
 * **Le déclaré gagne toujours**, y compris sur une interface dans une autre
 * langue : c'est tout l'intérêt d'un réglage par corpus. L'interface n'est qu'un
 * repli pour les neuf corpus qui n'ont jamais rien déclaré — *on ne fait pas
 * payer une nouveauté à l'existant.*
 */
export function resoudreLaLangue(
    declaree: string | null | undefined,
    interfaceUtilisateur: string | null | undefined,
): string | null {
    return nomDeLaLangue(declaree) ?? nomDeLaLangue(interfaceUtilisateur);
}

/**
 * La consigne de langue, prête à être insérée en tête d'une cible.
 *
 * **Elle dit surtout ce qu'il ne faut PAS traduire**, et c'est la moitié qui
 * compte. Une forge sommée d'écrire en français traduirait volontiers un
 * `sectionId` — et le vocabulaire acquis voyage entre les groupes par ces
 * chaînes : un `stats` devenu `statistiques`, et plus aucun renvoi ne résout.
 * La cible de l'initiative craint déjà ce geste pour ses énumérations : *« vaut
 * EXACTEMENT "asc" ou "desc" — jamais un mot français »*.
 *
 * Les noms propres non plus : la conservation d'une reforge se fait **par nom**,
 * et un PNJ traduit reviendrait en double à la forge suivante.
 *
 * Rend une chaîne vide quand aucune langue n'est connue — *on ne pose pas une
 * consigne vide, qui n'apprendrait rien et occuperait du budget.*
 */
export function consigneDeLangue(langue: string | null | undefined): string {
    const nom = nomDeLaLangue(langue);
    if (!nom) return '';
    return `LANGUE : écris toute la PROSE en ${nom} — descriptions, résumés, notes, `
        + `enjeux —, même si les fiches sont dans une autre langue. `
        + `NE TRADUIS JAMAIS : les clés du JSON, les identifiants (id, sectionId, fieldId, `
        + `templateId), les valeurs d'une énumération imposée, ni les NOMS PROPRES — `
        + `personnages, lieux, factions, titres — qui restent écrits comme les fiches les `
        + `écrivent. Un identifiant traduit casse tous les renvois ; un nom propre traduit `
        + `crée un doublon à la prochaine forge.`;
}
