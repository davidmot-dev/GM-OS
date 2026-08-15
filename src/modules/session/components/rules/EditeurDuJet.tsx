import React from 'react';
import { Dices, Plus, Trash2 } from 'lucide-react';
import type { GameDriver } from '../../../../types/drivers';
import type { ComposanteDeJet } from '../../../dice/DescripteurDeJet';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';

/**
 * De quoi un jet se compose — **à la main, sans repasser par la Forge**.
 *
 * **Pourquoi cet écran existe.** David, le 2026-08-15 : *« comment puis-je
 * corriger cela à la main ? »* — après qu'on lui eut conseillé d'amender son
 * pilote Alien, dont la réserve était un nombre fixe. La réponse honnête était
 * qu'il ne pouvait pas : l'éditeur du moteur de règles montrait le moteur de
 * dés, le combat, le butin et les personas, **et pas une ligne du descripteur de
 * jet**. Seule une redérivation complète pouvait le changer, pour deux lignes.
 *
 * *C'est le même défaut que les personas du 2026-08-14 : quelque chose existe,
 * fonctionne, et n'a aucun écran — donc n'existe pas pour qui s'en sert.*
 *
 * **La section se choisit dans une liste, jamais à la main.** C'est le point
 * important : le défaut du matin même venait d'un `sectionId` écrit contre un
 * autre gabarit — « competences » quand la fiche disait « stats ». Un menu qui
 * ne propose que les sections **de la fiche du pilote** rend ce défaut
 * inexprimable, au lieu de le rattraper après coup.
 */
interface EditeurDuJetProps {
    driver: GameDriver;
    gabarit?: SheetTemplate;
    onUpdate: (patch: Partial<GameDriver>) => void;
}

/** Une composante, éditable : ce qu'elle s'appelle et où on la choisit. */
const LigneDeComposante: React.FC<{
    composante: ComposanteDeJet;
    sections: SheetTemplate['sections'];
    onChange: (suivante: ComposanteDeJet) => void;
    onRetirer: () => void;
}> = ({ composante, sections, onChange, onRetirer }) => (
    <div className="flex items-center gap-2">
        <input
            type="text"
            value={composante.label}
            onChange={e => onChange({ ...composante, label: e.target.value })}
            placeholder="Intitulé — « Attribut »"
            title="Ce que le joueur lit au-dessus du menu"
            className="flex-1 bg-app-bg/40 px-4 py-2.5 rounded-xl border border-app-border/20 text-sm focus:border-accent/50 outline-none"
        />
        <input
            type="text"
            value={composante.id}
            onChange={e => onChange({ ...composante, id: e.target.value })}
            placeholder="identifiant"
            title="Identifiant interne — il doit rester unique dans ce jet"
            className="w-36 bg-app-bg/40 px-3 py-2.5 rounded-xl border border-app-border/20 font-mono text-xs text-app-text/60 focus:border-accent/50 outline-none"
        />
        {/*
            **Une liste, pas un champ libre.** Le sectionId écrit à la main est
            exactement ce qui a vidé les menus de la fiche de Dune : le pilote
            visait « competences » quand la fiche nommait « stats ».
        */}
        <select
            value={composante.sectionId}
            onChange={e => onChange({ ...composante, sectionId: e.target.value })}
            title="Section de la fiche où le joueur choisit sa valeur"
            className="w-56 bg-app-bg/40 px-3 py-2.5 rounded-xl border border-app-border/20 text-xs focus:border-accent/50 outline-none cursor-pointer"
        >
            <option value="">— section de la fiche —</option>
            {sections.map(s => (
                <option key={s.id} value={s.id}>{s.label || s.id}</option>
            ))}
            {/* Une section devenue introuvable reste visible plutôt que d'être
                effacée en silence : c'est au meneur de la remplacer. */}
            {composante.sectionId && !sections.some(s => s.id === composante.sectionId) && (
                <option value={composante.sectionId}>⚠ {composante.sectionId} (introuvable)</option>
            )}
        </select>
        <button
            onClick={onRetirer}
            className="p-2.5 rounded-xl text-app-text/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Retirer cette composante"
        ><Trash2 size={16} /></button>
    </div>
);

const EditeurDuJet: React.FC<EditeurDuJetProps> = ({ driver, gabarit, onUpdate }) => {
    const jet = driver.jet;
    const sections = gabarit?.sections ?? [];

    /** Toute écriture part d'un descripteur minimal viable. */
    const majJet = (patch: Partial<NonNullable<GameDriver['jet']>>) =>
        onUpdate({ jet: { sens: 'superieur-ou-egal', ...jet, ...patch } });

    const majReserve = (patch: Partial<NonNullable<NonNullable<GameDriver['jet']>['reserve']>>) =>
        majJet({ reserve: { base: 0, max: 10, faces: 6, ...jet?.reserve, ...patch } });

    const nombre = (valeur: number | undefined, onChange: (n: number) => void, titre: string) => (
        <label className="flex-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/60 mb-2 block px-1">{titre}</span>
            <input
                type="number"
                value={valeur ?? 0}
                onChange={e => onChange(parseInt(e.target.value) || 0)}
                title={titre}
                className="w-full bg-app-bg/40 px-4 py-3 rounded-xl border border-app-border/20 font-mono text-sm text-accent focus:border-accent/50 outline-none"
            />
        </label>
    );

    const listeDeComposantes = (
        titre: string,
        explication: string,
        liste: ComposanteDeJet[],
        ecrire: (suivante: ComposanteDeJet[]) => void,
    ) => (
        <div className="space-y-3">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 px-1">{titre}</p>
                <p className="text-[11px] text-app-text/40 italic px-1 mt-1 leading-relaxed">{explication}</p>
            </div>
            {liste.map((composante, i) => (
                <LigneDeComposante
                    key={i}
                    composante={composante}
                    sections={sections}
                    onChange={suivante => ecrire(liste.map((c, j) => (j === i ? suivante : c)))}
                    onRetirer={() => ecrire(liste.filter((_, j) => j !== i))}
                />
            ))}
            <button
                onClick={() => ecrire([...liste, { id: '', label: '', sectionId: '' }])}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-accent/30 text-accent text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 transition-all"
            ><Plus size={14} /> Ajouter une composante</button>
        </div>
    );

    return (
        <div className="p-8 bg-app-surface/20 border border-app-border/10 rounded-[2.5rem] backdrop-blur-sm space-y-8">
            <header className="flex items-center gap-3">
                <Dices className="text-accent" size={20} />
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-app-text">Composition du jet</h3>
                    <p className="text-[11px] text-app-text/40 italic mt-0.5">
                        Ce que le joueur retient sur sa fiche avant de lancer, et combien de dés il prend.
                    </p>
                </div>
            </header>

            {!gabarit && (
                <p className="text-[11px] text-amber-300/70 italic">
                    Ce pilote ne désigne aucune fiche : sans elle, aucune section où choisir.
                    Rattache-lui un gabarit ci-dessus.
                </p>
            )}

            {listeDeComposantes(
                'Réserve — combien de dés',
                'Chez Alien : « autant de dés que la somme de ton attribut et de ta compétence ». '
                + 'Laisse vide si le jeu lance un nombre fixe de dés.',
                jet?.reserve?.composantes ?? [],
                composantes => majReserve({ composantes }),
            )}

            <div className="flex gap-4">
                {nombre(jet?.reserve?.base, base => majReserve({ base }), 'Dés d’office')}
                {nombre(jet?.reserve?.max, max => majReserve({ max }), 'Plafond')}
                {nombre(jet?.reserve?.faces, faces => majReserve({ faces }), 'Faces')}
            </div>

            {listeDeComposantes(
                'Seuil — sous quoi il faut passer',
                'Chez Dune : une compétence plus un principe, choisis test par test. '
                + 'Laisse vide si le jeu compte les dés qui atteignent une valeur fixe.',
                jet?.seuil ?? [],
                seuil => majJet({ seuil }),
            )}

            <div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/60 mb-2 block px-1">
                    Sens de la comparaison
                </span>
                <select
                    value={jet?.sens ?? 'superieur-ou-egal'}
                    onChange={e => majJet({ sens: e.target.value as NonNullable<GameDriver['jet']>['sens'] })}
                    title="Un dé est-il une réussite au-dessus ou en dessous ?"
                    className="w-full bg-app-bg/40 px-5 py-3 rounded-2xl border border-app-border/20 text-sm focus:border-accent/50 outline-none cursor-pointer"
                >
                    <option value="superieur-ou-egal">Réussite au-dessus — « chaque six est une réussite »</option>
                    <option value="sous-ou-egal">Réussite en dessous — « chaque dé sous le seuil »</option>
                </select>
                <p className="text-[11px] text-app-text/40 italic px-1 mt-2 leading-relaxed">
                    Les deux se ressemblent et s’inversent : un jet résolu à l’envers ne se voit jamais en séance.
                </p>
            </div>
        </div>
    );
};

export default EditeurDuJet;
