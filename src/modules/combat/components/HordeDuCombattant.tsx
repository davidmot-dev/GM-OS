import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { gmToast } from '../../../stores/useToastStore';
import { bonusDesActionsCombinees, coupSurLaHorde, nouvelleHorde, prochainKO, type Horde } from '../logic/sbiresEtHordes';

/**
 * **La horde** — Torg, règle optionnelle (livre p. 264), 2026-10-14. Un combattant
 * qui en représente plusieurs : leur Choc est commun, ils tombent un par un, et
 * ils attaquent ensemble avec le bonus des Actions combinées (p. 119).
 *
 * Sur la carte d'un adversaire : « En horde… » la forme (membres, Esprit et
 * Résistance d'un membre, lus sur sa fiche quand il en a une) ; ensuite, les
 * coups se portent ici, en dommages, contre la Résistance d'un membre.
 *
 * La capacité spéciale « Horde » (2026-10-16) se coche : le bonus compte alors
 * aux dommages comme à l'attaque — une seule attaque collective, p. 119.
 */
const HordeDuCombattant: React.FC<{
    horde: Horde | undefined;
    /** Ce que la fiche du combattant dit d'un membre, pour préremplir. */
    espritParDefaut: number;
    resistanceParDefaut: number;
    onChange: (horde: Horde | undefined) => void;
}> = ({ horde, espritParDefaut, resistanceParDefaut, onChange }) => {
    const [ouvert, setOuvert] = useState(false);
    const [membres, setMembres] = useState(6);
    const [esprit, setEsprit] = useState(espritParDefaut);
    const [resistance, setResistance] = useState(resistanceParDefaut);
    const [degats, setDegats] = useState(10);
    const [assaillants, setAssaillants] = useState(4);

    const champ = 'w-14 bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-accent/50';
    const bouton = 'px-3 py-1 rounded-lg border border-app-border/40 text-ui-10 font-bold hover:border-accent/40 transition-colors';

    if (!horde) {
        return ouvert ? (
            <div data-horde-a-former className="flex flex-wrap items-center gap-2 rounded-xl border border-app-border/30 p-2 text-ui-10">
                <label className="flex items-center gap-1">Membres <input type="number" min={2} value={membres} onChange={e => setMembres(Number(e.target.value) || 2)} className={champ} /></label>
                <label className="flex items-center gap-1">Esprit <input type="number" min={0} value={esprit} onChange={e => setEsprit(Number(e.target.value) || 0)} className={champ} /></label>
                <label className="flex items-center gap-1">Résistance <input type="number" min={0} value={resistance} onChange={e => setResistance(Number(e.target.value) || 0)} className={champ} /></label>
                <button type="button" className={bouton} onClick={() => { onChange(nouvelleHorde(membres, esprit, resistance)); setOuvert(false); }}>Former la horde</button>
                <button type="button" className={bouton} onClick={() => setOuvert(false)}>Annuler</button>
            </div>
        ) : (
            <button type="button" className={`${bouton} self-start`} onClick={() => setOuvert(true)}
                title="Plusieurs sbires identiques sur une seule carte, au Choc commun (règle optionnelle des hordes)">
                <Users size={12} className="inline mr-1" />En horde…
            </button>
        );
    }

    const engages = Math.min(assaillants, horde.debout);
    const frapper = () => {
        const coup = coupSurLaHorde(horde, degats);
        onChange(coup.horde);
        gmToast(`Horde — ${coup.texte}`, 'info');
    };

    return (
        <div data-horde className="space-y-2 rounded-xl border border-etat-danger/30 bg-etat-danger/5 p-2 text-ui-11">
            <p className="flex flex-wrap items-center gap-2">
                <Users size={12} className="text-etat-danger" />
                <span className="font-black">Horde · {horde.debout}/{horde.membres} debout</span>
                <span className="text-app-text/60">Choc commun {horde.choc} — prochain KO à {prochainKO(horde)}</span>
                <span className="text-app-text/40">Esprit {horde.esprit}, Résistance {horde.resistance}</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">Dommages <input type="number" min={0} value={degats} onChange={e => setDegats(Number(e.target.value) || 0)} className={champ} /></label>
                <button type="button" className={bouton} disabled={horde.debout === 0} onClick={frapper}>Coup sur la horde</button>
                <label className="flex items-center gap-1" title="En mêlée, quatre au plus contre un même défenseur de taille humaine">
                    Assaillants <input type="number" min={1} max={horde.debout} value={engages} onChange={e => setAssaillants(Number(e.target.value) || 1)} className={champ} />
                </label>
                <span className="font-bold text-etat-danger" data-attaque-combinee>
                    {horde.capacite ? 'Attaque et dommages combinés' : 'Attaque combinée'} : +{bonusDesActionsCombinees(engages)}
                </span>
                <label className="flex items-center gap-1" title="Capacité spéciale « Horde » (infectés, daémons…) : le bonus des Actions combinées compte aussi aux dommages de l'attaque">
                    <input type="checkbox" checked={!!horde.capacite} onChange={e => onChange({ ...horde, capacite: e.target.checked })} />
                    Capacité Horde
                </label>
                <button type="button" className={`${bouton} ml-auto`} onClick={() => onChange(undefined)} title="Revenir à un combattant seul">Dissoudre</button>
            </div>
        </div>
    );
};

export default HordeDuCombattant;
