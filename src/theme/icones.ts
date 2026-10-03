/**
 * **Les icônes d'un jeu** — refonte, phase 6 (V4), contrat v1.6, 2026-10-03.
 *
 * Un jeu remplace **les icônes qui lui importent** parmi les noms du § 9
 * (`NOMS_D_ICONES`) ; les autres restent celles de GM-OS. *Quinze icônes bien
 * choisies font un thème ; quatre cents font un projet mort* — § 8.6 de
 * l'architecture.
 *
 * Même chemin que les ornements (`ornements.ts`) : `icones.json` lu par
 * `readDoc`, chaque chemin **confiné** à `icones/<nom>.svg`, chaque SVG passé
 * aux règles du § 8 (dessiné en `currentColor`, sans script ni lien), puis
 * incorporé en adresse `data:` et posé en **masque** : le dessin donne la forme,
 * la couleur du texte autour donne la couleur. Une icône de la barre latérale
 * s'allume donc avec son module, comme celle de GM-OS.
 */

import { NOMS_D_ICONES, TAILLES_MAXIMALES } from './contratDuTheme';
import { problemesDuSvg, enAdresse } from './ornements';

export type NomDIcone = string;
/** Chaque icône fournie, en adresse `data:` prête à poser. */
export type IconesDuJeu = Partial<Record<NomDIcone, string>>;

const NOMS = new Set(NOMS_D_ICONES.map(i => i.nom));
/** Une icône du dossier `theme/` : `icones/<fichier>.svg`, sans sortir du dossier. */
export const CHEMIN_D_ICONE = /^icones\/[\w.-]+\.svg$/;

/** Les deux variables qu'une icône fournie pose : son dessin, et l'effacement du repli. */
export const variablesDeLIcone = (nom: NomDIcone) => [`--icone-${nom}`, `--icone-${nom}-affichage`, `--icone-${nom}-repli`] as const;

/**
 * **Les icônes d'un thème de jeu**, lues et incorporées. Rend `{}` quand le jeu
 * n'en a pas — le cas normal. Une icône douteuse (nom inconnu, chemin qui sort
 * du dossier, SVG qui échoue au § 8, plus de 20 Ko) est **écartée et dite** :
 * l'icône de GM-OS reste. *Un absent silencieux, un incident bruyant.*
 */
export async function chargerLesIcones(
    lire: (chemin: string) => Promise<string | null | undefined>,
    racine: string,
): Promise<IconesDuJeu> {
    const brut = await lire(`${racine}/theme/icones.json`).catch(() => null);
    if (!brut) return {};

    let table: Record<string, unknown>;
    try {
        table = JSON.parse(brut);
    } catch {
        console.warn(`[Icônes] ${racine}/theme/icones.json n'est pas du JSON valide : aucune icône.`);
        return {};
    }
    if (!table || typeof table !== 'object' || Array.isArray(table)) return {};

    const icones: IconesDuJeu = {};
    for (const [nom, chemin] of Object.entries(table)) {
        if (!NOMS.has(nom)) {
            console.warn(`[Icônes] « ${nom} » écarté : ce nom n'est pas au § 9 du contrat.`);
            continue;
        }
        if (typeof chemin !== 'string' || !CHEMIN_D_ICONE.test(chemin)) {
            console.warn(`[Icônes] ${nom} écarté : « ${String(chemin)} » doit être icones/<nom>.svg.`);
            continue;
        }
        const svg = await lire(`${racine}/theme/${chemin}`).catch(() => null);
        const problemes = svg ? problemesDuSvg(svg) : ['est introuvable.'];
        if (svg && svg.length > TAILLES_MAXIMALES.icone) problemes.push(`pèse plus de ${TAILLES_MAXIMALES.icone / 1024} Ko.`);
        if (problemes.length > 0) {
            console.warn(`[Icônes] ${nom} écarté : « ${chemin} » ${problemes.join(' ')}`);
            continue;
        }
        icones[nom] = enAdresse(svg!);
    }
    return icones;
}
