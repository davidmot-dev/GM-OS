import React, { useState } from 'react';
import { useCombatStore } from '../useCombatStore';
import { ecrireLaFicheDuCombattant, valeursDuCombattant } from '../ficheDesCombattants';
import {
    etatDesBlessures, etatDuStress, graviteSubie, infligerUneBlessure, subirDuStress, type RegleDeStarTrek,
} from '../../dice/systemes/starTrekRegles';

const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';

/**
 * **La blessure d'une attaque de PNJ, portée sur la cible de la carte** (registre § 267, T5, 23/11/2026).
 * Après une attaque réussie ouverte par « Attaquer », la cible choisit (p. 290, 292) : **éviter** la
 * blessure en prenant autant de Stress que sa gravité — tant que sa jauge le permet —, ou **l'encaisser** :
 * un trait (« Brûlure »), sa gravité moins sa Protection, jamais sous 1, sauf arme Perforante ; elle est
 * alors vaincue. Les deux gestes écrivent sur la fiche de la cible par l'écrivain unique
 * (`ecrireLaFicheDuCombattant`), avec les fonctions de la carte « Stress et blessures » du jeu.
 *
 * Une cible PNJ suit d'autres règles (p. 291) : un PNJ mineur est vaincu d'office ; un notable ou un
 * majeur évite en dépensant autant de Menace que la gravité. On ne propose alors que l'encaissement.
 */
export const BlessureStarTrekSurLaCible: React.FC<{
    regle: RegleDeStarTrek;
    cibleId: string;
    gravite: number;
    letale: boolean;
    consigner: (titre: string, ligne: string) => void;
}> = ({ regle, cibleId, gravite, letale, consigner }) => {
    const porteur = useCombatStore(s => s.combatants.find(c => c.id === cibleId));
    const [nom, setNom] = useState(letale ? 'Brûlure' : 'Étourdi');
    const [perforant, setPerforant] = useState(false);
    const [fait, setFait] = useState<string | null>(null);
    if (!porteur) return <p data-blessure-sur-la-cible className="text-app-text/60">La cible n’est plus sur le plateau.</p>;
    const valeurs = valeursDuCombattant(porteur);
    const st = etatDuStress(regle, valeurs);
    const vaincu = etatDesBlessures(valeurs).vaincu;
    const protection = regle.protection ? Math.max(0, Number(valeurs[regle.protection]) || 0) : 0;
    const subie = graviteSubie(gravite, protection, perforant);
    const pj = porteur.isPlayer;
    const evitable = pj && !!regle.stress && st.max > 0 && !st.epuise && st.courant + gravite <= st.max;

    const eviter = () => {
        const r = subirDuStress(st.courant, st.max, gravite);
        ecrireLaFicheDuCombattant(porteur, { [regle.stress!.courant]: r.apres });
        const ligne = `${porteur.name} évite la blessure : Stress ${st.courant} → ${r.apres} / ${st.max}${r.epuise ? ' — épuisé : difficulté +1, un attribut bloqué (p. 278)' : ''}.`;
        setFait(ligne); consigner('Blessure évitée', ligne);
    };
    const encaisser = () => {
        const id = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        ecrireLaFicheDuCombattant(porteur, infligerUneBlessure(valeurs, { id: id(), nom: nom.trim() || 'Blessure', gravite: subie, letale }, id()));
        const ligne = `${porteur.name} : ${nom.trim() || 'Blessure'} ${subie}${protection && !perforant ? ` (Protection ${protection})` : ''}, ${letale ? 'létale' : 'étourdissante'} — blessé et vaincu.`;
        setFait(ligne); consigner('Blessure', ligne);
    };

    return (
        <div data-blessure-sur-la-cible={cibleId} className="flex flex-col gap-1 rounded-md border border-accent/40 p-2 text-xs">
            <span className="font-black uppercase tracking-widest text-ui-9 text-app-text/60">Sur {porteur.name}</span>
            {fait ? <p data-blessure-portee className="font-black text-etat-succes">{fait}</p> : <>
                <div className="flex flex-wrap items-center gap-2">
                    {regle.stress && pj && <span className="font-mono">Stress {st.courant} / {st.max}</span>}
                    {vaincu && <span className="font-black text-etat-alerte">déjà vaincu</span>}
                    <input aria-label="Nom de la blessure infligée" value={nom} onChange={e => setNom(e.target.value)} className={`w-28 ${champ}`} />
                    <label className="flex items-center gap-1"><input type="checkbox" checked={perforant} onChange={e => setPerforant(e.target.checked)} />Perforant</label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {pj && (
                        <button type="button" className={bouton} disabled={!evitable} onClick={eviter}
                            title={evitable ? undefined : 'Sa jauge de Stress ne peut pas prendre toute la gravité (p. 292).'}>
                            Éviter : +{gravite} Stress
                        </button>
                    )}
                    <button type="button" className={bouton} onClick={encaisser}>
                        Encaisser : {nom.trim() || 'Blessure'} {subie}{protection && !perforant ? ` (Protection ${protection})` : ''}
                    </button>
                </div>
                {!pj && (
                    <p className="text-app-text/60">
                        Un PNJ mineur est vaincu d’office ; un notable évite en dépensant {gravite} Menace, une fois par scène ; un majeur, sans limite (p. 291).
                    </p>
                )}
            </>}
        </div>
    );
};
