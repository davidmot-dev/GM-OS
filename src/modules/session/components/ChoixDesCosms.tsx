import React from 'react';
import type { CosmDuJeu } from '../../../types/drivers';

/**
 * **Choisir le cosm** — Torg, 2026-10-14. Un cosm, et un second pour une zone
 * mixte, où les Lois des deux s'appliquent. Sert à la scène (vide : celui de la
 * campagne) et à la campagne (vide : aucun).
 */
const ChoixDesCosms: React.FC<{
    cosms: readonly CosmDuJeu[];
    choisis: readonly string[];
    onChange: (ids: string[]) => void;
    /** Ce que veut dire « rien de choisi » ici. */
    libelleVide: string;
}> = ({ cosms, choisis, onChange, libelleVide }) => {
    const [premier = '', second = ''] = choisis;
    const classe = 'bg-app-bg/40 px-3 py-2 rounded-xl border border-app-border/20 text-xs focus:border-accent/50 outline-none cursor-pointer';
    return (
        <div className="flex flex-wrap items-center gap-2" data-choix-des-cosms>
            <select
                aria-label="Cosm"
                value={premier}
                onChange={e => onChange(e.target.value ? [e.target.value, ...(second && second !== e.target.value ? [second] : [])] : [])}
                className={classe}
            >
                <option value="">{libelleVide}</option>
                {cosms.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            {premier && (
                <select
                    aria-label="Zone mixte avec"
                    value={second}
                    onChange={e => onChange(e.target.value ? [premier, e.target.value] : [premier])}
                    className={classe}
                >
                    <option value="">— zone pure —</option>
                    {cosms.filter(c => c.id !== premier).map(c => <option key={c.id} value={c.id}>zone mixte avec {c.nom}</option>)}
                </select>
            )}
        </div>
    );
};

export default ChoixDesCosms;
