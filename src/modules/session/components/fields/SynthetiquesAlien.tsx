import { useRef, useState } from 'react';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import { type CombatAlien, type UniteAlien } from '../../../dice/systemes/combatAlien';
import { abandonnerUneIntervention, ajouterUneAvarie, commencerUneIntervention, consommerLActionPerdue, interventionPrete, lireLeSynthetique, terminerUneIntervention } from '../../../dice/systemes/synthetiquesAlien';
import { pontDesTables } from '../../../tables/pontDesTables';

const bouton = 'rounded border border-app-border px-2 py-1 text-xs disabled:opacity-40';
const champ = 'block w-full min-w-0 rounded border border-app-border bg-app-bg p-1';
interface Props {
    suivi: CombatAlien; actuel: () => CombatAlien; noter: (s: CombatAlien, restaure?: boolean) => void | boolean;
    avancer: (u: UniteAlien) => void; joueur: boolean; dire: (texte: string, res?: RollResult) => void;
    refusReparation?: string;
}
/** Même état privé sur fiche, carte et Hub ; les résultats Comtech sont confirmés par Maman. */
export default function SynthetiquesAlien({ suivi, actuel, noter, avancer, joueur, dire, refusReparation }: Props) {
    const [reussites, setReussites] = useState(0), [energie, setEnergie] = useState(false), [trauma, setTrauma] = useState('');
    const enCours = useRef(false), a = lireLeSynthetique(suivi), i = a.intervention;
    const critique = async () => {
        if (enCours.current) return;
        enCours.current = true;
        try {
            const table = await pontDesTables()?.loadTable('Alien', 'blessures_critiques_synthetiques').catch(() => null);
            if (!table) { dire('Table synthétique indisponible : la demande reste conservée.'); return; }
            const s = actuel(), id = s.critiques[0]; if (!id) return;
            const res = DiceEngine.rollStandard(6, 1), fin = ajouterUneAvarie(s, id, res.total, table.entries);
            if (fin === s) { dire('Ligne synthétique indisponible : demande conservée.'); return; }
            noter(fin);
            const b = lireLeSynthetique(fin).avaries.at(-1)!;
            dire(`Critique synthétique D6 ${res.total}${b.code !== res.total ? ` aggravé à ${b.code}` : ''} : ${b.titre}.`, res);
        } finally { enCours.current = false; }
    };
    const commencer = (mode: 'reparer' | 'reactiver') => {
        const s = actuel(), fin = commencerUneIntervention(s, crypto.randomUUID(), mode, energie);
        if (fin !== s) { noter(fin); dire(mode === 'reparer' ? 'Réparation commencée : un Quart de travail avant le test de Comtech.' : 'Réactivation commencée : énergie confirmée et un Tour de travail avant Comtech.'); }
    };
    return <div data-synthetique-alien className="space-y-2">
        <p className="font-bold">{a.arret ? a.reactive ? 'Système réactivé pour communiquer ; réparation complète encore nécessaire.' : 'Arrêt du système : aucune action ordinaire.' : 'Synthétique : même à zéro Santé, les actions restent possibles selon les avaries.'}</p>
        <p>Aucun Stress, Panique, forçage, soin humain, repos guérisseur ou Trépas. Une ancienne saisie de Stress est conservée mais ignorée.</p>
        <p>Pas de besoin d’Air, d’Eau, de Nourriture ni de sommeil. Immunisé au vide, au froid et à la maladie. Les pathogènes aliens sont généralement sans effet : Maman arbitre leurs exceptions. Aucune immunité générale au feu, à l’acide ou aux radiations.</p>
        {a.avaries.map(v => <article data-avarie-alien key={v.id} className="border-t border-app-border pt-1"><p className="font-bold">{v.code} — {v.titre}</p><p>{v.effet}</p>
            {v.code === 1 && <p>{v.actionPerdue ? 'Action lente perdue : conséquence acquittée.' : 'Prochaine action lente à perdre.'}</p>}
            {!joueur && v.code === 1 && !v.actionPerdue && <button type="button" className={bouton} onClick={() => noter(consommerLActionPerdue(actuel(), v.id))}>Confirmer l’action lente perdue</button>}
        </article>)}
        {suivi.critiques.length > 0 && <div><p>{suivi.critiques.length} critique(s) synthétique(s) en attente, dans l’ordre des coups.</p>{!joueur && <button type="button" className={bouton} onClick={() => void critique()}>Tirer le prochain critique synthétique (D6)</button>}</div>}
        {a.traumatismes.map((t, n) => <p key={n}>Trauma mental permanent : {t}. Ses conséquences sont arbitrées par Maman ; aucun Stress ni Panique n’est ajouté.</p>)}
        {i && <p>{i.mode === 'reparer' ? 'Réparation' : 'Réactivation'} en cours — échéance {i.mode === 'reparer' ? 'Quart' : 'Tour'} {i.echeance}.</p>}
        {!joueur && <>
            <div className="flex flex-wrap gap-2"><button type="button" className={bouton} onClick={() => avancer('tour')}>Valider un tour</button><button type="button" className={bouton} onClick={() => avancer('quart')}>Valider un quart</button></div>
            <p>Temps de jeu validé par Maman : Tour {suivi.temps.tour}, Quart {suivi.temps.quart}. Unités indépendantes.</p>
            {!i && <div className="space-y-1">
                {a.arret && !a.reactive && <label><input type="checkbox" checked={energie} onChange={e => setEnergie(e.target.checked)} /> Source d’énergie disponible</label>}
                <button type="button" className={bouton} disabled={suivi.critiques.length > 0 || (a.arret && !a.reactive && !energie)} onClick={() => commencer(a.arret && !a.reactive ? 'reactiver' : 'reparer')}>{a.arret && !a.reactive ? 'Commencer la réactivation (un Tour)' : 'Commencer la réparation (un Quart)'}</button>
                <p>Auto-réparation possible si le système fonctionne et si les avaries permettent le travail. Après un Arrêt, une autre personne doit intervenir.</p>
            </div>}
            {i && <div data-intervention-alien className="space-y-1">
                <label>Réussites de Comtech validées<input className={champ} type="number" min="0" value={reussites} onChange={e => setReussites(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} /></label>
                {i.mode === 'reactiver' && <label>Trauma mental permanent choisi avec Maman<input className={champ} value={trauma} onChange={e => setTrauma(e.target.value)} /></label>}
                <button type="button" className={bouton} disabled={!interventionPrete(suivi) || suivi.critiques.length > 0 || (i.mode === 'reparer' && (a.arret && !a.reactive || !!refusReparation)) || (i.mode === 'reactiver' && reussites > 0 && !trauma.trim())} onClick={() => {
                    const s = actuel(), fin = terminerUneIntervention(s, i.id, reussites, trauma);
                    if (fin === s) return;
                    if (noter(fin, reussites > 0 && i.mode === 'reparer') === false) return;
                    setReussites(0); setTrauma('');
                    dire(reussites <= 0 ? 'Comtech échoué : intervention terminée, aucun rétablissement ; un nouvel essai nécessite une nouvelle durée de travail.' : i.mode === 'reparer' ? 'Comtech réussi : toute la Santé restaurée, toutes les avaries éliminées ; traumatismes conservés.' : 'Comtech réussi : communication rétablie, trauma permanent consigné ; un Quart et un nouveau Comtech restent nécessaires pour réparer.');
                }}>Appliquer le résultat de Comtech</button>
                <button type="button" className={bouton} onClick={() => { noter(abandonnerUneIntervention(actuel())); dire('Intervention abandonnée par Maman, sans récupération.'); }}>Abandonner cette intervention</button>
            </div>}
        </>}
    </div>;
}
