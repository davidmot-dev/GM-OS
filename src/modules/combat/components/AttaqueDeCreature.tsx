import React, { useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { DiceEngine, type RollResult } from '../../dice/DiceEngine';
import { useDiceStore } from '../../../stores/useDiceStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { AppliquerALaCible } from './AppliquerALaCible';
import { CLE_COMBAT_ALIEN, lireLeCombatAlien } from '../../dice/systemes/combatAlien';
import { entreesDesLignes } from '../../dice/systemes/xenomorphesAlien';
import { pontDesTables } from '../../tables/pontDesTables';
import { attaqueDesEntrees, lireLaReserveDeLAttaque, type AttaqueTiree } from '../logic/attaqueDeLAdversaire';
import { ecrireLaFicheDuCombattant } from '../ficheDesCombattants';
import type { Combatant } from '../types';

/**
 * **L'attaque d'une créature d'Alien** — registre § 263, T10 (19/11/2026). David : « les lancer de
 * dés des PNJ/Créatures […] ce n'est pas toujours intuitif ».
 *
 * Le tirage existait déjà sur la carte, replié dans « Xénomorphe — actif » (`XenomorpheAlien.tsx`,
 * « Tirer une attaque spéciale D6 ») : « Attaquer » le met au premier plan, la cible de la carte en
 * tête. Mêmes sources, dans le même ordre : les attaques propres de l'espèce (bestiaire du pilote)
 * avant la table du jeu (`pontDesTables`). Même trace : l'attaque tirée s'écrit dans le suivi du
 * xénomorphe (`xenomorphe.attaque`, que la carte affiche), par la seule porte d'écriture de la fiche
 * d'un combattant (`ecrireLaFicheDuCombattant`), et se dit au journal par le dernier jet.
 *
 * Un dé qu'aucune ligne ne couvre, ou une table introuvable, se disent : rien n'est tiré en silence.
 *
 * **T11** (même jour) : quand l'effet tiré dit « N dés de base, Dégâts M » (`lireLaReserveDeLAttaque`),
 * « Lancer N dés » lance la réserve Year Zero de la créature (dés de base seuls, sans Stress), la dit
 * au journal, puis « Appliquer à [cible] » (T7) prend l'attaque comme arme : Dégâts M + succès − 1,
 * moins la protection saisie. Un test opposé ou une attaque perforante se signalent ; sans réserve
 * dans le texte, l'effet se résout tel quel.
 */
export const AttaqueDeCreature: React.FC<{
    combattant: Combatant;
    valeurs: Record<string, unknown>;
    cible?: Pick<Combatant, 'id' | 'name'> | null;
}> = ({ combattant, valeurs, cible }) => {
    const [choix, setChoix] = useState(1);
    const [tiree, setTiree] = useState<(AttaqueTiree & { source: string; tirage: number }) | null>(null);
    // T11 : le jet de l'attaque (« N dés de base »), relancé à chaque attaque tirée.
    const [jet, setJet] = useState<RollResult | null>(null);
    const [avis, setAvis] = useState<string | null>(null);
    const enCours = useRef(false);
    const driver = useSessionOSStore(s => s.getActiveDriver());
    const x = lireLeCombatAlien(valeurs).xenomorphe;
    if (!x) return null;
    const desLignes = !!x.lignes?.length;
    const source = desLignes ? 'les attaques propres de l’espèce (bestiaire du livre)' : `la table Alien / ${x.table.replaceAll('_', ' ')}`;

    const tirer = async (aleatoire: boolean) => {
        if (enCours.current) return;
        enCours.current = true;
        try {
            const entrees = desLignes
                ? entreesDesLignes(x.lignes!)
                : (await pontDesTables()?.loadTable('Alien', x.table).catch(() => null))?.entries;
            if (!entrees?.length) { setAvis(`Table introuvable (${source}) : aucune attaque tirée.`); return; }
            const code = aleatoire ? DiceEngine.roll(6) : choix;
            const attaque = attaqueDesEntrees(entrees, code);
            if (!attaque) { setAvis(`Aucune attaque pour un ${code} dans ${source}.`); return; }
            setAvis(null);
            setJet(null);
            setTiree(t => ({ ...attaque, source, tirage: (t?.tirage ?? 0) + 1 }));
            // Le suivi du xénomorphe, relu au moment d'écrire : la carte affiche cette attaque.
            const suivi = lireLeCombatAlien(valeurs);
            ecrireLaFicheDuCombattant(combattant, {
                [CLE_COMBAT_ALIEN]: { ...suivi, xenomorphe: { ...suivi.xenomorphe!, attaque: { code, titre: attaque.nom, effet: attaque.effet } } },
            });
            const texte = `D6 ${code} — ${attaque.nom}${attaque.effet ? ` : ${attaque.effet}` : ''}`;
            useDiceStore.getState().setLastRoll({
                id: `attaque-${combattant.id}-${Date.now()}`, timestamp: new Date(),
                title: `${combattant.name} — Attaque${cible ? ` sur ${cible.name}` : ''}${aleatoire ? '' : ' (choisie)'}`,
                total: code, modifier: 0, rolls: [{ val: code, sides: 6 }], totalDisplay: texte,
            });
        } finally {
            enCours.current = false;
        }
    };

    // T11 : « huit dés de base, Dégâts 1 » lu dans l'effet tiré (`lireLaReserveDeLAttaque`, T3).
    const reserve = tiree ? lireLaReserveDeLAttaque(tiree.effet) : null;
    const lancerLaReserve = () => {
        if (!tiree || !reserve) return;
        const res = DiceEngine.rollYZE(reserve.des, 0);
        setJet(res);
        useDiceStore.getState().setLastRoll({
            ...res, id: `attaque-jet-${combattant.id}-${Date.now()}`, timestamp: new Date(),
            title: `${combattant.name} — ${tiree.nom} (${reserve.des} dés)${cible ? ` sur ${cible.name}` : ''}`,
        });
    };

    return (
        <section data-attaque-de-creature data-ouvert-sur-le-jet className="space-y-2 rounded-xl border border-accent/60 p-3">
            <h4 className="text-ui-10 font-black uppercase tracking-widest text-app-text">
                {cible ? `${combattant.name} attaque ${cible.name}` : `Attaque de ${combattant.name}`}
            </h4>
            {cible && (
                <p data-cible-de-l-attaque={cible.id} className="text-ui-11 text-app-muted">
                    Cible : <span className="font-black text-app-text">{cible.name}</span> — celle que vise la carte.
                </p>
            )}
            <p className="text-ui-11 text-app-muted">Tirée dans {source}.</p>
            <div className="flex flex-wrap items-center gap-2 text-ui-11">
                <button type="button" onClick={() => void tirer(true)} disabled={x.etat === 'mort'}
                    className="flex items-center gap-1.5 rounded-lg border border-accent/60 px-3 py-1 font-black uppercase tracking-wider text-accent disabled:opacity-40">
                    <Dices size={12} /> Tirer l’attaque (D6)
                </button>
                <label className="flex items-center gap-1" title="Le choix de Maman : le meneur décide de l’attaque au lieu de la tirer.">ou choisir
                    <select aria-label="Résultat choisi" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={choix} onChange={e => setChoix(Number(e.target.value))}>
                        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </label>
                <button type="button" onClick={() => void tirer(false)} disabled={x.etat === 'mort'}
                    className="rounded border border-app-border px-2 py-0.5 disabled:opacity-40">Prendre cette attaque</button>
            </div>
            {avis && <p data-avis-de-l-attaque className="text-ui-11 text-etat-alerte">{avis}</p>}
            {tiree && (
                <p data-attaque-tiree={tiree.code} className="rounded-lg border border-app-border/60 p-2 text-sm">
                    <span className="font-black">{tiree.code} — {tiree.nom}</span>
                    {tiree.effet ? <> : {tiree.effet}</> : null}
                </p>
            )}
            {tiree && reserve && (
                <div data-jet-de-l-attaque={reserve.des} className="space-y-2 text-ui-11">
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={lancerLaReserve}
                            className="flex items-center gap-1.5 rounded-lg border border-accent/60 px-3 py-1 font-black uppercase tracking-wider text-accent">
                            <Dices size={12} /> Lancer {reserve.des} dés{reserve.degats !== undefined ? ` — Dégâts ${reserve.degats}` : ''}
                        </button>
                        {jet && <span data-resultat-de-l-attaque className="font-black">{jet.totalDisplay}</span>}
                    </div>
                    {reserve.oppose && (
                        <p data-attaque-opposee className="text-etat-alerte">Test opposé : la cible oppose son propre jet (le texte de l’attaque dit lequel) ; comparer avant d’appliquer.</p>
                    )}
                    {reserve.perforant && (
                        <p data-attaque-perforante className="text-etat-alerte">Perforante : le coup se prépare perce-armure (la Protection de la cible compte pour moitié).</p>
                    )}
                    {jet && cible && (
                        // § 267, T0 : une créature d'Alien fait « dégâts de base + un par réussite supplémentaire ».
                        <AppliquerALaCible key={tiree.tirage} cible={cible} resultat={jet} driver={driver} perforant={reserve.perforant} regle="arme-plus-succes"
                            armes={reserve.degats !== undefined ? [{ libelle: tiree.nom, degats: reserve.degats }] : []} />
                    )}
                </div>
            )}
            {tiree && !reserve && (
                <p data-attaque-sans-jet className="text-ui-11 text-app-muted">Pas de « dés de base » dans cette attaque : son effet se résout tel quel.</p>
            )}
            {x.etat === 'mort' && <p className="text-ui-11 text-app-muted">La créature est morte : elle n’attaque plus.</p>}
        </section>
    );
};
