import { useRef, useState } from 'react';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import {
    CLE_PANIQUE_ALIEN, appliquerLaPaniqueAlien, arreterLaPaniqueAlien, changerLeStressAlien,
    cumulAlien, demanderUnePaniqueAlien, estUnAndroide, lireLaPaniqueAlien, modifierDePanique,
    type RegleDePaniqueAlien,
} from '../../../dice/systemes/paniqueAlien';
import { entreeDeLaTable } from '../../../dice/systemes/yearZero';
import { pontDesTables } from '../../../tables/pontDesTables';
import { useSessionOSStore } from '../../useSessionOSStore';

const BOUTON = 'rounded-lg border border-app-border px-2 py-1 text-xs text-app-text hover:bg-app-text/5 disabled:opacity-40';
const identifiant = () => `alien-${crypto.randomUUID()}`;

interface Props {
    regle: RegleDePaniqueAlien;
    champPanique?: string;
    valeurs: Record<string, unknown>;
    ecrire: (maj: Record<string, unknown>) => void;
    personnageId?: string;
    campaignId?: string;
    pourLesJoueurs: boolean;
    consigner: (titre: string, resultat: RollResult) => void;
}

/** Les conséquences restent sur la fiche ; leur propagation est choisie par Maman. */
export default function PaniqueAlien({ regle, champPanique, valeurs, ecrire, personnageId, campaignId, pourLesJoueurs, consigner }: Props) {
    const suivi = lireLaPaniqueAlien(valeurs);
    const [cause, setCause] = useState('Événement horrible décidé par Maman');
    const [cibles, setCibles] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [meurtriere, setMeurtriere] = useState(false);
    const enCours = useRef(false);
    const ficheActuelle = useRef(valeurs);
    ficheActuelle.current = valeurs;
    const players = useSessionOSStore(s => s.players);
    const possibles = players.flatMap(p => p.characters
        .filter(c => !!campaignId && c.id !== personnageId && c.campaignId === campaignId && !estUnAndroide(regle, c.sheetData ?? {}))
        .map(c => ({ joueurId: p.id, personnage: c })));
    const effet = suivi.effet;
    const actif = effet && (!champPanique || Number(valeurs[champPanique]) >= 7);
    // Une contagion en attente reste accessible après la fin de l'effet personnel.
    const aPropager = suivi.historique.filter(e => e.contagion && !e.contagion.terminee);
    const androide = estUnAndroide(regle, valeurs);

    const annoncer = (texte: string) => {
        setMessage(texte);
        consigner('Stress et Panique', { total: 0, modifier: 0, rolls: [], totalDisplay: texte });
    };
    const stress = (delta: number, raison: string) => {
        const maj = changerLeStressAlien(regle, valeurs, identifiant(), delta);
        ecrire(maj);
        annoncer(`${raison} : Stress ${Number(valeurs[regle.stress]) || 0} → ${maj[regle.stress]}`);
    };
    const panique = (id: string, raison: string) => {
        if (androide || enCours.current || suivi.traites.includes(id)) return;
        enCours.current = true;
        try {
            const de = DiceEngine.roll(6);
            const niveau = Number(valeurs[regle.stress]) || 0;
            const modificateur = modifierDePanique(regle, valeurs);
            const total = de + niveau + modificateur;
            const precedent = champPanique ? Number(valeurs[champPanique]) || 0 : 0;
            const { effectif, cumule } = cumulAlien(total, precedent);
            const talentMeurtrier = regle.talents && String(valeurs[regle.talents] ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('folie meurtriere');
            ecrire(appliquerLaPaniqueAlien(regle, champPanique, valeurs, id, effectif, meurtriere && !!talentMeurtrier));
            consigner(`Panique — ${raison}`, {
                total: effectif, modifier: niveau + modificateur, rolls: [{ val: de, sides: 6 }],
                totalDisplay: `${de} + Stress ${niveau}${modificateur ? ` −2 (Nerfs d’acier)` : ''} = ${total}${cumule ? ` → ${effectif} (cumul)` : ''}`,
            });
        } finally { enCours.current = false; }
    };
    const terminer = (raison: string) => {
        ecrire(arreterLaPaniqueAlien(valeurs, champPanique));
        annoncer(`Panique terminée : ${raison}. Le Stress n'est pas réduit par cette fin d'effet.`);
    };
    const propager = (id: string, aucun = false) => {
        const evenement = suivi.historique.find(e => e.id === id);
        if (!evenement?.contagion || pourLesJoueurs || enCours.current) return;
        enCours.current = true;
        try {
            const faits = [...evenement.contagion.traites];
            for (const cibleId of aucun ? [] : cibles) {
                const store = useSessionOSStore.getState();
                const joueur = store.players.find(p => p.characters.some(c => c.id === cibleId));
                const cible = joueur?.characters.find(c => c.id === cibleId);
                if (!joueur || !cible || cible.campaignId !== campaignId || faits.includes(cibleId)) continue;
                const fiche = cible.sheetData ?? {};
                if (estUnAndroide(regle, fiche)) continue;
                const source = `${evenement.id}:contagion:${cibleId}`;
                const maj = evenement.contagion.effet === 'stress'
                    ? changerLeStressAlien(regle, fiche, source, 1)
                    : demanderUnePaniqueAlien(fiche, source, `${evenement.titre} d'un personnage amical`);
                if (Object.keys(maj).length) store.updateCharacter(joueur.id, cible.id, { sheetData: { ...fiche, ...maj } });
                faits.push(cibleId);
            }
            const mettreAJour = (e: typeof evenement) => e.id === id && e.contagion ? { ...e, contagion: { ...e.contagion, traites: faits, terminee: true } } : e;
            ecrire({ [CLE_PANIQUE_ALIEN]: { ...suivi, effet: suivi.effet ? mettreAJour(suivi.effet) : undefined, historique: suivi.historique.map(mettreAJour) } });
            setCibles([]);
            annoncer(`${evenement.titre} : contagion traitée pour ${faits.length} personnage(s) choisi(s).`);
        } finally { enCours.current = false; }
    };
    const bilan = async () => {
        if (pourLesJoueurs || !suivi.traumaEnAttente || enCours.current) return;
        enCours.current = true;
        try {
            const nombre = Math.max(0, Math.floor(Number(valeurs[regle.empathie]) || 0));
            const res = DiceEngine.rollYZE(nombre, 0);
            let texte = `Fin de séance : Empathie seule (${nombre} dés, sans Stress) — ${res.successes ?? 0} réussite(s).`;
            let traumatisme: string | undefined;
            if ((res.successes ?? 0) > 0) {
                const de = DiceEngine.roll(6);
                const table = await pontDesTables()?.loadTable('Alien', 'traumatismes_mentaux').catch(() => null);
                const entree = table ? entreeDeLaTable(table.entries, de) : undefined;
                const trauma = entree ? `${entree.title}${entree.effect ? ` — ${entree.effect}` : ''}` : `Traumatisme : résultat ${de} (table p. 101 à consulter)`;
                traumatisme = trauma;
                texte += ` Traumatisme développé : ${trauma}`;
            } else texte += ' Aucun traumatisme développé.';
            const actuel = lireLaPaniqueAlien(ficheActuelle.current);
            const nouveauRisque = actuel.historique.some(e => e.total >= 13 && !suivi.historique.some(ancien => ancien.id === e.id));
            ecrire({ [CLE_PANIQUE_ALIEN]: { ...actuel, traumaEnAttente: nouveauRisque,
                traumatismes: traumatisme ? [...actuel.traumatismes, traumatisme] : actuel.traumatismes, bilan: texte } });
            consigner('Traumatisme — fin de séance', { ...res, totalDisplay: texte });
        } finally { enCours.current = false; }
    };

    return <section data-panique-alien className="space-y-2 rounded-xl border border-etat-alerte/30 bg-etat-alerte/5 p-3 text-xs">
        <h4 className="font-bold text-app-text">Stress et Panique</h4>
        {androide ? <p>Androïde : aucun Stress ni test de Panique.</p> : <>
            {!pourLesJoueurs && <div className="flex flex-wrap items-end gap-2">
                <button type="button" className={BOUTON} onClick={() => stress(1, 'Rafale automatique')}>Rafale : Stress +1</button>
                <button type="button" className={BOUTON} onClick={() => stress(1, cause)}>Événement : Stress +1</button>
                <label className="min-w-0 max-w-full">Cause de Panique<select className="block w-full min-w-0 max-w-full bg-app-bg border border-app-border rounded p-1" value={cause} onChange={e => setCause(e.target.value)}>
                    {['Événement horrible décidé par Maman', 'Blessure critique', 'Cloué sur place', 'Première attaque d’une créature inconnue', 'Témoin de panique'].map(c => <option key={c}>{c}</option>)}
                </select></label>
                <button type="button" className={BOUTON} onClick={() => ecrire(demanderUnePaniqueAlien(valeurs, identifiant(), cause))}>Demander un test de Panique</button>
            </div>}
            {String(regle.talents ? valeurs[regle.talents] : '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('folie meurtriere') &&
                <label className="flex gap-2"><input type="checkbox" checked={meurtriere} onChange={e => setMeurtriere(e.target.checked)} />Ennemis en vue : remplacer 11+ par Folie meurtrière pour les tests demandés</label>}
            {suivi.demandes.map(d => <div key={d.id} className="flex flex-wrap gap-2 items-center"><span>Panique demandée : {d.cause}</span>
                <button className={BOUTON} type="button" onClick={() => panique(d.id, d.cause)}>Résoudre cette Panique</button></div>)}
            {actif && <div className="space-y-1"><p className="font-bold">{effet.titre} ({effet.total})</p><p>{effet.rappel}</p>
                {!pourLesJoueurs && <div className="flex flex-wrap gap-2">
                    {effet.duree === 'immediate' && <button className={BOUTON} type="button" onClick={() => terminer('effet immédiat résolu')}>Effet immédiat résolu</button>}
                    {effet.duree === 'round' && <button className={BOUTON} type="button" onClick={() => terminer('Round écoulé et action obligatoire résolue')}>Round et action résolus</button>}
                    {effet.duree !== 'brise' && <>
                        <button className={BOUTON} type="button" onClick={() => terminer('Commandement réussi d’un allié (action lente)')}>Commandement réussi</button>
                        <button className={BOUTON} type="button" onClick={() => terminer('un Tour entier écoulé')}>Tour écoulé</button>
                    </>}
                    <button className={BOUTON} type="button" onClick={() => terminer(effet.duree === 'brise' ? 'personnage ou cible(s) Brisé(s), selon l’effet' : 'personnage Brisé')}>Brisé : terminer la panique</button>
                </div>}
            </div>}
            {!pourLesJoueurs && aPropager.length > 0 && <div className="space-y-2">
                <p className="font-bold">Contagion : choisir uniquement les personnages concernés</p>
                {possibles.map(p => <label key={p.personnage.id} className="flex gap-2"><input type="checkbox" checked={cibles.includes(p.personnage.id)} onChange={e => setCibles(v => e.target.checked ? [...v, p.personnage.id] : v.filter(x => x !== p.personnage.id))} />{p.personnage.name}</label>)}
                {aPropager.map(e => <div key={e.id}><p>{e.titre} : {e.contagion!.critere} — {e.contagion!.effet === 'stress' ? 'Stress +1' : 'test de Panique'}.</p>
                    <div className="flex flex-wrap gap-2"><button className={BOUTON} type="button" disabled={!cibles.some(id => !e.contagion!.traites.includes(id))} onClick={() => propager(e.id)}>Appliquer la contagion de {e.titre}</button>
                    <button className={BOUTON} type="button" onClick={() => propager(e.id, true)}>Aucun autre personnage concerné</button></div></div>)}
            </div>}
            {suivi.traumaEnAttente && <div><p className="font-bold">Fin de séance : test d’Empathie requis après une Panique 13+.</p>
                {!pourLesJoueurs && <button className={BOUTON} type="button" onClick={() => void bilan()}>Bilan de séance : tester l’Empathie</button>}
            </div>}
            {suivi.bilan && <p>{suivi.bilan}</p>}
            {suivi.traumatismes.map((t, i) => <p key={i}>Traumatisme permanent : {t}</p>)}
        </>}
        {message && <p role="status">{message}</p>}
    </section>;
}
