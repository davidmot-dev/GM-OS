import { useRef, useState } from 'react';
import type { ChoixDeCoc, RegleDeCoc } from '../../../dice/systemes/coc';
import { CLE_AVANTAGES_COC, acheterAvantageCoc, avancerAvantagesCoc, lireAvantagesCoc, preparerAvantageCoc, type DestinationCoc } from '../../../dice/systemes/avantagesDeCoc';
import { CLE_PSYCHISME_COC, CHOCS_COC, SEQUELLES_COC, avancerPsychismeCoc, confirmerChocCoc, lancerChocCoc, lirePsychismeCoc, parametresChocCoc, type ChocCoc } from '../../../dice/systemes/psychismeDeCoc';
import { capacitesDisponiblesCoc, VOIES_COC } from '../../../dice/systemes/voiesDeCoc';
import { DiceEngine } from '../../../dice/DiceEngine';
import { boutonCoc, champCoc } from './CartesCoc';

interface Props { regle: RegleDeCoc; valeurs: Record<string, unknown>; ecrire: (maj: Record<string, unknown>) => void; consigner: (texte: string) => void; joueur?: boolean }
const noms: Record<DestinationCoc, string> = { initiative: 'Initiative actuelle', defense: 'DEF pour une attaque', 'dm-infliges': 'DM infligés après le jet', 'dm-subis': 'Une source de DM subis', mouvement: 'Action de mouvement', legende: 'Légende' };
export function HeroismeCoc({ regle, valeurs, ecrire, consigner }: Props) {
    const [destination, setDestination] = useState<DestinationCoc>('defense'), [cout, setCout] = useState(1), [message, setMessage] = useState('');
    const [id, setId] = useState(() => crypto.randomUUID()), confirme = useRef(false);
    const evolution = regle.evolution!, echelons = Number(valeurs[evolution.champ]) || 0;
    const prep = preparerAvantageCoc(valeurs[evolution.modele ?? ''], echelons, destination, cout, regle.des), suivi = lireAvantagesCoc(valeurs);
    const achete = suivi.recus.includes(id);
    const nouveau = () => { setId(crypto.randomUUID()); confirme.current = false; setMessage(''); };
    const avancer = (evenement: Parameters<typeof avancerAvantagesCoc>[1]) => {
        ecrire({ [CLE_AVANTAGES_COC]: avancerAvantagesCoc(valeurs, evenement, crypto.randomUUID()) }); consigner(`Héros : ${evenement} confirmé.`);
    };
    return <details className="border border-app-border rounded-xl p-3 text-xs" data-heroisme-coc>
        <summary className="font-bold">Héroïsme hors du test</summary><div className="flex flex-col gap-3 pt-3">
            <p>Échelle d’évolution : {String(valeurs[evolution.modele ?? ''] ?? 'non choisie')}, <strong>{echelons}/20</strong>. Livre p. 81–82.</p>
            <label>Destination <select aria-label="Destination du bonus héroïque" className={champCoc} value={destination} onChange={e => { setDestination(e.target.value as DestinationCoc); nouveau(); }}>{Object.entries(noms).map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}</select></label>
            <label>Coût <select aria-label="Échelons dépensés" className={champCoc} value={cout} onChange={e => { setCout(Number(e.target.value)); nouveau(); }}><option value={1}>1 échelon</option><option value={2}>2 échelons : bonus doublé</option></select></label>
            {achete ? <p data-apercu-heroisme>Avantage confirmé ; {echelons} échelons restants. Le test déjà lancé reste inchangé.</p> : 'refus' in prep ? <p>{prep.refus}</p> : <p data-apercu-heroisme>{noms[destination]} : {prep.bonus ? `+${prep.bonus}` : 'une action'}, coût {cout}, reste {prep.apres}. Expiration : {prep.expiration}. Le test déjà lancé reste inchangé.</p>}
            <button className={boutonCoc} disabled={'refus' in prep || achete} onClick={() => {
                if (confirme.current) return;
                const r = acheterAvantageCoc(valeurs, evolution.champ, evolution.modele, destination, cout, id, regle.des);
                if ('refus' in r) { setMessage(r.refus ?? 'Avantage refusé.'); return; }
                confirme.current = true; ecrire(r.maj); consigner(r.texte); setMessage(r.texte);
            }}>{achete ? 'Avantage héroïque confirmé' : 'Confirmer l’avantage héroïque'}</button>
            <p>DEF : à consommer après l’attaque concernée. DM infligés : ajoutés au prochain transfert de DM. DM subis : retirés d’une source avant la RD, à la porte commune. Init. : le plateau est ajusté ; utiliser Trier si l’ordre doit changer, puis expiration au prochain Jet système.</p>
            <p>Mouvement : utilisable pendant votre tour ou celui d’un personnage qui agit après vous, durant ce round. Légende : tous les bonus et une action de mouvement et d’attaque, jusqu’au début de votre prochain tour ; protection contre une source de DM.</p>
            <div data-avantages-coc className="flex flex-col gap-2">{suivi.actifs.map(a => <div key={a.id} className="border-t border-app-border pt-2">
                <p>{noms[a.destination]} {a.bonus ? `+${a.bonus}` : ''} — {a.expiration}{a.destination === 'legende' ? ` ; mouvement ${a.mouvement}, attaque ${a.attaque}${a.protectionUtilisee ? ', protection consommée' : ''}` : ''}</p>
                {a.destination === 'defense' && <button className={boutonCoc} onClick={() => avancer('defense')}>Attaque terminée : consommer la DEF</button>}
                {a.mouvement > 0 && <button className={boutonCoc} onClick={() => avancer('mouvement')}>Consommer l’action de mouvement</button>}
                {a.attaque > 0 && <button className={boutonCoc} onClick={() => avancer('attaque')}>Consommer l’attaque supplémentaire</button>}
            </div>)}</div>
            <details><summary>Temps hors combat</summary><button className={boutonCoc} onClick={() => avancer('debut-tour')}>Début de mon prochain tour</button><button className={boutonCoc} onClick={() => avancer('round')}>Fin du round</button></details>
            {message && <p role="status">{message}</p>}
        </div>
    </details>;
}
export function CapacitesCoc({ regle, valeurs, choix, setChoix, champ }: Props & { choix: ChoixDeCoc; setChoix: (f: (c: ChoixDeCoc) => ChoixDeCoc) => void; champ?: string }) {
    const disponibles = capacitesDisponiblesCoc(regle, valeurs, champ);
    return <details className="border border-app-border rounded-xl p-3 text-xs" data-voies-coc>
        <summary className="font-bold">Capacités de Voies pour ce test</summary><div className="flex flex-col gap-3 pt-3">
            <p>Associer une référence officielle à la Voie dans le Formulaire, puis enregistrer ses rangs acquis. Seules les capacités acquises correspondant à la caractéristique ou à l’arme retenue sont proposées. Une case de rang seule n’ajoute rien.</p>
            {!disponibles.length && <p>Aucune capacité de ce premier ensemble pour le champ choisi. Références proposées : {Object.values(VOIES_COC).map(v => v.nom).join(', ')}.</p>}
            {disponibles.map(c => <label key={c.cle} className="flex items-start gap-2"><input type="checkbox" aria-label={c.nom} checked={choix.capacites?.includes(c.cle) ?? false} onChange={e => setChoix(a => ({ ...a, capacites: e.target.checked ? [...(a.capacites ?? []), c.cle] : a.capacites?.filter(id => id !== c.cle) }))} />
                <span><strong>{c.nom}</strong> — {c.voie}, rang {c.rang} (acquis {c.acquis}), p. {c.page}. {c.contexte}.<br />Aperçu : {c.deBonus ? 'un dé bonus' : `+${c.bonus}`} ; coût 0 échelon, durée : ce test. Cocher seulement si le contexte convient et si le bonus n’est pas déjà inclus dans la valeur saisie.</span>
            </label>)}
            <p>Le choix est effacé après le lancer. Les autres capacités, équipements de départ et augmentations permanentes de caractéristiques restent à appliquer à la création avec le livre.</p>
        </div>
    </details>;
}
export function PsychismeCoc({ regle, valeurs, ecrire, consigner, joueur }: Props) {
    const p = lirePsychismeCoc(valeurs), [evenement, setEvenement] = useState(''), [rang, setRang] = useState(1), [autre, setAutre] = useState(0);
    const [tirage, setTirage] = useState<ReturnType<typeof lancerChocCoc>>(), [nature, setNature] = useState<ChocCoc>('Brisé');
    const [duree, setDuree] = useState(1), [fuiteImpossible, setFuiteImpossible] = useState(false), [bonusPhysique, setBonusPhysique] = useState(3);
    const [capacites, setCapacites] = useState<string[]>([]), [id, setId] = useState(() => crypto.randomUUID()), [message, setMessage] = useState('');
    const ferme = p.recus.includes(id), verrou = useRef(false), params = parametresChocCoc(rang, regle.des);
    const echec = tirage?.jet.coc.bilan === 'echec' || tirage?.jet.coc.bilan === 'echec-critique';
    const enregistrer = (maj: Partial<typeof p>, texte: string) => { ecrire({ [CLE_PSYCHISME_COC]: { ...p, ...maj } }); consigner(texte); setMessage(texte); };
    if (joueur) return <details className="border border-app-border rounded-xl p-3 text-xs" data-psychisme-coc><summary>Santé psychique</summary><p>Le meneur prépare et confirme les événements choquants et leurs suites.</p>{p.choc && <p>{p.choc.nature}, {p.choc.reste} rounds restants.</p>}{p.sequelles.map(s => <p key={s.id}>Séquelle : {s.nature}</p>)}</details>;
    return <details className="border border-app-border rounded-xl p-3 text-xs" data-psychisme-coc>
        <summary className="font-bold">Événement choquant et santé psychique</summary><div className="flex flex-col gap-3 pt-3">
            <p>VOL contre le rang de l’événement (table p. 77). Aucune seconde échelle : le modèle et les échelons Héros/Blues restent conservés.</p>
            <fieldset disabled={!!tirage} className="flex flex-wrap gap-3">
                <label>Événement <input aria-label="Événement choquant" className={champCoc} value={evenement} onChange={e => setEvenement(e.target.value)} /></label>
                <label>Rang <select aria-label="Rang de l’événement" className={champCoc} value={rang} onChange={e => setRang(Number(e.target.value))}>{[1, 2, 3].map(n => <option key={n}>{n}</option>)}</select></label>
                <label>Accoutumance ou autre bonus <input aria-label="Bonus au test de choc" className={champCoc} type="number" value={autre} onChange={e => setAutre(Number(e.target.value))} /></label>
                {capacitesDisponiblesCoc(regle, valeurs, regle.volonte).map(c => <label key={c.cle}><input type="checkbox" aria-label={`Choc : ${c.nom}`} checked={capacites.includes(c.cle)} onChange={e => setCapacites(a => e.target.checked ? [...a, c.cle] : a.filter(id => id !== c.cle))} />{c.nom} +{c.bonus} si {c.contexte} (p. {c.page})</label>)}
            </fieldset>
            <p>VOL {params.difficulte}, échec critique jusqu’à {params.echecJusqua} ; durée d’un échec : {params.nombreD6}d6 rounds. Bonus issu du précédent critique : {p.bonusProchaineVol}.</p>
            <button className={boutonCoc} disabled={!evenement.trim() || !!tirage} onClick={() => {
                const t = lancerChocCoc(regle, valeurs, rang, autre, capacites, faces => DiceEngine.roll(faces)); setTirage(t);
                const r = t.jet.coc.bilan;
                if (r === 'echec' || r === 'echec-critique') {
                    const d4 = DiceEngine.roll(4), rounds = Array.from({ length: rang }, () => DiceEngine.roll(6)).reduce((a, b) => a + b, 0);
                    setNature(p.choc && p.choc.nature !== 'Ralenti' ? p.choc.nature : CHOCS_COC[d4 - 1]); setDuree((p.choc?.reste ?? 0) + rounds);
                }
            }}>Lancer VOL pour l’événement</button>
            {tirage && <p data-jet-choc-coc>{tirage.jet.totalDisplay}</p>}
            {echec && <fieldset disabled={ferme} className="flex flex-wrap gap-3">
                <label>Choc proposé (1d4 ou choix MJ) <select aria-label="Nature du choc" className={champCoc} value={nature} onChange={e => setNature(e.target.value as ChocCoc)}>{CHOCS_COC.map(c => <option key={c}>{c}</option>)}</select></label>
                <label>Durée finale à confirmer <input aria-label="Rounds de choc" className={champCoc} type="number" min={1} value={duree} onChange={e => setDuree(Number(e.target.value))} /></label>
                <p>Un nouveau choc prolonge l’existant ; aperçu : ancienne durée + nouveaux dés. Le MJ confirme la durée finale et peut modifier sa nature (p. 78).</p>
                {nature === 'Paniqué' && <label><input type="checkbox" checked={fuiteImpossible} onChange={e => setFuiteImpossible(e.target.checked)} />Fuite impossible : inconscience pendant le choc</label>}
                {nature === 'Enragé' && <label>Bonus physique Enragé <input aria-label="Bonus physique Enragé" type="number" className={champCoc} value={bonusPhysique} onChange={e => setBonusPhysique(Number(e.target.value))} />{regle.des === '3d6' ? '+3 conservé : le livre ne chiffre pas sa conversion 3d6 ; ajustable par le MJ.' : '+3, DEF −5 (p. 79).'}</label>}
            </fieldset>}
            <button className={boutonCoc} disabled={!tirage || ferme} onClick={() => {
                if (!tirage || verrou.current) return;
                const r = confirmerChocCoc(valeurs, evenement, rang, tirage.jet.coc.bilan, nature, duree, id, tirage.bonusConsomme, regle.des, fuiteImpossible, bonusPhysique);
                if ('refus' in r) { setMessage(r.refus); return; }
                verrou.current = true; ecrire({ [CLE_PSYCHISME_COC]: r.apres }); consigner(`${tirage.jet.totalDisplay}. ${r.texte}`); setMessage(r.texte);
            }}>{ferme ? 'Événement confirmé' : 'Confirmer les conséquences psychiques'}</button>
            <button className={boutonCoc} onClick={() => { setTirage(undefined); setId(crypto.randomUUID()); verrou.current = false; setMessage(''); }}>Préparer un nouvel événement</button>
            {p.choc && <div data-choc-actif-coc className="border-t border-app-border pt-2 flex flex-col gap-2">
                <p><strong>{p.choc.nature}</strong> — {p.choc.reste} rounds restants. {p.choc.nature === 'Tétanisé' ? 'Immobilisé : aucune action physique ; attaques au contact ou à bout portant critiques automatiques à arbitrer, sinon DEF −5 (−3 au 3d6).' : p.choc.nature === 'Enragé' ? `Actions physiques +${p.choc.bonusPhysique}, DEF −${regle.des === '3d6' ? 3 : 5}. Rage à interpréter.` : p.choc.nature === 'Ralenti' ? 'Calmant : Ralenti, Init/DEF/attaques −5 au d20 (−3 au 3d6), mouvement 5 m ou une seule action par round.' : p.choc.nature === 'Paniqué' ? 'Fuite vers un lieu sûr ; si impossible, inconscience (vulnérabilité à arbitrer comme Immobilisé).' : 'Crise erratique à interpréter ; aucun malus chiffré inventé.'}</p>
                {p.choc.nature === 'Paniqué' && <label><input type="checkbox" aria-label="Fuite désormais impossible" checked={p.choc.fuiteImpossible} onChange={e => enregistrer({ choc: { ...p.choc!, fuiteImpossible: e.target.checked } }, 'Possibilité de fuite du personnage paniqué mise à jour.')} />Fuite désormais impossible</label>}
                <button className={boutonCoc} onClick={() => enregistrer(avancerPsychismeCoc(valeurs, crypto.randomUUID()), 'Un round de choc écoulé confirmé.')}>Hors combat : un round de choc écoulé</button>
                <button className={boutonCoc} onClick={() => enregistrer({ choc: undefined }, 'Fin du choc confirmée : VOL réussie après un round en lieu sûr, ou opposition CHA contre VOL remportée après un round de dialogue (p. 78).')}>Confirmer l’abrègement réussi du choc</button>
                <button className={boutonCoc} onClick={() => enregistrer({ choc: { ...p.choc!, nature: 'Ralenti' } }, 'Calmant administré : Ralenti pendant la durée restante (p. 79).')}>Confirmer un calmant administré</button>
            </div>}
            {p.demandes.map(d => <ChoisirSequelleCoc key={d.id} demande={d} p={p} enregistrer={enregistrer} />)}
            {p.sequelles.map(s => <p key={s.id}>Séquelle : {s.nature}, rang {s.rang} — {s.latente ? 'symptômes différés' : 'symptômes présents'}, {s.evenement} (p. 79–80). Thérapie : trois VOL réussies, au plus une par trimestre ; suivi à la table.</p>)}
            {message && <p role="status">{message}</p>}
        </div>
    </details>;
}
function ChoisirSequelleCoc({ demande, p, enregistrer }: { demande: ReturnType<typeof lirePsychismeCoc>['demandes'][number]; p: ReturnType<typeof lirePsychismeCoc>; enregistrer: (maj: Partial<typeof p>, texte: string) => void }) {
    const [nature, setNature] = useState<string>(''), [latente, setLatente] = useState(false);
    return <div data-sequelle-coc className="flex flex-wrap gap-2"><p>Échec critique : séquelle proposée pour {demande.evenement}, à choisir par le MJ (p. 80).</p>
        <select aria-label="Séquelle psychique" className={champCoc} value={nature} onChange={e => setNature(e.target.value)}><option value="">Choisir</option>{SEQUELLES_COC.map(s => <option key={s}>{s}</option>)}</select>
        <button className={boutonCoc} onClick={() => setNature(SEQUELLES_COC[DiceEngine.roll(4) - 1])}>Proposer 1d4 séquelle</button>
        <label><input type="checkbox" checked={latente} onChange={e => setLatente(e.target.checked)} />Symptômes différés</label>
        <button className={boutonCoc} disabled={!nature} onClick={() => enregistrer({ demandes: p.demandes.filter(d => d.id !== demande.id), sequelles: [...p.sequelles, { ...demande, nature, latente }] }, `Séquelle ${nature} confirmée par le meneur : ${demande.evenement}.`)}>Confirmer la séquelle</button>
    </div>;
}
