import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, Check, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import type { CatalogueDEquipement, FamilleDObjet, GameDriver } from '../../../../types/drivers';
import { CadreDeSurcouche, BoutonPrincipal, BoutonSecondaire } from '../../../../components/socle';
import { useFermetureParEchap } from '../../../../hooks/useFermetureParEchap';
import { useCorpusDuPilote } from '../../../forge/corpus/useCorpusDuPilote';
import { useSupplementsDuJeu } from '../../../forge/rules/useSupplementsDuJeu';
import { FAMILLES_D_OBJET, rangerParCategorie } from '../../../equipement/catalogue';
import { remplirDepuisLesFiches } from '../../../equipement/depuisLeCorpus';
import { lireLesLivresDuJeu, type LivreACataloguer } from '../../../equipement/livresDuJeu';

/**
 * **« Remplir depuis le corpus »** — registre § 203, étape C (02/11/2026).
 * L'aperçu de ce que les tableaux des fiches relues ajouteraient au catalogue,
 * dessiné dans Stitch (`documentation/Planning/stitch/equipement/equipement-apercu.png`).
 *
 * **Rien n'est enregistré avant « Verser au catalogue ».** Le calcul est celui
 * de `remplirDepuisLesFiches` : on remplit ce qui est vide, on ne remplace
 * jamais ce que le meneur a corrigé, et l'écart est montré dans « À regarder ».
 */
interface RemplirDepuisLeCorpusProps {
    driver: GameDriver;
    /** Les champs de la fiche du jeu, sans leur section : c'est par leur libellé que les effets les rejoignent. */
    champsDeLaFiche: { id: string; label: string }[];
    onVerser: (catalogue: CatalogueDEquipement) => void;
    onFermer: () => void;
    /** Pour les essais : les livres déjà lus, sans passer par le disque. */
    livresFournis?: LivreACataloguer[];
}

const TITRE_DE_SECTION = 'mb-3 text-ui-12 font-black uppercase tracking-[0.15em] text-app-muted';
const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);
const PASTILLE = 'rounded-xl border border-app-border/30 bg-app-surface px-2.5 py-1 text-ui-12 font-medium text-app-text';

const RemplirDepuisLeCorpus: React.FC<RemplirDepuisLeCorpusProps> = ({ driver, champsDeLaFiche, onVerser, onFermer, livresFournis }) => {
    useFermetureParEchap(true, onFermer, 'Remplir depuis le corpus');
    const { corpus } = useCorpusDuPilote(livresFournis ? null : driver);
    const { supplements } = useSupplementsDuJeu(livresFournis ? null : corpus);
    const [lus, setLus] = useState<LivreACataloguer[] | null>(null);
    const livres = livresFournis ?? lus;
    const [ecartes, setEcartes] = useState<Set<string>>(new Set());
    // `null` : la première famille ; `''` : toutes repliées.
    const [familleOuverte, setFamilleOuverte] = useState<FamilleDObjet | '' | null>(null);
    const [categorie, setCategorie] = useState<Record<string, string>>({});
    const [voirEcartes, setVoirEcartes] = useState(false);

    useEffect(() => {
        if (livresFournis || !corpus) return;
        let annule = false;
        void lireLesLivresDuJeu(corpus, supplements, driver.name).then(l => { if (!annule) setLus(l); });
        return () => { annule = true; };
    }, [livresFournis, corpus, supplements, driver.name]);

    const coches = useMemo(() => (livres ?? []).filter(l => l.fiches.length > 0 && !ecartes.has(l.cle)), [livres, ecartes]);
    const { catalogue: propose, journal } = useMemo(
        () => remplirDepuisLesFiches(driver.catalogue, coches.flatMap(l => l.fiches), champsDeLaFiche),
        [driver.catalogue, coches, champsDeLaFiche],
    );
    const ajoutes = useMemo(() => new Set(journal.objetsAjoutes.map(o => o.id)), [journal]);
    const familles = FAMILLES_D_OBJET
        .map(f => ({ ...f, objets: propose.objets.filter(o => o.famille === f.id && ajoutes.has(o.id)) }))
        .filter(f => f.objets.length > 0);
    const ouverte = familleOuverte ?? familles[0]?.id ?? null;
    const aRegarder = [
        ...journal.conserves.map(t => `${t} — gardé tel quel`),
        ...journal.renvoisNonResolus.map(t => `${t} — porteur absent du catalogue`),
        ...journal.lignesNonLues.map(l => `${l.chemin.split('/').pop()} : ligne non lue (${l.raison})`),
    ];
    const rienAVerser = !journal.objetsAjoutes.length && !journal.objetsCompletes.length && !journal.colonnesAjoutees.length && !journal.rattachements.length;
    const basculer = (cle: string) => setEcartes(e => {
        const suivant = new Set(e);
        if (suivant.has(cle)) suivant.delete(cle); else suivant.add(cle);
        return suivant;
    });

    return (
        <div role="dialog" aria-modal="true" aria-label="Remplir depuis le corpus" className="fixed inset-0 z-[100] flex items-center justify-center bg-app-bg/80 p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <CadreDeSurcouche
                titre="Remplir depuis le corpus"
                icone={<BookOpen size={18} />}
                onFermer={onFermer}
                largeur="moyen"
                className="!max-w-3xl"
                pied={<>
                    <BoutonSecondaire onClick={onFermer}>Annuler</BoutonSecondaire>
                    <BoutonPrincipal onClick={() => { onVerser(propose); onFermer(); }} disabled={rienAVerser} className="flex items-center gap-2 disabled:opacity-40">
                        <Check size={15} /> Verser au catalogue
                    </BoutonPrincipal>
                </>}
            >
                <div className="space-y-6 p-5">
                    <p className="text-sm text-app-muted">Les tableaux des fiches relues. On remplit ce qui est vide ; ce que vous avez corrigé reste tel quel.</p>

                    <section>
                        <h4 className={TITRE_DE_SECTION}>Livres lus</h4>
                        {!livres && <p className="text-sm italic text-app-muted">Lecture des fiches…</p>}
                        <div className="space-y-2">
                            {(livres ?? []).map(l => {
                                const vide = l.fiches.length === 0;
                                const coche = !vide && !ecartes.has(l.cle);
                                return (
                                    <label key={l.cle} className={`flex items-center justify-between gap-3 rounded-2xl border p-3 ${vide ? 'border-app-border/20 opacity-60' : coche ? 'border-accent/40 bg-accent/5' : 'border-app-border/30'}`}>
                                        <span className="flex items-center gap-3">
                                            <input type="checkbox" checked={coche} disabled={vide} onChange={() => basculer(l.cle)} className="h-4 w-4 accent-accent" />
                                            <span className={`text-sm ${coche ? 'font-semibold text-app-text' : 'text-app-muted'}`}>{l.titre}</span>
                                        </span>
                                        <span className="text-ui-12 text-app-muted">
                                            {vide ? 'aucune fiche d’équipement relue' : `${l.fiches.length} fiche${l.fiches.length > 1 ? 's' : ''} d’équipement sur ${l.total}`}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </section>

                    {livres && (
                        <p className="rounded-2xl border border-app-border/30 bg-app-text/5 p-3 text-center text-sm text-app-text" role="status">
                            <strong className="text-accent">{journal.objetsAjoutes.length}</strong> objet(s) à ajouter ·{' '}
                            <strong className="text-accent">{journal.objetsCompletes.length}</strong> objet(s) complété(s) ·{' '}
                            <strong className="text-accent">{journal.colonnesAjoutees.length}</strong> colonne(s) à déclarer ·{' '}
                            <strong className="text-accent">{journal.rattachements.length}</strong> rattachement(s)
                        </p>
                    )}

                    {familles.length > 0 && (
                        <section>
                            <h4 className={TITRE_DE_SECTION}>Objets</h4>
                            <div className="space-y-2">
                                {familles.map(f => {
                                    const estOuverte = ouverte === f.id;
                                    const groupes = rangerParCategorie(f.objets);
                                    const choisie = groupes.find(g => g.categorie === categorie[f.id]) ?? groupes[0];
                                    const colonnes = propose.colonnes[f.id] ?? [];
                                    const grille = { gridTemplateColumns: `minmax(12rem, 1fr) repeat(${colonnes.length}, minmax(4.5rem, max-content)) 4rem` };
                                    return (
                                        <div key={f.id} className={`overflow-hidden rounded-2xl border ${estOuverte ? 'border-accent/40' : 'border-app-border/30'}`}>
                                            <button type="button" aria-expanded={estOuverte} onClick={() => setFamilleOuverte(estOuverte ? '' : f.id)}
                                                className={`flex w-full items-center justify-between p-3 text-left ${estOuverte ? 'bg-accent/5' : 'hover:bg-app-text/5'}`}>
                                                <span className="flex items-center gap-2 text-sm font-bold text-app-text">
                                                    {estOuverte ? <ChevronUp size={16} className="text-accent" /> : <ChevronDown size={16} className="text-app-muted" />}
                                                    {majuscule(f.pluriel)}
                                                </span>
                                                <span className="rounded-full border border-app-border/30 px-2 py-0.5 font-mono text-ui-12 font-bold text-app-muted">{f.objets.length}</span>
                                            </button>
                                            {estOuverte && choisie && (
                                                <div className="space-y-3 p-3">
                                                    <div className="flex flex-wrap gap-2 border-b border-app-border/20 pb-2" role="tablist" aria-label={`Catégories des ${f.pluriel}`}>
                                                        {groupes.map(g => (
                                                            <button key={g.categorie} type="button" role="tab" aria-selected={g === choisie}
                                                                onClick={() => setCategorie(c => ({ ...c, [f.id]: g.categorie }))}
                                                                className={`rounded-full px-2.5 py-1 text-ui-12 font-semibold ${g === choisie ? 'bg-accent text-app-on-accent' : 'border border-app-border/30 text-app-muted hover:text-app-text'}`}>
                                                                {g.categorie} {g.objets.length}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <div className="grid gap-x-3 rounded-xl bg-app-text/5 px-3 py-1.5 text-ui-12 font-black uppercase tracking-[0.12em] text-app-muted" style={grille}>
                                                            <span>{f.libelle}</span>
                                                            {colonnes.map(c => <span key={c.id} className="whitespace-nowrap text-center">{c.libelle}</span>)}
                                                            <span className="text-right">Page</span>
                                                        </div>
                                                        {choisie.objets.map(o => (
                                                            <div key={o.id} className="mt-1.5 grid items-center gap-x-3 rounded-xl border border-app-border/20 px-3 py-2 text-ui-12" style={grille}>
                                                                <span className="font-semibold text-app-text">{o.nom}</span>
                                                                {colonnes.map(c => <span key={c.id} className="whitespace-nowrap text-center font-mono text-app-text">{o.valeurs[c.id] ?? '—'}</span>)}
                                                                <span className="whitespace-nowrap text-right font-mono text-app-muted">{o.source?.page ? `p. ${o.source.page}` : '—'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {journal.objetsCompletes.length > 0 && (
                        <section>
                            <h4 className={TITRE_DE_SECTION}>Complétés</h4>
                            <ul className="space-y-1 text-sm text-app-text">
                                {journal.objetsCompletes.map(o => <li key={o.id}><strong>{o.nom}</strong> <span className="text-app-muted">· {o.champs.join(', ')}</span></li>)}
                            </ul>
                        </section>
                    )}

                    {journal.colonnesAjoutees.length > 0 && (
                        <section>
                            <h4 className={TITRE_DE_SECTION}>Colonnes à déclarer</h4>
                            <div className="space-y-2.5 rounded-2xl border border-app-border/30 bg-app-text/5 p-3.5">
                                {FAMILLES_D_OBJET.filter(f => journal.colonnesAjoutees.some(c => c.famille === f.id)).map(f => (
                                    <div key={f.id} className="flex flex-wrap items-center gap-1.5">
                                        <span className="mr-1 text-ui-12 font-semibold text-app-text">{majuscule(f.pluriel)} :</span>
                                        {journal.colonnesAjoutees.filter(c => c.famille === f.id).map(c => (
                                            <span key={c.libelle} className={PASTILLE}>{c.libelle} <span className="text-app-muted">({c.nature})</span></span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {journal.rattachements.length > 0 && (
                        <section>
                            <h4 className={TITRE_DE_SECTION}>Rattachés</h4>
                            <div className="space-y-2">
                                {journal.rattachements.map(r => (
                                    <p key={r} className="flex items-center gap-2 rounded-2xl border border-app-border/30 p-3 text-sm text-app-text">
                                        <Link2 size={16} className="shrink-0 text-accent" /> {r}
                                    </p>
                                ))}
                            </div>
                        </section>
                    )}

                    {aRegarder.length > 0 && (
                        <section className="space-y-2 rounded-2xl border border-etat-alerte/40 bg-etat-alerte/10 p-4">
                            <h4 className="flex items-center gap-2 text-ui-12 font-black uppercase tracking-[0.15em] text-etat-alerte">
                                <AlertTriangle size={16} /> À regarder
                            </h4>
                            <ul className="space-y-1.5 text-ui-12 text-app-text">
                                {aRegarder.map(t => <li key={t}>{t}</li>)}
                            </ul>
                        </section>
                    )}

                    {journal.tableauxIgnores.length > 0 && (
                        <div className="rounded-2xl border border-app-border/30">
                            <button type="button" aria-expanded={voirEcartes} onClick={() => setVoirEcartes(v => !v)}
                                className="flex w-full items-center gap-2 p-3 text-left text-ui-12 font-medium text-app-muted hover:text-app-text">
                                {voirEcartes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                {journal.tableauxIgnores.length} tableau(x) écarté(s), qui ne décrivent pas d’équipement
                            </button>
                            {voirEcartes && (
                                <ul className="space-y-1 px-4 pb-3 text-ui-12 text-app-muted">
                                    {journal.tableauxIgnores.map(t => <li key={`${t.chemin}|${t.titre}`}>{t.chemin.split('/').pop()} — {t.titre}</li>)}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </CadreDeSurcouche>
        </div>
    );
};

export default RemplirDepuisLeCorpus;
