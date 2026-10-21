import { useRef, useState } from 'react';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import { CLE_COMBAT_ALIEN, ajouterUneBlessure, avancerLeTempsAlien, demanderUnCritique, desDeProtection, lireLeCombatAlien, malusDesBlessures, resoudreLeTrepas, soignerUneBlessure, trepasDu,
    type ArmureAlien, type CombatAlien, type RegleDeCombatAlien, type UniteAlien } from '../../../dice/systemes/combatAlien';
import { entreeDeLaTable } from '../../../dice/systemes/yearZero';
import { pontDesTables } from '../../../tables/pontDesTables';
import { useSessionOSStore } from '../../useSessionOSStore';

const bouton = 'rounded border border-app-border px-2 py-1 text-xs hover:bg-app-text/5 disabled:opacity-40';
const champ = 'block w-full min-w-0 rounded border border-app-border bg-app-bg p-1';
interface Props { regle: RegleDeCombatAlien; valeurs: Record<string, unknown>; ecrire: (maj: Record<string, unknown>) => void; personnageId?: string;
    sourceEntityId?: string; pnj?: boolean; pourLesJoueurs: boolean; consigner: (titre: string, resultat: RollResult) => void }
/** Une seule procédure humaine pour la fiche et le combat. Les échéances sont du temps de jeu validé par Maman. */
export default function SanteAlien({ regle, valeurs, ecrire, personnageId, sourceEntityId, pnj = false, pourLesJoueurs, consigner }: Props) {
    const [degats, setDegats] = useState(1), [couvert, setCouvert] = useState(0), [distance, setDistance] = useState(true);
    const [attaque, setAttaque] = useState(true);
    const [type, setType] = useState<ArmureAlien>('normale');
    const [reussites, setReussites] = useState(0), [soignant, setSoignant] = useState(''), [materiel, setMateriel] = useState(0), [autoSoins, setAutoSoins] = useState(false);
    const [message, setMessage] = useState('');
    const enCours = useRef(false), ref = useRef(valeurs); ref.current = valeurs;
    const pjActuel = () => useSessionOSStore.getState().players.flatMap(p => p.characters).find(c => c.id === personnageId);
    const actuel = () => pjActuel()?.sheetData ?? useSessionOSStore.getState().entities?.find(e => e.id === sourceEntityId)?.sheetData ?? ref.current;
    const suivi = lireLeCombatAlien(valeurs), sante = Number(valeurs[regle.sante]) || 0;
    const androide = valeurs[regle.androide] === true || valeurs[regle.androide] === 'true';
    const talents = String(valeurs[regle.talents] ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const noter = (s: CombatAlien, maj: Record<string, unknown> = {}) => {
        const tout = { ...actuel(), ...maj, [CLE_COMBAT_ALIEN]: s }; ref.current = tout; ecrire(tout);
    };
    const dire = (texte: string, res?: RollResult) => { setMessage(texte); consigner('Santé Alien', res ? { ...res, totalDisplay: `${texte} — ${res.totalDisplay}` } : { total: 0, modifier: 0, rolls: [], totalDisplay: texte }); };
    const impact = (n: number, soin = false) => {
        const s = useSessionOSStore.getState();
        if (pjActuel()) s.handleApplyImpact(personnageId!, 'pc', { value: n, isRecovery: soin, type: 'combat' });
        else if (sourceEntityId) s.handleApplyImpact(sourceEntityId,'npc',{value:n,isRecovery:soin,type:'combat'});
        else { // Hôte autonome : l'appelant porte la fiche (tests ou préparation).
            const f = actuel(), hp = Math.max(0, Math.min(Number(f[regle.force]) || 0, (Number(f[regle.sante]) || 0) + (soin ? n : -n)));
            const suivi = lireLeCombatAlien(f);
            ref.current = { ...f, [regle.sante]: hp, [CLE_COMBAT_ALIEN]: !soin && n > 0 && hp === 0 && !androide ? demanderUnCritique(suivi,crypto.randomUUID()) : suivi }; ecrire(ref.current);
        }
    };
    const proteger = () => {
        const s = lireLeCombatAlien(actuel()), c = s.coup;
        if (!c || c.applique || c.annules !== undefined) return;
        const n = desDeProtection(c.protection, c.type), res = DiceEngine.rollYZE(n, 0);
        noter({ ...s, coup: { ...c, annules: res.successes ?? 0, des: res.rolls.map(d => Number(d.val)) } });
        dire(`Protection ${n}D6 : ${res.successes ?? 0} dégât(s) absorbé(s), sans Stress ni forçage`, res);
    };
    const appliquer = () => {
        const s = lireLeCombatAlien(actuel()), c = s.coup;
        if (!c || c.applique || c.annules === undefined || s.mort) return;
        const n = Math.max(0, c.degats - c.annules);
        impact(n);
        // Relire après l'impact : celui-ci a pu ajouter Stress et demande de critique.
        noter({ ...lireLeCombatAlien(actuel()), coup: { ...c, applique: true } });
        dire(`Coup : ${c.degats} − ${c.annules} = ${n} dégât(s) appliqué(s).`);
    };
    const critique = async (id: string) => {
        if (enCours.current || androide) return;
        enCours.current = true;
        try {
            const table = await pontDesTables()?.loadTable('Alien', 'blessures_critiques').catch(() => null);
            if (!table) { setMessage('Table des blessures introuvable : demande conservée ; réessayez après sa disponibilité.'); return; }
            const s = lireLeCombatAlien(actuel()); if (!s.critiques.includes(id)) return;
            const res = DiceEngine.rollStandard(66, 1), entree = entreeDeLaTable(table.entries, res.total);
            if (!entree) { setMessage('Ligne de blessure introuvable ; demande conservée.'); return; }
            const nouveau = ajouterUneBlessure(s, id, res.total, entree, () => DiceEngine.roll(6), talents.includes('guerison rapide'));
            noter(nouveau, res.total === 13 && !pnj ? { [regle.stress]: (Number(actuel()[regle.stress]) || 0) + 1 } : {});
            dire(`Critique D66 ${res.total} : ${entree.title}${nouveau.mort ? ' — mort instantanée' : ''}`, res);
        } finally { enCours.current = false; }
    };
    const avancer = (unite: UniteAlien) => { noter(avancerLeTempsAlien(lireLeCombatAlien(actuel()), unite)); dire(`Temps de jeu : un ${unite} validé par Maman.`); };
    const soinDeBlessure = (id: string, mode: 'stabiliser' | 'guerison' | 'effet') => {
        if (autoSoins && (Number(actuel()[regle.sante]) || 0) <= 0) return;
        const s = lireLeCombatAlien(actuel()), nouveau = soignerUneBlessure(s, id, mode, reussites, soignant.trim(), materiel);
        noter(nouveau); dire(`Soins ${mode} : ${reussites} réussite(s) validée(s), soignant ${soignant}.`);
    };
    if (pnj && !suivi.humain) return <section data-sante-alien className="p-2 text-xs"><button type="button" className={bouton} onClick={() => noter({ ...suivi, humain:true })}>Déclarer ce PNJ humain pour le suivi des blessures</button></section>;
    return <section data-sante-alien className="space-y-2 rounded-lg border border-app-border p-3 text-xs text-app-text">
        <h4 className="font-bold">Blessures et soins Alien</h4>
        <p>{suivi.mort ? 'Mort : aucun test ni récupération.' : sante <= 0 ? 'Brisé : aucun test de compétence ordinaire ; ramper et grogner seulement.' : `Santé : ${sante}. Les blessures critiques persistent après récupération.`}</p>
        {!pourLesJoueurs && !suivi.mort && <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label>Dégâts entrants<input className={champ} type="number" min="0" value={degats} onChange={e => setDegats(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} /></label>
                <label>Protection d’un abri préalable<input className={champ} type="number" min="0" value={couvert} onChange={e => setCouvert(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} /></label>
                <label>Propriété contre la protection<select className={champ} value={type} onChange={e => setType(e.target.value as ArmureAlien)}><option value="normale">Normale</option><option value="perce-armure">Perce-armure : moitié, arrondi supérieur</option><option value="doublee">Protection doublée</option></select></label>
                <label><input type="checkbox" checked={distance} onChange={e => setDistance(e.target.checked)} /> Attaque à distance (abri applicable)</label>
                <label><input type="checkbox" checked={attaque} onChange={e => setAttaque(e.target.checked)} /> Dégâts d’une attaque (armure applicable)</label>
            </div>
            <button type="button" className={bouton} disabled={!!suivi.coup && !suivi.coup.applique} onClick={() => {
                const protection = attaque ? Number(actuel()[regle.protection] ?? 0) : 0;
                if (!Number.isFinite(protection) || protection < 0) { setMessage('Saisir la Protection comme un nombre de dés, zéro si aucune.'); return; }
                noter({ ...lireLeCombatAlien(actuel()), coup: { id: crypto.randomUUID(), degats, protection: protection + (attaque && distance ? couvert : 0), type } });
            }}>Préparer ce coup</button>
            {suivi.coup && <div data-coup-alien className="space-y-1"><p>Coup préparé : {suivi.coup.degats} dégâts ; Protection {desDeProtection(suivi.coup.protection, suivi.coup.type)}D6.</p>
                <button type="button" className={bouton} disabled={suivi.coup.applique || suivi.coup.annules !== undefined} onClick={proteger}>Lancer la Protection</button>{' '}
                <button type="button" className={bouton} disabled={suivi.coup.applique || suivi.coup.annules === undefined} onClick={appliquer}>Appliquer les dégâts restants</button>
                {!suivi.coup.applique && <button type="button" className={bouton} onClick={() => { const s = lireLeCombatAlien(actuel()); if (s.coup && !s.coup.applique) { noter({ ...s,coup:{...s.coup,applique:true} }); dire('Coup abandonné par Maman, aucun dégât appliqué.'); } }}>Abandonner ce coup sans dégâts</button>}
                {suivi.coup.annules !== undefined && <p>Protection : [{suivi.coup.des?.join(', ')}], {suivi.coup.annules} six ; reste {Math.max(0, suivi.coup.degats - suivi.coup.annules)}. {suivi.coup.applique ? 'Coup déjà appliqué.' : ''}</p>}
            </div>}
        </>}
        {androide ? <p>Synthétique : les critiques et soins humains ne s’appliquent pas.</p> : <>
            {suivi.critiques.map(id => <div key={id}><p>Blessure critique à résoudre — demande conservée.</p>{!pourLesJoueurs && <button type="button" className={bouton} onClick={() => void critique(id)}>Tirer ce critique humain (D66)</button>}</div>)}
            {!pourLesJoueurs && !suivi.mort && <>
                <div className="flex flex-wrap gap-2">{(['round','tour','quart','jour'] as const).map(u => <button className={bouton} type="button" key={u} onClick={() => avancer(u)}>Valider un {u}</button>)}</div>
                <p>Horloges indépendantes de temps de jeu : Round {suivi.temps.round}, Tour {suivi.temps.tour}, Quart {suivi.temps.quart}, Jour {suivi.temps.jour}. Maman valide chaque unité pertinente, sans minuterie réelle.</p>
                <label>Réussites de Soins médicaux validées<input type="number" min="0" className={champ} value={reussites} onChange={e => setReussites(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} /></label>
                <label>Soignant (même nom pour suivre ses tentatives)<input className={champ} value={soignant} onChange={e => setSoignant(e.target.value)} /></label>
                <label>Qualité du matériel (augmenter seulement si amélioré)<input type="number" min="0" className={champ} value={materiel} onChange={e => setMateriel(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} /></label>
                <label><input type="checkbox" checked={autoSoins} onChange={e => setAutoSoins(e.target.checked)} /> Auto-soins après s’être relevé : malus −2 au test de stabilisation</label>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className={bouton} disabled={sante > 0 || reussites < 1 || !soignant.trim() || autoSoins} onClick={() => { if ((Number(actuel()[regle.sante]) || 0) > 0) return; impact(reussites, true); dire(`Premiers soins pour relever : ${reussites} Santé, action lente ; stabilisation séparée.`); }}>Relever par premiers soins</button>
                    <button type="button" className={bouton} disabled={suivi.reposLe === suivi.temps.tour} onClick={() => {
                        const s = lireLeCombatAlien(actuel()); if (s.reposLe === s.temps.tour) return;
                        impact(1, true); noter({ ...lireLeCombatAlien(actuel()), reposLe: s.temps.tour });
                        dire('Un Tour de repos confirmé : +1 Santé. Les critiques et délais restent actifs.');
                    }}>Un Tour de repos écoulé : Santé +1</button>
                </div>
            </>}
            {suivi.blessures.map(b => <article data-blessure-alien key={b.id} className="space-y-1 border-t border-app-border pt-2"><p className="font-bold">{b.code} — {b.titre}{b.guerie ? ' (guérie)' : ''}</p><p>{b.effet}</p>
                <p>{b.fatale ? b.stabilisee ? 'Stabilisée : plus de test de Trépas.' : `Fatale : échéance ${b.unite ?? 'immédiate'} ${b.echeance ?? '—'}.` : 'Non fatale.'} {b.permanente ? 'Effet permanent.' : b.jours !== undefined ? `Guérison restante : ${b.jours} jour(s).` : 'Effet selon les conditions indiquées.'}</p>
                {!pourLesJoueurs && !suivi.mort && !b.guerie && <div className="flex flex-wrap gap-2">
                    {trepasDu(suivi,b) && <button type="button" className={bouton} onClick={() => {
                        const s = lireLeCombatAlien(actuel()), blessure = s.blessures.find(x => x.id === b.id); if (!blessure || !trepasDu(s,blessure)) return;
                        const f = actuel(), n = Math.max(0, (Number(f[regle.force]) || 0) + (Number(f[regle.endurance]) || 0) + malusDesBlessures(s,'endurance'));
                        const res = DiceEngine.rollYZE(n,0); noter(resoudreLeTrepas(s,b.id,res.successes ?? 0)); dire(`Trépas : ${n} dés d’Endurance, sans Stress ni forçage ; ${(res.successes ?? 0) > 0 ? 'sursis, prochaine échéance conservée' : 'mort'}`, res);
                    }}>Tester le Trépas (sans Stress)</button>}
                    {b.fatale && !b.stabilisee && <button type="button" className={bouton} disabled={!soignant.trim() || (autoSoins && sante <= 0) || (b.tentatives[soignant.trim()] ?? -1) >= materiel} onClick={() => soinDeBlessure(b.id,'stabiliser')}>Stabiliser — malus {b.malusSoins + (autoSoins ? -2 : 0)} (action lente)</button>}
                    {b.jours !== undefined && !b.permanente && <button type="button" className={bouton} disabled={!soignant.trim() || reussites < 1 || b.reductionLe === suivi.temps.jour || (autoSoins && sante <= 0)} onClick={() => soinDeBlessure(b.id,'guerison')}>Soins quotidiens réussis : durée ÷2</button>}
                    {[14,15,56].includes(b.code) && <button type="button" className={bouton} disabled={!soignant.trim() || reussites < 1 || (autoSoins && sante <= 0)} onClick={() => soinDeBlessure(b.id,'effet')}>Soins de l’effet réussis</button>}
                </div>}
            </article>)}
        </>}
        {message && <p role="status">{message}</p>}
    </section>;
}
