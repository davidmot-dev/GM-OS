import React, { useMemo, useState } from 'react';
import { Check, Package, Search } from 'lucide-react';
import type { FamilleDObjet, GameDriver, ObjetDuCatalogue } from '../../../types/drivers';
import type { InventoryItem } from '../../../types/player.types';
import { CadreDeSurcouche, BoutonPrincipal, BoutonSecondaire } from '../../../components/socle';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { FAMILLES_D_OBJET, chercherDansLeCatalogue, objetsDeLaFamille, rangerParCategorie } from '../../equipement/catalogue';
import LivreALaPage from '../../forge/rules/components/LivreALaPage';
import { useLivresDuPilote } from '../../forge/rules/useLivresDuJeu';
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

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const PrendreDansLeCatalogue: React.FC<PrendreDansLeCatalogueProps> = ({ driver, fiche, onEcrire, onFermer, sac, onRanger }) => {
    useFermetureParEchap(true, onFermer, 'Prendre dans le catalogue');
    const catalogue = driver.catalogue ?? { colonnes: {}, objets: [] };
    const champs = useMemo(() => champsDEquipement(driver), [driver]);
    // « Livre, p. N » sur la ligne de l'objet (chemins des livres, étape D, 06/11/2026).
    const registreDesLivres = useLivresDuPilote(driver);
    const avecLeSac = !!onRanger;
    const familles = famillesEquipables(champs, avecLeSac);
    const [famille, setFamille] = useState<FamilleDObjet>(familles[0] ?? 'arme');
    const [recherche, setRecherche] = useState('');
    const [categorie, setCategorie] = useState<Record<string, string>>({});
    const [choisi, setChoisi] = useState<string | null>(null);
    const [avecEmportes, setAvecEmportes] = useState(true);

    const groupes = rangerParCategorie(chercherDansLeCatalogue(objetsDeLaFamille(catalogue, famille), recherche));
    const groupe = groupes.find(g => g.categorie === categorie[famille]) ?? groupes[0];
    const colonnes = catalogue.colonnes[famille] ?? [];
    // Une colonne de texte de plus : les propriétés d'une arme, les effets du reste.
    const texteEnPlus = famille === 'arme' ? 'Propriétés' : 'Effets';
    const grille = { gridTemplateColumns: `minmax(12rem, 1fr) repeat(${colonnes.length}, minmax(4.5rem, max-content)) minmax(10rem, 1fr) minmax(4rem, max-content)` };

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

                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Familles d'objets">
                        {familles.map(f => {
                            const libelle = majuscule(FAMILLES_D_OBJET.find(x => x.id === f)!.pluriel);
                            const actif = f === famille;
                            return (
                                <button key={f} type="button" role="tab" aria-selected={actif} onClick={() => { setFamille(f); setChoisi(null); }}
                                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${actif ? 'border-accent/40 bg-accent/10 text-accent' : 'border-transparent text-app-muted hover:text-app-text'}`}>
                                    {libelle}
                                    <span className={`rounded-full px-2 py-0.5 font-mono text-ui-12 font-bold ${actif ? 'bg-accent text-app-on-accent' : 'bg-app-text/10 text-app-muted'}`}>{objetsDeLaFamille(catalogue, f).length}</span>
                                </button>
                            );
                        })}
                    </div>

                    <label className="relative block">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                        <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Chercher dans le catalogue" aria-label="Chercher dans le catalogue"
                            className="w-full rounded-xl border border-app-border/30 bg-app-bg/40 py-2.5 pl-10 pr-4 text-sm text-app-text outline-none focus:border-accent/50" />
                    </label>

                    {groupes.length > 1 && (
                        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Catégories">
                            {groupes.map(g => (
                                <button key={g.categorie} type="button" role="tab" aria-selected={g === groupe}
                                    onClick={() => setCategorie(c => ({ ...c, [famille]: g.categorie }))}
                                    className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-ui-12 font-semibold ${g === groupe ? 'border-accent bg-accent/10 text-accent' : 'border-app-border/30 text-app-muted hover:text-app-text'}`}>
                                    {g.categorie}
                                </button>
                            ))}
                        </div>
                    )}

                    {!groupe ? (
                        <p className="rounded-2xl border border-dashed border-app-border/30 p-6 text-center text-sm italic text-app-muted">
                            Aucun objet de cette famille dans le catalogue du pilote.
                        </p>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-app-border/30">
                            <div className="grid gap-x-3 border-b border-app-border/30 bg-app-text/5 px-4 py-2.5 text-ui-12 font-bold uppercase tracking-wider text-app-muted" style={grille}>
                                <span>{FAMILLES_D_OBJET.find(x => x.id === famille)!.libelle}</span>
                                {colonnes.map(c => <span key={c.id} className="whitespace-nowrap text-center">{c.libelle}</span>)}
                                <span>{texteEnPlus}</span>
                                <span className="text-right">Page</span>
                            </div>
                            <div role="listbox" aria-label="Objets du catalogue">
                                {groupe.objets.map(o => {
                                    const actif = o.id === choisi;
                                    return (
                                        <div key={o.id} role="option" aria-selected={actif} tabIndex={0}
                                            onClick={() => setChoisi(o.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setChoisi(o.id); } }}
                                            className={`grid cursor-pointer items-center gap-x-3 border-l-4 px-4 py-3 text-ui-12 ${actif ? 'border-l-accent bg-accent/10' : 'border-l-transparent hover:bg-app-text/5'}`} style={grille}>
                                            <span className={`font-semibold ${actif ? 'text-accent' : 'text-app-text'}`}>{o.nom}</span>
                                            {colonnes.map(c => <span key={c.id} className="whitespace-nowrap text-center text-app-text">{o.valeurs[c.id] ?? '—'}</span>)}
                                            <span className="text-app-muted">{(famille === 'arme' ? o.proprietes ?? [] : (o.effets ?? []).map(e => e.texte)).join(', ') || '—'}</span>
                                            <span className="whitespace-nowrap text-right text-app-muted">{o.source?.page ? <LivreALaPage registre={registreDesLivres} source={o.source} /> : '—'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

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
