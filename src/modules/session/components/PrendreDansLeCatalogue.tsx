import React, { useMemo, useState } from 'react';
import { Check, Package } from 'lucide-react';
import type { FamilleDObjet, GameDriver, ObjetDuCatalogue } from '../../../types/drivers';
import type { InventoryItem } from '../../../types/player.types';
import { CadreDeSurcouche, BoutonPrincipal, BoutonSecondaire } from '../../../components/socle';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import ListeDuCatalogue from './ListeDuCatalogue';
import {
    appliquerLesEcritures, champsDEquipement, ecrituresDeLObjet, emportesEquipables, famillesEquipables, objetPourLeSac,
} from '../../equipement/equiperLaFiche';

/**
 * **« Prendre dans le catalogue »** — registre § 203, étape D (02/11/2026).
 * Écran retenu dans Stitch : `documentation/Planning/stitch/equipement/equipement-fiche.png`.
 *
 * David recopiait « +1 », « 2 », « Longue » à la main sur chaque Marine ; une
 * faute de frappe changeait le jet. La fenêtre écrit ces lignes depuis le
 * catalogue du pilote, dans les champs que le jet lit déjà
 * (`equiperLaFiche.ts`). **Rien n'est enregistré avant « Sauvegarder »** : les
 * valeurs vont dans la saisie en cours de l'éditeur, comme une frappe.
 *
 * La liste (familles, recherche, catégories, grille) vit dans `ListeDuCatalogue`
 * depuis le 19/11/2026 : le butin la reprend en choix multiple (registre § 264, T3).
 */
interface PrendreDansLeCatalogueProps {
    driver: GameDriver;
    /** Les valeurs de la fiche en cours de saisie. */
    fiche: Record<string, unknown>;
    /** Les champs modifiés, à verser dans la saisie. */
    onEcrire: (modifies: Record<string, string>) => void;
    onFermer: () => void;
    /**
     * Le Sac à dos du personnage, et le geste qui y range un objet (étape E,
     * 02/11/2026) : le matériel et la protection prise y entrent, reliés au
     * catalogue, pour que le jet sache ce qui est porté. Sans eux, pas
     * d'onglet Matériel.
     */
    sac?: InventoryItem[];
    onRanger?: (item: Omit<InventoryItem, 'id'>) => void;
}

const PrendreDansLeCatalogue: React.FC<PrendreDansLeCatalogueProps> = ({ driver, fiche, onEcrire, onFermer, sac, onRanger }) => {
    useFermetureParEchap(true, onFermer, 'Prendre dans le catalogue');
    const catalogue = driver.catalogue ?? { colonnes: {}, objets: [] };
    const champs = useMemo(() => champsDEquipement(driver), [driver]);
    const avecLeSac = !!onRanger;
    const familles = famillesEquipables(champs, avecLeSac);
    const [famille, setFamille] = useState<FamilleDObjet>(familles[0] ?? 'arme');
    const [choisi, setChoisi] = useState<string | null>(null);
    const [avecEmportes, setAvecEmportes] = useState(true);

    const objet = catalogue.objets.find(o => o.id === choisi && o.famille === famille);
    const emportes = objet ? emportesEquipables(champs, catalogue, objet, avecLeSac) : [];
    const pris = objet ? [objet, ...(avecEmportes ? emportes : [])] : [];
    const parObjet = pris.map((o: ObjetDuCatalogue) => ({ objet: o, ecritures: ecrituresDeLObjet(champs, catalogue, o, fiche, avecLeSac ? sac ?? [] : undefined) }));
    const ecritures = parObjet.flatMap(p => p.ecritures);
    const aEcrire = ecritures.some(e => !e.dejaLa);

    const ajouter = () => {
        const modifies = appliquerLesEcritures(fiche, ecritures);
        if (Object.keys(modifies).length) onEcrire(modifies);
        for (const p of parObjet) if (p.ecritures.some(e => e.mode === 'sac' && !e.dejaLa)) onRanger?.(objetPourLeSac(p.objet));
        onFermer();
    };

    return (
        <div role="dialog" aria-modal="true" aria-label="Prendre dans le catalogue" className="fixed inset-0 z-[100] flex items-center justify-center bg-app-bg/80 p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <CadreDeSurcouche
                titre="Prendre dans le catalogue"
                icone={<Package size={18} />}
                onFermer={onFermer}
                largeur="moyen"
                className="!max-w-4xl"
                pied={<>
                    <BoutonSecondaire onClick={onFermer}>Annuler</BoutonSecondaire>
                    <BoutonPrincipal onClick={ajouter} disabled={!aEcrire} className="flex items-center gap-2 disabled:opacity-40">
                        <Check size={15} /> Ajouter à la fiche
                    </BoutonPrincipal>
                </>}
            >
                <div className="space-y-5 p-5">
                    <p className="text-sm text-app-muted">
                        L'objet choisi s'ajoute aux champs de la fiche. Rien n'est enregistré avant « Sauvegarder »{avecLeSac ? ', sauf le Sac à dos, qui s’enregistre aussitôt' : ''}.
                    </p>

                    <ListeDuCatalogue driver={driver} familles={familles} famille={famille}
                        onFamille={f => { setFamille(f); setChoisi(null); }}
                        choix={{ mode: 'un', choisi, onChoisir: setChoisi }} />

                    {objet && (
                        <aside className="space-y-2 rounded-2xl border border-app-border/30 bg-app-text/5 p-4" aria-label="Ce qui sera écrit sur la fiche">
                            <h4 className="flex items-center gap-1.5 text-ui-12 font-bold uppercase tracking-wider text-app-text">
                                <Check size={14} className="text-accent" /> Ce qui sera écrit sur la fiche
                            </h4>
                            {emportes.length > 0 && (
                                <label className="flex items-center gap-2 text-ui-12 text-app-text">
                                    <input type="checkbox" checked={avecEmportes} onChange={e => setAvecEmportes(e.target.checked)} className="h-4 w-4 accent-accent" />
                                    Ajouter aussi ce qu'il emporte : {emportes.map(e => e.nom).join(', ')}
                                </label>
                            )}
                            <ul className="grid gap-x-6 gap-y-1 text-ui-12 sm:grid-cols-2">
                                {ecritures.map((e, i) => (
                                    <li key={`${e.champ}-${i}`} className={`flex items-baseline gap-2 ${e.role === 'Armes' || e.role === 'Propriétés' || e.role === 'Sac à dos' ? 'sm:col-span-2' : ''}`}>
                                        <span className="min-w-[5.5rem] font-semibold text-app-muted">{e.role} :</span>
                                        {e.mode === 'valeur'
                                            ? <span className="text-app-text">{e.avant || '—'} → <strong>{e.texte}</strong></span>
                                            : e.dejaLa
                                                ? <span className="italic text-app-muted">{e.texte} y est déjà</span>
                                                : <><span className="font-bold text-etat-succes">+</span><span className="text-app-text">{e.texte || '—'}</span></>}
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    )}
                </div>
            </CadreDeSurcouche>
        </div>
    );
};

export default PrendreDansLeCatalogue;
