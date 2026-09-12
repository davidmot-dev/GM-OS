import { useHardwareStore } from '../stores/useHardwareStore';
import { gmToast } from '../stores/useToastStore';

/**
 * **Envoyer un son sur la sortie demandée — et le dire quand elle n'est plus là.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ CE QUE FAISAIENT LES DEUX MOTEURS, CHACUN DE SON CÔTÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Ambient-OS et Sound-OS portaient le **même bloc, recopié** : `setSinkId`,
 * `catch (NotFoundError)`, repli sur la sortie par défaut, et un
 * `console.warn`. C'est ce `Device 22ad7d4a… not found, falling back to
 * default` que David a vu le 2026-09-12.
 *
 * Deux défauts s'y cachaient :
 *
 * 1. **Un identifiant périmé n'était pas un appareil absent.** Rebrancher une
 *    enceinte change son `deviceId` : la sortie était toujours là, sous un
 *    autre numéro, et personne n'allait la chercher.
 * 2. **Le repli était muet.** Une ambiance visant les enceintes du fond sortait
 *    devant, et rien à l'écran ne le disait. *Un réglage qui retombe en silence
 *    est un mensonge d'écran* — et il se découvre en séance, devant les joueurs.
 *
 * ⭐ **On retrouve d'abord, on se replie ensuite, et on parle toujours.**
 *
 * ⚠️ **Une seule alerte par appareil.** Un moment de storyboard repose sa sortie
 * à chaque déclenchement : sans cette retenue, une soirée entière de bulles pour
 * une seule enceinte débranchée — *et un avertissement qui crie tout le temps ne
 * se lit plus.*
 */

/** Les appareils dont on a déjà signalé l'absence, pour ne le dire qu'une fois. */
const dejaSignales = new Set<string>();

/** À appeler quand le matériel change : ce qui était absent peut être revenu. */
export function oublierLesAbsences(): void {
    dejaSignales.clear();
}

export interface PoseDeSortie {
    /** Le nom du moteur, pour les traces : « AmbientEngine », « SoundEngine »… */
    nom: string;
    /** La sortie enregistrée par le meneur — un `deviceId`, `'default'`, ou rien. */
    deviceId: string | null | undefined;
    /** Ce que le moteur sait faire : poser un sink. `''` = sortie par défaut. */
    appliquer: (sinkId: string) => Promise<void>;
}

/**
 * Pose la sortie et rend **ce qui a réellement été fait** — l'appelant peut
 * ainsi le consigner avec le reste de ce qu'il a joué.
 */
export async function poserLaSortie(
    pose: PoseDeSortie,
): Promise<'par-defaut' | 'trouvee' | 'retrouvee' | 'disparue'> {
    const { nom, deviceId, appliquer } = pose;
    const verdict = useHardwareStore.getState().sortieAEmployer(deviceId);

    if (verdict.sort === 'par-defaut') {
        await appliquer('');
        return 'par-defaut';
    }

    if (verdict.sort === 'trouvee') {
        await appliquer(verdict.deviceId);

        if (verdict.par === 'signature') {
            /*
              ⭐ Le cas réparé : l'identifiant avait changé, la signature l'a
              retrouvé. On le trace sans déranger le meneur — *rien n'a manqué à
              la table, il n'y a rien à lui demander.*
            */
            console.log(`[${nom}] sortie retrouvée sous un nouvel identifiant : ${verdict.deviceId}`);
            return 'retrouvee';
        }
        return 'trouvee';
    }

    /*
      ⛔ Disparue pour de bon. On se replie — *perdre la sortie choisie vaut
      mieux que perdre le son* — mais on le dit, avec le nom que le meneur lui a
      donné : « Enceintes du fond » lui parle, « 22ad7d4a… » ne lui dit rien.
    */
    await appliquer('');

    const cle = deviceId ?? '';
    if (!dejaSignales.has(cle)) {
        dejaSignales.add(cle);
        const label = useHardwareStore.getState().getAudioLabel(cle);
        console.warn(`[${nom}] sortie « ${label} » introuvable : repli sur la sortie par défaut.`);
        gmToast(`⚠️ Sortie « ${label} » introuvable — le son part sur la sortie par défaut.`, 'warning');
    }

    return 'disparue';
}
