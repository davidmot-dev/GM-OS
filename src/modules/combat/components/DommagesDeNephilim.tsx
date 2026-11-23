import React, { useState } from 'react';
import { useCombatStore } from '../useCombatStore';
import { ecrireLaFicheDuCombattant, valeursDuCombattant } from '../ficheDesCombattants';
import {
    ARMES_DE_NEPHILIM, CADENCES_DE_NEPHILIM, DEFENSES_DE_NEPHILIM, MUNITIONS_DE_NEPHILIM, bonusDeKaFeu, dommagesDeNephilim,
    type DefenseDeNephilim,
} from '../logic/dommagesDeNephilim';
import { casesOuvertes, optionsDEncaissement, type RegleDeNephilim } from '../../dice/systemes/nephilimRegles';

/**
 * **Les dommages d'une attaque de Nephilim, portés sur la cible** (registre § 267, T11, 23/11/2026).
 *
 * La fiche n'a ni armes ni protection : l'arme se choisit dans la table du livre (p. 132), la protection
 * de la cible se saisit (p. 133). La Défense de la cible (p. 129), le critique et la marge au-delà de 10
 * (p. 133) règlent les degrés reçus (`dommagesDeNephilim`). Puis **la cible choisit** comment elle les
 * absorbe — une case, ou des Conséquences et une case pour le reste (p. 136) : la carte propose les façons
 * permises sur sa fiche (`optionsDEncaissement`, la règle de sa carte de santé), et l'option retenue
 * s'écrit sur sa fiche par `ecrireLaFicheDuCombattant`. Une fois par jet.
 */
const champ = 'rounded border border-app-border bg-app-bg px-1 py-0.5';
const coche = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';
const nombre = (v: unknown) => (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0);

export const DommagesDeNephilim: React.FC<{
    cibleId: string;
    regle: RegleDeNephilim;
    /** La fiche de l'attaquant : son Ka-Feu donne le bonus de dommages (p. 103). */
    valeursDeLAttaquant: Record<string, unknown>;
    reussie: boolean;
    critique: boolean;
}> = ({ cibleId, regle, valeursDeLAttaquant, reussie, critique }) => {
    const porteur = useCombatStore(s => s.combatants.find(c => c.id === cibleId));
    const [arme, setArme] = useState(0);
    const [degre, setDegre] = useState(String(ARMES_DE_NEPHILIM[0].degre));
    const [munition, setMunition] = useState(0);
    const [cadence, setCadence] = useState(0);
    const [boutPortant, setBoutPortant] = useState(false);
    const [marge, setMarge] = useState('0');
    const [doubler, setDoubler] = useState(critique);
    const [protection, setProtection] = useState('0');
    const [defense, setDefense] = useState<DefenseDeNephilim>('aucune');
    const [nature, setNature] = useState<'physique' | 'magique'>('physique');
    const [fait, setFait] = useState<string | null>(null);
    if (!porteur) return <p data-dommages-nephilim className="text-app-muted">La cible n’est plus sur le plateau.</p>;
    if (!reussie) return <p data-dommages-nephilim data-coup-nul className="text-app-muted">L’attaque échoue : pas de dommages.</p>;

    const famille = ARMES_DE_NEPHILIM[arme]?.famille ?? 'melee';
    const kaFeu = regle.pentacle?.Feu ? nombre(valeursDeLAttaquant[regle.pentacle.Feu]) : 0;
    const bonus = bonusDeKaFeu(kaFeu);
    const coup = dommagesDeNephilim({
        degre: nombre(degre), famille, bonusDeKaFeu: bonus,
        munition: MUNITIONS_DE_NEPHILIM[munition]?.bonus, cadence: CADENCES_DE_NEPHILIM[cadence]?.bonus,
        boutPortant, marge: nombre(marge), critique: doubler, protection: nombre(protection), defense,
    });
    const valeurs = valeursDuCombattant(porteur);
    const piste = regle.sante?.[nature];
    const kaTerre = regle.kaTerre ? nombre(valeurs[regle.kaTerre]) : 0;
    const options = piste && coup.degres > 0 ? optionsDEncaissement(piste, valeurs, kaTerre, coup.degres) : [];
    const changer = <T,>(poser: (v: T) => void) => (v: T) => { poser(v); setFait(null); };

    const absorber = (cocher: string[], texte: string) => {
        if (!piste || fait) return;
        const maj: Record<string, boolean | number> = Object.fromEntries(cocher.map(c => [c, true]));
        if (piste.compte) maj[piste.compte] = casesOuvertes(piste, kaTerre).filter(c => coche(maj[c.champ] ?? valeurs[c.champ])).length;
        ecrireLaFicheDuCombattant(porteur, maj);
        setFait(`${coup.degres} degré${coup.degres > 1 ? 's' : ''} ${nature === 'magique' ? 'magiques' : 'physiques'} à ${porteur.name} : ${texte.toLowerCase()}.`);
    };

    return (
        <section data-dommages-nephilim className="mt-3 space-y-2 rounded-lg border border-accent/40 p-2 text-ui-11">
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1" title="La table des armes courantes (p. 132).">Arme
                    <select aria-label="Arme de Nephilim" className={champ} value={arme} onChange={e => {
                        const i = Number(e.target.value);
                        setArme(i); setDegre(String(ARMES_DE_NEPHILIM[i].degre)); setFait(null);
                    }}>
                        {ARMES_DE_NEPHILIM.map((a, i) => <option key={a.libelle} value={i}>{a.libelle} ({a.degre})</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-1">Degré
                    <input aria-label="Degré de l’arme" type="number" min={0} className={`w-14 ${champ}`} value={degre} onChange={e => changer(setDegre)(e.target.value)} />
                </label>
                {famille !== 'tir' && famille !== 'feu' && (
                    <span data-bonus-ka-feu className="text-app-muted" title="Une arme de mêlée ou de jet, ou sans arme (p. 103, 132).">Ka-Feu {kaFeu} : +{bonus}</span>
                )}
                {famille === 'feu' && (
                    <>
                        <label className="flex items-center gap-1">Munition
                            <select aria-label="Munition" className={champ} value={munition} onChange={e => changer(setMunition)(Number(e.target.value))}>
                                {MUNITIONS_DE_NEPHILIM.map((m, i) => <option key={m.libelle} value={i}>{m.libelle}{m.bonus ? ` (+${m.bonus})` : ''}</option>)}
                            </select>
                        </label>
                        <label className="flex items-center gap-1" title="Ajoutée après la protection, si des dommages passent (p. 133).">Cadence
                            <select aria-label="Cadence de tir" className={champ} value={cadence} onChange={e => changer(setCadence)(Number(e.target.value))}>
                                {CADENCES_DE_NEPHILIM.map((m, i) => <option key={m.libelle} value={i}>{m.libelle}{m.bonus ? ` (+${m.bonus})` : ''}</option>)}
                            </select>
                        </label>
                        <label className="flex items-center gap-1" title="p. 131">
                            <input type="checkbox" checked={boutPortant} onChange={e => changer(setBoutPortant)(e.target.checked)} /> Bout portant (+6)
                        </label>
                    </>
                )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1" title="La Défense de la cible et ce qu’elle change aux dommages reçus (p. 129). Une arme à projectile ne s’esquive pas (p. 130).">
                    Défense de {porteur.name}
                    <select aria-label="Défense de la cible" className={champ} value={defense} onChange={e => changer(setDefense)(e.target.value as DefenseDeNephilim)}>
                        {DEFENSES_DE_NEPHILIM.map(d => <option key={d.cle} value={d.cle}>{d.libelle}</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-1" title="Armure de cuir 1-2, gilet pare-balle 2-3, protection militaire 3-4 (p. 133).">Protection
                    <input aria-label="Protection de la cible" type="number" min={0} className={`w-14 ${champ}`} value={protection} onChange={e => changer(setProtection)(e.target.value)} />
                </label>
                <label className="flex items-center gap-1" title="Chaque degré de marge au-delà de 10 peut ajouter un degré de dommages (p. 133).">Marge au-delà de 10
                    <input aria-label="Marge au-delà de 10" type="number" min={0} className={`w-14 ${champ}`} value={marge} onChange={e => changer(setMarge)(e.target.value)} />
                </label>
                <label className="flex items-center gap-1">
                    <input type="checkbox" checked={doubler} onChange={e => changer(setDoubler)(e.target.checked)} /> Critique : dommages doublés
                </label>
                <label className="flex items-center gap-1">Dommages
                    <select aria-label="Nature des dommages" className={champ} value={nature} onChange={e => changer(setNature)(e.target.value as 'physique' | 'magique')}>
                        <option value="physique">physiques (Simulacre)</option>
                        <option value="magique">magiques (Pentacle)</option>
                    </select>
                </label>
            </div>
            <p data-calcul-nephilim className="text-app-muted">{coup.calcul}.</p>
            {fait ? (
                <p data-dommages-absorbes className="font-black text-etat-succes">{fait} Un nouveau jet rouvre le geste.</p>
            ) : coup.degres === 0 ? (
                <p data-coup-nul className="text-app-muted">Rien à absorber pour {porteur.name}.</p>
            ) : !piste ? (
                <p className="text-app-muted">La fiche de {porteur.name} n’a pas de santé {nature} : {coup.degres} degrés à porter à la main.</p>
            ) : options.length ? (
                <div className="flex flex-wrap items-center gap-2" data-options-de-la-cible>
                    <span className="text-app-muted">{porteur.name} choisit (p. 136) :</span>
                    {options.map(o => (
                        <button key={o.texte} type="button" onClick={() => absorber(o.cocher, o.texte)}
                            className="rounded border border-accent/60 px-2 py-0.5 font-bold text-accent hover:bg-accent/10">{o.texte}</button>
                    ))}
                </div>
            ) : (
                <p data-hors-de-combat className="font-bold text-etat-alerte">
                    {nature === 'magique'
                        ? `Rien n’absorbe ces dommages magiques : ${porteur.name} subit un degré de Chute (p. 138), à porter sur sa fiche.`
                        : `Rien n’absorbe ces dommages : ${porteur.name} est hors de combat, inconscient, à la merci de ses ennemis (p. 136-137).`}
                </p>
            )}
        </section>
    );
};
