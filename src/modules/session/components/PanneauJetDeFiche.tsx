import type { ComponentProps } from 'react';
import PanneauDeJet from './fields/PanneauDeJet';
import { PanneauJetVoyageur } from './PanneauJetVoyageur';
import { estUneFicheDeVoyageur } from '../logic/ficheDeVoyageur';
import { suiviFatigueActif } from '../logic/fatigueDuVoyageur';

/** Le suivi R1 explicite choisit le panneau ; les autres pilotes restent inchangés. */
export default function PanneauJetDeFiche(props: ComponentProps<typeof PanneauDeJet>) {
    if (estUneFicheDeVoyageur(props.template) && (suiviFatigueActif(props.valeurs) || !!props.valeurs.__rddSante231)
        && props.descripteur.cible?.mecanique === 'reves-de-dragons') {
        return <PanneauJetVoyageur {...props} personnageId={props.personnageId ?? ''} />;
    }
    return <PanneauDeJet {...props} />;
}
