import React, { useState } from 'react';
import { Shield, Swords } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { DiceEngine, type RollResult } from '../../dice/DiceEngine';
import { coupAAppliquer, preparerLeCoupAlien, type ArmeProposee } from '../logic/attaqueDeLAdversaire';
import { CLE_COMBAT_ALIEN, lireLeCombatAlien, type ArmureAlien } from '../../dice/systemes/combatAlien';
import { estUnAndroide } from '../../dice/systemes/paniqueAlien';
import { ecrireLaFicheDuCombattant, valeursDuCombattant } from '../ficheDesCombattants';
import type { ProtectionLue } from '../logic/protectionDeLaCible';
import { typesDeDegats } from '../logic/TypesDeDegats';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';

/**
 * **« Appliquer à [cible] »** — registre § 263, T7 (19/11/2026). David : « les calculs des dégâts,
 * ce n'est pas toujours intuitif ». Après le jet d'un adversaire ouvert par « Attaquer », le coup
 * part sur la cible de la carte en un geste.
 *
 * Le calcul est dit en clair (`coupAAppliquer`) : un jet à réserve vaut l'arme plus un par succès
 * au-delà du premier ; un autre jet, le montant que le meneur saisit ; la protection de la cible se
 * retire ensuite. **Un seul écrivain de la santé**, `applyDamage([cible])` (C9) : il passe par la
 * fiche d'un PJ ou d'un PNJ de la Galerie (T21), par le plateau sinon, et dit le coup au journal.
 * Un résultat ne s'applique qu'une fois ; un nouveau jet rouvre le geste.
 */
export const AppliquerALaCible: React.FC<{
    cible: Pick<Combatant, 'id' | 'name'>;
    /** Le résultat affiché par le panneau ; chaque jet ou forçage en est un nouvel objet. */
    resultat: Pick<RollResult, 'total' | 'successes' | 'compte'>;
    driver: Pick<GameDriver, 'combat' | 'jet'> | null | undefined;
    /** T9 : les armes que le catalogue connaît pour cet adversaire ; la première est proposée. */
    armes?: readonly ArmeProposee[];
    /** T9 : la protection que porte la cible (Blade Runner) ; un bouton la lance. */
    protectionDeLaCible?: ProtectionLue | null;
    /** T12 : l'attaque est perforante (une attaque de créature qui le dit) — perce-armure chez Alien. */
    perforant?: boolean;
}> = ({ cible, resultat, driver, armes = [], protectionDeLaCible, perforant = false }) => {
    /*
      **Alien (T12)** : le coup ne s'applique pas d'un trait. Il se prépare sur la carte de la cible,
      où sa Protection se lance puis les dégâts restants s'appliquent (`SanteAlien`) : la protection
      n'est donc ni saisie ni retirée ici.
    */
    const regleAlien = driver?.combat?.alien;
    const [arme, setArme] = useState(armes[0] ? String(armes[0].degats) : '');
    const [armeChoisie, setArmeChoisie] = useState(armes[0]?.libelle ?? '');
    const [saisi, setSaisi] = useState('');
    const [protection, setProtection] = useState('');
    const [protectionLancee, setProtectionLancee] = useState<string | null>(null);
    const lancerLaProtection = () => {
        if (!protectionDeLaCible) return;
        const { nom, niveau, nombre, faces } = protectionDeLaCible;
        const jet = DiceEngine.rollYZEEchelonne(Array.from({ length: nombre }, () => faces));
        const n = jet.successes ?? 0;
        setProtection(String(n));
        setProtectionLancee(`${nom} ${niveau} : ${jet.totalDisplay}`);
        useDiceStore.getState().setLastRoll({
            ...jet, id: `protection-${cible.id}-${Date.now()}`, timestamp: new Date(),
            title: `${cible.name} — ${nom} ${niveau}`,
            totalDisplay: `${jet.totalDisplay} : −${n} dégât${n > 1 ? 's' : ''}`,
        });
    };
    const types = typesDeDegats(driver as GameDriver | null | undefined);
    const [type, setType] = useState(types[0] ?? '');
    const [appliquePour, setAppliquePour] = useState<{ resultat: object; montant: number } | null>(null);

    const nombre = (s: string) => (s.trim() === '' ? undefined : Number(s));
    const coup = coupAAppliquer({ resultat, degatsDeLArme: nombre(arme), montantSaisi: nombre(saisi), protection: regleAlien ? 0 : nombre(protection) });
    const reserve = resultat.compte === 'reussites';
    const deja = appliquePour?.resultat === resultat ? appliquePour : null;
    const [refus, setRefus] = useState<string | null>(null);

    const appliquer = () => {
        if (coup.montant === null || coup.montant <= 0 || deja) return;
        if (regleAlien) {
            const porteur = useCombatStore.getState().combatants.find(c => c.id === cible.id);
            if (!porteur) { setRefus(`${cible.name} n’est plus sur le plateau.`); return; }
            const valeurs = valeursDuCombattant(porteur);
            const armeDuCoup = armes.find(a => a.libelle === armeChoisie)?.armure;
            const armure: ArmureAlien = perforant ? 'perce-armure' : armeDuCoup ?? 'normale';
            const suivi = lireLeCombatAlien(valeurs);
            const synthetiqueOuCreature = estUnAndroide(regleAlien, valeurs) || !!suivi.xenomorphe;
            const prepare = preparerLeCoupAlien(suivi, {
                id: crypto.randomUUID(), degats: coup.montant, protectionDeLaFiche: Number(valeurs[regleAlien.protection] ?? 0), type: armure,
                ...(synthetiqueOuCreature ? { origine: 'ordinaire' } : {}),
            });
            if (!prepare) { setRefus(`Un coup attend déjà sur la carte de ${cible.name} : le résoudre ou l’abandonner d’abord.`); return; }
            ecrireLaFicheDuCombattant(porteur, { [CLE_COMBAT_ALIEN]: prepare });
            setRefus(null);
            setAppliquePour({ resultat, montant: coup.montant });
            return;
        }
        useCombatStore.getState().applyDamage(coup.montant, type, [cible.id]);
        setAppliquePour({ resultat, montant: coup.montant });
    };

    const champ = 'w-16 rounded border border-app-border bg-app-bg px-1 py-0.5 text-center';
    return (
        <section data-appliquer-a-la-cible={cible.id} className="mt-3 space-y-2 rounded-lg border border-accent/40 p-2 text-ui-11">
            <div className="flex flex-wrap items-center gap-3">
                {reserve && armes.length > 0 && (
                    <label className="flex items-center gap-1" title="Les armes que le livre donne à cet adversaire, lues au catalogue du pilote.">Arme
                        <select aria-label="Arme" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={armeChoisie}
                            onChange={e => {
                                setArmeChoisie(e.target.value);
                                const a = armes.find(x => x.libelle === e.target.value);
                                if (a) setArme(String(a.degats));
                            }}>
                            {armes.map(a => <option key={a.libelle} value={a.libelle}>{a.libelle} ({a.degats})</option>)}
                        </select>
                    </label>
                )}
                {reserve ? (
                    <label className="flex items-center gap-1">Dégâts de l’arme
                        <input aria-label="Dégâts de l’arme" className={champ} type="number" min={0} value={arme} onChange={e => setArme(e.target.value)} />
                    </label>
                ) : (
                    <label className="flex items-center gap-1">Dégâts
                        <input aria-label="Dégâts" className={champ} type="number" min={0} value={saisi} onChange={e => setSaisi(e.target.value)} />
                    </label>
                )}
                {!regleAlien && (
                    <label className="flex items-center gap-1" title="Ce que la protection de la cible retire : le jet de protection de Blade Runner.">
                        Protection retirée
                        <input aria-label="Protection retirée" className={champ} type="number" min={0} value={protection} onChange={e => setProtection(e.target.value)} />
                    </label>
                )}
                {!regleAlien && protectionDeLaCible && (
                    <button type="button" onClick={lancerLaProtection} data-lancer-la-protection
                        title="À chaque coup subi : chaque réussite retire un point de dégâts. Pas contre les dégâts d’un forçage."
                        className="flex items-center gap-1 rounded border border-app-border/60 px-2 py-0.5 hover:border-accent/50 hover:text-accent">
                        <Shield size={11} /> {protectionDeLaCible.nom} de {cible.name} : {protectionDeLaCible.nombre}D{protectionDeLaCible.faces}
                    </button>
                )}
                {/* Alien : le coup préparé ne porte pas de type de dégâts ; sa propriété contre l'armure suffit. */}
                {!regleAlien && types.length > 1 && (
                    <label className="flex items-center gap-1">Type
                        <select aria-label="Type de dégâts" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={type} onChange={e => setType(e.target.value)}>
                            {types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </label>
                )}
            </div>
            {protectionLancee && <p data-protection-lancee className="text-app-muted">{protectionLancee}</p>}
            <p data-calcul-du-coup className="text-app-muted">
                {coup.calcul}
                {coup.raison === 'arme-inconnue' && ' — saisir les dégâts de l’arme.'}
                {coup.raison === 'montant-a-saisir' && ' — saisir les dégâts.'}
            </p>
            {refus && <p data-refus-du-coup className="text-etat-alerte">{refus}</p>}
            {deja ? (
                regleAlien ? (
                    <p data-coup-prepare className="font-black text-etat-succes">
                        Coup de {deja.montant} préparé sur la carte de {cible.name} : y lancer sa Protection, puis appliquer les dégâts restants.
                    </p>
                ) : (
                    <p data-coup-applique className="font-black text-etat-succes">
                        {deja.montant} dégât{deja.montant > 1 ? 's' : ''} appliqué{deja.montant > 1 ? 's' : ''} à {cible.name}. Un nouveau jet rouvre le geste.
                    </p>
                )
            ) : coup.raison === 'rate' || coup.montant === 0 ? (
                <p data-coup-nul className="text-app-muted">Rien à appliquer à {cible.name}.</p>
            ) : (
                <button type="button" onClick={appliquer} disabled={coup.montant === null}
                    className="flex items-center gap-1.5 rounded-lg border border-accent/60 px-3 py-1 font-black uppercase tracking-wider text-accent disabled:opacity-40">
                    <Swords size={12} /> {regleAlien ? `Préparer ce coup de ${coup.montant ?? '…'} sur ${cible.name}` : `Appliquer ${coup.montant ?? '…'} à ${cible.name}`}
                </button>
            )}
        </section>
    );
};
