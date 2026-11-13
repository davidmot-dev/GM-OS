import { useRef, useState } from 'react';
import type { Combatant } from '../types';
import { useCombatStore } from '../useCombatStore';
import { ecrireLaFicheDuCombattant, valeursDuCombattant } from '../ficheDesCombattants';
import { DiceEngine } from '../../dice/DiceEngine';
import { perteDeSAN, resoudreLetalite } from '../../dice/systemes/deltaGreenSuites';
import { consignerLeJet } from '../../journal/consignerLeJet';
import { HealthInterpreter } from '../../session/logic/HealthInterpreter';
import type { RegleDeDeltaGreen } from '../../dice/systemes/deltaGreen';

function poserPV(cible: Combatant, champ: string, pv: number): void {
    ecrireLaFicheDuCombattant(cible, { [champ]: pv });
    const sante = { ...(cible.healthSystem ?? HealthInterpreter.createDefault('hp')), data: { ...(cible.healthSystem?.data ?? {}), current: pv, max: cible.hpMax ?? Math.max(1, pv), inconscienceA: 2 } };
    useCombatStore.getState().updateCombatant(cible.id, { hp: pv, healthSystem: HealthInterpreter.calculateNextState(sante, { value: 0 }) });
}

/** P. 44, 52, 57–60 : les sept armes de la fiche, lues sur leur porteur. */
export default function DommagesDeltaGreen({ attaquant, regle }: { attaquant: Combatant; regle: RegleDeDeltaGreen }) {
    const combattants = useCombatStore(s => s.combatants);
    const [arme, setArme] = useState('1');
    const [cibleId, setCible] = useState(attaquant.targetId ?? '');
    const [critique, setCritique] = useState(false);
    const [humaine, setHumaine] = useState(false);
    const [couvert, setCouvert] = useState(false);
    const [protection, setProtection] = useState(0);
    const [confirme, setConfirme] = useState(false);
    const [fait, setFait] = useState(false);
    const verrou = useRef(false);
    const [texte, setTexte] = useState('');
    const [complication, setComplication] = useState('enrayee');
    const porteur = combattants.find(c => c.id === attaquant.id) ?? attaquant;
    const valeurs = valeursDuCombattant(porteur);
    const prefixe = `arme${arme}`;
    const nom = String(valeurs[prefixe] ?? '');
    const brutLetalite = String(valeurs[`${prefixe}_letalite`] ?? '').trim().replace(/\s*%$/, '').replace(',', '.');
    const letalite = brutLetalite ? Number(brutLetalite) : 0;
    const degats = String(valeurs[`${prefixe}_degats`] ?? '');
    const cible = combattants.find(c => c.id === cibleId);
    const classe = 'rounded border border-app-border bg-app-bg px-2 py-1 text-app-text';
    const noter = (ligne: string) => { setTexte(ligne); consignerLeJet({ titre: `${attaquant.name} · ${nom || 'combat'}`, totalDisplay: ligne }); };
    return <details className="border-t border-app-border pt-2 text-sm space-y-2" data-combat-delta-green>
        <summary className="cursor-pointer font-bold">Delta Green : arme, dégâts et complications</summary>
        <label className="flex flex-wrap gap-2">Arme <select className={classe} aria-label="Arme Delta Green" value={arme} onChange={e => setArme(e.target.value)}>
            {Array.from({ length: 7 }, (_, i) => String(i + 1)).map(i => <option key={i} value={i}>{String(valeurs[`arme${i}`] || `Arme ${i}`)}</option>)}
        </select></label>
        <p>{letalite > 0 ? `Létalité ${letalite} %` : `Dégâts ${degats || 'non renseignés'}`} · perforant {String(valeurs[`${prefixe}_perforant`] || '0')}</p>
        <label className="flex flex-wrap gap-2">Cible <select className={classe} aria-label="Cible Delta Green" value={cibleId} onChange={e => setCible(e.target.value)}>
            <option value="">Choisir une cible</option>{combattants.filter(c => c.id !== attaquant.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></label>
        <label className="flex gap-2"><input type="checkbox" checked={confirme} onChange={e => setConfirme(e.target.checked)} />Attaque réussie confirmée</label>
        <label className="flex gap-2"><input type="checkbox" checked={critique} onChange={e => setCritique(e.target.checked)} />Réussite critique : létalité et dégâts doublés</label>
        <label className="flex gap-2"><input type="checkbox" checked={humaine} onChange={e => setHumaine(e.target.checked)} />Cible humaine (les autres protections sont à arbitrer)</label>
        <label className="flex gap-2"><input type="checkbox" checked={couvert} onChange={e => setCouvert(e.target.checked)} />Couvert : aucun décès direct par létalité</label>
        <label className="flex flex-wrap gap-2">Protection totale après perforant <input className={classe} aria-label="Protection Delta Green" type="number" min="0" value={protection} onChange={e => setProtection(Math.max(0, Number(e.target.value) || 0))} /></label>
        <button type="button" className={classe} disabled={fait || !cible || !confirme || !humaine || !nom || Number(valeurs[`${prefixe}_enrayee`]) > 0} onClick={() => {
            if (verrou.current || !cible || !regle.sante) return;
            const actuelle = useCombatStore.getState().combatants.find(c => c.id === cibleId);
            const fiche = actuelle && valeursDuCombattant(actuelle);
            const pv = Number(fiche?.[regle.sante] ?? actuelle?.hp ?? actuelle?.healthSystem?.data.current);
            if (!actuelle || !Number.isFinite(pv) || actuelle.healthSystem && actuelle.healthSystem.type !== 'hp') { setTexte('La cible n’a pas de PV exploitables.'); return; }
            let dommages: number, tue = false, detail: string;
            if (!Number.isFinite(letalite) || letalite < 0 || letalite > 100) { setTexte('Létalité invalide : saisir un pourcentage de 0 à 100.'); return; }
            if (letalite > 0) {
                const de = DiceEngine.roll(100);
                const r = resoudreLetalite(letalite, de, critique)!;
                tue = r.tue && !couvert;
                dommages = Math.max(0, r.degats - protection);
                detail = `Létalité ${r.seuil} % : ${de === 100 ? '00' : de} → ${tue ? '0 PV' : `${r.degats} dégâts − ${protection} protection = ${dommages}`}`;
            } else {
                const jet = perteDeSAN(degats, 'normal', faces => DiceEngine.roll(faces));
                if (jet === null) { setTexte('Dégâts invalides : saisir un entier ou une formule comme 1D10+2.'); return; }
                dommages = Math.max(0, jet * (critique ? 2 : 1) - protection);
                detail = `${degats} = ${jet}${critique ? ' × 2' : ''} − ${protection} protection = ${dommages} dégâts`;
            }
            verrou.current = true; setFait(true);
            const apres = tue ? 0 : Math.max(0, pv - dommages);
            // Même porte pour PJ et Galerie ; le combattant autonome conserve aussi ses PV et son état.
            poserPV(actuelle, regle.sante, apres);
            useCombatStore.getState().noterUnCoup(actuelle.id, { value: pv - apres });
            noter(`${cible.name} : ${detail} ; PV ${pv} → ${apres}`);
        }}>Lancer et appliquer les dégâts</button>
        {fait && <button type="button" className={classe} onClick={() => { verrou.current = false; setFait(false); setConfirme(false); setTexte(''); }}>Nouvelle attaque</button>}
        <p className="text-app-text/70">Un jet par cible du rayon d’action. Armure, couvert et perforant : saisir leur protection finale (p. 59–60).</p>
        <label className="flex flex-wrap gap-2">Échec critique : choix de l’Officier Traitant <select aria-label="Complication Delta Green" className={classe} value={complication} onChange={e => setComplication(e.target.value)}>
            <option value="enrayee">Arme enrayée : 1D4 tours</option><option value="fatigue">Fatigue physique : −1D6 PV</option>
            <option value="emotion">Surcharge émotionnelle : −1D6 VOL</option><option value="distraction">Distraction : −20 % au prochain test</option>
            <option value="tombe">À terre / arme tombée : noter et arbitrer</option><option value="accident">Touche un ami, un passant ou soi-même : désigner la cible</option>
        </select></label>
        <button type="button" className={classe} disabled={fait || !nom} onClick={() => {
            if (verrou.current) return;
            const frais = useCombatStore.getState().combatants.find(c => c.id === attaquant.id);
            if (!frais) return;
            const fiche = valeursDuCombattant(frais);
            const maj: Record<string, unknown> = {};
            let dit: string;
            if (complication === 'enrayee') { const tours = DiceEngine.roll(4); maj[`${prefixe}_enrayee`] = tours; dit = `${nom} enrayée : ${tours} tour(s) pour la remettre en état`; }
            else if (complication === 'distraction') { maj.distraction_dg = true; dit = 'Distraction : −20 % au prochain test de l’Agent'; }
            else if (complication === 'fatigue' || complication === 'emotion') {
                const champ = complication === 'fatigue' ? regle.sante : 'VOL';
                if (!champ || !Number.isFinite(Number(fiche[champ]))) return;
                const cout = DiceEngine.roll(6); maj[champ] = Math.max(0, Number(fiche[champ]) - cout); dit = `${champ} : −${cout}`;
            } else dit = complication === 'tombe' ? 'À terre / arme tombée : un tour pour la ramasser ; à résoudre avec l’Officier Traitant' : 'Tir accidentel : choisir la victime et résoudre les dégâts avec l’Officier Traitant';
            verrou.current = true; setFait(true);
            maj.complication_dg = dit;
            ecrireLaFicheDuCombattant(frais, maj);
            if (regle.sante && typeof maj[regle.sante] === 'number') poserPV(useCombatStore.getState().combatants.find(c => c.id === attaquant.id) ?? frais, regle.sante, Number(maj[regle.sante]));
            noter(`Échec critique : ${dit}`);
        }}>Appliquer la complication choisie</button>
        {Number(valeurs[`${prefixe}_enrayee`]) > 0 && <button type="button" className={classe} onClick={() => ecrireLaFicheDuCombattant(porteur, { [`${prefixe}_enrayee`]: Math.max(0, Number(valeurs[`${prefixe}_enrayee`]) - 1) })}>Remise en état : passer un tour ({String(valeurs[`${prefixe}_enrayee`])} restant(s))</button>}
        {!!valeurs.complication_dg && <p>Complication : {String(valeurs.complication_dg)}</p>}
        {texte && <p role="status">{texte}</p>}
    </details>;
}
