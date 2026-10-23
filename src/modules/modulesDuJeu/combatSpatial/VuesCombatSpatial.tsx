import { useState } from 'react';
import type { CommandeDeModule, ResultatDeModule } from '../protocole';
import type {
    ContactVu, NomDuPoste, Ordre, VaisseauVu, VueCombatSpatial, CombatVu,
} from '../../../../outils/alien/modules/combat-spatial/moteur.mjs';
import {
    ACTIONS, ARMES, LIBELLES_DES_PHASES, LIBELLES_DES_PORTEES, LIBELLES_DES_POSTES, MODELES, POSTES, POSTE_DE_LA_PHASE, TALENTS_DES_POSTES,
} from '../../../../outils/alien/modules/combat-spatial/catalogue.mjs';
import { PrereglagesEtRemise } from '../../../../outils/alien/modules/prereglages-vues.mjs';
import './combatSpatial.css';

/**
 * **Le combat spatial d'Alien** — 23/10/2026. Le pupitre de Maman prépare les
 * vaisseaux et leurs postes, puis mène chaque Tour : ordres secrets, révélation,
 * résolution dans l'ordre d'initiative. La tablette tient un poste : elle règle ses
 * dés, donne son ordre, résout et force son propre jet. Les dés roulent au poste
 * de Maman (moteur `outils/alien/modules/combat-spatial/`).
 */
type Envoyer = (commande: CommandeDeModule) => Promise<ResultatDeModule>;
type Props = { vue: VueCombatSpatial; envoyerCommande: Envoyer };

const estVaisseau = (v: VaisseauVu | ContactVu): v is VaisseauVu => 'postes' in v;
const nombre = (v: string, defaut = 0) => (Number.isFinite(Number(v)) && v.trim() !== '' ? Math.trunc(Number(v)) : defaut);

/** Un envoi qui dit son refus au lieu de le taire. */
function useEnvoi(envoyerCommande: Envoyer) {
    const [erreur, setErreur] = useState<string | null>(null);
    const envoyer = async (id: string, charge: unknown = {}) => {
        const r = await envoyerCommande({ id, charge });
        setErreur(r.ok ? null : r.erreur);
        return r.ok;
    };
    return { erreur, envoyer };
}

function Bandeau({ combat }: { combat: CombatVu }) {
    return (
        <>
            <div className="spatial-bandeau" data-bandeau-spatial>
                <strong>Tour {combat.tour} · {LIBELLES_DES_PHASES[combat.phase]}</strong>
                <span>{combat.etape === 'ordres' ? 'Ordres secrets' : 'Résolution'}</span>
                <span>Distance {combat.distance} zone{combat.distance > 1 ? 's' : ''} · {combat.portee ? `portée ${LIBELLES_DES_PORTEES[combat.portee]}` : 'hors de portée des senseurs'}</span>
                <span>Vélocités {combat.velocites.joueurs} / {combat.velocites.adverse}{combat.croise ? ' · croisés' : ''}</span>
            </div>
            <div className="spatial-piste" aria-label={`Distance : ${combat.distance} zones`}>
                {Array.from({ length: 9 }, (_, i) => <span key={i} className={i === Math.min(8, combat.distance) ? 'spatial-ici' : ''}>{i}</span>)}
            </div>
        </>
    );
}

function Journal({ combat }: { combat: CombatVu }) {
    return (
        <section aria-label="Journal du combat">
            <h3>Journal</h3>
            <ol className="spatial-journal" reversed>
                {[...combat.journal].reverse().slice(0, 60).map((l, i) => (
                    <li key={combat.journal.length - i}><small>T{l.tour}·{l.phase}</small> {l.texte}</li>
                ))}
            </ol>
        </section>
    );
}

/** L'état d'un vaisseau : coque, systèmes, armes, avaries. */
function EtatDuVaisseau({ v, children }: { v: VaisseauVu; children?: React.ReactNode }) {
    return (
        <article className="spatial-carte" data-vaisseau={v.nom}>
            <h4>{v.nom} {v.detruit ? <span className="spatial-alerte">· détruit</span> : v.horsService ? <span className="spatial-alerte">· Hors service</span> : null}</h4>
            <p className="spatial-discret">{MODELES.find(m => m.id === v.modele)?.nom ?? 'Vaisseau libre'} · {v.camp === 'joueurs' ? 'camp des joueurs' : 'adversaire'}</p>
            <p>Coque {v.coque - v.degats}/{v.coque} · Protection {v.protection} · Signature {v.signatureEffective >= 0 ? '+' : ''}{v.signatureEffective} · Propulseurs {v.propulseursEffectifs >= 0 ? '+' : ''}{v.propulseursEffectifs}</p>
            <p className="spatial-discret">
                Transpondeur {v.transpondeur ? 'actif' : 'coupé'} · senseurs {v.senseursCoupes ? 'coupés' : 'actifs'} · moteurs {v.moteursCoupes ? 'coupés' : 'actifs'}{v.ombilic ? ' · ombilic' : ''}
            </p>
            {v.armes.length > 0 && (
                <ul aria-label={`Armes de ${v.nom}`}>
                    {v.armes.map(a => (
                        <li key={a.id}>{a.nom} — {a.sorte === 'offensive' ? `Dégâts ${a.degats}, portée ${LIBELLES_DES_PORTEES[a.portee]}` : 'contremesure'}
                            {a.bonus ? `, Bonus ${a.bonus > 0 ? '+' : ''}${a.bonus}` : ''}{a.munitions !== null ? ` · ${a.munitions} munitions` : ''}</li>
                    ))}
                </ul>
            )}
            {v.avaries.length > 0 && (
                <ul aria-label={`Avaries de ${v.nom}`} className="spatial-alerte">
                    {v.avaries.map(a => (
                        <li key={a.id}>{a.gravite === 'mineure' ? 'Mineure' : 'Majeure'} {a.code} — {a.nom}{a.armeNom ? ` (${a.armeNom})` : ''} : {a.texte}
                            {a.etat === 'temporaire' ? ' · réparée en urgence (un Quart)' : a.restants.length ? ` · réparer : ${a.restants.join(', ')}` : ''}</li>
                    ))}
                </ul>
            )}
            {children}
        </article>
    );
}

/** L'ordre d'une phase pour un vaisseau. */
function FormulaireDOrdre({ v, combat, ennemis, envoyer }: { v: VaisseauVu; combat: CombatVu; ennemis: { id: string; nom: string }[]; envoyer: (id: string, charge: unknown) => Promise<boolean> }) {
    const actuel = combat.ordres[v.id];
    const [action, setAction] = useState(actuel?.action ?? 'aucune');
    const [cibleId, setCible] = useState(actuel?.cibleId ?? ennemis[0]?.id ?? '');
    const def = ACTIONS[combat.phase].find(a => a.id === action);
    const armes = v.armes.filter(a => def?.arme && a.sorte === def.arme);
    const [armeId, setArme] = useState(actuel?.armeId ?? '');
    const reparables = v.avaries.filter(a => a.etat === 'active' && a.restants.length);
    const [avarieId, setAvarie] = useState(actuel?.avarieId ?? '');
    const avarie = reparables.find(a => a.id === avarieId) ?? reparables[0];
    const [competence, setCompetence] = useState<string>(actuel?.competence ?? '');
    const [ampleur, setAmpleur] = useState<1 | 2>(actuel?.ampleur ?? 1);
    const [coupe, setCoupe] = useState<NonNullable<Ordre['coupe']>>(actuel?.coupe ?? 'aucun');
    const donner = () => {
        const charge: Record<string, unknown> = { vaisseauId: v.id, action };
        if (def?.cible) charge.cibleId = cibleId;
        if (def?.arme) charge.armeId = armeId || armes[0]?.id;
        if (def?.avarie && avarie) { charge.avarieId = avarie.id; charge.competence = competence && avarie.restants.includes(competence as never) ? competence : avarie.restants[0]; }
        if (action === 'accelerer' || action === 'decelerer') charge.ampleur = ampleur;
        if (action === 'faire-le-mort') charge.coupe = coupe;
        void envoyer('ordonner', charge);
    };
    return (
        <form className="spatial-ligne" aria-label={`Ordre de ${v.nom}`} onSubmit={e => { e.preventDefault(); donner(); }}>
            <label>Action ({LIBELLES_DES_POSTES[POSTE_DE_LA_PHASE[combat.phase]]})
                <select value={action} onChange={e => setAction(e.target.value)} aria-label={`Action de ${v.nom}`}>
                    <option value="aucune">Aucune action</option>
                    {ACTIONS[combat.phase].map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                </select>
            </label>
            {def?.cible && (
                <label>Cible
                    <select value={cibleId} onChange={e => setCible(e.target.value)} aria-label={`Cible de ${v.nom}`}>
                        {ennemis.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                    </select>
                </label>
            )}
            {def?.arme && (
                <label>Arme
                    <select value={armeId || armes[0]?.id || ''} onChange={e => setArme(e.target.value)} aria-label={`Arme de ${v.nom}`}>
                        {armes.map(a => <option key={a.id} value={a.id}>{a.nom}{a.munitions !== null ? ` (${a.munitions})` : ''}</option>)}
                    </select>
                </label>
            )}
            {def?.avarie && avarie && (
                <>
                    <label>Avarie
                        <select value={avarie.id} onChange={e => setAvarie(e.target.value)} aria-label={`Avarie à réparer sur ${v.nom}`}>
                            {reparables.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                        </select>
                    </label>
                    <label>Test
                        <select value={competence && avarie.restants.includes(competence as never) ? competence : avarie.restants[0]} onChange={e => setCompetence(e.target.value)} aria-label={`Compétence de réparation sur ${v.nom}`}>
                            {[...new Set(avarie.restants)].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </label>
                </>
            )}
            {(action === 'accelerer' || action === 'decelerer') && (
                <label>Si plusieurs succès
                    <select value={ampleur} onChange={e => setAmpleur(Number(e.target.value) as 1 | 2)} aria-label={`Ampleur de ${v.nom}`}>
                        <option value={1}>d'un cran</option><option value={2}>de deux crans</option>
                    </select>
                </label>
            )}
            {action === 'faire-le-mort' && (
                <label>Couper aussi
                    <select value={coupe} onChange={e => setCoupe(e.target.value as NonNullable<Ordre['coupe']>)} aria-label={`Systèmes coupés par ${v.nom}`}>
                        <option value="aucun">rien</option><option value="senseurs">les senseurs (Signature −1)</option>
                        <option value="moteurs">les moteurs (Signature −2)</option><option value="les-deux">les deux (−3)</option>
                    </select>
                </label>
            )}
            {def?.avarie && !avarie ? <span className="spatial-discret">Aucune avarie à réparer.</span> : (
                <button type="submit" disabled={(!!def?.arme && !armes.length) || (!!def?.cible && !ennemis.length)}>{actuel ? 'Changer l’ordre' : 'Donner l’ordre'}</button>
            )}
            {actuel && <span className="spatial-discret" data-ordre-donne>Ordre donné : {actuel.action === 'aucune' ? 'aucune action' : ACTIONS[combat.phase].find(a => a.id === actuel.action)?.nom}</span>}
        </form>
    );
}

/** Le jet qui attend : « Forcer » (Stress +1) ou « Valider ». */
function JetEnAttente({ combat, nom, envoyer, peut }: { combat: CombatVu; nom: string; envoyer: (id: string, charge?: unknown) => Promise<boolean>; peut: boolean }) {
    const att = combat.enAttente;
    if (!att) return null;
    const succes = [...att.jet.base, ...att.jet.stress].filter(d => d === 6).length;
    return (
        <div className="spatial-carte spatial-actif" data-jet-en-attente>
            <p><strong>{nom}</strong> · {LIBELLES_DES_POSTES[att.poste]} : <span className="spatial-des">[{att.jet.base.join(' ')}]{att.jet.stress.length ? ` stress [${att.jet.stress.join(' ')}]` : ''}</span> → {succes} succès</p>
            {peut && (
                <div className="spatial-ligne">
                    <button type="button" onClick={() => void envoyer('forcer')} disabled={!att.peutForcer}>Forcer le jet (Stress +1)</button>
                    <button type="button" onClick={() => void envoyer('valider')}>Valider le jet</button>
                </div>
            )}
        </div>
    );
}

// ——— Le pupitre de Maman ———

const POSTE_VIDE = { personnageId: '', nom: '', base: 0, stress: 0, talent: false, synthetique: false };

function PreparationDuVaisseau({ vaisseaux, envoyer }: { vaisseaux: VaisseauVu[]; envoyer: (id: string, charge: unknown) => Promise<boolean> }) {
    const [choisi, setChoisi] = useState('');
    const v = vaisseaux.find(x => x.id === choisi);
    const [modele, setModele] = useState(v?.modele ?? 'libre');
    const m = MODELES.find(x => x.id === modele);
    const cle = `${choisi}:${modele}`;
    return (
        <details>
            <summary>Préparer un vaisseau</summary>
            <label>Vaisseau à préparer
                <select value={choisi} aria-label="Vaisseau à préparer" onChange={e => { setChoisi(e.target.value); setModele(vaisseaux.find(x => x.id === e.target.value)?.modele ?? 'libre'); }}>
                    <option value="">Nouveau vaisseau…</option>
                    {vaisseaux.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
                </select>
            </label>
            <label>Modèle du livre
                <select value={modele} aria-label="Modèle du livre" onChange={e => setModele(e.target.value)}>
                    <option value="libre">Vaisseau libre</option>
                    {MODELES.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
                </select>
            </label>
            <form key={cle} aria-label="Préparer un vaisseau" onSubmit={e => {
                e.preventDefault(); const f = new FormData(e.currentTarget);
                void envoyer('vaisseau', {
                    ...(v ? { vaisseauId: v.id } : {}), nom: String(f.get('nom')), modele, camp: String(f.get('camp')),
                    signature: nombre(String(f.get('signature'))), propulseurs: nombre(String(f.get('propulseurs'))),
                    coque: nombre(String(f.get('coque')), 1), protection: nombre(String(f.get('protection'))),
                    armes: f.getAll('armes').map(String), transpondeur: f.has('transpondeur'), ombilic: f.has('ombilic'),
                });
            }}>
                <div className="spatial-ligne">
                    <label>Nom<input name="nom" required maxLength={80} defaultValue={v?.nom ?? ''} /></label>
                    <label>Camp
                        <select name="camp" aria-label="Camp" defaultValue={v?.camp ?? 'joueurs'}><option value="joueurs">Joueurs</option><option value="adverse">Adversaire</option></select>
                    </label>
                </div>
                <div className="spatial-ligne">
                    <label>Signature<input name="signature" type="number" min={-5} max={5} defaultValue={v?.signature ?? m?.signature ?? 0} /></label>
                    <label>Propulseurs<input name="propulseurs" type="number" min={-5} max={5} defaultValue={v?.propulseurs ?? m?.propulseurs ?? 0} /></label>
                    <label>Coque<input name="coque" type="number" min={1} max={99} defaultValue={v?.coque ?? m?.coque ?? 6} /></label>
                    <label>Protection<input name="protection" type="number" min={0} max={30} defaultValue={v?.protection ?? m?.protection ?? 5} /></label>
                </div>
                <fieldset className="spatial-ligne" style={{ border: 0, padding: 0 }}>
                    <legend>Armement</legend>
                    {ARMES.map(a => (
                        <label key={a.id} className="spatial-case">
                            <input type="checkbox" name="armes" value={a.id} defaultChecked={(v ? v.armes.map(x => x.arme) : m?.armes ?? []).includes(a.id)} />{a.nom}
                        </label>
                    ))}
                </fieldset>
                <div className="spatial-ligne">
                    <label className="spatial-case"><input type="checkbox" name="transpondeur" defaultChecked={v?.transpondeur ?? true} />Transpondeur actif</label>
                    <label className="spatial-case"><input type="checkbox" name="ombilic" defaultChecked={v?.ombilic ?? !!m?.ombilic} />Ombilic de connexion</label>
                    <button type="submit">Enregistrer le vaisseau</button>
                </div>
            </form>
        </details>
    );
}

function Equipage({ v, personnages, envoyer }: { v: VaisseauVu; personnages: { id: string; nom: string }[]; envoyer: (id: string, charge: unknown) => Promise<boolean> }) {
    return (
        <details>
            <summary>Équipage de {v.nom}</summary>
            {POSTES.map(poste => {
                const p = v.postes[poste] ?? POSTE_VIDE;
                return (
                    <form key={`${poste}:${JSON.stringify(p)}`} className="spatial-ligne" aria-label={`${LIBELLES_DES_POSTES[poste]} de ${v.nom}`} onSubmit={e => {
                        e.preventDefault(); const f = new FormData(e.currentTarget), personnageId = String(f.get('personnageId'));
                        void envoyer('poste', {
                            vaisseauId: v.id, poste, personnageId, nom: String(f.get('nom') || personnages.find(x => x.id === personnageId)?.nom || ''),
                            base: nombre(String(f.get('base'))), stress: nombre(String(f.get('stress'))), talent: f.has('talent'), synthetique: f.has('synthetique'),
                        });
                    }}>
                        <strong style={{ minWidth: '10rem' }}>{LIBELLES_DES_POSTES[poste]}</strong>
                        <label>Tenu par
                            <select name="personnageId" defaultValue={p.personnageId} aria-label={`Qui tient le poste ${LIBELLES_DES_POSTES[poste]} de ${v.nom}`}>
                                <option value="">PNJ ou MU/TH/UR</option>
                                {personnages.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
                            </select>
                        </label>
                        <label>Nom<input name="nom" defaultValue={p.nom} maxLength={80} /></label>
                        {poste !== 'capitaine' && <label>Dés de base<input name="base" type="number" min={0} max={20} defaultValue={p.base} /></label>}
                        {poste !== 'capitaine' && <label>Stress<input name="stress" type="number" min={0} max={20} defaultValue={p.stress} /></label>}
                        {TALENTS_DES_POSTES[poste] && <label className="spatial-case" title={TALENTS_DES_POSTES[poste]}><input type="checkbox" name="talent" defaultChecked={p.talent} />Talent</label>}
                        <label className="spatial-case"><input type="checkbox" name="synthetique" defaultChecked={p.synthetique} />Synthétique</label>
                        <button type="submit">Enregistrer</button>
                    </form>
                );
            })}
        </details>
    );
}

export function PupitreCombatSpatial({ vue, envoyerCommande }: Props) {
    const { erreur, envoyer } = useEnvoi(envoyerCommande);
    const vaisseaux = vue.vaisseaux.filter(estVaisseau);
    const combat = vue.combat;
    const [engages, setEngages] = useState<string[]>([]);
    const nomDe = (id: string) => vaisseaux.find(v => v.id === id)?.nom ?? id;
    return (
        <section className="gmos-spatial" aria-label="Pupitre du combat spatial">
            <h2>Combat spatial</h2>
            <p className="spatial-discret">Livre p. 188-201. Chaque phase : les ordres en secret, puis « Révéler les ordres », puis chaque vaisseau dans l'ordre d'initiative.</p>
            {erreur && <p role="alert">{erreur}</p>}

            {combat ? (
                <>
                    <Bandeau combat={combat} />
                    <h3>{combat.etape === 'ordres' ? 'Ordres de la phase' : 'Résolution'}</h3>
                    <div className="spatial-grille">
                        {combat.ordreDInitiative.map(id => {
                            const v = vaisseaux.find(x => x.id === id)!;
                            const ennemis = vaisseaux.filter(x => combat.engages.includes(x.id) && x.camp !== v.camp && !x.detruit).map(x => ({ id: x.id, nom: x.nom }));
                            const prochain = combat.prochain === id;
                            return (
                                <EtatDuVaisseau key={id} v={v}>
                                    <p>Initiative {combat.initiative[id]}{combat.resolus.includes(id) ? ' · résolu' : prochain ? ' · à résoudre' : ''}</p>
                                    {combat.etape === 'ordres'
                                        ? <FormulaireDOrdre key={`${combat.tour}:${combat.phase}:${id}:${JSON.stringify(combat.ordres[id] ?? null)}`} v={v} combat={combat} ennemis={ennemis} envoyer={envoyer} />
                                        : prochain && !combat.enAttente && <button type="button" onClick={() => void envoyer('resoudre', { vaisseauId: id })}>Résoudre {v.nom}</button>}
                                </EtatDuVaisseau>
                            );
                        })}
                    </div>
                    <JetEnAttente combat={combat} nom={combat.enAttente ? nomDe(combat.enAttente.vaisseauId) : ''} envoyer={envoyer} peut />
                    <div className="spatial-ligne">
                        {combat.etape === 'ordres'
                            ? <button type="button" onClick={() => void envoyer('reveler')}>Révéler les ordres</button>
                            : <button type="button" onClick={() => void envoyer('phase-suivante')} disabled={!!combat.enAttente}>{combat.phase === 4 ? 'Tour suivant' : 'Phase suivante'}</button>}
                        <button type="button" onClick={() => { if (window.confirm('Terminer le combat ? Les réparations d’urgence redeviennent des avaries.')) void envoyer('terminer-combat'); }}>Terminer le combat</button>
                    </div>
                    <Journal combat={combat} />
                </>
            ) : (
                <>
                    <h3>Engager un combat</h3>
                    {vaisseaux.length === 0 && <p className="spatial-discret">Prépare d'abord au moins un vaisseau dans chaque camp.</p>}
                    <form aria-label="Engager un combat" onSubmit={e => {
                        e.preventDefault(); const f = new FormData(e.currentTarget);
                        void envoyer('demarrer-combat', { vaisseaux: engages, distance: nombre(String(f.get('distance')), 8),
                            velociteJoueurs: nombre(String(f.get('vj')), 2), velociteAdverse: nombre(String(f.get('va')), 2) });
                    }}>
                        <div className="spatial-ligne">
                            {vaisseaux.filter(v => !v.detruit).map(v => (
                                <label key={v.id} className="spatial-case">
                                    <input type="checkbox" checked={engages.includes(v.id)} onChange={e => setEngages(l => (e.target.checked ? [...l, v.id] : l.filter(x => x !== v.id)))} />
                                    {v.nom} ({v.camp === 'joueurs' ? 'joueurs' : 'adversaire'})
                                </label>
                            ))}
                        </div>
                        <div className="spatial-ligne">
                            <label>Distance initiale (zones)<input name="distance" type="number" min={0} max={8} defaultValue={8} /></label>
                            <label>Vélocité des joueurs<input name="vj" type="number" min={0} max={20} defaultValue={2} /></label>
                            <label>Vélocité adverse<input name="va" type="number" min={0} max={20} defaultValue={2} /></label>
                            <button type="submit" disabled={engages.length < 2}>Démarrer le combat</button>
                        </div>
                        <p className="spatial-discret">Les senseurs portent à huit zones : les vaisseaux se détectent alors (p. 190). La vélocité d'approche est souvent de deux zones par Tour (p. 189).</p>
                    </form>
                </>
            )}

            <h3>Vaisseaux</h3>
            <div className="spatial-grille">
                {vaisseaux.map(v => (
                    <EtatDuVaisseau key={v.id} v={v}>
                        <Equipage v={v} personnages={vue.personnages ?? []} envoyer={envoyer} />
                        <details>
                            <summary>Réparer et ajuster {v.nom}</summary>
                            <form className="spatial-ligne" aria-label={`Coque de ${v.nom}`} onSubmit={e => {
                                e.preventDefault(); void envoyer('etat-vaisseau', { vaisseauId: v.id, degats: nombre(String(new FormData(e.currentTarget).get('degats'))) });
                            }}>
                                <label>Dégâts de coque<input name="degats" type="number" min={0} max={999} defaultValue={v.degats} key={v.degats} /></label>
                                <button type="submit">Noter</button>
                            </form>
                            <p className="spatial-discret">Hors combat : un test de MACHINES LOURDES par Quart, chaque 6 répare un point de coque ; une avarie se répare test par test, avec une pièce de rechange chacun (p. 200).</p>
                            {v.avaries.map(a => (
                                <div key={a.id} className="spatial-ligne">
                                    <span>{a.nom}</span>
                                    <button type="button" onClick={() => void envoyer('etat-vaisseau', { vaisseauId: v.id, retirerAvarie: a.id })}>Réparée</button>
                                    {a.gravite === 'mineure' && <button type="button" onClick={() => void envoyer('relancer-avarie', { vaisseauId: v.id, avarieId: a.id })}>Sans objet : relancer</button>}
                                </div>
                            ))}
                            {!combat && <button type="button" onClick={() => { if (window.confirm(`Supprimer ${v.nom} ?`)) void envoyer('supprimer-vaisseau', { vaisseauId: v.id }); }}>Supprimer {v.nom}</button>}
                        </details>
                    </EtatDuVaisseau>
                ))}
            </div>
            {!combat && <PreparationDuVaisseau vaisseaux={vaisseaux} envoyer={envoyer} />}
            <PrereglagesEtRemise prereglages={vue.prereglages ?? []} envoyer={envoyer} occupe={false} sujet="le combat spatial"
                classes={{ section: 'spatial-carte', case: 'spatial-case' }}
                contenu="Un préréglage garde les vaisseaux et leurs équipages : modèle, armes, munitions, coque, avaries et postes. Le rappel remplace les vaisseaux actuels ; il attend la fin du combat."
                remise="Efface tous les vaisseaux et arrête le combat en cours. Les préréglages et les accès des PJ restent." />
        </section>
    );
}

// ——— La tablette de l'équipage ———

export function VueEquipage({ vue, envoyerCommande }: Props) {
    const { erreur, envoyer } = useEnvoi(envoyerCommande);
    const moi = vue.moi ?? '';
    const nos = vue.vaisseaux.filter(estVaisseau).filter(v => v.camp === 'joueurs');
    const contacts = vue.vaisseaux.filter((v): v is ContactVu => !estVaisseau(v));
    const combat = vue.combat;
    const mesPostes = nos.flatMap(v => POSTES.filter(p => v.postes[p].personnageId === moi).map(p => ({ v, p })));
    const nomDe = (id: string) => vue.vaisseaux.find(v => v.id === id)?.nom ?? id;
    return (
        <section className="gmos-spatial" aria-label="Combat spatial — équipage">
            <h2>Combat spatial</h2>
            {erreur && <p role="alert">{erreur}</p>}
            {mesPostes.length === 0 && <p className="spatial-discret">Maman ne t'a confié aucun poste pour l'instant.</p>}
            {mesPostes.length > 0 && (
                <section aria-label="Mes postes">
                    <h3>Mes postes</h3>
                    {mesPostes.map(({ v, p }) => (
                        <form key={`${v.id}:${p}:${v.postes[p].base}:${v.postes[p].stress}`} className="spatial-ligne" aria-label={`Mes dés : ${LIBELLES_DES_POSTES[p]}`} onSubmit={e => {
                            e.preventDefault(); const f = new FormData(e.currentTarget);
                            void envoyer('mes-des', { vaisseauId: v.id, poste: p, base: nombre(String(f.get('base'))), stress: nombre(String(f.get('stress'))) });
                        }}>
                            <strong style={{ minWidth: '10rem' }}>{LIBELLES_DES_POSTES[p as NomDuPoste]} · {v.nom}</strong>
                            {p !== 'capitaine' && (
                                <>
                                    <label>Dés de base (attribut + compétence)<input name="base" type="number" min={0} max={20} defaultValue={v.postes[p].base} /></label>
                                    <label>Niveau de Stress<input name="stress" type="number" min={0} max={20} defaultValue={v.postes[p].stress} /></label>
                                    <button type="submit">Enregistrer mes dés</button>
                                </>
                            )}
                        </form>
                    ))}
                    <p className="spatial-discret">Le Stress gagné ici (jet forcé, panique) se reporte aussi sur ta fiche.</p>
                </section>
            )}
            {combat ? (
                <>
                    <Bandeau combat={combat} />
                    {nos.filter(v => combat.engages.includes(v.id)).map(v => {
                        const posteDeLaPhase = POSTE_DE_LA_PHASE[combat.phase];
                        const commande = [v.postes[posteDeLaPhase].personnageId, v.postes.capitaine.personnageId].includes(moi);
                        const ennemis = contacts.filter(c => combat.engages.includes(c.id) && !c.detruit).map(c => ({ id: c.id, nom: c.nom }));
                        return (
                            <EtatDuVaisseau key={v.id} v={v}>
                                {commande && combat.etape === 'ordres' && <FormulaireDOrdre key={`${combat.tour}:${combat.phase}:${JSON.stringify(combat.ordres[v.id] ?? null)}`} v={v} combat={combat} ennemis={ennemis} envoyer={envoyer} />}
                                {commande && combat.prochain === v.id && !combat.enAttente && <button type="button" onClick={() => void envoyer('resoudre', { vaisseauId: v.id })}>Résoudre notre action</button>}
                                {!commande && <p className="spatial-discret">{LIBELLES_DES_PHASES[combat.phase]} : le poste {LIBELLES_DES_POSTES[posteDeLaPhase]} donne l'ordre.</p>}
                            </EtatDuVaisseau>
                        );
                    })}
                    <JetEnAttente combat={combat} nom={combat.enAttente ? nomDe(combat.enAttente.vaisseauId) : ''} envoyer={envoyer}
                        peut={!!combat.enAttente && nos.some(v => v.id === combat.enAttente!.vaisseauId && v.postes[combat.enAttente!.poste].personnageId === moi)} />
                    <h3>Contacts</h3>
                    <ul aria-label="Contacts">
                        {contacts.filter(c => combat.engages.includes(c.id)).map(c => (
                            <li key={c.id}>{c.nom}{c.identifie && c.modele ? ` · ${MODELES.find(m => m.id === c.modele)?.nom ?? ''}` : ''}{c.detruit ? ' · détruit' : c.horsService ? ' · Hors service' : ''}</li>
                        ))}
                    </ul>
                    <Journal combat={combat} />
                </>
            ) : (
                <>
                    <p className="spatial-discret">Aucun combat en cours.</p>
                    {nos.map(v => <EtatDuVaisseau key={v.id} v={v} />)}
                </>
            )}
        </section>
    );
}
