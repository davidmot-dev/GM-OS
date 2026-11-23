import React, { useState } from 'react';
import { Shield, Swords } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { valeursDuCombattant } from '../ficheDesCombattants';
import { attaquesDeSymbaroum, defenseContreLePNJ, protectionDeSymbaroum, riposteDeSymbaroum } from '../logic/attaqueDeLAdversaire';
import { douleurAtteinte, lancerLaFormule } from '../../dice/systemes/symbaroumRegles';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';

/**
 * **« Riposte » — l'attaque d'un adversaire de Symbaroum** (registre § 267, T6, 23/11/2026).
 *
 * Le meneur ne lance jamais de dé (p. 178). L'attaque d'un PNJ se résout par le joueur : il teste la
 * **Défense** de son personnage, modifiée par la **Précision** de l'attaquant — [Défense ← Précision],
 * soit Défense + 10 − Précision (p. 164, 174). Réussi, le coup est évité. Raté, le PNJ inflige ses
 * **dégâts fixes**, la moitié de la plus haute face de son arme (1D8 vaut 4, p. 178 ; Éventreur +1,
 * p. 156), et le joueur **lance sa protection** ; la différence, jamais négative, ôte de l'Endurance
 * (p. 167). En règle optionnelle (p. 184), un 20 en Défense ajoute 3 dégâts, un 1 donne une attaque
 * gratuite.
 *
 * Un seul écrivain de la santé : `applyDamage([cible])`, qui passe par la fiche du PJ et dit le coup au
 * journal. Une riposte ne s'applique qu'une fois ; changer le jet, l'arme ou la protection rouvre le geste.
 */
export const RiposteDeSymbaroum: React.FC<{
    combattant: Combatant;
    cible: Combatant | null;
    driver: Pick<GameDriver, 'jet' | 'combat'>;
}> = ({ combattant, cible, driver }) => {
    const regle = driver.jet?.symbaroum;
    const valeursDuPNJ = valeursDuCombattant(combattant);
    const attaques = attaquesDeSymbaroum(regle, valeursDuPNJ);
    const valeursDeLaCible = cible ? valeursDuCombattant(cible) : {};
    const armure = protectionDeSymbaroum(regle, valeursDeLaCible);
    const precisionEcrite = valeursDuPNJ.precision;
    const precision = precisionEcrite === undefined || String(precisionEcrite).trim() === '' ? null : Number(precisionEcrite);
    const defense = regle?.defense ? Number(valeursDeLaCible[regle.defense]) : NaN;
    const seuil = Number.isFinite(defense) ? defenseContreLePNJ(defense, precision ?? 10) : null;
    const douleur = regle?.douleur ? Number(valeursDeLaCible[regle.douleur]) || 0 : 0;
    // Les règles optionnelles retenues par la campagne (p. 183-184) ; aucune ne s'active seule.
    const options = useSessionOSStore(s => s.campaigns.find(c => c.id === s.activeCampaignId)?.reglesOptionnelles);
    const critiques = !!options?.attaquesParfaites;

    const [choisie, setChoisie] = useState(0);
    const [saisi, setSaisi] = useState('');
    const [jet, setJet] = useState('');
    const [protection, setProtection] = useState('');
    const [protectionLancee, setProtectionLancee] = useState<string | null>(null);
    const [appliquee, setAppliquee] = useState<string | null>(null);

    const attaque = attaques[choisie];
    const fixes = attaque ? attaque.fixes : Number(saisi);
    const connus = attaque !== undefined || (saisi.trim() !== '' && Number.isFinite(fixes) && fixes >= 0);
    const d20 = jet.trim() === '' ? null : Math.trunc(Number(jet));
    const jetValable = d20 !== null && d20 >= 1 && d20 <= 20;
    const touche = jetValable && seuil !== null && d20! > seuil;
    const echecCritique = critiques && d20 === 20;
    const pa = Math.max(0, Number(protection) || 0);
    const montant = touche && connus ? riposteDeSymbaroum(fixes, pa, echecCritique) : null;
    const cle = `${choisie}-${saisi}-${jet}-${pa}`;

    const lancerLaDefense = () => {
        const de = DiceEngine.roll(20);
        setJet(String(de));
        if (cible) useDiceStore.getState().setLastRoll({
            total: de, rolls: [{ val: de, sides: 20 }], modifier: 0, id: `defense-${cible.id}-${Date.now()}`, timestamp: new Date(),
            title: `${cible.name} — Défense contre ${combattant.name}`,
            totalDisplay: `${de} sur ${seuil ?? '?'} : ${seuil !== null && de <= seuil ? 'évitée' : 'touché'}`,
        } as never);
    };
    const lancerLaProtection = () => {
        if (!armure.formule) return;
        const r = lancerLaFormule(armure.formule, faces => DiceEngine.roll(faces));
        setProtection(String(r.total));
        setProtectionLancee(`${armure.libelle} : ${r.detail} = ${r.total}`);
    };
    const appliquer = () => {
        if (!cible || montant === null || montant <= 0 || appliquee === cle) return;
        useCombatStore.getState().applyDamage(montant, 'physique', [cible.id]);
        setAppliquee(cle);
    };

    const champ = 'w-16 rounded border border-app-border bg-app-bg px-1 py-0.5 text-center';
    const petitBouton = 'flex items-center gap-1 rounded border border-app-border/60 px-2 py-0.5 hover:border-accent/50 hover:text-accent';
    return (
        <section data-riposte data-riposte-symbaroum data-ouvert-sur-le-jet className="space-y-2 rounded-xl border border-accent/60 p-3 text-ui-11">
            <h4 className="text-ui-10 font-black uppercase tracking-widest text-app-text">
                {cible ? `${combattant.name} attaque ${cible.name}` : `Riposte de ${combattant.name}`}
            </h4>
            {!cible ? (
                <p data-sans-cible className="text-etat-alerte">La carte ne vise personne : choisir sa cible, puis revenir.</p>
            ) : (
                <>
                    <p data-cible-de-l-attaque={cible.id} className="text-app-muted">
                        Le meneur ne lance pas : {cible.name} teste sa Défense ; raté, il subit les dégâts fixes de l’attaque, moins sa protection, qu’il lance (p. 164, 178).
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        {attaques.length > 0 ? (
                            <label className="flex items-center gap-1">Attaque
                                <select aria-label="Attaque" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={choisie}
                                    onChange={e => setChoisie(Number(e.target.value))}>
                                    {attaques.map((a, i) => <option key={i} value={i}>{a.libelle} ({a.formule} : {a.fixes})</option>)}
                                </select>
                            </label>
                        ) : (
                            <label className="flex items-center gap-1" title="Aucune arme lisible sur sa fiche : saisir ses dégâts fixes (la moitié de la plus haute face, p. 178).">Dégâts fixes
                                <input aria-label="Dégâts de l’attaque" className={champ} type="number" min={0} value={saisi} onChange={e => setSaisi(e.target.value)} />
                            </label>
                        )}
                    </div>
                    <p data-seuil-de-defense className="text-app-muted">
                        {seuil === null
                            ? `La fiche de ${cible.name} ne porte pas de Défense : saisir le jet, et dire s’il touche.`
                            : `Défense de ${cible.name} : ${defense} ${precision === null ? '(Précision du PNJ inconnue : sans modificateur)' : `+ (10 − Précision ${precision}) = ${seuil}`} — ${seuil} ou moins évite le coup.`}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-1">Jet de Défense
                            <input aria-label="Jet de Défense" className={champ} type="number" min={1} max={20} value={jet} onChange={e => setJet(e.target.value)} />
                        </label>
                        <button type="button" onClick={lancerLaDefense} data-lancer-la-defense className={petitBouton}>
                            <Shield size={11} /> Lancer 1D20 pour {cible.name}
                        </button>
                    </div>
                    {jetValable && seuil !== null && !touche && (
                        <p data-riposte-evitee className="font-black text-etat-succes">
                            {d20} sur {seuil} : {cible.name} évite le coup.
                            {critiques && d20 === 1 ? ` Défense parfaite : attaque gratuite contre ${combattant.name} (p. 184).` : ''}
                        </p>
                    )}
                    {touche && (
                        <>
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="flex items-center gap-1" title={armure.formule ? armure.libelle : 'Aucune armure lisible sur sa fiche.'}>
                                    Protection de {cible.name}
                                    <input aria-label="Protection de la cible" className={champ} type="number" min={0} value={protection} onChange={e => setProtection(e.target.value)} />
                                </label>
                                {armure.formule && (
                                    <button type="button" onClick={lancerLaProtection} data-lancer-la-protection className={petitBouton}>
                                        <Shield size={11} /> Lancer {armure.formule.texte}
                                    </button>
                                )}
                            </div>
                            {protectionLancee && <p data-protection-lancee className="text-app-muted">{protectionLancee}</p>}
                            <p data-calcul-de-la-riposte className="text-app-muted">
                                {connus
                                    ? `${d20} sur ${seuil} : touché. Dégâts ${fixes}${echecCritique ? ' + 3 (20 en Défense, p. 184)' : ''}${pa ? `, − protection ${pa}` : ''} = ${montant}`
                                    : 'saisir les dégâts fixes de l’attaque'}
                                {montant !== null && douleurAtteinte(montant, douleur) ? ` — atteint sa Résistance à la douleur (${douleur}, p. 164).` : ''}
                            </p>
                            {appliquee === cle ? (
                                <p data-riposte-appliquee className="font-black text-etat-succes">{montant} dégât{montant! > 1 ? 's' : ''} appliqué{montant! > 1 ? 's' : ''} à {cible.name}.</p>
                            ) : montant === 0 ? (
                                <p data-riposte-nulle className="text-app-muted">La protection absorbe tout : rien à appliquer.</p>
                            ) : (
                                <button type="button" onClick={appliquer} disabled={montant === null}
                                    className="flex items-center gap-1.5 rounded-lg border border-accent/60 px-3 py-1 font-black uppercase tracking-wider text-accent disabled:opacity-40">
                                    <Swords size={12} /> Appliquer {montant ?? '…'} à {cible.name}
                                </button>
                            )}
                        </>
                    )}
                </>
            )}
        </section>
    );
};
