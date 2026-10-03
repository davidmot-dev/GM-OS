/**
 * **La réflexion d'un modèle ne s'affiche pas** — trouvé le 2026-10-03 avec
 * `lfm2.5`, le modèle de séance de David.
 *
 * `think: false` range la réflexion à part (`message.thinking`) chez les
 * modèles qui le comprennent, comme `gemma4`. D'autres l'écrivent **dans la
 * réponse**, entre `<think>` et `</think>` — en anglais, et avant la réponse :
 * le Sage affichait *« <think> The user asks: "ou est Mccoy"… »*.
 *
 * Pas de bibliothèque : deux balises, et un filtre de flux qui retient au plus
 * le début d'une balise coupée entre deux morceaux.
 */

const OUVRE = '<think>';
const FERME = '</think>';

/** Une réponse entière, sans ses blocs de réflexion ; un bloc jamais refermé emporte la fin. */
export function retirerLaReflexion(texte: string): string {
    if (!texte.includes(OUVRE) && !texte.includes(FERME)) return texte;
    let net = texte.replace(/<think>[\s\S]*?<\/think>\s*/g, '');
    const ouvert = net.indexOf(OUVRE);
    if (ouvert >= 0) net = net.slice(0, ouvert);
    // Une balise fermante orpheline : la réflexion commençait avant la réponse.
    const ferme = net.lastIndexOf(FERME);
    if (ferme >= 0) net = net.slice(ferme + FERME.length);
    return net.replace(/^\s+/, '');
}

/** La longueur du plus long début de `balise` qui termine `texte` — ce qu'il faut retenir. */
function debutDeBalise(texte: string, balise: string): number {
    for (let k = Math.min(balise.length - 1, texte.length); k > 0; k--) {
        if (texte.endsWith(balise.slice(0, k))) return k;
    }
    return 0;
}

/**
 * Le même retrait, **morceau par morceau** : ce qui est hors réflexion sort
 * aussitôt, la réflexion ne sort jamais, et une balise coupée en deux morceaux
 * est attendue plutôt qu'affichée à moitié.
 */
export function filtreDeReflexion(): { pousser: (morceau: string) => string; finir: () => string } {
    let dedans = false;
    let tampon = '';
    /** Juste après une réflexion, les blancs de tête ne s'affichent pas. */
    let rogner = false;

    const pousser = (morceau: string): string => {
        tampon += morceau;
        let sortie = '';
        for (;;) {
            if (!dedans) {
                const i = tampon.indexOf(OUVRE);
                if (i >= 0) {
                    sortie += tampon.slice(0, i);
                    tampon = tampon.slice(i + OUVRE.length);
                    dedans = true;
                    continue;
                }
                const garde = debutDeBalise(tampon, OUVRE);
                sortie += tampon.slice(0, tampon.length - garde);
                tampon = tampon.slice(tampon.length - garde);
                break;
            }
            const j = tampon.indexOf(FERME);
            if (j >= 0) {
                tampon = tampon.slice(j + FERME.length);
                dedans = false;
                rogner = true;
                continue;
            }
            tampon = tampon.slice(tampon.length - debutDeBalise(tampon, FERME));
            break;
        }
        if (rogner && sortie) {
            sortie = sortie.replace(/^\s+/, '');
            if (sortie) rogner = false;
        }
        return sortie;
    };

    const finir = (): string => {
        const reste = dedans ? '' : tampon;
        tampon = '';
        return rogner ? reste.replace(/^\s+/, '') : reste;
    };

    return { pousser, finir };
}
