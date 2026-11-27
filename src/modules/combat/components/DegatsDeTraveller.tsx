import React, { useState } from 'react';
import { Swords } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { valeursDuCombattant } from '../ficheDesCombattants';
import { protectionDeTraveller, type ArmeDeTraveller } from '../logic/attaqueDeTraveller';
import { MunitionsDeTraveller } from './MunitionsDeTraveller';
import { calculerLesDegats, decrireLesDegats, lancerLesDesDeLArme, lireLesDegats, type DetailDesDegats } from '../../dice/systemes/degatsDeTraveller';

/**
 * **Les dégâts d'une attaque de Traveller, portés sur la cible** — TRV-A2, 27/11/2026 (spécification
 * `2026-11-27-traveller-jets-demandes-et-degats.md`, C5, C7, C8, C9, C11).
 *
 * Après une attaque **réussie** : l'arme (et ses dés, modifiables), l'Effet du jet, le MD de FOR en
 * mêlée (p. 74), la rafale d'une arme Auto (p. 76), la protection de la cible — la meilleure de ses
 * armures, modifiable (décision de David du 27/11) — moins l'AP de l'arme, et le minimum d'un point
 * sur un Effet 6+ (p. 75). « Appliquer » passe par `applyDamage`, donc par la porte des dégâts du
 * § 278 : END, puis FOR ou DEX, MD recalculés ; une arme Incapacitante reste sur l'END (p. 76) ; un
 * animal perd ses PdV (p. 81). Une fois par jet.
 *
 * Sans `cibleId`, la carte propose de choisir la cible parmi les combattants (le test d'un Voyageur,
 * chez le meneur — C9).
 *
 * TRV-A6 (27/11/2026) : avec l'écrivain de la fiche du tireur, la ligne « Munitions » décompte le
 * tir — manqué aussi, un coup parti est parti (p. 76).
 */
export const DegatsDeTraveller: React.FC<{
    armes: readonly ArmeDeTraveller[];
    effet: number;
    reussie: boolean;
    /** Le MD de FOR de l'attaquant, ajouté en mêlée (p. 74) ; un animal n'en a pas. */
    mdDeForce?: number;
    cibleId?: string;
    /** L'attaquant, qu'on ne propose pas comme cible. */
    attaquantId?: string;
    /** Le Voyageur qui attaque, chez le meneur : son combattant ne se propose pas comme cible. */
    attaquantPersonnageId?: string;
    /** TRV-A6 : écrit sur la fiche du tireur (les munitions) ; sans lui, rien ne se décompte. */
    ecrireLAttaquant?: (maj: Record<string, unknown>) => void;
    /** TRV-A6 : le tireur, pour le journal. */
    nomDeLAttaquant?: string;
}> = ({ armes, effet, reussie, mdDeForce = 0, cibleId, attaquantId, attaquantPersonnageId, ecrireLAttaquant, nomDeLAttaquant }) => {
    const combattants = useCombatStore(s => s.combatants);
    const [cibleChoisie, setCibleChoisie] = useState(cibleId ?? '');
    const porteur = combattants.find(c => c.id === (cibleId ?? cibleChoisie));
    const [armeChoisie, setArmeChoisie] = useState(0);
    const arme = armes[armeChoisie];
    const [texte, setTexte] = useState(arme?.texteDesDegats ?? '');
    const [melee, setMelee] = useState(arme?.melee ?? false);
    const [rafale, setRafale] = useState(false);
    const [ap, setAp] = useState(arme?.traits.ap ?? 0);
    const lue = porteur ? protectionDeTraveller(valeursDuCombattant(porteur), porteur.roleplayingNotes) : null;
    const [protection, setProtection] = useState<number | null>(null);
    const [lances, setLances] = useState<number[] | null>(null);
    const [fait, setFait] = useState<string | null>(null);

    const munitions = arme && ecrireLAttaquant
        ? <MunitionsDeTraveller key={arme.index} arme={arme} rafale={rafale} nom={nomDeLAttaquant ?? 'Le tireur'} ecrire={ecrireLAttaquant} />
        : null;
    if (!reussie) {
        return (
            <div data-degats-traveller data-coup-nul className="space-y-1 text-ui-11 text-app-muted">
                <p>Attaque manquée : pas de dégâts.</p>
                {armes.length > 1 && (
                    <select aria-label="Arme de Traveller" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={armeChoisie}
                        onChange={e => setArmeChoisie(Number(e.target.value))}>
                        {armes.map((a, i) => <option key={`${a.index}-${a.libelle}`} value={i}>{a.libelle}</option>)}
                    </select>
                )}
                {munitions}
            </div>
        );
    }
    const candidates = combattants.filter(c => c.id !== attaquantId && (!attaquantPersonnageId || c.sourcePlayerId !== attaquantPersonnageId));
    if (!cibleId && candidates.length === 0) {
        return (
            <div data-degats-traveller data-sans-cible className="space-y-1 text-ui-11 text-app-muted">
                <p>Dégâts : aucun combattant dans Combat-OS à viser.</p>
                {munitions}
            </div>
        );
    }

    const degats = lireLesDegats(texte);
    const auto = arme?.traits.auto ?? 0;
    const protectionRetenue = protection ?? lue?.protection ?? 0;
    const detail: DetailDesDegats | null = degats && lances && lances.length === degats.des
        ? calculerLesDegats({
            degats, lances, effet, protection: protectionRetenue, ap,
            ...(melee ? { mdDeForceEnMelee: mdDeForce } : {}), ...(rafale && auto ? { rafale: auto } : {}),
        }) : null;
    const incapacitante = !!arme?.traits.incapacitante;

    const choisirLArme = (i: number) => {
        const a = armes[i];
        setArmeChoisie(i);
        if (a) { setTexte(a.texteDesDegats); setMelee(a.melee); setAp(a.traits.ap); }
        setRafale(false); setLances(null); setFait(null);
    };
    const lancer = () => {
        if (!degats) return;
        setLances(lancerLesDesDeLArme(degats, () => DiceEngine.roll(6)));
        setFait(null);
    };
    const appliquer = () => {
        if (!detail || !porteur || fait) return;
        if (detail.net > 0) useCombatStore.getState().applyDamage(detail.net, incapacitante ? 'Incapacitante' : 'Dégâts', [porteur.id]);
        setFait(`${detail.net} dégât${detail.net > 1 ? 's' : ''} à ${porteur.name}${incapacitante ? ', sur l’END seule (Incapacitante)' : ''}.`);
    };

    const champ = 'w-16 rounded border border-app-border bg-app-bg px-1 py-0.5 text-center';
    const bouton = 'flex items-center gap-1 rounded border border-app-border/60 px-2 py-0.5 hover:border-accent/50 hover:text-accent disabled:opacity-40';
    const rappels = [
        ...(arme?.traits.autres ?? []),
        ...(auto && !rafale ? [`Auto ${auto} : auto complet = ${auto} attaques (p. 76), à la main`] : []),
    ];
    return (
        <section data-degats-traveller={porteur?.id ?? ''} className="mt-3 space-y-2 rounded-lg border border-accent/40 p-2 text-ui-11">
            <p className="font-black uppercase tracking-widest text-app-text">Dégâts — Effet {effet >= 0 ? `+${effet}` : effet}</p>
            <div className="flex flex-wrap items-center gap-3">
                {!cibleId && (
                    <label className="flex items-center gap-1">Cible
                        <select aria-label="Cible des dégâts" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={cibleChoisie}
                            onChange={e => { setCibleChoisie(e.target.value); setProtection(null); setFait(null); }}>
                            <option value="">— choisir —</option>
                            {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </label>
                )}
                {armes.length > 0 && (
                    <label className="flex items-center gap-1">Arme
                        <select aria-label="Arme de Traveller" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={armeChoisie}
                            onChange={e => choisirLArme(Number(e.target.value))}>
                            {armes.map((a, i) => <option key={`${a.index}-${a.libelle}`} value={i}>{a.libelle} ({a.texteDesDegats})</option>)}
                        </select>
                    </label>
                )}
                <label className="flex items-center gap-1" title="« 3D », « 1D+2 », « 1DD » (destructrice : ×10, p. 75).">Dés
                    <input aria-label="Dés de dégâts" className={champ} value={texte} onChange={e => { setTexte(e.target.value); setLances(null); }} />
                </label>
                <label className="flex items-center gap-1" title="En mêlée, le MD de FOR s’ajoute en plus de l’Effet (p. 74).">
                    <input type="checkbox" aria-label="Mêlée" checked={melee} onChange={e => setMelee(e.target.checked)} /> Mêlée (FOR {mdDeForce >= 0 ? `+${mdDeForce}` : mdDeForce})
                </label>
                {auto > 0 && (
                    <label className="flex items-center gap-1" title="Rafale : + niveau Auto aux dégâts, autant de munitions consommées (p. 76).">
                        <input type="checkbox" aria-label="Rafale" checked={rafale} onChange={e => setRafale(e.target.checked)} /> Rafale (+{auto})
                    </label>
                )}
                <label className="flex items-center gap-1" title="Arme Perforante : ignore autant d’armure (p. 75).">AP
                    <input aria-label="AP de l’arme" type="number" min={0} className={champ} value={ap} onChange={e => setAp(Math.max(0, Math.trunc(Number(e.target.value)) || 0))} />
                </label>
                {porteur && (
                    <label className="flex items-center gap-1" title={`Lue : ${lue?.source ?? '—'}. La Reflec n’arrête que les lasers (p. 75).`}>Protection de {porteur.name}
                        <input aria-label="Protection de la cible" type="number" min={0} className={champ} value={protectionRetenue}
                            onChange={e => setProtection(Math.max(0, Math.trunc(Number(e.target.value)) || 0))} />
                    </label>
                )}
            </div>
            {munitions}
            {rappels.length > 0 && <p data-traits-rappeles className="text-app-muted">À régler à la main : {rappels.join(' ; ')}.</p>}
            <div className="flex flex-wrap items-center gap-3">
                <button type="button" className={bouton} onClick={lancer} disabled={!degats} data-lancer-les-degats-traveller>
                    <Swords size={11} /> Lancer {texte || 'les dés'}
                </button>
                {lances && <span className="text-app-muted">Dés : {lances.join(', ')}</span>}
            </div>
            {detail && degats && (
                <p data-calcul-traveller className="text-app-muted">
                    {decrireLesDegats(detail, degats)}
                    {rafale && auto ? ` — rafale : ${auto} munitions consommées` : ''}
                </p>
            )}
            {fait ? (
                <p data-coup-applique className="font-black text-etat-succes">{fait}</p>
            ) : detail && porteur && (
                <button type="button" onClick={appliquer} data-appliquer-traveller
                    className="flex items-center gap-1.5 rounded-lg border border-accent/60 px-3 py-1 font-black uppercase tracking-wider text-accent">
                    <Swords size={12} /> Appliquer {detail.net} à {porteur.name}
                </button>
            )}
        </section>
    );
};
