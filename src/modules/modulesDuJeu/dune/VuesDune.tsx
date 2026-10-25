import { useState } from 'react';
import type { CommandeDeModule, ResultatDeModule } from '../protocole';
import { ARENES_DUNE, type ConflitDune, type ZoneDune } from '../../dice/systemes/conflitsDeDune';
import { menaceInitialeDune } from '../../dice/systemes/duneRegles';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
const champ = 'rounded border border-app-border/50 bg-app-bg p-2 text-app-text';
const bouton = 'rounded border border-app-border/50 px-3 py-2 hover:border-accent disabled:opacity-30';
type Props = { vue: ConflitDune; envoyerCommande: (c: CommandeDeModule) => Promise<ResultatDeModule> };
const types = ['Naissante', 'Mineure', 'Majeure', 'Grande Maison'];
export function PlateauDune({ vue }: { vue: ConflitDune }) {
    return <div data-plateau-dune className="space-y-4 p-4 text-app-text"><header><h2 className="text-xl font-bold">{vue.maison.nom || 'Dune'} · {vue.arene}</h2><p>{vue.mode === 'agent' ? 'Agent' : 'Architecte'} · {vue.scene}</p></header>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{vue.zones.map(z => <article key={z.id} className="space-y-2 rounded-xl border border-app-border/50 bg-app-surface p-4"><h3 className="font-bold">{z.nom} {!z.visible && '(MJ)'}</h3><p>{z.traits}</p><p>Reliée à : {z.liens.map(l => vue.zones.find(x => x.id === l)?.nom).join(', ') || '—'}</p>
            {vue.arene === 'intrigue' && <><p>Disposition : {z.disposition || 'inconnue'}</p><p>Désir : {z.desir || 'à découvrir'}</p></>}
            {vue.atouts.filter(a => a.zone === z.id).map(a => <p key={a.id}><strong>{a.nom}</strong> · Q{a.qualite} · {a.proprietaire} · {a.usage} {a.neutralise && '· neutralisé'} {!a.visible && '· MJ'}</p>)}
        </article>)}</div>
        {vue.atouts.filter(a => !a.zone).map(a => <p key={a.id}>{a.nom} · réserve · Q{a.qualite}</p>)}
        <details><summary>La Maison {vue.maison.nom}</summary>{(['monde', 'domaines', 'roles', 'allies', 'ennemis', 'atouts'] as const).map(k => <p key={k}>{k} : {vue.maison[k]}</p>)}</details>
    </div>;
}
export function PupitreDune({ vue, envoyerCommande }: Props) {
    const [erreur, setErreur] = useState(''), [zone, setZone] = useState<Partial<ZoneDune>>({ nom: '', visible: true, discipline: 4 }), [autre, setAutre] = useState('');
    const [atout, setAtout] = useState({ nom: '', proprietaire: '', zone: '', qualite: 0, usage: 'offensif', tangible: true, permanent: true, visible: true, militaire: false });
    const [destination, setDestination] = useState(''), [scene, setScene] = useState(''), [joueurs, setJoueurs] = useState(4), [ajustement, setAjustement] = useState(0);
    const [analyse, setAnalyse] = useState(6);
    const [maison, setMaison] = useState(vue.maison);
    const envoyer = async (id: string, charge: unknown) => { const r = await envoyerCommande({ id, charge }); setErreur(r.ok ? '' : r.erreur); return r.ok; };
    const menace = menaceInitialeDune(maison.type, joueurs, ajustement);
    return <div className="space-y-4 text-sm">
        <PlateauDune vue={vue} />
        <div className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2"><label>Conflit <select className={champ} value={vue.arene} onChange={e => void envoyer('cadre', { arene: e.target.value, mode: vue.mode })}>{ARENES_DUNE.map(a => <option key={a}>{a}</option>)}</select></label><label>Mode <select className={champ} value={vue.mode} onChange={e => void envoyer('cadre', { arene: vue.arene, mode: e.target.value })}><option value="agent">Agent</option><option value="architecte">Architecte</option></select></label></div>
            <p>Les zones sont abstraites. En mode Architecte, perdre une unité n’inflige aucune blessure au commandant. Les mouvements, attaques et dépenses restent validés par le MJ.</p>
            <details><summary>Préparer les zones</summary><div className="flex flex-wrap gap-2 pt-2">
                <input className={champ} aria-label="Nom de la zone Dune" placeholder="Lieu, personne ou faction" value={zone.nom} onChange={e => setZone(z => ({ ...z, nom: e.target.value }))} />
                <input className={champ} aria-label="Traits de zone Dune" placeholder="Traits et obstacles" value={zone.traits ?? ''} onChange={e => setZone(z => ({ ...z, traits: e.target.value }))} />
                <input className={champ} aria-label="Disposition Dune" placeholder="Disposition (connue)" value={zone.disposition ?? ''} onChange={e => setZone(z => ({ ...z, disposition: e.target.value }))} />
                <input className={champ} aria-label="Désir secret Dune" placeholder="Désir secret du MJ" value={zone.desir ?? ''} onChange={e => setZone(z => ({ ...z, desir: e.target.value }))} />
                <label>Discipline <input className={`w-16 ${champ}`} type="number" min={4} max={8} value={zone.discipline} onChange={e => setZone(z => ({ ...z, discipline: Number(e.target.value) }))} /></label>
                <label><input type="checkbox" checked={zone.visible} onChange={e => setZone(z => ({ ...z, visible: e.target.checked }))} /> Visible</label>
                <label><input type="checkbox" checked={zone.desirRevele ?? false} onChange={e => setZone(z => ({ ...z, desirRevele: e.target.checked }))} /> Désir révélé</label>
                <button type="button" className={bouton} disabled={!zone.nom?.trim()} onClick={() => void envoyer('zone', { ...zone, id: zone.id || crypto.randomUUID() })}>Enregistrer la zone</button>
            </div>
            {vue.zones.map(z => <div className="flex flex-wrap gap-2 pt-2" key={z.id}><span>{z.nom}</span><button type="button" className={bouton} onClick={() => setZone(z)}>Modifier {z.nom}</button><select className={champ} aria-label={`Relier ${z.nom}`} value={autre} onChange={e => setAutre(e.target.value)}><option value="">Zone adjacente</option>{vue.zones.filter(x => x.id !== z.id).map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}</select><button type="button" className={bouton} disabled={!autre} onClick={() => void envoyer('lier', { zoneId: z.id, autreId: autre })}>Relier</button>
                <button type="button" className={bouton} onClick={() => void envoyer('zone', { ...z, desirRevele: true })}>Révéler le désir</button>
                <label>Analyse <input className={`w-16 ${champ}`} type="number" min={4} max={8} value={analyse} onChange={e => setAnalyse(Number(e.target.value))} /></label><button type="button" className={bouton} onClick={() => void envoyer('desir', { zoneId: z.id, reussi: true, analyse })}>Enquête réussie : +Analyse−2 ({z.decouverte}/{z.discipline})</button>
            </div>)}</details>
            <details><summary>Atouts et déplacements</summary><div className="flex flex-wrap gap-2 pt-2">
                {(['nom', 'proprietaire'] as const).map(k => <input key={k} className={champ} aria-label={`Atout ${k}`} placeholder={k} value={atout[k]} onChange={e => setAtout(a => ({ ...a, [k]: e.target.value }))} />)}
                <label>Qualité <input className={`w-16 ${champ}`} type="number" min={0} max={4} value={atout.qualite} onChange={e => setAtout(a => ({ ...a, qualite: Number(e.target.value) }))} /></label>
                <select className={champ} aria-label="Usage de l’atout partagé" value={atout.usage} onChange={e => setAtout(a => ({ ...a, usage: e.target.value }))}>{['offensif', 'defensif', 'autre'].map(u => <option key={u}>{u}</option>)}</select>
                {(['tangible', 'permanent', 'visible', 'militaire'] as const).map(k => <label key={k}><input type="checkbox" checked={atout[k]} onChange={e => setAtout(a => ({ ...a, [k]: e.target.checked }))} /> {k}</label>)}
                <button type="button" className={bouton} disabled={!atout.nom.trim()} onClick={() => void envoyer('atout', { ...atout, id: crypto.randomUUID() })}>Ajouter au conflit</button>
            </div>
            <label>Destination <select className={champ} value={destination} onChange={e => setDestination(e.target.value)}><option value="">Choisir une zone</option>{vue.zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}</select></label>
            {vue.atouts.map(a => <div key={a.id} className="flex flex-wrap gap-2 pt-2"><span>{a.nom}</span><button type="button" className={bouton} disabled={!destination || a.neutralise} onClick={() => void envoyer('deplacer', { atoutId: a.id, zoneId: destination })}>Déplacer d’une zone</button><button type="button" className={bouton} onClick={() => void envoyer(a.neutralise ? 'recuperer' : 'neutraliser', { atoutId: a.id })}>{a.neutralise ? 'Récupérer' : a.tangible ? 'Neutraliser' : 'Détruire'}</button></div>)}
            <p>Déplacement : difficulté 2. Discrétion réussie : rétention gratuite ; audace réussie : déplacement d’un atout adverse. Échec : réaction adverse et aucune rétention. Une zone supplémentaire ou un second atout coûte 2 Impulsion ; appliquez le paiement au bandeau avant le second mouvement.</p></details>
            <details><summary>Maison et début de séance</summary><div className="space-y-2 pt-2">
                {(['nom', 'monde', 'domaines', 'roles', 'allies', 'ennemis', 'atouts'] as const).map(k => <label className="block" key={k}>{k} <input className={champ} value={maison[k]} onChange={e => setMaison(m => ({ ...m, [k]: e.target.value }))} /></label>)}
                <label>Type <select className={champ} value={maison.type} onChange={e => setMaison(m => ({ ...m, type: Number(e.target.value) }))}>{types.map((t, i) => <option key={t} value={i}>{t}</option>)}</select></label>
                <button type="button" className={bouton} onClick={() => void envoyer('maison', maison)}>Enregistrer la Maison</button>
                <label>Joueurs présents <input className={`w-16 ${champ}`} type="number" min={0} value={joueurs} onChange={e => setJoueurs(Number(e.target.value))} /></label><label>Ajustement MJ <input className={`w-16 ${champ}`} type="number" value={ajustement} onChange={e => setAjustement(Number(e.target.value))} /></label>
                <button type="button" className={bouton} onClick={() => { const s = useSessionOSStore.getState(), r = s.getActiveDriver()?.ressourcesDeTable; if (s.activeCampaignId && r) { useRessourcesDeTableStore.getState().fixer(s.activeCampaignId, r, 'menace', menace, 'Dune : début de séance, Maison et joueurs présents'); setErreur(''); } else setErreur('Campagne Dune active requise.'); }}>Début de séance : fixer la Menace à {menace}</button>
                <p>Ce geste remplace la Menace actuelle après votre clic. La Détermination se remet au début d’aventure sur chaque fiche.</p>
            </div></details>
            <input className={champ} aria-label="Nouvelle scène du plateau Dune" placeholder="Nouvelle scène" value={scene} onChange={e => setScene(e.target.value)} /><button type="button" className={bouton} disabled={!scene.trim() || scene === vue.scene} onClick={() => void envoyer('scene', { nom: scene })}>Changer de scène (retirer les atouts temporaires)</button>
            {erreur && <p role="alert" className="text-etat-danger">{erreur}</p>}
        </div>
    </div>;
}
