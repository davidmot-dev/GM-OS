import React, { useMemo, useState } from 'react';
import { HeartPulse } from 'lucide-react';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useDiceStore } from '../../../../stores/useDiceStore';
import { useClockStore } from '../../../../store/useClockStore';
import { gmToast } from '../../../../stores/useToastStore';
import { DiceEngine } from '../../../dice/DiceEngine';
import { facesDuNiveau, type ModificateurDeDes } from '../../../dice/desEchelonnes';
import { entreeDeLaTable, forcagesPermis, prixDuForcage, type RegleDuForcage } from '../../../dice/systemes/yearZero';
import { pontDesTables } from '../../../tables/pontDesTables';
import { seanceOuverteDe } from '../../logic/seanceOuverte';
import {
    ajouterLaBlessure, blessuresMortelles, dejaUtilise, ecrireLeSuivi, estEchue, forcerBR, guerir,
    lancerBR, lireLaBlessure, lireLeSuivi, oublier, poigneeBR, sauvegarder, secourir, soigner, stabiliser,
    type BlessureBR, type JetBR, type RegleBladeRunner, type SuiviBR,
} from '../../../dice/systemes/bladeRunner';
import type { TableEntry } from '../../../tables/types';

/**
 * **Blessures critiques et secours de Blade Runner** — B3 à B7, 2026-10-24.
 *
 * Sur la carte du combattant et sur la fiche : les blessures critiques suivies
 * une à une (sauvegarde contre la mort, stabilisation, soins, échéance), les
 * secours d'un Brisé, l'objet fétiche. Le livre et ses pages sont dans
 * `systemes/bladeRunner.ts` ; ce fichier les met en gestes.
 *
 * Chaque jet s'y lance, ou **se reporte** (« Réussi », « Raté ») quand il a été
 * fait ailleurs — un soigneur qui force son jet depuis sa propre fiche, par
 * exemple. *Le meneur choisit le moment de chaque geste* : l'outil ne sait pas
 * quand un Quart s'achève.
 */

type Ref = { univers: string; table: string };
interface RegleDuTirage { tables?: { label: string; table: Ref }[]; desAuChoix?: number[] }

interface Props {
    regle: RegleBladeRunner;
    /** La règle du forçage du pilote : la sauvegarde contre la mort se force (pas Brisé). */
    forcer?: RegleDuForcage;
    /** Les tables de blessures critiques et les dés de critique (`combat.horsJeu`). */
    tirage?: RegleDuTirage;
    valeurs: Record<string, unknown>;
    ecrire: (maj: Record<string, unknown>) => void;
    nom: string;
    /** Le personnage lui-même : il ne se prodigue pas ses premiers secours. */
    personnageId?: string;
    /** La tablette d'un joueur : on lit, on n'agit pas. */
    joueur?: boolean;
}

const BOUTON = 'px-2 py-1 rounded-lg border text-ui-10 font-bold transition-colors';
const B_DANGER = `${BOUTON} border-etat-danger/50 text-etat-danger hover:bg-etat-danger/20`;
const B_SUCCES = `${BOUTON} border-etat-succes/50 text-etat-succes hover:bg-etat-succes/20`;
const B_NEUTRE = `${BOUTON} border-app-border/50 text-app-text/70 hover:bg-app-text/10`;
const SELECT = 'rounded-lg border border-app-border/40 bg-app-bg py-1 pl-2 pr-7 text-ui-10';
const LETTRES = ['A', 'B', 'C', 'D'];

const nombre = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const de = (faces: number) => DiceEngine.roll(faces);

/** Le jet, dit au journal et à l'historique du pupitre. */
function consigner(titre: string, jet: JetBR, suite: string) {
    useDiceStore.getState().setLastRoll({
        id: `br-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date(), title: titre,
        total: jet.reussites, modifier: 0, successes: jet.reussites, tagSuccess: jet.reussites > 0,
        rolls: jet.des.map(d => ({ val: d.val, sides: d.faces, source: 'base' as const })),
        totalDisplay: `${jet.reussites} réussite${jet.reussites > 1 ? 's' : ''} (${jet.des.map(d => `D${d.faces} ${d.val}`).join(', ')}) — ${suite}`,
    });
}

const direLeJet = (jet: JetBR) => `${jet.des.map(d => `D${d.faces} ${d.val}`).join(', ')} : ${jet.reussites} réussite${jet.reussites > 1 ? 's' : ''}`;

/**
 * **Qui lance** : le blessé lui-même, un personnage du groupe (sa fiche donne
 * ses dés), ou un PNJ dont on donne les deux lettres.
 */
const ChoixDuLanceur: React.FC<{
    champs: [string, string]; libelle: string; soi?: boolean; exclu?: string;
    valeur: string; poser: (v: string) => void; pnj: [string, string]; poserPnj: (p: [string, string]) => void;
}> = ({ champs, libelle, soi, exclu, valeur, poser, pnj, poserPnj }) => {
    const joueurs = useSessionOSStore(s => s.players);
    const personnages = useMemo(() => joueurs.flatMap(p => p.characters), [joueurs]);
    const allies = personnages.filter(c => c.id !== exclu && champs.every(ch => facesDuNiveau(c.sheetData?.[ch]) !== null));
    return (
        <span className="flex flex-wrap items-center gap-1">
            <select aria-label={libelle} value={valeur} onChange={e => poser(e.target.value)} className={SELECT}>
                {soi && <option value="soi">Lui-même</option>}
                {allies.map(c => <option key={c.id} value={`pj:${c.id}`}>{c.name}</option>)}
                <option value="pnj">Un PNJ</option>
            </select>
            {valeur === 'pnj' && pnj.map((l, i) => (
                <select key={i} aria-label={`${libelle} — ${i === 0 ? 'attribut' : 'compétence'} du PNJ`} value={l}
                    onChange={e => poserPnj(i === 0 ? [e.target.value, pnj[1]] : [pnj[0], e.target.value])} className={SELECT}>
                    {LETTRES.map(x => <option key={x} value={x}>{i === 0 ? 'Attr.' : 'Comp.'} {x}</option>)}
                </select>
            ))}
        </span>
    );
};

/** Les deux dés d'un lanceur, d'après son choix. */
function useSourcesDuLanceur(champs: [string, string], valeurs: Record<string, unknown>) {
    const joueurs = useSessionOSStore(s => s.players);
    const personnages = useMemo(() => joueurs.flatMap(p => p.characters), [joueurs]);
    return (choix: string, pnj: [string, string]) => {
        if (choix === 'pnj') return pnj.map((l, i) => ({ label: i === 0 ? 'Attribut du PNJ' : 'Compétence du PNJ', niveau: l }));
        const fiche = choix.startsWith('pj:') ? personnages.find(c => `pj:${c.id}` === choix)?.sheetData ?? {} : valeurs;
        return champs.map(ch => ({ label: ch, niveau: fiche[ch] }));
    };
}

/** Un geste de soin : qui lance, l'avantage du matériel, lancer — ou reporter un jet fait ailleurs. */
const GesteDeSoin: React.FC<{
    titre: string; aide: string; champs: [string, string]; valeurs: Record<string, unknown>;
    soi?: boolean; exclu?: string; materiel?: string;
    /** Le résultat : le nombre de réussites (0 : raté). */
    conclure: (reussites: number, jet?: JetBR) => void;
}> = ({ titre, aide, champs, valeurs, soi, exclu, materiel, conclure }) => {
    const [choixDuLanceur, setLanceur] = useState(soi ? 'soi' : 'pnj');
    // Tombé entre-temps, il ne se soigne plus lui-même : un PNJ prend la main.
    const lanceur = !soi && choixDuLanceur === 'soi' ? 'pnj' : choixDuLanceur;
    const [pnj, setPnj] = useState<[string, string]>(['C', 'C']);
    const [avecMateriel, setAvecMateriel] = useState(false);
    const sources = useSourcesDuLanceur(champs, valeurs);
    const lancer = () => {
        // Se soigner soi-même : désavantage (p. 72). Le matériel : avantage. Les deux s'annulent.
        const mods = (avecMateriel ? 1 : 0) - (lanceur === 'soi' ? 1 : 0);
        const modificateur: ModificateurDeDes = mods > 0 ? 'avantage' : mods < 0 ? 'desavantage' : 'aucun';
        const poignee = poigneeBR(sources(lanceur, pnj), modificateur);
        if (poignee.length === 0) { gmToast(`${titre} : la fiche du lanceur ne dit pas ses niveaux — reportez le jet.`, 'warning'); return; }
        const jet = lancerBR(poignee, de);
        conclure(jet.reussites, jet);
    };
    return (
        <div className="flex flex-wrap items-center gap-2" title={aide}>
            <span className="text-ui-10 font-bold text-app-text/70">{titre}</span>
            <ChoixDuLanceur champs={champs} libelle={`${titre} — qui lance`} soi={soi} exclu={exclu}
                valeur={lanceur} poser={setLanceur} pnj={pnj} poserPnj={setPnj} />
            {materiel && (
                <label className="flex items-center gap-1 text-ui-10 text-app-text/60">
                    <input type="checkbox" checked={avecMateriel} onChange={e => setAvecMateriel(e.target.checked)} /> {materiel}
                </label>
            )}
            <button type="button" onClick={lancer} className={B_NEUTRE}>Lancer</button>
            <button type="button" onClick={() => conclure(1)} className={B_SUCCES} title="Le jet a été fait ailleurs, et réussi">Réussi</button>
            <button type="button" onClick={() => conclure(0)} className={B_DANGER} title="Le jet a été fait ailleurs, et raté">Raté</button>
        </div>
    );
};

const ETATS: Record<BlessureBR['etat'], string> = {
    'menace': 'Mortelle', 'a-soigner': 'À soigner', 'en-guerison': 'En guérison', 'guerie': 'Guérie',
    'permanente': 'Permanente', 'fatale': 'Décès',
};

const SuiviBladeRunner: React.FC<Props> = ({ regle, forcer, tirage, valeurs, ecrire, nom, personnageId, joueur }) => {
    const suivi = lireLeSuivi(valeurs);
    const maintenant = useClockStore(s => (s.mode === 'fantasy' ? undefined : s.timestamp));
    const seanceOuverte = useSessionOSStore(s => seanceOuverteDe(s.campaigns, s.sessions, s.activeCampaignId)?.id);
    // « Une fois par séance » : la séance ouverte, ou à défaut la journée.
    const seance = seanceOuverte ?? `jour ${new Date().toDateString()}`;
    const [ouvert, setOuvert] = useState(false);
    const [sauvegarde, setSauvegarde] = useState<{ id: string; jet: JetBR; forcages: number; payes: number } | null>(null);
    const [aggravation, setAggravation] = useState<{ tirages: number[]; faces: number; table: number } | null>(null);
    const [tableChoisie, setTableChoisie] = useState(0);
    const [deChoisi, setDeChoisi] = useState(tirage?.desAuChoix?.[0] ?? 6);
    const [nbDes, setNbDes] = useState(1);

    const sante = nombre(valeurs[regle.sante]);
    const sangFroid = nombre(valeurs[regle.sangFroid]);
    const briseDegats = valeurs[regle.sante] !== undefined && valeurs[regle.sante] !== '' && sante <= 0;
    const briseStress = valeurs[regle.sangFroid] !== undefined && valeurs[regle.sangFroid] !== '' && sangFroid <= 0;
    const tables = tirage?.tables ?? [];
    const visibles = suivi.blessures.filter(b => b.etat !== 'guerie');

    const appliquer = (apres: SuiviBR, extra: Record<string, unknown> = {}) => ecrire({ ...ecrireLeSuivi(regle, apres, valeurs), ...extra });

    // — La blessure critique : la table, le dé de l'arme, les dés aggravés, puis le choix du résultat (p. 71).
    const tirer = () => {
        const faces = deChoisi;
        const tirages = Array.from({ length: Math.max(1, nbDes) }, () => de(faces));
        if (tirages.length === 1) { void retenir(tirages[0], faces, tableChoisie); return; }
        setAggravation({ tirages, faces, table: tableChoisie });
    };
    const retenir = async (valeur: number, faces: number, rang: number) => {
        setAggravation(null);
        const choix = tables[rang];
        const pont = pontDesTables();
        const data = choix && pont ? await pont.loadTable(choix.table.univers, choix.table.table).catch(() => null) : null;
        const entree: TableEntry | undefined = data ? entreeDeLaTable(data.entries, valeur) : undefined;
        if (!entree) { gmToast(`Blessure critique : la table « ${choix?.label ?? '?'} » ne se lit pas — notez-la à la main.`, 'warning'); return; }
        const b = lireLaBlessure(entree, `br-${crypto.randomUUID()}`, { table: choix.label, de: valeur });
        useDiceStore.getState().setLastRoll({
            id: `${b.id}-tirage`, timestamp: new Date(), title: `${nom} — blessure critique · ${choix.label}`, total: valeur, modifier: 0,
            rolls: [{ val: valeur, sides: faces }], tagSuccess: false, totalDisplay: `${valeur} — ${entree.title} : ${entree.effect ?? ''} (D${faces})`,
        });
        appliquer(ajouterLaBlessure(lireLeSuivi(valeurs), b));
        if (b.etat === 'fatale') gmToast(`${nom} : ${b.titre} — mort instantanée (p. 72).`, 'error');
    };

    // — La sauvegarde contre la mort : Endurance ; forçable si le personnage n'est pas Brisé (p. 72).
    const lancerLaSauvegarde = (b: BlessureBR) => {
        const poignee = poigneeBR(regle.endurance.map(ch => ({ label: ch, niveau: valeurs[ch] })));
        if (poignee.length === 0) { gmToast('Sauvegarde contre la mort : la fiche ne dit pas Vigueur et Endurance — reportez le jet.', 'warning'); return; }
        const jet = lancerBR(poignee, de);
        consigner(`${nom} — sauvegarde contre la mort (${b.titre})`, jet, jet.reussites ? 'il tient' : 'ratée');
        if (jet.reussites > 0 || briseDegats || !forcer) { conclureLaSauvegarde(b, jet.reussites > 0); return; }
        setSauvegarde({ id: b.id, jet, forcages: 0, payes: 0 });
    };
    const forcerLaSauvegarde = () => {
        if (!sauvegarde || !forcer) return;
        const jet = forcerBR(sauvegarde.jet, de);
        const prix = prixDuForcage(forcer, {
            resultat: { total: 0, modifier: 0, totalDisplay: '', rolls: jet.des.map(d => ({ val: d.val, sides: d.faces, source: 'base' as const })) },
            valeurs, choix: { attribut: regle.endurance[0] }, dejaPayes: sauvegarde.payes,
        });
        const extra: Record<string, unknown> = {};
        if (prix && prix.points > 0) extra[prix.champ] = Math.max(0, nombre(valeurs[prix.champ]) - prix.points);
        consigner(`${nom} — sauvegarde forcée`, jet, `${jet.reussites ? 'il tient' : 'ratée'}${prix?.points ? ` ; −${prix.points} ${prix.label}` : ''}`);
        const suite = { ...sauvegarde, jet, forcages: sauvegarde.forcages + 1, payes: prix?.uns ?? sauvegarde.payes };
        const encore = suite.forcages < forcagesPermis(forcer, valeurs, { attribut: regle.endurance[0] });
        const blessure = lireLeSuivi(valeurs).blessures.find(x => x.id === sauvegarde.id);
        if (blessure && (jet.reussites > 0 || !encore)) { conclureLaSauvegarde(blessure, jet.reussites > 0, extra); return; }
        if (Object.keys(extra).length) ecrire(extra);
        setSauvegarde(suite);
    };
    const conclureLaSauvegarde = (b: BlessureBR, reussie: boolean, extra: Record<string, unknown> = {}) => {
        setSauvegarde(null);
        appliquer(sauvegarder(lireLeSuivi(valeurs), b.id, reussie), extra);
        gmToast(reussie ? `${nom} tient bon jusqu'à la prochaine limite (${b.limite === 'round' ? 'Round' : 'Quart'}).` : `${nom} succombe : ${b.titre}.`, reussie ? 'success' : 'error');
    };

    // — Premiers secours, main secourable : un Brisé seulement (p. 71, 76).
    const relever = (champ: string, max: string, reussites: number, quoi: string) => {
        const gain = secourir(nombre(valeurs[champ]), nombre(valeurs[max]), reussites);
        if (gain === null) { gmToast(`${quoi} : raté.`, 'warning'); return; }
        ecrire({ [champ]: gain });
        gmToast(`${nom} se relève : ${champ === regle.sante ? 'Santé' : 'Sang-froid'} ${gain}.`, 'success');
    };

    const fetiche = regle.objetFetiche ? String(valeurs[regle.objetFetiche] ?? '').trim() : '';
    const fetichePossible = !!fetiche && !briseStress && sangFroid < nombre(valeurs[regle.sangFroidMax]) && !dejaUtilise(suivi, 'objetFetiche', seance);

    if (joueur && visibles.length === 0) return null;
    return (
        <div data-suivi-blade-runner className="mx-3 my-2 space-y-2 rounded-lg border border-etat-danger/30 bg-etat-danger/5 p-2">
            <p className="flex items-center gap-2 text-ui-11 font-black uppercase tracking-widest text-etat-danger">
                <HeartPulse size={12} /> Blessures critiques
                {blessuresMortelles(suivi).length > 0 && <span className="normal-case tracking-normal">— en danger de mort</span>}
            </p>

            {visibles.length === 0 && <p className="text-ui-10 text-app-text/50">Aucune blessure critique suivie.</p>}
            {visibles.map(b => (
                <div key={b.id} data-blessure={b.etat} className="space-y-1 rounded-md border border-app-border/30 p-1.5">
                    <p className="text-ui-11 text-app-text/80">
                        <strong>{b.titre}</strong>{b.table ? ` (${b.table}${b.de ? `, ${b.de}` : ''})` : ''} — <em>{ETATS[b.etat]}</em>
                        {b.etat === 'menace' && ` : sauvegarde contre la mort à chaque ${b.limite === 'round' ? 'Round' : 'Quart'}${b.survies ? ` (${b.survies} réussie${b.survies > 1 ? 's' : ''})` : ''}`}
                        {b.etat === 'a-soigner' && b.guerison && ` — guérison : ${b.guerison === 'permanent' ? 'incurable, un implant médical y remédie (p. 72, 193)' : b.guerison === 'mois' ? 'un mois' : 'une semaine'}`}
                        {b.etat === 'en-guerison' && (b.echeance !== undefined
                            ? ` jusqu'au ${new Date(b.echeance).toLocaleDateString('fr-FR')}${estEchue(b, maintenant) ? ' — échue' : ''}`
                            : ' jusqu’à la fin de sa durée')}
                        {b.etat === 'permanente' && ' — un implant médical y remédie (p. 193)'}
                    </p>
                    {b.effet && b.etat !== 'fatale' && <p className="text-ui-10 text-app-text/60">{b.effet}</p>}
                    {!joueur && b.etat === 'menace' && (
                        <div className="space-y-1">
                            {sauvegarde?.id === b.id ? (
                                <div className="flex flex-wrap items-center gap-2 text-ui-10">
                                    <span>Sauvegarde ratée ({direLeJet(sauvegarde.jet)}).</span>
                                    <button type="button" onClick={forcerLaSauvegarde} className={B_NEUTRE}>Forcer la sauvegarde</button>
                                    <button type="button" onClick={() => conclureLaSauvegarde(b, false)} className={B_DANGER}>Il succombe</button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" onClick={() => lancerLaSauvegarde(b)} className={B_DANGER}
                                        title={briseDegats ? 'Brisé : il lance, mais ne peut pas forcer (p. 72)' : 'Endurance ; ratée, elle peut se forcer (p. 72)'}>
                                        Sauvegarde contre la mort (Endurance)
                                    </button>
                                    <button type="button" onClick={() => conclureLaSauvegarde(b, true)} className={B_SUCCES} title="Faite ailleurs, et réussie">Réussie</button>
                                    <button type="button" onClick={() => conclureLaSauvegarde(b, false)} className={B_DANGER} title="Faite ailleurs, et ratée">Ratée</button>
                                </div>
                            )}
                            <GesteDeSoin titre="Stabiliser" champs={regle.assistanceMedicale} valeurs={valeurs} soi={!briseDegats} exclu={briseDegats ? personnageId : undefined}
                                materiel="Hôpital ou trousse de chirurgien"
                                aide={`Assistance médicale, aussi long que la limite (${b.limite === 'round' ? 'un Round' : 'un Quart'}). Réussi : ${b.limite === 'round' ? 'la limite passe à un Quart' : 'hors de danger'}. Soi-même : désavantage (p. 72).`}
                                conclure={(n, jet) => {
                                    if (jet) consigner(`${nom} — stabilisation (${b.titre})`, jet, n ? 'réussie' : 'ratée, à retenter après la sauvegarde');
                                    appliquer(stabiliser(lireLeSuivi(valeurs), b.id, n > 0));
                                    gmToast(n > 0 ? (b.limite === 'round' ? `${b.titre} : la limite passe à un Quart.` : `${b.titre} : stabilisée, plus de sauvegarde.`) : 'Stabilisation ratée : retentez après la sauvegarde.', n > 0 ? 'success' : 'warning');
                                }} />
                        </div>
                    )}
                    {!joueur && b.etat === 'a-soigner' && (b.guerison === 'permanent' ? (
                        <button type="button" onClick={() => appliquer(soigner(lireLeSuivi(valeurs), b.id, false))} className={B_NEUTRE}>Incurable : la noter permanente</button>
                    ) : (
                        <GesteDeSoin titre="Soins (un Quart)" champs={regle.assistanceMedicale} valeurs={valeurs} soi={!briseDegats} exclu={briseDegats ? personnageId : undefined}
                            materiel="Matériel professionnel (hôpital)"
                            aide="Un Quart de soins et un jet d'Assistance médicale : réussi, l'effet cesse à la fin de la durée ; raté, la blessure devient permanente (p. 72)."
                            conclure={(n, jet) => {
                                if (jet) consigner(`${nom} — soins (${b.titre})`, jet, n ? 'guérison en cours' : 'la blessure devient permanente');
                                appliquer(soigner(lireLeSuivi(valeurs), b.id, n > 0, maintenant));
                            }} />
                    ))}
                    {!joueur && b.etat === 'en-guerison' && (
                        <button type="button" onClick={() => appliquer(guerir(lireLeSuivi(valeurs), b.id))}
                            className={estEchue(b, maintenant) ? B_SUCCES : B_NEUTRE}>Guérie</button>
                    )}
                    {!joueur && (b.etat === 'permanente' || b.etat === 'fatale') && (
                        <button type="button" onClick={() => appliquer(oublier(lireLeSuivi(valeurs), b.id))} className={B_NEUTRE}>Ne plus la suivre</button>
                    )}
                </div>
            ))}

            {!joueur && aggravation && (
                <div data-critiques-aggraves className="flex flex-wrap items-center gap-2 text-ui-10">
                    <span>Critique aggravé — gardez un résultat :</span>
                    {aggravation.tirages.map((v, i) => (
                        <button key={i} type="button" onClick={() => { void retenir(v, aggravation.faces, aggravation.table); }} className={B_DANGER}>{v}</button>
                    ))}
                </div>
            )}
            {!joueur && tables.length > 0 && !aggravation && (ouvert || briseDegats ? (
                <div className="flex flex-wrap items-center gap-2">
                    {tables.length > 1 && (
                        <select aria-label="Table" value={tableChoisie} onChange={e => setTableChoisie(Number(e.target.value))} className={SELECT}>
                            {tables.map((t, i) => <option key={t.label} value={i}>{t.label}</option>)}
                        </select>
                    )}
                    <select aria-label="Dé de critique" value={deChoisi} onChange={e => setDeChoisi(Number(e.target.value))} className={SELECT}
                        title="Le dé de critique de l'arme ; à mains nues ou arme percutante de mêlée, le dé de Vigueur de l'attaquant (p. 68)">
                        {(tirage?.desAuChoix?.length ? tirage.desAuChoix : [6, 8, 10, 12]).map(f => <option key={f} value={f}>D{f}</option>)}
                    </select>
                    <select aria-label="Dés de critique" value={nbDes} onChange={e => setNbDes(Number(e.target.value))} className={SELECT}
                        title="Critiques aggravés : un dé de plus par réussite au-delà de celles qu'exige la touche critique, et l'on garde le résultat voulu (p. 71)">
                        {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n === 1 ? '1 dé' : `${n} dés (aggravé)`}</option>)}
                    </select>
                    <button type="button" onClick={tirer} className={B_DANGER}>{visibles.length ? 'Encore une blessure critique' : 'Blessure critique'}</button>
                    {nbDes > 1 && <span className="text-ui-10 text-app-text/50">{`soit ${nbDes + 1} réussites au tir, ou ${nbDes + 1} d'écart en mêlée`}</span>}
                </div>
            ) : (
                <button type="button" onClick={() => setOuvert(true)} className={B_NEUTRE} title="Une touche à deux réussites inflige une blessure critique, même avant zéro (p. 69–71)">
                    Blessure critique…
                </button>
            ))}

            {!joueur && briseDegats && (
                <div className="space-y-1 border-t border-app-border/30 pt-1">
                    <GesteDeSoin titre="Premiers secours" champs={regle.assistanceMedicale} valeurs={valeurs} exclu={personnageId}
                        materiel="Colle médicale"
                        aide="Une autre personne, Assistance médicale : autant de Santé que de réussites (p. 71)."
                        conclure={(n, jet) => { if (jet) consigner(`${nom} — premiers secours`, jet, n ? `+${n} Santé` : 'ratés'); relever(regle.sante, regle.santeMax, n, 'Premiers secours'); }} />
                    <button type="button" onClick={() => relever(regle.sante, regle.santeMax, 1, 'Récupération')} className={B_NEUTRE}
                        title="Personne pour l'aider : 1 point de Santé au bout d'un Quart (p. 71)">Seul, au bout d'un Quart : +1 Santé</button>
                </div>
            )}
            {!joueur && briseStress && (
                <div className="space-y-1 border-t border-app-border/30 pt-1">
                    <GesteDeSoin titre="Main secourable" champs={regle.manipulation} valeurs={valeurs} exclu={personnageId}
                        aide="Un autre lui parle, Manipulation : autant de Sang-froid que de réussites ; en combat, c'est une action (p. 76)."
                        conclure={(n, jet) => { if (jet) consigner(`${nom} — main secourable`, jet, n ? `+${n} Sang-froid` : 'ratée'); relever(regle.sangFroid, regle.sangFroidMax, n, 'Main secourable'); }} />
                    <button type="button" onClick={() => relever(regle.sangFroid, regle.sangFroidMax, 1, 'Récupération')} className={B_NEUTRE}
                        title="Personne pour l'aider : 1 point de Sang-froid au bout d'un Quart (p. 76)">Seul, au bout d'un Quart : +1 Sang-froid</button>
                </div>
            )}
            {!joueur && fetichePossible && (
                <button type="button" className={B_SUCCES} title="Une fois par séance, pas Brisé : +1 Sang-froid sans pause (p. 76)"
                    onClick={() => ecrire({
                        [regle.sangFroid]: sangFroid + 1,
                        ...ecrireLeSuivi(regle, { ...lireLeSuivi(valeurs), objetFetiche: seance }, valeurs),
                    })}>
                    Objet fétiche ({fetiche}) : +1 Sang-froid
                </button>
            )}
        </div>
    );
};

export default SuiviBladeRunner;
