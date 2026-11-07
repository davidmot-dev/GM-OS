import { useState } from 'react';
import { useCombatStore } from '../useCombatStore';
import { useCosmsCourants } from '../../session/hooks/useCosmsCourants';
import { loiEnVigueur } from '../../session/logic/cosmsCourants';
import { appliquerTenaciteTorg, appliquerSouffranceTorg, finirTourTenaciteTorg, peutRecevoirTenaciteTorg } from '../suitesDeTorg';
import type { Combatant } from '../types';

export default function SuitesDeTorg({ combatant }: { combatant: Combatant }) {
    const cosms = useCosmsCourants();
    const combattants = useCombatStore(s => s.combatants);
    const [attaquant, choisir] = useState('');
    const recu = combatant.suiteTorg;
    const tenacite = peutRecevoirTenaciteTorg(combatant) && !!loiEnVigueur(cosms, 'tenacite');
    const souffrance = (recu?.blessures ?? 0) > 0 && !recu?.souffranceTraitee && !!loiEnVigueur(cosms, 'souffrance');
    if (!tenacite && !souffrance && !recu?.dernierTour) return null;
    const bouton = 'rounded-lg border border-accent/30 px-3 py-2 text-ui-11 font-bold disabled:opacity-40';
    return <section className="mx-3 my-2 space-y-2 rounded-xl border border-accent/30 p-3 text-ui-11" data-suites-torg>
        <strong>Lois du Monde · suites du coup</strong>
        {tenacite && <div><button className={bouton} type="button" onClick={() => appliquerTenaciteTorg(combatant.id)}>Ténacité : subir 1 Blessure, effacer le Choc</button></div>}
        {souffrance && <div className="flex flex-wrap gap-2"><select className={bouton} aria-label="Auteur de la Blessure" value={attaquant} onChange={e => choisir(e.target.value)}>
            <option value="">Qui a infligé cette Blessure ?</option>{combattants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select><button className={bouton} type="button" disabled={!attaquant || combattants.find(c => c.id === attaquant)?.actionsSouffranceTorg?.includes(recu!.id)} onClick={() => appliquerSouffranceTorg(combatant.id, attaquant)}>Souffrance : récupérer 1 Choc</button></div>}
        {recu?.dernierTour && <div><p>Un tour complet est accordé avant le test de Défaite.</p><button className={bouton} type="button" onClick={() => finirTourTenaciteTorg(combatant.id)}>Tour accordé terminé · test de Défaite</button></div>}
    </section>;
}
