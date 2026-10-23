import React, { useState } from 'react';
import { DiceEngine } from '../../../dice/DiceEngine';
import type { DegreDeReussite } from '../../../dice/degresDeReussite';
import {
    FORMES_DU_KHAIBA, NOMS_DES_CHUTES, casesOuvertes, coutDeLExperience, degreDuKaDominant, degresVisibles, dureeDeGuerison, etatDesChutes, issueDuPacte,
    miseEnJeuPossible, opposer, optionsDEncaissement, testDeStase,
    type ChoixDeNephilim, type JetDeNephilim, type NomDeChute, type PisteDeSante, type RegleDeNephilim,
} from '../../../dice/systemes/nephilimRegles';

/**
 * **Nephilim Légende, jusqu'au bout** — 23/10/2026, à la demande de David (N1 à N9).
 *
 * Ce que le panneau de jet propose en plus pour Nephilim : les options du jet
 * (action physique, métamorphe, Impressionner, Effet Mnémos en tant que Vécu,
 * Sacrifice), ses suites (Traque, pacte de Kabbale, retenter un sort, soigner
 * une Chute) et les cartes de la fiche (santé, Chutes, stase, expérience).
 * Rien ne s'écrit sans un clic, comme les suites des critiques du 18/10.
 */
type Valeurs = Record<string, unknown>;
type Ecrire = (maj: Record<string, unknown>) => void;
type Consigner = (titre: string, ligne: string) => void;
type Sections = readonly { id: string; label?: string; fields: readonly { id: string; label?: string; type?: string }[] }[];

const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const coche = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';
const nomDuChamp = (sections: Sections, id: string) => sections.flatMap(s => s.fields).find(f => f.id === id)?.label ?? id;

// ——— Préparer ———

export const PreparationNephilim: React.FC<{
    jet?: JetDeNephilim;
    choix: ChoixDeNephilim;
    changer: (c: Partial<ChoixDeNephilim>) => void;
}> = ({ jet, choix, changer }) => {
    if (!jet) return null;
    const nombre = (cle: 'metamorphe' | 'mnemosVecu', max: number) => (
        <input type="number" min={0} max={max} value={choix[cle] ?? 0} aria-label={cle === 'metamorphe' ? 'Degrés de métamorphe exprimés' : 'Effet Mnémos en tant que Vécu (PS)'}
            onChange={e => changer({ [cle]: Math.min(max, Math.max(0, Math.trunc(Number(e.target.value) || 0))) })}
            className="w-14 rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs" />
    );
    return (
        <div data-preparation-nephilim className="flex flex-col gap-2 text-xs">
            {jet.malus.physique > 0 && !jet.actionMagique && (
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!choix.actionPhysique} onChange={e => changer({ actionPhysique: e.target.checked })} />
                    Action physique : Conséquences physiques −{jet.malus.physique} au Vécu (p. 137)
                </label>
            )}
            {jet.metamorphe && jet.metamorphe.possible > 0 && (
                <label className="flex items-center gap-2">
                    <span className={etiquette}>Métamorphe</span>
                    Exprimer {nombre('metamorphe', jet.metamorphe.possible)} degré(s) sur l’approche du Ka dominant, +1 par degré (p. 112)
                </label>
            )}
            <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!choix.impressionner} onChange={e => changer({ impressionner: e.target.checked })} />
                Impressionner : +2 à une action sociale, un jeton de Traque (p. 113)
            </label>
            {jet.mnemos?.possible && (
                <label className="flex items-center gap-2">
                    <span className={etiquette}>Effet Mnémos</span>
                    En tant que Vécu : {nombre('mnemosVecu', jet.mnemos.max)} degré(s), 1 PS chacun, quand aucun Vécu ne s’applique (p. 119)
                </label>
            )}
            {jet.sacrifice && (
                <label className="flex items-center gap-2" title={jet.sacrifice.raison}>
                    <input type="checkbox" checked={!!choix.sacrifice} disabled={!jet.sacrifice.possible} onChange={e => changer({ sacrifice: e.target.checked })} />
                    Sacrifice : 5 PS, le rituel de sortilège réussit d’office (p. 183){jet.sacrifice.raison ? ` — ${jet.sacrifice.raison}` : ''}
                </label>
            )}
            {jet.rk && (
                <p data-seuil-rk className={jet.rk.depasse ? 'text-etat-alerte' : 'text-app-text/60'}>
                    Pour le Seuil RK : {jet.rk.valeur} ({jet.rk.detail}){jet.rk.seuil !== undefined ? ` contre ${jet.rk.seuil}` : ''}
                    {jet.art ? ' — tout effet occulte ajoute un jeton par scène (errata p. 174).' : jet.rk.depasse ? ' — dépassé : un jeton de Traque.' : '.'}
                </p>
            )}
        </div>
    );
};

// ——— Les suites du lancer ———

export const SuitesNephilim: React.FC<{
    regle: RegleDeNephilim;
    jet?: JetDeNephilim;
    degre?: DegreDeReussite;
    /** Les degrés du jet lancé : (Art + Ka …), pour le pacte. */
    degres: number;
    valeurs: Valeurs;
    sections: Sections;
    ecrire: Ecrire;
    consigner: Consigner;
    ajouterUnJetonDeTraque?: () => void;
    /** Relancer le même jet, après avoir payé (1 PS ou 1 degré de stase, p. 183). */
    relancer?: () => void;
    /** Le PS du critique est-il déjà noté sur la fiche ? Le dépenser pour soigner le retire. */
    sapienceDuCritique?: { notee: boolean; depenser: () => void };
}> = ({ regle, jet, degre, degres, valeurs, sections, ecrire, consigner, ajouterUnJetonDeTraque, relancer, sapienceDuCritique }) => {
    const [jeton, setJeton] = useState(false);
    const [visible, setVisible] = useState(false);
    const [soin, setSoin] = useState<string | null>(null);
    const [paye, setPaye] = useState(false);
    if (!jet || !degre) return null;
    const reussi = degre.startsWith('reussite');
    const critique = degre === 'reussite-particuliere', maladresse = degre === 'echec-total';
    const sapience = regle.sapience ? n(valeurs[regle.sapience]) : 0, stase = regle.stase ? n(valeurs[regle.stase]) : 0;
    const chutes = regle.chutes ? (['khaiba', 'ombre', 'narcose'] as const).filter(c => n(valeurs[regle.chutes![c]]) > 0) : [];
    // Le jeton d'Impressionner est payé au lancer ; ici, ceux de la scène.
    const traque = !!jet.art || !!jet.rk?.depasse;
    return (
        <div data-suites-nephilim className="flex flex-col gap-2 text-xs">
            {traque && ajouterUnJetonDeTraque && (
                <div className="flex flex-wrap items-center gap-2">
                    <span>{jet.art ? 'Effet occulte : un jeton de Traque pour la scène (errata p. 174).' : `Seuil RK dépassé (${jet.rk?.valeur} contre ${jet.rk?.seuil}) : un jeton de Traque (p. 145).`}</span>
                    <button type="button" className={bouton} disabled={jeton} onClick={() => { ajouterUnJetonDeTraque(); setJeton(true); }}>
                        {jeton ? 'Jeton ajouté' : 'Ajouter un jeton à la Traque'}
                    </button>
                </div>
            )}
            {maladresse && (jet.metamorphe?.exprimes ?? 0) > 0 && (regle.metamorphe?.visibles || regle.metamorphe?.permanentes?.length) && (
                <div className="flex flex-wrap items-center gap-2">
                    <span>Maladresse en exprimant le métamorphe : un degré devient visible pour toujours (p. 112).</span>
                    <button type="button" className={bouton} disabled={visible} onClick={() => {
                        const m = regle.metamorphe!, avant = degresVisibles(regle, valeurs);
                        // La première métamorphose nommée et pas encore permanente ; sinon la première libre.
                        const libres = (m.permanentes ?? []).filter(c => !coche(valeurs[c]));
                        const nommee = libres.find(c => String(valeurs[c.replace(/_permanent$/, '_name')] ?? '').trim());
                        const cible = nommee ?? libres[0];
                        if (cible) ecrire({ [cible]: true });
                        else if (m.visibles) ecrire({ [m.visibles]: n(valeurs[m.visibles]) + 1 });
                        else return;
                        consigner('Métamorphe', `Degrés visibles en permanence : ${avant} → ${avant + 1}`);
                        setVisible(true);
                    }}>{visible ? 'Noté' : 'Noter +1 degré visible'}</button>
                </div>
            )}
            {jet.art === 'magie' && !reussi && !maladresse && !jet.sacrifice?.retenu && relancer && (
                <div className="flex flex-wrap items-center gap-2">
                    <span>Sort raté : le retenter au round suivant coûte 1 PS ou 1 degré de stase ; sans cela, attendre la fin de la situation (p. 183). Pas depuis un focus.</span>
                    <button type="button" className={bouton} disabled={paye || sapience < 1 || !regle.sapience} onClick={() => {
                        ecrire({ [regle.sapience!]: sapience - 1 }); consigner('Retenter le sort', `Points de Sapience ${sapience} → ${sapience - 1}`); setPaye(true); relancer();
                    }}>Retenter (1 PS)</button>
                    <button type="button" className={bouton} disabled={paye || stase < 1 || !regle.stase} onClick={() => {
                        ecrire({ [regle.stase!]: stase - 1 }); consigner('Retenter le sort', `Stase ${stase} → ${stase - 1}`); setPaye(true); relancer();
                    }}>Retenter (1 degré de stase)</button>
                </div>
            )}
            {critique && jet.art && chutes.length > 0 && sapienceDuCritique && (
                <div className="flex flex-wrap items-center gap-2">
                    <span>Le Point de Sapience du critique peut soigner aussitôt un degré de Chute (p. 149) :</span>
                    {soin ? <strong>{soin}</strong> : chutes.map(c => (
                        <button key={c} type="button" className={bouton} onClick={() => {
                            const champ = regle.chutes![c], avant = n(valeurs[champ]);
                            ecrire({ [champ]: avant - 1 });
                            sapienceDuCritique.depenser();
                            const ligne = `${NOMS_DES_CHUTES[c]} ${avant} → ${avant - 1} (le Point de Sapience du critique)`;
                            consigner('Soigner une Chute', ligne); setSoin(ligne);
                        }}>{NOMS_DES_CHUTES[c]} −1</button>
                    ))}
                </div>
            )}
            {jet.art === 'kabbale' && reussi && regle.pacte && (
                <Pacte regle={regle} degres={degres} valeurs={valeurs} sections={sections} consigner={consigner} />
            )}
        </div>
    );
};

/** Nouer un pacte (p. 198 ; errata) : Art de la Sephirah + Ka (+ ordonnances) contre le degré de l'invocation. */
const Pacte: React.FC<{ regle: RegleDeNephilim; degres: number; valeurs: Valeurs; sections: Sections; consigner: Consigner }> = ({ regle, degres, valeurs, sections, consigner }) => {
    let motif: RegExp | null = null;
    try { motif = new RegExp(regle.pacte!.motif); } catch { motif = null; }
    const invocations = motif ? sections.flatMap(s => s.fields).filter(f => motif!.test(f.id))
        .map(f => ({ champ: f.id, degre: n(valeurs[f.id]), nom: String(valeurs[f.id.replace(/_degree$/, '_name')] ?? '').trim() || (f.label ?? f.id) }))
        .filter(i => i.degre > 0) : [];
    const [choisie, setChoisie] = useState(invocations[0]?.champ ?? '');
    const [ordonnances, setOrdonnances] = useState(regle.pacte?.ordonnances ? n(valeurs[regle.pacte.ordonnances]) : 0);
    const [issue, setIssue] = useState<string | null>(null);
    const invocation = invocations.find(i => i.champ === choisie);
    if (!invocations.length) return <p className="text-app-text/60">Pacte : aucune invocation avec un degré sur la fiche.</p>;
    const nouer = () => {
        if (!invocation) return;
        const r = opposer({ degres: degres + ordonnances, tirage: DiceEngine.roll(100) }, { degres: invocation.degre, tirage: DiceEngine.roll(100) });
        const i = issueDuPacte(r, invocation.degre);
        const ligne = `${invocation.nom} (degré ${invocation.degre}) : ${(degres + ordonnances) * 10} % contre ${invocation.degre * 10} % — ${i.texte}`;
        setIssue(ligne);
        consigner('Pacte de Kabbale', ligne);
    };
    return (
        <div data-pacte-de-kabbale className="flex flex-col gap-1 rounded-md border border-app-border/30 p-2">
            <span className={etiquette}>Nouer le pacte (p. 198)</span>
            <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Invocation du pacte" value={choisie} onChange={e => { setChoisie(e.target.value); setIssue(null); }}
                    className="rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5">
                    {invocations.map(i => <option key={i.champ} value={i.champ}>{i.nom} ({i.degre})</option>)}
                </select>
                <label className="flex items-center gap-1">Ordonnances
                    <input type="number" min={0} value={ordonnances} aria-label="Ordonnances respectées"
                        onChange={e => setOrdonnances(Math.max(0, Math.trunc(Number(e.target.value) || 0)))}
                        className="w-12 rounded-md border border-app-border/40 bg-app-bg px-1 py-0.5 font-mono" />
                </label>
                <button type="button" className={bouton} onClick={nouer}>Nouer le pacte</button>
            </div>
            {issue && <p data-issue-du-pacte>{issue}</p>}
        </div>
    );
};

// ——— La santé (p. 135-139) ———

export const SanteNephilim: React.FC<{ regle: RegleDeNephilim; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner }> = ({ regle, valeurs, ecrire, consigner }) => {
    const kaTerre = regle.kaTerre ? n(valeurs[regle.kaTerre]) : 0;
    const pistes = ([['physique', regle.sante?.physique], ['magique', regle.sante?.magique]] as const).filter(([, p]) => !!p) as ['physique' | 'magique', PisteDeSante][];
    return (
        <section data-sante-nephilim className="flex flex-col gap-3 text-xs">
            {pistes.map(([nom, piste]) => <Piste key={nom} nom={nom} piste={piste} regle={regle} kaTerre={kaTerre} valeurs={valeurs} ecrire={ecrire} consigner={consigner} />)}
            <p className="text-app-text/60">Pour chaque coup, une seule case, ou des Conséquences et une case pour le reste. Un critique double les dommages ; la protection les réduit (une arme de 2 et plus inflige toujours 1, p. 136).</p>
        </section>
    );
};

const Piste: React.FC<{ nom: 'physique' | 'magique'; piste: PisteDeSante; regle: RegleDeNephilim; kaTerre: number; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner }> = ({ nom, piste, regle, kaTerre, valeurs, ecrire, consigner }) => {
    const [degres, setDegres] = useState(0);
    const [propose, setPropose] = useState(false);
    const ouvertes = casesOuvertes(piste, kaTerre);
    const compte = (v: Valeurs) => ouvertes.filter(c => coche(v[c.champ])).length;
    const avecCompte = (maj: Record<string, unknown>) => (piste.compte ? { ...maj, [piste.compte]: compte({ ...valeurs, ...maj }) } : maj);
    const options = propose ? optionsDEncaissement(piste, valeurs, kaTerre, degres) : [];
    const magique = nom === 'magique';
    const stase = regle.stase ? n(valeurs[regle.stase]) : 0;
    const gravite = (i: number) => (['mineure', 'serieuse', 'grave'] as const)[Math.min(2, i)];
    return (
        <div data-piste={nom} className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
                <span className={`${etiquette} w-20`}>{magique ? 'Magique' : 'Physique'}</span>
                {piste.cases.map(c => {
                    const ouverte = (c.kaTerre ?? 0) <= kaTerre;
                    return (
                        <label key={c.champ} className={`flex items-center gap-1 ${ouverte ? '' : 'opacity-30'}`} title={c.kaTerre ? `Ka-Terre ${c.kaTerre} et plus` : undefined}>
                            <input type="checkbox" disabled={!ouverte} checked={coche(valeurs[c.champ])} aria-label={`Case de ${c.valeur} (${nom})`}
                                onChange={e => ecrire(avecCompte({ [c.champ]: e.target.checked }))} />{c.valeur}
                        </label>
                    );
                })}
                <span className="text-app-text/30">|</span>
                {piste.consequences.map((c, i) => (
                    <label key={c.champ} className="flex items-center gap-1">
                        <input type="checkbox" checked={coche(valeurs[c.champ])} aria-label={`Conséquence ${c.label.toLowerCase()} (${nom})`}
                            onChange={e => ecrire({ [c.champ]: e.target.checked })} />{c.label} −{c.absorbe}
                        {coche(valeurs[c.champ]) && <span className="text-app-text/50">({dureeDeGuerison(kaTerre, gravite(i), magique)})</span>}
                        {magique && coche(valeurs[c.champ]) && regle.stase && (
                            <button type="button" className={bouton} disabled={stase < c.absorbe} title="Un rituel d’autant d’heures que le niveau ; la stase baisse d’autant (p. 139)"
                                onClick={() => { ecrire({ [c.champ]: false, [regle.stase!]: stase - c.absorbe }); consigner('Transfert à la stase', `${c.label} magique transférée : stase ${stase} → ${stase - c.absorbe}`); }}>
                                À la stase
                            </button>
                        )}
                    </label>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">Encaisser
                    <input type="number" min={0} value={degres} aria-label={`Dommages ${nom} reçus`}
                        onChange={e => { setDegres(Math.max(0, Math.trunc(Number(e.target.value) || 0))); setPropose(false); }}
                        className="w-14 rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono" /> degrés
                </label>
                <button type="button" className={bouton} disabled={degres <= 0} onClick={() => setPropose(true)}>Proposer</button>
                <button type="button" className={bouton} title={magique ? 'Cinq minutes sans user du Pentacle (p. 139)' : 'Cinq minutes de repos, hors de toute situation de stress (p. 138)'}
                    onClick={() => { ecrire(avecCompte(Object.fromEntries(piste.cases.map(c => [c.champ, false])))); consigner('Repos', `Cases de dommages ${nom}s décochées`); }}>
                    Cinq minutes de repos
                </button>
            </div>
            {propose && (options.length ? (
                <div className="flex flex-wrap items-center gap-2" data-options-d-encaissement>
                    {options.map(o => (
                        <button key={o.texte} type="button" className={bouton} onClick={() => {
                            ecrire(avecCompte(Object.fromEntries(o.cocher.map(c => [c, true]))));
                            consigner(`Dommages ${nom}s`, `${degres} degré${degres > 1 ? 's' : ''} : ${o.texte.toLowerCase()}`);
                            setPropose(false); setDegres(0);
                        }}>{o.texte}</button>
                    ))}
                </div>
            ) : magique && regle.chutes ? (
                <div className="flex flex-wrap items-center gap-2 text-etat-alerte" data-options-d-encaissement>
                    Rien n’absorbe ces dommages magiques : un degré de Chute, principale ou secondaire (p. 138).
                    {(['khaiba', 'ombre', 'narcose'] as const).map(c => (
                        <button key={c} type="button" className={bouton} onClick={() => {
                            const champ = regle.chutes![c], avant = n(valeurs[champ]);
                            ecrire({ [champ]: avant + 1 }); consigner('Dommages magiques', `${degres} degrés non absorbés : ${NOMS_DES_CHUTES[c]} ${avant} → ${avant + 1}`);
                            setPropose(false); setDegres(0);
                        }}>{NOMS_DES_CHUTES[c]} +1</button>
                    ))}
                </div>
            ) : (
                <p className="text-etat-alerte" data-options-d-encaissement>Rien n’absorbe ces dommages : hors de combat, inconscient, à la merci de l’adversaire. Sans intervention, le Simulacre meurt en autant de rounds que son Ka-Terre si on veut l’achever (p. 137-138).</p>
            ))}
        </div>
    );
};

// ——— Les Chutes (p. 148-152) ———

export const ChutesNephilim: React.FC<{ regle: RegleDeNephilim; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner; meneur: boolean }> = ({ regle, valeurs, ecrire, consigner, meneur }) => {
    const c = regle.chutes;
    if (!c) return null;
    const etat = etatDesChutes(regle, valeurs);
    const changer = (nom: NomDeChute, d: number) => {
        const champ = c[nom], avant = n(valeurs[champ]), apres = Math.min(10, Math.max(0, avant + d));
        if (apres !== avant) { ecrire({ [champ]: apres }); consigner('Chutes', `${NOMS_DES_CHUTES[nom]} ${avant} → ${apres}`); }
    };
    const mettreEnJeu = (nom: NomDeChute) => {
        const champ = c.misesEnJeu?.[nom];
        const p = miseEnJeuPossible(n(valeurs[c[nom]]), !!champ && n(valeurs[champ]) > 0);
        if (!p.possible || !champ || !c.sapienceDeChute) return;
        const avant = n(valeurs[c.sapienceDeChute]);
        ecrire({ [champ]: 1, [c.sapienceDeChute]: avant + p.sapience });
        consigner('Mise en jeu d’une Chute', `${NOMS_DES_CHUTES[nom]} mise en jeu : +${p.sapience} PS pour un Effet Mnémos dans les heures qui viennent (p. 152)`);
    };
    return (
        <section data-chutes-nephilim className="flex flex-col gap-2 text-xs">
            {etat.alerte && <p className="font-bold text-etat-alerte">{etat.alerte}</p>}
            {etat.chutes.map(ch => {
                const champ = c.misesEnJeu?.[ch.nom];
                const p = miseEnJeuPossible(ch.degre, !!champ && n(valeurs[champ]) > 0);
                return (
                    <div key={ch.nom} className="flex flex-wrap items-center gap-2" data-chute={ch.nom}>
                        <span className={`${etiquette} w-36`}>{ch.label}</span>
                        <strong className="font-mono text-base w-10">{ch.degre}/10</strong>
                        {meneur && <button type="button" className={bouton} onClick={() => changer(ch.nom, 1)} disabled={ch.degre >= 10}>+1</button>}
                        {meneur && <button type="button" className={bouton} onClick={() => changer(ch.nom, -1)} disabled={ch.degre <= 0}>−1</button>}
                        {champ && c.sapienceDeChute && ch.degre > 0 && (
                            <button type="button" className={bouton} disabled={!p.possible} title={p.raison ?? 'Le MJ pourra user de la Chute contre le Nephilim, sans dire quand (p. 152)'}
                                onClick={() => mettreEnJeu(ch.nom)}>Mettre en jeu (+{Math.min(4, ch.degre)} PS)</button>
                        )}
                        {ch.effet && <span className={ch.palier >= 2 ? 'text-etat-alerte' : 'text-app-text/60'}>{ch.effet}</span>}
                    </div>
                );
            })}
            {c.forme && (
                <label className="flex items-center gap-2">
                    <span className={etiquette}>Forme du Khaïba</span>
                    <select aria-label="Forme du Khaïba" value={String(valeurs[c.forme] ?? '')} disabled={!meneur}
                        onChange={e => { ecrire({ [c.forme!]: e.target.value }); consigner('Khaïba', `Forme : ${e.target.value || 'à choisir'}`); }}
                        className="rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5">
                        <option value="">À choisir au premier degré</option>
                        {FORMES_DU_KHAIBA.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <span className="text-app-text/50">Nanisme ou Gigantisme pour un mage, éthérale pour un alchimiste, élémentaire pour un kabbaliste (p. 150 ; errata).</span>
                </label>
            )}
            {c.sapienceDeChute && n(valeurs[c.sapienceDeChute]) > 0 && (
                <p>PS de Chute : {n(valeurs[c.sapienceDeChute])}, seulement pour un Effet Mnémos ; perdus en fin de séance (p. 152).</p>
            )}
            <p className="text-app-text/50">Un Nephilim ne subit volontairement qu’un degré de Chute par séance ; l’adversité peut en infliger plus (p. 149).</p>
        </section>
    );
};

// ——— La stase (p. 113, 139 ; errata p. 113, 160) ———

export const StaseNephilim: React.FC<{ regle: RegleDeNephilim; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner }> = ({ regle, valeurs, ecrire, consigner }) => {
    const [test, setTest] = useState<string | null>(null);
    if (!regle.stase) return null;
    const stase = n(valeurs[regle.stase]), plafond = degreDuKaDominant(regle, valeurs);
    const poser = (v: number, pourquoi: string) => {
        const apres = Math.max(0, plafond ? Math.min(plafond, v) : v);
        if (apres !== stase) { ecrire({ [regle.stase!]: apres }); consigner('Stase', `${stase} → ${apres} (${pourquoi})`); }
    };
    const tester = () => {
        const tirage = DiceEngine.roll(100), r = testDeStase(stase, tirage);
        const ligne = `Test de stase : ${tirage} contre ${r.chances} % — ${r.reussi ? 'le Nephilim reste libre.' : 'remis en stase.'}`;
        setTest(ligne); consigner('Test de stase', ligne);
    };
    return (
        <section data-stase-nephilim className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
                <span className={etiquette}>Stase</span>
                <strong className="font-mono text-base">{stase}{plafond ? `/${plafond}` : ''}</strong>
                <button type="button" className={bouton} disabled={!plafond} onClick={() => poser(plafond ?? stase, 'pleine en la quittant, p. 113')}>Quitter la stase : pleine</button>
                <button type="button" className={bouton} disabled={!!plafond && stase >= plafond} onClick={() => poser(stase + 1, 'un jour en Plexus ou en Nexus, errata p. 160')}>Un jour en Plexus ou Nexus : +1</button>
                <button type="button" className={bouton} onClick={tester} title="Après un Effet Jésus sans stase pleine, et chaque jour hors d’un Simulacre (p. 139)">Tester la stase</button>
            </div>
            {test && <p data-test-de-stase>{test}</p>}
            {stase === 0 && <p className="text-etat-alerte">Stase vide : chaque jour, un test de Ka ; un échec, une Conséquence magique mineure, puis sérieuse, puis grave, puis une grave par échec (errata p. 113). La remplir d’un degré pour échapper à l’attraction.</p>}
            <p className="text-app-text/50">Un Effet Jésus sans stase pleine demande un test de stase ; chaque 24 heures hors d’un Simulacre, un nouveau test et un degré de Narcose (p. 139).</p>
        </section>
    );
};

// ——— L'expérience (p. 154-155) ———

export const ExperienceNephilim: React.FC<{ regle: RegleDeNephilim; valeurs: Valeurs; sections: Sections; ecrire: Ecrire; consigner: Consigner }> = ({ regle, valeurs, sections, ecrire, consigner }) => {
    const e = regle.experience;
    const champs = [
        // Seuls les degrés s'élèvent : un nom de Vécu n'est pas une valeur.
        ...sections.filter(s => (e?.sections ?? []).includes(s.id)).flatMap(s => s.fields.filter(f => f.type === 'number')
            .map(f => ({ id: f.id, label: f.label ?? f.id, groupe: s.label ?? s.id, ka: false, unPoint: false }))),
        ...(e?.champs ?? []).map(id => ({ id, label: nomDuChamp(sections, id), groupe: 'Autres', ka: false, unPoint: false })),
        ...(e?.ka ?? []).map(id => ({ id, label: nomDuChamp(sections, id), groupe: 'Ka', ka: true, unPoint: false })),
        ...(e?.unPoint ?? []).map(id => ({ id, label: nomDuChamp(sections, id), groupe: 'Materiae Primae', ka: false, unPoint: true })),
    ].filter(c => typeof valeurs[c.id] !== 'string' || /^\d+$/.test(String(valeurs[c.id])));
    const [choisi, setChoisi] = useState('');
    if (!regle.sapience || !champs.length) return null;
    const sapience = n(valeurs[regle.sapience]);
    const champ = champs.find(c => c.id === choisi);
    const actuel = champ ? n(valeurs[champ.id]) : 0;
    const cout = champ ? (champ.unPoint ? 1 : coutDeLExperience(actuel + 1, champ.ka)) : 0;
    const groupes = [...new Set(champs.map(c => c.groupe))];
    return (
        <section data-experience-nephilim className="flex flex-col gap-2 text-xs">
            <p className="text-app-text/60">À la fin de la séance, les Points de Sapience élèvent un élément relié au scénario et déjà acquis : le coût est la valeur visée, démultipliée au-delà de 5 et de 10 ; le Ka coûte dix fois sa valeur visée (p. 155).</p>
            <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Élément à élever" value={choisi} onChange={e => setChoisi(e.target.value)} className="rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5">
                    <option value="">Élever…</option>
                    {groupes.map(g => (
                        <optgroup key={g} label={g}>
                            {champs.filter(c => c.groupe === g).map(c => <option key={c.id} value={c.id}>{c.label} ({n(valeurs[c.id])})</option>)}
                        </optgroup>
                    ))}
                </select>
                {champ && (
                    <button type="button" className={bouton} disabled={cout > sapience || (actuel < 1 && !champ.ka && !champ.unPoint)}
                        title={actuel < 1 && !champ.ka && !champ.unPoint ? 'Le premier degré s’acquiert par un Effet Mnémos permanent (p. 155)' : undefined}
                        onClick={() => {
                            ecrire({ [champ.id]: actuel + 1, [regle.sapience!]: sapience - cout });
                            consigner('Expérience', `${champ.label} ${actuel} → ${actuel + 1} pour ${cout} PS (reste ${sapience - cout})`);
                            setChoisi('');
                        }}>Dépenser {cout} PS : {actuel} → {actuel + 1}</button>
                )}
                <span className="text-app-text/50">{sapience} PS</span>
            </div>
            {champ?.ka && <p className="text-app-text/50">Le Pentacle se rééquilibre selon le Ka dominant : au MJ de répercuter (p. 110-111).</p>}
        </section>
    );
};
