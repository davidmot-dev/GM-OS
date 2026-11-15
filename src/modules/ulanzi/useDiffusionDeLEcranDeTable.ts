import { useEffect } from 'react';
import { useUlanziStore } from './useUlanziStore';
import { useClockStore } from '../../store/useClockStore';
import { useCombatStore } from '../combat/useCombatStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../table/useRessourcesDeTableStore';
import { useCorpusDeLaCampagne } from '../session/hooks/useCorpusDeLaCampagne';
import { minuteurPourLaTable, tempsPourLaTable } from './widgets/librairie';
import { reservesDeLaCampagne } from './useBattementUlanzi';
import { composerLEcranDeTable, horlogesPourLEcran, ordreDuTourPourLaTable, type EtatDeLEcran } from './ecranDeTable';

/**
 * **Le poste diffuse l'écran de table** — Fire HD 8, registre § 256, T12.
 *
 * Seul le poste du meneur compose (il détient les magasins) ; il envoie le résultat au rôle `hub`,
 * caviardé comme tout ce qui part aux joueurs, dans un segment `ecranDeTable` du flux. Il le renvoie
 * quand ce qu'il montre change, et à chaque connexion d'un appareil (`onRequestSync`) : un écran qui
 * arrive après coup doit être servi tout de suite.
 */
export function composerDepuisLesMagasins(systemId: string | null): EtatDeLEcran {
    const horloge = useClockStore.getState();
    return composerLEcranDeTable(systemId, useUlanziStore.getState().selectionEcran, {
        horloges: horlogesPourLEcran(horloge),
        minuteur: minuteurPourLaTable(horloge),
        temps: tempsPourLaTable(horloge),
        reserves: reservesDeLaCampagne(),
        ordre: ordreDuTourPourLaTable(useCombatStore.getState()),
        maintenant: Date.now(),
    });
}

/** Ce qui change ce que l'écran montre ; `maintenant` en est exclu (il bouge à chaque calcul). */
const empreinte = (etat: EtatDeLEcran) => JSON.stringify(etat, (cle, valeur) => (cle === 'maintenant' ? undefined : valeur));

export function useDiffusionDeLEcranDeTable(actif: boolean): void {
    const systemId = useCorpusDeLaCampagne();
    useEffect(() => {
        const pont = window.appBridge?.remote;
        if (!actif || !pont?.sendSync) return;
        let derniere = '';
        let attente: ReturnType<typeof setTimeout> | null = null;
        const envoyer = (force = false) => {
            const etat = composerDepuisLesMagasins(systemId);
            const nouvelle = empreinte(etat);
            if (!force && nouvelle === derniere) return;
            derniere = nouvelle;
            pont.sendSync?.({ ecranDeTable: etat }, 'hub');
        };
        // Les magasins changent par rafales (minuteur à la seconde, combat) : un envoi au plus toutes les 250 ms.
        const planifier = () => { if (!attente) attente = setTimeout(() => { attente = null; envoyer(); }, 250); };
        envoyer(true);
        const desabonnements = [
            useUlanziStore.subscribe(planifier),
            useClockStore.subscribe(planifier),
            useCombatStore.subscribe(planifier),
            useSessionOSStore.subscribe(planifier),
            useRessourcesDeTableStore.subscribe(planifier),
            pont.onRequestSync?.(() => envoyer(true)),
        ];
        return () => {
            if (attente) clearTimeout(attente);
            for (const fin of desabonnements) fin?.();
        };
    }, [actif, systemId]);
}
