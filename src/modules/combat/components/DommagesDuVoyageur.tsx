import React, { useState } from 'react';
import { useCombatStore } from '../useCombatStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES, type SheetTemplate } from '../../../data/defaultSheetTemplates';
import { ficheDuCombattant } from '../logic/ficheDuCombattant';
import { estUneFicheDeVoyageur } from '../../session/logic/ficheDeVoyageur';
import { CONDITIONS_DU_VOYAGEUR, armeParDefaut, armesDOffense, domTotal, protectionDuVoyageur, type ConditionDuVoyageur } from '../logic/dommagesDuVoyageur';
import { SanteDuCombattantVoyageur } from './SanteDuCombattantVoyageur';

/**
 * **Le coup d'un adversaire de Rêve de Dragon, jusqu'à l'encaissement de sa cible** (registre § 267, T15,
 * 23/11/2026). Sous le panneau, l'arme et son +dom, le +dom personnel, la particulière en force et la
 * condition donnent le **+dom total** (p. 125-129) ; puis le suivi de santé **de la cible** s'ouvre sur
 * « Encaisser une agression », +dom et protection remplis : c'est lui qui tire les 2d10, lit la table et
 * écrit la fiche, comme depuis la carte (`SanteDuCombattantVoyageur`). Rien ne s'écrit ici.
 */
const champ = 'rounded border border-app-border bg-app-bg px-1 py-0.5';

export const DommagesDuVoyageur: React.FC<{
    cibleId: string;
    gabarit: SheetTemplate;
    valeursDeLAttaquant: Record<string, unknown>;
    reussie: boolean;
    particuliere: boolean;
}> = ({ cibleId, gabarit, valeursDeLAttaquant, reussie, particuliere }) => {
    const porteur = useCombatStore(s => s.combatants.find(c => c.id === cibleId));
    const players = useSessionOSStore(s => s.players);
    const entities = useSessionOSStore(s => s.entities);
    const customSheetTemplates = useSessionOSStore(s => s.customSheetTemplates);
    const armes = armesDOffense(valeursDeLAttaquant, gabarit);
    // La même arme que l'attaque proposée : celle que le PNJ porte, pas le premier emplacement vide.
    const [cle, setCle] = useState(armeParDefaut(armes, valeursDeLAttaquant)?.cle ?? '');
    const arme = armes.find(a => a.cle === cle) ?? armes[0];
    const [dom, setDom] = useState(arme?.dom !== undefined ? String(arme.dom) : '');
    const [enForce, setEnForce] = useState(particuliere);
    const [condition, setCondition] = useState<ConditionDuVoyageur>('aucune');
    if (!porteur) return <p data-dommages-du-voyageur className="text-app-muted">La cible n’est plus sur le plateau.</p>;
    if (!reussie) return <p data-dommages-du-voyageur data-coup-nul className="text-app-muted">L’attaque échoue : pas d’encaissement.</p>;

    const source = porteur.isPlayer ? players.flatMap(p => p.characters).find(c => c.id === porteur.sourcePlayerId)
        : entities.find(e => e.id === porteur.sourceEntityId);
    const lue = ficheDuCombattant(porteur, source, [...DEFAULT_SHEET_TEMPLATES, ...(customSheetTemplates ?? [])], gabarit.id);
    const ficheDeLaCible = lue.gabarit && estUneFicheDeVoyageur(lue.gabarit) ? lue.gabarit : null;
    const domArme = Number(dom);
    const total = arme && dom.trim() !== '' && Number.isFinite(domArme)
        ? domTotal({ categorie: arme.categorie, domArme, domPersonnel: Number(valeursDeLAttaquant.plus_dom) || 0, enForce, condition })
        : null;

    return (
        <section data-dommages-du-voyageur className="mt-3 space-y-2 rounded-lg border border-accent/40 p-2 text-ui-11">
            <div className="flex flex-wrap items-center gap-3">
                {armes.length > 0 && (
                    <label className="flex items-center gap-1">Arme
                        <select aria-label="Arme du Voyageur" className={champ} value={arme?.cle ?? ''} onChange={e => {
                            const a = armes.find(x => x.cle === e.target.value);
                            setCle(e.target.value);
                            setDom(a?.dom !== undefined ? String(a.dom) : '');
                        }}>
                            {armes.map(a => <option key={a.cle} value={a.cle}>{a.nom}{a.dom !== undefined ? ` (+dom ${a.dom})` : ''}</option>)}
                        </select>
                    </label>
                )}
                <label className="flex items-center gap-1" title="Le +dom de l’arme, lu sur la ligne de combat de la fiche.">+dom de l’arme
                    <input aria-label="+dom de l’arme" type="number" className={`w-14 ${champ}`} value={dom} onChange={e => setDom(e.target.value)} />
                </label>
                <label className="flex items-center gap-1" title="Si la défense est manquée : +5. Au tir et au lancer, une particulière est toujours en force (p. 125-126).">
                    <input type="checkbox" checked={enForce} onChange={e => setEnForce(e.target.checked)} /> Particulière en force (+5)
                </label>
                {arme?.categorie === 'melee' && (
                    <label className="flex items-center gap-1" title="Les bonus de condition ne valent qu’en mêlée (p. 129).">Condition
                        <select aria-label="Condition de l’attaque" className={champ} value={condition} onChange={e => setCondition(e.target.value as ConditionDuVoyageur)}>
                            {CONDITIONS_DU_VOYAGEUR.map(c => <option key={c.cle} value={c.cle}>{c.libelle}</option>)}
                        </select>
                    </label>
                )}
            </div>
            <p data-dom-total className="text-app-muted">
                {total ? `${total.calcul}${arme?.nonMortel ? ' — entre parenthèses : Coups non mortels' : ''} (p. 128-129).` : 'Saisir le +dom de l’arme.'}
            </p>
            {total && (ficheDeLaCible ? (
                <SanteDuCombattantVoyageur key={`${total.total}-${arme?.nonMortel}`} combattant={porteur} fiche={ficheDeLaCible} donnees={lue.valeurs}
                    encaissementPropose={{ dommages: total.total, protection: protectionDuVoyageur(lue.valeurs), nonMortel: !!arme?.nonMortel }} />
            ) : (
                <p className="text-app-muted">{porteur.name} n’a pas de fiche de Voyageur : encaisser à la main, +dom {total.total}.</p>
            ))}
        </section>
    );
};
