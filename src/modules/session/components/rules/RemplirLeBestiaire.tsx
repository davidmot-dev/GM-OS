import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, Check, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import type { BestiaireDuJeu, GameDriver } from '../../../../types/drivers';
import { CadreDeSurcouche, BoutonPrincipal, BoutonSecondaire } from '../../../../components/socle';
import { useFermetureParEchap } from '../../../../hooks/useFermetureParEchap';
import { useCorpusDuPilote } from '../../../forge/corpus/useCorpusDuPilote';
import { useSupplementsDuJeu } from '../../../forge/rules/useSupplementsDuJeu';
import { rangerParCategorie } from '../../../bestiaire/bestiaire';
import { estUneFicheDeBestiaire, remplirLeBestiaire } from '../../../bestiaire/depuisLeCorpus';
import { lireLesLivresDuJeu, type LivreACataloguer } from '../../../equipement/livresDuJeu';

/**
 * **« Remplir depuis le corpus » du bestiaire** — registre § 210, étape C (05/11/2026), dessiné
 * dans Stitch (`stitch/bestiaire/remplir.png`) et validé par David, sur le dessin de l'aperçu du
 * catalogue (`RemplirDepuisLeCorpus.tsx`).
 *
 * **Rien n'est enregistré avant « Verser au bestiaire ».** Le calcul est celui de
 * `remplirLeBestiaire` : on remplit ce qui est vide, on ne remplace jamais ce que le meneur a
 * corrigé, et l'écart est montré dans « À regarder ».
 */
interface RemplirLeBestiaireProps {
    driver: GameDriver;
    onVerser: (bestiaire: BestiaireDuJeu) => void;
    onFermer: () => void;
    /** Pour les essais : les livres déjà lus, sans passer par le disque. */
    livresFournis?: LivreACataloguer[];
}

const TITRE_DE_SECTION = 'mb-3 text-ui-12 font-black uppercase tracking-[0.15em] text-app-muted';
const PASTILLE = 'rounded-xl border border-app-border/30 bg-app-surface px-2.5 py-1 text-ui-12 font-medium text-app-text';

const RemplirLeBestiaire: React.FC<RemplirLeBestiaireProps> = ({ driver, onVerser, onFermer, livresFournis }) => {
    useFermetureParEchap(true, onFermer, 'Remplir le bestiaire');
    const { corpus } = useCorpusDuPilote(livresFournis ? null : driver);
    const { supplements } = useSupplementsDuJeu(livresFournis ? null : corpus);
    const [lus, setLus] = useState<LivreACataloguer[] | null>(null);
    const livres = livresFournis ?? lus;
    const [ecartes, setEcartes] = useState<Set<string>>(new Set());
    const [categorie, setCategorie] = useState<string | null>(null);
    const [voirEcartes, setVoirEcartes] = useState(false);

    useEffect(() => {
        if (livresFournis || !corpus) return;
        let annule = false;
        void lireLesLivresDuJeu(corpus, supplements, driver.name, estUneFicheDeBestiaire).then(l => { if (!annule) setLus(l); });
        return () => { annule = true; };
    }, [livresFournis, corpus, supplements, driver.name]);

    const coches = useMemo(() => (livres ?? []).filter(l => l.fiches.length > 0 && !ecartes.has(l.cle)), [livres, ecartes]);
    const { bestiaire: propose, journal } = useMemo(
        () => remplirLeBestiaire(driver.bestiaire, coches.flatMap(l => l.fiches)),
        [driver.bestiaire, coches],
    );
    const ajoutees = useMemo(() => new Set(journal.creaturesAjoutees.map(c => c.id)), [journal]);
    const groupes = rangerParCategorie(propose.creatures.filter(c => ajoutees.has(c.id)));
    const choisie = groupes.find(g => g.categorie === categorie) ?? groupes[0];
    const colonnes = propose.colonnes;
    // Les en-têtes en minuscules : en capitales espacées, six colonnes se chevauchaient (capture du 05/11).
    const grille = { gridTemplateColumns: `minmax(9rem, 1.6fr) repeat(${colonnes.length}, minmax(3rem, 1fr)) 3.5rem` };
    const aRegarder = [
        ...journal.conserves.map(t => `${t} — gardé tel quel`),
        ...journal.attaquesSansCreature.map(t => `${t} — sa créature n’est pas au bestiaire`),
        ...journal.lignesNonLues.map(l => `${l.chemin.split('/').pop()} : ligne non lue (${l.raison})`),
    ];
    const rienAVerser = !journal.creaturesAjoutees.length && !journal.creaturesCompletees.length && !journal.colonnesAjoutees.length && !journal.attaquesRattachees.length;
    const basculer = (cle: string) => setEcartes(e => {
        const suivant = new Set(e);
        if (suivant.has(cle)) suivant.delete(cle); else suivant.add(cle);
        return suivant;
    });

    return (
        <div role="dialog" aria-modal="true" aria-label="Remplir le bestiaire" className="fixed inset-0 z-[100] flex items-center justify-center bg-app-bg/80 p-6 backdrop-blur-sm animate-in fade-in duration-300">
            <CadreDeSurcouche
                titre="Remplir depuis le corpus"
                icone={<BookOpen size={18} />}
                onFermer={onFermer}
                largeur="moyen"
                className="!max-w-3xl"
                pied={<>
                    <BoutonSecondaire onClick={onFermer}>Annuler</BoutonSecondaire>
                    <BoutonPrincipal onClick={() => { onVerser(propose); onFermer(); }} disabled={rienAVerser} className="flex items-center gap-2 disabled:opacity-40">
                        <Check size={15} /> Verser au bestiaire
                    </BoutonPrincipal>
                </>}
            >
                <div className="space-y-6 p-5">
                    <p className="text-sm text-app-muted">Les tableaux de profil des fiches relues. On remplit ce qui est vide ; ce que vous avez corrigé reste tel quel.</p>

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
                                            {vide ? 'aucune fiche de créatures relue' : `${l.fiches.length} fiche${l.fiches.length > 1 ? 's' : ''} de créatures sur ${l.total}`}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </section>

                    {livres && (
                        <p className="rounded-2xl border border-app-border/30 bg-app-text/5 p-3 text-center text-sm text-app-text" role="status">
                            <strong className="text-accent">{journal.creaturesAjoutees.length}</strong> créature(s) à ajouter ·{' '}
                            <strong className="text-accent">{journal.creaturesCompletees.length}</strong> complétée(s) ·{' '}
                            <strong className="text-accent">{journal.colonnesAjoutees.length}</strong> colonne(s) à déclarer ·{' '}
                            <strong className="text-accent">{journal.attaquesRattachees.length}</strong> table(s) d’attaques rattachée(s)
                        </p>
                    )}

                    {choisie && (
                        <section>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-ui-12 font-black uppercase tracking-[0.15em] text-app-muted">Créatures</h4>
                                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Catégories des créatures">
                                    {groupes.map(g => (
                                        <button key={g.categorie} type="button" role="tab" aria-selected={g === choisie} onClick={() => setCategorie(g.categorie)}
                                            className={`rounded-full px-2.5 py-1 text-ui-12 font-semibold ${g === choisie ? 'bg-accent text-app-on-accent' : 'border border-app-border/30 text-app-muted hover:text-app-text'}`}>
                                            {g.categorie} {g.creatures.length}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-app-border/30">
                                <div className="grid items-end gap-x-2 border-b border-app-border/20 px-3 py-2 text-ui-10 font-semibold leading-tight text-app-muted" style={grille}>
                                    <span>Créature</span>
                                    {colonnes.map(c => <span key={c.id} className="text-center leading-tight">{c.libelle}</span>)}
                                    <span className="text-right">Page</span>
                                </div>
                                {choisie.creatures.map(c => (
                                    <div key={c.id} data-creature-proposee={c.id} className="grid items-center gap-x-2 border-b border-app-border/10 px-3 py-2 text-ui-12 last:border-b-0" style={grille}>
                                        <span className="font-semibold text-accent">{c.nom}</span>
                                        {colonnes.map(col => <span key={col.id} className="text-center font-mono text-app-text">{c.valeurs[col.id] ?? '—'}</span>)}
                                        <span className="whitespace-nowrap text-right font-mono text-app-muted">{c.source?.page ? `p. ${c.source.page}` : '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {journal.creaturesCompletees.length > 0 && (
                        <section>
                            <h4 className={TITRE_DE_SECTION}>Complétées</h4>
                            <ul className="space-y-1 text-sm text-app-text">
                                {journal.creaturesCompletees.map(c => <li key={c.id}><strong>{c.nom}</strong> <span className="text-app-muted">· {c.champs.join(', ')}</span></li>)}
                            </ul>
                        </section>
                    )}

                    {journal.colonnesAjoutees.length > 0 && (
                        <section>
                            <h4 className={TITRE_DE_SECTION}>Colonnes à déclarer</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {journal.colonnesAjoutees.map(c => (
                                    <span key={c.libelle} className={PASTILLE}>{c.libelle} <span className="text-app-muted">({c.nature})</span></span>
                                ))}
                            </div>
                            <p className="mt-2 text-ui-12 italic text-app-muted">Le champ de la fiche que chaque colonne remplit se choisit ensuite dans la section.</p>
                        </section>
                    )}

                    {journal.attaquesRattachees.length > 0 && (
                        <section>
                            <h4 className={TITRE_DE_SECTION}>Attaques rattachées</h4>
                            <div className="space-y-2">
                                {journal.attaquesRattachees.map(r => (
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
                                {journal.tableauxIgnores.length} tableau(x) écarté(s), qui ne décrivent pas de créature
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

export default RemplirLeBestiaire;
