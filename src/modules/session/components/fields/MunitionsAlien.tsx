import { useState } from 'react';
import type { EquipementAlien } from '../../../dice/systemes/jetsAlien';
import type { CombatAlien } from '../../../dice/systemes/combatAlien';
const bouton = 'rounded border border-app-border px-2 py-1 text-xs disabled:opacity-40';
export default function MunitionsAlien({ arme, suivi, rapide, agir }: { arme: EquipementAlien; suivi: CombatAlien; rapide: boolean;
    agir: (action: 'initialiser' | 'reserve' | 'recharger', nombre: number, vide: boolean) => void }) {
    const [nombre, setNombre] = useState(0), [vide, setVide] = useState(false);
    const etat = suivi.armes[arme.id];
    return <section data-munitions-alien className="space-y-1 rounded-lg border border-app-border p-2 text-xs text-app-text">
        <p>{arme.nom} — {etat ? etat.vide ? 'Arme vide.' : 'Arme chargée.' : 'État du chargeur à confirmer.'} Réserve : {etat?.chargeurs ?? 0} chargeur(s) complet(s).</p>
        <label>Chargeurs complets réellement portés<input className="block w-full rounded border border-app-border bg-app-bg p-1" type="number" min="0" value={nombre} onChange={e => setNombre(Math.max(0, Math.trunc(Number(e.target.value) || 0)))} /></label>
        {!etat && <label><input type="checkbox" checked={vide} onChange={e => setVide(e.target.checked)} />Arme initialement vide</label>}
        <div className="flex flex-wrap gap-2"><button type="button" className={bouton} onClick={() => agir(etat ? 'reserve' : 'initialiser',nombre,vide)}>{etat ? 'Mettre à jour les chargeurs portés' : 'Confirmer l’état initial du chargeur'}</button>
            {!arme.proprietes?.unique && <button type="button" className={bouton} disabled={!etat?.vide || etat.chargeurs <= 0} onClick={() => agir('recharger',0,false)}>Recharger — action {rapide ? 'rapide' : 'lente'}</button>}
        </div>
        <p>Pas de comptage balle par balle. Un 1 de Stress vide l’arme après l’attaque ; une arme à tir unique est dépensée à chaque tir.</p>
    </section>;
}
