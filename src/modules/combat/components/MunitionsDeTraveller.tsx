import React, { useState } from 'react';
import { RefreshCw, Crosshair } from 'lucide-react';
import { ecrireLesMunitions, lireLesMunitions, munitionsConsommees, tirer, type ModeDeTir } from '../../dice/systemes/depensesDeTraveller';
import type { ArmeDeTraveller } from '../logic/attaqueDeTraveller';
import { champDesMunitions, MODES_DE_TIR, noterAuJournal, recharger } from '../logic/munitionsDeTraveller';

/**
 * **Les munitions d'une arme de Traveller** — TRV-A6, 27/11/2026 (spécification
 * `2026-11-27-traveller-depenses-et-durees.md`, C1, C2, C9 ; David : « Écrire « 26/30 » »).
 *
 * Sous un test d'attaque, réussi ou manqué — un coup parti est parti : « Munitions : 30/30 → 26/30
 * (rafale) » et **Décompter**. Un tir simple prend un coup, une rafale le niveau Auto, l'auto
 * complet trois fois le niveau Auto (p. 76). Chargeur vide : **Recharger** (une action mineure,
 * p. 74) remet la capacité. Rien ne s'écrit sans clic ; chaque geste a sa ligne au journal. Sans
 * capacité lisible — ni « 26/30 » ni nombre sur la fiche, ni chargeur au catalogue —, la ligne se tait.
 */
const bouton = 'flex items-center gap-1 rounded border border-app-border/60 px-2 py-0.5 hover:border-accent/50 hover:text-accent disabled:opacity-40';

export const MunitionsDeTraveller: React.FC<{
    arme: ArmeDeTraveller;
    /** La rafale cochée sur la carte des dégâts. */
    rafale: boolean;
    /** Le tireur, pour le journal. */
    nom: string;
    /** L'écrivain de la fiche du tireur ; sans lui, rien ne se propose. */
    ecrire?: (maj: Record<string, unknown>) => void;
}> = ({ arme, rafale, nom, ecrire }) => {
    const [choisi, setChoisi] = useState<ModeDeTir | null>(null);
    const [fait, setFait] = useState<string | null>(null);
    const champ = champDesMunitions(arme);
    const m = lireLesMunitions(arme.munitions, arme.chargeur);
    if (!ecrire || !champ || !m) return null;

    const auto = arme.traits.auto;
    const mode: ModeDeTir = choisi ?? (rafale && auto > 0 ? 'rafale' : 'simple');
    const coups = munitionsConsommees(mode, auto);
    const apres = tirer(m, coups);

    const decompter = () => {
        ecrire({ [champ]: ecrireLesMunitions(apres) });
        const texte = `${arme.libelle} : ${ecrireLesMunitions(m)} → ${ecrireLesMunitions(apres)} (${MODES_DE_TIR[mode]}, ${coups} coup${coups > 1 ? 's' : ''}, p. 76)`
            + (apres.manque ? ` — il manquait ${apres.manque} coup${apres.manque > 1 ? 's' : ''}` : '') + '.';
        noterAuJournal(`${nom} — munitions`, texte);
        setFait(texte);
    };

    return (
        <div data-munitions-traveller={champ} className="flex flex-wrap items-center gap-2 text-ui-11">
            <span className="font-black text-app-text">Munitions : {ecrireLesMunitions(m)}</span>
            {fait ? (
                <span data-munitions-decomptees className="font-black text-etat-succes">{fait}</span>
            ) : m.restants === 0 ? (
                <>
                    <span data-chargeur-vide className="text-etat-alerte">Chargeur vide : recharger (une action mineure, p. 74).</span>
                    <button type="button" className={bouton} onClick={() => setFait(recharger(arme, nom, ecrire))}><RefreshCw size={10} /> Recharger</button>
                </>
            ) : (
                <>
                    {auto > 0 && (
                        <select aria-label="Mode de tir" value={mode} onChange={e => setChoisi(e.target.value as ModeDeTir)}
                            className="rounded border border-app-border bg-app-bg px-1 py-0.5">
                            <option value="simple">Tir simple (1)</option>
                            <option value="rafale">Rafale ({auto})</option>
                            <option value="auto">Auto complet ({3 * auto})</option>
                        </select>
                    )}
                    <span className="text-app-muted">→ {ecrireLesMunitions(apres)}{apres.manque ? ` (il manque ${apres.manque} coup${apres.manque > 1 ? 's' : ''})` : ''}</span>
                    <button type="button" className={bouton} onClick={decompter} data-decompter-les-munitions>
                        <Crosshair size={10} /> Décompter {coups}
                    </button>
                </>
            )}
        </div>
    );
};
