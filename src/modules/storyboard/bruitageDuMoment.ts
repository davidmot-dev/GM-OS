import { atmospheresVisibles } from '../sound/logic/atmospheresDeLaCampagne';
import { padPorteUnSon } from '../sound/logic/padPorteUnSon';

/**
 * **Le bruitage d'un moment désigne une atmosphère ET un pad.**
 *
 * *Signalé par David le 2026-09-25 : « la liste des sons de Sound-OS n'est pas
 * complète, elle ne reflète pas toutes les playlists ».* L'éditeur ne montrait
 * que les pads de l'atmosphère **active** — et le déclenchement ne cherchait
 * que là.
 *
 * ⛔ **Le défaut était plus profond que la liste.** Les pads s'appellent
 * `PAD_01` à `PAD_16` **dans chaque atmosphère** : un moment qui ne retenait
 * que `PAD_03` jouait « le pad n°3 de l'atmosphère active **au moment du
 * jeu** ». Changer d'atmosphère dans Sound-OS changeait donc le son de tous les
 * moments, sans un mot. *Un identifiant qui n'est unique que dans un contexte
 * désigne ce contexte autant que la chose.*
 */

interface PadDeSoundOS {
    id: string;
    title?: string;
    filePath?: string | null;
    volume?: number;
}

interface AtmosphereDeSoundOS {
    id: string;
    name: string;
    /** `campagneId`, le nom que lit `Rattachable` — un `campaignId` ne serait lu par personne. */
    campagneId?: string | null;
    pads: Record<string, PadDeSoundOS>;
}

/** Ce qu'il faut du magasin de Sound-OS. */
export interface EtatDeSoundOS {
    activeAtmosphereId: string | null;
    atmospheres: AtmosphereDeSoundOS[];
}

/** Une atmosphère et ses pads qui portent un son — une rubrique de la liste. */
export interface RubriqueDeBruitages {
    atmosphere: { id: string; name: string };
    pads: PadDeSoundOS[];
}

/**
 * **Les bruitages qu'on peut confier à un moment** : toutes les atmosphères
 * que Sound-OS montre pour cette campagne — la règle de Sound-OS lui-même,
 * `atmospheresVisibles` —, et dans chacune les seuls pads qui sonnent.
 */
export function bruitagesProposes(
    etat: EtatDeSoundOS | undefined,
    campagneId: string | null,
    campagnesConnues?: Iterable<string>,
): RubriqueDeBruitages[] {
    if (!etat) return [];
    return atmospheresVisibles(etat.atmospheres, campagneId, campagnesConnues)
        .map(a => ({
            atmosphere: { id: a.id, name: a.name },
            pads: Object.values(a.pads ?? {}).filter(padPorteUnSon),
        }))
        .filter(r => r.pads.length > 0);
}

/** Le pad qu'un moment désigne, prêt à jouer. */
export interface BruitageResolu {
    pad: PadDeSoundOS & { filePath: string };
    atmosphereId: string;
    /**
     * **La clé sous laquelle le moteur le joue.** L'identifiant du pad quand
     * il appartient à l'atmosphère active — c'est alors le pad que Sound-OS
     * montre, et il s'allume. Sinon une clé à part : le jouer sous `PAD_03`
     * couperait le `PAD_03` de l'atmosphère affichée et l'allumerait à tort.
     */
    cle: string;
    /** Le pad est-il celui que Sound-OS montre ? */
    dansLAtmosphereActive: boolean;
}

/**
 * **Retrouver le pad d'un moment.**
 *
 * ⚠️ Un moment écrit avant le 2026-09-25 n'a pas d'atmosphère : il garde son
 * sens d'origine, le pad de l'atmosphère active. *Un champ neuf ne doit jamais
 * rendre faux ce qui marchait avant lui.*
 *
 * @returns `null` si l'atmosphère a disparu, ou si le pad ne porte plus de son.
 */
export function bruitageDuMoment(
    moment: { soundPadId?: string; soundAtmosphereId?: string },
    etat: EtatDeSoundOS,
): BruitageResolu | null {
    if (!moment.soundPadId) return null;

    const atmosphereId = moment.soundAtmosphereId || etat.activeAtmosphereId;
    const atmosphere = etat.atmospheres.find(a => a.id === atmosphereId);
    const pad = atmosphere?.pads?.[moment.soundPadId];
    if (!atmosphere || !pad || !padPorteUnSon(pad)) return null;

    const dansLAtmosphereActive = atmosphere.id === etat.activeAtmosphereId;
    return {
        pad: pad as PadDeSoundOS & { filePath: string },
        atmosphereId: atmosphere.id,
        cle: dansLAtmosphereActive ? pad.id : `${atmosphere.id}:${pad.id}`,
        dansLAtmosphereActive,
    };
}
