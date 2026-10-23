import React from 'react';
import { penaliteDAngoisse, type Circonstances } from '../../../dice/systemes/circonstancesDuSeuil';

/**
 * **Les circonstances qui déplacent le seuil** — Crimes, C0.1 (2026-10-23),
 * livre p. 389-390 et 412.
 *
 * Au tir, la distance, la mobilité et la taille de la cible ajoutent chacune
 * de −1 à +1 au seuil de chaque dé — « une crapule lointaine (+1) mais
 * immobile (−1) : seuil de 8 +1 −1 = 8 » (p. 390) — et l'angoisse du tireur
 * au-dessus de 3 le durcit d'un ou deux points (le livre note « −1 à −2 » :
 * une pénalité, donc un seuil plus haut). Pour toute autre action, un
 * réglage libre. À 3 d'angoisse et plus, le meneur peut imposer le seuil de
 * base, non modifiable « pour viser » (p. 412).
 */

const champ = 'bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50';
const etiquette = 'text-ui-9 font-black uppercase tracking-widest text-app-text/40';

const Choix: React.FC<{ label: string; valeur: number; options: [number, string][]; changer: (v: number) => void; data: string }> =
    ({ label, valeur, options, changer, data }) => (
        <label className="flex items-center gap-2">
            <span className={etiquette}>{label}</span>
            <select value={valeur} onChange={e => changer(Number(e.target.value))} className={champ} {...{ [`data-${data}`]: '' }}>
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
        </label>
    );

const CirconstancesDuSeuil: React.FC<{
    circonstances: Circonstances;
    changer: (c: Partial<Circonstances>) => void;
    /** Une arme à feu est choisie : les circonstances du tir paraissent. */
    tir: boolean;
    angoisse?: number;
    seuilImpose: boolean;
    imposer: (oui: boolean) => void;
}> = ({ circonstances: c, changer, tir, angoisse, seuilImpose, imposer }) => (
    <div data-circonstances-du-seuil className="flex flex-wrap items-center gap-3 basis-full">
        {tir && !seuilImpose && (
            <>
                <Choix label="Distance" valeur={c.distance} data="distance-du-tir" changer={v => changer({ distance: v })}
                    options={[[-1, 'Proche (−1)'], [0, 'Normale'], [1, 'Lointaine (+1)']]} />
                <Choix label="Cible" valeur={c.mobilite} data="mobilite" changer={v => changer({ mobilite: v })}
                    options={[[-1, 'Immobile (−1)'], [0, 'Normale'], [1, 'Mobile (+1)']]} />
                <Choix label="Taille" valeur={c.taille} data="taille" changer={v => changer({ taille: v })}
                    options={[[-1, 'Grande (−1)'], [0, 'Normale'], [1, 'Petite (+1)']]} />
                {(angoisse ?? 0) > 3 && (
                    <Choix label={`Angoisse ${angoisse}`} valeur={penaliteDAngoisse(c, angoisse)} data="angoisse-du-tireur"
                        changer={v => changer({ angoisse: v })} options={[[0, 'Sans effet'], [1, '+1'], [2, '+2']]} />
                )}
            </>
        )}
        {!seuilImpose && (
            <Choix label={tir ? 'Autre' : 'Circonstances'} valeur={c.autre} data="autre-circonstance" changer={v => changer({ autre: v })}
                options={[[-2, '−2 (facile)'], [-1, '−1'], [0, 'Aucune'], [1, '+1'], [2, '+2 (difficile)']]} />
        )}
        {(angoisse ?? 0) >= 3 && (
            <label className="flex items-center gap-2" title="Un personnage angoissé peine à se concentrer : pour viser, le meneur peut rendre le seuil de 9 non modifiable (p. 412)">
                <input type="checkbox" checked={seuilImpose} onChange={e => imposer(e.target.checked)} className="accent-current" data-seuil-impose />
                <span className={etiquette}>Seuil de 9 imposé (angoisse {angoisse})</span>
            </label>
        )}
    </div>
);

export default CirconstancesDuSeuil;
