import React, { useState } from 'react';
import { BedDouble, Brain, RefreshCw, Sun } from 'lucide-react';
import { DiceEngine } from '../../dice/DiceEngine';
import { useJournalStore } from '../../journal/useJournalStore';
import { ecrireLaFicheDuCombattant } from '../ficheDesCombattants';
import { armesDeTraveller } from '../logic/attaqueDeTraveller';
import { recharger } from '../logic/munitionsDeTraveller';
import { lireLesMunitions, ecrireLesMunitions, psiRecuperee, testDeReveil, uneHeureDeRepos } from '../../dice/systemes/depensesDeTraveller';
import { etatPhysique, mdDeCaracteristique } from '../../dice/systemes/traveller';
import type { Combatant } from '../types';
import type { CatalogueDEquipement, GameDriver } from '../../../types/drivers';

type RegleDuPhysique = NonNullable<GameDriver['combat']['physiqueTraveller']>;

/**
 * **Les ressources de Traveller sur la carte de combat** — TRV-A6, 27/11/2026 (spécification
 * `2026-11-27-traveller-depenses-et-durees.md`, C2, C5, C7, C8, C9 ; décisions de David du 27/11).
 *
 * Quatre gestes, chacun seulement quand il a un sens, chacun avec sa ligne au journal :
 * - **Recharger** une arme dont le chargeur n'est pas plein (une action mineure, p. 74) ;
 * - **Récupérer la PSI** : le meneur dit les heures écoulées depuis la dernière utilisation, un
 *   point par heure au-delà de trois, jusqu'à la PSI sans dépense (p. 224 ; « Heures saisies ») ;
 * - **Une heure de repos** : les dégâts incapacitants retenus reviennent à l'END (p. 76) ;
 * - **Test de réveil** d'un inconscient : 2D + MD END contre 8, MD+1 par échec, une minute par
 *   test (p. 80).
 * Les écritures passent par l'écrivain de la fiche du combattant, qui réaligne MD et total (TRV-A3).
 */
const entier = (v: unknown) => Math.max(0, Math.trunc(Number(v) || 0));
const bouton = 'flex items-center gap-1 rounded border border-app-border/50 px-2 py-0.5 text-ui-10 hover:border-accent/50 hover:text-accent disabled:opacity-40';
const noter = (titre: string, texte: string) => useJournalStore.getState().addEvent({ type: 'COMBAT', title: titre, content: texte });

export const RessourcesDeTraveller: React.FC<{
    combattant: Combatant;
    regle: RegleDuPhysique;
    valeurs: Record<string, unknown>;
    catalogue?: CatalogueDEquipement;
}> = ({ combattant, regle, valeurs, catalogue }) => {
    const [heures, setHeures] = useState(4);
    const [echecs, setEchecs] = useState(0);
    const [dernier, setDernier] = useState<string | null>(null);
    const ecrire = (maj: Record<string, unknown>) => ecrireLaFicheDuCombattant(combattant, maj as Record<string, string | number | boolean>);
    const nom = combattant.name;

    const aRecharger = armesDeTraveller(valeurs, catalogue).filter(a => {
        const m = lireLesMunitions(a.munitions, a.chargeur);
        return m && m.restants < m.capacite;
    });

    const psi = regle.psi ? entier(valeurs[regle.psi.champ]) : 0;
    const psiMax = regle.psi ? entier(valeurs[regle.psi.maximum]) : 0;
    const recuperable = !!regle.psi && psi < psiMax;

    const incapacitants = regle.incapacitants ? entier(valeurs[regle.incapacitants]) : 0;
    const physique = { endurance: entier(valeurs[regle.endurance]), force: entier(valeurs[regle.force]), dexterite: entier(valeurs[regle.dexterite]) };
    // Une fiche sans ces trois champs (une créature du bestiaire, p. 81) n'est jamais « inconsciente ».
    const lisible = [regle.endurance, regle.force, regle.dexterite].every(k => valeurs[k] !== undefined && valeurs[k] !== '');
    const inconscient = lisible && etatPhysique(physique) === 'inconscient';
    const mdEnd = mdDeCaracteristique(physique.endurance);

    if (aRecharger.length === 0 && !recuperable && incapacitants === 0 && !inconscient) return null;

    const recupererLaPsi = () => {
        if (!regle.psi) return;
        const r = psiRecuperee({ psi, maximum: psiMax, heures });
        if (r.rendus > 0) ecrire({ [regle.psi.champ]: r.psiApres });
        const texte = r.rendus > 0
            ? `${heures} h depuis la dernière utilisation : ${r.rendus} PSI récupéré${r.rendus > 1 ? 's' : ''}, PSI ${psi} → ${r.psiApres} (p. 224).`
            : `${heures} h depuis la dernière utilisation : rien avant la quatrième heure (p. 224).`;
        noter(`${nom} — PSI`, texte); setDernier(texte);
    };
    const seReposer = () => {
        if (!regle.incapacitants) return;
        const max = regle.maximum ? entier(valeurs[regle.maximum.endurance]) : physique.endurance + incapacitants;
        const r = uneHeureDeRepos({ endurance: physique.endurance, maximum: max, incapacitants });
        ecrire({ [regle.endurance]: r.enduranceApres, [regle.incapacitants]: 0 });
        const texte = `Une heure de repos : les dégâts incapacitants sont guéris, END ${physique.endurance} → ${r.enduranceApres} (p. 76).`;
        noter(`${nom} — repos`, texte); setDernier(texte);
    };
    const tenterLeReveil = () => {
        const des = [DiceEngine.roll(6), DiceEngine.roll(6)];
        const r = testDeReveil(des, mdEnd, echecs);
        const minute = echecs + 1;
        const texte = `Test de réveil, minute ${minute} : ${des.join(' + ')} ${r.md >= 0 ? '+' : '−'} ${Math.abs(r.md)} = ${r.total} contre 8 — `
            + (r.reveille ? 'reprend conscience (p. 80).' : `reste inconscient, MD+${echecs + 1} au prochain test (p. 80).`);
        setEchecs(r.reveille ? 0 : echecs + 1);
        noter(`${nom} — inconscience`, texte); setDernier(texte);
    };

    return (
        <div data-ressources-traveller={combattant.id} className="mx-3 my-1 flex flex-col gap-1 rounded border border-app-border/30 p-1.5 text-ui-10">
            <div className="flex flex-wrap items-center gap-2">
                {aRecharger.map(a => (
                    <button key={a.index} type="button" className={bouton} data-recharger={a.index}
                        onClick={() => setDernier(recharger(a, nom, ecrire))}>
                        <RefreshCw size={10} /> Recharger {a.libelle} ({ecrireLesMunitions(lireLesMunitions(a.munitions, a.chargeur)!)})
                    </button>
                ))}
                {recuperable && (
                    <span className="flex items-center gap-1" data-recuperer-la-psi>
                        <input aria-label="Heures depuis la dernière utilisation" type="number" min={0} value={heures}
                            className="w-12 rounded border border-app-border/50 bg-app-bg px-1 py-0.5 text-center"
                            onChange={e => setHeures(entier(e.target.value))} /> h
                        <button type="button" className={bouton} onClick={recupererLaPsi}><Brain size={10} /> Récupérer la PSI ({psi}/{psiMax})</button>
                    </span>
                )}
                {incapacitants > 0 && (
                    <button type="button" className={bouton} onClick={seReposer} data-heure-de-repos>
                        <BedDouble size={10} /> Une heure de repos (+{incapacitants} END incapacitants)
                    </button>
                )}
                {inconscient && (
                    <button type="button" className={bouton} onClick={tenterLeReveil} data-test-de-reveil>
                        <Sun size={10} /> Test de réveil (2D {mdEnd + echecs >= 0 ? '+' : '−'} {Math.abs(mdEnd + echecs)}, 8+)
                    </button>
                )}
            </div>
            {dernier && <p data-ressource-traveller-faite className="text-app-muted">{dernier}</p>}
        </div>
    );
};
