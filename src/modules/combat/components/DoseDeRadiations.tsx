import React, { useState } from 'react';
import { Radiation } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { ecrireLaFicheDuCombattant } from '../ficheDesCombattants';
import { decrireLaDose, exposer } from '../../dice/systemes/radiationsDeTraveller';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';

type RegleDesRadiations = NonNullable<GameDriver['combat']['radiationsTraveller']>;

/**
 * **La dose de Rads d'un Voyageur, et l'Exposition** — TRV-A5, 27/11/2026 (C8, C9 ; David : « Dose +
 * geste Exposition »). À la place de la jauge « Rads / 10 » : une dose cumulée, sans plafond, sa
 * conséquence cumulée et le prochain seuil (p. 78).
 *
 * « Exposition » ajoute une dose (une arme à rayonnement : 2D × 20 ; une fuite, une éruption : la
 * table p. 78), dit ses conséquences immédiates — les dés de dégâts se lancent et s'appliquent par la
 * porte des blessures — et, quand un seuil cumulé est franchi, propose de retirer l'END permanente :
 * l'END et la « END sans blessure » baissent ensemble, par l'écrivain de la fiche, qui réaligne MD et
 * total physique. Rien ne s'écrit sans un clic du meneur.
 */
export const DoseDeRadiations: React.FC<{
    combattant: Combatant;
    regle: RegleDesRadiations;
    valeurs: Record<string, unknown>;
}> = ({ combattant, regle, valeurs }) => {
    const total = Math.max(0, Math.trunc(Number(valeurs[regle.champ]) || 0));
    const [dose, setDose] = useState(0);
    const [exposition, setExposition] = useState<ReturnType<typeof exposer> | null>(null);
    const [degats, setDegats] = useState<{ des: number[]; fait: boolean } | null>(null);
    const [endRetiree, setEndRetiree] = useState(false);

    const exposerMaintenant = () => {
        if (dose <= 0) return;
        const r = exposer(total, dose);
        ecrireLaFicheDuCombattant(combattant, { [regle.champ]: r.total });
        setExposition(r); setDegats(null); setEndRetiree(false); setDose(0);
    };
    const lancerLesDegats = () => {
        if (!exposition?.immediate) return;
        const des = Array.from({ length: exposition.immediate.des }, () => DiceEngine.roll(6));
        const somme = des.reduce((t, v) => t + v, 0);
        useCombatStore.getState().applyDamage(somme, 'Rayonnement', [combattant.id]);
        setDegats({ des, fait: true });
    };
    const retirerLEnd = () => {
        if (!exposition?.endPermanente) return;
        const n = exposition.endPermanente;
        const end = Math.trunc(Number(valeurs[regle.endurance]) || 0);
        const max = Math.trunc(Number(valeurs[regle.maximum]) || 0);
        ecrireLaFicheDuCombattant(combattant, { [regle.endurance]: Math.max(0, end - n), [regle.maximum]: Math.max(0, max - n) });
        setEndRetiree(true);
    };

    const bouton = 'rounded border border-app-border/50 px-2 py-0.5 text-ui-10 hover:border-accent/50 hover:text-accent disabled:opacity-40';
    return (
        <div data-dose-de-radiations={combattant.id} className="flex flex-1 flex-col gap-1 text-ui-10">
            <span className="stitch-label text-app-text/70">Rads</span>
            <span data-dose-rads className="font-black text-app-text">{decrireLaDose(total)}</span>
            <details>
                <summary className="cursor-pointer text-app-muted">Exposition</summary>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <input aria-label="Dose reçue (rads)" type="number" min={0} value={dose}
                        className="w-16 rounded border border-app-border/50 bg-app-bg px-1 py-0.5 text-center"
                        onChange={e => setDose(Math.max(0, Math.trunc(Number(e.target.value)) || 0))} />
                    <button type="button" className={bouton} onClick={exposerMaintenant} disabled={dose <= 0}>
                        <Radiation size={10} className="inline" /> Exposer
                    </button>
                </div>
                {exposition && (
                    <div data-exposition className="mt-1 space-y-1">
                        <p>{exposition.total} rads cumulés.{exposition.immediate ? ` Tout de suite : ${exposition.immediate.texte}.` : ' Pas de conséquence immédiate (50 rads ou moins).'}</p>
                        {exposition.immediate && (degats
                            ? <p data-degats-des-radiations className="font-black text-etat-succes">{degats.des.join(' + ')} = {degats.des.reduce((t, v) => t + v, 0)} dégâts appliqués.</p>
                            : <button type="button" className={bouton} onClick={lancerLesDegats}>Lancer {exposition.immediate.des}D et appliquer</button>)}
                        {exposition.endPermanente > 0 && (endRetiree
                            ? <p data-end-permanente-retiree className="font-black text-etat-alerte">−{exposition.endPermanente} END permanent retiré.</p>
                            : <button type="button" className={bouton} onClick={retirerLEnd}>Retirer {exposition.endPermanente} END permanent (seuil franchi)</button>)}
                    </div>
                )}
            </details>
        </div>
    );
};
