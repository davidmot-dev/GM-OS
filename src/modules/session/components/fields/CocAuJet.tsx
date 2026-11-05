import React from 'react';
import {
    DIFFICULTES_DE_COC, ETATS_PREJUDICIABLES, bonusDuHeros, nombreDeDesDeCoc,
    type ChoixDeCoc, type IdDEtat, type JetDeCoc, type PreparationDeCoc,
} from '../../../dice/systemes/coc';

/**
 * **Le test de Chroniques Oubliées Contemporain** — 31/10/2026, à la demande de David
 * (« finir le pilote », « tout, dans l'ordre »). Avant de lancer : la difficulté ou la DEF
 * de la cible, les conditions, les aides, le dé bonus ou malus, l'état préjudiciable, les
 * plages critiques, et prendre son temps. Après : l'échelle du héros et ce que dit le
 * critique. Rien ne s'écrit sans un clic.
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (texte: string) => { const x = Math.trunc(Number(texte)); return Number.isFinite(x) ? x : 0; };
const signe = (n: number) => (n < 0 ? `− ${-n}` : `+ ${n}`);

export const PreparationCoc: React.FC<{
    choix: ChoixDeCoc;
    setChoix: (maj: (c: ChoixDeCoc) => ChoixDeCoc) => void;
    prep: PreparationDeCoc;
    /** Le test touche-t-il une action physique, selon la caractéristique retenue ? */
    physiqueParDefaut: boolean;
    /** L'état de santé du personnage, quand il en a un : « Blessé (−5) ». */
    sante?: string;
    /** L'échelle d'évolution est celle du blues : son réglage s'offre. */
    blues: boolean;
    /** Le test vise une attaque : la difficulté est la DEF de la cible (p. 87). */
    attaque: boolean;
}> = ({ choix, setChoix, prep, physiqueParDefaut, sante, blues, attaque }) => {
    const { nombre, faces } = nombreDeDesDeCoc(prep.solde, prep.des);
    const de = prep.des === 'd20'
        ? (prep.solde > 0 ? '2d20, le meilleur' : prep.solde < 0 ? '2d20, le pire' : '1d20')
        : (prep.solde > 0 ? '4d6, les trois meilleurs' : `${nombre}d${faces}`);
    const physique = choix.physique ?? physiqueParDefaut;
    return (
        <div data-preparation-coc className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1"><span className={etiquette}>{attaque ? 'DEF de la cible' : 'Difficulté'}</span>
                    <input aria-label="Difficulté" type="number" value={choix.difficulte} className={`w-14 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, difficulte: entier(e.target.value) }))} />
                </label>
                <div className="flex flex-wrap gap-1" role="group" aria-label="Table des difficultés">
                    {DIFFICULTES_DE_COC[prep.des].map(d => (
                        <button key={d.valeur} type="button" className={`${bouton} ${choix.difficulte === d.valeur ? 'border-accent text-accent' : ''}`}
                            title={`${d.label} (p. 58)`} onClick={() => setChoix(c => ({ ...c, difficulte: d.valeur }))}>
                            {d.label} {d.valeur}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1"
                    title="Favorables moins défavorables : elles se compensent ; une qui reste vaut ±2, deux ±5, trois et plus ±10 (p. 87-88).">
                    Conditions
                    <input aria-label="Conditions favorables moins défavorables" type="number" value={choix.conditions} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, conditions: entier(e.target.value) }))} />
                </label>
                <label className="flex items-center gap-1" title="Chaque allié qui aide donne +2 (p. 61).">
                    Aides
                    <input aria-label="Aides" type="number" min={0} value={choix.aides} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, aides: Math.max(0, entier(e.target.value)) }))} />
                </label>
                <label className="flex items-center gap-1" title="Rang de voie, sentiment de l'interlocuteur, approche, avantage…">
                    Autre
                    <input aria-label="Autre modificateur" type="number" value={choix.autre} className={`w-14 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, autre: entier(e.target.value) }))} />
                </label>
                <label className="flex items-center gap-1" title="Le pire état qui touche ce test : ils ne se cumulent pas (p. 63-65).">
                    État
                    <select aria-label="État préjudiciable" value={choix.etat} className={champ}
                        onChange={e => setChoix(c => ({ ...c, etat: e.target.value as IdDEtat }))}>
                        <option value="">Aucun</option>
                        {ETATS_PREJUDICIABLES.map(e => <option key={e.id} value={e.id}>{e.label} (−{e.malus} sur {e.sur})</option>)}
                    </select>
                </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1" title="Deux d20, le meilleur (p. 59). Ne se cumulent pas ; un bonus et un malus s'annulent.">
                    Dés bonus
                    <input aria-label="Dés bonus" type="number" min={0} value={choix.bonus} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, bonus: Math.max(0, entier(e.target.value)) }))} />
                </label>
                <label className="flex items-center gap-1" title="Deux d20, le pire (p. 59).">
                    Dés malus
                    <input aria-label="Dés malus" type="number" min={0} value={choix.malus} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, malus: Math.max(0, entier(e.target.value)) }))} />
                </label>
                <label className="flex items-center gap-1" title="Cibler un organe vital, un fusil de précision, Fin bretteur : 18 à 20 (p. 30, 90, 94).">
                    Critique dès
                    <input aria-label="Réussite critique dès" disabled={prep.critiquesInterdits} type="number" value={prep.critiqueDes} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, critiqueDes: entier(e.target.value) }))} />
                </label>
                <label className="flex items-center gap-1" title="Un événement traumatisant de rang 2 : 1 à 3 ; de rang 3 : 1 à 6 (p. 77).">
                    Échec critique jusqu’à
                    <input aria-label="Échec critique jusqu'à" type="number" value={prep.echecJusqua} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, echecJusqua: entier(e.target.value) }))} />
                </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                {sante && (
                    <label className="flex items-center gap-1" title="L'état de santé pèse sur les actions physiques, l'Init. et la DEF (p. 71).">
                        <input type="checkbox" checked={physique} onChange={e => setChoix(c => ({ ...c, physique: e.target.checked }))} />
                        Action physique ({sante})
                    </label>
                )}
                {blues && (
                    <label className="flex items-center gap-1" title="+ aux tests de VOL et de coercition, − aux autres interactions et à la PER qui lit les émotions (p. 84).">
                        Blues
                        <select aria-label="Le blues joue" value={choix.blues ?? ''} className={champ}
                            onChange={e => setChoix(c => ({ ...c, blues: (e.target.value || undefined) as ChoixDeCoc['blues'] }))}>
                            <option value="">Selon la caractéristique</option>
                            <option value="plus">VOL ou coercition (+)</option>
                            <option value="moins">Autre interaction, émotions (−)</option>
                            <option value="aucun">Ne joue pas</option>
                        </select>
                    </label>
                )}
                <label className="flex items-center gap-1" title="Hors du feu de l'action : 10 au lieu du dé, sans critique (p. 59).">
                    <input type="radio" name="facon-coc" checked={choix.facon === 'temps'}
                        onChange={() => setChoix(c => ({ ...c, facon: 'temps' }))} />
                    Prendre son temps
                </label>
                <label className="flex items-center gap-1" title="Règle optionnelle : si le total atteint la difficulté, réussite sans lancer, ni critique ni échec critique (p. 59).">
                    <input type="radio" name="facon-coc" checked={choix.facon === 'rapide'}
                        onChange={() => setChoix(c => ({ ...c, facon: 'rapide' }))} />
                    Rapide et furieux
                </label>
                {choix.facon !== 'lancer' && (
                    <button type="button" className={bouton} onClick={() => setChoix(c => ({ ...c, facon: 'lancer' }))}>Lancer le dé</button>
                )}
            </div>
            <span data-composition-coc className="text-app-text/60">
                {choix.facon === 'temps' ? '10' : choix.facon === 'rapide' && prep.total >= prep.difficulte ? 'Sans dé' : de}
                {' '}{signe(prep.base)}{prep.modificateurs.map(m => ` ${signe(m.valeur)} (${m.label})`).join('')} = {signe(prep.total)} au dé,
                {' '}contre {prep.difficulte}. {prep.critiquesInterdits ? 'Aucune réussite critique pour ce rôle' : `Réussite critique ${prep.critiqueDes < (prep.des === 'd20' ? 20 : 18) ? `de ${prep.critiqueDes} à` : 'sur'} ${prep.des === 'd20' ? 20 : 18}`},
                {' '}échec critique {prep.echecJusqua > (prep.des === 'd20' ? 1 : 3) ? `de ${prep.des === 'd20' ? 1 : 3} à ${prep.echecJusqua}` : `sur ${prep.echecJusqua}`} (p. 58).
            </span>
            {prep.blocage && <p role="status" className="text-accent">{prep.blocage}</p>}
        </div>
    );
};

export const SuitesCoc: React.FC<{
    legendeDediee?: boolean;
    jet: JetDeCoc;
    /** Les échelons de l'échelle du héros ; `undefined` : pas d'échelle du héros, ou pas de fiche à écrire. */
    heros?: number;
    des: PreparationDeCoc['des'];
    /** Le test vise une attaque : le critique ajoute le bonus critique de l'arme (p. 88). */
    attaque: boolean;
    /** L'échelon de héros gagné sur un critique est-il déjà noté ? */
    echelonGagne: boolean;
    depenser: (echelons: number, bonus: number) => void;
    gagner: () => void;
}> = ({ jet, heros, des, attaque, echelonGagne, depenser, gagner, legendeDediee }) => {
    const c = jet.coc;
    const critique = c.bilan === 'reussite-critique', echecCritique = c.bilan === 'echec-critique';
    return (
        <div data-suites-coc className="flex w-full flex-col gap-2 text-xs">
            {critique && (
                <p className="text-app-text/70">
                    {attaque
                        ? 'Réussite critique : le bonus critique de l’arme — le maximum de ses DM, sans la FOR — s’ajoute aux DM (p. 88).'
                        : 'Réussite critique : l’action dépasse toutes les attentes ; à défaut d’effet prévu, le MJ et le joueur imaginent un exploit (p. 58).'}
                </p>
            )}
            {echecCritique && (
                <p className="text-app-text/70">
                    {attaque
                        ? 'Échec critique : au choix du MJ, l’attaquant blesse un allié ou lui-même, fait tomber son arme, ou elle s’enraye (p. 87).'
                        : 'Échec critique : l’action tourne au désastre ; le MJ en décide, éventuellement avec le joueur (p. 58).'}
                </p>
            )}
            {c.facon === 'lancer' && c.marge >= 0 && !critique && (
                <p className="text-app-text/50">Marge {c.marge} : une recherche à plusieurs seuils révèle les indices dont la difficulté est atteinte (p. 68).</p>
            )}
            {heros !== undefined && (c.facon === 'lancer' || c.facon === 'temps') && (
                <div className="flex flex-wrap items-center gap-2" data-heros-coc>
                    <span className="text-app-text/60">Échelle du héros ({heros} échelon{heros > 1 ? 's' : ''}) :</span>
                    {bonusDuHeros(heros, des).filter(o => !legendeDediee || o.label !== 'Légende').map(o => (
                        <button key={`${o.label}-${o.echelons}`} type="button" className={bouton} disabled={heros < o.echelons}
                            title={`${o.label} : +${o.bonus} au test qu'il vient d'effectuer, en régressant de ${o.echelons} échelon${o.echelons > 1 ? 's' : ''} (p. 81-82).`}
                            onClick={() => depenser(o.echelons, o.bonus)}>
                            +{o.bonus} ({o.echelons} échelon{o.echelons > 1 ? 's' : ''})
                        </button>
                    ))}
                    {(critique || echecCritique) && (
                        <button type="button" className={bouton} disabled={echelonGagne}
                            title="Un test qui se solde par une réussite ou un échec critique fait progresser le héros d'un échelon (p. 81)."
                            onClick={gagner}>{echelonGagne ? 'Échelon gagné' : '+1 échelon (critique)'}</button>
                    )}
                </div>
            )}
        </div>
    );
};
