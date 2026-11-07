import { useState } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { Bouton } from '../../../components/socle';

/** Le destinataire choisit sa propre contrepartie : aucune carte secrète de l'autre main n'est révélée. */
export default function ContrepartieDeTorg({ deckId, porteur, accepter }: {
    deckId: string; porteur: string | null; accepter: (index: number) => void;
}) {
    const etat = useSessionOSStore(s => s.deckStates[deckId]);
    const diffusees = useSessionOSStore(s => s.mainsDesPaquets?.[deckId]);
    const deck = useSessionOSStore(s => s.decks.find(d => d.id === deckId));
    const [choisie, choisir] = useState('');
    const main = diffusees?.find(m => m.porteur === porteur);
    const enRounds = etat?.torgEnRounds ?? main?.torgEnRounds ?? false;
    const indices = etat ? (etat.enMain ?? []).filter(c => c.porteur === porteur && !!c.enReserve === enRounds).map(c => c.index)
        : enRounds ? main?.enReserve ?? [] : (main?.revelees ?? []).filter(i => !main?.enReserve?.includes(i));
    return <div className="flex flex-wrap items-center gap-2" data-contrepartie-torg>
        <select aria-label="Carte donnée en retour" value={choisie} onChange={e => choisir(e.target.value)}
            className="min-h-[44px] rounded-lg border border-app-border bg-app-surface px-2 text-app-text">
            <option value="">Une carte en retour ({enRounds ? 'Réserve' : 'main'})…</option>
            {indices.map(i => <option key={i} value={i}>{deck?.cardMetadata?.[i]?.name ?? `Carte #${i}`}</option>)}
        </select>
        <Bouton cibleTactile disabled={!choisie || !indices.includes(Number(choisie))} onClick={() => accepter(Number(choisie))}>Accepter l’échange</Bouton>
        {indices.length === 0 && <span className="text-ui-11 text-app-muted">Aucune carte disponible en retour.</span>}
    </div>;
}
