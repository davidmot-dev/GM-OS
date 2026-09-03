import { resoudreCorpus } from '../../electron/corpusSysteme';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';

/**
 * **Quel jeu la campagne ouverte joue, et où vit son dossier.**
 *
 * Extrait de `useThemeDuJeu` le 2026-09-03, quand l'atelier de thème a eu besoin
 * de la même réponse. *Deux endroits qui résolvent le même dossier finissent par
 * ne plus le résoudre pareil* — et l'écart serait invisible : l'interface
 * lirait un thème, l'atelier en écrirait un autre, chacun persuadé d'avoir
 * raison.
 *
 * La résolution elle-même n'est pas triviale, et c'est bien pourquoi elle ne se
 * recopie pas : l'identifiant d'un pilote forgé est un horodatage
 * (`custom-1724…`), il ne dit rien du jeu. `resoudreCorpus` rapproche donc le
 * pilote de son dossier par quatre chemins, dont le nom du système et la liste
 * réelle des dossiers présents.
 */
export interface JeuDeLaCampagne {
    /** Le dossier du système, relatif à `docs/` — par exemple `systems/alien`. */
    racine: string;
    /** Le nom de la campagne ouverte, pour le dire à l'écran. */
    campagne: string;
    /** Le nom du jeu tel que le pilote le porte, s'il en a un. */
    jeu: string;
}

/**
 * `null` quand aucune campagne n'est ouverte : il n'y a alors pas de jeu, donc
 * pas de thème — *et c'est un état normal, pas un incident.*
 */
export async function jeuDeLaCampagneActive(campagneId: string | null): Promise<JeuDeLaCampagne | null> {
    const etat = useSessionOSStore.getState();
    const campagne = etat.campaigns?.find(c => c.id === campagneId);
    if (!campagne) return null;

    const pilote = etat.customGameDrivers?.find(d => d.id === campagne.system);
    const dossiersConnus = (await window.appBridge?.ai?.listSystems?.()) ?? [];

    const corpus = resoudreCorpus({
        systemId: campagne.system,
        systemName: pilote?.name,
        systemPath: campagne.systemPath,
        corpusId: pilote?.corpusId,
        ragPath: pilote?.ragPath,
        dossiersConnus,
    });

    return {
        racine: corpus.racine,
        campagne: campagne.name,
        jeu: pilote?.name || campagne.system || campagne.name,
    };
}
