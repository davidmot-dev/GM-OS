import React, { useEffect, useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { resultatsArrives, verdictADire, type ResultatArrive } from './filDesDemandes';
import { degreOuBooleen, estUneReussite } from './degresDeReussite';
import CarteVolante from '../../components/CarteVolante';
import { useCartesEphemeres } from '../../hooks/useCartesEphemeres';

/**
 * **Le résultat d'un jet demandé, 5 secondes dans une fenêtre volante** — David,
 * 11/11/2026 : « je voudrais que le résultat apparaisse 5 sec dans une fenêtre
 * volante ». Chez le meneur seulement, pour les jets **demandés** seulement
 * (décisions de David le même jour) ; l'habillage est celui de l'alerte
 * « Nouveau message » (`MessageAlertOverlay`), dans la colonne de laquelle les
 * cartes s'empilent — deux colonnes au même endroit se chevaucheraient.
 *
 * La source est le fil : la suite « lancée » qui clôt la demande porte le
 * résultat (`resultatsArrives`). Rien n'est rejoué au démarrage : seul compte
 * ce qui arrive après l'ouverture. La carte et sa minuterie sont communes avec
 * le rappel des jauges (`CarteVolante`, `useCartesEphemeres`).
 */

/** Cinq secondes, le temps que David a demandé. */
const DUREE_DE_LA_FENETRE = 5000;

export const ResultatsDesDemandesVolants: React.FC = () => {
    const messages = useSessionOSStore(s => s.messages);
    const [ouvertLe] = useState(() => Date.now());
    const { cartes, ajouter, retirer } = useCartesEphemeres<ResultatArrive>(DUREE_DE_LA_FENETRE);
    const vues = useRef(new Set<string>());

    useEffect(() => {
        const nouvelles = resultatsArrives(messages, ouvertLe).filter(r => !vues.current.has(r.id));
        for (const r of nouvelles) vues.current.add(r.id);
        // Une carte par message neuf du fil, comme MessageAlertOverlay.
        ajouter(nouvelles);
    }, [messages, ouvertLe, ajouter]);

    return (
        <>
            {cartes.slice(-3).map(carte => {
                const degre = degreOuBooleen(carte.resultat.degre, carte.resultat.tagSuccess);
                const reussi = degre ? estUneReussite(degre) : undefined;
                const verdict = verdictADire(carte.resultat);
                const couleur = reussi === undefined ? 'text-app-text' : reussi ? 'text-etat-succes' : 'text-etat-danger';
                return (
                    <CarteVolante key={carte.id} etiquette="Jet demandé" sousTitre={`${carte.personnage} — ${carte.resultat.titre}`}
                        icone={<Dices size={16} />} dureeMs={DUREE_DE_LA_FENETRE} onFermer={() => retirer(carte.id)}
                        ariaLabel={`Jet demandé : ${carte.personnage}`} marque="resultat-de-demande">
                        {verdict && <p className={`text-lg font-black pl-1 ${couleur}`}>{verdict}</p>}
                        {/* Le texte du jeu qui dit déjà son verdict prend la couleur et la taille du verdict. */}
                        <p className={verdict
                            ? 'text-sm text-app-text/90 line-clamp-3 leading-relaxed font-medium pl-1'
                            : `text-base font-black line-clamp-3 leading-snug pl-1 ${couleur}`}>
                            {carte.resultat.totalDisplay}
                        </p>
                    </CarteVolante>
                );
            })}
        </>
    );
};

export default ResultatsDesDemandesVolants;
