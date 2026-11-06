import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import type { BestiaireDuJeu, CreatureDuBestiaire } from '../../../types/drivers';
import type { CampDeRencontre } from '../../../types/rencontres.types';
import { rangerParCategorie } from '../../bestiaire/bestiaire';
import LivreALaPage, { type RegistreDesLivres } from '../../forge/rules/components/LivreALaPage';
import { livreDeLaSource } from '../../forge/rules/livres';

/**
 * **L'onglet « Livre » de l'atelier des adversaires** — registre § 210, étape D (05/11/2026), à la
 * demande de David (« On peut faire le D ? ») ; dessiné dans Stitch (`stitch/bestiaire/atelier-livre.png`)
 * et validé. Les créatures du bestiaire du pilote, par catégorie : leurs valeurs, leurs
 * particularités, leurs attaques ; un nombre et un camp ; « Au combat » et « Décliner ».
 *
 * Coexistence confirmée par David : le livre reste dans le pilote ; « Décliner » range une
 * variante dans le bestiaire du meneur, qui copie les valeurs et garde la trace de son modèle.
 */
const CAMPS: { id: CampDeRencontre; label: string }[] = [
    { id: 'enemy', label: 'Ennemis' }, { id: 'ally', label: 'Alliés' }, { id: 'neutral', label: 'Neutres' },
];
const champ = 'bg-app-bg border border-app-border/50 rounded-lg px-2 py-1 text-ui-10 text-app-text';

const CarteDeCreature: React.FC<{
    bestiaire: BestiaireDuJeu;
    creature: CreatureDuBestiaire;
    onAuCombat: (creature: CreatureDuBestiaire, nombre: number, faction: CampDeRencontre) => void;
    onDecliner: (creature: CreatureDuBestiaire) => void;
    registre?: RegistreDesLivres;
}> = ({ bestiaire, creature, onAuCombat, onDecliner, registre }) => {
    const [ouverte, setOuverte] = useState(true);
    const [nombre, setNombre] = useState(2);
    const [faction, setFaction] = useState<CampDeRencontre>('enemy');
    const valeurs = bestiaire.colonnes.filter(c => creature.valeurs[c.id] !== undefined && String(creature.valeurs[c.id]).trim() !== '');
    const attaques = creature.attaques;
    const resumeDesAttaques = attaques?.lignes?.length
        ? `${attaques.lignes.length} ligne${attaques.lignes.length > 1 ? 's' : ''} (D6)`
        : attaques?.table?.table ? `table ${attaques.table.univers} / ${attaques.table.table}` : '';
    // « Livre, p. N » (chemins des livres, étape D, 06/11/2026) : seulement si le PDF est enregistré.
    const ouvrable = !!(registre?.racine && creature.source?.page && livreDeLaSource(registre.livres, creature.source));
    return (
        <article data-creature-du-livre={creature.id} className="rounded-xl bg-app-bg/40 border border-app-border/50">
            <button type="button" onClick={() => setOuverte(o => !o)} aria-expanded={ouverte}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left">
                {ouverte ? <ChevronDown size={13} className="text-app-subtle" /> : <ChevronRight size={13} className="text-app-subtle" />}
                <h4 className="flex-1 text-sm font-black text-app-text truncate">{creature.nom}</h4>
                {creature.source && (
                    <span className="text-ui-9 font-mono text-app-subtle whitespace-nowrap">
                        {creature.source.livre}{creature.source.page ? ` · p. ${creature.source.page}` : ''}
                    </span>
                )}
            </button>
            {ouverte && (
                <div className="px-3 pb-3 space-y-2.5">
                    {valeurs.length > 0 && (
                        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 rounded-lg border border-app-border/40 p-2.5">
                            {valeurs.map(c => (
                                <div key={c.id} className="min-w-0">
                                    <span className="block truncate text-ui-9 font-black uppercase tracking-widest text-app-subtle" title={c.libelle}>{c.libelle}</span>
                                    <span className="text-ui-11 font-black font-mono text-app-text">{String(creature.valeurs[c.id])}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {creature.particularites?.length ? (
                        <div className="flex flex-wrap gap-1">
                            {creature.particularites.map(p => (
                                <span key={p} className="rounded-md border border-accent/30 bg-accent/5 px-1.5 py-0.5 text-ui-9 text-accent">{p}</span>
                            ))}
                        </div>
                    ) : null}
                    {(resumeDesAttaques || ouvrable) && (
                        <div className="flex flex-wrap items-center gap-2">
                            {resumeDesAttaques && <p className="flex-1 text-ui-10 text-app-subtle">Attaques : <span className="text-app-text">{resumeDesAttaques}</span></p>}
                            {ouvrable && registre && <LivreALaPage registre={registre} source={creature.source} sansLivre="rien" className="ml-auto" />}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 border-t border-app-border/30 pt-2.5">
                        <div className="flex items-center rounded-lg border border-app-border/50">
                            <button type="button" aria-label={`Un ${creature.nom} de moins`} onClick={() => setNombre(n => Math.max(1, n - 1))} className="px-1.5 py-1 text-app-subtle hover:text-accent"><Minus size={11} /></button>
                            <input aria-label={`Nombre de ${creature.nom}`} type="number" min={1} max={20} value={nombre}
                                onChange={e => setNombre(Math.max(1, Math.min(20, Math.trunc(Number(e.target.value) || 1))))}
                                className="w-8 bg-transparent text-center text-ui-11 font-mono text-app-text outline-none" />
                            <button type="button" aria-label={`Un ${creature.nom} de plus`} onClick={() => setNombre(n => Math.min(20, n + 1))} className="px-1.5 py-1 text-app-subtle hover:text-accent"><Plus size={11} /></button>
                        </div>
                        <select aria-label={`Camp de ${creature.nom}`} value={faction} onChange={e => setFaction(e.target.value as CampDeRencontre)} className={champ}>
                            {CAMPS.map(c => <option key={c.id} value={c.id}>Camp : {c.label}</option>)}
                        </select>
                        <span className="flex-1" />
                        <button type="button" onClick={() => onAuCombat(creature, nombre, faction)}
                            className="px-3 py-1.5 rounded-lg bg-accent text-app-on-accent text-ui-9 font-black uppercase tracking-widest hover:opacity-90">
                            Au combat ({nombre})
                        </button>
                        <button type="button" onClick={() => onDecliner(creature)}
                            title="Range une variante dans votre bestiaire : ses valeurs sont copiées, la trace du modèle gardée."
                            className="px-3 py-1.5 rounded-lg border border-app-border/60 text-app-muted text-ui-9 font-black uppercase tracking-widest hover:text-accent hover:border-accent/40">
                            Décliner
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
};

export const CreaturesDuLivre: React.FC<{
    bestiaire: BestiaireDuJeu | undefined;
    nomDuJeu: string;
    onAuCombat: (creature: CreatureDuBestiaire, nombre: number, faction: CampDeRencontre) => void;
    onDecliner: (creature: CreatureDuBestiaire) => void;
    /** Le registre des livres du jeu, pour « Livre, p. N ». */
    registre?: RegistreDesLivres;
}> = ({ bestiaire, nomDuJeu, onAuCombat, onDecliner, registre }) => {
    if (!bestiaire?.creatures.length) {
        return (
            <div className="text-center py-10 space-y-2" data-creatures-du-livre>
                <BookOpen className="w-12 h-12 mx-auto text-app-subtle opacity-20" />
                <p className="text-app-muted text-sm">Le pilote de {nomDuJeu} n’a pas de créatures du livre.</p>
                <p className="text-ui-10 text-app-subtle uppercase tracking-widest max-w-sm mx-auto">
                    Elles se remplissent depuis le corpus dans l’éditeur du pilote, section « Bestiaire ».
                </p>
            </div>
        );
    }
    return (
        <div className="space-y-4" data-creatures-du-livre>
            <p className="text-ui-11 text-app-muted leading-relaxed">
                Les créatures du livre, telles que le pilote les porte. Au combat, chaque exemplaire reçoit leur fiche ;
                « Décliner » range une variante dans votre bestiaire.
            </p>
            {rangerParCategorie(bestiaire.creatures).map(g => (
                <section key={g.categorie} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h3 className="text-ui-10 font-black uppercase tracking-widest text-accent">{g.categorie}</h3>
                        <span className="text-ui-9 font-mono text-app-subtle">{g.creatures.length} créature{g.creatures.length > 1 ? 's' : ''}</span>
                    </div>
                    {g.creatures.map(c => <CarteDeCreature key={c.id} bestiaire={bestiaire} creature={c} onAuCombat={onAuCombat} onDecliner={onDecliner} registre={registre} />)}
                </section>
            ))}
        </div>
    );
};
