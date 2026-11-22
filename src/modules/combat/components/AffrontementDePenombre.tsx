import React, { useState } from 'react';
import { Swords } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { ecrireLaFicheDuCombattant, valeursDuCombattant } from '../ficheDesCombattants';
import { typesDeDegats } from '../logic/TypesDeDegats';
import {
    CLE_AFFRONTEMENT_PENOMBRE, adversiteDe, apresLaChute, dissonanceRestante, lireLActionAdverse, lireLeSuiviDAffrontement,
    perteDeLActionAdverse, profilDeLAdversaire, type SuiviDAffrontement,
} from '../logic/affrontementDePenombre';
import { lireLaConscience, perdreDesJetons } from '../../dice/systemes/penombre';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';

/**
 * **« Affronter » — un adversaire de Pénombre** (registre § 267, T17, 22/11/2026). David : « consigne
 * les affrontements dans la révision de combat-os », puis les quatre gestes retenus : encaisser une
 * attaque, l'action adverse, la dissonance, l'opéra harmonique.
 *
 * Le Psycholune ne lance jamais (livre, p. 40-45). Les Éminences grises lancent depuis leur fiche contre
 * l'**adversité** ; leurs succès retirent la **résilience** (p. 44). Une **action adverse** réussit
 * d'office : la cible perd autant de jetons que l'adversité, ou toutes la moitié (p. 42) ; une défense
 * en annule un par succès (p. 44) ; les jetons inactifs partent d'abord (p. 24). À 0 de résilience, un
 * adversaire **dissonant** joue une action de dissonance et revient à sa résilience (p. 43) ; un **opéra
 * harmonique** réussi annule sa dissonance (p. 45).
 *
 * Un seul écrivain de la santé : `applyDamage` — la résilience de l'adversaire, la conscience des
 * Éminences grises (par leur fiche) ; les jetons actifs suivent la règle « les inactifs d'abord ».
 */
export const AffrontementDePenombre: React.FC<{
    combattant: Combatant;
    cible: Combatant | null;
    driver: Pick<GameDriver, 'jet' | 'combat' | 'bestiaire'>;
}> = ({ combattant, cible, driver }) => {
    const combattants = useCombatStore(s => s.combatants);
    const adversaire = combattants.find(c => c.id === combattant.id) ?? combattant;
    const eminences = combattants.filter(c => c.isPlayer);
    const regle = driver.jet?.penombre;
    const type = typesDeDegats(driver as GameDriver)[0] ?? '';

    const profil = profilDeLAdversaire(driver, adversaire);
    const suivi = lireLeSuiviDAffrontement(valeursDuCombattant(adversaire));
    const adversite = adversiteDe(profil, suivi);
    const resilience = Math.max(0, adversaire.hp ?? 0);
    const resilienceMax = Math.max(resilience, adversaire.hpMax ?? profil.resilience ?? resilience);
    const dissonance = dissonanceRestante(profil, suivi);
    const etat = apresLaChute(resilience, profil, suivi);
    const ecrireLeSuivi = (maj: Partial<SuiviDAffrontement>) =>
        ecrireLaFicheDuCombattant(adversaire, { [CLE_AFFRONTEMENT_PENOMBRE]: { ...suivi, ...maj } as never });

    // L'attaque d'une Éminence grise (p. 44).
    const [succes, setSucces] = useState('');
    const [encaisse, setEncaisse] = useState<string | null>(null);
    const encaisser = () => {
        const n = Math.trunc(Number(succes));
        if (!(n > 0)) return;
        useCombatStore.getState().applyDamage(n, type, [adversaire.id]);
        setEncaisse(`${adversaire.name} perd ${n} point${n > 1 ? 's' : ''} de résilience.`);
        setSucces('');
    };

    // L'action adverse (p. 42).
    const [action, setAction] = useState(-1);
    const [toutes, setToutes] = useState(!cible?.isPlayer);
    const [perte, setPerte] = useState('');
    const [defense, setDefense] = useState('');
    const [actionAppliquee, setActionAppliquee] = useState<string | null>(null);
    const parDefaut = adversite !== null ? perteDeLActionAdverse(adversite, toutes) : null;
    const choisirLAction = (i: number) => {
        setAction(i);
        const lue = i >= 0 ? lireLActionAdverse(profil.actions[i].effet) : null;
        if (lue) { setToutes(lue.toutes || !cible?.isPlayer); setPerte(lue.perte !== undefined ? String(lue.perte) : ''); }
    };
    const perteBrute = perte.trim() !== '' ? Math.max(0, Math.trunc(Number(perte)) || 0) : parDefaut;
    const perteNette = perteBrute === null ? null : Math.max(0, perteBrute - Math.max(0, Math.trunc(Number(defense)) || 0));
    const cibles = toutes ? eminences : cible?.isPlayer ? [cible] : [];
    const appliquerLAction = () => {
        if (perteNette === null || perteNette <= 0 || cibles.length === 0) return;
        for (const pj of cibles) {
            const avant = regle ? lireLaConscience(regle, valeursDuCombattant(pj)) : null;
            useCombatStore.getState().applyDamage(perteNette, type, [pj.id]);
            // Les jetons inactifs partent d'abord (p. 24) : les actifs ne baissent que si la perte les atteint.
            if (avant && regle?.conscience) ecrireLaFicheDuCombattant(pj, { [regle.conscience.actifs]: perdreDesJetons(avant, perteNette).actifs });
        }
        const nom = action >= 0 ? profil.actions[action].nom : 'Action adverse';
        setActionAppliquee(`${nom} : ${cibles.map(c => c.name).join(', ')} perd${cibles.length > 1 ? 'ent' : ''} ${perteNette} jeton${perteNette > 1 ? 's' : ''}.`);
    };

    // La dissonance (p. 43) et l'opéra harmonique (p. 45).
    const jouerLaDissonance = () => {
        if (etat !== 'dissonance') return;
        useCombatStore.getState().applyDamage(-(resilienceMax - resilience), type, [adversaire.id]);
        ecrireLeSuivi({ dissonance: dissonance - 1 });
    };

    const champ = 'w-14 rounded border border-app-border bg-app-bg px-1 py-0.5 text-center';
    const bouton = 'flex items-center gap-1.5 rounded-lg border border-accent/60 px-3 py-1 font-black uppercase tracking-wider text-accent disabled:opacity-40';
    const actionsDeDissonance = profil.actions.filter(a => /dissonance/i.test(a.nom));
    return (
        <section data-affrontement-penombre data-ouvert-sur-le-jet className="space-y-3 rounded-xl border border-accent/60 p-3 text-ui-11">
            <h4 className="text-ui-10 font-black uppercase tracking-widest text-app-text">Affronter {adversaire.name}</h4>
            <p data-profil-de-l-adversaire className="text-app-muted">
                Adversité <strong className="text-app-text">{adversite ?? '?'}</strong> — la difficulté des Éminences grises contre lui ·
                {' '}résilience <strong className="text-app-text">{resilience} / {resilienceMax}</strong>
                {(profil.dissonance > 0 || suivi.opera) && <> · dissonance <strong className="text-app-text">{dissonance}</strong>{suivi.opera ? ' (opéra : annulée)' : ''}</>}
                . Le Psycholune ne lance pas (p. 40-45).
            </p>
            {adversite === null && (
                <label className="flex items-center gap-1" title="Le nombre d'informations de sa description (p. 40-41).">Adversité
                    <input aria-label="Adversité" className={champ} type="number" min={1} value={suivi.adversite ?? ''}
                        onChange={e => ecrireLeSuivi({ adversite: Math.max(0, Math.trunc(Number(e.target.value)) || 0) })} />
                </label>
            )}

            <div data-encaisser-penombre className="space-y-1">
                <h5 className="font-black uppercase tracking-widest text-ui-9 text-app-text/60">Encaisser une attaque</h5>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1" title="Une Éminence grise a réussi son attaque, même de justesse : chaque succès retire 1 point de résilience (p. 44).">
                        Succès de l’attaque
                        <input aria-label="Succès de l’attaque" className={champ} type="number" min={0} value={succes} onChange={e => setSucces(e.target.value)} />
                    </label>
                    <button type="button" className={bouton} disabled={!(Number(succes) > 0)} onClick={encaisser}>
                        <Swords size={12} /> Retirer {Number(succes) > 0 ? Math.trunc(Number(succes)) : '…'} de résilience
                    </button>
                </div>
                {encaisse && <p data-attaque-encaissee className="text-etat-succes">{encaisse}</p>}
                {etat === 'dissonance' && (
                    <div data-chute-dissonante className="flex flex-wrap items-center gap-2">
                        <span className="text-etat-alerte">Résilience à 0, mais il reste {dissonance} jeton{dissonance > 1 ? 's' : ''} de dissonance : action de dissonance gratuite (p. 43).</span>
                        {actionsDeDissonance.map(a => <span key={a.nom} className="text-app-muted">{a.nom} : {a.effet}</span>)}
                        <button type="button" className={bouton} onClick={jouerLaDissonance}>
                            Jouer la dissonance : résilience à {resilienceMax}, un jeton en moins
                        </button>
                    </div>
                )}
                {etat === 'vaincu' && <p data-adversaire-vaincu className="font-black text-etat-succes">{adversaire.name} est vaincu : il meurt, capitule ou fuit, selon l’histoire (p. 41).</p>}
            </div>

            <div data-action-adverse-penombre className="space-y-1">
                <h5 className="font-black uppercase tracking-widest text-ui-9 text-app-text/60">Action adverse — réussie d’office</h5>
                <div className="flex flex-wrap items-center gap-2">
                    {profil.actions.length > 0 && (
                        <select aria-label="Action adverse" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={action}
                            onChange={e => choisirLAction(Number(e.target.value))}>
                            <option value={-1}>Action calibrée par défaut</option>
                            {profil.actions.map((a, i) => <option key={i} value={i}>{a.nom}</option>)}
                        </select>
                    )}
                    <label className="flex items-center gap-1">
                        <input type="radio" name={`cibles-${adversaire.id}`} checked={!toutes} disabled={!cible?.isPlayer} onChange={() => setToutes(false)} />
                        {cible?.isPlayer ? cible.name : 'la cible de la carte'}
                    </label>
                    <label className="flex items-center gap-1">
                        <input type="radio" name={`cibles-${adversaire.id}`} checked={toutes} onChange={() => setToutes(true)} />
                        toutes les Éminences grises ({eminences.length})
                    </label>
                </div>
                {action >= 0 && <p className="text-app-muted">{profil.actions[action].effet}</p>}
                <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1" title={`Par défaut : l'adversité pour une cible, sa moitié arrondie au supérieur pour toutes (p. 42)${parDefaut !== null ? ` — ${parDefaut}` : ''}.`}>
                        Jetons perdus
                        <input aria-label="Jetons perdus" className={champ} type="number" min={0} value={perte} placeholder={parDefaut !== null ? String(parDefaut) : ''}
                            onChange={e => setPerte(e.target.value)} />
                    </label>
                    <label className="flex items-center gap-1" title="Une Éminence grise qui avait réservé une action s'est défendue : chaque succès annule la perte d'un jeton (p. 44).">
                        Annulés par une défense
                        <input aria-label="Annulés par une défense" className={champ} type="number" min={0} value={defense} onChange={e => setDefense(e.target.value)} />
                    </label>
                    <button type="button" className={bouton} disabled={perteNette === null || perteNette <= 0 || cibles.length === 0} onClick={appliquerLAction}>
                        Appliquer : −{perteNette ?? '…'} jeton{(perteNette ?? 0) > 1 ? 's' : ''}{cibles.length > 1 ? ` à ${cibles.length} Éminences grises` : cibles[0] ? ` à ${cibles[0].name}` : ''}
                    </button>
                </div>
                {actionAppliquee && <p data-action-appliquee className="text-etat-succes">{actionAppliquee} Les jetons inactifs partent d’abord ; une complication peut remplacer la perte (p. 25).</p>}
            </div>

            {(profil.dissonance > 0 || suivi.opera) && (
                <div data-opera-penombre className="flex flex-wrap items-center gap-2">
                    <span className="text-app-muted">
                        Opéra harmonique : action collégiale d’au moins deux effets magiques d’harmoniques autres que sa dissonance, difficulté {resilience} — sa résilience actuelle (p. 45).
                    </span>
                    {suivi.opera ? (
                        <button type="button" className={bouton} onClick={() => ecrireLeSuivi({ opera: false })}>La dissonance revient</button>
                    ) : (
                        <button type="button" className={bouton} onClick={() => ecrireLeSuivi({ opera: true })}>Opéra réussi : dissonance annulée</button>
                    )}
                </div>
            )}
        </section>
    );
};
