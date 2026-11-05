import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Plus, Search, Trash2 } from 'lucide-react';
import type { BestiaireDuJeu, ColonneDuBestiaire, CreatureDuBestiaire, GameDriver, LigneDAttaque } from '../../../../types/drivers';
import { gmConfirm } from '../../../../stores/useModalStore';
import {
    ajouterUneColonne, ajouterUneCreature, bestiaireVide, chercherDansLeBestiaire, controlerLeBestiaire, ficheDePlateau,
    modifierUneColonne, modifierUneCreature, rangDuConstat, rangerParCategorie, retirerUneColonne, retirerUneCreature,
    valeursDeLaColonne, type ConstatDuBestiaire,
} from '../../../bestiaire/bestiaire';
import { FormulaireDeNom, ListeDePastilles, ListeDesConstats } from './EditeurDuCatalogue';
import RemplirLeBestiaire from './RemplirLeBestiaire';

/**
 * **La section « Bestiaire » de l'éditeur du pilote** — registre § 210, étape B (05/11/2026), à
 * la demande de David (« on va faire le B »). Dessinée d'abord dans Stitch et validée par David
 * (`stitch/bestiaire/`), dans l'habillage de la section « Équipement » (`EditeurDuCatalogue`).
 *
 * Trois choix tiennent l'écran juste :
 *
 * 1. **Chaque colonne dit le champ de la fiche qu'elle remplit**, choisi parmi les champs du
 *    pilote, jamais tapé : c'est le contrat du bestiaire (`ficheDePlateau`). « Sur le plateau »
 *    montre ce qu'il produira pour la créature dépliée.
 * 2. **La grille suit les colonnes déclarées**, comme le catalogue.
 * 3. **Les constats du contrôle s'affichent sous ce qu'ils visent.**
 *
 * « Remplir depuis le corpus » ouvre l'aperçu de l'étape C (`RemplirLeBestiaire`, 05/11/2026) :
 * les tableaux de profil des fiches relues, versés sans rien remplacer.
 */
interface EditeurDuBestiaireProps {
    driver: GameDriver;
    onUpdate: (patch: Partial<GameDriver>) => void;
    /** Les champs de la fiche du jeu, que les colonnes remplissent. */
    champsDeLaFiche?: { id: string; label: string }[];
}

const AUCUN_CHAMP: { id: string; label: string }[] = [];
const CHAMP = 'w-full rounded-xl border border-app-border/20 bg-app-bg/40 px-3 py-2 text-sm text-app-text outline-none focus:border-accent/50';
const LIBELLE = 'mb-1.5 block text-ui-12 font-black uppercase tracking-[0.15em] text-app-muted';
const texte = (v: string) => (v.trim() ? v : undefined);

const EditeurDuBestiaire: React.FC<EditeurDuBestiaireProps> = ({ driver, onUpdate, champsDeLaFiche = AUCUN_CHAMP }) => {
    const bestiaire = driver.bestiaire;
    const [recherche, setRecherche] = useState('');
    const [deplie, setDeplie] = useState<string | null>(null);
    const [nouvelleColonne, setNouvelleColonne] = useState<string | null>(null);
    const [nouvelleCreature, setNouvelleCreature] = useState<string | null>(null);
    const [remplir, setRemplir] = useState(false);

    const enregistrer = (suivant: BestiaireDuJeu) => onUpdate({ bestiaire: suivant });
    const base = () => bestiaire ?? bestiaireVide();
    const colonnes = bestiaire?.colonnes ?? [];
    const creatures = bestiaire?.creatures ?? [];

    const champs = useMemo(() => new Set(champsDeLaFiche.map(c => c.id)), [champsDeLaFiche]);
    const constats = useMemo(() => controlerLeBestiaire(bestiaire, champs.size ? champs : undefined), [bestiaire, champs]);
    const constatsParCreature = useMemo(() => {
        const parId = new Map<string, ConstatDuBestiaire[]>();
        for (const c of constats) {
            const rang = rangDuConstat(c.ou);
            const cr = rang === null ? undefined : bestiaire?.creatures[rang];
            if (cr) parId.set(cr.id, [...(parId.get(cr.id) ?? []), c]);
        }
        return parId;
    }, [constats, bestiaire]);
    const constatsDesColonnes = constats.filter(c => c.ou.startsWith('bestiaire.colonnes'));

    const groupes = rangerParCategorie(chercherDansLeBestiaire(creatures, recherche));
    /*
      Le nom, une cellule par colonne déclarée, la source. **La grille tient dans la largeur** :
      à 6,5 rem par colonne, les six colonnes d'Alien débordaient, les en-têtes se tronquaient
      (« OBSERVA… ») et la fiche dépliée était coupée à droite (capture du 05/11). Les en-têtes
      passent à la ligne entre deux mots, jamais au milieu (« OBSERVAT ION », même jour).
    */
    const grille = { gridTemplateColumns: `minmax(9rem, 1.4fr) repeat(${colonnes.length}, minmax(3.5rem, 1fr)) 4.5rem` };

    const retirerLaColonne = (id: string, libelle: string) => {
        const n = valeursDeLaColonne(bestiaire, id);
        const retirer = () => enregistrer(retirerUneColonne(base(), id));
        if (n === 0) retirer();
        else gmConfirm(`Retirer la colonne « ${libelle} » efface sa valeur dans ${n} créature(s). Continuer ?`, retirer);
    };
    const creerLaColonne = () => {
        if (!nouvelleColonne?.trim()) return;
        enregistrer(ajouterUneColonne(base(), nouvelleColonne, 'nombre'));
        setNouvelleColonne(null);
    };
    const creerLaCreature = () => {
        if (!nouvelleCreature?.trim()) return;
        const { bestiaire: suivant, id } = ajouterUneCreature(base(), nouvelleCreature);
        enregistrer(suivant);
        setNouvelleCreature(null);
        setRecherche('');
        setDeplie(id);
    };
    const libelleDuChamp = (id: string) => champsDeLaFiche.find(c => c.id === id)?.label.split(' — ')[0] ?? id;

    return (
        <div className="min-w-0 space-y-8" data-editeur-du-bestiaire>
            {/* Les colonnes du bestiaire */}
            <section className="space-y-3 rounded-[2rem] border border-app-border/10 bg-app-surface/20 p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-ui-12 font-black uppercase tracking-[0.25em] text-app-text">Les colonnes du bestiaire</h3>
                    <span className="font-mono text-ui-12 uppercase text-app-muted">{colonnes.length} colonne{colonnes.length > 1 ? 's' : ''}</span>
                </div>
                {colonnes.length === 0 && (
                    <p className="text-sm italic text-app-muted">Aucune colonne : les créatures de ce jeu n'ont encore que leur nom.</p>
                )}
                {colonnes.map(c => {
                    const inconnu = !!c.champ && champs.size > 0 && !champs.has(c.champ);
                    return (
                        <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-app-border/10 bg-app-bg/20 px-3 py-2" data-colonne-du-bestiaire={c.id}>
                            <input value={c.libelle} aria-label={`Libellé de la colonne ${c.id}`}
                                onChange={e => enregistrer(modifierUneColonne(base(), c.id, { libelle: e.target.value }))}
                                className="flex-1 bg-transparent text-sm font-medium text-app-text outline-none" />
                            <div className="inline-flex rounded-xl border border-app-border/20 p-0.5 text-ui-12 font-semibold">
                                {(['nombre', 'texte'] as const).map(nature => (
                                    <button key={nature} aria-pressed={c.nature === nature}
                                        onClick={() => enregistrer(modifierUneColonne(base(), c.id, { nature }))}
                                        className={`rounded-lg px-3 py-1 ${c.nature === nature ? 'bg-app-text/10 text-app-text' : 'text-app-muted hover:text-app-text'}`}>
                                        {nature === 'nombre' ? 'Nombre' : 'Texte'}
                                    </button>
                                ))}
                            </div>
                            <select value={c.champ ?? ''} aria-label={`Champ rempli par la colonne ${c.libelle}`}
                                title="Le champ de la fiche que la colonne remplit quand la créature entre en jeu."
                                onChange={e => enregistrer(modifierUneColonne(base(), c.id, { champ: e.target.value || undefined }))}
                                className={`w-56 rounded-xl border border-app-border/20 bg-app-bg px-3 py-1.5 text-ui-12 font-semibold ${c.champ ? 'text-accent' : 'text-app-muted'} ${inconnu ? '!border-etat-alerte !text-etat-alerte' : ''}`}>
                                <option value="">— reste au bestiaire —</option>
                                {inconnu && <option value={c.champ}>{c.champ} — absent de la fiche</option>}
                                {champsDeLaFiche.map(f => <option key={f.id} value={f.id}>Remplit : {f.label}</option>)}
                            </select>
                            <button title="Retirer la colonne" aria-label={`Retirer la colonne ${c.libelle}`}
                                onClick={() => retirerLaColonne(c.id, c.libelle)}
                                className="rounded-lg p-1.5 text-app-muted hover:bg-etat-danger/10 hover:text-etat-danger">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    );
                })}
                <ListeDesConstats constats={constatsDesColonnes} />
                {nouvelleColonne === null ? (
                    <button onClick={() => setNouvelleColonne('')}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-accent/50 px-4 py-2 text-ui-12 font-semibold uppercase tracking-wider text-accent hover:bg-accent/5">
                        <Plus size={14} /> Ajouter une colonne
                    </button>
                ) : (
                    <FormulaireDeNom valeur={nouvelleColonne} onChange={setNouvelleColonne} onValider={creerLaColonne}
                        onAnnuler={() => setNouvelleColonne(null)} libelle="Libellé de la nouvelle colonne" placeholder="Santé, Protection, Vitesse…" />
                )}
            </section>

            {/* Chercher, remplir, ajouter */}
            <div className="flex items-center gap-3">
                <label className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-app-muted" />
                    <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Chercher une créature" aria-label="Chercher une créature"
                        className={`${CHAMP} rounded-2xl pl-10`} />
                </label>
                <button onClick={() => setRemplir(true)}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-2xl border border-accent/60 px-4 py-2.5 text-sm font-semibold text-accent shadow-sm hover:bg-accent/10">
                    <BookOpen size={16} /> Remplir depuis le corpus
                </button>
                {nouvelleCreature === null ? (
                    <button onClick={() => setNouvelleCreature('')}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-app-bg shadow-sm hover:opacity-90">
                        <Plus size={16} /> Ajouter une créature
                    </button>
                ) : (
                    <FormulaireDeNom valeur={nouvelleCreature} onChange={setNouvelleCreature} onValider={creerLaCreature}
                        onAnnuler={() => setNouvelleCreature(null)} libelle="Nom de la nouvelle créature" placeholder="Biodrone XX121B…" />
                )}
            </div>

            {/* La liste */}
            {creatures.length === 0 && (
                <p className="rounded-2xl border border-dashed border-app-border/20 p-6 text-center text-sm italic text-app-muted">
                    Aucune créature au bestiaire de ce jeu.
                </p>
            )}
            {creatures.length > 0 && groupes.length === 0 && (
                <p className="text-sm italic text-app-muted">Aucune créature ne répond à « {recherche} ».</p>
            )}
            <div className="space-y-6 pb-20">
                {groupes.map(g => (
                    <div key={g.categorie}>
                        <div className="mb-2 flex items-center justify-between px-1">
                            <h4 className="text-ui-12 font-black uppercase tracking-[0.15em] text-app-muted">{g.categorie}</h4>
                            <span className="font-mono text-ui-12 text-app-muted">{g.creatures.length} créature{g.creatures.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="mb-2 grid items-center gap-3 px-5 text-ui-12 font-black uppercase tracking-[0.12em] text-app-muted" style={grille}>
                            <span>Créature</span>
                            {colonnes.map(c => <span key={c.id} className="text-center text-ui-10 leading-tight tracking-[0.04em]" title={c.libelle}>{c.libelle}</span>)}
                            <span className="text-right">Source</span>
                        </div>
                        <div className="space-y-3">
                            {g.creatures.map(cr => (
                                <LigneDeCreature key={cr.id} creature={cr} grille={grille} colonnes={colonnes} ouvert={deplie === cr.id}
                                    constats={constatsParCreature.get(cr.id) ?? []}
                                    onBasculer={() => setDeplie(deplie === cr.id ? null : cr.id)}>
                                    <FicheDeLaCreature creature={cr} colonnes={colonnes} plateau={ficheDePlateau(base(), cr)} libelleDuChamp={libelleDuChamp}
                                        onChange={patch => enregistrer(modifierUneCreature(base(), cr.id, patch))}
                                        onRetirer={() => gmConfirm(`Supprimer « ${cr.nom} » du bestiaire ?`, () => {
                                            enregistrer(retirerUneCreature(base(), cr.id));
                                            setDeplie(null);
                                        })} />
                                </LigneDeCreature>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {remplir && <RemplirLeBestiaire driver={driver} onVerser={enregistrer} onFermer={() => setRemplir(false)} />}
        </div>
    );
};

const LigneDeCreature: React.FC<{
    creature: CreatureDuBestiaire; grille: React.CSSProperties; colonnes: ColonneDuBestiaire[]; ouvert: boolean;
    constats: ConstatDuBestiaire[]; onBasculer: () => void; children: React.ReactNode;
}> = ({ creature, grille, colonnes, ouvert, constats, onBasculer, children }) => (
    <article data-creature={creature.id} className={`overflow-hidden rounded-3xl border bg-app-surface/20 ${ouvert ? 'border-2 border-accent' : 'border-app-border/10 hover:border-app-border/30'}`}>
        <button onClick={onBasculer} aria-expanded={ouvert}
            className={`grid w-full items-center gap-3 px-5 py-3 text-left ${ouvert ? 'border-b border-accent/30 bg-accent/5' : ''}`} style={grille}>
            <span className="flex min-w-0 items-center gap-2">
                {ouvert ? <ChevronUp size={18} className="shrink-0 text-accent" /> : <ChevronDown size={18} className="shrink-0 text-app-muted" />}
                <span className="min-w-0">
                    <span className={`block font-bold ${ouvert ? 'text-accent' : 'text-app-text'}`}>{creature.nom || '(sans nom)'}</span>
                    {creature.nomOriginal && <span className="block text-ui-12 italic text-app-muted">{creature.nomOriginal}</span>}
                </span>
            </span>
            {colonnes.map(c => {
                const v = creature.valeurs?.[c.id];
                const vide = v === undefined || String(v).trim() === '';
                return (
                    <span key={c.id} className="text-center">
                        <span className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-ui-12 ${vide ? 'text-app-muted' : 'bg-app-text/5 font-bold text-app-text'}`}>{vide ? '—' : String(v)}</span>
                    </span>
                );
            })}
            <span className="whitespace-nowrap text-right font-mono text-ui-12 text-app-muted">
                {creature.source?.page ? `p. ${creature.source.page}` : <span className="font-sans italic">sans page</span>}
            </span>
        </button>
        {constats.length > 0 && <div className="space-y-1.5 px-5 pb-3 pt-1"><ListeDesConstats constats={constats} /></div>}
        {ouvert && children}
    </article>
);

const FicheDeLaCreature: React.FC<{
    creature: CreatureDuBestiaire; colonnes: ColonneDuBestiaire[]; plateau: Record<string, string | number>;
    libelleDuChamp: (id: string) => string;
    onChange: (patch: Partial<Omit<CreatureDuBestiaire, 'id'>>) => void; onRetirer: () => void;
}> = ({ creature, colonnes, plateau, libelleDuChamp, onChange, onRetirer }) => {
    // Une valeur vidée disparaît : le contrôle ne doit pas lire une case vide comme une valeur.
    const valeur = (id: string, saisie: string) => {
        const valeurs = { ...creature.valeurs };
        if (saisie.trim()) valeurs[id] = saisie; else delete valeurs[id];
        onChange({ valeurs });
    };
    const attaques = creature.attaques ?? {};
    const lignes = attaques.lignes ?? [];
    const changerLesAttaques = (patch: Partial<NonNullable<CreatureDuBestiaire['attaques']>>) => {
        const suivantes = { ...attaques, ...patch };
        if (!suivantes.table) delete suivantes.table;
        if (!suivantes.lignes?.length) delete suivantes.lignes;
        onChange({ attaques: Object.keys(suivantes).length ? suivantes : undefined });
    };
    const changerLaLigne = (i: number, patch: Partial<LigneDAttaque>) => changerLesAttaques({ lignes: lignes.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
    const changerLaTable = (cle: 'univers' | 'table', v: string) => {
        const t = { univers: attaques.table?.univers ?? '', table: attaques.table?.table ?? '', [cle]: v };
        changerLesAttaques({ table: t.univers.trim() || t.table.trim() ? t : undefined });
    };
    const surLePlateau = Object.entries(plateau);

    return (
        <div className="space-y-5 p-6">
            <div className="grid grid-cols-3 gap-4">
                <label><span className={LIBELLE}>Nom</span>
                    <input value={creature.nom} onChange={e => onChange({ nom: e.target.value })} className={`${CHAMP} font-semibold`} /></label>
                <label><span className={LIBELLE}>Nom original</span>
                    <input value={creature.nomOriginal ?? ''} onChange={e => onChange({ nomOriginal: texte(e.target.value) })} className={`${CHAMP} italic`} /></label>
                <label><span className={LIBELLE}>Catégorie</span>
                    <input value={creature.categorie ?? ''} onChange={e => onChange({ categorie: texte(e.target.value) })} placeholder="Xénomorphes aberrants, Anathèmes…" className={CHAMP} /></label>
            </div>

            <div><span className={LIBELLE}>Étiquettes</span>
                <ListeDePastilles libelle="Étiquettes" valeurs={creature.etiquettes ?? []} onChange={v => onChange({ etiquettes: v.length ? v : undefined })} /></div>

            {colonnes.length > 0 && (
                <div><span className={LIBELLE}>Caractéristiques</span>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                        {colonnes.map(c => (
                            <label key={c.id} className="rounded-xl border border-app-border/20 bg-app-bg/40 px-3 py-2 text-center">
                                <span className="block truncate text-ui-10 font-black uppercase tracking-widest text-app-muted" title={c.libelle}>{c.libelle}</span>
                                <input value={String(creature.valeurs?.[c.id] ?? '')} onChange={e => valeur(c.id, e.target.value)} aria-label={c.libelle}
                                    className="w-full bg-transparent text-center font-mono text-base font-bold text-app-text outline-none" />
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div><span className={LIBELLE}>Particularités</span>
                <ListeDePastilles libelle="Particularités" valeurs={creature.particularites ?? []} onChange={v => onChange({ particularites: v.length ? v : undefined })} /></div>

            <div>
                <div className="flex flex-wrap items-center justify-between gap-2"><span className={LIBELLE}>Attaques</span>
                    <span className="flex items-center gap-1 text-ui-12 text-app-muted" title="Une table du jeu tirée au dé : les xénomorphes d'Alien.">Table du jeu :
                        <input value={attaques.table?.univers ?? ''} onChange={e => changerLaTable('univers', e.target.value)} aria-label="Jeu de la table d'attaques" placeholder="jeu"
                            className="w-20 rounded-md border border-app-border/20 bg-app-bg/40 px-2 py-0.5 font-mono text-ui-12 text-app-text outline-none" />
                        /
                        <input value={attaques.table?.table ?? ''} onChange={e => changerLaTable('table', e.target.value)} aria-label="Table d'attaques" placeholder="nom de la table"
                            className="w-56 rounded-md border border-app-border/20 bg-app-bg/40 px-2 py-0.5 font-mono text-ui-12 text-accent outline-none" />
                    </span>
                </div>
                <div className="space-y-2 rounded-xl border border-app-border/20 bg-app-bg/40 p-3">
                    <div className="grid grid-cols-[4rem_12rem_1fr_auto] gap-2 text-ui-10 font-black uppercase tracking-widest text-app-muted">
                        <span>D6</span><span>Attaque</span><span>Effet</span><span />
                    </div>
                    {lignes.length === 0 && (
                        <p className="text-center text-sm italic text-app-muted">
                            {attaques.table?.table ? `Aucune attaque propre : la table ${attaques.table.univers} / ${attaques.table.table} sert.` : 'Aucune attaque.'}
                        </p>
                    )}
                    {lignes.map((l, i) => (
                        <div key={i} className="grid grid-cols-[4rem_12rem_1fr_auto] items-center gap-2">
                            <input value={l.de} onChange={e => changerLaLigne(i, { de: e.target.value })} aria-label="Résultat du dé" placeholder="1-2" className={`${CHAMP} text-center font-mono`} />
                            <input value={l.nom} onChange={e => changerLaLigne(i, { nom: e.target.value })} aria-label="Nom de l'attaque" placeholder="Impact" className={CHAMP} />
                            <input value={l.effet} onChange={e => changerLaLigne(i, { effet: e.target.value })} aria-label="Effet de l'attaque" placeholder="Neuf dés de base, Dégâts 2…" className={CHAMP} />
                            <button aria-label="Retirer l'attaque" onClick={() => changerLesAttaques({ lignes: lignes.filter((_, j) => j !== i) })} className="rounded-lg p-1.5 text-app-muted hover:text-etat-danger"><Trash2 size={15} /></button>
                        </div>
                    ))}
                </div>
                <button onClick={() => changerLesAttaques({ lignes: [...lignes, { de: '', nom: '', effet: '' }] })}
                    className="mt-2 inline-flex items-center gap-1 text-ui-12 font-semibold text-accent hover:underline">
                    <Plus size={14} /> Ajouter une attaque
                </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5" data-sur-le-plateau>
                <span className="text-sm">
                    <span className="mr-2 text-ui-12 font-black uppercase tracking-widest text-accent">Sur le plateau :</span>
                    {surLePlateau.length
                        ? surLePlateau.map(([champ, v], i) => <span key={champ}>{i > 0 && ' · '}<strong>{libelleDuChamp(champ)}</strong> <span className="font-mono text-accent">{String(v)}</span></span>)
                        : <span className="italic text-app-muted">aucune colonne ne remplit la fiche</span>}
                </span>
                <span className="text-ui-10 text-app-muted">Ce que la fiche de plateau recevra</span>
            </div>

            <label className="block"><span className={LIBELLE}>Description</span>
                <textarea value={creature.description ?? ''} onChange={e => onChange({ description: texte(e.target.value) })} rows={2}
                    placeholder="Comportement, biologie…" className={CHAMP} /></label>

            <div className="grid grid-cols-[1fr_8rem] gap-4 border-t border-app-border/10 pt-4">
                <label><span className={LIBELLE}>Livre</span>
                    <span className="relative block">
                        <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                        <input value={creature.source?.livre ?? ''} className={`${CHAMP} pl-9`}
                            onChange={e => onChange({ source: e.target.value.trim() || creature.source?.page ? { ...creature.source, livre: e.target.value } : undefined })} />
                    </span></label>
                <label><span className={LIBELLE}>Page</span>
                    <input value={creature.source?.page ?? ''} type="number" min={1} className={`${CHAMP} font-mono`}
                        onChange={e => onChange({ source: { livre: creature.source?.livre ?? '', ...creature.source, page: e.target.value === '' ? undefined : Number(e.target.value) } })} /></label>
            </div>
            <div className="flex justify-end">
                <button onClick={onRetirer} className="inline-flex items-center gap-1 text-ui-12 font-medium text-etat-danger hover:underline">
                    <Trash2 size={14} /> Supprimer la créature
                </button>
            </div>
        </div>
    );
};

export default EditeurDuBestiaire;
