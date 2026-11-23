import React, { useState } from 'react';
import { Shield, Swords } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { DiceEngine, type RollResult } from '../../dice/DiceEngine';
import { coupAAppliquer, desBonusDeTorg, lancerLesDegatsDeBarbarians, lancerLesDesBonus, preparerLeCoupAlien, type ArmeDeBarbarians, type ArmeProposee } from '../logic/attaqueDeLAdversaire';
import { regleDesDegats, type RegleDesDegatsDuJeu } from '../logic/jetDuCombattant';
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
    resultat: Pick<RollResult, 'total' | 'successes' | 'compte'> & { vampire?: { marge?: number }; barbarians?: { bilan?: string };
        shadowrun?: { nets?: number; reussi?: boolean }; tagSuccess?: boolean; degre?: string };
    driver: Pick<GameDriver, 'combat' | 'jet'> | null | undefined;
    /** T9 : les armes que le catalogue connaît pour cet adversaire ; la première est proposée. */
    armes?: readonly ArmeProposee[];
    /** T9 : la protection que porte la cible (Blade Runner) ; un bouton la lance. */
    protectionDeLaCible?: ProtectionLue | null;
    /** T12 : l'attaque est perforante (une attaque de créature qui le dit) — perce-armure chez Alien. */
    perforant?: boolean;
    /**
     * § 267, T0 : la règle des dégâts, quand l'appelant la connaît mieux que le pilote actif — l'attaque
     * d'une créature d'Alien (`AttaqueDeCreature`) est toujours « arme + succès − 1 ». Sinon, celle du jeu.
     */
    regle?: RegleDesDegatsDuJeu;
    /** § 267, T14 : NOC — la Constitution et l'Armure de la cible, lues sur sa fiche (p. 252). */
    noc?: { constitution: number; armure: number };
    /** § 267, T4 : les armes et la Vigueur de l'attaquant de Barbarians of Lemuria, lues sur sa fiche. */
    barbarians?: { armes: readonly ArmeDeBarbarians[]; vigueur: number };
}> = ({ cible, resultat, driver, armes = [], protectionDeLaCible, perforant = false, regle: regleImposee, barbarians, noc }) => {
    const [refus, setRefus] = useState<string | null>(null);
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
    // § 267, T14 : NOC — le trait vient de l'arme (« sans trait » possible) : Choc ne doit pas être choisi d'office.
    const traitDeLArme = (a?: ArmeProposee) => (a?.categorie && types.includes(a.categorie) ? a.categorie : '');
    const [type, setType] = useState((regleImposee ?? regleDesDegats(driver)) === 'arme-moins-constitution' ? traitDeLArme(armes[0]) : types[0] ?? '');
    const [appliquePour, setAppliquePour] = useState<{ resultat: object; montant: number } | null>(null);

    const nombre = (s: string) => (s.trim() === '' ? undefined : Number(s));
    // § 267, T0 : la règle des dégâts vient du jeu ; « arme + succès − 1 » seulement là où il la déclare.
    const regle = regleImposee ?? regleDesDegats(driver);
    // § 267, T1 : Vampire — la marge plus le bonus de l'arme ; l'armure change le type, elle ne retire rien (p. 126).
    const margeEtArme = regle === 'marge-plus-arme';
    // § 267, T10 : Shadowrun — la VD de l'arme + succès nets ; l'armure est dans les seuils de la cible (p. 66-68).
    const vdEtNets = regle === 'vd-plus-nets';
    // § 267, T12 : Torg — l'arme plus les Dés Bonus d'un succès Supérieur ou Spectaculaire (p. 115-116).
    const armeEtDB = regle === 'arme-plus-des-bonus';
    // § 267, T14 : NOC — l'arme, la Précision, moins la Constitution et l'Armure de la cible (p. 232, 252).
    const armeMoinsConstitution = regle === 'arme-moins-constitution';
    const [precision, setPrecision] = useState('0');
    const desBonus = armeEtDB ? desBonusDeTorg(resultat.degre) : 0;
    const [bonusLances, setBonusLances] = useState<{ pour: object; total: number; detail: string } | null>(null);
    const bonusDuJet = bonusLances?.pour === resultat ? bonusLances : null;
    /*
      **Barbarians of Lemuria (§ 267, T4, 23/11/2026)** : le dé de l'arme (d3, d6M, d6, d6B) plus la
      Vigueur, ou sa moitié à distance et à mains nues ; +6 pour un Coup dévastateur, offert sur un succès
      héroïque ou légendaire (p. 56-60, 62-63). Le total lancé devient le montant, dont l'armure se retire.
    */
    const deDeLArme = regle === 'de-de-l-arme';
    const armesBoL = barbarians?.armes ?? [];
    const ajoutParDefaut = (f: string) => !/[+-]\s*\d+\s*$/.test(f);
    const [formule, setFormule] = useState(armesBoL[0]?.formule ?? 'd6');
    const [armeBoL, setArmeBoL] = useState(armesBoL[0]?.libelle ?? '');
    const [moitie, setMoitie] = useState(!!armesBoL[0]?.distance);
    const [ajouterLaVigueur, setAjouterLaVigueur] = useState(ajoutParDefaut(armesBoL[0]?.formule ?? 'd6'));
    const [vigueur, setVigueur] = useState(String(barbarians?.vigueur ?? 0));
    const exploit = resultat.barbarians?.bilan === 'succes-heroique' || resultat.barbarians?.bilan === 'succes-legendaire';
    const [devastateur, setDevastateur] = useState(false);
    const [degatsLances, setDegatsLances] = useState<{ pour: object; total: number; calcul: string } | null>(null);
    const lances = degatsLances?.pour === resultat ? degatsLances : null;
    const lancerLesDegats = () => {
        const r = lancerLesDegatsDeBarbarians(formule, {
            vigueur: Number(vigueur) || 0, moitie, ajouterLaVigueur, devastateur: exploit && devastateur,
        }, () => DiceEngine.roll(6));
        if (!r) { setRefus(`« ${formule} » n’est pas un dé d’arme du livre (d3, d6M, d6, d6B, avec un bonus).`); return; }
        setRefus(null);
        setDegatsLances({ pour: resultat, ...r });
    };
    const coup = coupAAppliquer({
        resultat, regle, degatsDeLArme: nombre(arme), marge: resultat.vampire?.marge,
        touche: armeEtDB ? !!resultat.tagSuccess : resultat.shadowrun?.reussi, nets: resultat.shadowrun?.nets,
        desBonus, bonusLance: bonusDuJet?.total,
        ...(armeMoinsConstitution ? { touche: !!resultat.tagSuccess, precision: nombre(precision), constitution: noc?.constitution, armure: noc?.armure, trait: type } : {}),
        montantSaisi: deDeLArme ? lances?.total : nombre(saisi),
        protection: regleAlien || margeEtArme || vdEtNets || armeEtDB || armeMoinsConstitution ? 0 : nombre(protection),
    });
    const reserve = regle === 'arme-plus-succes' && resultat.compte === 'reussites';
    const parLArme = reserve || margeEtArme || vdEtNets || armeEtDB || armeMoinsConstitution;
    const deja = appliquePour?.resultat === resultat ? appliquePour : null;
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
                {parLArme && armes.length > 0 && (
                    <label className="flex items-center gap-1" title="Les armes que le livre donne à cet adversaire, lues au catalogue du pilote.">Arme
                        <select aria-label="Arme" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={armeChoisie}
                            onChange={e => {
                                setArmeChoisie(e.target.value);
                                const a = armes.find(x => x.libelle === e.target.value);
                                if (a) setArme(String(a.degats));
                                if (a && armeMoinsConstitution) setType(traitDeLArme(a));
                            }}>
                            {armes.map(a => <option key={a.libelle} value={a.libelle}>{a.libelle} ({a.degats})</option>)}
                        </select>
                    </label>
                )}
                {deDeLArme ? (
                    <>
                        {armesBoL.length > 0 && (
                            <label className="flex items-center gap-1" title="Les armes de la fiche de l’attaquant (Arme et Dégâts).">Arme
                                <select aria-label="Arme de Barbarians" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={armeBoL}
                                    onChange={e => {
                                        const a = armesBoL.find(x => x.libelle === e.target.value);
                                        setArmeBoL(e.target.value);
                                        if (a) { setFormule(a.formule); setMoitie(a.distance); setAjouterLaVigueur(ajoutParDefaut(a.formule)); }
                                    }}>
                                    {armesBoL.map(a => <option key={a.libelle} value={a.libelle}>{a.libelle} ({a.formule})</option>)}
                                </select>
                            </label>
                        )}
                        <label className="flex items-center gap-1" title="d3 ; d6M : deux d6, le pire ; d6 ; d6B : deux d6, le meilleur — avec son bonus, et « x2 » pour une grande créature (p. 49-53, 108).">Dé de l’arme
                            <input aria-label="Dé de l’arme" className="w-20 rounded border border-app-border bg-app-bg px-1 py-0.5 text-center" value={formule}
                                onChange={e => { setFormule(e.target.value); setAjouterLaVigueur(ajoutParDefaut(e.target.value)); }} />
                        </label>
                        <label className="flex items-center gap-1">Vigueur
                            <input aria-label="Vigueur de l’attaquant" className={champ} type="number" value={vigueur} onChange={e => setVigueur(e.target.value)} />
                        </label>
                        <label className="flex items-center gap-1" title="Les PNJ du livre écrivent leur Vigueur dans le bonus (« d6B+2 ») et les créatures n’en ajoutent pas (p. 108, 133) : décoché pour eux.">
                            <input type="checkbox" checked={ajouterLaVigueur} onChange={e => setAjouterLaVigueur(e.target.checked)} /> Ajouter la Vigueur
                        </label>
                        <label className="flex items-center gap-1" title="À distance et à mains nues, la moitié de la Vigueur, arrondie à l’inférieur (p. 62).">
                            <input type="checkbox" checked={moitie} onChange={e => setMoitie(e.target.checked)} /> Moitié (distance, mains nues)
                        </label>
                        {exploit && (
                            <label className="flex items-center gap-1" title="Succès héroïque : le Coup dévastateur ajoute 6 aux dégâts (p. 56-60).">
                                <input type="checkbox" checked={devastateur} onChange={e => setDevastateur(e.target.checked)} /> Coup dévastateur (+6)
                            </label>
                        )}
                        {(resultat.successes ?? 0) >= 1 && (
                            <button type="button" onClick={lancerLesDegats} data-lancer-les-degats-bol
                                className="flex items-center gap-1 rounded border border-app-border/60 px-2 py-0.5 hover:border-accent/50 hover:text-accent">
                                <Swords size={11} /> Lancer les dégâts
                            </button>
                        )}
                    </>
                ) : armeMoinsConstitution ? (
                    <>
                        <label className="flex items-center gap-1" title="Constitution + N au contact, une valeur fixe à distance (p. 250).">Dégâts de l’arme
                            <input aria-label="Dégâts de l’arme" className={champ} type="number" value={arme} onChange={e => setArme(e.target.value)} />
                        </label>
                        <label className="flex items-center gap-1" title="Chaque niveau de marge de réussite mis en Précision ajoute 1 point de Blessures (p. 232).">Précision
                            <input aria-label="Précision" className={champ} type="number" min={0} value={precision} onChange={e => setPrecision(e.target.value)} />
                        </label>
                    </>
                ) : armeEtDB ? (
                    <>
                        <label className="flex items-center gap-1" title="Arme à feu : valeur fixe ; arme de mêlée : Force + valeur ; mains nues : Force (p. 116).">Dommages de l’arme
                            <input aria-label="Dommages de l’arme" className={champ} type="number" min={0} value={arme} onChange={e => setArme(e.target.value)} />
                        </label>
                        {desBonus > 0 && (
                            <button type="button" data-lancer-les-des-bonus onClick={() => setBonusLances({ pour: resultat, ...lancerLesDesBonus(desBonus, () => DiceEngine.roll(6)) })}
                                className="flex items-center gap-1 rounded border border-app-border/60 px-2 py-0.5 hover:border-accent/50 hover:text-accent">
                                <Swords size={11} /> Lancer {desBonus} Dé{desBonus > 1 ? 's' : ''} Bonus
                            </button>
                        )}
                    </>
                ) : vdEtNets ? (
                    <label className="flex items-center gap-1" title="La VD de base de l’arme ou du sort, lue sur la fiche de l’attaquant (p. 66-67).">VD de l’arme
                        <input aria-label="VD de l’arme" className={champ} type="number" min={0} value={arme} onChange={e => setArme(e.target.value)} />
                    </label>
                ) : margeEtArme ? (
                    <label className="flex items-center gap-1" title="De +0 (improvisée, pieu) à +4 (à feu lourde, mêlée imposante), p. 304.">Bonus de l’arme
                        <input aria-label="Bonus de l’arme" className={champ} type="number" min={0} value={arme} onChange={e => setArme(e.target.value)} />
                    </label>
                ) : reserve ? (
                    <label className="flex items-center gap-1">Dégâts de l’arme
                        <input aria-label="Dégâts de l’arme" className={champ} type="number" min={0} value={arme} onChange={e => setArme(e.target.value)} />
                    </label>
                ) : (
                    <label className="flex items-center gap-1">Dégâts
                        <input aria-label="Dégâts" className={champ} type="number" min={0} value={saisi} onChange={e => setSaisi(e.target.value)} />
                    </label>
                )}
                {!regleAlien && !margeEtArme && !vdEtNets && !armeEtDB && !armeMoinsConstitution && (
                    <label className="flex items-center gap-1" title="Ce que la protection de la cible retire : le jet de protection de Blade Runner.">
                        Protection retirée
                        <input aria-label="Protection retirée" className={champ} type="number" min={0} value={protection} onChange={e => setProtection(e.target.value)} />
                    </label>
                )}
                {!regleAlien && !margeEtArme && !vdEtNets && !armeEtDB && !armeMoinsConstitution && protectionDeLaCible && (
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
                            {armeMoinsConstitution && <option value="">— sans trait —</option>}
                            {types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </label>
                )}
            </div>
            {protectionLancee && <p data-protection-lancee className="text-app-muted">{protectionLancee}</p>}
            {margeEtArme && (
                <p data-types-de-vampire className="text-app-muted">
                    Le type : sur un mortel, lames, balles et feu font des aggravés, les coups contondants des superficiels ; sur un vampire,
                    les armes courantes font des superficiels divisés par deux, le feu, le soleil et les crocs des aggravés. Chaque point
                    d’armure change un aggravé de lame ou de balle en superficiel (p. 126, 304).
                </p>
            )}
            {armeMoinsConstitution && (
                <p data-blessures-de-noc className="text-app-muted">
                    Constitution {noc?.constitution ?? 0} et Armure {noc?.armure ?? 0} de {cible.name}, lues sur sa fiche (p. 252) ; Tranchant,
                    au moins 1, Perforant au moins 2 contre une cible sans armure ; Choc ne blesse pas (p. 251).
                </p>
            )}
            {armeEtDB && (
                <p data-des-bonus-de-torg className="text-app-muted">
                    {bonusDuJet ? `Dés Bonus : ${bonusDuJet.detail} = ${bonusDuJet.total} (un 6 vaut 5 et se relance). ` : ''}
                    Le total se compare à la Résistance de {cible.name} : Choc et Blessures selon la Table des Dommages (p. 116).
                </p>
            )}
            {vdEtNets && (
                <p data-vd-de-shadowrun className="text-app-muted">
                    La VD finale se compare aux seuils de {cible.name} selon le type : physique (armure principale), armure secondaire,
                    sans armure ou mental. Il faut les dépasser, et l’attaque ne fait qu’une blessure (p. 68).
                </p>
            )}
            {deDeLArme && lances && (
                <p data-degats-lances-bol className="text-app-muted">
                    Dégâts : {lances.calcul}. L’armure de {cible.name} se retire ensuite : légère d6−3 ou 1, moyenne d6−2 ou 2,
                    lourde d6−1 ou 3, +1 avec un casque (p. 63).
                </p>
            )}
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
