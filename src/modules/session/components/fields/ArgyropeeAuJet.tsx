import React from 'react';
import {
    LIBELLES_D_ARGYROPEE, PANACHE_DE_LA_COLLATION, PANACHE_DU_REPAS, SEUIL_DE_LA_SILENCIADA, bilanDeLOpposition, bonusDesAidants,
    bonusDuMetierChoisi, coutDuSort, modificateurBorne, moyenneDesCompetences, obstacleALExuberance,
    paliersAtteignables, panacheEncorePossible, succesDOpposition,
    type ChoixDArgyropee, type JetDArgyropee, type MancheDOpposition, type MetierProposeDArgyropee,
} from '../../../dice/systemes/argyropee';

/**
 * **Le test d'Argyropée** — 08/11/2026, à la demande de David (« finir le pilote »).
 * Avant de lancer : le métier dont relève la compétence (choisi au jet, décision de
 * David), le modificateur du Conteur et l'entraide. Après : le Panache, dépensé sur le
 * dé déjà tiré, avec ce que chaque dépense achète. Rien ne s'écrit sans un clic.
 */
const bouton = 'px-2 py-0.5 rounded-md border border-app-border/40 text-ui-10 font-bold hover:border-accent/50 disabled:opacity-30';
const etiquette = 'font-black uppercase tracking-widest text-ui-9 text-app-text/60';
const champ = 'rounded-md border border-app-border/40 bg-app-bg px-2 py-0.5 font-mono text-xs';
const entier = (texte: string) => { const x = Math.trunc(Number(texte)); return Number.isFinite(x) ? x : 0; };

/** Une compétence que l'action complexe peut réunir à celle du jet. */
export interface CompetenceDArgyropee {
    id: string;
    label: string;
    valeur: number;
}

export const PreparationArgyropee: React.FC<{
    choix: ChoixDArgyropee;
    setChoix: (maj: (c: ChoixDArgyropee) => ChoixDArgyropee) => void;
    /** La somme des composantes retenues : la compétence. */
    seuil: number;
    metiers: readonly MetierProposeDArgyropee[];
    /** Les autres compétences de la fiche, pour l'action complexe (sans celle du jet). */
    competences: readonly CompetenceDArgyropee[];
    /** L'opposition en cours : succès des deux camps, ou rien. */
    opposition?: { joueur: number; adversaire: number } | null;
    /** La Faveur divine : prières restantes et total du jour ; absente si le pilote ne la nomme pas (p. 81). */
    faveur?: { restantes: number; total: number };
}> = ({ choix, setChoix, seuil, metiers, competences, opposition, faveur }) => {
    const metier = bonusDuMetierChoisi(metiers, choix.metier);
    const reunies = competences.filter(c => choix.complexe.includes(c.id));
    const competence = reunies.length ? moyenneDesCompetences([seuil, ...reunies.map(c => c.valeur)]) : seuil;
    const ajouts = competence + metier + modificateurBorne(choix.modificateur) + bonusDesAidants(choix.aidants);
    const basculer = (id: string) => setChoix(c => ({ ...c, complexe: c.complexe.includes(id) ? c.complexe.filter(x => x !== id) : [...c.complexe, id] }));
    return (
        <div data-preparation-argyropee className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1"
                    title="Le bonus du métier ne s'ajoute que si la compétence relève de ce métier ; sinon, aucun (p. 44).">
                    <span className={etiquette}>Métier</span>
                    <select aria-label="Métier" value={choix.metier} className={champ}
                        onChange={e => setChoix(c => ({ ...c, metier: entier(e.target.value) }))}>
                        <option value={-1}>Aucun (+0)</option>
                        {metiers.map(m => <option key={m.index} value={m.index}>{m.libelle} (+{m.bonus})</option>)}
                    </select>
                </label>
                <label className="flex items-center gap-1"
                    title="Malus ou bonus de situation, de −5 à +5 chacun ; ceux de plusieurs sources se cumulent en un modificateur global (p. 45).">
                    Modificateur
                    <input aria-label="Modificateur" type="number" value={choix.modificateur} className={`w-14 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, modificateur: modificateurBorne(entier(e.target.value)) }))} />
                </label>
                <label className="flex items-center gap-1"
                    title="Test en coopération : le plus qualifié lance, +1 par aidant ayant au moins 1 point dans la compétence, +5 au plus (p. 45).">
                    Aidants
                    <input aria-label="Aidants" type="number" min={0} max={5} value={choix.aidants} className={`w-12 ${champ}`}
                        onChange={e => setChoix(c => ({ ...c, aidants: bonusDesAidants(entier(e.target.value)) }))} />
                </label>
            </div>
            <details data-action-complexe className="rounded-md border border-app-border/30 px-2 py-1" open={reunies.length > 0}>
                <summary className="cursor-pointer select-none">
                    <span className={etiquette}>Action complexe</span>
                    {reunies.length > 0 && <span className="ml-2 text-app-text/60">moyenne {competence} (arrondie à l’inférieur)</span>}
                </summary>
                <p className="mt-1 text-app-text/60">
                    Une action qui réunit plusieurs compétences se teste sur leur moyenne ; un échec se relit avec la seule
                    meilleure : 8 ou plus, elle n’est que partiellement ratée (p. 46).
                </p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {competences.map(c => (
                        <label key={c.id} className="flex items-center gap-1">
                            <input type="checkbox" checked={choix.complexe.includes(c.id)} onChange={() => basculer(c.id)} />
                            {c.label} {c.valeur}
                        </label>
                    ))}
                </div>
            </details>
            <div className="flex flex-wrap items-center gap-3" data-opposition-argyropee>
                <label className="flex items-center gap-1"
                    title="Négocier, convaincre, berner : chacun teste la même compétence, en même temps, jusqu’à 5 succès (p. 46).">
                    <input type="checkbox" checked={choix.opposition} onChange={e => setChoix(c => ({ ...c, opposition: e.target.checked }))} />
                    Test en opposition
                </label>
                {choix.opposition && (
                    <label className="flex items-center gap-1"
                        title="Un PNJ du bestiaire n’a pas de degrés fixes : son degré de compétence se tire au d6 à chaque manche (p. 185).">
                        <input type="checkbox" checked={choix.adversairePnj} onChange={e => setChoix(c => ({ ...c, adversairePnj: e.target.checked }))} />
                        Adversaire PNJ
                    </label>
                )}
                {choix.opposition && (
                    <label className="flex items-center gap-1" title={choix.adversairePnj
                        ? 'Bonus de carrière + modificateurs du PNJ ; le d6 de sa compétence se tire à chaque manche.'
                        : 'Compétence + métier + modificateurs de l’adversaire, dans la même compétence.'}>
                        {choix.adversairePnj ? 'Carrière et modificateurs du PNJ' : 'Score de l’adversaire'}
                        <input aria-label="Score de l’adversaire" type="number" value={choix.adversaire} className={`w-14 ${champ}`}
                            onChange={e => setChoix(c => ({ ...c, adversaire: entier(e.target.value) }))} />
                    </label>
                )}
                {choix.opposition && choix.adversairePnj && (
                    <label className="flex items-center gap-1" title="Privilégiée : 1d6 ; sinon 1d6 divisé par deux, arrondi à l’inférieur (p. 185).">
                        <input type="checkbox" checked={choix.adversairePrivilegiee}
                            onChange={e => setChoix(c => ({ ...c, adversairePrivilegiee: e.target.checked }))} />
                        Compétence privilégiée du PNJ
                    </label>
                )}
                {choix.opposition && opposition && (
                    <span className="text-app-text/60">En cours : {opposition.joueur} – {opposition.adversaire} (5 succès pour l’emporter)</span>
                )}
            </div>
            {faveur && (
                <label data-faveur-argyropee className="flex items-center gap-1"
                    title="Une courte prière à la Mère des Labours ou au Père de l’Industrie AVANT le jet : deux d10, le meilleur gardé ; une fois par dé, autant de fois par jour que de points en Sciences religieuses (p. 81).">
                    <input type="checkbox" checked={choix.faveur && faveur.restantes > 0} disabled={faveur.restantes < 1}
                        onChange={e => setChoix(c => ({ ...c, faveur: e.target.checked }))} />
                    Faveur divine — prier avant le jet ({faveur.restantes} sur {faveur.total} aujourd’hui)
                </label>
            )}
            <span data-composition-argyropee className="text-app-text/60">
                {choix.faveur && faveur && faveur.restantes > 0 ? '2d10, le meilleur (0 à 9)' : '1d10 (0 à 9)'} {ajouts < 0 ? '−' : '+'} {Math.abs(ajouts)} ; 8-9 réussite partielle, 10-14 réussite, 15 et plus critique,
                {' '}0 ou moins échec critique (p. 44).
            </span>
        </div>
    );
};

/** Le compte d'un test en opposition, manche par manche (p. 46). */
export const OppositionArgyropee: React.FC<{
    manches: readonly MancheDOpposition[];
    recommencer: () => void;
}> = ({ manches, recommencer }) => {
    const bilan = bilanDeLOpposition(manches);
    const issue = bilan.issue === 'joueur' ? 'Le personnage l’emporte'
        : bilan.issue === 'adversaire' ? 'L’adversaire l’emporte'
        : bilan.issue === 'egalite' ? 'Égalité : les deux camps n’arrivent pas à se mettre d’accord' : null;
    return (
        <div data-suite-opposition-argyropee className="flex w-full flex-col gap-1 text-xs">
            <p className="font-bold">
                Opposition : {bilan.joueur} – {bilan.adversaire}{issue ? ` · ${issue} (p. 46)` : ' · relancer jusqu’à 5 succès'}
            </p>
            <ol className="list-decimal pl-5 text-app-text/60">
                {manches.map((m, i) => (
                    <li key={i}>
                        {m.joueur.argyropee.libelle} ({m.joueur.total}, +{succesDOpposition(m.joueur.argyropee.bilan)})
                        {' — adversaire '}{m.adversaire.argyropee.libelle} ({m.adversaire.total}, +{succesDOpposition(m.adversaire.argyropee.bilan)})
                    </li>
                ))}
            </ol>
            {issue && <button type="button" className={`${bouton} self-start`} onClick={recommencer}>Nouvelle opposition</button>}
        </div>
    );
};

export const SuitesArgyropee: React.FC<{
    jet: JetDArgyropee;
    /** Les points de Panache du personnage ; `undefined` : le pilote ne nomme pas le champ, ou rien ne s'écrit. */
    panache?: number;
    depenser: (points: number) => void;
}> = ({ jet, panache, depenser }) => {
    const a = jet.argyropee;
    const possible = panacheEncorePossible(a);
    const paliers = paliersAtteignables(a);
    const reste = panache === undefined ? '' : ` (${panache} sur la fiche)`;
    const peut = (cout: number) => cout > 0 && cout <= possible && (panache === undefined || panache >= cout);
    return (
        <div data-suites-argyropee className="flex w-full flex-col gap-2 text-xs">
            {a.bilan === 'reussite-critique' && (
                <p className="text-app-text/60">Au combat : lancer deux fois le dé de dégâts, ou le lancer une fois et gagner une manœuvre (p. 85).</p>
            )}
            {possible > 0 ? (
                <div className="flex flex-wrap items-center gap-2" data-panache-argyropee>
                    <span className="text-app-text/60">Panache{reste} — +1 au dé par point, jusqu’à 9 :</span>
                    <button type="button" className={bouton} disabled={!peut(1)} onClick={() => depenser(1)}>+1</button>
                    {paliers.map(p => (
                        <button key={p.bilan} type="button" className={bouton} disabled={!peut(p.cout)} onClick={() => depenser(p.cout)}
                            title={`Le dé passe de ${a.deFinal} à ${a.deFinal + p.cout}.`}>
                            {LIBELLES_D_ARGYROPEE[p.bilan]} ({p.cout})
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-app-text/60">Le dé est à 9 : le Panache n’y peut plus rien (p. 85).</p>
            )}
            <p className="text-app-text/40">Le joueur décrit son action avec fougue, ou le Conteur peut refuser la dépense (p. 85). Jamais sur un dé de dégâts.</p>
        </div>
    );
};

/**
 * **La journée du personnage** — 09/11/2026, à la demande de David (« l'Exubérance, la
 * Faveur divine, la Guigne, la magie et le dé de compétence des PNJ »). Le Panache du
 * réveil (1d10 + 10 + bonus, + 3 si la Guigne a été réglée), les repas, et l'Exubérance,
 * qui sacrifie tout le Panache restant (p. 84-86, 177). L'Exubérance se confirme d'un
 * second clic : elle vide la réserve et ne se reprend pas.
 */
export const JourneeArgyropee: React.FC<{
    panache: number;
    /** Les points de santé, quand le pilote les nomme : sous 0, plus d'Exubérance. */
    sante?: number;
    /** Les prières de la Faveur divine, quand le pilote la nomme. */
    prieres?: { restantes: number; total: number };
    /** Le Panache que la Guigne offrira au prochain réveil. */
    offrande?: number;
    silenciada?: boolean;
    reveil: () => void;
    manger: (points: number, quoi: string) => void;
    exuberance: () => void;
}> = ({ panache, sante, prieres, offrande, silenciada, reveil, manger, exuberance }) => {
    const [confirmer, setConfirmer] = React.useState(false);
    const obstacle = obstacleALExuberance(panache, sante);
    return (
        <div data-journee-argyropee className="flex flex-col gap-1.5 rounded-md border border-app-border/30 px-2 py-1.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
                <span className={etiquette}>Panache</span>
                <span className="font-mono font-bold">{panache}</span>
                <button type="button" className={bouton} onClick={reveil}
                    title={`Après 6 à 8 heures de sommeil : 1d10 (0 à 9) + 10 + le bonus permanent${offrande ? ` + ${offrande} offerts par la Guigne` : ''} ; le reste de la veille est perdu. Remet à zéro les prières du jour (p. 84, 177).`}>
                    Réveil
                </button>
                <button type="button" className={bouton} onClick={() => manger(PANACHE_DU_REPAS, 'Repas')}
                    title="Un solide repas, le midi ou le soir : +3 points (p. 85).">Repas +{PANACHE_DU_REPAS}</button>
                <button type="button" className={bouton} onClick={() => manger(PANACHE_DE_LA_COLLATION, 'Collation')}
                    title="Un verre ou un grignotage sur le pouce : +1 point (p. 85).">Collation +{PANACHE_DE_LA_COLLATION}</button>
                {!confirmer ? (
                    <button type="button" className={bouton} disabled={!!obstacle} onClick={() => setConfirmer(true)}
                        title={obstacle ? `Exubérance impossible : ${obstacle} (p. 86).`
                            : 'Sacrifier tout le Panache restant pour berner la mort, la sienne ou celle d’un allié — à tout moment, même hors de son tour (p. 85-86).'}>
                        Exubérance
                    </button>
                ) : (
                    <>
                        <button type="button" className={`${bouton} border-red-500/60`} onClick={() => { setConfirmer(false); exuberance(); }}>
                            Sacrifier {panache} points
                        </button>
                        <button type="button" className={bouton} onClick={() => setConfirmer(false)}>Annuler</button>
                    </>
                )}
            </div>
            {(prieres || offrande || silenciada) && (
                <p className="text-app-text/60">
                    {prieres && `Faveur divine : ${prieres.restantes} prière${prieres.restantes > 1 ? 's' : ''} sur ${prieres.total} aujourd’hui.`}
                    {offrande ? ` La Guigne offre ${offrande} points au prochain réveil.` : ''}
                    {silenciada ? ' Silenciada : le personnage est muet — 2 tests de Sens magique réussis pour en guérir (p. 127).' : ''}
                </p>
            )}
            {confirmer && <p className="text-app-text/60">Le joueur raconte comment il berne la mort ; le Conteur valide le récit (p. 86).</p>}
        </div>
    );
};

/**
 * **La magie** — 09/11/2026 : exprimer un sort connu de la fiche, avec sa lueur (1 point)
 * ou sans (2 points ; 1 pour une double humeur), et le Panache magique du combat en cours
 * — à 7, les 20 % de la silenciada se tirent (p. 127, 135-136 ; décision de David).
 */
export const MagieArgyropee: React.FC<{
    sorts: readonly string[];
    double: boolean;
    panache: number;
    combat: number;
    exprimer: (sort: string, discret: boolean) => void;
    finDuCombat: () => void;
}> = ({ sorts, double, panache, combat, exprimer, finDuCombat }) => {
    const [sort, setSort] = React.useState('');
    const [discret, setDiscret] = React.useState(false);
    const choisi = sorts.includes(sort) ? sort : sorts[0] ?? '';
    const cout = coutDuSort(discret, double);
    return (
        <details data-magie-argyropee className="rounded-md border border-app-border/30 px-2 py-1 text-xs" open={combat > 0}>
            <summary className="cursor-pointer select-none">
                <span className={etiquette}>Magie</span>
                <span className="ml-2 text-app-text/60">
                    {combat} point{combat > 1 ? 's' : ''} en sorts dans ce combat (silenciada possible à {SEUIL_DE_LA_SILENCIADA})
                </span>
            </summary>
            {sorts.length === 0 ? (
                <p className="mt-1 text-app-text/60">La fiche ne porte aucun sort connu.</p>
            ) : (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <select aria-label="Sort" value={choisi} className={champ} onChange={e => setSort(e.target.value)}>
                        {sorts.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <label className="flex items-center gap-1" title={double
                        ? 'Double humeur : chaque sort est discret pour 1 point ; la lueur seulement si le personnage la veut (p. 136).'
                        : 'Un point de plus efface la lueur qui accompagne le sort (p. 136).'}>
                        <input type="checkbox" checked={discret} onChange={e => setDiscret(e.target.checked)} />
                        Sans lueur
                    </label>
                    <button type="button" className={bouton} disabled={!choisi || panache < cout} onClick={() => exprimer(choisi, discret)}
                        title="Sur soi ou sur l’environnement proche ; jamais directement sur autrui, mais sur un objet qu’il tient (p. 136).">
                        Exprimer ({cout} Panache)
                    </button>
                </div>
            )}
            {combat > 0 && (
                <button type="button" className={`${bouton} mt-1`} onClick={finDuCombat}>Fin du combat</button>
            )}
        </details>
    );
};
