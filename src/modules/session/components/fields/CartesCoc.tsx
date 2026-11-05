import { useState } from 'react';
import { useSourcesCoc } from './useSourcesCoc';
import { confirmerSanteCoc, lireCibleCoc, porterImpactCoc, ecrireCibleCoc, type CibleCoc } from '../../../combat/coc';
import { CLE_AVANTAGES_COC, avancerAvantagesCoc, bonusAvantageCoc } from '../../../dice/systemes/avantagesDeCoc';
import { malusDefensePsychismeCoc } from '../../../dice/systemes/psychismeDeCoc';
import { lireSuiviCoc, type DemandeCoc, type OperationSanteCoc } from '../../../dice/systemes/suiviDeCoc';
import { lireProfilCoc, etatDuProfilCoc, tailleSanteCoc, membresRestantsCoc } from '../../../dice/systemes/profilsDeCoc';
import { CHOIX_DE_COC, lancerCoc, malusDeSante, preparerCoc, type RegleDeCoc } from '../../../dice/systemes/coc';
import { lancerDommagesCoc, preparerDommagesCoc, type TypeArmeCoc } from '../../../dice/systemes/dommagesDeCoc';
import { DiceEngine } from '../../../dice/DiceEngine';
import { isMainWindow } from '../../../../utils/windowRole';

export const boutonCoc = 'rounded-md border border-app-border px-2 py-1 text-xs hover:border-accent disabled:opacity-40';
export const champCoc = 'rounded-md border border-app-border bg-app-bg px-2 py-1 text-xs max-w-full';
const nouveau = () => crypto.randomUUID();
/** Les valeurs fraîches sont relues à chaque confirmation, sur la source du personnage. */
export function DefenseCibleCoc({ choisir }: { choisir: (defense: number) => void }) {
    const sources = useSourcesCoc(), [cle, setCle] = useState('');
    const source = sources.find(s => s.cle === cle), c = source && lireCibleCoc(source.cible);
    const base = c ? Number(c.fiche[c.regle.suivi!.defense]) || 0 : 0;
    const malus = c ? malusDeSante(Number(c.fiche[c.regle.sante!]) || 0, c.regle.des, lireProfilCoc(c.fiche)) : 0;
    const choc = c?.regle.psychisme ? malusDefensePsychismeCoc(c.fiche, c.regle.des) : 0, heros = c?.regle.heroisme ? bonusAvantageCoc(c.fiche, 'defense') : 0;
    return <div className="flex flex-wrap gap-2 text-xs items-center" data-cible-defense-coc>
        <label>Défenseur <select aria-label="Défenseur COC" className={champCoc} value={cle} onChange={e => setCle(e.target.value)}><option value="">Choisir</option>{sources.map(s => <option key={s.cle} value={s.cle}>{s.nom}</option>)}</select></label>
        {c && <button type="button" className={boutonCoc} onClick={() => choisir(base - Math.max(malus, choc) + heros)}>Utiliser DEF {base - Math.max(malus, choc) + heros} (base {base} − état {Math.max(malus, choc)} + héros {heros})</button>}
    </div>;
}
const noms: Record<DemandeCoc['genre'], string> = {
    affaibli: 'Affaibli : CON 10 ou prochaine action perdue', blesse: 'Blessé : prochaine action perdue ; CON 15 ou inconscience 1d6 rounds',
    mourant: 'Mourant : inconscience 1d6 rounds, puis CON 20', 'action-blesse': 'Action physique blessé : CON 15 ou 1 DM et inconscience jusqu’à la fin du prochain tour',
    'action-mourant': 'Action physique mourant : CON 20 ou inconscience et mort dans CON rounds sans stabilisation',
    reveil: 'Réveil : CON 20 ou coma et mort dans CON minutes sans stabilisation', 'coup-grace': 'Coup de grâce : CON 20 ou mort',
    'mort-directe': 'Mort proposée : confirmer après vérification des circonstances et des soins', sequelle: 'Critique et santé au maximum : choisir une séquelle physique avec le livre',
};
function ConsequenceCoc({ cible, demande }: { cible: CibleCoc; demande: DemandeCoc }) {
    const [reussite, setReussite] = useState<boolean | undefined>();
    const [duree, setDuree] = useState(1), [jet, setJet] = useState(''), [message, setMessage] = useState('');
    const besoinD6 = demande.genre === 'mourant' || demande.genre === 'blesse' && reussite === false;
    const lancer = () => {
        const c = lireCibleCoc(cible); if (!c) return;
        // Le test de résistance doit rester possible quand l’état interdit les actions.
        const prep = preparerCoc({ ...c.regle, suivi: undefined }, { ...CHOIX_DE_COC, difficulte: demande.difficulte!, physique: true },
            { champ: c.regle.suivi!.constitution, valeur: Number(c.fiche[c.regle.suivi!.constitution]) || 0 }, c.fiche);
        const r = lancerCoc(prep, faces => DiceEngine.roll(faces));
        setReussite(r.coc.bilan.startsWith('reussite')); setJet(r.totalDisplay ?? `${r.total}`);
    };
    return <div className="flex flex-col gap-2 border-t border-app-border pt-2" data-consequence-coc={demande.genre}>
        <p>{noms[demande.genre]} (p. 72–73).</p>
        {demande.difficulte && <div className="flex flex-wrap gap-2 items-center">
            <button className={boutonCoc} onClick={lancer}>Lancer CON {demande.difficulte}</button>
            <label>Résultat de CON <select aria-label="Résultat de CON" className={champCoc} value={reussite === undefined ? '' : String(reussite)} onChange={e => setReussite(e.target.value === '' ? undefined : e.target.value === 'true')}>
                <option value="">À déterminer</option><option value="true">Réussite</option><option value="false">Échec</option>
            </select></label>{jet && <span>{jet}</span>}
        </div>}
        {besoinD6 && <label>Inconscience (1d6 rounds) <input aria-label="Durée d’inconscience" className={champCoc} type="number" min={1} max={6} value={duree} onChange={e => setDuree(Number(e.target.value))} />
            <button className={boutonCoc} onClick={() => setDuree(DiceEngine.roll(6))}>Lancer 1d6</button></label>}
        <button className={boutonCoc} disabled={!isMainWindow() || !!demande.difficulte && reussite === undefined}
            onClick={() => setMessage(confirmerSanteCoc(cible, { id: `resolution-${demande.id}`, type: 'resoudre', demande: demande.id, reussite, duree }))}>Confirmer la conséquence</button>
        {message && <p role="status">{message}</p>}
    </div>;
}
export function SanteCoc({ cible, desactive = false }: { cible: CibleCoc; desactive?: boolean }) {
    useSourcesCoc();
    const c = lireCibleCoc(cible), [message, setMessage] = useState('');
    if (!c) return null;
    const f = c.fiche, regle = c.regle, p = lireProfilCoc(f), s = lireSuiviCoc(f);
    const e = Number(f[regle.sante!]) || 0, malus = malusDeSante(e, regle.des, p), base = Number(f[regle.suivi!.defense]) || 0;
    const choc = regle.psychisme ? malusDefensePsychismeCoc(f, regle.des) : 0, heros = regle.heroisme ? bonusAvantageCoc(f, 'defense') : 0;
    const etat = etatDuProfilCoc(e, p);
    const confirmer = (op: Omit<OperationSanteCoc, 'id'>) => setMessage(confirmerSanteCoc(cible, { ...op, id: nouveau() } as OperationSanteCoc));
    return <fieldset disabled={desactive || !isMainWindow()} className="flex flex-col gap-3 text-xs" data-sante-coc>
        <legend className="font-bold">Santé et conséquences — {c.nom}</legend>
        {desactive && <p>Enregistrer la fiche avant de confirmer une conséquence.</p>}
        <p data-defense-coc>DEF de base {base} − santé {malus}{choc ? ` (état psychique ${choc} ; seul le pire malus)` : ''}{heros ? ` + héros ${heros}` : ''} = <strong>DEF effective {base - Math.max(malus, choc) + heros}</strong>. La base est conservée.</p>
        <p>{p?.bande ? `${membresRestantsCoc(p, e)} membres restants sur ${p.bande}` : `${e}/${tailleSanteCoc(p)} échelons noircis — ${etat?.label ?? 'Indemne'}`}.</p>
        {!p?.bande && <p>Déplacement : {e >= tailleSanteCoc(p) ? 'impossible' : etat?.label === 'Blessé' ? 'moitié' : 'normal'}.</p>}
        {s.mort && <p>Mort confirmée.</p>}
        {s.inconscience && <p>Inconscience : {s.inconscience.reste} {s.inconscience.unite === 'tour' ? 'fins de tour du personnage' : 'rounds'} restant(s).</p>}
        {s.coma && <p>Coma : stabiliser avant {s.comaReste} {s.coma === 'minutes' ? 'minutes' : 'rounds'}. L’échéance propose une confirmation de mort.</p>}
        {!!s.actionsPerdues && <button className={boutonCoc} onClick={() => confirmer({ type: 'consommer-action-perdue' })}>Consommer la prochaine action perdue</button>}
        {s.physiqueAutorisee && <p>Une action physique autorisée par CON. Le prochain test physique consommera cette autorisation.</p>}
        {!p?.bande && ['Blessé', 'Mourant'].includes(etat?.label ?? '') && !s.physiqueAutorisee && <button className={boutonCoc} onClick={() => confirmer({ type: 'action-physique' })}>Préparer une action physique</button>}
        {s.demandes.filter(d => !d.traitee).map(d => <ConsequenceCoc key={d.id} cible={cible} demande={d} />)}
        <details><summary>Temps écoulé et arbitrage du meneur</summary><div className="flex flex-wrap gap-2 py-2">
            {(['tour', 'round', 'minute'] as const).map(unite => <button key={unite} className={boutonCoc} onClick={() => setMessage(confirmerSanteCoc(cible, { type: 'avancer', unite, id: nouveau() }))}>+1 {unite === 'tour' ? 'fin de tour du personnage' : unite}</button>)}
            <button className={boutonCoc} onClick={() => confirmer({ type: 'stabiliser' })}>Confirmer les soins de stabilisation réussis</button>
            <button className={boutonCoc} onClick={() => confirmer({ type: 'rectifier' })}>Rectifier le suivi (santé conservée)</button>
        </div><p>Le bouton Tour suivant du combat avance ces durées. Hors combat, confirmer le temps ici. Ne pas compter deux fois le même round.</p></details>
        {message && <p role="status">{message}</p>}
    </fieldset>;
}
export function DommagesCoc({ regle, valeurs, attaque, critique, personnageId }: { regle: RegleDeCoc; valeurs: Record<string, unknown>; attaque?: string; critique: boolean; personnageId?: string }) {
    const sources = useSourcesCoc(), arme = regle.dommages?.armes.find(a => a.attaque === attaque);
    const [formule, setFormule] = useState(String(arme ? valeurs[arme.dm] ?? '' : ''));
    const [type, setType] = useState<TypeArmeCoc | ''>(String(arme ? valeurs[arme.type] ?? '' : '') as TypeArmeCoc | '');
    const [bonus, setBonus] = useState(String(arme ? valeurs[arme.critique] ?? '' : ''));
    const [cible, setCible] = useState(''), [resultat, setResultat] = useState<ReturnType<typeof lancerDommagesCoc>>(), [message, setMessage] = useState('');
    const [id] = useState(nouveau), [applique, setApplique] = useState(false);
    const source = sources.find(s => s.cible.id === personnageId), acteur = source && lireCibleCoc(source.cible);
    const bonusHeros = regle.heroisme && acteur ? bonusAvantageCoc(acteur.fiche, 'dm-infliges') : 0;
    const choisie = sources.find(s => s.cle === cible), c = choisie && lireCibleCoc(choisie.cible), profil = c && lireProfilCoc(c.fiche);
    const bande = !!profil?.bande, rd = c?.pilote.combat.encaissement?.rd;
    const reduction = rd && c ? Math.max(0, Number(c.fiche[rd]) || 0) : 0;
    const prep = type ? preparerDommagesCoc(formule, type, Number(valeurs[regle.dommages!.force]) || 0, critique, bonus.trim() ? Number(bonus) : undefined) : undefined;
    return <fieldset className="flex flex-col gap-2 text-xs w-full" data-dommages-coc disabled={applique || !isMainWindow()}>
        <legend className="font-bold">Dommages de {arme ? String(valeurs[arme.nom] || 'l’arme') : 'l’attaque'}{critique ? ' — critique' : ''}</legend>
        <label>Cible <select aria-label="Cible des DM" className={champCoc} value={cible} onChange={e => setCible(e.target.value)}><option value="">Choisir</option>{sources.map(s => <option key={s.cle} value={s.cle}>{s.nom}</option>)}</select></label>
        {bande ? <p>Bande : une touche retire un membre, sans jet de DM ni RD.</p> : <>
            <label>Type d’arme <select aria-label="Type d’arme" className={champCoc} value={type} disabled={!!resultat} onChange={e => setType(e.target.value as TypeArmeCoc)}>
                <option value="">À préciser</option>{(['contact', 'lancer', 'distance', 'mains-nues', 'explosif'] as const).map(t => <option key={t}>{t}</option>)}
            </select></label>
            <label>DM de l’arme <input aria-label="DM de l’arme" className={champCoc} value={formule} disabled={!!resultat} onChange={e => setFormule(e.target.value)} /></label>
            {critique && <label>Bonus critique fixe (vide : maximum des DM, sans FOR) <input aria-label="Bonus critique fixe" className={champCoc} type="number" min={0} value={bonus} disabled={!!resultat} onChange={e => setBonus(e.target.value)} /></label>}
            {type && ['contact', 'lancer', 'mains-nues'].includes(type) && <p>FOR ajoutée : {Number(valeurs[regle.dommages!.force]) || 0}.</p>}
            {type === 'explosif' && critique && <p>Explosif critique : maximum des DM, aucun bonus critique supplémentaire. AGI 20 pour diviser les DM par deux : arbitrer avant transfert.</p>}
            <button className={boutonCoc} disabled={!prep || 'refus' in prep || !!resultat} onClick={() => prep && setResultat(lancerDommagesCoc(prep, faces => DiceEngine.roll(faces)))}>Lancer les DM</button>
            {prep && 'refus' in prep && <p>{prep.refus}</p>}
            {resultat && <p data-resultat-dm-coc>{resultat.detail}{bonusHeros ? ` + héros ${bonusHeros} = ${resultat.total + bonusHeros} DM` : ''}{c && ` ; RD ${reduction} → ${Math.max(0, resultat.total + bonusHeros - reduction - (c.regle.heroisme ? bonusAvantageCoc(c.fiche, 'dm-subis') : 0))} subis.`}</p>}
        </>}
        <button className={boutonCoc} disabled={!choisie || !bande && !resultat} onClick={() => {
            if (!choisie) return;
            if (!bande && bonusHeros && acteur && source) ecrireCibleCoc(source.cible, { [CLE_AVANTAGES_COC]: avancerAvantagesCoc(acteur.fiche, 'dm-infliges', id) });
            setMessage(porterImpactCoc(choisie.cible, { value: bande ? 0 : resultat!.total + bonusHeros, type: 'coup ou projectile', coc: { id, critique, touche: true } }));
            setApplique(true);
        }}>{applique ? 'Coup appliqué' : bande ? 'Confirmer la touche : retirer un membre' : 'Appliquer les DM à la cible'}</button>
        {message && <p role="status">{message}</p>}
    </fieldset>;
}
