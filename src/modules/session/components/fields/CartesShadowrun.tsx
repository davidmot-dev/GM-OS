import React, { useState } from 'react';
import { seuilDeSoin, type RegleDeShadowrun, type ChoixDeShadowrun } from '../../../dice/systemes/shadowrun';
import { CLE_SUIVI_SHADOWRUN, suivreLesCompteurs, ecrireSuiviShadowrun, derivesShadowrun,
    refusDuSoinShadowrun, HEURES_DE_REPOS, positionShadowrun, type OrigineDeBlessure, type SoinShadowrun } from '../../../dice/systemes/suiviDeShadowrun';
import { moniteurSelonLeJeu } from '../../../combat/logic/moniteurDeShadowrun';
import { ACCES_SHADOWRUN, BACKDOORS_SHADOWRUN, MODES_SHADOWRUN, lireMatriceShadowrun, effetsModeShadowrun,
    ecrireMatriceShadowrun, redemarrerMatriceShadowrun, preparerMatriceShadowrun,
    type MatriceShadowrun as EtatMatriceShadowrun, type AccesShadowrun, type ModeShadowrun } from '../../../dice/systemes/matriceDeShadowrun';
import type { SheetSection } from '../../../../data/defaultSheetTemplates';

const bouton = 'px-2 py-1 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-1 text-xs';
type Props = { regle: RegleDeShadowrun; valeurs: Record<string, unknown>; appliquer: (maj: Record<string, unknown>) => void; consigner: (texte: string) => void; sections?: SheetSection[]; disabled?: boolean };

export const SanteEtCoherenceShadowrun: React.FC<Props> = ({ regle, valeurs, appliquer, consigner, sections, disabled }) => {
    const [soin, setSoin] = useState<SoinShadowrun>('premiers-soins');
    const [heures, setHeures] = useState(0);
    const [message, setMessage] = useState('');
    const r = regle.suivi;
    const s = r && suivreLesCompteurs(r, valeurs);
    const lignes = regle.derives ? derivesShadowrun(regle.derives, valeurs) : [];
    const label = (id: string) => sections?.flatMap(sec => sec.fields).find(f => f.id === id)?.label ?? id;
    const changer = (maj: Record<string, unknown>, texte: string) => { if (disabled) return; appliquer(maj); consigner(texte); };
    const essence = regle.essence && valeurs[regle.essence] !== '' ? Number(valeurs[regle.essence]) : undefined;
    return <fieldset disabled={disabled} data-suivi-shadowrun className="flex flex-col gap-3 text-xs">
        {disabled && <p>Sauvegardez les saisies de la fiche avant ce geste.</p>}
        {s && r && <>
            <p>Malus jusqu’à la fin de la prochaine narration : {s.legereRecente ? 'blessure légère' : 'aucune blessure légère récente'}{s.drainMineur ? ' ; drain aux activités magiques' : ''}.</p>
            <button type="button" className={bouton} disabled={!s.legereRecente && !s.drainMineur} onClick={() => changer({ [CLE_SUIVI_SHADOWRUN]: { ...s, legereRecente: false, drainMineur: false } }, 'Fin de la prochaine narration : malus temporaires de blessure et de drain expirés (p. 68, 170).')}>Fin de la prochaine narration</button>
            <label>Méthode de soins <select aria-label="Méthode de soins Shadowrun" className={champ} value={soin} onChange={e => setSoin(e.target.value as SoinShadowrun)}>
                <option value="premiers-soins">Premiers soins réussis</option><option value="magie">Sort de soin réussi</option><option value="repos">Repos accompli</option>
            </select></label>
            {soin === 'repos' && <label>Heures de repos dans de bonnes conditions <input aria-label="Heures de repos" className={champ} type="number" min={0} value={heures} onChange={e => setHeures(Math.max(0, Number(e.target.value)))} /></label>}
            <p>Un test réussi soigne une case. Une tentative de chaque méthode par case ; le drain guérit uniquement par repos. Stabilisez d’abord tout mourant.</p>
            {s.blessures.map(b => <div key={b.id} className="flex flex-wrap items-center gap-2 border-t border-app-border/30 pt-2">
                <span>Blessure {b.gravite} — {b.origine}{b.nature ? ` mental ${b.nature}` : ''}{soin === 'repos' ? ` (${HEURES_DE_REPOS[b.gravite]} h)` : ` (seuil de soin ${seuilDeSoin(b.gravite, essence)})`}</span>
                <select aria-label={`Origine de ${b.id}`} value={b.origine} className={champ} onChange={e => changer({ [CLE_SUIVI_SHADOWRUN]: { ...s, blessures: s.blessures.map(x => x.id === b.id ? { ...x, origine: e.target.value as OrigineDeBlessure } : x) } }, `Origine de la blessure ${b.gravite} : ${e.target.value}.`)}>
                    {(['inconnue', 'physique', 'mental', 'biofeedback', 'drain'] as const).map(x => <option key={x}>{x}</option>)}
                </select>
                <button type="button" className={bouton} disabled={!!refusDuSoinShadowrun(b, soin)} title={refusDuSoinShadowrun(b, soin)} onClick={() => {
                    const resultat = moniteurSelonLeJeu(r, valeurs, { value: 1, isRecovery: true, shadowrun: { soin, blessureId: b.id, heures } });
                    if (!resultat) return;
                    setMessage(resultat.texte);
                    if (Object.keys(resultat.fiche).length) {
                        // La porte des dégâts fournit un écart de cases ; sur la fiche on écrit la position résultante.
                        const apres = resultat.fiche[CLE_SUIVI_SHADOWRUN] as typeof s;
                        changer({ ...resultat.fiche, ...(r.sante ? { [r.sante]: positionShadowrun(r, apres, valeurs) } : {}) }, resultat.texte);
                        if (soin === 'repos') setHeures(0);
                    }
                }}>Soigner cette case</button>
                {soin !== 'repos' && <button type="button" className={bouton} disabled={!!refusDuSoinShadowrun(b, soin)} onClick={() => changer(ecrireSuiviShadowrun(r, { ...s, blessures: s.blessures.map(x => x.id === b.id ? { ...x, tentatives: [...x.tentatives, soin] } : x) }, false), `Tentative ${soin} échouée sur la blessure ${b.gravite}.`)}>Noter l’échec du soin</button>}
                {b.origine === 'drain' && <span>Repos uniquement.</span>}
            </div>)}
            {message && <p role="status">{message}</p>}
        </>}
        {essence !== undefined && essence <= 1 && <p className="text-etat-alerte">Essence {essence} : désavantage à la majorité des tests sociaux, au choix du meneur.{essence <= 0 && ' Essence 0 : le personnage meurt (p. 60).'}</p>}
        {s && essence !== undefined && essence <= 0 && <button type="button" className={bouton} disabled={s.essenceMortConfirmee} onClick={() => changer({ [CLE_SUIVI_SHADOWRUN]: { ...s, essenceMortConfirmee: true } }, 'Essence 0 : mort du personnage confirmée (p. 60).')}>{s.essenceMortConfirmee ? 'Mort par Essence confirmée' : 'Confirmer la mort par Essence'}</button>}
        {lignes.length > 0 && <details data-derives-shadowrun><summary>Réserves et seuils calculés</summary>
            <p>Choisissez explicitement « Appliquer » ou « Garder ma valeur ». Les blessures restent conservées.</p>
            {lignes.map(l => <div key={l.champ} className="flex flex-wrap items-center gap-2 py-1">
                <span>{label(l.champ)} : fiche {String(l.actuelle ?? '—')} ; calcul {l.detail} = {l.valeur}</span>
                {Number(l.actuelle) !== l.valeur && <>
                    <button type="button" className={bouton} onClick={() => changer({ [l.champ]: l.valeur }, `${label(l.champ)} : ${l.detail} = ${l.valeur}.`)}>Appliquer</button>
                    <button type="button" className={bouton} onClick={() => changer({ __shadowrunDerogations: { ...(valeurs.__shadowrunDerogations as Record<string, unknown> ?? {}), [l.champ]: { valeur: l.actuelle, calcul: l.valeur } } }, `${label(l.champ)} : dérogation explicite, valeur ${String(l.actuelle)} conservée (calcul ${l.valeur}).`)}>Garder ma valeur</button>
                    {!!(valeurs.__shadowrunDerogations as Record<string, unknown> | undefined)?.[l.champ] && <span>Dérogation enregistrée.</span>}
                </>}
            </div>)}
        </details>}
    </fieldset>;
};

export const MatriceShadowrun: React.FC<Props & { choix?: ChoixDeShadowrun; setChoix?: (maj: (c: ChoixDeShadowrun) => ChoixDeShadowrun) => void }> = ({ regle, valeurs, appliquer, consigner, disabled, choix, setChoix }) => {
    const [nom, setNom] = useState('');
    const r = regle.matrice;
    if (!r) return null;
    const m = lireMatriceShadowrun(r, valeurs);
    const contexte = choix?.matrice;
    const id = contexte?.cible ?? m.cible ?? m.cibles[0]?.id;
    const cible = m.cibles.find(c => c.id === id);
    const mode = effetsModeShadowrun(m.mode);
    const changer = (suivant: EtatMatriceShadowrun, texte: string) => { if (disabled) return; appliquer(ecrireMatriceShadowrun(r, suivant)); consigner(texte); };
    const preparer = (maj: Partial<NonNullable<ChoixDeShadowrun['matrice']>>) => setChoix?.(c => ({ ...c,
        matrice: { cible: id ?? '', vise: 1, backdoor: 0, cybercombat: false, ...c.matrice, ...maj } }));
    const tentative = contexte && preparerMatriceShadowrun(m, contexte);
    return <fieldset data-matrice-shadowrun disabled={disabled} className="flex flex-col gap-2 text-xs">
        <p>Matrice — minimum {m.minimum} dés de risque ; hausse du seuil +{m.hausse}.{m.convergence && ' Convergence : cyberdeck brické ; intervention d’élite en quelques minutes.'}</p>
        <div className="flex flex-wrap items-center gap-3">
            <label><input type="checkbox" checked={m.cyberdeck} onChange={e => changer({ ...m, cyberdeck: e.target.checked }, 'Disponibilité du cyberdeck mise à jour.')} /> Cyberdeck disponible</label>
            <label><input type="checkbox" checked={m.ind} onChange={e => changer({ ...m, ind: e.target.checked }, 'Disponibilité de l’IND mise à jour.')} /> IND disponible</label>
            <label>Mode <select aria-label="Mode de connexion" className={champ} value={m.mode} onChange={e => {
                const nouveau = e.target.value as ModeShadowrun;
                const redemarrage = nouveau === 'hot-ind' && m.mode !== 'hot-ind';
                changer({ ...(redemarrage ? redemarrerMatriceShadowrun(m, false) : m), mode: nouveau }, redemarrage ? 'Passage en hot-sim : redémarrage d’une minute accompli, tous les accès perdus (p. 212).' : `Mode ${MODES_SHADOWRUN[nouveau]} : un changement par narration (p. 212).`);
            }}>{Object.entries(MODES_SHADOWRUN).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
        </div>
        <p>{mode.actionGratuite ? 'Une action de cybercombat gratuite par tour. ' : ''}{mode.avantage ? 'Avantage en cybercombat. ' : ''}Biofeedback : {mode.biofeedback}. {mode.ejection ? `Choc d’éjection : blessure ${mode.ejection}.` : 'Aucun choc d’éjection.'}</p>
        <p>Passer en hot-sim confirme une minute de redémarrage et efface tous les accès. Un changement RA/RV par narration.</p>
        <div className="flex flex-wrap items-center gap-2">
            <input aria-label="Nouvelle cible matricielle" className={champ} value={nom} placeholder="Nom du PAN ou serveur" onChange={e => setNom(e.target.value)} />
            <button type="button" className={bouton} disabled={!nom.trim()} onClick={() => {
                const nouveau = crypto.randomUUID();
                changer({ ...m, cible: nouveau, cibles: [...m.cibles, { id: nouveau, nom: nom.trim(), firewall: 1, acces: 0 }] }, `Cible matricielle ajoutée : ${nom.trim()}.`);
                preparer({ cible: nouveau }); setNom('');
            }}>Ajouter la cible</button>
        </div>
        <label>Cible <select aria-label="Cible matricielle" className={champ} value={id ?? ''} onChange={e => { changer({ ...m, cible: e.target.value }, 'Cible matricielle sélectionnée.'); preparer({ cible: e.target.value }); }}>
            <option value="">Choisir…</option>{m.cibles.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select></label>
        {cible && <div className="flex flex-wrap items-center gap-3">
            <label>Firewall effectif <input aria-label="Firewall effectif" className={champ} type="number" min={1} value={cible.firewall} onChange={e => changer({ ...m, cibles: m.cibles.map(c => c.id === id ? { ...c, firewall: Math.max(1, Math.trunc(Number(e.target.value))) } : c) }, 'Firewall effectif mis à jour (PAN/serveur ou Logique applicable, p. 216).')} /></label>
            <label>Accès actuel <select aria-label="Accès actuel" className={champ} value={cible.acces} onChange={e => changer({ ...m, cibles: m.cibles.map(c => c.id === id ? { ...c, acces: Number(e.target.value) as AccesShadowrun } : c) }, 'Accès actuel corrigé explicitement.')}>
                {ACCES_SHADOWRUN.map((label, i) => <option key={i} value={i}>{label}</option>)}
            </select></label>
        </div>}
        {setChoix && <>
            <label><input type="checkbox" checked={!!contexte} onChange={e => e.target.checked ? preparer({}) : setChoix(c => ({ ...c, matrice: undefined }))} /> Tentative de piratage</label>
            {contexte && <>
                <label><input type="checkbox" checked={contexte.cybercombat} onChange={e => preparer({ cybercombat: e.target.checked })} /> Cybercombat (seuil opposé saisi au panneau)</label>
                {!contexte.cybercombat && <>
                    <label>Accès visé <select aria-label="Accès visé" className={champ} value={contexte.vise} onChange={e => preparer({ vise: Number(e.target.value) as AccesShadowrun })}>{ACCES_SHADOWRUN.map((label, i) => <option key={i} value={i}>{label}</option>)}</select></label>
                    <label>Préparation <select aria-label="Préparation de backdoor" className={champ} value={contexte.backdoor} onChange={e => preparer({ backdoor: Number(e.target.value) })}>{BACKDOORS_SHADOWRUN.map((label, i) => <option key={i} value={i}>{label}</option>)}</select></label>
                    <p>Seuil {tentative?.seuil} = Firewall {cible?.firewall ?? '?'} + accès {tentative?.elevation} − backdoor {contexte.backdoor} + surveillance {m.hausse}. Minimum {tentative?.minimum} dés de risque.</p>
                </>}
                {tentative?.refus && <p role="alert">{tentative.refus}</p>}
            </>}
        </>}
        <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={bouton} onClick={() => changer(redemarrerMatriceShadowrun(m, false), 'Déconnexion / redémarrage : accès perdus, surveillance conservée.')}>Déconnexion / redémarrage accompli</button>
            <button type="button" className={bouton} onClick={() => changer(redemarrerMatriceShadowrun(m, true), 'Redémarrage et une heure hors ligne accomplis : accès perdus, malus DIEU effacés (p. 218).')}>Confirmer redémarrage et 1 h hors ligne</button>
            {m.convergence && <button type="button" className={bouton} onClick={() => changer({ ...m, convergence: false }, 'Cyberdeck réparé ou remplacé après convergence.')}>Confirmer le cyberdeck réparé</button>}
        </div>
    </fieldset>;
};
