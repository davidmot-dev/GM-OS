import { useState } from 'react';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';
import { executerTableShadowrun, executerRiggingShadowrun } from '../../logic/operationsDeShadowrun';
import { TABLE_SHADOWRUN_VIDE, type OperationTableShadowrun } from '../../../dice/systemes/tableDeShadowrun';
import { MODES_DE_CONTROLE, PROFIL_RIGGER_VIDE, seuilsVehiculeShadowrun, impactVehiculeShadowrun, type ModeDeControle } from '../../../dice/systemes/riggingDeShadowrun';
import { OPPOSITION_SHADOWRUN, PROFILS_A_LA_VOLEE, succesAdversesShadowrun, type OppositionShadowrun } from '../../../dice/systemes/oppositionDeShadowrun';
import type { ChoixDeShadowrun, RegleDeShadowrun } from '../../../dice/systemes/shadowrun';

const bouton = 'min-h-9 rounded-md border border-app-border/40 px-3 py-1 text-xs font-bold hover:border-accent/60 disabled:opacity-30';
const champ = 'min-h-9 rounded-md border border-app-border/40 bg-app-bg px-2 py-1 text-xs';
const bandeau = 'flex flex-wrap items-center gap-3 rounded-md border border-app-border/40 bg-app-bg/40 p-3';
type Props = { campaignId: string; personnageId: string; regle: RegleDeShadowrun; valeurs: Record<string, unknown>; disabled?: boolean; consigner: (texte: string) => void };

export function PlanificationShadowrun({ campaignId, personnageId, regle, valeurs, disabled, consigner }: Props) {
    const campagne = useSessionOSStore(s => s.campaigns.find(c => c.id === campaignId));
    const pilote = useSessionOSStore(s => s.customGameDrivers.find(d => d.id === campagne?.system));
    const reserves = useRessourcesDeTableStore(s => s.reserves);
    const t = campagne?.suiviShadowrun ?? TABLE_SHADOWRUN_VIDE, r = regle.table;
    const [succes, setSucces] = useState(0), [limite, setLimite] = useState(false), [description, setDescription] = useState('');
    const [cout, setCout] = useState(2), [source, setSource] = useState<'personnelle' | 'collective'>('collective');
    const [recu, setRecu] = useState(() => crypto.randomUUID()), [credit, setCredit] = useState(() => crypto.randomUUID()), [message, setMessage] = useState('');
    if (!r) return null;
    const lire = (id: string) => reserves[campaignId]?.[id] ?? pilote?.ressourcesDeTable?.find(x => x.id === id)?.depart ?? 0;
    const p = lire(r.planification), m = lire(r.menace), a = Number(valeurs[regle.anarchy ?? '']) || 0;
    const appliquer = (op: OperationTableShadowrun) => { if (disabled) return; const texte = executerTableShadowrun(campaignId, personnageId, op); setMessage(texte); consigner(texte); };
    const nouveau = () => setRecu(crypto.randomUUID());
    return <fieldset disabled={disabled} data-planification-shadowrun className="flex flex-col gap-3 text-xs">
        <div className={bandeau}><strong className="font-mono text-accent">Planification {p}</strong><span>Anarchy personnelle {a}</span>{t.totale && <span className="text-etat-alerte">Menace {m}</span>}
            <label>Narration <select aria-label="Mode de narration" className={champ} value={t.totale ? 'totale' : 'classique'} onChange={e => appliquer({ id: crypto.randomUUID(), type: 'mode', totale: e.target.value === 'totale' })}><option value="classique">Classique</option><option value="totale">Partagée totale</option></select></label>
        </div>
        <div className={bandeau}>
            <label>Succès du test préparatoire <input aria-label="Succès de préparation" type="number" min={0} className={`w-20 ${champ}`} value={succes} onChange={e => { setSucces(Math.max(0, Math.trunc(Number(e.target.value)))); setCredit(crypto.randomUUID()); }} /></label>
            <label><input type="checkbox" checked={limite} onChange={e => { setLimite(e.target.checked); setCredit(crypto.randomUUID()); }} /> Temps limité : 2 succès par point</label>
            <span>{succes} succès → +{Math.floor(succes / (limite ? 2 : 1))} planification</span>
            <button type="button" className={bouton} disabled={t.recus.includes(credit)} onClick={() => appliquer({ id: credit, type: 'preparation', succes, tempsLimite: limite })}>Confirmer le crédit</button>
        </div>
        <label>Flashback validé par le meneur<textarea aria-label="Description du flashback" className={`mt-1 w-full ${champ}`} value={description} onChange={e => { setDescription(e.target.value); nouveau(); }} /></label>
        <div className={bandeau}>
            <label>Coût <select aria-label="Coût du flashback" className={champ} value={cout} onChange={e => { setCout(Number(e.target.value)); nouveau(); }}>{[1, 2, 3, 4].map(x => <option key={x}>{x}</option>)}</select></label>
            <label>Financement <select aria-label="Financement du flashback" className={champ} value={source} onChange={e => { setSource(e.target.value as typeof source); nouveau(); }}><option value="collective">Collective</option><option value="personnelle">Personnelle</option></select></label>
            <strong>{t.recus.includes(recu) ? `Payé : ${cout} Anarchy ${source}` : `${source === 'collective' ? 'Planification' : 'Anarchy personnelle'} ${source === 'collective' ? p : a} → ${(source === 'collective' ? p : a) - cout}`}</strong>
            <button type="button" className={bouton} disabled={!description.trim() || t.recus.includes(recu) || (source === 'collective' ? p : a) < cout} onClick={() => appliquer({ id: recu, type: 'flashback', cout, source, description })}>Confirmer le flashback</button>
            {t.recus.includes(recu) && <button type="button" className={bouton} onClick={() => { setDescription(''); nouveau(); }}>Nouveau flashback</button>}
        </div>
        {t.totale && <>
            <p>Chaque utilisation d’Anarchy ajoute une Menace, quel que soit son coût. Avantage et relance au panneau sont suivis ; signaler ici les autres utilisations.</p>
            <div className="flex flex-wrap gap-2">{([[1, 'Tour de table +1 menace'], [-1, 'Bonus PNJ −1 menace'], [-3, 'Péripétie −3 menace']] as const).map(([delta, label]) => <button key={delta} type="button" className={bouton} disabled={m + delta < 0} onClick={() => appliquer({ id: crypto.randomUUID(), type: 'menace', delta })}>{label}</button>)}
                <button type="button" className={bouton} onClick={() => appliquer({ id: crypto.randomUUID(), type: 'utilisation' })}>Autre utilisation d’Anarchy : +1 menace</button>
            </div>
            {m > p && <div className="rounded-md border border-etat-alerte/50 bg-etat-alerte/10 p-3"><p>Menace {m} &gt; Planification {p} : désastre collectif à mettre en scène.</p><button type="button" className={bouton} onClick={() => appliquer({ id: crypto.randomUUID(), type: 'desastre' })}>Confirmer le désastre — menace à 0</button></div>}
        </>}
        {message && <p role="status">{message}</p>}
    </fieldset>;
}

export function OppositionAuJetShadowrun({ choix, setChoix }: { choix: ChoixDeShadowrun; setChoix: (f: (c: ChoixDeShadowrun) => ChoixDeShadowrun) => void }) {
    const o = choix.opposition;
    const maj = (v: Partial<OppositionShadowrun>) => setChoix(c => ({ ...c, opposition: { ...(c.opposition ?? OPPOSITION_SHADOWRUN), ...v } }));
    return <div data-opposition-shadowrun className="flex flex-col gap-2 border-t border-app-border/40 pt-3 text-xs">
        <label>Épreuve <select aria-label="Épreuve Shadowrun" className={champ} value={o?.epreuve ?? 'simple'} onChange={e => e.target.value === 'simple' ? setChoix(c => ({ ...c, opposition: undefined })) : maj({ epreuve: e.target.value as OppositionShadowrun['epreuve'] })}><option value="simple">Test simple</option><option value="oppose">Opposé</option><option value="tir">Tir</option><option value="melee">Mêlée</option></select></label>
        {o && <>
            <div className={bandeau}><label>Adversaire <select aria-label="Rôle de l’adversaire" className={champ} value={o.role} onChange={e => maj({ role: e.target.value as OppositionShadowrun['role'] })}><option value="premier">Premier rôle</option><option value="second">Second rôle</option><option value="volee">À la volée</option></select></label>
                {o.role === 'second' ? <><label>Réserve adverse <input aria-label="Réserve adverse Shadowrun" type="number" min={0} value={o.reserve} className={`w-20 ${champ}`} onChange={e => maj({ reserve: Math.max(0, Number(e.target.value)) })} /></label><label>RR <select aria-label="RR adverse" className={champ} value={o.rr} onChange={e => maj({ rr: Number(e.target.value) })}>{[0, 1, 2, 3].map(x => <option key={x}>{x}</option>)}</select></label><strong>Valeur moyenne {succesAdversesShadowrun(o)} — sans Anarchy</strong>
                    <label>Situation du second rôle <select aria-label="Situation adverse" className={champ} value={o.situation} onChange={e => maj({ situation: Number(e.target.value) })}><option value={0}>Neutre</option><option value={1}>Avantage adverse → désavantage PJ</option><option value={-1}>Désavantage adverse → avantage PJ</option></select></label></>
                    : o.role === 'volee' ? <label>Profil <select aria-label="Profil à la volée" className={champ} value={o.succes} onChange={e => { const p = PROFILS_A_LA_VOLEE.find(x => x.succes === Number(e.target.value))!; maj(p); }}>{PROFILS_A_LA_VOLEE.map(p => <option key={p.nom} value={p.succes}>{p.nom} — {p.succes} succès ({p.reserve} dés, RR {p.rr})</option>)}</select></label>
                    : <label>Succès adverses <input aria-label="Succès adverses Shadowrun" type="number" min={0} className={`w-20 ${champ}`} value={o.succes} onChange={e => maj({ succes: Math.max(0, Math.trunc(Number(e.target.value))) })} /></label>}
            </div>
            <label>Initiateur <select aria-label="Initiateur Shadowrun" className={champ} value={o.initiateur} onChange={e => maj({ initiateur: e.target.value as OppositionShadowrun['initiateur'] })}><option value="personnage">Ce personnage</option><option value="adversaire">L’adversaire</option></select></label>
            {o.epreuve === 'oppose' && <label><input type="checkbox" checked={o.vainqueurNecessaire} onChange={e => maj({ vainqueurNecessaire: e.target.checked })} /> Un vainqueur est nécessaire : l’initiateur départage l’égalité</label>}
            {o.epreuve === 'melee' && <label><input type="checkbox" checked={o.defenseSeule} onChange={e => maj({ defenseSeule: e.target.checked })} /> Le défenseur cherche seulement à se défendre (égalité : touché)</label>}
            <p>Une opposition générale à égalité reste sans vainqueur. En tir, l’égalité touche en faveur de l’attaquant. L’initiateur désigne le camp qui attaque.</p>
        </>}
    </div>;
}

export function RiggingShadowrun({ campaignId, personnageId, disabled, consigner }: Props) {
    const campagne = useSessionOSStore(s => s.campaigns.find(c => c.id === campaignId)), joueurs = useSessionOSStore(s => s.players);
    const t = campagne?.suiviShadowrun ?? TABLE_SHADOWRUN_VIDE, profil = t.riggers[personnageId] ?? PROFIL_RIGGER_VIDE;
    const [selection, setSelection] = useState(''), [nom, setNom] = useState(''), [mode, setMode] = useState<ModeDeControle>('plongee');
    const [connexion, setConnexion] = useState<'cold' | 'hot'>('cold'), [vd, setVd] = useState(0), [message, setMessage] = useState('');
    const v = t.vehicules.find(x => x.id === selection) ?? t.vehicules[0];
    const executer = (op: Parameters<typeof executerRiggingShadowrun>[2]) => { if (disabled) return; const texte = executerRiggingShadowrun(campaignId, personnageId, op); setMessage(texte); consigner(texte); };
    const id = () => crypto.randomUUID(), effet = v && impactVehiculeShadowrun(v, vd), seuils = v && seuilsVehiculeShadowrun(v);
    return <fieldset data-rigging-shadowrun disabled={disabled} className="flex flex-col gap-3 text-xs">
        <div className={bandeau}><input aria-label="Nom du véhicule" className={champ} placeholder="Nom du drone ou véhicule" value={nom} onChange={e => setNom(e.target.value)} /><button type="button" className={bouton} disabled={!nom.trim()} onClick={() => { const cle = id(); executer({ id: cle, type: 'ajouter', nom }); setSelection(cle); setNom(''); }}>Ajouter le véhicule</button></div>
        <p>Résistance du véhicule : Structure ×1/×2/×3 + Blindage (tableau des blessures p. 69).</p>
        {v && <>
            <label>Véhicule <select aria-label="Véhicule suivi" className={champ} value={v.id} onChange={e => setSelection(e.target.value)}>{t.vehicules.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></label>
            <div className={bandeau}>{(['structure', 'blindage', 'autopilote', 'maniabilite', 'vitesse'] as const).map(k => <label key={k} className="flex flex-col gap-1 capitalize">{k}<input type="number" aria-label={`Véhicule ${k}`} className={`w-20 font-mono ${champ}`} min={0} value={v[k]} onChange={e => executer({ id: id(), type: 'caracteristique', vehiculeId: v.id, champ: k, valeur: Number(e.target.value) })} /></label>)}<strong>Seuils {seuils!.legere}/{seuils!.grave}/{seuils!.incapacitante}</strong></div>
            <div className={bandeau}>{(['ind', 'ccv', 'ccr'] as const).map(k => <label key={k}><input type="checkbox" checked={profil[k]} onChange={e => executer({ id: id(), type: 'profil', profil: { ...profil, [k]: e.target.checked } })} /> {k === 'ind' ? 'IND cybernétique' : k.toUpperCase()}</label>)}<label>Capacité CCR <input aria-label="Capacité CCR" type="number" className={`w-20 ${champ}`} min={1} value={profil.capacite} onChange={e => executer({ id: id(), type: 'profil', profil: { ...profil, capacite: Math.max(1, Math.trunc(Number(e.target.value))) } })} /></label></div>
            <div className={bandeau}><label>Mode de contrôle <select aria-label="Mode de contrôle" className={champ} value={mode} onChange={e => setMode(e.target.value as ModeDeControle)}>{Object.entries(MODES_DE_CONTROLE).map(([k, nom]) => <option key={k} value={k}>{nom}</option>)}</select></label><label>Connexion <select aria-label="Connexion rigging" className={champ} value={connexion} onChange={e => setConnexion(e.target.value as typeof connexion)}><option value="cold">Cold-sim</option><option value="hot">Hot-sim</option></select></label><button type="button" className={bouton} onClick={() => executer({ id: id(), type: 'controle', vehiculeId: v.id, mode, connexion })}>Prendre le contrôle</button><button type="button" className={bouton} onClick={() => executer({ id: id(), type: 'narration' })}>Nouvelle narration du rigger</button></div>
            <p>Contrôle actif : {v.controle ? `${MODES_DE_CONTROLE[v.controle.mode]}, ${v.controle.connexion}-sim — ${joueurs.flatMap(p => p.characters).find(c => c.id === v.controle!.personnageId)?.name ?? v.controle.personnageId}` : 'Autonome'}. Priorité : plongée &gt; capitaine &gt; manuel &gt; autonome ; à niveau égal, la première commande prévaut, sauf en autonome où le dernier ordre remplace le précédent.</p>
            <p>{v.controle?.mode === 'plongee' ? `Pilotage sans action. ${v.controle.connexion === 'hot' ? 'Avantage aux tests de Pilotage. Biofeedback mental létal.' : 'Biofeedback mental étourdissant.'}` : v.controle?.mode === 'capitaine' ? 'Première action : une action par véhicule. Action supplémentaire : un véhicule, ou un même ordre au groupe en hot-sim.' : v.controle?.mode === 'manuel' ? 'Une action de pilotage par narration.' : 'Autopilote seul comme réserve ; action précautionneuse par défaut.'}</p>
            <label><input type="checkbox" checked={v.debride} onChange={e => executer({ id: id(), type: 'debridage', vehiculeId: v.id, actif: e.target.checked })} /> Autopilote débridé par un atout déclaré</label>
            <div className={bandeau}><strong>Dommages du véhicule : {v.moniteur.legeres} légers / {v.moniteur.graves} graves / {v.moniteur.incapacitantes} incapacitants</strong><label>VD finale <input aria-label="VD du véhicule" type="number" min={0} value={vd} className={`w-20 ${champ}`} onChange={e => setVd(Math.max(0, Number(e.target.value)))} /></label><span>Aperçu : {effet?.cochee ?? 'aucun dommage'}{effet?.biofeedback ? ` → blessure ${effet.biofeedback.gravite} au rigger (${effet.biofeedback.nature})` : ''}</span><button type="button" className={bouton} onClick={() => { executer({ id: id(), type: 'impact', vehiculeId: v.id, vd }); setVd(0); }}>Confirmer l’impact</button><button type="button" className={bouton} onClick={() => executer({ id: id(), type: 'reparer', vehiculeId: v.id })}>Réparation réussie : une case</button></div>
            <p>Le troisième dommage léger devient grave : la case cochée détermine le biofeedback. Le blindage ne s’applique pas une seconde fois au rigger.</p>
            {v.legereRecente && <button type="button" className={bouton} onClick={() => executer({ id: id(), type: 'fin-malus', vehiculeId: v.id })}>Fin de la prochaine narration du véhicule : expirer le malus léger</button>}
        </>}
        {message && <p role="status">{message}</p>}
    </fieldset>;
}
