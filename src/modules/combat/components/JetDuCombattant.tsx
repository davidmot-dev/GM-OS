import React from 'react';
import PanneauDeJet from '../../session/components/PanneauJetDeFiche';
import { ecrireLaFicheDuCombattant } from '../ficheDesCombattants';
import type { Combatant } from '../types';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';

/**
 * **Lancer un test pour un adversaire** — Vampire, 17/11/2026. David : « je ne sais pas lancer de
 * jet à partir de la fiche d'un lieutenant », puis « oui fais le ».
 *
 * La fiche d'un combattant s'ouvrait en lecture seule : un adversaire posé depuis le bestiaire
 * (« Armes à feu 5 », p. 371) n'avait aucun panneau de jet, ni au plateau ni en PNJ de campagne. Le
 * panneau est celui d'un personnage — même descripteur, mêmes menus, même mécanique —, sur les
 * valeurs que la fiche du combattant montre déjà. Il écrit par `ecrireLaFicheDuCombattant`, le seul
 * écrivain : sur la fiche de campagne d'un PNJ rattaché, sur le plateau sinon. Une relance par la
 * Volonté, un test d'Exaltation y laissent donc leurs marques, comme chez un joueur.
 *
 * Qui peut lancer d'ici : `logic/jetDuCombattant.ts`.
 */
export const JetDuCombattant: React.FC<{
    combattant: Combatant;
    driver: GameDriver;
    gabarit: SheetTemplate;
    valeurs: Record<string, unknown>;
    campaignId?: string | null;
}> = ({ combattant, driver, gabarit, valeurs, campaignId }) => (
    <details data-jet-du-combattant className="rounded-xl border border-app-border/40 p-3" open>
        <summary className="cursor-pointer text-ui-10 font-black uppercase tracking-widest text-app-text">
            Lancer un test pour {combattant.name}
        </summary>
        <div className="pt-3">
            <PanneauDeJet key={combattant.id} descripteur={driver.jet!} dice={driver.dice} template={gabarit} valeurs={valeurs}
                personnageId={combattant.id} campaignId={campaignId ?? undefined}
                ecrireSurLaFiche={maj => ecrireLaFicheDuCombattant(combattant, maj)} />
        </div>
    </details>
);
