import type { RollRecord } from '../../stores/useDiceStore';
import { useDiceStore } from '../../stores/useDiceStore';
import { ajouterUnDeDuDestin, desDuDixDisponibles } from './suiteDuDestinAuPupitre';
export default function ChoixDesDix({ jet }: { jet: RollRecord }) {
    if (jet.destinClos || jet.fielAttribue || !desDuDixDisponibles(jet)) return null;
    return <div aria-label="Dés supplémentaires au pupitre" className="mt-3 space-y-2 text-center text-xs text-app-text">
        <p>{desDuDixDisponibles(jet)} dé(s) offert(s) par les 10 ; les lancer reste votre choix.</p>
        <div className="flex justify-center gap-2">
            <button type="button" onClick={() => ajouterUnDeDuDestin(jet.id)} className="rounded border border-accent px-3 py-2 text-accent">Lancer un dé supplémentaire</button>
            <button type="button" onClick={() => useDiceStore.getState().annoterLeJet(jet.id, { destinClos: true })} className="rounded border border-app-border px-3 py-2">Garder ce résultat</button>
        </div>
    </div>;
}
