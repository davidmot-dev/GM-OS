/**
 * **Voice-to-Light — la lumière suit la voix du meneur.**
 *
 * Demandé au jalon du 2026-04-21 (« couplage de l'intensité lumineuse avec le
 * niveau sonore de l'entrée micro »), retenu par David le 2026-08-31.
 *
 * Les deux bouts existaient déjà et ne se parlaient pas : `VoiceEngine` calcule
 * un RMS et le pose dans `useVoiceStore.inputLevel` (0 à 1) pour son
 * vumètre ; `HueEngine` sait poser une brillance. *Il ne manquait que la règle
 * qui va de l'un à l'autre* — et c'est elle qui vit ici, seule et testable, sans
 * pont Hue ni micro.
 *
 * ## ⚠️ Les trois contraintes qui décident de tout
 *
 * **1. Le pont Hue tient une dizaine de commandes par seconde.** Le niveau de
 * voix, lui, se rafraîchit à la cadence de l'écran — soixante fois par seconde.
 * Envoyer chaque valeur noierait le pont et la lumière prendrait du retard sur
 * la voix au lieu de la suivre. *Un correctif qui arrive en retard sur un signal
 * temps réel est pire que pas de correctif : il décrit le passé.*
 *
 * **2. Une commande de GROUPE, jamais une par lampe.** Six lampes à huit
 * envois par seconde feraient quarante-huit requêtes — le pont s'écroulerait.
 * `/groups/0/action` en fait **une**, quel que soit le nombre de lampes.
 *
 * **3. Ce que ça coûte, et il faut le dire** : une commande de groupe pose la
 * **même** brillance partout. Les couleurs de la scène restent, son contraste
 * de brillance est aplani tant que le mode est actif. *C'est le prix d'une
 * seule requête, et le contraste revient dès qu'on éteint le mode — la scène
 * est simplement réappliquée.*
 */

/**
 * L'intervalle entre deux commandes au pont.
 *
 * Huit par seconde : sous la limite du pont, et assez rapide pour que l'œil
 * lise la pulsation comme une réaction et non comme une succession de paliers.
 */
export const CADENCE_MS = 120;

/**
 * La brillance Hue, telle que l'API la compte : 1 à 254.
 *
 * Le plancher n'est pas 1 : à ce niveau la pièce est noire, et le silence entre
 * deux phrases éteindrait la table. *Un mode d'ambiance ne doit jamais rendre
 * la table inutilisable* — on descend jusqu'à une pénombre, pas jusqu'au noir.
 */
export const BRILLANCE_MIN = 1;
export const BRILLANCE_MAX = 254;
export const PLANCHER_PAR_DEFAUT = 60;

/**
 * Ce qu'il faut de changement pour redéranger le pont.
 *
 * Sous ce seuil, l'œil ne voit rien et la requête serait pure dépense. *Une
 * commande qui ne change rien de visible est une commande qu'on n'envoie pas.*
 */
export const ECART_MINIMAL = 4;

/**
 * **Le lissage — monter vite, redescendre lentement.**
 *
 * C'est exactement le patron du *noise gate* de `VoiceEngine` (« fast open
 * 0.005s, slower close 0.4s »), et pour la même raison : une attaque doit se
 * voir à l'instant où elle est dite, tandis qu'une coupure brutale au premier
 * silence entre deux mots ferait clignoter la pièce.
 *
 * *Sans lui, le RMS brut fait battre la lumière à chaque syllabe.*
 */
export const MONTEE = 0.6;
export const DESCENTE = 0.12;

/** Le niveau lissé, à partir du précédent et de celui qu'on vient de lire. */
export function lisser(precedent: number, mesure: number): number {
    const facteur = mesure > precedent ? MONTEE : DESCENTE;
    return precedent + (mesure - precedent) * facteur;
}

/**
 * La brillance que ce niveau de voix demande.
 *
 * `plancher` est ce que la pièce garde quand personne ne parle ; le plafond est
 * la pleine brillance. Le niveau est borné à [0, 1] avant d'être employé : le
 * RMS est déjà mis à l'échelle par `VoiceEngine` (`rms * 5`) et peut donc, sur
 * un cri, sortir de l'intervalle qu'il annonce.
 */
export function brillanceDeLaVoix(niveau: number, plancher = PLANCHER_PAR_DEFAUT): number {
    const borne = Math.min(1, Math.max(0, niveau));
    const bas = Math.min(Math.max(plancher, BRILLANCE_MIN), BRILLANCE_MAX);
    return Math.round(bas + (BRILLANCE_MAX - bas) * borne);
}

/**
 * Faut-il envoyer cette brillance au pont ?
 *
 * `derniere` vaut `null` tant que rien n'a été envoyé — le premier envoi passe
 * toujours, sinon un mode qu'on vient d'activer resterait muet jusqu'à ce que
 * quelqu'un parle fort.
 */
export function doitEnvoyer(brillance: number, derniere: number | null): boolean {
    if (derniere === null) return true;
    return Math.abs(brillance - derniere) >= ECART_MINIMAL;
}
