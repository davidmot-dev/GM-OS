import React, { useState } from 'react';
import { Swords } from 'lucide-react';
import { useCombatStore } from '../useCombatStore';
import { DiceEngine } from '../../dice/DiceEngine';
import { ecrireLaFicheDuCombattant, valeursDuCombattant } from '../ficheDesCombattants';
import { coupDArgyropee, protectionsDArgyropee, type ArmeDArgyropee } from '../logic/attaqueDeLAdversaire';
import { lancerLaFormule, lireLaFormule } from '../../dice/systemes/symbaroumRegles';

/**
 * **Les dégâts d'une attaque d'Argyropée, portés sur la cible** (registre § 267, T7, 23/11/2026).
 *
 * L'attaque est un test simple (p. 48) : touché sur toute réussite, même partielle. La cible ne se défend
 * que si elle a **déclaré une parade** à son tour : son test d'Agilité réussi annule la blessure (p. 49).
 * Les dégâts sont le dé de l'arme ; sur une réussite critique, le dé se lance deux fois — ou une fois, avec
 * une manœuvre gratuite (p. 49). La protection X/Y de la cible absorbe X par coup, bouclier d'abord, et
 * chaque pièce atteinte perd 1 de Y ; un coup de poing ou de pied ne l'use pas (p. 52).
 *
 * Deux écritures, chacune par son écrivain : la santé par `applyDamage([cible])`, l'usure de la protection
 * sur la fiche de la cible par `ecrireLaFicheDuCombattant`. Une fois par jet.
 */
export const DegatsDArgyropee: React.FC<{
    cibleId: string;
    armes: readonly ArmeDArgyropee[];
    reussie: boolean;
    critique: boolean;
}> = ({ cibleId, armes, reussie, critique }) => {
    const porteur = useCombatStore(s => s.combatants.find(c => c.id === cibleId));
    const [armeChoisie, setArmeChoisie] = useState(armes[0]?.index ?? 0);
    const arme = armes.find(a => a.index === armeChoisie);
    const [formule, setFormule] = useState(arme?.formule ?? '1d4');
    const [double, setDouble] = useState(critique);
    const [parade, setParade] = useState(false);
    const [solide, setSolide] = useState(true);
    const [lance, setLance] = useState<{ total: number; detail: string } | null>(null);
    const [fait, setFait] = useState<string | null>(null);
    if (!porteur) return <p data-degats-argyropee className="text-app-muted">La cible n’est plus sur le plateau.</p>;
    if (!reussie) return <p data-degats-argyropee data-coup-nul className="text-app-muted">Attaque manquée : pas de dégâts.</p>;

    const naturel = arme?.competence === 'rixe' && /poing|pied|mains? nues?/i.test(arme.libelle);
    const pieces = protectionsDArgyropee(valeursDuCombattant(porteur));
    const coup = lance ? coupDArgyropee(lance.total, pieces, { solide, naturel }) : null;

    const lancer = () => {
        const f = lireLaFormule(formule);
        if (!f) return;
        const doublee = double ? { ...f, des: f.des.map(d => ({ ...d, nombre: d.nombre * 2 })) } : f;
        const r = lancerLaFormule(doublee, faces => DiceEngine.roll(faces));
        setLance({ total: r.total, detail: r.detail });
        setFait(null);
    };
    const appliquer = () => {
        if (!coup || fait) return;
        if (coup.nets > 0) useCombatStore.getState().applyDamage(coup.nets, solide ? 'solide' : 'élémentaire', [cibleId]);
        if (coup.usures.length) {
            ecrireLaFicheDuCombattant(porteur, Object.fromEntries(coup.usures.map(u => [`protection${u.index}_valeur`, `${u.x}/${Math.max(0, u.y)}`])));
        }
        const usees = coup.usures.map(u => `${u.nom} ${u.x}/${Math.max(0, u.y)}${u.y <= 0 ? ' — hors d’usage' : ''}`).join(', ');
        setFait(`${coup.nets} dégât${coup.nets > 1 ? 's' : ''} à ${porteur.name}${usees ? ` ; usure : ${usees}` : ''}.`);
    };

    const champ = 'w-20 rounded border border-app-border bg-app-bg px-1 py-0.5 text-center';
    const bouton = 'flex items-center gap-1 rounded border border-app-border/60 px-2 py-0.5 hover:border-accent/50 hover:text-accent disabled:opacity-40';
    return (
        <section data-degats-argyropee={cibleId} className="mt-3 space-y-2 rounded-lg border border-accent/40 p-2 text-ui-11">
            <div className="flex flex-wrap items-center gap-3">
                {armes.length > 0 && (
                    <label className="flex items-center gap-1">Arme
                        <select aria-label="Arme d’Argyropée" className="rounded border border-app-border bg-app-bg px-1 py-0.5" value={armeChoisie}
                            onChange={e => { const a = armes.find(x => x.index === Number(e.target.value)); setArmeChoisie(Number(e.target.value)); if (a) setFormule(a.formule); }}>
                            {armes.map(a => <option key={a.index} value={a.index}>{a.libelle} ({a.formule})</option>)}
                        </select>
                    </label>
                )}
                <label className="flex items-center gap-1" title="1d4 pour les armes courantes et l’improvisé, 1d6 pour les lourdes et à feu (p. 49).">Dégâts
                    <input aria-label="Dégâts de l’arme" className={champ} value={formule} onChange={e => setFormule(e.target.value)} />
                </label>
                {critique && (
                    <label className="flex items-center gap-1" title="Réussite critique : deux fois le dé, ou une fois avec une manœuvre gratuite (p. 49).">
                        <input type="checkbox" checked={double} onChange={e => setDouble(e.target.checked)} /> Critique : deux fois le dé
                    </label>
                )}
                <label className="flex items-center gap-1" title="Feu, froid, acide, électricité : la protection n’absorbe rien, mais s’use (p. 52).">
                    <input type="checkbox" checked={solide} onChange={e => setSolide(e.target.checked)} /> Arme solide
                </label>
                <label className="flex items-center gap-1" title="Déclarée à son tour, la parade permet un test d’Agilité ; réussi, la blessure est annulée (p. 49).">
                    <input type="checkbox" checked={parade} onChange={e => setParade(e.target.checked)} /> {porteur.name} pare (Agilité réussie)
                </label>
            </div>
            {parade ? (
                <p data-parade-reussie className="font-black text-etat-succes">{porteur.name} esquive : la blessure est annulée (p. 49).</p>
            ) : (
                <>
                    <div className="flex flex-wrap items-center gap-3">
                        <button type="button" className={bouton} onClick={lancer} disabled={!lireLaFormule(formule)} data-lancer-les-degats-argyropee>
                            <Swords size={11} /> Lancer {double && critique ? 'deux fois ' : ''}{formule}
                        </button>
                        <span className="text-app-muted">
                            Protection de {porteur.name} : {pieces.length ? pieces.map(p => `${p.nom} ${p.x}/${p.y}${p.bouclier ? ' (bouclier, d’abord)' : ''}`).join(', ') : 'aucune'}
                        </span>
                    </div>
                    {lance && coup && (
                        <p data-calcul-argyropee className="text-app-muted">
                            {lance.detail} = {lance.total}{coup.calcul ? ` ${coup.calcul}` : ''} = {coup.nets} dégât{coup.nets > 1 ? 's' : ''}
                            {coup.usures.length ? ` ; usure : ${coup.usures.map(u => `${u.nom} ${u.y + 1} → ${Math.max(0, u.y)}`).join(', ')}` : naturel ? ' ; un coup de poing ou de pied n’use pas la protection' : ''}
                        </p>
                    )}
                    {fait ? (
                        <p data-coup-applique className="font-black text-etat-succes">{fait}</p>
                    ) : lance && coup && (
                        <button type="button" onClick={appliquer}
                            className="flex items-center gap-1.5 rounded-lg border border-accent/60 px-3 py-1 font-black uppercase tracking-wider text-accent">
                            <Swords size={12} /> Appliquer {coup.nets} à {porteur.name}{coup.usures.length ? ' et user sa protection' : ''}
                        </button>
                    )}
                </>
            )}
        </section>
    );
};
