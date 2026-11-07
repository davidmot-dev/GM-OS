import React, { useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, ChevronDown, ChevronUp, Plus, Search, Trash2, X } from 'lucide-react';
import type { CatalogueDEquipement, EffetDObjet, FamilleDObjet, GameDriver, ObjetDuCatalogue } from '../../../../types/drivers';
import { gmConfirm } from '../../../../stores/useModalStore';
import {
    FAMILLES_D_OBJET, ajouterUneColonne, ajouterUnObjet, catalogueVide, chercherDansLeCatalogue,
    controlerLeCatalogue, modifierUneColonne, modifierUnObjet, objetsDeLaFamille, rangDuConstat,
    rangerParCategorie, retirerUneColonne, retirerUnObjet, valeursDeLaColonne, type ConstatDuCatalogue,
} from '../../../equipement/catalogue';
import RemplirDepuisLeCorpus from './RemplirDepuisLeCorpus';
import LivreALaPage, { type RegistreDesLivres } from '../../../forge/rules/components/LivreALaPage';
import { useLivresDuPilote } from '../../../forge/rules/useLivresDuJeu';
import { DEFILEUR, DEPLIE_VISIBLE, INTERIEUR, NOM_FIGE, grilleDefilante } from './grilleDefilante';

/**
 * **La section « Équipement » de l'éditeur du pilote** — registre § 203,
 * étape B (02/11/2026). Dessinée d'abord dans Stitch, à la demande de David
 * (*« Pour le design d'écran passe par stitch »*) : l'écran retenu est
 * `documentation/Planning/stitch/equipement/equipement-armes.png`.
 *
 * Trois choix tiennent l'écran juste :
 *
 * 1. **La grille suit les colonnes que le jeu déclare.** Stitch avait figé
 *    trois colonnes d'armes ; un véhicule en a six.
 * 2. **« Emporte » se choisit dans le catalogue**, jamais au clavier : un
 *    renvoi vers un objet qui n'existe pas devient inexprimable, comme
 *    l'imbrication des tables de butin.
 * 3. **Les constats du contrôle s'affichent sous l'objet qu'ils visent**,
 *    là où le meneur peut les corriger, et non en liste à part.
 */
interface EditeurDuCatalogueProps {
    driver: GameDriver;
    onUpdate: (patch: Partial<GameDriver>) => void;
    /** Les champs de la fiche du jeu, proposés comme cibles d'un effet. */
    champsDeLaFiche?: { id: string; label: string }[];
}

/** Une liste stable : un `[]` par défaut, neuf à chaque rendu, relancerait le calcul de l'aperçu. */
const AUCUN_CHAMP: { id: string; label: string }[] = [];
const CHAMP = 'w-full rounded-xl border border-app-border/20 bg-app-bg/40 px-3 py-2 text-sm text-app-text outline-none focus:border-accent/50';
const LIBELLE = 'mb-1.5 block text-ui-12 font-black uppercase tracking-[0.15em] text-app-muted';
const PASTILLE = 'inline-flex items-center gap-1 rounded-full border border-app-border/20 bg-app-text/5 px-2.5 py-0.5 text-ui-12 font-medium text-app-text';

const EditeurDuCatalogue: React.FC<EditeurDuCatalogueProps> = ({ driver, onUpdate, champsDeLaFiche = AUCUN_CHAMP }) => {
    const catalogue = driver.catalogue;
    // « Livre, p. N » dans la fiche dépliée (chemins des livres, étape D, 06/11/2026).
    const registreDesLivres = useLivresDuPilote(driver);
    const [famille, setFamille] = useState<FamilleDObjet>('arme');
    const [recherche, setRecherche] = useState('');
    const [deplie, setDeplie] = useState<string | null>(null);
    const [nouvelleColonne, setNouvelleColonne] = useState<string | null>(null);
    const [nouvelObjet, setNouvelObjet] = useState<string | null>(null);
    const [remplir, setRemplir] = useState(false);
    // Les effets rejoignent les champs par leur libellé seul : « Machines lourdes », pas « Machines lourdes — Compétences ».
    const champsSansSection = useMemo(() => champsDeLaFiche.map(c => ({ id: c.id, label: c.label.split(' — ')[0] })), [champsDeLaFiche]);

    const enregistrer = (suivant: CatalogueDEquipement) => onUpdate({ catalogue: suivant });
    const base = () => catalogue ?? catalogueVide();

    const colonnes = catalogue?.colonnes[famille] ?? [];
    const libelleDeFamille = FAMILLES_D_OBJET.find(f => f.id === famille)!;
    const constats = useMemo(() => controlerLeCatalogue(catalogue), [catalogue]);
    const constatsParObjet = useMemo(() => {
        const parId = new Map<string, ConstatDuCatalogue[]>();
        for (const c of constats) {
            const rang = rangDuConstat(c.ou);
            const objet = rang === null ? undefined : catalogue?.objets[rang];
            if (objet) parId.set(objet.id, [...(parId.get(objet.id) ?? []), c]);
        }
        return parId;
    }, [constats, catalogue]);
    const constatsDesColonnes = constats.filter(c => c.ou.startsWith(`catalogue.colonnes.${famille}`));

    const objets = objetsDeLaFamille(catalogue, famille);
    const groupes = rangerParCategorie(chercherDansLeCatalogue(objets, recherche));
    // Le nom, une cellule par colonne déclarée, les propriétés, la source.
    /*
      Des largeurs bornées, les mêmes pour l'en-tête et pour chaque ligne (07/11/2026, David sur
      Cthulhu Hack : « ce n'est pas très lisible »). Avec `max-content`, chaque ligne — une grille à
      elle — calculait ses colonnes d'après son propre contenu : rien ne s'alignait, les titres se
      chevauchaient et un texte long débordait sur ses voisins.
    */
    /*
      Et la grille tient dans la largeur de la section (07/11/2026, second essai de David : « l'écran
      est tronqué à droite »). Des minimums de 5,5 rem par colonne dépassaient la section dès sept
      colonnes, et la fiche dépliée s'élargissait avec le tableau. Les colonnes se partagent désormais
      la place (`1fr`), le nom en garde le double ; une valeur trop longue se coupe.
    */
    // Le 07/11/2026, second essai de David (« c'est pas mieux », sur le bestiaire de Barbarians) : la
    // grille défile, chaque colonne lisible, le nom figé, la fiche dépliée à la largeur visible.
    const grille = grilleDefilante(colonnes, ['minmax(9rem, 12rem)', '5.5rem']);

    const retirerLaColonne = (id: string, libelle: string) => {
        const n = valeursDeLaColonne(catalogue, famille, id);
        const retirer = () => enregistrer(retirerUneColonne(base(), famille, id));
        if (n === 0) retirer();
        else gmConfirm(`Retirer la colonne « ${libelle} » efface sa valeur dans ${n} objet(s). Continuer ?`, retirer);
    };

    const creerLaColonne = () => {
        if (!nouvelleColonne?.trim()) return;
        enregistrer(ajouterUneColonne(base(), famille, nouvelleColonne, 'nombre'));
        setNouvelleColonne(null);
    };

    const creerLObjet = () => {
        if (!nouvelObjet?.trim()) return;
        const { catalogue: suivant, id } = ajouterUnObjet(base(), famille, nouvelObjet);
        enregistrer(suivant);
        setNouvelObjet(null);
        setRecherche('');
        setDeplie(id);
    };

    return (
        <div className="space-y-8">
            {/* Les quatre familles */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Familles d'objets">
                {FAMILLES_D_OBJET.map(f => {
                    const actif = f.id === famille;
                    return (
                        <button key={f.id} role="tab" aria-selected={actif}
                            onClick={() => { setFamille(f.id); setDeplie(null); }}
                            className={`flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-all ${actif ? 'border-accent text-accent bg-accent/5' : 'border-app-border/20 text-app-muted hover:text-app-text'}`}>
                            {f.pluriel.charAt(0).toUpperCase() + f.pluriel.slice(1)}
                            <span className="rounded-full bg-app-text/5 px-2 font-mono text-ui-12">{objetsDeLaFamille(catalogue, f.id).length}</span>
                        </button>
                    );
                })}
            </div>

            {/* Les colonnes de la famille */}
            <section className="space-y-3 rounded-[2rem] border border-app-border/10 bg-app-surface/20 p-6">
                <h3 className="text-ui-12 font-black uppercase tracking-[0.25em] text-app-text">Les colonnes des {libelleDeFamille.pluriel}</h3>
                {colonnes.length === 0 && (
                    <p className="text-sm italic text-app-muted">Aucune colonne : les {libelleDeFamille.pluriel} de ce jeu n'ont encore que leur nom, leur poids et leur coût.</p>
                )}
                {colonnes.map(c => (
                    <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-app-border/10 bg-app-bg/20 px-3 py-2">
                        <input value={c.libelle} aria-label={`Libellé de la colonne ${c.id}`}
                            onChange={e => enregistrer(modifierUneColonne(base(), famille, c.id, { libelle: e.target.value }))}
                            className="flex-1 bg-transparent text-sm font-medium text-app-text outline-none" />
                        <div className="inline-flex rounded-xl border border-app-border/20 p-0.5 text-ui-12 font-semibold">
                            {(['nombre', 'texte'] as const).map(nature => (
                                <button key={nature} aria-pressed={c.nature === nature}
                                    onClick={() => enregistrer(modifierUneColonne(base(), famille, c.id, { nature }))}
                                    className={`rounded-lg px-3 py-1 ${c.nature === nature ? 'bg-app-text/10 text-app-text' : 'text-app-muted hover:text-app-text'}`}>
                                    {nature === 'nombre' ? 'Nombre' : 'Texte'}
                                </button>
                            ))}
                        </div>
                        <button title="Retirer la colonne" aria-label={`Retirer la colonne ${c.libelle}`}
                            onClick={() => retirerLaColonne(c.id, c.libelle)}
                            className="rounded-lg p-1.5 text-app-muted hover:bg-etat-danger/10 hover:text-etat-danger">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                <ListeDesConstats constats={constatsDesColonnes} />
                {nouvelleColonne === null ? (
                    <button onClick={() => setNouvelleColonne('')}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-accent/50 px-4 py-2 text-ui-12 font-semibold uppercase tracking-wider text-accent hover:bg-accent/5">
                        <Plus size={14} /> Ajouter une colonne
                    </button>
                ) : (
                    <FormulaireDeNom valeur={nouvelleColonne} onChange={setNouvelleColonne} onValider={creerLaColonne}
                        onAnnuler={() => setNouvelleColonne(null)} libelle="Libellé de la nouvelle colonne" placeholder="Dégâts, Portée, Coque…" />
                )}
            </section>

            {/* Chercher, ajouter */}
            <div className="flex items-center gap-3">
                <label className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                    <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Chercher un objet" aria-label="Chercher un objet"
                        className={`${CHAMP} rounded-2xl pl-10`} />
                </label>
                <button onClick={() => setRemplir(true)}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-2xl border border-accent/60 px-4 py-2.5 text-sm font-semibold text-accent shadow-sm hover:bg-accent/10">
                    <BookOpen size={16} /> Remplir depuis le corpus
                </button>
                {nouvelObjet === null ? (
                    <button onClick={() => setNouvelObjet('')}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-app-bg shadow-sm hover:opacity-90">
                        <Plus size={16} /> Ajouter un objet
                    </button>
                ) : (
                    <FormulaireDeNom valeur={nouvelObjet} onChange={setNouvelObjet} onValider={creerLObjet}
                        onAnnuler={() => setNouvelObjet(null)} libelle="Nom du nouvel objet" placeholder="Fusil à impulsion M41A…" />
                )}
            </div>

            {/* La liste */}
            {objets.length === 0 && (
                <p className="rounded-2xl border border-dashed border-app-border/20 p-6 text-center text-sm italic text-app-muted">
                    Aucun objet de cette famille dans le catalogue.
                </p>
            )}
            {objets.length > 0 && groupes.length === 0 && (
                <p className="text-sm italic text-app-muted">Aucun objet ne répond à « {recherche} ».</p>
            )}
            <div className="space-y-6 pb-20">
                {groupes.map(g => (
                    <div key={g.categorie} className={DEFILEUR}>
                      <div className={INTERIEUR}>
                        <div className={`${DEPLIE_VISIBLE} mb-2 flex items-center justify-between px-1`}>
                            <h4 className="text-ui-12 font-black uppercase tracking-[0.15em] text-app-muted">{g.categorie}</h4>
                            <span className="font-mono text-ui-12 text-app-muted">{g.objets.length} objet{g.objets.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="mb-2 grid items-center gap-3 px-5 text-ui-12 font-black uppercase tracking-[0.12em] text-app-muted" style={grille}>
                            <span className={`${NOM_FIGE} -ml-5 pl-5`}>{libelleDeFamille.libelle}</span>
                            {colonnes.map(c => <span key={c.id} title={c.libelle} className="text-center leading-tight tracking-normal">{c.libelle}</span>)}
                            <span>Propriétés</span>
                            <span className="text-right">Source</span>
                        </div>
                        <div className="space-y-3">
                            {g.objets.map(o => (
                                <LigneDObjet key={o.id} objet={o} grille={grille} colonnes={colonnes} ouvert={deplie === o.id}
                                    constats={constatsParObjet.get(o.id) ?? []}
                                    onBasculer={() => setDeplie(deplie === o.id ? null : o.id)}>
                                    <FicheDeLObjet objet={o} colonnes={colonnes} catalogue={base()} champsDeLaFiche={champsDeLaFiche} registre={registreDesLivres}
                                        onChange={patch => enregistrer(modifierUnObjet(base(), o.id, patch))}
                                        onRetirer={() => gmConfirm(`Supprimer « ${o.nom} » du catalogue ?`, () => {
                                            enregistrer(retirerUnObjet(base(), o.id));
                                            setDeplie(null);
                                        })} />
                                </LigneDObjet>
                            ))}
                        </div>
                      </div>
                    </div>
                ))}
            </div>

            {remplir && (
                <RemplirDepuisLeCorpus driver={driver} champsDeLaFiche={champsSansSection}
                    onVerser={enregistrer} onFermer={() => setRemplir(false)} />
            )}
        </div>
    );
};

/* ── Les pièces de l'écran ──────────────────────────────────────────────────
 * Exportées pour la section « Bestiaire » (§ 210, étape B) : la même grammaire, un seul dessin.
 */

export const FormulaireDeNom: React.FC<{
    valeur: string; onChange: (v: string) => void; onValider: () => void; onAnnuler: () => void; libelle: string; placeholder: string;
}> = ({ valeur, onChange, onValider, onAnnuler, libelle, placeholder }) => (
    <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); onValider(); }}>
        <input autoFocus value={valeur} onChange={e => onChange(e.target.value)} aria-label={libelle} placeholder={placeholder} className={`${CHAMP} min-w-[16rem]`} />
        <button type="submit" disabled={!valeur.trim()} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-app-bg disabled:opacity-40">Créer</button>
        <button type="button" onClick={onAnnuler} className="rounded-xl px-3 py-2 text-sm text-app-muted hover:text-app-text">Annuler</button>
    </form>
);

export const ListeDesConstats: React.FC<{ constats: ConstatDuCatalogue[] }> = ({ constats }) => (
    <>
        {constats.map((c, i) => (
            <p key={i} role={c.gravite === 'erreur' ? 'alert' : 'status'}
                className={`flex items-start gap-2 rounded-2xl border px-3 py-2 text-ui-12 font-medium ${c.gravite === 'erreur' ? 'border-etat-danger/40 bg-etat-danger/10 text-etat-danger' : 'border-etat-alerte/40 bg-etat-alerte/10 text-etat-alerte'}`}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {c.message}
            </p>
        ))}
    </>
);

const LigneDObjet: React.FC<{
    objet: ObjetDuCatalogue; grille: React.CSSProperties; colonnes: { id: string }[]; ouvert: boolean;
    constats: ConstatDuCatalogue[]; onBasculer: () => void; children: React.ReactNode;
}> = ({ objet, grille, colonnes, ouvert, constats, onBasculer, children }) => (
    <article className={`overflow-clip rounded-3xl border bg-app-surface/20 ${ouvert ? 'border-2 border-accent' : 'border-app-border/10 hover:border-app-border/30'}`}>
        <button onClick={onBasculer} aria-expanded={ouvert}
            className={`grid w-full items-center gap-3 px-5 py-3 text-left ${ouvert ? 'border-b border-accent/30 bg-accent/5' : ''}`} style={grille}>
            <span className={`${NOM_FIGE} -my-3 -ml-5 flex min-w-0 items-center gap-2 self-stretch py-3 pl-5`}>
                {ouvert ? <ChevronUp size={18} className="shrink-0 text-accent" /> : <ChevronDown size={18} className="shrink-0 text-app-muted" />}
                <span className="min-w-0">
                    <span className="block font-bold text-app-text">{objet.nom || '(sans nom)'}</span>
                    {objet.nomOriginal && <span className="block text-ui-12 italic text-app-muted">{objet.nomOriginal}</span>}
                </span>
            </span>
            {colonnes.map(c => {
                const v = objet.valeurs?.[c.id];
                const vide = v === undefined || String(v).trim() === '';
                return (
                    <span key={c.id} className="min-w-0 text-center">
                        {/* Un texte long se coupe ; il se lit entier au survol et dans la fiche dépliée. */}
                        <span title={vide ? undefined : String(v)}
                            className={`inline-block max-w-full truncate whitespace-nowrap rounded-md px-2 py-0.5 align-middle font-mono text-ui-12 ${vide ? 'text-app-muted' : 'bg-app-text/5 font-bold text-app-text'}`}>{vide ? '—' : String(v)}</span>
                    </span>
                );
            })}
            <span className="flex flex-wrap gap-1">
                {(objet.proprietes ?? []).length ? objet.proprietes!.map(p => <span key={p} className={PASTILLE}>{p}</span>) : <span className="text-ui-12 text-app-muted">—</span>}
            </span>
            <span className="whitespace-nowrap text-right font-mono text-ui-12 text-app-muted">
                {objet.source?.page ? `p. ${objet.source.page}` : <span className="font-sans italic">sans page</span>}
            </span>
        </button>
        {constats.length > 0 && <div className={`${DEPLIE_VISIBLE} space-y-1.5 px-5 pb-3 pt-1`}><ListeDesConstats constats={constats} /></div>}
        {/* La fiche dépliée ne défile pas avec le tableau : elle garde la largeur visible. */}
        {ouvert && <div className={DEPLIE_VISIBLE}>{children}</div>}
    </article>
);

export const ListeDePastilles: React.FC<{ libelle: string; valeurs: string[]; onChange: (v: string[]) => void }> = ({ libelle, valeurs, onChange }) => {
    const [saisie, setSaisie] = useState('');
    const ajouter = () => {
        const v = saisie.trim();
        if (v && !valeurs.includes(v)) onChange([...valeurs, v]);
        setSaisie('');
    };
    return (
        <div className="flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-xl border border-app-border/20 bg-app-bg/40 px-2 py-1.5">
            {valeurs.map(v => (
                <span key={v} className={PASTILLE}>
                    {v}
                    <button aria-label={`Retirer ${v}`} onClick={() => onChange(valeurs.filter(x => x !== v))} className="text-app-muted hover:text-etat-danger"><X size={12} /></button>
                </span>
            ))}
            <input value={saisie} onChange={e => setSaisie(e.target.value)} aria-label={`Ajouter — ${libelle}`} placeholder="Ajouter…"
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); ajouter(); } }} onBlur={ajouter}
                className="min-w-[6rem] flex-1 bg-transparent px-1 text-sm text-app-text outline-none" />
        </div>
    );
};

const FicheDeLObjet: React.FC<{
    objet: ObjetDuCatalogue; colonnes: { id: string; libelle: string }[]; catalogue: CatalogueDEquipement;
    champsDeLaFiche: { id: string; label: string }[];
    onChange: (patch: Partial<Omit<ObjetDuCatalogue, 'id' | 'famille'>>) => void; onRetirer: () => void;
    registre: RegistreDesLivres;
}> = ({ objet, colonnes, catalogue, champsDeLaFiche, onChange, onRetirer, registre }) => {
    // Une valeur vidée disparaît : le contrôle ne doit pas lire une case vide comme une valeur.
    const valeur = (id: string, texte: string) => {
        const valeurs = { ...objet.valeurs };
        if (texte.trim()) valeurs[id] = texte; else delete valeurs[id];
        onChange({ valeurs });
    };
    const effets = objet.effets ?? [];
    const changerLEffet = (i: number, patch: Partial<EffetDObjet>) => onChange({ effets: effets.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
    const emportes = objet.contient ?? [];
    const nomDe = (id: string) => catalogue.objets.find(o => o.id === id)?.nom ?? id;
    const choix = catalogue.objets.filter(o => o.id !== objet.id && !emportes.includes(o.id));
    const texte = (v: string) => (v.trim() ? v : undefined);

    return (
        <div className="space-y-5 p-6">
            <div className="grid grid-cols-3 gap-4">
                <label><span className={LIBELLE}>Nom</span>
                    <input value={objet.nom} onChange={e => onChange({ nom: e.target.value })} className={`${CHAMP} font-semibold`} /></label>
                <label><span className={LIBELLE}>Nom original</span>
                    <input value={objet.nomOriginal ?? ''} onChange={e => onChange({ nomOriginal: texte(e.target.value) })} className={`${CHAMP} italic`} /></label>
                <label><span className={LIBELLE}>Catégorie</span>
                    <input value={objet.categorie ?? ''} onChange={e => onChange({ categorie: texte(e.target.value) })} placeholder="Pistolets, Armes lourdes…" className={CHAMP} /></label>
            </div>

            <div><span className={LIBELLE}>Étiquettes</span>
                <ListeDePastilles libelle="Étiquettes" valeurs={objet.etiquettes ?? []} onChange={v => onChange({ etiquettes: v.length ? v : undefined })} /></div>

            {colonnes.length > 0 && (
                <div><span className={LIBELLE}>Caractéristiques</span>
                    <div className="grid grid-cols-3 gap-3">
                        {colonnes.map(c => (
                            <label key={c.id} className="rounded-xl border border-app-border/20 bg-app-bg/40 px-3 py-2">
                                <span className="block text-ui-12 text-app-muted">{c.libelle}</span>
                                <input value={String(objet.valeurs?.[c.id] ?? '')} onChange={e => valeur(c.id, e.target.value)} aria-label={c.libelle}
                                    className="w-full bg-transparent font-mono text-base font-bold text-app-text outline-none" />
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">
                <div><span className={LIBELLE}>Propriétés</span>
                    <ListeDePastilles libelle="Propriétés" valeurs={objet.proprietes ?? []} onChange={v => onChange({ proprietes: v.length ? v : undefined })} /></div>
                <label><span className={LIBELLE}>Poids</span>
                    <input value={objet.poids ?? ''} onChange={e => onChange({ poids: texte(e.target.value) })} className={`${CHAMP} font-mono`} /></label>
                <label><span className={LIBELLE}>Coût</span>
                    <input value={objet.cout ?? ''} onChange={e => onChange({ cout: texte(e.target.value) })} className={`${CHAMP} font-mono`} /></label>
            </div>

            <label className="block"><span className={LIBELLE}>Description</span>
                <textarea value={objet.description ?? ''} onChange={e => onChange({ description: texte(e.target.value) })} rows={2} className={CHAMP} /></label>

            <div>
                <div className="flex items-center justify-between"><span className={LIBELLE}>Effets</span>
                    <span className="text-ui-12 text-app-muted">Rappelés au jet, jamais appliqués d'office</span></div>
                <div className="space-y-2 rounded-xl border border-app-border/20 bg-app-bg/40 p-3">
                    {effets.length === 0 && <p className="text-sm italic text-app-muted">Aucun effet.</p>}
                    {effets.map((e, i) => {
                        /*
                          La cible se CHOISIT parmi les champs de la fiche, comme
                          « Emporte » : David tapait « Ag_Mobilité » dans une
                          case libre (02/11), l'effet visait un champ inexistant
                          et le jet ne le retrouvait jamais. Une cible inconnue
                          de la fiche reste affichée, en alerte, pour être
                          corrigée plutôt que perdue.
                        */
                        const inconnue = !!e.cible && champsDeLaFiche.length > 0 && !champsDeLaFiche.some(c => c.id === e.cible);
                        return (
                        <div key={i} className="grid grid-cols-[1fr_14rem_5rem_10rem_auto] items-center gap-2">
                            <input value={e.texte} onChange={ev => changerLEffet(i, { texte: ev.target.value })} aria-label="Texte de l'effet" placeholder="+2 aux tests de Mobilité sous l'eau" className={CHAMP} />
                            {champsDeLaFiche.length > 0 ? (
                                <select value={e.cible} onChange={ev => changerLEffet(i, { cible: ev.target.value })} aria-label="Compétence visée"
                                    title={inconnue ? `« ${e.cible} » n'est pas un champ de la fiche : le jet ne retrouvera pas cet effet.` : undefined}
                                    className={`${CHAMP} ${inconnue ? '!border-etat-alerte text-etat-alerte' : ''}`}>
                                    <option value="">Compétence visée…</option>
                                    {inconnue && <option value={e.cible}>{e.cible} — absent de la fiche</option>}
                                    {champsDeLaFiche.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            ) : (
                                <input value={e.cible} onChange={ev => changerLEffet(i, { cible: ev.target.value })} aria-label="Compétence visée" placeholder="Compétence visée" className={CHAMP} />
                            )}
                            <input value={e.valeur ?? ''} type="number" onChange={ev => changerLEffet(i, { valeur: ev.target.value === '' ? undefined : Number(ev.target.value) })} aria-label="Valeur de l'effet" placeholder="±" className={`${CHAMP} text-center font-mono`} />
                            <input value={e.condition ?? ''} onChange={ev => changerLEffet(i, { condition: texte(ev.target.value) })} aria-label="Condition de l'effet" placeholder="Condition" className={CHAMP} />
                            <button aria-label="Retirer l'effet" onClick={() => onChange({ effets: effets.filter((_, j) => j !== i) })} className="rounded-lg p-1.5 text-app-muted hover:text-etat-danger"><Trash2 size={15} /></button>
                        </div>
                        );
                    })}
                    <button onClick={() => onChange({ effets: [...effets, { cible: '', texte: '' }] })}
                        className="inline-flex items-center gap-1 rounded-xl border border-app-border/30 px-3 py-1.5 text-ui-12 font-semibold text-app-muted hover:border-accent/50 hover:text-accent">
                        <Plus size={14} /> Ajouter un effet
                    </button>
                </div>
            </div>

            <div><span className={LIBELLE}>Emporte</span>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-app-border/20 bg-app-bg/40 p-3">
                    {emportes.length === 0 && <span className="text-sm italic text-app-muted">N'emporte aucun autre objet.</span>}
                    {emportes.map(id => (
                        <span key={id} className={PASTILLE}>{nomDe(id)}
                            <button aria-label={`Ne plus emporter ${nomDe(id)}`} onClick={() => onChange({ contient: emportes.filter(x => x !== id).length ? emportes.filter(x => x !== id) : undefined })} className="text-app-muted hover:text-etat-danger"><X size={12} /></button>
                        </span>
                    ))}
                    <select value="" aria-label="Choisir dans le catalogue" disabled={choix.length === 0}
                        onChange={e => e.target.value && onChange({ contient: [...emportes, e.target.value] })}
                        className="ml-auto rounded-xl border border-app-border/30 bg-app-bg px-3 py-1.5 text-ui-12 font-semibold text-app-muted">
                        <option value="">+ Choisir dans le catalogue</option>
                        {choix.map(o => <option key={o.id} value={o.id}>{o.nom}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-[1fr_8rem] gap-4 border-t border-app-border/10 pt-4">
                <label><span className={LIBELLE}>Livre</span>
                    <span className="relative block">
                        <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                        <input value={objet.source?.livre ?? ''} className={`${CHAMP} pl-9`}
                            onChange={e => onChange({ source: e.target.value.trim() || objet.source?.page ? { ...objet.source, livre: e.target.value } : undefined })} />
                    </span></label>
                <label><span className={LIBELLE}>Page</span>
                    <input value={objet.source?.page ?? ''} type="number" min={1} className={`${CHAMP} font-mono`}
                        onChange={e => onChange({ source: { livre: objet.source?.livre ?? '', ...objet.source, page: e.target.value === '' ? undefined : Number(e.target.value) } })} /></label>
            </div>
            <div className="flex items-center justify-between gap-3">
                <LivreALaPage registre={registre} source={objet.source} sansLivre="rien" />
                <button onClick={onRetirer} className="ml-auto inline-flex items-center gap-1 text-ui-12 font-medium text-etat-danger hover:underline">
                    <Trash2 size={14} /> Supprimer l'objet
                </button>
            </div>
        </div>
    );
};

export default EditeurDuCatalogue;
