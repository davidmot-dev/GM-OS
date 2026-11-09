import React from 'react';
import { Panneau, Bouton } from '../../components/socle';
import { consignerLeJet } from '../journal/consignerLeJet';
import { OFFRANDE_DE_LA_GUIGNE, REPERE_DE_LA_GUIGNE, entierDArgyropee, type RegleDArgyropee } from './systemes/argyropee';

/**
 * **La Guigne d'Argyropée, au pupitre du Conteur** — 09/11/2026, à la demande de David
 * (« l'Exubérance, la Faveur divine, la Guigne, la magie et le dé de compétence des
 * PNJ »), réglée « repère + bouton ».
 *
 * Le livre ne veut pas de compte rigide (p. 177) : « il est inutile au Conteur de tenir
 * un compte secret […] car la Guigne est imprévisible », avec un exemple — à peu près
 * 6 points de Panache par joueur en moins d'une heure de jeu, pour rehausser des tests ;
 * la magie n'y compte pas. Le pupitre montre donc, par personnage, le Panache dépensé
 * aux tests depuis le réveil, **sans alerte ni couleur** : c'est au Conteur de juger.
 * Quand la péripétie est réglée, « Guigne réglée » offre 3 points à chaque joueur « au
 * prochain jet matinal de regain » — le bouton Réveil de la fiche les ajoute.
 */
interface PersonnageDuPupitre {
    joueurId: string;
    personnage: { id: string; name: string; sheetData?: Record<string, unknown> };
}

const GuigneDArgyropee: React.FC<{
    regle: RegleDArgyropee;
    personnages: readonly PersonnageDuPupitre[];
    ecrire: (joueurId: string, personnageId: string, champ: string, valeur: number) => void;
}> = ({ regle, personnages, ecrire }) => {
    const guigne = regle.guigne;
    if (!guigne) return null;
    const lire = (p: PersonnageDuPupitre, champ?: string) => (champ ? Math.max(0, entierDArgyropee(p.personnage.sheetData?.[champ])) : 0);
    const reglee = () => {
        for (const p of personnages) {
            ecrire(p.joueurId, p.personnage.id, guigne.offert, lire(p, guigne.offert) + OFFRANDE_DE_LA_GUIGNE);
            ecrire(p.joueurId, p.personnage.id, guigne.depense, 0);
        }
        consignerLeJet({
            titre: 'Guigne réglée',
            totalDisplay: `La péripétie est surmontée : ${OFFRANDE_DE_LA_GUIGNE} points de Panache offerts à chaque joueur au prochain réveil (p. 177).`,
        });
    };
    return (
        <Panneau niveau={1} className="shrink-0 p-4 flex flex-col gap-3" data-guigne-argyropee>
            <h2 className="text-ui-11 font-semibold text-app-muted uppercase tracking-widest">La Guigne</h2>
            <p className="text-ui-11 text-app-muted">
                Panache dépensé pour rehausser des tests depuis le réveil, magie exclue. Repère du livre : environ {REPERE_DE_LA_GUIGNE} points
                par joueur en moins d’une heure de jeu — un exemple, pas un seuil (p. 177).
            </p>
            {personnages.length === 0 ? (
                <p className="text-ui-11 text-app-muted">Aucun personnage dans cette campagne.</p>
            ) : (
                <ul className="flex flex-col gap-1 text-sm">
                    {personnages.map(p => (
                        <li key={p.personnage.id} className="flex items-baseline justify-between gap-2">
                            <span className="truncate">{p.personnage.name}</span>
                            <span className="font-mono text-app-text">
                                {lire(p, guigne.depense)}
                                {regle.panache && <span className="text-app-muted"> · reste {lire(p, regle.panache)}</span>}
                                {lire(p, guigne.offert) > 0 && <span className="text-app-muted"> · +{lire(p, guigne.offert)} au réveil</span>}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            <Bouton variante="neutre" onClick={reglee} disabled={personnages.length === 0}
                title="La péripétie est surmontée : 3 points de Panache à chaque joueur au prochain réveil ; le repère repart de zéro (p. 177).">
                Guigne réglée : +{OFFRANDE_DE_LA_GUIGNE} au prochain réveil
            </Bouton>
        </Panneau>
    );
};

export default GuigneDArgyropee;
