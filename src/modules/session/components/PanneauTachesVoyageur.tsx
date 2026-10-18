import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEGRES_DE_REUSSITE, cleI18nDuDegre, type DegreDeReussite } from '../../dice/degresDeReussite';
import { creerTache, lireTaches, periodeDeTache, suspendreTache, type ResultatDeTache } from '../logic/tachesDuVoyageur';
import type { DonneesDeVoyage } from '../logic/operationsDeVoyageur';
import { useOperationDeVoyageur } from '../hooks/useOperationDeVoyageur';
import { CLASSE_OPERATION as classe, ValidationOperationVoyageur } from './ValidationOperationVoyageur';

export function PanneauTachesVoyageur({donnees,appliquer,nom,avantOperation}: {
    donnees: DonneesDeVoyage; appliquer: (d:DonneesDeVoyage) => void; nom: string; avantOperation?: () => boolean;
}) {
    const {t} = useTranslation(['modules','common']);
    const [nomTache,setNom] = useState(''), [participants,setParticipants] = useState(nom), [objectif,setObjectif] = useState('4');
    const [difficulte,setDifficulte] = useState('0'), [periode,setPeriode] = useState('10'), [limite,setLimite] = useState(''), [eliminatoire,setEliminatoire] = useState('');
    const [choix,setChoix] = useState(''), [resultats,setResultats] = useState<Record<string,ResultatDeTache>>({});
    const op = useOperationDeVoyageur(donnees,d => {appliquer(d);setResultats({});},avantOperation);
    let c;try {c = lireTaches(donnees);} catch(e) {return <p role="alert">{(e as Error).message}</p>;}
    const ouvrage = c.taches.find(x => x.id === choix) ?? c.taches.at(-1);
    const jet = donnees.__rddJetPourTache231 as {id:string;degre:DegreDeReussite;titre:string} | undefined;
    const jetValide = jet && typeof jet.id === 'string' && DEGRES_DE_REUSSITE.includes(jet.degre);
    return <section aria-label="Points de tâche RdD" className="p-4 rounded-xl border border-accent/30 bg-app-surface text-app-text space-y-3">
        <h3 className="font-bold text-accent">Ouvrages et points de tâche</h3>
        <p className="text-sm">Un ouvrage collectif se suit dans un seul carnet. Renseignez tous les participants à chaque période ; les scores négatifs et malus restent conservés.</p>
        <fieldset disabled={!!op.apercu} className="min-w-0 space-y-3">
        <details><summary className="cursor-pointer font-bold">Nouvel ouvrage</summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
                <label className="text-sm flex flex-col">Nom de l’ouvrage<input className={classe} maxLength={160} value={nomTache} onChange={e => setNom(e.target.value)} /></label>
                <label className="text-sm flex flex-col">Participants (séparés par des virgules)<input className={classe} value={participants} onChange={e => setParticipants(e.target.value)} /></label>
                <label className="text-sm flex flex-col">Objectif en points<input type="number" className={classe} value={objectif} onChange={e => setObjectif(e.target.value)} /></label>
                <label className="text-sm flex flex-col">Difficulté de l’ouvrage<input type="number" className={classe} value={difficulte} onChange={e => setDifficulte(e.target.value)} /></label>
                <label className="text-sm flex flex-col">Durée d’une période (minutes)<input type="number" step="0.1" className={classe} value={periode} onChange={e => setPeriode(e.target.value)} /></label>
                <label className="text-sm flex flex-col">Temps limite (minutes, facultatif)<input type="number" className={classe} value={limite} onChange={e => setLimite(e.target.value)} /></label>
                <label className="text-sm flex flex-col">Seuil éliminatoire négatif (facultatif)<input type="number" className={classe} value={eliminatoire} onChange={e => setEliminatoire(e.target.value)} /></label>
            </div><button type="button" className={classe} disabled={!!op.apercu} onClick={() => op.proposer(id => creerTache(donnees,
                {id,nom:nomTache.trim(),participants:participants.split(',').map(x=>x.trim()).filter(Boolean),objectif:Number(objectif),difficulte:Number(difficulte),
                    periodiciteSecondes:Number(periode)*60,limiteSecondes:limite.trim() ? Number(limite)*60 : null,seuilNegatif:eliminatoire.trim() ? Number(eliminatoire) : null},id))}>Préparer cet ouvrage</button>
        </details>
        {ouvrage && <>
            <label className="text-sm flex flex-col">Ouvrage suivi<select aria-label="Ouvrage suivi" className={classe} value={ouvrage.id} onChange={e => {setChoix(e.target.value);setResultats({});op.annuler();}}>
                {c.taches.map(x => <option key={x.id} value={x.id}>{x.nom} — {x.etat}</option>)}</select></label>
            <p>{ouvrage.points}/{ouvrage.objectif} points · difficulté {ouvrage.difficulte+ouvrage.malus} · {ouvrage.periodes} période(s), {ouvrage.periodes*ouvrage.periodiciteSecondes/60} min · {ouvrage.etat}</p>
            {ouvrage.limiteSecondes !== null && <p className="text-sm">Échéance : {ouvrage.limiteSecondes/60} min. Le temps d’attente doit aussi être déclaré.</p>}
            {['active','pause'].includes(ouvrage.etat) && <>
                {ouvrage.participants.map(p => <div key={p} className="flex flex-wrap gap-2 items-end">
                    <label className="text-sm flex flex-col">Résultat de {p}<select aria-label={`Résultat de ${p}`} className={classe} value={resultats[p]?.degre ?? ''} onChange={e => {setResultats(v => ({...v,[p]:{participant:p,degre:e.target.value as ResultatDeTache['degre']}}));op.annuler();}}>
                        <option value="">À renseigner</option><option value="absent">Ne participe pas à cette période</option>{DEGRES_DE_REUSSITE.map(d => <option key={d} value={d}>{t(cleI18nDuDegre(d))}</option>)}</select></label>
                    {jetValide && !c.jetsUtilises.includes(jet.id) && <button type="button" className={classe} title={jet.titre} onClick={() => {setResultats(v => ({...v,[p]:{participant:p,degre:jet.degre,jetId:jet.id}}));op.annuler();}}>Utiliser le jet conservé pour {p}</button>}
                </div>)}
                <p className="text-xs">Jouez les jets avec la difficulté indiquée, les caractéristiques et compétences de chaque participant. Un échec total ajoute −1 aux jets suivants ; une maladresse ruinant le travail reste une décision du gardien.</p>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className={classe} disabled={!!op.apercu || ouvrage.etat !== 'active'} onClick={() => op.proposer(id => periodeDeTache(donnees,ouvrage.id,ouvrage.participants.map(p => resultats[p]).filter(Boolean),id))}>Préparer la période</button>
                    <button type="button" className={classe} disabled={!!op.apercu} onClick={() => op.proposer(id => suspendreTache(donnees,ouvrage.id,id))}>{ouvrage.etat === 'pause' ? 'Reprendre l’ouvrage' : 'Mettre en pause'}</button>
                    <button type="button" className={classe} disabled={!!op.apercu} onClick={() => op.proposer(id => periodeDeTache(donnees,ouvrage.id,[],id,true))}>Laisser passer une période sans travail</button>
                    <button type="button" className={classe} disabled={!!op.apercu} onClick={() => op.proposer(id => suspendreTache(donnees,ouvrage.id,id,true))}>Déclarer l’ouvrage perdu</button>
                </div>
            </>}
        </>}
        </fieldset><ValidationOperationVoyageur operation={op} />
    </section>;
}
