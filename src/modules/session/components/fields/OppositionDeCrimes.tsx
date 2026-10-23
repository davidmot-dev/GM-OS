import React, { useState } from 'react';
import { resoudreLOpposition } from '../../../dice/systemes/potentielGarde';

/**
 * **Le test en opposition** — Crimes, C1 (2026-10-23), livre p. 385. Sous le
 * résultat d'un jet gardé : l'adversaire a fait son propre test ; on saisit ses
 * réussites et ses 1 gardés, le panneau dit qui l'emporte et de combien. Rien ne
 * s'écrit : la marge sert au récit (l'attaque a son propre calcul, C6).
 */
const champ = 'w-12 bg-app-bg/60 border border-app-border/40 rounded-md px-1 py-0.5 font-mono';

const OppositionDeCrimes: React.FC<{ reussites: number; uns: number }> = ({ reussites, uns }) => {
    const [adverses, setAdverses] = useState('');
    const [unsAdverses, setUnsAdverses] = useState('0');
    const [ajouterLesUns, setAjouterLesUns] = useState(true);
    const n = (t: string) => Math.max(0, Math.floor(Number(t) || 0));
    const issue = adverses.trim() === '' ? null : resoudreLOpposition({ reussites, uns }, { reussites: n(adverses), uns: n(unsAdverses) }, ajouterLesUns);
    const critique = uns > reussites || n(unsAdverses) > n(adverses);

    return (
        <div className="flex flex-wrap items-center gap-2 text-xs" data-opposition>
            <span className="font-black uppercase tracking-widest text-ui-9 text-app-text/60">Opposition</span>
            <label className="flex items-center gap-1">réussites adverses
                <input type="number" min={0} value={adverses} onChange={e => setAdverses(e.target.value)} className={champ} data-reussites-adverses />
            </label>
            <label className="flex items-center gap-1">1 gardés
                <input type="number" min={0} value={unsAdverses} onChange={e => setUnsAdverses(e.target.value)} className={champ} data-uns-adverses />
            </label>
            {critique && (
                <label className="flex items-center gap-1" title="« On peut même ajouter le nombre de 1 au nombre de succès de l'adversaire » (p. 385)">
                    <input type="checkbox" checked={ajouterLesUns} onChange={e => setAjouterLesUns(e.target.checked)} />
                    1 de l'échec critique comptés à l'autre
                </label>
            )}
            {issue && (
                <strong className={issue.issue === 'gagne' ? 'text-etat-succes' : issue.issue === 'perd' ? 'text-etat-danger' : 'text-app-text/70'} data-issue-de-l-opposition>
                    {issue.ligne}
                </strong>
            )}
        </div>
    );
};

export default OppositionDeCrimes;
