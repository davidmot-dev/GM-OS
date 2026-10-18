import { useEffect } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useJournalStore } from '../../journal/useJournalStore';

/** Le MJ consigne aussi les périodes reçues d'une tablette, sans rejouer à l'hydratation. */
export function useSuiviOuvragesEtRepos(actif: boolean) {
    useEffect(() => {
        if (!actif) return;
        return useSessionOSStore.subscribe((etat,precedent) => {
            const avant = new Map([...precedent.entities,...precedent.players.flatMap(p=>p.characters)].map(p=>[p.id,p]));
            for (const p of [...etat.entities,...etat.players.flatMap(p=>p.characters)]) {
                const ancien = avant.get(p.id);if (!ancien || ancien === p) continue;
                const historiques = p.sheetData?.__rddHistoriqueR34231;
                if (!Array.isArray(historiques)) continue;
                const recus = ancien.sheetData?.__rddOperationsR34231;
                const connus = new Set(Array.isArray(recus) ? recus : []);
                const nouveaux = p.sheetData?.__rddOperationsR34231;
                // Un import de plusieurs opérations n'est pas une action de séance.
                if (!Array.isArray(nouveaux) || nouveaux.length !== connus.size+1 || [...connus].some(id=>!nouveaux.includes(id))) continue;
                for (const trace of historiques) {
                    if (!trace || typeof trace.id !== 'string' || connus.has(trace.id) || typeof trace.motif !== 'string'
                        || !Array.isArray(trace.details) || trace.details.some((v:unknown)=>typeof v !== 'string')) continue;
                    const journal = useJournalStore.getState();
                    if (journal.journals.some(j=>j.events.some(e=>e.metadata?.rddOperation === trace.id))) continue;
                    journal.addEvent({type:'PJ',nature:'trace',title:`${p.name} — ${trace.motif}`,
                        content:trace.details.join(' '),metadata:{rddOperation:trace.id}});
                }
            }
        });
    },[actif]);
}
