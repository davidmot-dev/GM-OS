import { useRef, useState } from 'react';
import type { RegleDeDeltaGreen } from '../../../dice/systemes/deltaGreen';
import type { RollResult } from '../../../dice/DiceEngine';
import { DiceEngine } from '../../../dice/DiceEngine';
import { Bouton } from '../../../../components/socle';
import { calculerPerteSAN, refusDePerteSAN, subirPerteSAN, ameliorerCompetencesDG, lireSuiviDG, opposerDeltaGreen, type TraumatismeDG } from '../../../dice/systemes/deltaGreenSuites';

export interface DernierJetDG { id: string; champ: string; chances: number; resultat: RollResult }
/** Les suites du dernier jet, dans la carte habituelle du jeu ; écritures par la fiche (PC et tablette). */
export default function DeltaGreenAuJet({ regle, valeurs, dernier, ecrire, consigner, libelle }: {
    regle: RegleDeDeltaGreen; valeurs: Record<string, unknown>; dernier: DernierJetDG | null;
    ecrire: (maj: Record<string, unknown>) => void; consigner: (texte: string) => void; libelle: (champ: string) => string;
}) {
    const [nature, setNature] = useState<TraumatismeDG>('violence');
    const [formule, setFormule] = useState('0/1D6');
    const [message, setMessage] = useState('');
    const [erreurSAN, setErreurSAN] = useState('');
    const [chancesAdverses, setChancesAdverses] = useState(50);
    const [deAdverse, setDeAdverse] = useState(50);
    const [poursuite, setPoursuite] = useState(false);
    // La référence ferme la fenêtre entre deux clics et le retour des valeurs du porteur.
    const [ecrits, setEcrits] = useState({ base: valeurs, maj: {} as Record<string, unknown> });
    const ref = useRef(ecrits);
    const lues = { ...valeurs, ...(ecrits.base === valeurs ? ecrits.maj : {}) };
    const lire = () => ({ ...valeurs, ...(ref.current.base === valeurs ? ref.current.maj : {}) });
    const appliquer = (maj: Record<string, unknown>, texte: string) => {
        ref.current = { base: valeurs, maj: { ...(ref.current.base === valeurs ? ref.current.maj : {}), ...maj } };
        setEcrits(ref.current);
        ecrire(maj); setMessage(texte); consigner(texte);
    };
    const suivi = lireSuiviDG(lues);
    const cases = Object.entries(regle.experience ?? {}).filter(([, c]) => lues[c] === true);
    const testSAN = !!dernier && dernier.champ === regle.san && !!dernier.resultat.degre;
    const deja = !!dernier && suivi.pertesTraitees.includes(dernier.id);
    const champ = (valeur: string) => <span className="font-bold">{valeur}</span>;
    const classe = 'rounded border border-app-border bg-app-bg px-2 py-1 text-app-text';
    // David, 13/11/2026 : les actions du jeu reprennent « Lancer » / « Demander à ».
    // Les champs conservent leur habillage ; les boutons ont leurs états et leur cible tactile.
    const action = 'w-full sm:w-auto max-w-full px-5 py-3 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-center transition-all disabled:cursor-not-allowed';
    const actionPrincipale = `${action} bg-accent text-app-on-accent enabled:hover:scale-105 enabled:active:scale-95 disabled:bg-app-text/5 disabled:text-app-text/20`;
    const actionSecondaire = `${action} border border-accent/60 text-accent hover:bg-accent/10 disabled:border-app-border/40 disabled:text-app-text/30 disabled:hover:bg-transparent`;
    return <div className="space-y-3 text-sm" data-delta-green>
        {regle.sante && Number(valeurs[regle.sante]) <= 2 && <p className="text-etat-danger font-bold">
            {Number(valeurs[regle.sante]) <= 0 ? '0 PV : mort' : '2 PV ou moins : inconscient'} (p. 18)
        </p>}
        {regle.san && <fieldset className="space-y-2">
            <legend className="font-bold">Santé Mentale et Seuil de rupture</legend>
            <p>SAN {String(lues[regle.san] ?? '—')} · SR {String(lues[regle.seuilRupture ?? ''] ?? '—')}</p>
            <label className="flex flex-wrap items-center gap-2">Traumatisme <select aria-label="Traumatisme" className={classe} value={nature} onChange={e => setNature(e.target.value as TraumatismeDG)}>
                <option value="violence">Violence</option><option value="impuissance">Impuissance</option><option value="inconcevable">Inconcevable</option>
            </select></label>
            <label className="flex flex-wrap items-center gap-2">Perte de SAN <input aria-label="Perte de SAN" className={classe} value={formule} onChange={e => setFormule(e.target.value)} placeholder="−5 ou 0/1D6" /></label>
            <p className="text-app-text/70">Saisir une perte directe (5 ou −5 retire 5 SAN), ou un barème réussite / échec (0/1D6). Critique : minimum / maximum. Accoutumance : utiliser la perte de réussite (p. 66, 73).</p>
            {erreurSAN && <p role="alert" className="text-etat-danger">{erreurSAN}</p>}
            <Bouton habillage="libre" cibleTactile className={actionPrincipale} disabled={!testSAN || deja} onClick={() => {
                setErreurSAN('');
                if (!dernier || !testSAN) return;
                const accoutume = nature !== 'inconcevable' && lire()[`accoutumance_${nature}`] === true;
                const degre = accoutume ? 'reussite-normale' : dernier.resultat.degre!;
                const perte = calculerPerteSAN(formule, degre, faces => DiceEngine.roll(faces));
                if (perte === null) { setErreurSAN('Perte invalide : saisir un montant (5 ou −5), un dé (1D6) ou un barème réussite / échec (0/1D6).'); return; }
                const refus = refusDePerteSAN(regle, lire(), perte, nature, dernier.id);
                if (refus) { setErreurSAN(refus); return; }
                const suite = subirPerteSAN(regle, lire(), perte, nature, dernier.id, faces => DiceEngine.roll(faces));
                if (suite) appliquer(suite.maj, suite.texte);
                else setErreurSAN('La perte n’a pas été appliquée : vérifier les valeurs de Santé Mentale de la fiche.');
            }}>{deja ? 'Perte déjà appliquée' : 'Appliquer la perte de SAN'}</Bouton>
            <p>Accoutumance : violence {suivi.violence}/3 {lues.accoutumance_violence === true ? '(acquise)' : ''} · impuissance {suivi.impuissance}/3 {lues.accoutumance_impuissance === true ? '(acquise)' : ''}</p>
            {suivi.folieTemporaire && <p className="text-etat-alerte">Folie temporaire : fuite, lutte ou soumission, à décider avec l’Officier Traitant (p. 69).</p>}
            {suivi.folieTemporaire && <button type="button" className={classe} onClick={() => appliquer({ __deltaGreen: { ...lireSuiviDG(lire()), folieTemporaire: false } }, 'Fin de la folie temporaire décidée par l’Officier Traitant')}>Terminer la folie temporaire</button>}
            {suivi.troubles > 0 && <p className="text-etat-alerte">{suivi.troubles} trouble(s) acquis par rupture : noter leur nature dans « Motivations et troubles psychiques » ; surveiller leurs déclencheurs (p. 69–72).</p>}
            {suivi.foliePermanente && <p className="text-etat-danger">Folie permanente : retrait de l’Agent à décider avec l’Officier Traitant (p. 73).</p>}
        </fieldset>}
        {dernier && <fieldset className="space-y-2 border-t border-app-border pt-2">
            <legend className="font-bold">Test en opposition (p. 45)</legend>
            <p>Jet de l’Agent : {dernier.resultat.total === 100 ? '00' : dernier.resultat.total} contre {dernier.chances} %.</p>
            <label className="flex flex-wrap gap-2">Chances adverses (%) <input aria-label="Chances adverses" className={classe} type="number" min="1" max="99" value={chancesAdverses} onChange={e => setChancesAdverses(Number(e.target.value))} /></label>
            <label className="flex flex-wrap gap-2">Dé adverse (100 pour 00) <input aria-label="Dé adverse" className={classe} type="number" min="1" max="100" value={deAdverse} onChange={e => setDeAdverse(Number(e.target.value))} /></label>
            <Bouton habillage="libre" cibleTactile className={actionSecondaire} onClick={() => setDeAdverse(DiceEngine.roll(100))}>Lancer le dé adverse</Bouton>
            <label className="flex gap-2"><input type="checkbox" checked={poursuite} onChange={e => setPoursuite(e.target.checked)} />Poursuite : le plus petit des deux échecs l’emporte</label>
            <p>{opposerDeltaGreen({ de: dernier.resultat.total, chances: dernier.chances }, { de: deAdverse, chances: chancesAdverses }, poursuite)}</p>
            <Bouton habillage="libre" cibleTactile className={actionSecondaire} onClick={() => consigner(`Opposition : ${dernier.resultat.total}/${dernier.chances} % contre ${deAdverse}/${chancesAdverses} % — ${opposerDeltaGreen({ de: dernier.resultat.total, chances: dernier.chances }, { de: deAdverse, chances: chancesAdverses }, poursuite)}`)}>Consigner l’opposition</Bouton>
        </fieldset>}
        {!!regle.experience && <fieldset className="space-y-2 border-t border-app-border pt-2">
            <legend className="font-bold">Amélioration après la partie (p. 29)</legend>
            <p>{cases.length ? cases.map(([c]) => libelle(c)).join(', ') : 'Aucune compétence cochée.'}</p>
            <Bouton habillage="libre" cibleTactile className={actionPrincipale} disabled={!cases.length} onClick={() => {
                const r = ameliorerCompetencesDG(regle, lire(), f => DiceEngine.roll(f));
                if (Object.keys(r.maj).length) appliquer(r.maj, `Fin de partie : ${r.texte}`);
            }}>Améliorer les compétences cochées (1D4 chacune)</Bouton>
        </fieldset>}
        {dernier?.resultat.degre === 'echec-total' && <p className="text-etat-alerte">Échec critique (p. 44–45) : l’Officier Traitant choisit une complication. En combat : arme enrayée 1D4 tours, fatigue, distraction… Les dégâts et les effets se règlent dans Combat-OS.</p>}
        {message && <p role="status">{champ(message)}</p>}
    </div>;
}
