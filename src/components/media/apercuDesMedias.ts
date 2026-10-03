/**
 * **Des vignettes qui se reconnaissent** — refonte, L6 (2026-10-03), maquette
 * retenue de la médiathèque : *« l'image montre l'image, le son sa forme
 * d'onde et sa durée, la vidéo sa première image, le document sa première
 * page »* — David : *« plus de distinction entre les types »*.
 *
 * Ici, ce qui se calcule et se teste ; le dessin vit dans `MediaItemThumbnail`.
 */

/**
 * Les crêtes d'un son : `n` barres, chacune l'amplitude maximale de sa tranche,
 * ramenées entre 0 et 1 par la plus haute. Un son muet rend des barres nulles,
 * pas une division par zéro.
 */
export function cretesDepuisLesEchantillons(echantillons: Float32Array, n: number): number[] {
    if (n <= 0 || echantillons.length === 0) return [];
    const taille = Math.max(1, Math.floor(echantillons.length / n));
    const cretes: number[] = [];
    for (let b = 0; b < n; b++) {
        let max = 0;
        const fin = Math.min(echantillons.length, (b + 1) * taille);
        for (let i = b * taille; i < fin; i++) {
            const v = Math.abs(echantillons[i]);
            if (v > max) max = v;
        }
        cretes.push(max);
    }
    const plusHaute = Math.max(...cretes);
    return plusHaute > 0 ? cretes.map(c => c / plusHaute) : cretes;
}

/** Une durée lisible : « 0:42 », « 3:05 », « 1:02:09 ». */
export function dureeLisible(secondes: number): string {
    if (!Number.isFinite(secondes) || secondes < 0) return '';
    const s = Math.round(secondes);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    const deux = (x: number) => String(x).padStart(2, '0');
    return h > 0 ? `${h}:${deux(m)}:${deux(r)}` : `${m}:${deux(r)}`;
}

/** Les documents dont on peut montrer le début : du texte, lisible tel quel. */
export const estDuTexte = (nom: string) => /\.(md|markdown|txt|text)$/i.test(nom);

/** Les premières lignes non vides d'un texte, sans la ponctuation du markdown. */
export function debutDuTexte(texte: string, lignes = 8): string[] {
    return texte
        .split(/\r?\n/)
        .map(l => l.replace(/^\s*(#{1,6}|[-*+]|\d+\.)\s+/, '').replace(/[*_`]/g, '').trim())
        .filter(Boolean)
        .slice(0, lignes);
}

/**
 * Au-delà de cette taille, on ne décode pas un son pour en dessiner l'onde :
 * décoder trente minutes de musique pour une vignette coûterait plus que ce
 * qu'elle apprend. La durée, elle, se lit toujours.
 */
export const TAILLE_MAX_POUR_L_ONDE = 40 * 1024 * 1024;

type Apercu = { cretes: number[]; duree: number };
const cache = new Map<string, Promise<Apercu | null>>();
let file: Promise<unknown> = Promise.resolve();

/**
 * L'onde d'un son, **une fois par média et une à la fois** : une grille de
 * cinquante sons ne doit pas lancer cinquante décodages en même temps.
 */
export function ondeDuSon(id: string, url: string, barres = 48): Promise<Apercu | null> {
    const deja = cache.get(id);
    if (deja) return deja;
    const travail = file.then(async () => {
        try {
            const reponse = await fetch(url);
            const octets = await reponse.arrayBuffer();
            const contexte = new OfflineAudioContext(1, 1, 44100);
            const son = await contexte.decodeAudioData(octets);
            return { cretes: cretesDepuisLesEchantillons(son.getChannelData(0), barres), duree: son.duration };
        } catch {
            return null;
        }
    });
    file = travail;
    cache.set(id, travail);
    return travail;
}
