import { useEffect, useMemo } from 'react';
import { useSoundStore } from '../useSoundStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import {
    classerLesAtmospheres,
    atmospheresVisibles,
    atmosphereApresChangement,
} from '../logic/atmospheresDeLaCampagne';

/**
 * **Ce que Sound-OS montre de la campagne ouverte — un seul lecteur.**
 *
 * Calqué sur `music/usePlaylistsVisibles.ts`, et pour la même raison : dès que
 * la liste **rétrécit** — c'est-à-dire à chaque changement de campagne — deux
 * écrans qui calculeraient chacun leur sélection cesseraient de donner le même
 * résultat. *Plusieurs écrivains pour une même vérité est le défaut que ce
 * projet paie le plus souvent.*
 *
 * ⚠️ **La sélection est recalculée ici, et nulle part ailleurs.** Une
 * `activeAtmosphereId` qui pointe sur une atmosphère masquée laisserait seize
 * pads à l'écran sans qu'aucun onglet ne soit allumé — ou pire, ceux d'une
 * campagne qu'on ne joue pas.
 */
export function useAtmospheresVisibles() {
    const atmospheres = useSoundStore(s => s.atmospheres);
    const activeAtmosphereId = useSoundStore(s => s.activeAtmosphereId);
    const setActiveAtmosphereId = useSoundStore(s => s.setActiveAtmosphereId);

    const campagneId = useSessionOSStore(s => s.activeCampaignId);
    const campagnes = useSessionOSStore(s => s.campaigns);

    /*
      Les identifiants seuls : une campagne renommée ne change rien à qui
      possède quelle atmosphère, et recalculer là-dessus ferait repasser
      l'effet de sélection pour rien.
    */
    const idsDesCampagnes = useMemo(() => campagnes.map(c => c.id).join(' '), [campagnes]);
    const campagnesConnues = useMemo(
        () => (idsDesCampagnes ? idsDesCampagnes.split(' ') : []),
        [idsDesCampagnes],
    );

    const visibles = useMemo(
        () => atmospheresVisibles(atmospheres, campagneId, campagnesConnues),
        [atmospheres, campagneId, campagnesConnues],
    );

    const classees = useMemo(
        () => classerLesAtmospheres(atmospheres, campagneId, campagnesConnues),
        [atmospheres, campagneId, campagnesConnues],
    );

    const voulue = atmosphereApresChangement(
        atmospheres, campagneId, activeAtmosphereId, campagnesConnues,
    );

    useEffect(() => {
        /*
          `voulue` vaut `null` quand la campagne n'a rien à montrer. On ne
          réécrit alors pas la sélection : la garder permet de la retrouver
          telle quelle en revenant, et l'écran a son état vide à afficher.
        */
        if (voulue !== null && voulue !== activeAtmosphereId) setActiveAtmosphereId(voulue);
    }, [voulue, activeAtmosphereId, setActiveAtmosphereId]);

    const active = visibles.find(a => a.id === voulue) ?? null;

    return { visibles, classees, active, campagneId, campagnesConnues };
}
