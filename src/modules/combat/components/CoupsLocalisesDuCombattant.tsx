import React, { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { localisationDuCoup } from '../../dice/systemes/runequest';
import { etatDuTotal, zonesDuCombattant, type ZoneDuCombattant } from '../logic/coupsDeRuneQuest';
import { porterUnCoupLocalise } from '../coupsLocalises';
import type { Combatant } from '../types';

/**
 * **Les coups localisés, sur la carte du combattant** — RuneQuest, 2026-10-30, à la
 * demande de David. Les sept zones avec leur armure et leurs points de vie restants ;
 * un coup reçu se localise au D20 ou d'un clic, et les dégâts saisis passent par
 * l'armure, la zone et le total (p. 146-148, `coupsDeRuneQuest.ts`).
 *
 * Le panneau parle du porteur de la carte : c'est lui qui encaisse. Les boutons
 * Dégâts / Soins du panneau de santé, eux, visent la cible — et ne localisent rien :
 * un poison ou une chute ne frappent que le total.
 */
const teinte = (z: ZoneDuCombattant) => z.pv > 0 && z.degats >= 2 * z.pv ? 'border-etat-danger bg-etat-danger/20 text-etat-danger'
    : z.pv > 0 && z.degats >= z.pv ? 'border-etat-danger/60 text-etat-danger'
    : z.degats > 0 ? 'border-etat-alerte/60 text-etat-alerte'
    : 'border-app-border/40 text-app-text/80';

const CoupsLocalisesDuCombattant: React.FC<{ combatant: Combatant; valeurs: Record<string, unknown> }> = ({ combatant, valeurs }) => {
    const regle = useSessionOSStore(s => s.getActiveDriver())?.combat?.coupsLocalises;
    const [choisie, setChoisie] = useState<string | null>(null);
    const [de, setDe] = useState<number | null>(null);
    const [points, setPoints] = useState('');
    if (!regle) return null;
    const zones = zonesDuCombattant(regle, valeurs);
    if (zones.length === 0) return null;
    const n = Math.max(0, Math.trunc(Number(points) || 0));
    const etat = typeof combatant.hp === 'number' ? etatDuTotal(combatant.hp) : undefined;

    const localiser = () => {
        const tire = DiceEngine.roll(20);
        setDe(tire);
        setChoisie(localisationDuCoup(tire).cle);
    };
    const porter = (soin: boolean) => {
        if (!choisie || n === 0) return;
        porterUnCoupLocalise(combatant, choisie, n, soin);
        setPoints('');
        setDe(null);
    };

    return (
        <div data-coups-localises className="mx-3 my-1 space-y-1.5 text-ui-10">
            <div className="flex items-center gap-2">
                <span className="stitch-label text-app-text">Coups localisés</span>
                {etat && <span data-etat-du-total className="font-bold text-etat-danger">{etat}</span>}
            </div>
            <div className="flex flex-wrap gap-1">
                {zones.map(z => (
                    <button key={z.cle} type="button" data-zone={z.cle} aria-pressed={choisie === z.cle}
                        onClick={() => { setChoisie(z.cle); setDe(null); }}
                        title={`${z.label} : ${z.degats} dégât${z.degats > 1 ? 's' : ''} reçu${z.degats > 1 ? 's' : ''}, armure ${z.armure}`}
                        className={`px-2 py-0.5 rounded-md border font-bold transition-colors ${teinte(z)} ${choisie === z.cle ? 'ring-2 ring-accent' : ''}`}>
                        {z.label} {z.pv - z.degats}/{z.pv}{z.armure > 0 ? ` · PA ${z.armure}` : ''}
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={localiser} title="1D20 sur la table des localisations (p. 146)."
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-app-border/50 font-bold hover:border-accent/50 hover:text-accent">
                    <Crosshair size={11} /> D20
                </button>
                {de !== null && <span data-d20-du-coup className="font-bold">{de} → {zones.find(z => z.cle === choisie)?.label ?? '—'}</span>}
                <input aria-label="Dégâts du coup" type="number" min={0} value={points} onChange={e => setPoints(e.target.value)}
                    placeholder="Dégâts" className="w-16 bg-app-bg/60 border border-app-border/40 rounded-md px-1.5 py-0.5 text-ui-10 font-bold" />
                <button type="button" disabled={!choisie || n === 0} onClick={() => porter(false)}
                    title="L'armure de la zone se retire ; un membre ne prend pas plus du double de ses PV en un coup (p. 148)."
                    className="px-2 py-0.5 rounded-md border border-etat-danger/50 font-bold text-etat-danger disabled:opacity-40">
                    Encaisser
                </button>
                <button type="button" disabled={!choisie || n === 0} onClick={() => porter(true)}
                    title="Rend des points à la zone et au total, jamais plus que la zone n'a perdu."
                    className="px-2 py-0.5 rounded-md border border-app-border/50 font-bold disabled:opacity-40">
                    Soigner
                </button>
            </div>
        </div>
    );
};

export default CoupsLocalisesDuCombattant;
