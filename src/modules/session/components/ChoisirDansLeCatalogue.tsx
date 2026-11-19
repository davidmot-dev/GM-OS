import React, { useState } from 'react';
import { Check, Package } from 'lucide-react';
import type { FamilleDObjet, GameDriver, ObjetDuCatalogue } from '../../../types/drivers';
import { CadreDeSurcouche, BoutonPrincipal, BoutonSecondaire } from '../../../components/socle';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { FAMILLES_D_OBJET, objetsDeLaFamille } from '../../equipement/catalogue';
import ListeDuCatalogue from './ListeDuCatalogue';

/**
 * **Choisir dans le catalogue, pour le butin** — registre § 264, T4 (19/11/2026).
 *
 * David : « je voudrais faire le lien entre les équipements qui sont définis dans un
 * drivers et loot-os afin de pouvoir constituer des tables de loot plus facilement ».
 * La fenêtre reprend « Prendre dans le catalogue » (décision « Reprendre la
 * fenêtre » : même cadre, même liste), en choix multiple et sur **les quatre
 * familles** — un butin peut contenir un véhicule, une fiche ne le reçoit pas.
 *
 * Elle ne fait qu'une chose : rendre les objets cochés, dans l'ordre du catalogue,
 * à celui qui l'ouvre. Ce qu'il en fait — lignes d'une table, table neuve, objets
 * versés au pool — se dit sur le bouton du pied (`geste`).
 */
interface ChoisirDansLeCatalogueProps {
    driver: GameDriver;
    /** Le libellé du bouton qui valide : « Ajouter à la table », « Créer la table », « Verser au butin ». */
    geste: string;
    /** Une phrase sous le titre : ce qui se passera. */
    explication: string;
    onValider: (objets: ObjetDuCatalogue[]) => void;
    onFermer: () => void;
}

const TOUTES: readonly FamilleDObjet[] = FAMILLES_D_OBJET.map(f => f.id);

const ChoisirDansLeCatalogue: React.FC<ChoisirDansLeCatalogueProps> = ({ driver, geste, explication, onValider, onFermer }) => {
    useFermetureParEchap(true, onFermer, 'Choisir dans le catalogue');
    const catalogue = driver.catalogue ?? { colonnes: {}, objets: [] };
    // On ouvre sur la première famille qui a des objets : le Matériel de Delta Green, pas des Armes vides.
    const [famille, setFamille] = useState<FamilleDObjet>(() => TOUTES.find(f => objetsDeLaFamille(catalogue, f).length > 0) ?? 'arme');
    const [coches, setCoches] = useState<Set<string>>(new Set());
    const choisis = catalogue.objets.filter(o => coches.has(o.id));

    const cocher = (ids: string[], coche: boolean) => setCoches(avant => {
        const apres = new Set(avant);
        for (const id of ids) { if (coche) apres.add(id); else apres.delete(id); }
        return apres;
    });

    return (
        <div role="dialog" aria-modal="true" aria-label="Choisir dans le catalogue" className="fixed inset-0 z-[100] flex items-center justify-center bg-app-bg/80 p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <CadreDeSurcouche
                titre="Choisir dans le catalogue"
                icone={<Package size={18} />}
                onFermer={onFermer}
                largeur="moyen"
                className="!max-w-4xl"
                pied={<>
                    <span className="mr-auto text-sm text-app-muted" aria-live="polite">
                        {choisis.length === 0 ? 'Aucun objet choisi' : choisis.length === 1 ? '1 objet choisi' : `${choisis.length} objets choisis`}
                    </span>
                    {choisis.length > 0 && <BoutonSecondaire onClick={() => setCoches(new Set())}>Tout décocher</BoutonSecondaire>}
                    <BoutonSecondaire onClick={onFermer}>Annuler</BoutonSecondaire>
                    <BoutonPrincipal onClick={() => { onValider(choisis); onFermer(); }} disabled={choisis.length === 0} className="flex items-center gap-2 disabled:opacity-40">
                        <Check size={15} /> {geste}
                    </BoutonPrincipal>
                </>}
            >
                <div className="space-y-5 p-5">
                    <p className="text-sm text-app-muted">{explication}</p>
                    <ListeDuCatalogue driver={driver} familles={TOUTES} famille={famille} onFamille={setFamille}
                        choix={{ mode: 'plusieurs', coches, onCocher: cocher }} />
                </div>
            </CadreDeSurcouche>
        </div>
    );
};

export default ChoisirDansLeCatalogue;
