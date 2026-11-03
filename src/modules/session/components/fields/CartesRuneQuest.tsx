import React, { useMemo, useState } from 'react';
import type { SheetSection } from '../../../../data/defaultSheetTemplates';
import { DiceEngine } from '../../../dice/DiceEngine';
import { degreDuDe } from '../../../dice/degresDeReussite';
import { echelleDeRuneQuest, niveauDeRuneQuest, LIBELLES_DE_RUNEQUEST, type RegleDeRuneQuest } from '../../../dice/systemes/runequest';
import { appliquerLesDerives, calculerLesDerives, type LigneDeDerive, type RegleDesDerives } from '../../../dice/systemes/derivesDeRuneQuest';
import {
    jourSaint, journeeEntiere, nomDuCulte, reposDeSixHeures, statutDuRang, LIBELLES_DES_JOURS_SAINTS,
    type ImportanceDuJourSaint, type StatutDuFidele,
} from '../../../dice/systemes/magieDeRuneQuest';
import {
    appliquerLExperience, decocher, cocher, effacerLesCoches, ecrireLEtat, finDeLaSituation, journeeDeMeditation, lireLEtat,
    modificateurDExperience, nouvelleSession, testDExperience, type TestDExperience,
} from '../../../dice/systemes/progressionDeRuneQuest';
import {
    aptitudesDeLaFiche, libelleDuChamp, sectionDuChamp, BOUTON_PRINCIPAL_RQ, BOUTON_RQ, CHAMP_RQ, ETIQUETTE_RQ,
} from './runequestALaFiche';

/**
 * **Les cartes de RuneQuest, à côté du test** — RQ-A5 et RQ-A6, 03/11/2026, à la demande
 * de David (« on va faire RQ-A5 et RQ-A6 »), écrans dessinés dans Stitch et validés le
 * même jour (`stitch/runequest-derives/`, `stitch/runequest-progression/`).
 *
 * - **Attributs calculés** : chaque attribut, la valeur de la fiche, celle des tables, le
 *   détail et la page ; « Appliquer » ligne à ligne ou tout. Les compétences ne bougent pas.
 * - **Magie et progression** : les PM et les PR de chaque culte, le repos, le jour saint ;
 *   l'inspiration en cours et ses malus ; les coches d'expérience et la fin de saison, où
 *   rien ne s'écrit sans « Confirmer ».
 *
 * Elles écrivent par `appliquer`, comme les cartes du Voyageur ; chaque geste va au journal.
 */

const Ligne: React.FC<{ l: LigneDeDerive; appliquer: () => void }> = ({ l, appliquer }) => (
    <tr className="border-t border-app-border/20" data-derive={l.cle}>
        <td className="py-1 pr-2">{l.libelle}</td>
        <td className="py-1 px-2 text-center font-mono">{l.surLaFiche}</td>
        <td className={`py-1 px-2 text-center font-mono ${l.identique ? '' : 'font-black text-accent'}`}>{l.calcule}</td>
        <td className="py-1 px-2 text-app-text/60">{l.detail}{l.note ? <span className="block italic">{l.note}</span> : null}</td>
        <td className="py-1 pl-2 text-right">
            {l.identique
                ? <span className="text-ui-9 font-black uppercase tracking-widest text-etat-succes">identique</span>
                : <button type="button" className={BOUTON_RQ} onClick={appliquer}>Appliquer</button>}
        </td>
    </tr>
);

export const AttributsCalculesRuneQuest: React.FC<{
    regle: RegleDesDerives;
    valeurs: Record<string, unknown>;
    appliquer: (maj: Record<string, unknown>) => void;
    consigner: (ligne: string) => void;
}> = ({ regle, valeurs, appliquer, consigner }) => {
    const derives = useMemo(() => calculerLesDerives(regle, valeurs), [regle, valeurs]);
    if (derives.manquantes.length) {
        return <p className="text-xs text-app-text/60" data-attributs-runequest>Il manque {derives.manquantes.map(c => c.toUpperCase()).join(', ')} sur la fiche : rien ne se calcule sans les sept caractéristiques.</p>;
    }
    const c = derives.caracteristiques!;
    const aAppliquer = derives.lignes.filter(l => !l.identique);
    const faire = (cles: string[]) => {
        const maj = appliquerLesDerives(regle, valeurs, derives, cles);
        if (!Object.keys(maj).length) return;
        appliquer(maj);
        const noms = derives.lignes.filter(l => cles.includes(l.cle) && !l.identique).map(l => `${l.libelle} ${l.surLaFiche} → ${l.calcule}`);
        consigner(`Attributs recalculés (p. 54-59) : ${noms.join(' ; ')}.`);
    };
    const groupe = (g: LigneDeDerive['groupe']) => derives.lignes.filter(l => l.groupe === g);
    return (
        <div data-attributs-runequest className="flex flex-col gap-3 text-xs">
            <p className="text-app-text/60">
                D’après FOR {c.for} · CON {c.con} · TAI {c.tai} · DEX {c.dex} · INT {c.int} · POU {c.pou} · CHA {c.cha} — tables du livre p. 54-59.
            </p>
            <table className="w-full border-collapse">
                <thead>
                    <tr className={ETIQUETTE_RQ}>
                        <th className="text-left font-black pb-1">Attribut</th><th className="px-2 font-black">Sur la fiche</th>
                        <th className="px-2 font-black">Calculé</th><th className="px-2 text-left font-black">Détail</th><th />
                    </tr>
                </thead>
                <tbody>{groupe('attribut').map(l => <Ligne key={l.cle} l={l} appliquer={() => faire([l.cle])} />)}</tbody>
            </table>
            {groupe('zone').length > 0 && (
                <div className="flex flex-col gap-1">
                    <span className={ETIQUETTE_RQ}>Localisations — PV totaux {derives.pvTotaux} (p. 55)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1">
                        {groupe('zone').map(l => (
                            <button key={l.cle} type="button" disabled={l.identique} onClick={() => faire([l.cle])} data-derive={l.cle}
                                title={l.identique ? l.detail : `${l.detail} — appliquer`}
                                className="flex flex-col items-center rounded-md border border-app-border/40 px-1 py-1 disabled:cursor-default enabled:hover:border-accent/50">
                                <span className="text-ui-9 text-app-text/60">{l.libelle}</span>
                                <span className={`font-mono font-black ${l.identique ? '' : 'text-accent'}`}>{l.surLaFiche} → {l.calcule}</span>
                                <span className={`text-ui-9 font-black uppercase tracking-widest ${l.identique ? 'text-etat-succes' : 'text-accent'}`}>{l.identique ? 'identique' : 'appliquer'}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {groupe('categorie').length > 0 && (
                <div className="flex flex-col gap-1">
                    <span className={ETIQUETTE_RQ}>Modificateurs de catégorie (p. 57-59)</span>
                    <table className="w-full border-collapse"><tbody>
                        {groupe('categorie').map(l => <Ligne key={l.cle} l={l} appliquer={() => faire([l.cle])} />)}
                    </tbody></table>
                    <span className="italic text-app-text/60">Les compétences ne sont pas modifiées : l’écart d’un modificateur est seulement annoncé.</span>
                </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-app-border/30 pt-2">
                <span className="italic text-app-text/60">Un maximum qui change garde les blessures : PV actuels = nouveau maximum − dégâts reçus.</span>
                <button type="button" className={BOUTON_PRINCIPAL_RQ} disabled={!aAppliquer.length} onClick={() => faire(aAppliquer.map(l => l.cle))}>
                    Appliquer tout ({aAppliquer.length})
                </button>
            </div>
        </div>
    );
};

const Jauge: React.FC<{ libelle: string; actuel: number; max: number }> = ({ libelle, actuel, max }) => (
    <div className="flex-1 min-w-[10rem] rounded-md border border-app-border/40 px-2 py-1" data-jauge-runequest={libelle}>
        <div className="flex items-baseline justify-between gap-2"><span className={ETIQUETTE_RQ}>{libelle}</span><span className="font-mono font-black">{actuel} / {max}</span></div>
        <div className="mt-1 h-1 rounded bg-app-border/30"><div className="h-1 rounded bg-accent" style={{ width: `${max > 0 ? Math.min(100, Math.max(0, (actuel / max) * 100)) : 0}%` }} /></div>
    </div>
);

const nombre = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const IMPORTANCES = Object.keys(LIBELLES_DES_JOURS_SAINTS) as ImportanceDuJourSaint[];

export const MagieEtProgressionRuneQuest: React.FC<{
    regle: RegleDeRuneQuest;
    sections: SheetSection[];
    valeurs: Record<string, unknown>;
    appliquer: (maj: Record<string, unknown>) => void;
    consigner: (ligne: string) => void;
    de?: (faces: number) => number;
}> = ({ regle, sections, valeurs, appliquer, consigner, de = f => DiceEngine.roll(f) }) => {
    const magie = regle.magie;
    const progression = regle.progression;
    const etat = lireLEtat(valeurs);
    const [dernier, setDernier] = useState<{ ligne: string; avant: Record<string, unknown> } | null>(null);
    const [culte, setCulte] = useState(0);
    const [importance, setImportance] = useState<ImportanceDuJourSaint>('saisonnier');
    const [statut, setStatut] = useState<StatutDuFidele | ''>('');
    const [situation, setSituation] = useState(0);
    const [resultatJourSaint, setResultatJourSaint] = useState<string | null>(null);
    const [aCocher, setACocher] = useState('');
    const [choixDesGains, setChoixDesGains] = useState<Record<string, '1d6' | '3'>>({});
    const [tests, setTests] = useState<(TestDExperience & { etat?: 'confirme' | 'ignore'; ligne?: string })[]>([]);

    const geste = (maj: Record<string, unknown>, ligne: string, avant?: Record<string, unknown>) => {
        if (!Object.keys(maj).length) return;
        appliquer(maj);
        consigner(ligne);
        setDernier(avant ? { ligne, avant } : null);
    };
    const ecrireLEtatSeul = (suivant: ReturnType<typeof lireLEtat>, ligne?: string) => {
        appliquer(ecrireLEtat(suivant));
        if (ligne) consigner(ligne);
    };
    const avantDe = (maj: Record<string, unknown>) => Object.fromEntries(Object.keys(maj).map(k => [k, valeurs[k]]));
    const nomDe = (champ: string) => libelleDuChamp(sections, valeurs, champ);

    const culteChoisi = magie?.cultes[culte];
    const statutLu = culteChoisi?.rang ? statutDuRang(String(valeurs[culteChoisi.rang] ?? '')) : 'initie';
    const statutRetenu = statut || statutLu;
    const venerationBase = culteChoisi?.veneration ? nombre(valeurs[culteChoisi.veneration]) : 0;
    const venerer = () => {
        if (!magie) return;
        const chances = venerationBase + situation;
        const d = de(100);
        const niveau = niveauDeRuneQuest(degreDuDe(d, echelleDeRuneQuest(chances)));
        const r = jourSaint(magie, valeurs, culte, importance, statutRetenu, niveau, de);
        const tete = `Vénération ${String(d).padStart(2, '0')} contre ${chances} % : ${LIBELLES_DE_RUNEQUEST[niveau].toLowerCase()}.`;
        if (r.refus) { setResultatJourSaint(r.refus); return; }
        setResultatJourSaint(`${tete} ${r.ligne}`);
        geste(r.maj, `${tete} ${r.ligne}`, r.avant);
    };

    const aptitudes = progression ? aptitudesDeLaFiche(progression, sections, valeurs) : [];
    const coches = etat.coches.map(champ => {
        const mod = progression ? modificateurDExperience(progression, valeurs, champ, sectionDuChamp(sections, champ)) : { valeur: 0 };
        return { champ, libelle: nomDe(champ), score: nombre(valeurs[champ]), mod: mod.valeur, categorie: mod.champ };
    });
    const lancerLesTests = () => {
        setTests(coches.map(c => testDExperience(c.champ, c.score, c.mod, de(100), choixDesGains[c.champ] ?? '1d6', de(6))));
    };
    const confirmer = (i: number) => {
        const t = tests[i];
        if (!progression || !t.reussi) return;
        const { maj, ligne } = appliquerLExperience(progression, valeurs, t);
        geste({ ...maj, ...ecrireLEtat(decocher(etat, t.champ)) }, `Expérience — ${nomDe(t.champ)} : ${t.d100}${t.modificateur ? ` ${t.modificateur > 0 ? '+' : '−'} ${Math.abs(t.modificateur)}` : ''} = ${t.total} contre ${t.score} % ; ${ligne} (p. 415).`);
        setTests(ts => ts.map((x, j) => (j === i ? { ...x, etat: 'confirme', ligne } : x)));
    };
    const ignorer = (i: number) => setTests(ts => ts.map((x, j) => (j === i ? { ...x, etat: 'ignore' } : x)));

    return (
        <div data-magie-progression-runequest className="flex flex-col gap-4 text-xs">
            {magie && (
                <section className="flex flex-col gap-2" data-ressources-runequest>
                    <span className={ETIQUETTE_RQ}>Ressources</span>
                    <div className="flex flex-wrap gap-2">
                        <Jauge libelle="Points de magie" actuel={nombre(valeurs[magie.pm])} max={magie.pmMax ? nombre(valeurs[magie.pmMax]) : nombre(valeurs[magie.pou])} />
                        {magie.cultes.map((c, i) => (c.prMax && nombre(valeurs[c.prMax]) > 0) || i === 0
                            ? <Jauge key={c.pr} libelle={`Points de Rune — ${nomDuCulte(magie, valeurs, i)}`} actuel={nombre(valeurs[c.pr])} max={c.prMax ? nombre(valeurs[c.prMax]) : 0} />
                            : null)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className={BOUTON_RQ} onClick={() => { const r = reposDeSixHeures(magie, valeurs); geste(r.maj, r.ligne, avantDe(r.maj)); }}>
                            Repos de 6 h : +{Math.round(nombre(valeurs[magie.pou]) / 4)} PM <span className="italic text-app-text/60">(¼ du POU {nombre(valeurs[magie.pou])}, p. 54)</span>
                        </button>
                        <button type="button" className={BOUTON_RQ} onClick={() => { const r = journeeEntiere(magie, valeurs); geste(r.maj, r.ligne, avantDe(r.maj)); }}>
                            Journée entière : PM au maximum
                        </button>
                    </div>
                    <div className="flex flex-col gap-1 rounded-md border border-app-border/40 p-2" data-jour-saint>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={ETIQUETTE_RQ}>Jour saint</span>
                            <label className="flex items-center gap-1">Culte
                                <select aria-label="Culte du jour saint" className={CHAMP_RQ} value={culte} onChange={e => { setCulte(Number(e.target.value)); setStatut(''); }}>
                                    {magie.cultes.map((_, i) => <option key={i} value={i}>{nomDuCulte(magie, valeurs, i)}</option>)}
                                </select>
                            </label>
                            <label className="flex items-center gap-1">Importance
                                <select aria-label="Importance du jour saint" className={CHAMP_RQ} value={importance} onChange={e => setImportance(e.target.value as ImportanceDuJourSaint)}>
                                    {IMPORTANCES.map(i => <option key={i} value={i}>{LIBELLES_DES_JOURS_SAINTS[i]}</option>)}
                                </select>
                            </label>
                            <label className="flex items-center gap-1" title="Initié, ou Chantre sacré, Prêtre runique, Seigneur runique : lu dans le rang du culte (p. 315).">Statut
                                <select aria-label="Statut du fidèle" className={CHAMP_RQ} value={statutRetenu} onChange={e => setStatut(e.target.value as StatutDuFidele)}>
                                    <option value="initie">Initié</option><option value="maitre">Maître des Runes</option>
                                </select>
                            </label>
                            <span>Vénération {venerationBase} %</span>
                            <label className="flex items-center gap-1" title="Un grand temple pendant un jour saint saisonnier : +50 % (Sorala, p. 315).">Situation
                                <input aria-label="Situation de la Vénération" type="number" step={5} value={situation} className={`w-14 ${CHAMP_RQ}`} onChange={e => setSituation(Math.trunc(Number(e.target.value)) || 0)} />%
                            </label>
                            <button type="button" className={BOUTON_PRINCIPAL_RQ} onClick={venerer}>Test de Vénération</button>
                        </div>
                        {resultatJourSaint && <span className="italic text-app-text/70" data-resultat-jour-saint>{resultatJourSaint}</span>}
                    </div>
                    {dernier && (
                        <span className="italic text-app-text/60" data-dernier-geste>
                            Dernier geste : {dernier.ligne}{' '}
                            <button type="button" className="underline text-accent" onClick={() => { appliquer(dernier.avant); consigner(`Annulé : ${dernier.ligne}`); setDernier(null); }}>Annuler</button>
                        </span>
                    )}
                </section>
            )}

            {progression && (
                <section className="flex flex-col gap-1 border-t border-app-border/30 pt-2" data-inspiration-en-cours>
                    <span className={ETIQUETTE_RQ}>Inspiration en cours</span>
                    {etat.inspiration
                        ? <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-app-border/40 px-2 py-1">
                            <span><b>{etat.inspiration.aptitudeLibelle} +{etat.inspiration.bonus} %</b> — {etat.inspiration.sourceLibelle}, {LIBELLES_DE_RUNEQUEST[etat.inspiration.niveau].toLowerCase()}</span>
                            <button type="button" className={BOUTON_RQ} onClick={() => ecrireLEtatSeul(finDeLaSituation(etat), `Fin de la situation : l’inspiration (${etat.inspiration!.sourceLibelle}) prend fin.`)}>Fin de la situation</button>
                        </div>
                        : <span className="text-app-text/60">Aucune.</span>}
                    {etat.malusDeSituation && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>Découragé : −10 % à tous les tests ({etat.malusDeSituation.sourceLibelle}, p. 236)</span>
                            {!etat.inspiration && <button type="button" className={BOUTON_RQ} onClick={() => ecrireLEtatSeul(finDeLaSituation(etat), 'Fin de la situation : le découragement prend fin.')}>Fin de la situation</button>}
                        </div>
                    )}
                    {!etat.inspiration && !etat.malusDeSituation && etat.situationTentee && (
                        <button type="button" className={`${BOUTON_RQ} self-start`} onClick={() => ecrireLEtatSeul(finDeLaSituation(etat))}>Fin de la situation (rouvre l’inspiration)</button>
                    )}
                    {Object.entries(etat.malusDesRunes).map(([rune, m]) => (
                        <div key={rune} className="flex flex-wrap items-center justify-between gap-2">
                            <span>{m.sourceLibelle} : {m.valeur} % aux tests de cette Rune (p. 229)</span>
                            <button type="button" className={BOUTON_RQ} onClick={() => ecrireLEtatSeul(journeeDeMeditation(etat, rune), `${m.sourceLibelle} : une journée entière de méditation lève le malus (p. 229).`)}>Journée de méditation</button>
                        </div>
                    ))}
                    {etat.runesInspirees.length > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 italic text-app-text/60">
                            <span>Déjà utilisées cette session : {etat.runesInspirees.map(nomDe).join(', ')}.</span>
                            <button type="button" className={BOUTON_RQ} onClick={() => ecrireLEtatSeul(nouvelleSession(etat))}>Nouvelle session</button>
                        </div>
                    )}
                    <span className="italic text-app-text/60">Une seule inspiration par situation (p. 229, 236).</span>
                </section>
            )}

            {progression && (
                <section className="flex flex-col gap-2 border-t border-app-border/30 pt-2" data-experience-runequest>
                    <span className={ETIQUETTE_RQ}>Tests d’expérience (p. 415)</span>
                    {coches.length === 0 && <span className="text-app-text/60">Aucune aptitude cochée.</span>}
                    {coches.map(c => (
                        <div key={c.champ} className="flex items-center justify-between gap-2 rounded-md border border-app-border/40 px-2 py-1" data-coche={c.champ}>
                            <span><span className="font-black text-accent">✓</span> {c.libelle} {c.score} %{c.categorie ? ` · ${libelleDuChamp(sections, valeurs, c.categorie)} ${c.mod > 0 ? '+' : ''}${c.mod} %` : ''}</span>
                            <span className="flex items-center gap-2">
                                <label className="flex items-center gap-1" title="À annoncer avant le lancer (p. 415).">
                                    <input type="radio" name={`gain-${c.champ}`} checked={(choixDesGains[c.champ] ?? '1d6') === '1d6'} onChange={() => setChoixDesGains(g => ({ ...g, [c.champ]: '1d6' }))} />+1D6 %
                                </label>
                                <label className="flex items-center gap-1">
                                    <input type="radio" name={`gain-${c.champ}`} checked={choixDesGains[c.champ] === '3'} onChange={() => setChoixDesGains(g => ({ ...g, [c.champ]: '3' }))} />+3 %
                                </label>
                                <button type="button" aria-label={`Retirer la coche de ${c.libelle}`} className={BOUTON_RQ} onClick={() => ecrireLEtatSeul(decocher(etat, c.champ))}>×</button>
                            </span>
                        </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-2">
                        <select aria-label="Aptitude à cocher" className={CHAMP_RQ} value={aCocher} onChange={e => setACocher(e.target.value)}>
                            <option value="">Cocher une aptitude…</option>
                            {aptitudes.filter(a => !etat.coches.includes(a.champ)).map(a => <option key={a.champ} value={a.champ}>{a.libelle} ({a.valeur})</option>)}
                        </select>
                        <button type="button" className={BOUTON_RQ} disabled={!aCocher} onClick={() => { ecrireLEtatSeul(cocher(etat, aCocher), `Test d’expérience coché : ${nomDe(aCocher)}.`); setACocher(''); }}>Cocher</button>
                    </div>
                    <div className="flex flex-col gap-2 rounded-md border border-app-border/40 p-2" data-fin-de-saison>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={ETIQUETTE_RQ}>Fin de saison</span>
                            <button type="button" className={BOUTON_PRINCIPAL_RQ} disabled={!coches.length} onClick={lancerLesTests}>Lancer les tests ({coches.length})</button>
                        </div>
                        {tests.length > 0 && (
                            <table className="w-full border-collapse">
                                <thead><tr className={ETIQUETTE_RQ}>
                                    <th className="text-left font-black">Aptitude</th><th className="font-black">1D100 + mod.</th><th className="font-black">Score</th>
                                    <th className="font-black">Issue</th><th className="text-left font-black">Gain</th><th />
                                </tr></thead>
                                <tbody>
                                    {tests.map((t, i) => (
                                        <tr key={t.champ} className="border-t border-app-border/20" data-test-experience={t.champ}>
                                            <td className="py-1 font-bold">{nomDe(t.champ)}</td>
                                            <td className="py-1 text-center font-mono">{t.modificateur ? `${t.d100} ${t.modificateur > 0 ? '+' : '−'} ${Math.abs(t.modificateur)} = ${t.total}` : t.d100}</td>
                                            <td className="py-1 text-center font-mono">{t.score}</td>
                                            <td className={`py-1 text-center text-ui-9 font-black uppercase tracking-widest ${t.reussi ? 'text-etat-succes' : 'text-app-text/50'}`}>{t.reussi ? 'réussi' : 'raté'}</td>
                                            <td className="py-1 font-mono">{t.reussi ? (t.ligne ?? `+${t.gain} %`) : '—'}</td>
                                            <td className="py-1 text-right">
                                                {t.reussi && !t.etat && <span className="flex justify-end gap-1">
                                                    <button type="button" className={BOUTON_RQ} onClick={() => confirmer(i)}>Confirmer</button>
                                                    <button type="button" className={BOUTON_RQ} onClick={() => ignorer(i)}>Ignorer</button>
                                                </span>}
                                                {t.etat && <span className="italic text-app-text/60">{t.etat === 'confirme' ? 'écrit' : 'ignoré'}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <button type="button" className={BOUTON_RQ} disabled={!etat.coches.length} onClick={() => { ecrireLEtatSeul(effacerLesCoches(etat), 'Coches d’expérience effacées (p. 415).'); setTests([]); }}>Effacer les coches</button>
                            <span className="italic text-app-text/60">Rien ne s’écrit sur la fiche sans « Confirmer ».</span>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
