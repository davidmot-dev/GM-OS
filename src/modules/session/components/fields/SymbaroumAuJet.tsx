import React, { useState } from 'react';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import {
    ALLURES, CLE_SYMBAROUM, GENRES_DE_DEGATS, OPTIONS_DE_SYMBAROUM, RAPPELS_DU_TOUR, SOINS, SOURCES_DE_CORRUPTION, STIGMATES, TERRAINS,
    ajouterALaFormule, annulerLaMort, armureCompte, commencerLAgonie, controleDeCreation, critiqueDuJet, decomposer,
    degatsNets, douleurAtteinte, ecartsDesDerivees, ecrireLaBourse, encaisser, etatDeLaCorruption, grievementTouche,
    jourDeVoyage, joursPourLaDistance, kilometresParJour, lancerLaFormule, lireLaFormule, lireSymbaroum,
    marquerGrievementTouche, mouvementDeBourse, noterUnStigmate, rangSuivant, retirerUnStigmate, soigner, testDeMort,
    unJourPasse, valeursDerivees,
    type Allure, type GenreDeDegats, type NatureDuTest, type OptionDeSymbaroum, type RegleDeSymbaroum, type Terrain,
} from '../../../dice/systemes/symbaroumRegles';

/**
 * **Symbaroum, jusqu'au bout** — 23/10/2026, à la demande de David (« je
 * voudrais qu'on finisse Symbaroum »). Lots S2 et S4 à S9 de l'audit du 20/10.
 *
 * Ce que le panneau de jet propose en plus pour Symbaroum : la nature du test
 * (attaque, Défense), ses suites (dégâts, encaisser, critiques et relances
 * optionnels) et les cartes de la fiche. Rien ne s'écrit sans un clic, et
 * aucune règle optionnelle ne s'applique sans que la table l'ait retenue.
 */
type Valeurs = Record<string, unknown>;
type Ecrire = (maj: Record<string, unknown>) => void;
type Consigner = (titre: string, ligne: string) => void;
export type Options = Partial<Record<OptionDeSymbaroum, boolean>>;

const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const n = (v: unknown) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
const nombre = (texte: string) => { const x = Number(texte); return texte.trim() !== '' && Number.isFinite(x) ? x : undefined; };
const id = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()));

/** Les armes et armures nommées sur la fiche : une ligne vide ne se propose pas. */
const armesDeLaFiche = (regle: RegleDeSymbaroum, v: Valeurs) => (regle.armes ?? [])
    .filter(a => String(v[a.nom] ?? '').trim() || String(v[a.degats] ?? '').trim())
    .map(a => ({ id: a.nom, nom: String(v[a.nom] ?? '').trim() || 'Arme', degats: String(v[a.degats] ?? '').trim(), qualites: a.qualites ? String(v[a.qualites] ?? '').trim() : '' }));
const armuresDeLaFiche = (regle: RegleDeSymbaroum, v: Valeurs) => (regle.armures ?? [])
    .filter(a => String(v[a.protection] ?? '').trim())
    .map(a => ({ id: a.nom, nom: String(v[a.nom] ?? '').trim() || 'Armure', protection: String(v[a.protection] ?? '').trim() }));

// ——— Préparer ———

export const PreparationSymbaroum: React.FC<{
    nature: NatureDuTest;
    changer: (n: NatureDuTest) => void;
    /** Grièvement touché, avec l'option des dégâts critiques : le rappel, et de quoi l'appliquer. */
    grievement?: { appliquer: () => void };
}> = ({ nature, changer, grievement }) => (
    <div data-preparation-symbaroum className="flex flex-col gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Nature du test">
            <span className={etiquette}>Nature du test</span>
            {([['test', 'Test'], ['attaque', 'Attaque'], ['defense', 'Défense']] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-1">
                    <input type="radio" name="nature-symbaroum" checked={nature === v} onChange={() => changer(v)} />
                    {l}
                </label>
            ))}
            <span className="text-app-text/50">
                {nature === 'attaque' ? 'Contre la Défense de la cible : « Attribut adverse » (p. 162).'
                    : nature === 'defense' ? 'Contre la Précision de l’attaquant : « Attribut adverse » (p. 164).' : ''}
            </span>
        </div>
        {grievement && (
            <div className="flex flex-wrap items-center gap-2 text-etat-alerte">
                Grièvement touché : deux dés, le pire, sur tous ses tests jusqu’à un point d’Endurance regagné (p. 183).
                <button type="button" className={bouton} onClick={grievement.appliquer}>Deux dés, le pire</button>
            </div>
        )}
    </div>
);

// ——— Les suites du lancer ———

export const SuitesSymbaroum: React.FC<{
    regle: RegleDeSymbaroum;
    nature: NatureDuTest;
    resultat: RollResult;
    /** Le seuil du jet : le critique se confirme dessous (p. 184). */
    seuil: number;
    avantage: boolean;
    /** Ce que l'Avantage ajoute aux dégâts (« 1d4 »). */
    degatsDeLAvantage?: string;
    options: Options;
    valeurs: Valeurs;
    ecrire: Ecrire;
    consigner: Consigner;
    /** Relancer le même test, une fois payé ; absent si ce test a déjà été refait. */
    relancer?: () => void;
}> = ({ regle, nature, resultat, seuil, avantage, degatsDeLAvantage, options, valeurs, ecrire, consigner, relancer }) => {
    const [confirmation, setConfirmation] = useState<number | null>(null);
    const de = n(resultat.rolls.find(d => !d.isDropped)?.val);
    const reussi = resultat.tagSuccess === true;
    const critique = critiqueDuJet(de, nature, options, confirmation === null ? undefined : { de: confirmation, seuil });
    const degatsDuCritique = critique?.degats;
    const xp = regle.experience ? n(valeurs[regle.experience.disponible]) : 0;
    // Le livre recommande de ne pas relancer un échec critique en Défense (p. 184).
    const echecCritiqueEnDefense = nature === 'defense' && de === 20 && !!options.attaquesParfaites;
    return (
        <div data-suites-symbaroum className="flex w-full flex-col gap-2 text-xs">
            {critique && (
                <div className="flex flex-wrap items-center gap-2" data-critique-symbaroum>
                    <span className="font-bold">{critique.texte}</span>
                    {critique.aConfirmer && (
                        <button type="button" className={bouton} onClick={() => {
                            const d = DiceEngine.roll(20);
                            setConfirmation(d);
                            consigner('Confirmer le critique', `Second jet ${d} / ${seuil}`);
                        }}>Lancer le second jet</button>
                    )}
                </div>
            )}
            {nature === 'attaque' && reussi && (
                <Degats regle={regle} valeurs={valeurs} avantage={avantage} degatsDeLAvantage={degatsDeLAvantage}
                    critique={degatsDuCritique} options={options} consigner={consigner} />
            )}
            {nature === 'defense' && !reussi && (
                <Encaisser regle={regle} valeurs={valeurs} ecrire={ecrire} consigner={consigner}
                    supplement={degatsDuCritique ? Number(degatsDuCritique) : 0} options={options} />
            )}
            {relancer && !echecCritiqueEnDefense && (options.relanceExperience || options.relanceCorruption) && (
                <div className="flex flex-wrap items-center gap-2" data-relances-symbaroum>
                    <span className="text-app-text/60">Refaire ce jet, une seule fois (p. 184) :</span>
                    {options.relanceExperience && regle.experience && (
                        <button type="button" className={bouton} disabled={xp < 1} onClick={() => {
                            ecrire({ [regle.experience!.disponible]: xp - 1 });
                            consigner('Refaire un jet', `Expérience ${xp} → ${xp - 1} (perdue)`);
                            relancer();
                        }}>1 Expérience</button>
                    )}
                    {options.relanceCorruption && regle.corruption && (
                        <button type="button" className={bouton} onClick={() => {
                            const avant = n(valeurs[regle.corruption!.permanente]);
                            ecrire({ [regle.corruption!.permanente]: avant + 1 });
                            consigner('Refaire un jet', `Corruption permanente ${avant} → ${avant + 1}`);
                            relancer();
                        }}>1 Corruption permanente</button>
                    )}
                </div>
            )}
        </div>
    );
};

/** **Le PJ frappe** (p. 164, 167, 178) : ses dés de dégâts, moins la protection fixe du PNJ. */
const Degats: React.FC<{
    regle: RegleDeSymbaroum; valeurs: Valeurs; avantage: boolean; degatsDeLAvantage?: string; critique?: string;
    options: Options; consigner: Consigner;
}> = ({ regle, valeurs, avantage, degatsDeLAvantage, critique, options, consigner }) => {
    const armes = armesDeLaFiche(regle, valeurs);
    const [arme, setArme] = useState(armes[0]?.id ?? '');
    const [autre, setAutre] = useState('');
    const [avecAvantage, setAvecAvantage] = useState(avantage);
    const [protection, setProtection] = useState('');
    const [douleur, setDouleur] = useState('');
    const [issue, setIssue] = useState<string | null>(null);
    const choisie = armes.find(a => a.id === arme);
    const base = lireLaFormule(choisie ? choisie.degats : autre);
    const formule = ajouterALaFormule(ajouterALaFormule(base, avecAvantage ? degatsDeLAvantage : undefined), critique);
    const lancer = () => {
        if (!formule) return;
        const r = lancerLaFormule(formule, f => DiceEngine.roll(f));
        const p = nombre(protection) ?? 0, d = nombre(douleur) ?? 0;
        const nets = degatsNets(r.total, p);
        const lignes = [`${choisie?.nom ?? 'Dégâts'} : ${r.detail} = ${r.total}${p ? ` − ${p} de protection` : ''} → ${nets} dégât${nets > 1 ? 's' : ''}.`];
        if (nets === 0) lignes.push('L’armure arrête le coup : pas de douleur.');
        else if (douleurAtteinte(nets, d)) lignes.push(`Résistance à la douleur (${d}) atteinte : le joueur choisit — la cible tombe à terre, ou il obtient une Attaque gratuite (p. 164).`);
        if (options.degatsCritiques && grievementTouche(nets, d)) lignes.push('Grièvement touché : les tests contre lui se lancent à deux dés, le meilleur, jusqu’à ce qu’il guérisse (p. 183).');
        const texte = lignes.join(' ');
        setIssue(texte);
        consigner('Dégâts infligés', texte);
    };
    return (
        <div data-degats-symbaroum className="flex flex-col gap-1 rounded-md border border-app-border/30 p-2">
            <span className={etiquette}>Les dégâts (p. 164)</span>
            <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Arme" value={arme} onChange={e => { setArme(e.target.value); setIssue(null); }} className={champ}>
                    {armes.map(a => <option key={a.id} value={a.id}>{a.nom}{a.degats ? ` (${a.degats})` : ''}</option>)}
                    <option value="">Autre…</option>
                </select>
                {!choisie && <input aria-label="Dégâts" placeholder="1d8" value={autre} onChange={e => setAutre(e.target.value)} className={`w-20 ${champ}`} />}
                {degatsDeLAvantage && (
                    <label className="flex items-center gap-1">
                        <input type="checkbox" checked={avecAvantage} onChange={e => setAvecAvantage(e.target.checked)} />
                        Avantage +{degatsDeLAvantage.toUpperCase()}
                    </label>
                )}
                <label className="flex items-center gap-1">Protection du PNJ
                    <input aria-label="Protection du PNJ" type="number" min={0} value={protection} onChange={e => setProtection(e.target.value)} className={`w-14 ${champ}`} />
                </label>
                <label className="flex items-center gap-1">Douleur du PNJ
                    <input aria-label="Résistance à la douleur du PNJ" type="number" min={0} value={douleur} onChange={e => setDouleur(e.target.value)} className={`w-14 ${champ}`} />
                </label>
                <button type="button" className={bouton} disabled={!formule} onClick={lancer}>
                    Lancer {formule?.texte ?? 'les dégâts'}
                </button>
            </div>
            {choisie?.qualites && <span className="text-app-text/50">Qualités : {choisie.qualites}</span>}
            {issue && <p data-issue-des-degats className="font-mono">{issue}</p>}
        </div>
    );
};

/**
 * **Le PJ encaisse** (p. 164, 167, 178, 182) : les dégâts fixes du PNJ, moins
 * la protection que le joueur lance. L'Endurance ne change qu'au clic.
 */
const Encaisser: React.FC<{
    regle: RegleDeSymbaroum; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner; supplement: number; options: Options;
}> = ({ regle, valeurs, ecrire, consigner, supplement, options }) => {
    const armures = armuresDeLaFiche(regle, valeurs);
    const [degats, setDegats] = useState('');
    const [genre, setGenre] = useState<GenreDeDegats>('physique');
    const [armure, setArmure] = useState(armures[0]?.id ?? '');
    const [issue, setIssue] = useState<string | null>(null);
    if (!regle.endurance) return null;
    const choisie = armures.find(a => a.id === armure);
    const appliquer = () => {
        const fixe = nombre(degats);
        if (fixe === undefined) return;
        const total = fixe + supplement;
        if (genre === 'alternatif') {
            const texte = `${total} dégâts sur un Attribut : à reporter sur l’Attribut nommé, l’Endurance ne change pas.`;
            setIssue(texte); consigner('Dégâts encaissés', texte); return;
        }
        const formule = armureCompte(genre) && choisie ? lireLaFormule(choisie.protection) : null;
        const p = formule ? lancerLaFormule(formule, f => DiceEngine.roll(f)) : null;
        const nets = degatsNets(total, p?.total ?? 0);
        const avant = n(valeurs[regle.endurance!.courante]);
        const douleur = regle.douleur ? n(valeurs[regle.douleur]) : 0;
        const r = encaisser(avant, nets, { mortSubite: options.mortSubite, douleur });
        const maj: Record<string, unknown> = { [regle.endurance!.courante]: r.apres };
        let suivi: Valeurs = valeurs;
        const lignes = [`${total}${supplement ? ` (dont +${supplement}, échec critique)` : ''}${p ? ` − ${p.total} (${choisie!.nom} : ${p.detail})` : ''} → ${nets} dégât${nets > 1 ? 's' : ''} ; Endurance ${avant} → ${r.apres}.`];
        if (r.douleur && r.etat === 'debout') lignes.push('Résistance à la douleur atteinte : le joueur choisit — tomber à terre, ou offrir une Attaque gratuite à l’attaquant (p. 164).');
        if (options.degatsCritiques && grievementTouche(nets, douleur)) {
            const m = marquerGrievementTouche(suivi, true); Object.assign(maj, m); suivi = { ...suivi, ...m };
            lignes.push('Grièvement touché : deux dés, le pire, sur tous ses tests (p. 183).');
        }
        if (r.etat === 'mourant') {
            Object.assign(maj, commencerLAgonie(suivi));
            lignes.push('Il s’effondre, mourant : un Test de mort à chaque tour (p. 164).');
        } else if (r.etat === 'mort') {
            const s = { ...lireSymbaroum(suivi), mort: true }; delete s.agonie;
            maj[CLE_SYMBAROUM] = s;
            lignes.push('Mort subite : le coup le tue sur le coup (p. 183).');
        }
        const texte = lignes.join(' ');
        ecrire(maj); setIssue(texte); consigner('Dégâts encaissés', texte);
    };
    return (
        <div data-encaisser-symbaroum className="flex flex-col gap-1 rounded-md border border-app-border/30 p-2">
            <span className={etiquette}>Encaisser (p. 164)</span>
            <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">Dégâts du PNJ
                    <input aria-label="Dégâts du PNJ" type="number" min={0} value={degats} onChange={e => setDegats(e.target.value)} className={`w-14 ${champ}`} />
                </label>
                <select aria-label="Genre de dégâts" value={genre} onChange={e => setGenre(e.target.value as GenreDeDegats)} className={champ}>
                    {GENRES_DE_DEGATS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                </select>
                {armureCompte(genre) && (
                    <select aria-label="Armure" value={armure} onChange={e => setArmure(e.target.value)} className={champ}>
                        {armures.map(a => <option key={a.id} value={a.id}>{a.nom} ({a.protection})</option>)}
                        <option value="">Sans armure</option>
                    </select>
                )}
                <button type="button" className={bouton} disabled={nombre(degats) === undefined || !!issue} onClick={appliquer}>
                    {armureCompte(genre) && choisie ? 'Lancer la protection et encaisser' : 'Encaisser'}
                </button>
            </div>
            <span className="text-app-text/50">{GENRES_DE_DEGATS.find(g => g.id === genre)?.texte} Une valeur de dé d’un PNJ vaut la moitié de sa plus haute face (p. 178).</span>
            {issue && <p data-issue-encaisser className="font-mono">{issue}</p>}
        </div>
    );
};

// ——— Les cartes de la fiche ———

/** **Endurance et agonie** (p. 164–165) : l'état du personnage, le Test de mort, les soins. */
export const EnduranceSymbaroum: React.FC<{
    regle: RegleDeSymbaroum; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner; meneur: boolean;
}> = ({ regle, valeurs, ecrire, consigner, meneur }) => {
    const [dernier, setDernier] = useState<string | null>(null);
    const [remede, setRemede] = useState(false);
    if (!regle.endurance) return null;
    const s = lireSymbaroum(valeurs);
    const courante = n(valeurs[regle.endurance.courante]);
    const max = n(valeurs[regle.endurance.maximum]) || valeursDerivees(regle, valeurs).enduranceMax;
    const mourant = !s.mort && (!!s.agonie || courante <= 0);
    const test = () => {
        const d = DiceEngine.roll(20);
        const r = testDeMort(mourant && !s.agonie ? { ...valeurs, ...commencerLAgonie(valeurs) } : valeurs, d, id(), d === 1 ? DiceEngine.roll(4) : undefined);
        if (r.issue === 'deja') return;
        ecrire({ ...r.valeurs, ...(r.endurance ? { [regle.endurance!.courante]: r.endurance } : {}) });
        setDernier(r.texte); consigner('Test de mort', r.texte);
    };
    const formuleDuSoin = (s0: typeof SOINS[number]) => (remede && s0.avecRemede) || s0.gain;
    const soin = (s0: typeof SOINS[number]) => {
        const f = lireLaFormule(formuleDuSoin(s0));
        const gain = f ? lancerLaFormule(f, x => DiceEngine.roll(x)).total : 1;
        const apres = Math.min(max, courante + gain);
        ecrire({ [regle.endurance!.courante]: apres, ...soigner(valeurs, apres - courante) });
        const texte = `${s0.label}${remede && s0.avecRemede ? ' avec un remède' : ''} : +${gain}, Endurance ${courante} → ${apres}${mourant ? ', il ne meurt plus' : ''}.`;
        setDernier(texte); consigner('Soins', texte);
    };
    return (
        <div data-endurance-symbaroum className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-black">{courante} / {max}</span>
                <span className="text-app-text/60">Endurance</span>
                {regle.douleur && <span className="text-app-text/60">Résistance à la douleur {n(valeurs[regle.douleur])}</span>}
                <span className={s.mort ? 'font-black text-etat-danger' : mourant ? 'font-black text-etat-alerte' : 'text-app-text/60'}>
                    {s.mort ? 'Mort' : mourant ? `Mourant${s.agonie ? ` — 11 à 19 : ${s.agonie.echecs} sur 3` : ''}` : 'Debout'}
                </span>
                {s.grievementTouche && <span className="text-etat-alerte">Grièvement touché</span>}
            </div>
            {mourant && (
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className={bouton} onClick={test}>Test de mort (1D20)</button>
                    <span className="text-app-text/60">À chaque tour, à son Initiative : 1 il se réveille, 11–19 trois fois ou 20 il meurt (p. 164).</span>
                </div>
            )}
            {!s.mort && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className={etiquette}>Soins (p. 165)</span>
                    {SOINS.map(x => (
                        <button key={x.id} type="button" className={bouton} disabled={courante >= max || (mourant && !x.premiersSoins)} onClick={() => soin(x)}>
                            {x.label} (+{formuleDuSoin(x).toUpperCase()})
                        </button>
                    ))}
                    <label className="flex items-center gap-1" title="Medicus : un dé de plus avec un remède à base de plantes, après un test d’Astuce réussi, une fois par patient et par jour (p. 123–124)">
                        <input type="checkbox" checked={remede} onChange={e => setRemede(e.target.checked)} /> avec un remède
                    </label>
                    {s.grievementTouche && (
                        <button type="button" className={bouton} onClick={() => ecrire(marquerGrievementTouche(valeurs, false))}>N’est plus grièvement touché</button>
                    )}
                </div>
            )}
            {s.mort && meneur && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-app-text/60">Un personnage mort quitte le jeu ; son successeur garde son Expérience (p. 164).</span>
                    <button type="button" className={bouton} onClick={() => { ecrire(annulerLaMort(valeurs)); consigner('Mort annulée', 'Le meneur annule la mort notée.'); }}>Annuler la mort</button>
                </div>
            )}
            {dernier && <p data-dernier-endurance className="font-mono">{dernier}</p>}
        </div>
    );
};

/** **Corruption, Ombre et Stigmates** (p. 179–180). Les seuils franchis s'annoncent déjà (`franchissements`). */
export const CorruptionSymbaroum: React.FC<{
    regle: RegleDeSymbaroum; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner;
}> = ({ regle, valeurs, ecrire, consigner }) => {
    const [stigmate, setStigmate] = useState(STIGMATES[0]);
    const [libre, setLibre] = useState('');
    if (!regle.corruption) return null;
    const e = etatDeLaCorruption(regle, valeurs);
    const s = lireSymbaroum(valeurs);
    const temporaires = s.stigmates.filter(x => !x.permanent), permanents = s.stigmates.filter(x => x.permanent);
    const source = (x: typeof SOURCES_DE_CORRUPTION[number]) => {
        const { temporaire, permanente } = regle.corruption!;
        if (x.temporaire) {
            const d = DiceEngine.roll(4), avant = n(valeurs[temporaire]);
            ecrire({ [temporaire]: avant + d });
            consigner('Corruption', `${x.label} : +${d} temporaire (1D4), ${avant} → ${avant + d}`);
        } else {
            const avant = n(valeurs[permanente]);
            ecrire({ [permanente]: avant + (x.permanente ?? 1) });
            consigner('Corruption', `${x.label} : +${x.permanente} permanente, ${avant} → ${avant + (x.permanente ?? 1)}`);
        }
    };
    const xp = regle.experience ? n(valeurs[regle.experience.disponible]) : 0;
    const noter = (permanent: boolean) => {
        const texte = libre.trim() || stigmate;
        ecrire(noterUnStigmate(valeurs, texte, permanent));
        consigner('Stigmate', `${texte} (${permanent ? 'permanent' : 'temporaire, une journée'})`);
        setLibre('');
    };
    return (
        <div data-corruption-symbaroum className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-black">{e.total}</span>
                <span className="text-app-text/60">Corruption totale ({e.temporaire} temporaire + {e.permanente} permanente)</span>
                <span className="text-app-text/60">Seuil {e.seuil} · Volonté {e.volonte}</span>
            </div>
            <p className={e.abomination ? 'font-black text-etat-danger' : e.marque ? 'text-etat-alerte' : 'text-app-text/60'}>
                {e.abomination ? 'Abomination : la Corruption totale atteint la Volonté (p. 180).'
                    : e.marquePermanente ? 'Marqué par la Corruption permanente : un Stigmate permanent, tant qu’elle tient le seuil (p. 180).'
                    : e.marque ? 'Marqué par la Corruption : un Stigmate temporaire, qui guérit après une journée (p. 179).'
                    : e.total > 0 ? 'Touché par la Corruption : la temporaire s’efface à la fin de la scène.' : 'Intact.'}
                {' '}Ombre : {e.corruptionDomine ? 'la Corruption domine' : 'l’Ombre de base domine'} (Volonté − Corruption = {e.ombreDeBase}).
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <span className={etiquette}>Ce qui corrompt (p. 180)</span>
                {SOURCES_DE_CORRUPTION.map(x => (
                    <button key={x.id} type="button" className={bouton} onClick={() => source(x)}>
                        {x.label} ({x.temporaire ? `+${x.temporaire.toUpperCase()} temp.` : `+${x.permanente} perm.`})
                    </button>
                ))}
                {regle.experience && (
                    <button type="button" className={bouton} disabled={xp < 1} onClick={() => {
                        ecrire({ [regle.experience!.disponible]: xp - 1 });
                        consigner('Se lier à un artéfact', `1 Expérience au lieu de la Corruption : ${xp} → ${xp - 1}`);
                    }}>Se lier à un artéfact (1 Expérience)</button>
                )}
            </div>
            <span className="text-app-text/50">Les traditions mystiques ont leurs exceptions : ne cliquer que ce qui s’applique.</span>
            <div className="flex flex-wrap items-center gap-2">
                <span className={etiquette}>Stigmates</span>
                {s.stigmates.length === 0 && <span className="text-app-text/50">{e.marque ? 'Un Stigmate à choisir.' : 'Aucun.'}</span>}
                {[...permanents, ...temporaires].map(x => (
                    <span key={x.id} className="flex items-center gap-1 rounded-md border border-app-border/30 px-2 py-0.5">
                        {x.texte}{x.permanent ? ' (permanent)' : ' (temporaire)'}
                        <button type="button" aria-label={`Retirer ${x.texte}`} className="text-app-text/50 hover:text-accent" onClick={() => ecrire(retirerUnStigmate(valeurs, x.id))}>×</button>
                    </span>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Stigmate du Tableau 24" value={stigmate} onChange={e => setStigmate(e.target.value)} className={`max-w-xs ${champ}`}>
                    {STIGMATES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input aria-label="Stigmate inventé" placeholder="ou un autre…" value={libre} onChange={e => setLibre(e.target.value)} className={`w-40 ${champ}`} />
                <button type="button" className={bouton} onClick={() => noter(false)}>Noter, temporaire</button>
                <button type="button" className={bouton} onClick={() => noter(true)}>Noter, permanent</button>
                <button type="button" className={bouton} onClick={() => { ecrire(unJourPasse(valeurs)); consigner('Un jour passe', 'Les Stigmates temporaires guérissent.'); }}>Un jour passe</button>
            </div>
        </div>
    );
};

/** **Les valeurs dérivées** (p. 103, 163–164, 179) : le calcul du livre, à côté de la fiche. */
export const DeriveesSymbaroum: React.FC<{
    regle: RegleDeSymbaroum; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner; libelle: (id: string) => string;
}> = ({ regle, valeurs, ecrire, consigner, libelle }) => {
    const d = valeursDerivees(regle, valeurs);
    const ecarts = ecartsDesDerivees(regle, valeurs);
    return (
        <div data-derivees-symbaroum className="flex flex-col gap-2 text-xs">
            <p className="text-app-text/60">
                Endurance : la Force, au moins 10 = {d.enduranceMax} · Résistance à la douleur : la moitié de la Force, arrondie au-dessus = {d.douleur} ·
                Seuil de Corruption : la moitié de la Volonté, arrondie au-dessus = {d.seuilDeCorruption} · Défense : Agilité {d.defenseDeBase}, puis armure, bouclier (+1) et Talents
                {regle.defense ? ` — la fiche dit ${n(valeurs[regle.defense])}` : ''}.
            </p>
            {ecarts.length === 0 && <p className="text-app-text/50">La fiche suit le calcul du livre.</p>}
            {ecarts.map(x => (
                <div key={x.champ} className="flex flex-wrap items-center gap-2">
                    <span>{libelle(x.champ)} : la fiche dit {x.fiche}, le calcul {x.calcul}.</span>
                    <button type="button" className={bouton} onClick={() => {
                        ecrire({ [x.champ]: x.calcul });
                        consigner('Valeur dérivée', `${x.label} : ${x.fiche} → ${x.calcul}`);
                    }}>Adopter {x.calcul}</button>
                </div>
            ))}
            {ecarts.length > 0 && <span className="text-app-text/50">Un Talent ou un Trait (Robuste, Résistant…) peut expliquer l’écart : garder la fiche, alors.</span>}
        </div>
    );
};

/** **Création et progression** (p. 77–79, 166) : au meneur. */
export const ProgressionSymbaroum: React.FC<{
    regle: RegleDeSymbaroum; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner;
}> = ({ regle, valeurs, ecrire, consigner }) => {
    const [gain, setGain] = useState('');
    const [nouveau, setNouveau] = useState('');
    const creation = controleDeCreation(regle, valeurs);
    const xp = regle.experience;
    const dispo = xp ? n(valeurs[xp.disponible]) : 0;
    const talents = (regle.talents ?? []).map(t => ({ ...t, nomEcrit: String(valeurs[t.nom] ?? '').trim(), rang: String(valeurs[t.niveau] ?? '').trim() }));
    const libre = talents.find(t => !t.nomEcrit);
    const acheter = (t: typeof talents[number], nom: string) => {
        const suivant = rangSuivant(t.rang);
        if (!xp || !suivant || dispo < suivant.cout) return;
        ecrire({ [xp.disponible]: dispo - suivant.cout, [t.niveau]: suivant.rang, ...(t.nomEcrit ? {} : { [t.nom]: nom }) });
        consigner('Progression', `${nom} : ${suivant.rang} pour ${suivant.cout} Expérience (${dispo} → ${dispo - suivant.cout})`);
    };
    return (
        <div data-progression-symbaroum className="flex flex-col gap-2 text-xs">
            <p className={creation.conforme ? 'text-app-text/60' : 'text-etat-alerte'}>
                Création : somme {creation.somme} sur 80, chaque Attribut de 5 à 15, un seul 15 (p. 79).
                {creation.constats.length ? ` ${creation.constats.join(' ')}` : ' Conforme.'}
                {' '}Ce n’est pas un plafond de campagne : Attribut exceptionnel ajoute jusqu’à +3 (p. 116).
            </p>
            {xp && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className={etiquette}>Expérience</span>
                    <span className="font-mono">{dispo} à dépenser · {n(valeurs[xp.total])} en tout</span>
                    <input aria-label="Expérience gagnée" type="number" min={1} value={gain} onChange={e => setGain(e.target.value)} className={`w-14 ${champ}`} />
                    <button type="button" className={bouton} disabled={!nombre(gain) || nombre(gain)! < 1} onClick={() => {
                        const g = nombre(gain)!;
                        ecrire({ [xp.disponible]: dispo + g, [xp.total]: n(valeurs[xp.total]) + g });
                        consigner('Expérience', `+${g} en fin d’aventure (${dispo} → ${dispo + g} à dépenser)`);
                        setGain('');
                    }}>Gagner</button>
                </div>
            )}
            {xp && talents.filter(t => t.nomEcrit).map(t => {
                const suivant = rangSuivant(t.rang);
                return (
                    <div key={t.nom} className="flex flex-wrap items-center gap-2">
                        <span>{t.nomEcrit} — {t.rang || 'sans rang'}</span>
                        {suivant && (
                            <button type="button" className={bouton} disabled={dispo < suivant.cout} onClick={() => acheter(t, t.nomEcrit)}>
                                Passer {suivant.rang} ({suivant.cout})
                            </button>
                        )}
                    </div>
                );
            })}
            {xp && libre && (
                <div className="flex flex-wrap items-center gap-2">
                    <input aria-label="Nouveau Talent" placeholder="Nouveau Talent ou pouvoir" value={nouveau} onChange={e => setNouveau(e.target.value)} className={`w-48 ${champ}`} />
                    <button type="button" className={bouton} disabled={!nouveau.trim() || dispo < 10} onClick={() => { acheter(libre, nouveau.trim()); setNouveau(''); }}>
                        Acheter Novice (10)
                    </button>
                    <span className="text-app-text/50">Apprendre un pouvoir ou un rituel coûte aussi 1 Corruption permanente (p. 180).</span>
                </div>
            )}
        </div>
    );
};

/** **La bourse** (p. 190) : 1 thaler = 10 shillings = 100 ortegs, un seul compte. */
export const BourseSymbaroum: React.FC<{
    regle: RegleDeSymbaroum; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner;
}> = ({ regle, valeurs, ecrire, consigner }) => {
    const [montant, setMontant] = useState({ thalers: '', shillings: '', ortegs: '' });
    const [refus, setRefus] = useState<string | null>(null);
    if (!regle.argent) return null;
    const thalers = n(valeurs[regle.argent.champ]);
    const d = decomposer(thalers);
    const ecrit = regle.argent.ecrit ? String(valeurs[regle.argent.ecrit] ?? '').trim() : '';
    const mouvoir = (signe: 1 | -1) => {
        const m = { thalers: signe * (nombre(montant.thalers) ?? 0), shillings: signe * (nombre(montant.shillings) ?? 0), ortegs: signe * (nombre(montant.ortegs) ?? 0) };
        const apres = mouvementDeBourse(thalers, m);
        if (apres === null) { setRefus('Pas assez dans la bourse.'); return; }
        setRefus(null);
        ecrire({ [regle.argent!.champ]: apres });
        consigner('Bourse', `${signe > 0 ? 'Reçu' : 'Payé'} ${ecrireLaBourse(Math.abs(apres - thalers))} : ${ecrireLaBourse(thalers)} → ${ecrireLaBourse(apres)}`);
        setMontant({ thalers: '', shillings: '', ortegs: '' });
    };
    const saisie = (cle: keyof typeof montant, label: string) => (
        <label className="flex items-center gap-1">
            <input aria-label={label} type="number" min={0} value={montant[cle]} onChange={e => setMontant(m => ({ ...m, [cle]: e.target.value }))} className={`w-14 ${champ}`} />
            {label}
        </label>
    );
    return (
        <div data-bourse-symbaroum className="flex flex-col gap-2 text-xs">
            <span className="font-mono text-sm font-black">{d.thalers} th · {d.shillings} sh · {d.ortegs} o</span>
            <div className="flex flex-wrap items-center gap-2">
                {saisie('thalers', 'thalers')}{saisie('shillings', 'shillings')}{saisie('ortegs', 'ortegs')}
                <button type="button" className={bouton} onClick={() => mouvoir(1)}>Recevoir</button>
                <button type="button" className={bouton} onClick={() => mouvoir(-1)}>Payer</button>
            </div>
            {refus && <p className="text-etat-alerte">{refus}</p>}
            {regle.argent.ecrit && ecrit !== ecrireLaBourse(thalers) && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-app-text/60">La fiche écrit « {ecrit || 'rien'} ». Le troc et les biens restent dans « Autres biens ».</span>
                    <button type="button" className={bouton} onClick={() => ecrire({ [regle.argent!.ecrit!]: ecrireLaBourse(thalers) })}>
                        Écrire « {ecrireLaBourse(thalers)} » sur la fiche
                    </button>
                </div>
            )}
        </div>
    );
};

/** **Le voyage** (Tableau 26, p. 190) : la distance au meneur, le jour qui passe sur ce personnage. */
export const VoyageSymbaroum: React.FC<{
    regle: RegleDeSymbaroum; valeurs: Valeurs; ecrire: Ecrire; consigner: Consigner;
}> = ({ regle, valeurs, ecrire, consigner }) => {
    const [terrain, setTerrain] = useState<Terrain>('davokarClair');
    const [moyen, setMoyen] = useState<'marche' | 'cheval'>('marche');
    const [allure, setAllure] = useState<Allure>('normale');
    const [km, setKm] = useState('');
    const [dernier, setDernier] = useState<string | null>(null);
    const parJour = kilometresParJour(moyen, allure, terrain);
    const jour = () => {
        const s = lireSymbaroum(valeurs);
        const force = regle.force ? n(valeurs[regle.force]) : 0;
        const r = jourDeVoyage(allure, force, { d20: DiceEngine.roll(20), d6: DiceEngine.roll(6) });
        const maj: Record<string, unknown> = { ...unJourPasse(valeurs) };
        let texte = r.texte;
        if (regle.endurance && !s.mort) {
            const avant = n(valeurs[regle.endurance.courante]);
            const max = n(valeurs[regle.endurance.maximum]) || valeursDerivees(regle, valeurs).enduranceMax;
            const apres = r.accident ? 0 : Math.max(0, Math.min(max, avant + (s.agonie ? 0 : r.guerison) - r.perte));
            maj[regle.endurance.courante] = apres;
            if (apres === 0) Object.assign(maj, commencerLAgonie({ ...valeurs, ...maj }));
            texte += ` Endurance ${avant} → ${apres}.`;
        }
        ecrire(maj); setDernier(texte); consigner('Un jour de voyage', `${TERRAINS[terrain]}, ${moyen === 'marche' ? 'à pied' : 'à cheval'}, allure ${ALLURES[allure].toLowerCase()} : ${texte}`);
    };
    return (
        <div data-voyage-symbaroum className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Terrain" value={terrain} onChange={e => setTerrain(e.target.value as Terrain)} className={champ}>
                    {(Object.keys(TERRAINS) as Terrain[]).map(t => <option key={t} value={t}>{TERRAINS[t]}</option>)}
                </select>
                <select aria-label="Moyen de transport" value={moyen} onChange={e => setMoyen(e.target.value as 'marche' | 'cheval')} className={champ}>
                    <option value="marche">À pied</option><option value="cheval">À cheval</option>
                </select>
                <select aria-label="Allure" value={allure} onChange={e => setAllure(e.target.value as Allure)} className={champ}>
                    {(Object.keys(ALLURES) as Allure[]).map(a => <option key={a} value={a}>{ALLURES[a]}</option>)}
                </select>
                <span className="font-mono">{parJour} km par jour</span>
                <label className="flex items-center gap-1">
                    <input aria-label="Distance en kilomètres" type="number" min={0} value={km} onChange={e => setKm(e.target.value)} className={`w-16 ${champ}`} /> km
                </label>
                {nombre(km) !== undefined && <span className="font-mono">≈ {joursPourLaDistance(nombre(km)!, moyen, allure, terrain)} jour(s)</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button type="button" className={bouton} onClick={jour}>Un jour de voyage pour ce personnage</button>
                <span className="text-app-text/50">
                    {allure === 'normale' ? 'Guérison naturelle d’un point.' : allure === 'forcee' ? 'Forcée : aucune guérison naturelle.' : 'Éreintante : −1 Endurance, test de Force ou −1D6, un 20 est un accident mortel.'}
                </span>
            </div>
            {dernier && <p data-dernier-voyage className="font-mono">{dernier}</p>}
        </div>
    );
};

/** **Les règles optionnelles** (p. 183–184), retenues par la table, sur la campagne. Au meneur. */
export const OptionsSymbaroum: React.FC<{
    proposees?: OptionDeSymbaroum[]; options: Options; changer?: (o: Options) => void;
}> = ({ proposees, options, changer }) => (
    <div data-options-symbaroum className="flex flex-col gap-1 text-xs">
        {OPTIONS_DE_SYMBAROUM.filter(o => !proposees || proposees.includes(o.id)).map(o => (
            <label key={o.id} className="flex items-start gap-2" title={o.texte}>
                <input type="checkbox" checked={!!options[o.id]} disabled={!changer || (o.id === 'limiterLesCritiques' && !options.attaquesParfaites)}
                    onChange={e => changer?.({ ...options, [o.id]: e.target.checked })} />
                <span><strong>{o.label}</strong> — {o.texte}</span>
            </label>
        ))}
        {!changer && <span className="text-app-text/50">Retenues pour la campagne par le meneur.</span>}
    </div>
);

/** **Le tour de combat** (Tableau 22, p. 167) : ce qui ne se calcule pas, à garder sous les yeux. */
export const TourSymbaroum: React.FC = () => (
    <ul data-tour-symbaroum className="flex list-disc flex-col gap-1 pl-4 text-xs text-app-text/70">
        {RAPPELS_DU_TOUR.map(r => <li key={r}>{r}</li>)}
        <li>Initiative : l’Agilité, puis la Vigilance, puis 1D20 ; on peut se placer plus tard, l’ordre établi ne change plus (p. 161).</li>
    </ul>
);
