import { useMemo } from 'react';
import { useLightStore } from '../useLightStore';
import type { LightScene } from '../useLightStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { classerLesTuiles, tuilesVisibles, tuilesOffertesAuRepli } from '../logic/tuilesDeLaCampagne';

/**
 * **Ce que Light-OS montre de la campagne ouverte — un seul lecteur.**
 *
 * ⛔ **Six écrans listent les tuiles**, et c'est ce qui rend ce hook
 * nécessaire : la grille, le sélecteur partagé (Music-OS, Sound-OS et
 * Ambient-OS passent tous par lui), la barre latérale, l'éditeur de zone de
 * danger de Map-OS, le choix d'un moment de storyboard — **et le clavier**, qui
 * n'est pas un écran et ne peut donc pas passer par ici.
 *
 * *Plusieurs écrivains pour une même vérité est le défaut que ce projet paie le
 * plus souvent.* Tant que la liste ne bougeait jamais, six lectures identiques
 * donnaient le même résultat ; elles cessent de le donner dès que la liste
 * **rétrécit**, c'est-à-dire maintenant, à chaque changement de campagne. Le
 * verdict se calcule donc ici, et le clavier appelle la **même fonction pure**.
 */
export function useTuilesVisibles() {
    const scenes = useLightStore(s => s.scenes);
    const defaultSceneId = useLightStore(s => s.defaultSceneId);

    const campagneId = useSessionOSStore(s => s.activeCampaignId);
    const campagnes = useSessionOSStore(s => s.campaigns);

    /*
      Les identifiants seuls, et pas la liste des campagnes : une campagne
      renommée ou déplacée ne change rien à qui possède quelle tuile, et
      recalculer là-dessus ferait repasser tous les écrans pour rien.
    */
    const idsDesCampagnes = useMemo(() => campagnes.map(c => c.id).join(' '), [campagnes]);
    const campagnesConnues = useMemo(
        () => (idsDesCampagnes ? idsDesCampagnes.split(' ') : []),
        [idsDesCampagnes],
    );

    const toutes = useMemo(() => Object.values(scenes), [scenes]);

    const visibles = useMemo(
        () => tuilesVisibles(toutes, campagneId, campagnesConnues),
        [toutes, campagneId, campagnesConnues],
    );

    const classees = useMemo(
        () => classerLesTuiles(toutes, campagneId, campagnesConnues),
        [toutes, campagneId, campagnesConnues],
    );

    /** Les tuiles capturées et visibles — celles qu'un autre module peut lier. */
    const capturees = useMemo(
        () => visibles.filter((s: LightScene) => Object.keys(s.lightStates).length > 0),
        [visibles],
    );

    /** Les candidates à l'éclairage normal, la désignation en cours comprise. */
    const pourLeRepli = useMemo(
        () => tuilesOffertesAuRepli(toutes, campagneId, defaultSceneId, campagnesConnues),
        [toutes, campagneId, defaultSceneId, campagnesConnues],
    );

    return { visibles, capturees, pourLeRepli, classees, campagneId, campagnesConnues };
}
