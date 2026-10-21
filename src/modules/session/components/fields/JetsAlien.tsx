import { useState } from 'react';
import { ajouterUneCibleSecondaire, budgetDesEclats, depenserUnEclat, eclatsDeLaCompetence, type EquipementAlien, type JetAlien, type ReglagesDuJetAlien } from '../../../dice/systemes/jetsAlien';

const entree = 'min-w-0 w-full rounded border border-app-border bg-app-bg p-1 text-app-text';
const bouton = 'rounded border border-app-border px-2 py-1 hover:bg-app-text/5 disabled:opacity-40';
export function PreparationAlien({ reglages, changer, equipements, tir = false }: { reglages: ReglagesDuJetAlien; changer: (v: ReglagesDuJetAlien) => void; equipements: EquipementAlien[]; tir?: boolean }) {
    const nombre = (cle: 'outil' | 'situation', label: string) => <label>{label}<input type="number" step="1" className={entree} value={reglages[cle]} onChange={e => changer({ ...reglages, [cle]: Math.trunc(Number(e.target.value) || 0) })} /></label>;
    return <section data-preparation-alien className="space-y-2 rounded-lg border border-app-border p-2 text-xs text-app-text">
        <p className="font-bold">Préparer le test Alien</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label>Arme de la fiche<select className={entree} value={reglages.equipement} onChange={e => changer({ ...reglages, equipement: e.target.value, automatique: false })}><option value="">Aucune</option>{equipements.map(a => <option key={a.id} value={a.id}>{a.nom} ({a.bonus >= 0 ? '+' : ''}{a.bonus})</option>)}</select></label>
            {nombre('outil', 'Bonus d’outil ou de talent')}{nombre('situation', 'Modificateur de situation')}
            <label>Personnes qui aident<select className={entree} value={reglages.aide} onChange={e => changer({ ...reglages, aide: Number(e.target.value) })}>{[0, 1, 2, 3].map(n => <option key={n} value={n}>{n} (+{n} dé{n > 1 ? 's' : ''})</option>)}</select></label>
            <label>Rôle dans le test<select className={entree} value={reglages.role} onChange={e => changer({ ...reglages, role: e.target.value as ReglagesDuJetAlien['role'] })}><option value="simple">Test simple</option><option value="attaquant">Attaquant en opposition</option><option value="defenseur">Défenseur en opposition</option></select></label>
        </div>
        {tir && <div data-tir-alien className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label><input type="checkbox" checked={!!reglages.viser} onChange={e => changer({ ...reglages, viser: e.target.checked })} />Visée préalable : +2 (action rapide)</label>
            <label><input type="checkbox" checked={!!reglages.automatique} onChange={e => changer({ ...reglages, automatique: e.target.checked })} />Mode automatique : +2 dés, Stress +1 avant le tir</label>
            <label>Portée de la cible<select className={entree} value={reglages.portee ?? 1} onChange={e => changer({ ...reglages, portee: Number(e.target.value) })}>{['Contact','Courte','Moyenne','Longue','Extrême'].map((p,i) => <option key={p} value={i}>{p}</option>)}</select></label>
            <label><input type="checkbox" checked={!!reglages.sansDefense} onChange={e => changer({ ...reglages, sansDefense: e.target.checked })} />Au Contact : cible sans défense ou ignorant le tireur (+3)</label>
            <label>Taille de la cible<select className={entree} value={reglages.taille ?? 0} onChange={e => changer({ ...reglages, taille: Number(e.target.value) })}><option value="0">Ordinaire</option><option value="2">Grande (+2)</option><option value="-2">Petite (−2)</option></select></label>
            <label>Lumière<select className={entree} value={reglages.lumiere ?? 0} onChange={e => changer({ ...reglages, lumiere: Number(e.target.value) })}><option value="0">Normale</option><option value="-1">Pénombre (−1)</option><option value="-2">Obscurité (−2)</option></select></label>
        </div>}
        <p>L’aide se déclare avant le lancer, avec l’accord de Maman ; au combat, elle coûte le même type d’action que celle aidée.</p>
    </section>;
}

export function SuitesDuJetAlien({ jet, ecrire }: { jet: JetAlien; ecrire: (v: JetAlien, texte: string) => void }) {
    const [defense, setDefense] = useState(0);
    const [nouvelleCible, setNouvelleCible] = useState(''), [cible, setCible] = useState('');
    const cibles = jet.eclats.filter(e => e.id === 'cible-secondaire').map(e => e.cible!);
    const budget = budgetDesEclats(jet);
    const depense = jet.eclats.filter(e => e.id === 'degat' && !e.cible).length;
    const degats = jet.equipement?.degats;
    return <section data-suites-alien className="space-y-2 rounded-lg border border-app-border p-3 text-xs text-app-text">
        <p className="font-bold">Dernier test Alien — {jet.nomCompetence}</p><p>{jet.composition}</p>
        {jet.equipement && <p>{jet.equipement.nom} : Bonus {jet.equipement.bonus}, Dégâts {degats ?? 'à renseigner'}, Portée {jet.equipement.portee || 'à renseigner'}.</p>}
        {jet.paniqueEnAttente ? <p>Actions d’éclat indisponibles tant que la Panique n’est pas résolue.</p> : jet.annule ? <p>Action annulée par la Panique : aucune action d’éclat ni dégâts à appliquer.</p> : <>
            {jet.role === 'attaquant' && (jet.defense === undefined ? <div className="flex flex-wrap gap-2 items-end"><label>Réussites du défenseur<input type="number" min="0" step="1" className={entree} value={defense} onChange={e => setDefense(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} /></label><button type="button" className={bouton} onClick={() => ecrire({ ...jet, defense }, `Opposition : ${jet.reussites} − ${defense} ; l’égalité échoue pour l’attaquant.`)}>Résoudre l’opposition</button></div> : <p>Opposition résolue : {jet.reussites} − {jet.defense} = {Math.max(0, jet.reussites - jet.defense)} réussite(s) nette(s).</p>)}
            {jet.role === 'defenseur' ? <p>{jet.reussites} réussite(s) de défense à transmettre. Le défenseur ne peut pas forcer.</p> : <>
                <p>Actions d’éclat disponibles : {budget}.</p>
                {jet.automatique && <div className="space-y-1"><label>Cible secondaire à Courte portée de la cible initiale (validée par Maman)<input className={entree} value={nouvelleCible} onChange={e => setNouvelleCible(e.target.value)} /></label>
                    <button type="button" className={bouton} disabled={!nouvelleCible.trim() || budget < 1} onClick={() => { const suite = ajouterUneCibleSecondaire(jet,nouvelleCible); if (suite !== jet) { ecrire(suite, `Six affecté à ${nouvelleCible}`); setNouvelleCible(''); } }}>Affecter un six à cette cible</button>
                    <label>Cible des prochains éclats<select className={entree} value={cibles.includes(cible) ? cible : ''} onChange={e => setCible(e.target.value)}><option value="">Cible principale</option>{cibles.map(c => <option key={c}>{c}</option>)}</select></label>
                    {cibles.map(c => <p key={c}>{c} : {(degats ?? 0) + jet.eclats.filter(e => e.id === 'degat' && e.cible === c).length} dégâts préparés avant protection.</p>)}
                </div>}
                {jet.competence === 'commandement' && <p>Chaque réussite donne +1 au test de la personne qui exécute l’ordre ; l’autre usage arrête la Panique selon ses règles.</p>}
                {jet.competence === 'soins' && <p>Chaque réussite rend un point de Santé à un personnage Brisé ; les soins et critiques sont résolus séparément.</p>}
                <div className="flex flex-wrap gap-2">{eclatsDeLaCompetence(jet.competence).map(e => <button type="button" key={e.id} className={bouton} disabled={budget <= 0 || (!e.repetable && jet.eclats.some(x => x.id === e.id && x.cible === (cible || undefined)))} title={e.rappel} onClick={() => { const suite = depenserUnEclat(jet, e.id, cibles.includes(cible) ? cible : undefined); if (suite !== jet) ecrire(suite, `${e.label}${cible ? ` (${cible})` : ''} — ${e.rappel}`); }}>{e.label}</button>)}</div>
                {degats !== undefined && ['rapproche', 'distance'].includes(jet.competence ?? '') && jet.reussites > (jet.defense ?? 0) && (jet.role !== 'attaquant' || jet.defense !== undefined) && <p>Dégâts préparés : {degats} + {depense} = {degats + depense}, avant protection. Aucun dégât appliqué automatiquement.</p>}
            </>}
        </>}
        {jet.eclats.length > 0 && <ul className="space-y-1">{jet.eclats.map((e, i) => <li key={i}>{e.label} — {e.rappel}</li>)}</ul>}
        <p>Les choix sont conservés sur la fiche. Maman arbitre les cibles et les suites ; une dépense d’éclat clôt le forçage et les Points de Récit de ce test.</p>
    </section>;
}
