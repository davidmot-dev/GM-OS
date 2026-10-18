import { useRef, useState } from 'react';
import { DiceEngine } from '../../dice/DiceEngine';
import { DEGRES_DE_REUSSITE, cleI18nDuDegre, type DegreDeReussite } from '../../dice/degresDeReussite';
import { useTranslation } from 'react-i18next';
import { suiviFatigueActif } from '../logic/fatigueDuVoyageur';
import { CLEFS_DE_SOINS, etatsDeSanteVoyageur, finaliserMajSante, initialiserSanteVoyageur, jetDEnduranceRequis,
    jetsDeVieRequis, lireSanteVoyageur, proposerEncaissement, proposerFinRound, proposerJetEndurance, proposerJetVie,
    proposerSoins, proposerTempsSante, type DonneesDeSante, type GraviteVoyageur, type PropositionSante } from '../logic/santeDuVoyageur';

/** Les dés sont tirés à la demande. Aucun effet de lecture ne dépense ni ne soigne. */
export function PanneauSanteVoyageur({donnees, appliquer, avantOperation, roundCombat}: {
    donnees: DonneesDeSante; appliquer: (maj: DonneesDeSante) => void; avantOperation?: () => boolean; roundCombat?: number;
}) {
    const {t} = useTranslation(['modules','common']);
    const [dommages,setDommages] = useState('0'), [protection,setProtection] = useState('0');
    const [nonMortel,setNonMortel] = useState(false), [heroisme,setHeroisme] = useState(false);
    const [localisation,setLocalisation] = useState('');
    const [desDeTable,setDesDeTable] = useState('');
    const [existantes,setExistantes] = useState<Record<GraviteVoyageur,string>>({legere:'0',grave:'0',critique:'0'});
    const [soinsExistants,setSoinsExistants] = useState<Record<string,'non'|'premiers'|'complets'>>({});
    const [repitsRestants,setRepitsRestants] = useState<Record<string,string>>({});
    const [bonusExistants,setBonusExistants] = useState<Record<string,string>>({});
    const [minutes,setMinutes] = useState('1'), [blessureChoisie,setBlessureChoisie] = useState('');
    const [degre,setDegre] = useState<DegreDeReussite>('reussite-normale'), [nouvelOperant,setNouvelOperant] = useState(false);
    const [erreur,setErreur] = useState('');
    const [apercu,setApercu] = useState<{p:PropositionSante; empreinte:string} | null>(null);
    const verrou = useRef(false);
    let s, etats;
    try {s = lireSanteVoyageur(donnees);etats = etatsDeSanteVoyageur(donnees);}
    catch (e) {return <p role="alert" className="text-etat-alerte">{(e as Error).message}</p>;}
    const classe = 'min-w-0 max-w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text';
    const proposer = (f: (id:string) => PropositionSante) => {
        if (avantOperation && !avantOperation()) return;
        try {setApercu({p:f(crypto.randomUUID()),empreinte:JSON.stringify(donnees)});setErreur('');}
        catch (e) {setErreur((e as Error).message);setApercu(null);}
    };
    let prochainDe = 0;
    const tirer = (faces:number) => {
        if (!desDeTable.trim()) return DiceEngine.roll(faces);
        const valeurs = desDeTable.trim().split(/[\s,;]+/).map(Number);
        if (prochainDe >= valeurs.length) throw new Error('Il manque un dé dans la saisie de table.');
        return valeurs[prochainDe++];
    };
    const b = s?.blessures.find(b => b.id === blessureChoisie);
    return <section aria-label="Blessures et encaissement RdD" className="p-4 rounded-xl border border-accent/30 bg-app-surface text-app-text space-y-3">
        <h3 className="font-bold text-accent">Encaissement et blessures</h3>
        {!s ? <>
            <p className="text-sm">Le suivi conserve vos compteurs. Reportez les blessures déjà présentes ; elles ne seront pas infligées une seconde fois.
                Les soins de ces blessures seront à renseigner dans le suivi.</p>
            <div className="flex flex-wrap gap-3">{(['legere','grave','critique'] as const).map(g => <label key={g} className="text-sm flex flex-col gap-1">
                Blessures {g === 'legere' ? 'légères' : g === 'grave' ? 'graves' : 'critiques'} existantes
                <input type="number" min={0} max={g === 'legere' ? 5 : g === 'grave' ? 2 : 1} value={existantes[g]}
                    className={`${classe} w-24`} onChange={e => setExistantes(p => ({...p,[g]:e.target.value}))} />
            </label>)}</div>
            {(['legere','grave','critique'] as const).flatMap(g => Array.from({length:Math.min(g === 'legere' ? 5 : g === 'grave' ? 2 : 1,Math.max(0,Math.floor(Number(existantes[g])||0)))},(_,i) => {
                const id = `reprise-${g}-${i}`;
                return <div key={id} className="space-y-2"><label className="text-sm flex flex-col gap-1">Soins existants — {g} {i+1}
                    <select className={classe} value={soinsExistants[id] ?? 'non'} onChange={e => setSoinsExistants(p => ({...p,[id]:e.target.value as 'non'|'premiers'|'complets'}))}>
                        <option value="non">Non soignée</option><option value="premiers">Premiers soins déjà accomplis</option><option value="complets">Soins complets déjà accomplis</option>
                    </select></label>
                    {soinsExistants[id] === 'premiers' && g !== 'legere' && <label className="text-sm flex flex-col gap-1">Répit restant (minutes, 0 = expiré)
                        <input type="number" min={0} className={`${classe} w-28`} value={repitsRestants[id] ?? '0'} onChange={e => setRepitsRestants(p => ({...p,[id]:e.target.value}))} /></label>}
                    {soinsExistants[id] === 'complets' && <label className="text-sm flex flex-col gap-1">Bonus des soins déjà accomplis (0–3)
                        <input type="number" min={0} max={3} className={`${classe} w-28`} value={bonusExistants[id] ?? '0'} onChange={e => setBonusExistants(p => ({...p,[id]:e.target.value}))} /></label>}
                </div>;
            }))}
            {!suiviFatigueActif(donnees) && <p className="text-sm">Activez d’abord le suivi de fatigue pour lier les pertes d’endurance.</p>}
            <button type="button" className={classe} disabled={!suiviFatigueActif(donnees)} onClick={() => {
                if (avantOperation && !avantOperation()) return;
                try {appliquer(initialiserSanteVoyageur(donnees,Object.fromEntries(Object.entries(existantes).map(([g,n]) => [g,Number(n)])),soinsExistants,
                    Object.fromEntries(Object.entries(repitsRestants).map(([id,n]) => [id,Number(n)])),Object.fromEntries(Object.entries(bonusExistants).map(([id,n]) => [id,Number(n)]))));setErreur('');}
                catch (e) {setErreur((e as Error).message);}
            }}>Activer le suivi des blessures</button>
        </> : <>
            <p role="status" className="font-bold">{etats!.libelle} · Vie {String(donnees.vie)} · Endurance {String(donnees.endurance)} · Round de santé {s.round}</p>
            {roundCombat !== undefined && <p className="text-xs">Combat-OS : round {roundCombat}. Validez ici la phase santé une fois par round ; le suivi ne fait pas avancer l’initiative.</p>}
            <p className="text-xs">Temps de santé écoulé : {s.secondes} secondes (round ≈ 6 s). XP Constitution gagnée sur 01 : {s.experienceConstitution}, à reporter.</p>
            <label className="text-sm flex flex-col gap-1">Dés de table déjà tirés (facultatif, dans l’ordre)
                <input className={classe} placeholder="Vide : GM-OS lance les dés. Exemple : 7, 6, 5, 5" value={desDeTable}
                    onChange={e => {setDesDeTable(e.target.value);setApercu(null);}} /></label>
            {etats!.sonne && <p role="alert" className="text-sm text-etat-alerte">Sonné jusqu’à la fin du round de santé {s.sonneJusqua} : réussite significative exigée, particulières sans effet spécial.</p>}
            {jetDEnduranceRequis(donnees) && <button type="button" className={classe} onClick={() => proposer(id => proposerJetEndurance(donnees,tirer,id))}>
                Tirer le jet d’endurance requis ({s.perteEnduranceRound} perdus ce round)</button>}
            {jetsDeVieRequis(donnees).map(b => <div key={b.id} className="flex flex-wrap gap-2 items-center text-sm text-etat-alerte">
                <span>Jet de vie requis : blessure {b.gravite} {b.localisation}.</span>
                <button type="button" className={classe} onClick={() => proposer(id => proposerJetVie(donnees,b.id,tirer,id))}>Tirer le jet de vie</button>
            </div>)}
            <details>
                <summary className="cursor-pointer font-bold">Encaisser une agression</summary>
                <div className="flex flex-wrap gap-3 items-end my-3">
                    <label className="text-sm flex flex-col gap-1">Bonus aux dommages
                        <input type="number" className={`${classe} w-28`} value={dommages} onChange={e => {setDommages(e.target.value);setApercu(null);}} /></label>
                    <label className="text-sm flex flex-col gap-1">Protection
                        <input type="number" className={`${classe} w-28`} value={protection} onChange={e => {setProtection(e.target.value);setApercu(null);}} /></label>
                    <label className="text-sm flex flex-col gap-1">Localisation (facultative)
                        <input className={classe} value={localisation} onChange={e => {setLocalisation(e.target.value);setApercu(null);}} /></label>
                </div>
                <label className="text-sm block my-2"><input type="checkbox" checked={nonMortel} onChange={e => {setNonMortel(e.target.checked);setApercu(null);}} /> Coups non mortels</label>
                <label className="text-sm block my-2"><input type="checkbox" checked={heroisme} onChange={e => {setHeroisme(e.target.checked);setApercu(null);}} /> Tenter l’héroïsme si la perte chiffrée amène exactement à zéro et reste dans le SC</label>
                <button type="button" className={classe} disabled={!!apercu || etats!.mort} onClick={() => proposer(id => proposerEncaissement(donnees,Number(dommages),Number(protection),nonMortel,tirer,id,heroisme,localisation))}>
                    Tirer et prévisualiser l’encaissement</button>
            </details>
            <details>
                <summary className="cursor-pointer font-bold">Blessures et soins ({s.blessures.length})</summary>
                <ul className="text-sm space-y-2 my-2">{s.blessures.map(b => <li key={b.id}>
                    <strong>{b.gravite} {b.localisation}</strong> : {b.soinsComplets ? `soins complets, bonus guérison +${b.bonusGuerison}` : b.premiersSoins ? `premiers soins, répit jusqu’à ${b.repitJusqua} s` : 'non soignée'}.
                    {' '}Premiers soins {b.pointsSoins}/{CLEFS_DE_SOINS[b.gravite]}, difficulté {-CLEFS_DE_SOINS[b.gravite]+b.malusSoins},
                    {' '}soins complets à {-CLEFS_DE_SOINS[b.gravite]+b.malusSoins+b.excedentSoins}.
                    {b.prochainJetVie !== null && <span> Prochain jet de vie : {b.prochainJetVie} s.</span>}
                </li>)}</ul>
                {s.blessures.length > 0 && <div className="space-y-2">
                    <p className="text-xs">Jouez DEXTÉRITÉ/Chirurgie avec les ajustements du soignant et le matériel disponible, puis inscrivez le résultat.
                        Premiers soins : un jet par round ; soins complets : un jet après 10 à 30 minutes. Eau et pansements restent à décompter.</p>
                    <label className="text-sm flex flex-col gap-1">Blessure à soigner<select aria-label="Blessure à soigner" className={classe} value={blessureChoisie} onChange={e => {setBlessureChoisie(e.target.value);setApercu(null);}}>
                        <option value="">Choisir</option>{s.blessures.map((b,i) => <option key={b.id} value={b.id}>{i+1} — {b.gravite} {b.localisation}</option>)}</select></label>
                    <label className="text-sm flex flex-col gap-1">Résultat du jet de soins<select aria-label="Résultat du jet de soins" className={classe} value={degre} onChange={e => {setDegre(e.target.value as DegreDeReussite);setApercu(null);}}>
                        {DEGRES_DE_REUSSITE.map(d => <option key={d} value={d}>{t(cleI18nDuDegre(d))}</option>)}</select></label>
                    <label className="text-sm block"><input type="checkbox" checked={nouvelOperant} onChange={e => setNouvelOperant(e.target.checked)} /> Changement d’opérant (points négatifs abandonnés)</label>
                    <button type="button" className={classe} disabled={!b || !!apercu || etats!.mort} onClick={() => proposer(id => proposerSoins(donnees,blessureChoisie,!!b?.premiersSoins,degre,id,nouvelOperant))}>
                        Proposer {b?.premiersSoins ? 'les soins complets' : 'les premiers soins'}</button>
                </div>}
            </details>
            <div className="flex flex-wrap gap-3 items-end">
                <button type="button" className={classe} disabled={!!apercu || etats!.mort} onClick={() => proposer(id => proposerFinRound(donnees,id,tirer))}>Préparer la fin du round de santé</button>
                <label className="text-sm flex flex-col gap-1">Minutes écoulées
                    <input type="number" min={1} className={`${classe} w-28`} value={minutes} onChange={e => {setMinutes(e.target.value);setApercu(null);}} /></label>
                <button type="button" className={classe} disabled={!!apercu || etats!.mort} onClick={() => proposer(id => proposerTempsSante(donnees,Number(minutes),id))}>Proposer le temps écoulé</button>
            </div>
            <p className="text-xs text-app-text/60">Le temps s’arrête aux jets de vie exigibles. Hémorragie active : procéder round par round.
                Les guérisons et récupérations nocturnes relèvent du repos (R4).</p>
            {apercu && <div aria-label="Aperçu de santé" className="p-3 border border-accent rounded space-y-2">
                <p className="font-bold">{apercu.p.motif}</p>
                {apercu.p.des.length > 0 && <p className="text-sm">Dés : {apercu.p.des.map((d,i) => <span key={i}>d{d.faces}={d.valeur}{' '}</span>)}</p>}
                {apercu.p.details.map((v,i) => <p key={i} className="text-sm">{v}</p>)}
                <p className="text-sm">État proposé : {etatsDeSanteVoyageur({...donnees,...apercu.p.maj})?.libelle}.</p>
                <div className="flex flex-wrap gap-2"><button type="button" className="px-3 py-2 rounded bg-accent text-app-bg font-bold" onClick={() => {
                    if (verrou.current) return;
                    if (JSON.stringify(donnees) !== apercu.empreinte) {setErreur('La fiche a changé : refaire l’aperçu.');setApercu(null);return;}
                    if (avantOperation && !avantOperation()) return;
                    verrou.current = true;
                    try {
                        const maj = finaliserMajSante(donnees,apercu.p);
                        const precedents = Array.isArray(donnees.__rddHistoriqueSante231) ? donnees.__rddHistoriqueSante231 : [];
                        const suivi = lireSanteVoyageur(maj)!;
                        appliquer({...maj,__rddHistoriqueSante231:[...precedents,{id:suivi.derniereOperation,motif:apercu.p.motif,details:apercu.p.details,des:apercu.p.des}].slice(-30)});
                        setApercu(null);setErreur('');
                    } finally {verrou.current = false;}
                }}>Appliquer les conséquences</button>
                <button type="button" className={classe} onClick={() => setApercu(null)}>Abandonner l’aperçu</button></div>
            </div>}
            {Array.isArray(donnees.__rddHistoriqueSante231) && <details><summary className="cursor-pointer text-sm">Historique de santé</summary>
                {(donnees.__rddHistoriqueSante231 as {id:string;motif:string;details:string[]}[]).slice().reverse().map(v => <p key={v.id} className="text-xs my-1">{v.motif} : {v.details.join(' ')}</p>)}
            </details>}
        </>}
        {erreur && <p role="alert" className="text-sm text-etat-danger">{erreur}</p>}
    </section>;
}
