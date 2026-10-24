import { useState, type ReactNode } from 'react';
import type { CommandeDeModule, ResultatDeModule } from '../protocole';
import type {
    ArmeDeVaisseau, Defi, Fonction, QualiteDEquipage, Systeme, TacheEtendue, VaisseauLointain, VaisseauVu, VueOperations,
} from '../../../../outils/star-trek/operations/moteur.mjs';
import {
    FONCTIONS, LIBELLES_DES_FONCTIONS, LIBELLES_DES_SYSTEMES, QUALITES, QUALITES_D_EQUIPAGE, SECOUSSES, SYSTEMES, brechesDu,
} from '../../../../outils/star-trek/operations/moteur.mjs';
import '../../../../outils/star-trek/operations/style.css';

/**
 * **La bataille spatiale et les tâches étendues de Star Trek** — 23/10/2026, à la
 * demande de David (« toutes les améliorations de Star Trek »), dans l'habillage du
 * module LCARS (« Prend le style du module existant de star trek ») : coude et
 * bandeau, rail, cartes et boutons de `outils/star-trek/lcars/style.css`. Le pupitre
 * du meneur tient les vaisseaux et applique ce que les jets du panneau ont produit ;
 * la tablette montre le vaisseau de l'équipage, ceux d'en face de loin, et les tâches
 * que le meneur rend visibles. Moteur : `outils/star-trek/operations/`.
 */
type Envoyer = (commande: CommandeDeModule) => Promise<ResultatDeModule>;
type Props = { vue: VueOperations; envoyerCommande: Envoyer };
type EnvoiDuModule = (cmd: string, charge?: unknown) => Promise<boolean>;

const estComplet = (v: VaisseauVu | VaisseauLointain): v is VaisseauVu => 'systemes' in v;
const nombre = (v: string, defaut = 0) => (v.trim() !== '' && Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : defaut);
const id = (prefixe: string, nom: string) => `${prefixe}-${nom.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'x'}-${Date.now().toString(36)}`;

function useEnvoi(envoyerCommande: Envoyer) {
    const [erreur, setErreur] = useState<string | null>(null);
    const envoyer: EnvoiDuModule = async (cmd, charge = {}) => {
        const r = await envoyerCommande({ id: cmd, charge });
        setErreur(r.ok ? null : r.erreur);
        return r.ok;
    };
    return { erreur, envoyer };
}

/** Le cadre LCARS : coude, bandeau d'en-tête, rail ; l'alerte suit l'état du vaisseau de l'équipage. */
function Cadre({ titre, sousTitre, etat, alerte, enfants }: { titre: string; sousTitre: string; etat: string; alerte: '' | 'jaune' | 'rouge'; enfants: ReactNode }) {
    return (
        <div className={`lcars-prototype lcars-operations${alerte ? ` lcars-alerte-${alerte}` : ''}`}>
            <header className="lcars-entete">
                <div className="lcars-coude" aria-hidden="true">OPS</div>
                <div className="lcars-identite"><p>{sousTitre}</p><h2>{titre}</h2></div>
                <span className="lcars-etat">{etat}</span>
            </header>
            <div className="lcars-corps">
                <div className="lcars-rail" aria-hidden="true"><span>VSX</span><span>BCL</span><span>TÂC</span><span /></div>
                <div className="lcars-espace">{enfants}</div>
            </div>
        </div>
    );
}

function alerteDe(vaisseaux: (VaisseauVu | VaisseauLointain)[]): { alerte: '' | 'jaune' | 'rouge'; etat: string } {
    const nous = vaisseaux.filter(estComplet).filter(v => v.camp === 'joueurs');
    if (nous.some(v => v.critiques || v.noyau === 'instable' || v.boucliers === 0 && v.bouclierLeves)) return { alerte: 'rouge', etat: 'ALERTE ROUGE' };
    if (nous.some(v => v.secoue || v.bouclierMax > 0 && v.boucliers < v.bouclierMax / 2)) return { alerte: 'jaune', etat: 'ALERTE JAUNE' };
    return { alerte: '', etat: 'CONDITION VERTE' };
}

/** Les Boucliers en barre, avec les deux paliers : la moitié, puis le quart (p. 308–309). */
function Boucliers({ valeur, max }: { valeur: number; max: number }) {
    const pct = max ? Math.round((100 * valeur) / max) : 0;
    return (
        <div className="lcars-ops-boucliers" aria-label={`Boucliers ${valeur} sur ${max}`} data-boucliers>
            <div className="lcars-ops-boucliers-legende"><span>BOUCLIERS</span><span>{valeur} / {max}</span></div>
            <div className={`lcars-ops-barre${pct < 25 ? ' lcars-ops-quart' : pct < 50 ? ' lcars-ops-moitie' : ''}`}>
                <span style={{ width: `${pct}%` }} />
                <span className="lcars-ops-palier" style={{ left: '50%' }} />
                <span className="lcars-ops-palier" style={{ left: '25%' }} />
            </div>
        </div>
    );
}

function Jauge({ t }: { t: TacheEtendue }) {
    return (
        <div className={`lcars-ops-jauge${t.genre === 'consequence' ? ' lcars-ops-consequence' : ''}`} aria-label={`${t.coches} sur ${t.jauge}`}>
            {Array.from({ length: t.jauge }, (_, i) => (
                <span key={i} className={`${t.avancees.includes(i + 1) ? 'lcars-ops-avancee' : ''} ${i < t.coches ? 'lcars-ops-coche' : ''}`} />
            ))}
        </div>
    );
}

function LeVaisseau({ v, meneur, envoyer }: { v: VaisseauVu; meneur: boolean; envoyer?: EnvoiDuModule }) {
    const etat = (charge: Record<string, unknown>) => envoyer?.('etat-vaisseau', { vaisseauId: v.id, ...charge });
    return (
        <article className="lcars-carte" data-vaisseau={v.id}>
            <div className="lcars-ops-entete">
                <h3>{v.nom}{v.detruit ? ' — détruit' : ''}</h3>
                <span className="lcars-ops-discret">{v.camp === 'joueurs' ? 'Équipage' : `Adverse${v.qualiteEquipage ? ` · ${QUALITES_D_EQUIPAGE[v.qualiteEquipage].label}` : ''}`} · Envergure {v.envergure} · Résistance {v.resistance}</span>
            </div>
            <Boucliers valeur={v.boucliers} max={v.bouclierMax} />
            <p className="lcars-ops-discret">
                {v.bouclierLeves ? 'Boucliers levés' : 'Boucliers abaissés'} · {v.armementEngage ? 'armement engagé' : 'armement désengagé'} · {v.energie ? 'réserves d’énergie pleines' : 'réserves d’énergie vides'}
            </p>
            {v.secoue && <p className="lcars-ops-attention">Secoué — {SECOUSSES[v.secoue]}</p>}
            {v.critiques && <p className="lcars-ops-danger">Dégâts critiques : il ne fonctionne plus ; une brèche de plus le détruit.</p>}
            {v.noyau && <p className="lcars-ops-danger">Noyau de distorsion : {v.noyau === 'instable' ? 'instable — un d20 à chaque fin de round contre l’Ingénierie' : v.noyau === 'ejecte' ? 'éjecté, il explosera à distance' : 'stabilisé'}.</p>}
            <dl className="lcars-ops-valeurs">
                {SYSTEMES.map(s => (
                    <div key={s} className={v.detruits.includes(s) ? 'lcars-ops-detruit' : ''}>
                        <dt>{LIBELLES_DES_SYSTEMES[s].toUpperCase()}</dt>
                        <dd>{v.systemes[s]}{brechesDu(v, s) ? ` · ${brechesDu(v, s)} br.` : ''}</dd>
                    </div>
                ))}
                {FONCTIONS.map(f => (
                    <div key={f}><dt>{LIBELLES_DES_FONCTIONS[f].toUpperCase()}</dt><dd>{v.fonctions[f]}</dd></div>
                ))}
            </dl>
            {v.armes.length > 0 && (
                <ul>
                    {v.armes.map(a => <li key={a.id}>{a.nom} — {a.type === 'torpille' ? 'torpille, difficulté 3, +1 Menace' : 'énergie, difficulté 2'}, portée {a.portee}, dégâts {v.degatsDesArmes[a.id]}{a.qualites.length ? ` (${a.qualites.join(', ')})` : ''}</li>)}
                </ul>
            )}
            {v.breches.length > 0 && (
                <ul data-breches>
                    {v.breches.map(b => (
                        <li key={b.id} className="lcars-ops-ligne">
                            <span className={b.colmatee ? 'lcars-ops-discret' : 'lcars-ops-danger'}>Brèche {LIBELLES_DES_SYSTEMES[b.systeme]}{b.intensite > 1 ? ` ${b.intensite}` : ''}{b.colmatee ? ' (colmatée)' : ''}</span>
                            {meneur && !b.colmatee && <button type="button" onClick={() => envoyer?.('colmater', { vaisseauId: v.id, brecheId: b.id })}>Colmater</button>}
                            {meneur && <button type="button" onClick={() => envoyer?.('reparer', { vaisseauId: v.id, brecheId: b.id })}>Réparer</button>}
                        </li>
                    ))}
                </ul>
            )}
            {meneur && (
                <div className="lcars-ops-actions">
                    <button type="button" onClick={() => etat({ bouclierLeves: !v.bouclierLeves })}>{v.bouclierLeves ? 'Abaisser les Boucliers' : 'Lever les Boucliers'}</button>
                    <button type="button" onClick={() => etat({ armementEngage: !v.armementEngage })}>{v.armementEngage ? 'Désengager l’armement' : 'Engager l’armement'}</button>
                    <button type="button" onClick={() => etat({ energie: !v.energie })}>{v.energie ? 'Dépenser l’énergie' : 'Récupérer l’énergie'}</button>
                    {v.secoue && <button type="button" onClick={() => etat({ secoue: null })}>Fin de la secousse</button>}
                    {v.noyau === 'instable' && <button type="button" className="lcars-primaire" onClick={() => envoyer?.('noyau', { vaisseauId: v.id })}>Fin de round : le noyau (d20)</button>}
                    {v.noyau === 'instable' && <button type="button" onClick={() => etat({ noyau: 'stabilise' })}>Noyau stabilisé</button>}
                    {v.noyau === 'instable' && <button type="button" onClick={() => etat({ noyau: 'ejecte' })}>Noyau éjecté</button>}
                    <button type="button" onClick={() => envoyer?.('supprimer-vaisseau', { vaisseauId: v.id })}>Retirer</button>
                </div>
            )}
        </article>
    );
}

const SYSTEMES_DE_DEPART: Record<Systeme, string> = { communications: '9', ordinateurs: '9', moteurs: '9', detecteurs: '9', structure: '9', armement: '9' };
const FONCTIONS_DE_DEPART: Record<Fonction, string> = { commandement: '2', navigation: '2', ingenierie: '2', securite: '2', medecine: '2', science: '2' };

/** Créer un vaisseau : ses six systèmes, ses six fonctions, son Envergure ; la qualité d'équipage d'un vaisseau non-joueur (p. 296). */
function NouveauVaisseau({ envoyer }: { envoyer: EnvoiDuModule }) {
    const [nom, setNom] = useState('');
    const [camp, setCamp] = useState<'joueurs' | 'adverse'>('joueurs');
    const [envergure, setEnvergure] = useState('4');
    const [systemes, setSystemes] = useState(SYSTEMES_DE_DEPART);
    const [fonctions, setFonctions] = useState(FONCTIONS_DE_DEPART);
    const [qualite, setQualite] = useState<QualiteDEquipage>('competent');
    const [arme, setArme] = useState({ nom: '', type: 'energie' as ArmeDeVaisseau['type'], degats: '', portee: 'moyenne' as ArmeDeVaisseau['portee'], qualites: [] as string[] });
    const [armes, setArmes] = useState<ArmeDeVaisseau[]>([]);
    const creer = async () => {
        if (!nom.trim()) return;
        const ok = await envoyer('vaisseau', { vaisseau: {
            id: id('v', nom), nom: nom.trim(), camp, envergure: Math.max(1, nombre(envergure, 4)), bonusResistance: 0, bonusBoucliers: 0,
            qualiteEquipage: camp === 'adverse' ? qualite : null, armes,
            systemes: Object.fromEntries(SYSTEMES.map(s => [s, nombre(systemes[s], 9)])),
            fonctions: Object.fromEntries(FONCTIONS.map(f => [f, nombre(fonctions[f], 2)])),
        } });
        if (ok) { setNom(''); setArmes([]); }
    };
    return (
        <details className="lcars-carte" data-nouveau-vaisseau>
            <summary>AJOUTER UN VAISSEAU</summary>
            <div className="lcars-ops-champs">
                <label>Nom<input value={nom} onChange={e => setNom(e.target.value)} /></label>
                <label>Camp
                    <select value={camp} onChange={e => setCamp(e.target.value as 'joueurs' | 'adverse')}>
                        <option value="joueurs">Équipage</option><option value="adverse">Adverse</option>
                    </select>
                </label>
                <label>Envergure<input type="number" min={1} max={20} value={envergure} onChange={e => setEnvergure(e.target.value)} /></label>
                {camp === 'adverse' && (
                    <label>Qualité d’équipage
                        <select value={qualite} onChange={e => setQualite(e.target.value as QualiteDEquipage)}>
                            {Object.entries(QUALITES_D_EQUIPAGE).map(([k, q]) => <option key={k} value={k}>{q.label} ({q.attribut} / {q.fonction})</option>)}
                        </select>
                    </label>
                )}
            </div>
            <div className="lcars-ops-champs">
                {SYSTEMES.map(s => <label key={s}>{LIBELLES_DES_SYSTEMES[s]}<input type="number" min={0} max={20} value={systemes[s]} onChange={e => setSystemes(x => ({ ...x, [s]: e.target.value }))} /></label>)}
                {FONCTIONS.map(f => <label key={f}>{LIBELLES_DES_FONCTIONS[f]}<input type="number" min={0} max={5} value={fonctions[f]} onChange={e => setFonctions(x => ({ ...x, [f]: e.target.value }))} /></label>)}
            </div>
            <h4>Armes</h4>
            <p className="lcars-note">Dégâts de base : l’Envergure +1 pour une batterie, +2 un canon, +3 un lanceur dorsal, l’Envergure seule un réseau ; le bonus d’Armement s’ajoute (p. 226–228).</p>
            <div className="lcars-ops-champs">
                <label>Nom<input value={arme.nom} onChange={e => setArme(a => ({ ...a, nom: e.target.value }))} /></label>
                <label>Type<select value={arme.type} onChange={e => setArme(a => ({ ...a, type: e.target.value as ArmeDeVaisseau['type'] }))}><option value="energie">Énergie</option><option value="torpille">Torpille</option></select></label>
                <label>Dégâts de base<input type="number" min={0} max={40} value={arme.degats} onChange={e => setArme(a => ({ ...a, degats: e.target.value }))} /></label>
                <label>Portée<select value={arme.portee} onChange={e => setArme(a => ({ ...a, portee: e.target.value as ArmeDeVaisseau['portee'] }))}><option value="courte">Courte</option><option value="moyenne">Moyenne</option><option value="longue">Longue</option></select></label>
            </div>
            <div className="lcars-ops-ligne">
                {QUALITES.map(q => (
                    <label key={q} className="lcars-case">
                        <input type="checkbox" checked={arme.qualites.includes(q)} onChange={e => setArme(a => ({ ...a, qualites: e.target.checked ? [...a.qualites, q] : a.qualites.filter(x => x !== q) }))} />{q}
                    </label>
                ))}
            </div>
            <div className="lcars-ops-actions">
                <button type="button" disabled={!arme.nom.trim()} onClick={() => {
                    setArmes(l => [...l, { id: id('a', arme.nom), nom: arme.nom.trim(), type: arme.type, degats: Math.max(0, nombre(arme.degats)), portee: arme.portee, qualites: arme.qualites }]);
                    setArme(a => ({ ...a, nom: '', degats: '', qualites: [] }));
                }}>Ajouter l’arme</button>
                <button type="button" className="lcars-primaire" disabled={!nom.trim()} onClick={creer}>Créer le vaisseau</button>
            </div>
            {armes.length > 0 && <p className="lcars-note">{armes.map(a => `${a.nom} (${a.degats})`).join(' · ')}</p>}
        </details>
    );
}

/** Appliquer une attaque réussie au panneau : les dégâts de l'arme, l'Impulsion, les complications, le système (p. 307–309). */
function Attaque({ vaisseaux, envoyer }: { vaisseaux: VaisseauVu[]; envoyer: EnvoiDuModule }) {
    const [attaquant, setAttaquant] = useState('');
    const [armeId, setArmeId] = useState('');
    const [cible, setCible] = useState('');
    const [degats, setDegats] = useState('');
    const [plus, setPlus] = useState('0');
    const [complications, setComplications] = useState('0');
    const [systeme, setSysteme] = useState<Systeme | ''>('');
    const [devastatrice, setDevastatrice] = useState(false);
    const lAttaquant = vaisseaux.find(v => v.id === attaquant);
    const choisirArme = (a: string) => { setArmeId(a); if (lAttaquant && a) setDegats(String(lAttaquant.degatsDesArmes[a] ?? '')); };
    return (
        <section className="lcars-carte" aria-label="Appliquer une attaque" data-attaque-spatiale>
            <h3>Une attaque a touché</h3>
            <p className="lcars-note">Le tir se lance au panneau de jet : Maîtrise + Sécurité, aidé de l’Armement + Sécurité du vaisseau ; énergie difficulté 2, torpille 3 et +1 Menace (p. 305–307).</p>
            <div className="lcars-ops-champs">
                <label>Attaquant<select value={attaquant} onChange={e => { setAttaquant(e.target.value); setArmeId(''); }}><option value="">—</option>{vaisseaux.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}</select></label>
                <label>Arme<select value={armeId} onChange={e => choisirArme(e.target.value)}><option value="">—</option>{lAttaquant?.armes.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}</select></label>
                <label>Cible<select value={cible} onChange={e => setCible(e.target.value)}><option value="">—</option>{vaisseaux.filter(v => v.id !== attaquant && !v.detruit).map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}</select></label>
                <label>Dégâts<input type="number" min={0} value={degats} onChange={e => setDegats(e.target.value)} aria-label="Dégâts de l’attaque" /></label>
                <label>+ Dégâts (2 Impulsion chacun, 1 si Puissant)<input type="number" min={0} value={plus} onChange={e => setPlus(e.target.value)} /></label>
                <label>Complications<input type="number" min={0} value={complications} onChange={e => setComplications(e.target.value)} /></label>
                <label>Système touché<select value={systeme} onChange={e => setSysteme(e.target.value as Systeme | '')}><option value="">Au hasard (d20)</option>{SYSTEMES.map(s => <option key={s} value={s}>{LIBELLES_DES_SYSTEMES[s]} (cible acquise)</option>)}</select></label>
            </div>
            <label className="lcars-case"><input type="checkbox" checked={devastatrice} onChange={e => setDevastatrice(e.target.checked)} />Attaque dévastatrice (2 Impulsion)</label>
            <div className="lcars-ops-actions">
                <button type="button" className="lcars-primaire" disabled={!cible || degats.trim() === ''} onClick={async () => {
                    const ok = await envoyer('attaque', { cibleId: cible, degats: nombre(degats), plus: nombre(plus), complications: nombre(complications),
                        ...(attaquant ? { attaquantId: attaquant } : {}), ...(armeId ? { armeId } : {}), ...(systeme ? { systeme } : {}), devastatrice });
                    if (ok) { setPlus('0'); setComplications('0'); setDevastatrice(false); }
                }}>Appliquer les dégâts</button>
            </div>
        </section>
    );
}

function Recharge({ vaisseaux, envoyer }: { vaisseaux: VaisseauVu[]; envoyer: EnvoiDuModule }) {
    const [vaisseau, setVaisseau] = useState('');
    const [ingenierie, setIngenierie] = useState('3');
    const [impulsion, setImpulsion] = useState('0');
    return (
        <section className="lcars-carte" aria-label="Recharger les Boucliers">
            <h3>Recharger les Boucliers</h3>
            <p className="lcars-note">Opérations : Maîtrise + Ingénierie, difficulté 2 (3 à zéro), aidée de la Structure + Ingénierie ; réussie, Ingénierie + 1, +2 par Impulsion. Consomme les réserves d’énergie (p. 303).</p>
            <div className="lcars-ops-champs">
                <label>Vaisseau<select value={vaisseau} onChange={e => setVaisseau(e.target.value)}><option value="">—</option>{vaisseaux.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}</select></label>
                <label>Ingénierie du personnage<input type="number" min={0} max={5} value={ingenierie} onChange={e => setIngenierie(e.target.value)} /></label>
                <label>Impulsion dépensée<input type="number" min={0} value={impulsion} onChange={e => setImpulsion(e.target.value)} /></label>
            </div>
            <div className="lcars-ops-actions">
                <button type="button" disabled={!vaisseau} onClick={() => envoyer('recharger-boucliers', { vaisseauId: vaisseau, ingenierie: nombre(ingenierie), impulsion: nombre(impulsion) })}>Recharger</button>
            </div>
        </section>
    );
}

function Taches({ taches, meneur, envoyer }: { taches: TacheEtendue[]; meneur: boolean; envoyer?: EnvoiDuModule }) {
    const [nouvelle, setNouvelle] = useState({ nom: '', genre: 'etendue' as TacheEtendue['genre'], jauge: '12', difficulte: '2', obstacle: '0', impact: '3', visible: true });
    const [impact, setImpact] = useState<Record<string, { fonction: string; efforts: string; complications: string; menace: string }>>({});
    return (
        <section aria-label="Tâches étendues">
            <div className="lcars-titre-page"><div><p>OPÉRATIONS AVANCÉES</p><h3>Tâches et conséquences étendues</h3></div><span className="lcars-badge">{taches.length}</span></div>
            {taches.length === 0 && <p className="lcars-vide">Aucune.</p>}
            {taches.map(t => {
                const i = impact[t.id] ?? { fonction: '3', efforts: '0', complications: '0', menace: '0' };
                const changer = (k: keyof typeof i, val: string) => setImpact(x => ({ ...x, [t.id]: { ...i, [k]: val } }));
                return (
                    <article key={t.id} className="lcars-carte" data-tache-etendue={t.id}>
                        <div className="lcars-ops-entete">
                            <h3>{t.nom}{!t.visible && meneur ? ' (cachée)' : ''}</h3>
                            <span className="lcars-ops-discret">{t.genre === 'consequence' ? `Conséquence · impact ${t.impact}` : `Difficulté ${t.difficulte} · obstacle ${t.obstacle}`} · {t.coches} / {t.jauge}</span>
                        </div>
                        <Jauge t={t} />
                        {meneur && (<>
                            <div className="lcars-ops-champs">
                                {t.genre === 'etendue' ? <>
                                    <label>Fonction<input type="number" min={0} max={5} value={i.fonction} onChange={e => changer('fonction', e.target.value)} /></label>
                                    <label>Efforts (2 Impulsion)<input type="number" min={0} value={i.efforts} onChange={e => changer('efforts', e.target.value)} /></label>
                                    <label>Complications<input type="number" min={0} value={i.complications} onChange={e => changer('complications', e.target.value)} /></label>
                                </> : <label>Menace (3 au plus)<input type="number" min={0} max={3} value={i.menace} onChange={e => changer('menace', e.target.value)} /></label>}
                            </div>
                            <div className="lcars-ops-actions">
                                {t.genre === 'etendue'
                                    ? <button type="button" className="lcars-primaire" onClick={() => envoyer?.('impact', { tacheId: t.id, fonction: nombre(i.fonction), efforts: nombre(i.efforts), complications: nombre(i.complications) })}>Tâche réussie : cocher l’impact</button>
                                    : <button type="button" className="lcars-primaire" onClick={() => envoyer?.('impact', { tacheId: t.id, menace: nombre(i.menace) })}>La situation empire</button>}
                                <button type="button" onClick={() => envoyer?.('tache', { tache: { ...t, visible: !t.visible } })}>{t.visible ? 'Cacher' : 'Montrer'}</button>
                                <button type="button" onClick={() => envoyer?.('supprimer-tache', { tacheId: t.id })}>Retirer</button>
                            </div>
                        </>)}
                    </article>
                );
            })}
            {meneur && (
                <details className="lcars-carte">
                    <summary>NOUVELLE TÂCHE ÉTENDUE</summary>
                    <div className="lcars-ops-champs">
                        <label>Nom<input value={nouvelle.nom} onChange={e => setNouvelle(n => ({ ...n, nom: e.target.value }))} /></label>
                        <label>Genre<select value={nouvelle.genre} onChange={e => setNouvelle(n => ({ ...n, genre: e.target.value as TacheEtendue['genre'] }))}><option value="etendue">Tâche étendue</option><option value="consequence">Conséquence étendue</option></select></label>
                        <label>{nouvelle.genre === 'etendue' ? 'Jauge d’effort' : 'Jauge d’achoppement'}<input type="number" min={1} max={99} value={nouvelle.jauge} onChange={e => setNouvelle(n => ({ ...n, jauge: e.target.value }))} /></label>
                        {nouvelle.genre === 'etendue'
                            ? <label>Difficulté<input type="number" min={0} max={9} value={nouvelle.difficulte} onChange={e => setNouvelle(n => ({ ...n, difficulte: e.target.value }))} /></label>
                            : <label>Impact<input type="number" min={0} max={9} value={nouvelle.impact} onChange={e => setNouvelle(n => ({ ...n, impact: e.target.value }))} /></label>}
                        <label>Obstacle<input type="number" min={0} max={9} value={nouvelle.obstacle} onChange={e => setNouvelle(n => ({ ...n, obstacle: e.target.value }))} /></label>
                    </div>
                    <label className="lcars-case"><input type="checkbox" checked={nouvelle.visible} onChange={e => setNouvelle(n => ({ ...n, visible: e.target.checked }))} />Visible des joueurs</label>
                    <div className="lcars-ops-actions">
                        <button type="button" className="lcars-primaire" disabled={!nouvelle.nom.trim()} onClick={async () => {
                            const ok = await envoyer?.('tache', { tache: { id: id('t', nouvelle.nom), nom: nouvelle.nom.trim(), genre: nouvelle.genre, jauge: Math.max(1, nombre(nouvelle.jauge, 12)),
                                difficulte: nombre(nouvelle.difficulte), obstacle: nombre(nouvelle.obstacle), impact: nouvelle.genre === 'consequence' ? nombre(nouvelle.impact, 3) : 0, visible: nouvelle.visible } });
                            if (ok) setNouvelle(n => ({ ...n, nom: '' }));
                        }}>Créer</button>
                    </div>
                </details>
            )}
        </section>
    );
}

function Defis({ defis, meneur, envoyer }: { defis: Defi[]; meneur: boolean; envoyer?: EnvoiDuModule }) {
    const [nom, setNom] = useState('');
    const [lignes, setLignes] = useState('');
    const [intervalles, setIntervalles] = useState('');
    return (
        <section aria-label="Défis">
            <div className="lcars-titre-page"><div><p>DÉFIS</p><h3>Tâches clés et chronomètres</h3></div><span className="lcars-badge">{defis.length}</span></div>
            {defis.length === 0 && <p className="lcars-vide">Aucun.</p>}
            {defis.map(d => (
                <article key={d.id} className="lcars-carte" data-defi={d.id}>
                    <div className="lcars-ops-entete">
                        <h3>{d.nom}</h3>
                        {d.intervalles && <span className={d.intervalles.restants === 0 ? 'lcars-ops-danger' : 'lcars-ops-discret'}>{d.intervalles.restants} / {d.intervalles.total} intervalles</span>}
                    </div>
                    {d.taches.map(t => (
                        <label key={t.id} className="lcars-case">
                            <input type="checkbox" checked={t.faite} disabled={!meneur} onChange={e => envoyer?.('defi-tache', { defiId: d.id, tacheId: t.id, faite: e.target.checked })} />
                            {t.nom}
                        </label>
                    ))}
                    {meneur && (
                        <div className="lcars-ops-actions">
                            {d.intervalles && <>
                                <button type="button" onClick={() => envoyer?.('intervalles', { defiId: d.id, consommes: 2 })}>Une tâche : −2</button>
                                <button type="button" onClick={() => envoyer?.('intervalles', { defiId: d.id, consommes: 1 })}>Écourtée (2 Impulsion) : −1</button>
                                <button type="button" onClick={() => envoyer?.('intervalles', { defiId: d.id, consommes: -1 })}>Retardé : +1</button>
                            </>}
                            <button type="button" onClick={() => envoyer?.('defi', { defi: { ...d, visible: !d.visible } })}>{d.visible ? 'Cacher' : 'Montrer'}</button>
                            <button type="button" onClick={() => envoyer?.('supprimer-defi', { defiId: d.id })}>Retirer</button>
                        </div>
                    )}
                </article>
            ))}
            {meneur && (
                <details className="lcars-carte">
                    <summary>NOUVEAU DÉFI</summary>
                    <label>Nom<input value={nom} onChange={e => setNom(e.target.value)} /></label>
                    <label>Tâches clés, une par ligne<textarea rows={3} value={lignes} onChange={e => setLignes(e.target.value)} /></label>
                    <label>Intervalles (vide : pas de chronomètre ; 2 à 3 par tâche clé, p. 333)<input type="number" min={1} max={99} value={intervalles} onChange={e => setIntervalles(e.target.value)} /></label>
                    <div className="lcars-ops-actions">
                        <button type="button" className="lcars-primaire" disabled={!nom.trim() || !lignes.trim()} onClick={async () => {
                            const taches = lignes.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 16).map((l, k) => ({ id: `cle-${k + 1}`, nom: l.slice(0, 80), faite: false }));
                            const total = nombre(intervalles);
                            const ok = await envoyer?.('defi', { defi: { id: id('d', nom), nom: nom.trim(), taches, intervalles: total > 0 ? { total, restants: total } : null, visible: true } });
                            if (ok) { setNom(''); setLignes(''); setIntervalles(''); }
                        }}>Créer</button>
                    </div>
                </details>
            )}
        </section>
    );
}

function Journal({ journal }: { journal: string[] }) {
    if (!journal.length) return null;
    return (
        <section aria-label="Journal des opérations" className="lcars-carte lcars-large">
            <h3>Journal de bord</h3>
            <ol data-journal-operations>
                {[...journal].reverse().slice(0, 30).map((l, i) => <li key={journal.length - i}>{l}</li>)}
            </ol>
        </section>
    );
}

export function PupitreOperations({ vue, envoyerCommande }: Props) {
    const { erreur, envoyer } = useEnvoi(envoyerCommande);
    const vaisseaux = vue.vaisseaux.filter(estComplet);
    const { alerte, etat } = alerteDe(vue.vaisseaux);
    return (
        <div data-pupitre-operations>
            <Cadre titre="Bataille spatiale" sousTitre="PUPITRE DU MENEUR · OPÉRATIONS TACTIQUES" etat={etat} alerte={alerte} enfants={<>
                {erreur && <p role="alert" className="lcars-erreur">{erreur}</p>}
                <section aria-label="Vaisseaux">
                    <div className="lcars-titre-page">
                        <div><p>VAISSEAUX</p><h3>L’équipage et ceux d’en face</h3></div>
                        <button type="button" onClick={() => envoyer('nouvelle-scene')}>Nouvelle scène : Boucliers et énergie</button>
                    </div>
                    <div className="lcars-grille">{vaisseaux.map(v => <LeVaisseau key={v.id} v={v} meneur envoyer={envoyer} />)}</div>
                    <NouveauVaisseau envoyer={envoyer} />
                </section>
                {vaisseaux.length > 0 && <div className="lcars-grille"><Attaque vaisseaux={vaisseaux} envoyer={envoyer} /><Recharge vaisseaux={vaisseaux} envoyer={envoyer} /></div>}
                <Taches taches={vue.taches} meneur envoyer={envoyer} />
                <Defis defis={vue.defis} meneur envoyer={envoyer} />
                <Journal journal={vue.journal} />
            </>} />
        </div>
    );
}

export function VueEquipageOperations({ vue }: Props) {
    const { alerte, etat } = alerteDe(vue.vaisseaux);
    return (
        <div data-vue-operations>
            <Cadre titre="Opérations" sousTitre="PASSERELLE · ÉTAT DU VAISSEAU" etat={etat} alerte={alerte} enfants={<>
                <section aria-label="Vaisseaux">
                    {vue.vaisseaux.length === 0 && <p className="lcars-vide">Aucun vaisseau.</p>}
                    <div className="lcars-grille">
                        {vue.vaisseaux.map(v => estComplet(v) ? <LeVaisseau key={v.id} v={v} meneur={false} /> : (
                            <article key={v.id} className="lcars-carte" data-vaisseau-lointain={v.id}>
                                <h3>{v.nom}{v.detruit ? ' — détruit' : ''}</h3>
                                <p className="lcars-ops-discret">Envergure {v.envergure} · Boucliers {v.bouclierPourcent} % · {v.breches} brèche(s){v.secoue ? ' · secoué' : ''}</p>
                            </article>
                        ))}
                    </div>
                </section>
                <Taches taches={vue.taches} meneur={false} />
                <Defis defis={vue.defis} meneur={false} />
                <Journal journal={vue.journal} />
            </>} />
        </div>
    );
}
