import React, { useState } from 'react';
import { Swords } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { valeursDuCombattant } from '../ficheDesCombattants';
import { armureDeLInvestigateur, riposteDeCthulhuHack } from '../logic/attaqueDeLAdversaire';
import { ecrireLAttaque } from '../../bestiaire/bestiaire';
import { typesDeDegats } from '../logic/TypesDeDegats';
import type { Combatant } from '../types';
import type { GameDriver, LigneDAttaque } from '../../../types/drivers';

/**
 * **« Riposte » — l'attaque d'un adversaire de Cthulhu Hack** (registre § 263, T16, 19/11/2026).
 * David : « les calculs des dégâts, ce n'est pas toujours intuitif ».
 *
 * Le meneur ne lance jamais de dé (livre, p. 45-48) : l'investigateur qui rate sa Sauvegarde subit
 * les **dégâts fixes** de l'attaque, moins son **Armure** (p. 51). Sur un **20 naturel**, deux fois
 * les dégâts, puis l'Armure (décision D5 de David : « c'est d'abord les dégâts puis l'armure »).
 * Une attaque qui ne riposte pas ne double rien (exemple de combat, p. 47) : le meneur ne coche le 20
 * que si l'adversaire attaquait.
 *
 * Les attaques viennent du bestiaire du pilote (créature posée depuis « Livre », pilote 1.2.0) ; un
 * adversaire fabriqué fait saisir ses dégâts. L'Armure du PJ se lit sur sa fiche (Matériel, PA) et
 * reste modifiable (le Couvert s'y ajoute). Un seul écrivain de la santé : `applyDamage([cible])`,
 * qui passe par sa fiche (T21) et dit le coup au journal. Une riposte ne s'applique qu'une fois ; en
 * choisir une autre rouvre le geste.
 */
export const RiposteDeCthulhuHack: React.FC<{
    combattant: Combatant;
    cible: Combatant | null;
    driver: Pick<GameDriver, 'jet' | 'combat' | 'bestiaire'>;
}> = ({ combattant, cible, driver }) => {
    const creature = combattant.origineDuLivre ? driver.bestiaire?.creatures.find(c => c.id === combattant.origineDuLivre!.creatureId) : undefined;
    const attaques: LigneDAttaque[] = (creature?.attaques?.lignes ?? []).filter(l => l.degats !== undefined);
    const armure = cible ? armureDeLInvestigateur(driver.jet?.cthulhuHack?.armures, valeursDuCombattant(cible)) : { total: 0, pieces: [] };

    const [choisie, setChoisie] = useState(0);
    const [saisi, setSaisi] = useState('');
    const [protection, setProtection] = useState(String(armure.total));
    const [vingt, setVingt] = useState(false);
    const [appliquee, setAppliquee] = useState<string | null>(null);

    const attaque = attaques[choisie];
    const fixes = attaque ? attaque.degats! : Number(saisi);
    const connus = attaque !== undefined || (saisi.trim() !== '' && Number.isFinite(fixes) && fixes >= 0);
    const pa = Number(protection) || 0;
    const montant = connus ? riposteDeCthulhuHack(fixes, pa, vingt) : null;
    const cle = `${choisie}-${saisi}-${pa}-${vingt}`;
    const calcul = connus
        ? `${vingt ? `${fixes} × 2 (20 naturel) = ${fixes * 2}` : `${fixes}`}${pa ? `, − Armure ${pa}` : ''} = ${montant}`
        : 'saisir les dégâts de l’attaque';

    const appliquer = () => {
        if (!cible || montant === null || montant <= 0 || appliquee === cle) return;
        useCombatStore.getState().applyDamage(montant, typesDeDegats(driver as GameDriver)[0] ?? '', [cible.id]);
        setAppliquee(cle);
    };

    const champ = 'w-16 rounded border border-app-border bg-app-bg px-1 py-0.5 text-center';
    return (
        <section data-riposte data-ouvert-sur-le-jet className="space-y-2 rounded-xl border border-accent/60 p-3 text-ui-11">
            <h4 className="text-ui-10 font-black uppercase tracking-widest text-app-text">
                {cible ? `${combattant.name} riposte contre ${cible.name}` : `Riposte de ${combattant.name}`}
            </h4>
            {!cible ? (
                <p data-sans-cible className="text-etat-alerte">La carte ne vise personne : choisir sa cible, puis revenir.</p>
            ) : (
                <>
                    <p data-cible-de-l-attaque={cible.id} className="text-app-muted">
                        {cible.name} a raté sa Sauvegarde : il subit les dégâts fixes de l’attaque, moins son Armure. Le meneur ne lance pas.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        {attaques.length > 0 ? (
                            <label className="flex items-center gap-1">Attaque
                                <select aria-label="Attaque" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={choisie}
                                    onChange={e => setChoisie(Number(e.target.value))}>
                                    {attaques.map((l, i) => <option key={i} value={i}>{ecrireLAttaque(l)}</option>)}
                                </select>
                            </label>
                        ) : (
                            <label className="flex items-center gap-1" title="Cet adversaire n'a pas d'attaque au bestiaire : saisir ses dégâts fixes.">Dégâts
                                <input aria-label="Dégâts de l’attaque" className={champ} type="number" min={0} value={saisi} onChange={e => setSaisi(e.target.value)} />
                            </label>
                        )}
                        <label className="flex items-center gap-1" title={armure.pieces.length ? armure.pieces.map(p => `${p.nom} : ${p.pa}`).join(', ') : 'Aucune armure sur sa fiche ; ajouter le Couvert s’il y en a.'}>
                            Armure de {cible.name}
                            <input aria-label="Armure de la cible" className={champ} type="number" min={0} value={protection} onChange={e => setProtection(e.target.value)} />
                        </label>
                        <label className="flex items-center gap-1" title="Sa Sauvegarde a donné un 20 naturel : deux fois les dégâts, puis l’Armure (p. 48).">
                            <input type="checkbox" checked={vingt} onChange={e => setVingt(e.target.checked)} /> 20 naturel
                        </label>
                    </div>
                    {attaque?.fois && attaque.fois > 1 && (
                        <p className="text-app-muted">Cette attaque compte {attaque.fois} fois par round : une riposte par Sauvegarde ratée.</p>
                    )}
                    <p data-calcul-de-la-riposte className="text-app-muted">{calcul}</p>
                    {appliquee === cle ? (
                        <p data-riposte-appliquee className="font-black text-etat-succes">{montant} dégât{montant! > 1 ? 's' : ''} appliqué{montant! > 1 ? 's' : ''} à {cible.name}.</p>
                    ) : montant === 0 ? (
                        <p data-riposte-nulle className="text-app-muted">L’Armure absorbe tout : rien à appliquer.</p>
                    ) : (
                        <button type="button" onClick={appliquer} disabled={montant === null}
                            className="flex items-center gap-1.5 rounded-lg border border-accent/60 px-3 py-1 font-black uppercase tracking-wider text-accent disabled:opacity-40">
                            <Swords size={12} /> Appliquer {montant ?? '…'} à {cible.name}
                        </button>
                    )}
                </>
            )}
        </section>
    );
};
