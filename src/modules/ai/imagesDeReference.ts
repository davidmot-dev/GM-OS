/**
 * **Les images d'exemple d'une identité visuelle** — 2026-10-17.
 *
 * Réduites à **512 pixels** au plus grand côté, en JPEG : c'est la taille que
 * les FLUX.2 de Cloudflare acceptent pour une image de référence, et elle garde
 * un pilote exporté léger (quelques dizaines de kilo-octets par image).
 *
 * Le modèle de vision, lui, ne lit **qu'une image par appel** : plusieurs
 * exemples s'assemblent donc en une mosaïque, côte à côte.
 */
export const COTE_DES_REFERENCES = 512;
export const REFERENCES_MAX = 4;

function chargerLImage(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('image illisible'));
        image.src = source;
    });
}

function lireLeFichier(fichier: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const lecteur = new FileReader();
        lecteur.onload = () => resolve(String(lecteur.result));
        lecteur.onerror = () => reject(new Error('fichier illisible'));
        lecteur.readAsDataURL(fichier);
    });
}

/** Les dimensions réduites : le plus grand côté à `cote`, jamais agrandi. */
export function dimensionsReduites(largeur: number, hauteur: number, cote = COTE_DES_REFERENCES): [number, number] {
    const echelle = Math.min(1, cote / Math.max(largeur, hauteur, 1));
    return [Math.max(1, Math.round(largeur * echelle)), Math.max(1, Math.round(hauteur * echelle))];
}

/** Un fichier choisi sur le disque, réduit en JPEG `data:`. */
export async function reduireLImage(fichier: Blob, cote = COTE_DES_REFERENCES): Promise<string> {
    const image = await chargerLImage(await lireLeFichier(fichier));
    const [largeur, hauteur] = dimensionsReduites(image.naturalWidth, image.naturalHeight, cote);
    const toile = document.createElement('canvas');
    toile.width = largeur;
    toile.height = hauteur;
    const contexte = toile.getContext('2d');
    if (!contexte) throw new Error('dessin impossible');
    contexte.drawImage(image, 0, 0, largeur, hauteur);
    return toile.toDataURL('image/jpeg', 0.85);
}

/** La grille d'une mosaïque : deux côte à côte, trois ou quatre en carré. */
export function grilleDeLaMosaique(nombre: number): { colonnes: number; lignes: number } {
    if (nombre <= 1) return { colonnes: 1, lignes: 1 };
    if (nombre === 2) return { colonnes: 2, lignes: 1 };
    return { colonnes: 2, lignes: 2 };
}

/** Plusieurs exemples assemblés en une image, pour le modèle de vision. */
export async function mosaique(references: readonly string[], cote = COTE_DES_REFERENCES): Promise<string> {
    const choisies = references.slice(0, REFERENCES_MAX);
    if (choisies.length === 1) return choisies[0];
    const { colonnes, lignes } = grilleDeLaMosaique(choisies.length);
    const toile = document.createElement('canvas');
    toile.width = colonnes * cote;
    toile.height = lignes * cote;
    const contexte = toile.getContext('2d');
    if (!contexte) throw new Error('dessin impossible');
    contexte.fillStyle = '#000';
    contexte.fillRect(0, 0, toile.width, toile.height);
    const images = await Promise.all(choisies.map(chargerLImage));
    images.forEach((image, i) => {
        const [largeur, hauteur] = dimensionsReduites(image.naturalWidth, image.naturalHeight, cote);
        const x = (i % colonnes) * cote + (cote - largeur) / 2;
        const y = Math.floor(i / colonnes) * cote + (cote - hauteur) / 2;
        contexte.drawImage(image, x, y, largeur, hauteur);
    });
    return toile.toDataURL('image/jpeg', 0.85);
}
