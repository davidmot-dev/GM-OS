import { useState } from 'react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { lireCibleCoc, ecrireCibleCoc, preparerPnjCoc } from '../coc';
import { CARACTERISTIQUES_COC, ROLES_COC, lireProfilCoc, refusProfilCoc, membresRestantsCoc, bonusBandeCoc, type ProfilPnjCoc, type RoleCoc } from '../../dice/systemes/profilsDeCoc';
import { boutonCoc, champCoc, SanteCoc } from '../../session/components/fields/CartesCoc';
import { useSourcesCoc } from '../../session/components/fields/useSourcesCoc';
import PanneauDeJet from '../../session/components/fields/PanneauDeJet';
import { isMainWindow } from '../../../utils/windowRole';

function ProfilCoc({ cle }: { cle: string }) {
    const sources = useSourcesCoc(), source = sources.find(s => s.cle === cle), c = source && lireCibleCoc(source.cible);
    const [p, setP] = useState<ProfilPnjCoc>(() => c && lireProfilCoc(c.fiche) || { role: 'figurant', pulp: false, caracteristiques: ['force'], capacites: [] });
    const [message, setMessage] = useState('');
    const templates = useSessionOSStore(s => s.customSheetTemplates);
    if (!c || !source) return null;
    const actif = lireProfilCoc(c.fiche), template = templates.find(t => t.id === c.pilote.templateId), refus = refusProfilCoc(p);
    const maj = (m: Record<string, unknown>) => ecrireCibleCoc(source.cible, m);
    const nombre = ROLES_COC[p.role].caracteristiques;
    return <div className="flex flex-col gap-3" data-profil-coc>
        {c.cible.type !== 'pc' && <details open><summary className="font-bold">Préparer le rôle du PNJ</summary>
            <fieldset className="flex flex-col gap-2 py-2" disabled={!isMainWindow()}>
                <label>Rôle <select className={champCoc} aria-label="Rôle du PNJ" value={p.role} onChange={e => { const role = e.target.value as RoleCoc; setP({ ...p, role, caracteristiques: [...CARACTERISTIQUES_COC].slice(0, ROLES_COC[role].caracteristiques), capacites: [] }); }}>{Object.entries(ROLES_COC).map(([id, r]) => <option key={id} value={id}>{r.nom}</option>)}</select></label>
                <label><input type="checkbox" aria-label="Santé Pulp du PNJ" checked={p.pulp} onChange={e => setP({ ...p, pulp: e.target.checked })} /> Santé Pulp (sinon 20 échelons)</label>
                <p>{nombre} choix de caractéristique à +2 ; DEF/Init {ROLES_COC[p.role].defense} ; budget de capacités {ROLES_COC[p.role].points}.</p>
                <div className="flex flex-wrap gap-2">{Array.from({ length: nombre }, (_, i) => <label key={i}>+2 n°{i + 1} <select aria-label={`Caractéristique +2 numéro ${i + 1}`} className={champCoc} value={p.caracteristiques[i] ?? ''} onChange={e => setP({ ...p, caracteristiques: Array.from({ length: nombre }, (_, n) => n === i ? e.target.value : p.caracteristiques[n] ?? '') })}>
                    <option value="">Choisir</option>{CARACTERISTIQUES_COC.map(id => <option key={id}>{id}</option>)}
                </select></label>)}</div>
                {p.capacites.map((cap, i) => <div className="flex flex-wrap gap-2" key={i}>
                    <input aria-label={`Capacité ${i + 1}`} className={champCoc} placeholder="Nom de capacité" value={cap.nom} onChange={e => setP({ ...p, capacites: p.capacites.map((a, n) => n === i ? { ...a, nom: e.target.value } : a) })} />
                    <select aria-label={`Niveau de capacité ${i + 1}`} className={champCoc} value={cap.niveau} onChange={e => setP({ ...p, capacites: p.capacites.map((a, n) => n === i ? { ...a, niveau: e.target.value as 'pro' | 'expert' } : a) })}><option value="pro">Pro (1 point)</option><option value="expert">Expert (2 points)</option></select>
                    <input aria-label={`Contexte de capacité ${i + 1}`} className={champCoc} placeholder="Effet et contexte du livre" value={cap.detail} onChange={e => setP({ ...p, capacites: p.capacites.map((a, n) => n === i ? { ...a, detail: e.target.value } : a) })} />
                    <button className={boutonCoc} onClick={() => setP({ ...p, capacites: p.capacites.filter((_, n) => n !== i) })}>Retirer</button>
                </div>)}
                <button className={boutonCoc} onClick={() => setP({ ...p, capacites: [...p.capacites, { nom: '', niveau: 'pro', detail: '' }] })}>Ajouter une capacité</button>
                <label><input type="checkbox" aria-label="Bande de sbires" checked={p.bande !== undefined} onChange={e => setP({ ...p, bande: e.target.checked ? 3 : undefined })} /> Bande de sbires</label>
                {p.bande !== undefined && <label>Effectif initial <input aria-label="Effectif initial" className={champCoc} type="number" min={1} max={100} value={p.bande} onChange={e => setP({ ...p, bande: Number(e.target.value) })} /></label>}
                {refus && <p>{refus}</p>}
                <button className={boutonCoc} disabled={!!refus} onClick={() => setMessage(preparerPnjCoc(source.cible, p))}>Confirmer le profil PNJ</button>
                <p>La confirmation remplace les caractéristiques et la DEF/Init par le rôle choisi ; les blessures restent conservées. Les effets des capacités s’appliquent seulement dans leur contexte.</p>
            </fieldset>
        </details>}
        {actif?.bande && <p data-bande-coc>Bande : {membresRestantsCoc(actif, Number(c.fiche[c.regle.sante!]) || 0)} membres ; surnombre : +{bonusBandeCoc(membresRestantsCoc(actif, Number(c.fiche[c.regle.sante!]) || 0))} sans autre condition. Les membres supplémentaires ajoutent automatiquement leurs conditions favorables à celles du jet ; ne pas les compter aussi dans « Conditions » ou « Autre ». Une attaque et un mouvement par tour.</p>}
        {actif?.capacites.map((a, i) => <p key={i}>{a.nom} ({a.niveau}) : {a.detail || 'consulter le livre p. 110–111'}</p>)}
        {c.cible.type !== 'pc' && <details><summary>Valeurs d’attaque et arme</summary><fieldset disabled={!isMainWindow()} className="flex flex-wrap gap-2 py-2">
            {['attaque_au_contact', 'attaque_a_distance', 'arme1_attaque', 'protection_rd'].map(id => <label key={id}>{id.replaceAll('_', ' ')} <input aria-label={id} className={champCoc} type="number" value={Number(c.fiche[id]) || 0} onChange={e => maj({ [id]: Number(e.target.value) })} /></label>)}
            {['arme1', 'arme1_dm', 'arme1_bc'].map(id => <label key={id}>{id.replaceAll('_', ' ')} <input aria-label={id} className={champCoc} value={String(c.fiche[id] ?? '')} onChange={e => maj({ [id]: e.target.value })} /></label>)}
            <p>ATC/ATD : retenir le bonus de capacité applicable ou la caractéristique, sans les additionner (p. 111). Le type d’arme se précise au résultat.</p>
        </fieldset></details>}
        <SanteCoc cible={source.cible} />
        {template && <details><summary>Lancer un test pour {c.nom}</summary><PanneauDeJet key={cle} descripteur={c.pilote.jet!} dice={c.pilote.dice} template={template} valeurs={c.fiche} personnageId={c.cible.id} campaignId={c.campaignId} ecrireSurLaFiche={maj} /></details>}
        {message && <p role="status">{message}</p>}
    </div>;
}
export default function PanneauDeCoc() {
    const sources = useSourcesCoc(), [cle, setCle] = useState('');
    return <details className="border border-app-border rounded-xl bg-app-surface p-3 text-xs" data-panneau-combat-coc>
        <summary className="font-bold text-accent">COC — rôles, santé et tests des adversaires</summary>
        <div className="flex flex-col gap-3 pt-3"><label>Personnage <select aria-label="Personnage COC" className={champCoc} value={cle} onChange={e => setCle(e.target.value)}><option value="">Choisir</option>{sources.map(s => <option key={s.cle} value={s.cle}>{s.nom}</option>)}</select></label>
            {sources.some(s => s.cle === cle) && <ProfilCoc key={cle} cle={cle} />}
        </div>
    </details>;
}
