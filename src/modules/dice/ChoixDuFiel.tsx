import { useState } from 'react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../table/useRessourcesDeTableStore';
import { ressourcesDeLaTable } from '../table/reservesDuGroupe';
import { herosDeLaCampagne } from '../table/gestesDesHeros';
import { attribuerLeFielDuDernierJet, unsDuJetDeDestin } from './fielAuPupitre';
import { gmToast } from '../../stores/useToastStore';
import type { RollRecord } from '../../stores/useDiceStore';

/** La Loi désigne le bénéficiaire AVANT d'attribuer les 1, sans crédit automatique arbitraire. */
export default function ChoixDuFiel({ jet }: { jet: RollRecord }) {
    const session = useSessionOSStore();
    const table = useRessourcesDeTableStore();
    const [choix, choisir] = useState('');
    const pilote = session.getActiveDriver();
    const campagne = session.campaigns.find(c => c.id === session.activeCampaignId);
    const heros = herosDeLaCampagne(session.players, session.activeCampaignId);
    const fiel = pilote?.jet?.destin?.fiel;
    const niveau = fiel && campagne ? table.etatDe(campagne.id, ressourcesDeLaTable(pilote, campagne))[fiel] ?? 0 : 0;
    const credit = Math.max(0, unsDuJetDeDestin(jet) - niveau);
    const requis = !!pilote?.jet?.destin?.singularite && credit > 0;
    const elu = heros.find(h => JSON.stringify([h.joueurId, h.id]) === choix);
    return <div className="mt-3 flex flex-col items-center gap-2" data-fiel-au-pupitre>
        <p className="text-ui-10 text-app-muted">{unsDuJetDeDestin(jet)} × 1 : qui a lancé ?</p>
        {requis && <label className="text-xs text-app-text">Singularité du Rouage : {credit} point{credit > 1 ? 's' : ''}
            <select aria-label="Héros bénéficiaire de la Singularité" value={choix} onChange={e => choisir(e.target.value)}
                className="ml-2 rounded border border-app-border bg-app-bg p-1">
                <option value="">Choisir le Héros</option>
                {heros.map(h => <option key={JSON.stringify([h.joueurId, h.id])} value={JSON.stringify([h.joueurId, h.id])}>{h.nom}</option>)}
            </select>
        </label>}
        <div className="flex gap-2">{(['heros', 'rouage'] as const).map(qui => <button key={qui} type="button"
            disabled={qui === 'rouage' && requis && !elu}
            onClick={() => { for (const dit of attribuerLeFielDuDernierJet(qui, elu)) gmToast(dit, 'info'); }}
            className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-ui-10 font-bold text-accent disabled:opacity-30">
            {qui === 'heros' ? 'Un Héros ou allié' : 'Un Rouage hostile'}
        </button>)}</div>
    </div>;
}
