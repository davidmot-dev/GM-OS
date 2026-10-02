import React, { useState } from 'react';
import { Search, Plus, Edit2, BookOpen } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import { gmCustom } from '../../../stores/useModalStore';
import TexteMarkdown from '../../../components/TexteMarkdown';
import { Etiquette } from '../../../components/socle';
import { reparerLeMojibake } from '../../../utils/reparerLeMojibake';

/** Les huit catégories du wiki — `chronicle.types.ts`. */
export const CATEGORIES_DU_WIKI: Record<string, string> = {
    npc: 'PNJ', location: 'Lieu', organization: 'Organisation', lore: 'Lore',
    item: 'Objet', clue: 'Indice', rumor: 'Rumeur', other: 'Autre',
};

/**
 * **Le wiki du monde, à côté de la frise** — refonte, L5, étape 2.
 *
 * On ne bascule plus d'onglet pour relier un événement à un lieu : la
 * recherche, les catégories, l'entrée ouverte et « Modifier la fiche » restent
 * à droite de la chronologie. Le wiki complet (images, liens vers l'éditeur de
 * campagne) reste derrière l'onglet « Wiki du monde ».
 */
const PanneauDuWiki: React.FC = () => {
    const { wikiEntries, activeCampaignId, selectedWikiEntryId, setSelectedWikiEntryId } = useSessionOSStore();
    const [recherche, setRecherche] = useState('');
    const [categorie, setCategorie] = useState<string>('all');

    const entrees = wikiEntries.filter(e => e.campaignId === activeCampaignId);
    const q = recherche.trim().toLowerCase();
    const visibles = entrees
        .filter(e => categorie === 'all' || e.category === categorie)
        .filter(e => !q || e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q));
    const ouverte = entrees.find(e => e.id === selectedWikiEntryId);

    return (
        <aside className="flex h-full flex-col overflow-hidden border-l border-app-border bg-app-surface/40">
            <div className="flex flex-col gap-2 border-b border-app-border p-3">
                <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text">
                        <BookOpen size={15} className="text-accent" />Wiki du monde
                    </h3>
                    <button
                        onClick={() => gmCustom('wiki-entry-add')}
                        className="flex items-center gap-1 rounded-md border border-app-border px-2 py-1 text-ui-10 font-black uppercase tracking-widest text-accent hover:border-accent/50"
                    >
                        <Plus size={11} />Entrée
                    </button>
                </div>
                <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-app-subtle" />
                    <input
                        value={recherche}
                        onChange={e => setRecherche(e.target.value)}
                        placeholder="Rechercher dans le wiki…"
                        className="w-full rounded-md border border-app-border bg-app-bg/40 py-1.5 pl-8 pr-2 text-xs text-app-text outline-none placeholder:text-app-subtle focus:border-accent"
                    />
                </div>
                <div className="flex flex-wrap gap-1">
                    {['all', ...Object.keys(CATEGORIES_DU_WIKI)].map(c => (
                        <button
                            key={c}
                            onClick={() => setCategorie(c)}
                            className={`rounded px-2 py-0.5 text-ui-9 font-black uppercase tracking-widest transition-all ${
                                categorie === c ? 'bg-accent text-app-on-accent' : 'text-app-muted hover:text-app-text'
                            }`}
                        >
                            {c === 'all' ? 'Tout' : CATEGORIES_DU_WIKI[c]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-h-56 shrink-0 overflow-y-auto border-b border-app-border p-2 custom-scrollbar">
                {visibles.map(e => (
                    <button
                        key={e.id}
                        onClick={() => setSelectedWikiEntryId(e.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-all ${
                            e.id === selectedWikiEntryId ? 'bg-accent/10 text-accent' : 'text-app-text hover:bg-app-text/5'
                        }`}
                    >
                        <span className="truncate font-bold">{reparerLeMojibake(e.title)}</span>
                        <span className="shrink-0 text-ui-9 font-black uppercase tracking-widest text-app-muted">{CATEGORIES_DU_WIKI[e.category] ?? e.category}</span>
                    </button>
                ))}
                {visibles.length === 0 && <p className="px-2 py-3 text-center text-xs italic text-app-subtle">Aucune entrée.</p>}
            </div>

            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                {ouverte ? (
                    <div className="flex flex-col gap-3">
                        <div>
                            <Etiquette ton="info">{CATEGORIES_DU_WIKI[ouverte.category] ?? ouverte.category}</Etiquette>
                            <h4 className="mt-1.5 font-display text-lg font-bold leading-tight text-app-text">{reparerLeMojibake(ouverte.title)}</h4>
                        </div>
                        <div className="prose prose-invert prose-sm max-w-none text-app-text prose-headings:text-app-text prose-strong:text-app-text prose-a:text-accent">
                            <TexteMarkdown>{reparerLeMojibake(ouverte.content)}</TexteMarkdown>
                        </div>
                        <button
                            onClick={() => gmCustom('wiki-entry-edit', ouverte)}
                            className="flex items-center justify-center gap-2 rounded-lg border border-accent/40 py-2 text-ui-10 font-black uppercase tracking-widest text-accent hover:bg-accent/10"
                        >
                            <Edit2 size={12} />Modifier la fiche
                        </button>
                    </div>
                ) : (
                    <p className="py-6 text-center text-xs italic text-app-subtle">Choisissez une entrée pour la lire ici, à côté de la frise.</p>
                )}
            </div>
        </aside>
    );
};

export default PanneauDuWiki;
