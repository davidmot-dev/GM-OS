import { useEffect } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useCombatStore } from '../../combat/useCombatStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { lireSanteVoyageur } from '../logic/santeDuVoyageur';

/** L'observateur central couvre aussi une opération reçue d'une tablette quand
 * le MJ ne regarde aucune fiche. La lecture initiale ne consigne rien.
 */
export function useSuiviSanteVoyageur(actif: boolean) {
    useEffect(() => {
        if (!actif) return;
        const arreterSession = useSessionOSStore.subscribe((etat,precedent) => {
            const avant = new Map([...precedent.entities,...precedent.players.flatMap(p => p.characters)].map(c => [c.id,c]));
            for (const c of [...etat.entities,...etat.players.flatMap(p => p.characters)]) {
                const p = avant.get(c.id);
                if (!p || c === p || !c.sheetData?.__rddSante231) continue;
                if (JSON.stringify(c.sheetData) === JSON.stringify(p.sheetData) && c.hp === p.hp && c.healthSystem === p.healthSystem) continue;
                try {
                    const s = lireSanteVoyageur(c.sheetData), ancien = lireSanteVoyageur(p.sheetData ?? {});
                    useCombatStore.getState().refleterLaFiche(c.id,{hp:c.hp,healthSystem:c.healthSystem,
                        sheetData:c.sheetData as Record<string,string|number|boolean>});
                    if (!s?.derniereOperation || !ancien || s.derniereOperation === ancien.derniereOperation) continue;
                    const traces = c.sheetData.__rddHistoriqueSante231;
                    const trace = Array.isArray(traces) ? traces.find((x: {id?:unknown}) => x?.id === s.derniereOperation) as {motif:string;details:string[]} | undefined : undefined;
                    if (!trace || typeof trace.motif !== 'string' || !Array.isArray(trace.details)) continue;
                    useJournalStore.getState().addEvent({type:'COMBAT',title:`${c.name} — ${trace.motif}`,
                        content:trace.details.join(' '),nature:'trace',metadata:{rddOperation:s.derniereOperation}});
                    if (trace.motif === 'Encaisser') useCombatStore.getState().noterUnCoup(c.id,{value:
                        Math.max(0,Number(p.hp ?? 0)-Number(c.hp ?? 0))+Math.max(0,Number(p.sheetData?.endurance ?? 0)-Number(c.sheetData?.endurance ?? 0))});
                } catch {
                    // Une fiche malformée est signalée par son panneau, pas réparée à l'import.
                }
            }
        });
        const arreterPlateau = useCombatStore.subscribe((etat,precedent) => {
            if (etat.combatants === precedent.combatants) return;
            for (const c of etat.combatants.filter(c => !c.sourceEntityId && !c.sourcePlayerId)) {
                const p = precedent.combatants.find(p => p.id === c.id);
                if (!p || !c.sheetData?.__rddSante231) continue;
                try {
                    const s = lireSanteVoyageur(c.sheetData), ancien = lireSanteVoyageur(p.sheetData ?? {});
                    if (!s?.derniereOperation || !ancien || s.derniereOperation === ancien.derniereOperation) continue;
                    const traces = c.sheetData.__rddHistoriqueSante231 as unknown;
                    const trace = Array.isArray(traces) ? traces.find((v: {id:string}) => v?.id === s.derniereOperation) as {motif:string;details:string[]} | undefined : undefined;
                    if (!trace || !Array.isArray(trace.details)) continue;
                    useJournalStore.getState().addEvent({type:'COMBAT',title:`${c.name} — ${trace.motif}`,content:trace.details.join(' '),nature:'trace',metadata:{rddOperation:s.derniereOperation}});
                    if (trace.motif === 'Encaisser') useCombatStore.getState().noterUnCoup(c.id,{value:Math.max(0,Number(p.hp ?? 0)-Number(c.hp ?? 0))
                        +Math.max(0,Number(p.sheetData?.endurance ?? 0)-Number(c.sheetData?.endurance ?? 0))});
                } catch { /* Le panneau expose une fiche malformée sans la réinitialiser. */ }
            }
        });
        return () => {arreterSession();arreterPlateau();};
    },[actif]);
}
