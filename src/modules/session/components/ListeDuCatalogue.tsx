import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { FamilleDObjet, GameDriver, ObjetDuCatalogue } from '../../../types/drivers';
import { FAMILLES_D_OBJET, chercherDansLeCatalogue, objetsDeLaFamille, rangerParCategorie } from '../../equipement/catalogue';
import LivreALaPage from '../../forge/rules/components/LivreALaPage';
import { useLivresDuPilote } from '../../forge/rules/useLivresDuJeu';

/**
 * **La liste du catalogue du pilote** — familles, recherche, catégories, grille et
 * « Livre, p. N ». Extraite le 19/11/2026 de « Prendre dans le catalogue » (§ 203,
 * étape D, dessin retenu dans Stitch le 02/11) pour le butin (registre § 264, T3) :
 * décision de David, « Reprendre la fenêtre ». *Deux listes du même catalogue
 * finiraient par diverger* ; il n'y en a qu'une, en choix **un** (équiper une
 * fiche) ou **plusieurs** (cases à cocher, « Toute la catégorie »).
 *
 * La famille est tenue par l'appelant (il en a besoin pour son choix) ; la
 * recherche et la catégorie ouverte vivent ici.
 */
export type ChoixDansLaListe =
    | { mode: 'un'; choisi: string | null; onChoisir: (id: string) => void }
    | { mode: 'plusieurs'; coches: ReadonlySet<string>; onCocher: (ids: string[], coche: boolean) => void };

interface ListeDuCatalogueProps {
    driver: GameDriver;
    familles: readonly FamilleDObjet[];
    famille: FamilleDObjet;
    onFamille: (famille: FamilleDObjet) => void;
    choix: ChoixDansLaListe;
}

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const ListeDuCatalogue: React.FC<ListeDuCatalogueProps> = ({ driver, familles, famille, onFamille, choix }) => {
    const catalogue = driver.catalogue ?? { colonnes: {}, objets: [] };
    // « Livre, p. N » sur la ligne de l'objet (chemins des livres, étape D, 06/11/2026).
    const registreDesLivres = useLivresDuPilote(driver);
    const [recherche, setRecherche] = useState('');
    const [categorie, setCategorie] = useState<Record<string, string>>({});
    const groupes = rangerParCategorie(chercherDansLeCatalogue(objetsDeLaFamille(catalogue, famille), recherche));
    const groupe = groupes.find(g => g.categorie === categorie[famille]) ?? groupes[0];
    const colonnes = catalogue.colonnes[famille] ?? [];
    const plusieurs = choix.mode === 'plusieurs';
    // Une colonne de texte de plus : les propriétés d'une arme, les effets du reste.
    const texteEnPlus = famille === 'arme' ? 'Propriétés' : 'Effets';
    const grille = { gridTemplateColumns: `${plusieurs ? '1.5rem ' : ''}minmax(12rem, 1fr) repeat(${colonnes.length}, minmax(4.5rem, max-content)) minmax(10rem, 1fr) minmax(4rem, max-content)` };

    const estPris = (o: ObjetDuCatalogue) => (choix.mode === 'un' ? o.id === choix.choisi : choix.coches.has(o.id));
    const basculer = (o: ObjetDuCatalogue) => {
        if (choix.mode === 'un') choix.onChoisir(o.id);
        else choix.onCocher([o.id], !choix.coches.has(o.id));
    };
    const toutPris = plusieurs && !!groupe && groupe.objets.every(estPris);

    return (
        <>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Familles d'objets">
                {familles.map(f => {
                    const libelle = majuscule(FAMILLES_D_OBJET.find(x => x.id === f)!.pluriel);
                    const actif = f === famille;
                    return (
                        <button key={f} type="button" role="tab" aria-selected={actif} onClick={() => onFamille(f)}
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
                    <div className="grid items-center gap-x-3 border-b border-app-border/30 bg-app-text/5 px-4 py-2.5 text-ui-12 font-bold uppercase tracking-wider text-app-muted" style={grille}>
                        {plusieurs && (
                            <input type="checkbox" checked={toutPris} aria-label="Toute la catégorie" className="h-4 w-4 accent-accent"
                                onChange={e => choix.mode === 'plusieurs' && choix.onCocher(groupe.objets.map(o => o.id), e.target.checked)} />
                        )}
                        <span>{FAMILLES_D_OBJET.find(x => x.id === famille)!.libelle}</span>
                        {colonnes.map(c => <span key={c.id} className="whitespace-nowrap text-center">{c.libelle}</span>)}
                        <span>{texteEnPlus}</span>
                        <span className="text-right">Page</span>
                    </div>
                    <div role="listbox" aria-label="Objets du catalogue" {...(plusieurs ? { 'aria-multiselectable': true } : {})}>
                        {groupe.objets.map(o => {
                            const actif = estPris(o);
                            return (
                                <div key={o.id} role="option" aria-selected={actif} tabIndex={0}
                                    onClick={() => basculer(o)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); basculer(o); } }}
                                    className={`grid cursor-pointer items-center gap-x-3 border-l-4 px-4 py-3 text-ui-12 ${actif ? 'border-l-accent bg-accent/10' : 'border-l-transparent hover:bg-app-text/5'}`} style={grille}>
                                    {plusieurs && <input type="checkbox" checked={actif} readOnly tabIndex={-1} aria-hidden="true" className="pointer-events-none h-4 w-4 accent-accent" />}
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
        </>
    );
};

export default ListeDuCatalogue;
