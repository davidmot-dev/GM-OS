import React from 'react';
import { Plus, X } from 'lucide-react';
import type { StyleDEnquete } from '../../../types/drivers';

type Ligne = { style: string; points: number };

/**
 * **Les seuils et les gains d'un indice** — Crimes, C5 (2026-10-22), livre p. 440.
 *
 * « Limier (3) et Fouineur (4) pour la découvrir » : les **seuils** disent à
 * partir de combien de points, dans quel style, un enquêteur peut obtenir
 * l'indice — un seul suffit. Les **gains** sont ce qu'il rapporte à celui qui
 * l'obtient. Un indice sans seuil est évident : il se révèle comme avant.
 */
const SeuilsDEnqueteDeLIndice: React.FC<{
    styles: StyleDEnquete[];
    seuils: Ligne[];
    gains: Ligne[];
    onChange: (seuils: Ligne[], gains: Ligne[]) => void;
}> = ({ styles, seuils, gains, onChange }) => {
    const liste = (titre: string, lignes: Ligne[], autre: Ligne[], estSeuil: boolean, aide: string) => {
        const changer = (suivantes: Ligne[]) => (estSeuil ? onChange(suivantes, autre) : onChange(autre, suivantes));
        return (
            <div className="space-y-2" data-enquete-de-l-indice={estSeuil ? 'seuils' : 'gains'}>
                <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/30 px-2" title={aide}>{titre}</p>
                {lignes.map((l, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <select value={l.style} aria-label={`${titre} — style`}
                            onChange={e => changer(lignes.map((x, j) => (j === i ? { ...x, style: e.target.value } : x)))}
                            className="flex-1 bg-app-bg/40 border border-app-text/5 rounded-xl py-2 px-3 text-xs font-bold text-app-text/70 outline-none focus:border-gm-gold/40">
                            {styles.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <input type="number" min={estSeuil ? 1 : -3} max={20} value={l.points} aria-label={`${titre} — points`}
                            onChange={e => changer(lignes.map((x, j) => (j === i ? { ...x, points: Number(e.target.value) || 0 } : x)))}
                            className="w-16 bg-app-bg/40 border border-app-text/5 rounded-xl py-2 px-2 text-xs font-mono font-bold text-app-text outline-none focus:border-gm-gold/40" />
                        <button type="button" aria-label={`Retirer cette ligne : ${titre}`} onClick={() => changer(lignes.filter((_, j) => j !== i))}
                            className="p-2 text-app-text/30 hover:text-etat-danger"><X size={12} /></button>
                    </div>
                ))}
                <button type="button" onClick={() => changer([...lignes, { style: styles[0]?.id ?? '', points: estSeuil ? 3 : 1 }])}
                    className="flex items-center gap-1 px-3 py-1 text-ui-9 font-black uppercase tracking-widest text-gm-gold/70 hover:text-gm-gold">
                    <Plus size={11} /> {estSeuil ? 'Un seuil' : 'Un gain'}
                </button>
            </div>
        );
    };
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-app-bg/20 rounded-2xl border border-app-text/5" data-enquete-de-l-indice-editeur>
            {liste('Pour le découvrir', seuils, gains, true, 'À partir de combien de points d’enquête, dans quel style : un seul seuil suffit (p. 440)')}
            {liste('Ce qu’il rapporte', gains, seuils, false, 'Les points d’enquête qu’il donne à qui l’obtient, dans les styles qu’il possède (p. 436)')}
        </div>
    );
};

export default SeuilsDEnqueteDeLIndice;
