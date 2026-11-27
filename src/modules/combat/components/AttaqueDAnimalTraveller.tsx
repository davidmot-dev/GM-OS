import React, { useState } from 'react';
import { Dices } from 'lucide-react';
import { DiceEngine } from '../../dice/DiceEngine';
import { DIFFICULTES_DE_TRAVELLER, lancerTraveller, type JetDeTraveller } from '../../dice/systemes/traveller';
import { DegatsDeTraveller } from './DegatsDeTraveller';
import type { AnimalDeTraveller } from '../logic/attaqueDeTraveller';
import type { Combatant } from '../types';

/**
 * **L'attaque d'un animal de Traveller** — TRV-A2, T8, 27/11/2026 (C10 ; David : créatures « Oui,
 * dans ce lot »). Un animal n'a pas de caractéristiques : le livre donne ses compétences « avec
 * leur MD » et ses attaques avec leurs dégâts (p. 81). Le test est donc 2D + Mêlée (naturelles)
 * contre la difficulté (Moyenne, 8+, par défaut) ; une attaque réussie ouvre la carte des dégâts de
 * l'arme — l'attaque choisie —, sans MD de FOR. La cible encaisse par la porte des dégâts.
 */
export const AttaqueDAnimalTraveller: React.FC<{
    combattant: Combatant;
    animal: AnimalDeTraveller;
    cible?: Pick<Combatant, 'id' | 'name'> | null;
}> = ({ combattant, animal, cible }) => {
    const [attaque, setAttaque] = useState(0);
    const [difficulte, setDifficulte] = useState(8);
    const [md, setMd] = useState(animal.mdDeMelee);
    const [jet, setJet] = useState<{ resultat: JetDeTraveller; compte: number } | null>(null);
    const choisie = animal.attaques[attaque];
    const lancer = () => setJet(j => ({ resultat: lancerTraveller(0, md, () => DiceEngine.roll(6), difficulte), compte: (j?.compte ?? 0) + 1 }));
    const champ = 'rounded border border-app-border bg-app-bg px-1 py-0.5';
    return (
        <section data-attaque-animal-traveller className="space-y-2 rounded-xl border border-accent/60 p-3 text-ui-11">
            <p className="text-ui-10 font-black uppercase tracking-widest text-app-text">
                {cible ? `${combattant.name} attaque ${cible.name}` : `${combattant.name} attaque`}
            </p>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1">Attaque
                    <select aria-label="Attaque de l’animal" className={champ} value={attaque}
                        onChange={e => { setAttaque(Number(e.target.value)); setJet(null); }}>
                        {animal.attaques.map((a, i) => <option key={a.libelle} value={i}>{a.libelle} ({a.texteDesDegats})</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-1" title="La compétence d’un animal est donnée avec son MD (p. 81).">Mêlée (naturelles)
                    <input aria-label="MD de Mêlée (naturelles)" type="number" className={`w-14 text-center ${champ}`} value={md}
                        onChange={e => setMd(Math.trunc(Number(e.target.value)) || 0)} />
                </label>
                <label className="flex items-center gap-1">Difficulté
                    <select aria-label="Difficulté de l’attaque" className={champ} value={difficulte} onChange={e => setDifficulte(Number(e.target.value))}>
                        {DIFFICULTES_DE_TRAVELLER.map(d => <option key={d.cible} value={d.cible}>{d.label} ({d.cible}+)</option>)}
                    </select>
                </label>
                <button type="button" onClick={lancer} data-lancer-attaque-animal
                    className="flex items-center gap-1 rounded border border-app-border/60 px-2 py-0.5 hover:border-accent/50 hover:text-accent">
                    <Dices size={11} /> Lancer 2D {md >= 0 ? `+ ${md}` : `− ${-md}`}
                </button>
            </div>
            {jet && <p data-resultat-attaque-animal className="font-bold">{jet.resultat.totalDisplay}</p>}
            {jet && cible && choisie && (
                <DegatsDeTraveller key={jet.compte} cibleId={cible.id} attaquantId={combattant.id} armes={[choisie]}
                    effet={jet.resultat.traveller.effet} reussie={jet.resultat.traveller.effet >= 0} />
            )}
        </section>
    );
};
