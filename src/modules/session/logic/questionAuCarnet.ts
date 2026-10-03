/**
 * **Ce qui part vers NotebookLM tient dans sa limite** — trouvé le 2026-10-03.
 *
 * L'Oracle répondait « Google rejected the query (INVALID_ARGUMENT) … account-
 * level restrictions » : David s'est reconnecté, en vain — la connexion était
 * valide. Mesuré sur son carnet ce jour-là : une question de **3 594**
 * caractères passe, une de **3 962** est refusée, accents ou pas. Or l'Oracle
 * envoyait, devant chaque question, **tout** l'état de la séance — PJ, PNJ,
 * indices révélés en entier —, sans borne : la campagne grossissait, la
 * question finissait par être refusée, et le message accusait le compte.
 *
 * La règle : **le message du meneur passe toujours entier** ; l'état de la
 * séance se coupe, à une fin de ligne, pour tenir dans le budget — et le dit.
 * 3 500 laisse une marge sous le plus long envoi accepté.
 */
export const LONGUEUR_MAX_D_UNE_QUESTION = 3500;

const ENTETE = '[LIAISON NEURALE : ÉTAT DE LA SESSION]\n';
const MESSAGE = '\n\n[MESSAGE DU MJ]\n';
const CONSIGNE = '\n\n(Réponds toujours en français)';
const TRONQUE = '\n… (état de la séance raccourci pour tenir dans la limite de NotebookLM)';

export function questionAuCarnet(etat: string, message: string, max = LONGUEUR_MAX_D_UNE_QUESTION): string {
    const seul = `${message}${CONSIGNE}`;
    const place = max - ENTETE.length - MESSAGE.length - message.length - CONSIGNE.length;
    const etatNet = etat.trim();
    if (!etatNet || place <= TRONQUE.length + 40) return seul;

    if (etatNet.length <= place) return `${ENTETE}${etatNet}${MESSAGE}${message}${CONSIGNE}`;

    const coupe = etatNet.slice(0, place - TRONQUE.length);
    const finDeLigne = coupe.lastIndexOf('\n');
    const garde = finDeLigne > 0 ? coupe.slice(0, finDeLigne) : coupe;
    return `${ENTETE}${garde}${TRONQUE}${MESSAGE}${message}${CONSIGNE}`;
}
