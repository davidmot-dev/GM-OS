import React, { useState } from 'react';
import { DiceEngine } from '../../../dice/DiceEngine';
import { choisirLaBranche, CLE_DEGENESIS, lireLEtatDegenesis, type RegleDesMaximaDeDegenesis } from '../../../dice/systemes/maximaDeDegenesis';
import {
    CHAKRAS, doseDEx, etatDeLaSporulation, exposition, inhaler, nouveauJour, SPORINATIONS, testerLeGerme, texteDeLaStimulation,
    type Chakra, type RegleDeLaContamination,
} from '../../../dice/systemes/contaminationDeDegenesis';
import { maximumDeLaJauge } from '../../../combat/logic/SanteDuCombattant';

/**
 * **La carte « Sporulation et Brûlure » de Degenesis** — DEG-A5, 04/11/2026, à la demande de
 * David (« on va finir DEG-A5 et DEG-A6 »), dessinée dans Stitch (`stitch/degenesis-brulure/`)
 * et validée le même jour. À côté du test, comme la carte « Maxima ».
 *
 * La jauge distingue les points permanents ; le test du Germe, l'exposition et l'EX se lancent
 * d'ici (choix de David) ; une Brûlure écrit l'Égo, la Sporulation et la stimulation en cours,
 * que le panneau de jet et le round proposent ensuite (p. 177, 186-190).
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const boutonPrincipal = 'px-3 py-1 rounded-md bg-accent text-app-on-accent text-ui-10 font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (v: unknown) => Math.max(0, Math.trunc(Number(v) || 0));
const CHAKRAS_ORDONNES = Object.keys(CHAKRAS) as Chakra[];

export const SporulationEtBrulureDegenesis: React.FC<{
    regle: RegleDeLaContamination;
    maxima?: RegleDesMaximaDeDegenesis;
    champTraumatismes?: string;
    valeurs: Record<string, unknown>;
    jauges: { fieldId: string; max?: string }[];
    libelleDuChamp: (c: string) => string;
    appliquer: (maj: Record<string, unknown>) => void;
    consigner: (ligne: string) => void;
    de?: () => number;
}> = ({ regle, maxima, champTraumatismes, valeurs, jauges, libelleDuChamp, appliquer, consigner, de = () => DiceEngine.roll(6) }) => {
    const etat = lireLEtatDegenesis(valeurs);
    const max = maximumDeLaJauge(regle.sporulations, jauges, valeurs) ?? 0;
    const sp = etatDeLaSporulation(entier(valeurs[regle.sporulations]), max, etat);
    const egoMax = regle.egoMax && valeurs[regle.egoMax] !== undefined && String(valeurs[regle.egoMax]).trim() !== '' ? entier(valeurs[regle.egoMax]) : null;
    const traumatismes = champTraumatismes ? entier(valeurs[champTraumatismes]) : 0;
    const stim = etat.stimulation;

    // Le test du Germe : PSY + la branche retenue de la Sporulation (Foi ou Volonté), sinon la paire remplie.
    const brancheDuGerme = maxima?.sporulations ? choisirLaBranche(maxima.sporulations.branches, valeurs, etat.brancheSporulations).retenue : undefined;
    const paireDuGerme = brancheDuGerme ? [brancheDuGerme.attribut, brancheDuGerme.competence] : regle.mental.find(p => entier(valeurs[p[1]]) > 0) ?? regle.mental[0];
    const germe = { paire: paireDuGerme, base: paireDuGerme.reduce((t, c) => t + entier(valeurs[c]), 0) };
    const gloire = stim?.chakra === 'gloire' ? stim.puissance : 0;
    const bion = stim?.chakra === 'bion' ? stim.puissance : 0;

    const [niveau, setNiveau] = useState<number>(SPORINATIONS[0].niveau);
    const [hermetique, setHermetique] = useState('0');
    const [chakra, setChakra] = useState<Chakra>('bion');
    const [intense, setIntense] = useState(false);

    const lancerLeGerme = () => {
        const r = testerLeGerme(sp, etat, germe.base, { traumatismes, succes: gloire }, de);
        if (!r) return;
        appliquer({ [CLE_DEGENESIS]: r.etat });
        consigner(r.texte);
    };
    const exposer = () => {
        const base = regle.resistance.reduce((t, c) => t + entier(valeurs[c]), 0);
        const r = exposition(niveau, base, { hermetique: entier(hermetique), bion, traumatismes }, de);
        if (r.gain) appliquer({ [regle.sporulations]: sp.subies + r.gain });
        consigner(r.texte);
    };
    const ex = () => {
        const r = doseDEx(sp, etat, de);
        appliquer({ ...(r.retires ? { [regle.sporulations]: sp.subies - r.retires } : {}), [CLE_DEGENESIS]: r.etat });
        consigner(r.texte);
    };
    const jour = () => { const r = nouveauJour(regle, valeurs, egoMax, CLE_DEGENESIS); appliquer(r.maj); consigner(r.texte); };
    const inhalerLeBourgeon = () => {
        const r = inhaler(regle, valeurs, chakra, intense, egoMax, de, CLE_DEGENESIS, libelleDuChamp);
        appliquer(r.maj);
        consigner(r.texte);
    };
    const terminer = () => {
        if (!stim) return;
        const { stimulation: _fin, ...reste } = etat;
        appliquer({ [CLE_DEGENESIS]: reste });
        consigner(`Fin de la stimulation : ${texteDeLaStimulation(stim, libelleDuChamp)} ; la Sporulation reste (p. 188).`);
    };

    const largeur = Math.max(sp.max, sp.subies, 1);
    return (
        <div data-sporulation-degenesis className="flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline gap-2">
                    <span className={etiquette}>Jauge</span>
                    <span className="font-black">Sporulation <span className="font-mono text-accent" data-sporulation-total>{sp.subies} / {sp.max}</span></span>
                    {sp.permanentes > 0 && <span className="italic text-app-text/60">(dont {sp.permanentes} permanente{sp.permanentes > 1 ? 's' : ''})</span>}
                </div>
                <div className="flex flex-wrap gap-1" data-seuils-sporulation>
                    {sp.mollusk && <span className="rounded border border-accent/50 px-1.5 text-ui-9 font-black uppercase tracking-widest text-accent">Mollusk</span>}
                    {sp.stigmates && <span className="rounded border border-accent/50 px-1.5 text-ui-9 font-black uppercase tracking-widest text-accent">Stigmates (50 %)</span>}
                    {sp.porteur && <span className="rounded border border-etat-danger/60 bg-etat-danger/10 px-1.5 text-ui-9 font-black uppercase tracking-widest text-etat-danger">Porteur du Germe</span>}
                    {sp.leperos && <span className="rounded border border-etat-danger bg-etat-danger/20 px-1.5 text-ui-9 font-black uppercase tracking-widest text-etat-danger">Léperos</span>}
                </div>
                <div className="relative h-2 rounded border border-accent/40 bg-app-bg" aria-hidden>
                    <div className="absolute inset-y-0 left-0 bg-accent/80" style={{ width: `${(sp.subies / largeur) * 100}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-app-text/80" style={{ width: `${(sp.permanentes / largeur) * 100}%` }} />
                    {sp.subies > sp.max && <div className="absolute inset-y-0 border-l-2 border-etat-danger" style={{ left: `${(sp.max / largeur) * 100}%` }} />}
                </div>
                <div className="flex justify-between text-ui-9 text-app-text/50">
                    <span>0</span><span>seuil max. : {sp.max}</span><span>actuel : {sp.subies}{sp.exces ? ' (sursaturation)' : ''}</span>
                </div>
            </div>

            {sp.aTester > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-app-border/40 px-2 py-1.5" data-test-du-germe>
                    <span><span className={etiquette}>Test du Germe :</span> {sp.aTester} test{sp.aTester > 1 ? 's' : ''}, difficulté {sp.exces} — {germe.paire.map(libelleDuChamp).join(' + ')} ({germe.base}D)
                        {gloire ? `, +${gloire} succès de Gloire` : ''}</span>
                    <button type="button" className={boutonPrincipal} onClick={lancerLeGerme}>Lancer</button>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2 rounded-md border border-app-border/40 px-2 py-1.5" data-exposition>
                <span className={etiquette}>Exposition :</span>
                <select aria-label="Niveau de sporination" className={champ} value={niveau} onChange={e => setNiveau(Number(e.target.value))}>
                    {SPORINATIONS.map(l => <option key={l.niveau} value={l.niveau}>{l.cause} ({l.niveau}) — {l.points}, {l.intervalle}</option>)}
                </select>
                <label className="flex items-center gap-1" title="Masques à gaz et protections « Hermétique » : des succès d'office (p. 187).">hermétique +
                    <input aria-label="Succès d’office de l’hermétique" type="number" min={0} className={`w-12 ${champ}`} value={hermetique} onChange={e => setHermetique(e.target.value)} />
                </label>
                <button type="button" className={boutonPrincipal} onClick={exposer}>Test PHY + Résistance{bion ? ` (+${bion} Bion)` : ''}</button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2">Dose d’EX : <strong className="text-accent">−1D</strong>
                    <button type="button" className={bouton} disabled={!!etat.exDuJour || sp.subies <= sp.permanentes} onClick={ex}
                        title={etat.exDuJour ? 'Déjà une dose aujourd’hui : une seconde n’a aucun effet (p. 177).' : 'Réduit la Sporulation de 1D ; les points permanents restent (p. 177, 186).'}>
                        Prendre l’EX
                    </button>
                </span>
                <button type="button" className={bouton} onClick={jour}>Nouveau jour (+1 Égo)</button>
            </div>

            <div className="flex flex-col gap-2 border-t border-app-border/30 pt-2" data-brulure>
                <span className={etiquette}>Brûlure</span>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1">Chakra :
                        <select aria-label="Chakra de la Brûlure" className={champ} value={chakra} onChange={e => setChakra(e.target.value as Chakra)}>
                            {CHAKRAS_ORDONNES.map(c => <option key={c} value={c}>{CHAKRAS[c].libelle}</option>)}
                        </select>
                    </label>
                    {chakra !== 'discordia' && (<>
                        <label className="flex items-center gap-1"><input type="radio" name="intensite-brulure" checked={!intense} onChange={() => setIntense(false)} /> légère (1)</label>
                        <label className="flex items-center gap-1"><input type="radio" name="intensite-brulure" checked={intense} onChange={() => setIntense(true)} /> intense (1D)</label>
                    </>)}
                    <button type="button" className={`${boutonPrincipal} ml-auto`} onClick={inhalerLeBourgeon}>Inhaler</button>
                </div>
                <p className="italic text-app-text/60">{CHAKRAS[chakra].chakra !== 'aucun' ? `${CHAKRAS[chakra].chakra} : ` : ''}{CHAKRAS[chakra].regle}.</p>
                {stim && (
                    <div className="flex flex-col gap-1 rounded-md border border-accent/50 bg-accent/10 px-2 py-1.5" data-stimulation-en-cours>
                        <span><span className={etiquette}>Stimulation en cours :</span> {texteDeLaStimulation(stim, libelleDuChamp)}</span>
                        <div><button type="button" className={bouton} onClick={terminer}>Terminer</button></div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * **Au panneau de jet : la stimulation en cours et un Potentiel** — DEG-A5, 04/11/2026. Le bonus
 * du Chakra se propose, coché d'office, quand le jet correspond (choix de David) ; un Potentiel
 * se choisit explicitement, avec les dés que le meneur lui accorde — son texte ne s'interprète
 * pas (critère de la synthèse).
 */
export const StimulationEtPotentielAuJet: React.FC<{
    bonus: { des: number; succes: number; texte: string } | null;
    prise: boolean;
    setPrise: (oui: boolean) => void;
    potentiels: { cle: string; libelle: string }[];
    potentiel: { cle: string; des: number };
    setPotentiel: (p: { cle: string; des: number }) => void;
}> = ({ bonus, prise, setPrise, potentiels, potentiel, setPotentiel }) => {
    if (!bonus && !potentiels.length) return null;
    return (
        <div data-brulure-au-jet className="flex flex-wrap items-center gap-3 text-xs">
            {bonus && (
                <label className="flex items-center gap-1" data-bonus-de-stimulation title="La stimulation de la dernière Brûlure (p. 188-190).">
                    <input type="checkbox" checked={prise} onChange={e => setPrise(e.target.checked)} />
                    Stimulation — {bonus.texte}
                </label>
            )}
            {potentiels.length > 0 && (
                <span className="flex items-center gap-1" title="Un Potentiel choisi explicitement ; ses dés sont ceux que le meneur accorde (p. 39, 96).">
                    <select aria-label="Potentiel utilisé" className={champ} value={potentiel.cle} onChange={e => setPotentiel({ cle: e.target.value, des: e.target.value ? potentiel.des : 0 })}>
                        <option value="">— aucun Potentiel —</option>
                        {potentiels.map(p => <option key={p.cle} value={p.cle}>{p.libelle}</option>)}
                    </select>
                    {potentiel.cle && (
                        <label className="flex items-center gap-1">dés
                            <input aria-label="Dés du Potentiel" type="number" className={`w-12 ${champ}`} value={potentiel.des}
                                onChange={e => setPotentiel({ ...potentiel, des: Math.trunc(Number(e.target.value) || 0) })} />
                        </label>
                    )}
                </span>
            )}
        </div>
    );
};
