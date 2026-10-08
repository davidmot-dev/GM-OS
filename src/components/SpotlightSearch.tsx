import React, { useRef, useEffect } from 'react';
import { useFermetureParEchap } from '../hooks/useFermetureParEchap';
import { 
  Search, 
  CornerDownLeft, 
  X, 
  User, 
  Music, 
  Book, 
  Settings,
  Zap,
  Map as MapIcon,
  type LucideIcon,
} from 'lucide-react';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { fractionDeVie, decrireLaSante } from '../modules/combat/logic/SanteDuCombattant';
import { ResolvedImage } from './ResolvedImage';
import { Etiquette, Icone } from './socle';
import { useTranslation } from 'react-i18next';
import { useSpotlight, type SpotlightResult } from '../hooks/useSpotlight';

export const SpotlightSearch: React.FC = () => {
    const { 
        isOpen, 
        setIsOpen, 
        query, 
        setQuery, 
        results, 
        selectedIndex, 
        setSelectedIndex 
    } = useSpotlight();

    const { t } = useTranslation(['common', 'modules']);
    const entities = useSessionOSStore(s => s.entities);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Keep selected item in view
    useEffect(() => {
        if (scrollRef.current && selectedIndex >= 0) {
            /* Par attribut, pas par rang d'enfant : les titres de groupe
               décaleraient l'indice. */
            const selectedElement = scrollRef.current.querySelector<HTMLElement>(`[data-rang="${selectedIndex}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    /*
      **Trois voies menaient à la même fermeture ; il n'en reste qu'une.**

      Échap était écouté deux fois — sur `window` dans `useSpotlight`, et sur
      ce conteneur — et aucune des deux ne savait ce qui pouvait être ouvert
      dessous. La recherche s'ouvre **par-dessus tout** (z-9999) : une frappe la
      fermait donc **avec** la boîte qu'elle recouvrait.

      ⭐ C'est aussi elle qui a servi de précédent le 2026-09-13 : elle ferme
      depuis son champ focalisé **depuis toujours**, ce qui a fait écarter la
      règle des deux frappes pour toute l'application.
    */
    useFermetureParEchap(isOpen, () => setIsOpen(false), 'Recherche rapide');

    if (!isOpen) return null;

    /*
      **L'aperçu, pour les entités seulement** — retenu par David le
      2026-09-29 : vide pour une musique ou une action, il n'apparaît pas.
    */
    const choisi = results[selectedIndex];
    const entiteChoisie = choisi?.type === 'entity'
        ? entities.find(e => `entity-${e.id}` === choisi.id)
        : undefined;
    const fraction = entiteChoisie ? fractionDeVie(entiteChoisie) : null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-[12vh] pointer-events-none">
            {/* L'écran assombri : un clic dehors ferme, comme Échap. */}
            <div
                className="fixed inset-0 bg-app-bg/70 backdrop-blur-sm pointer-events-auto"
                onClick={() => setIsOpen(false)}
            />

            {/*
              **La palette dans le cadre commun** — refonte, L5, maquette retenue
              le 2026-09-27 : un seul grand champ, les résultats groupés par
              sorte avec leur titre, le choisi surligné avec son geste, et en
              pied les touches et le nombre de résultats.
            */}
            <div
                data-cadre-de-surcouche=""
                className={`relative flex w-full flex-col overflow-hidden rounded-xl border border-app-border bg-app-surface text-app-text shadow-2xl pointer-events-auto animate-in fade-in zoom-in duration-200 ${results.some(r => r.type === 'entity') ? 'max-w-4xl' : 'max-w-2xl'}`}
            >
                <div className="flex items-center gap-3 border-b border-app-border px-4 py-3">
                    <Search className="h-5 w-5 shrink-0 text-accent" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('common:spotlight.placeholder')}
                        className="flex-1 border-none bg-transparent text-lg text-app-text outline-none placeholder:text-app-subtle"
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        title={t('common:spotlight.close_tooltip')}
                        className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-app-muted transition-colors hover:bg-app-text/5 hover:text-app-text"
                    >
                        <span className="rounded border border-app-border px-1.5 py-0.5 font-mono text-ui-9 font-bold">Échap</span>
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex min-h-0">
                    <div ref={scrollRef} className="max-h-[60vh] min-w-0 flex-1 overflow-y-auto py-1 custom-scrollbar">
                        {results.length > 0 ? (
                            results.map((result, index) => {
                                const nouveauGroupe = index === 0 || results[index - 1].type !== result.type;
                                const groupe = GROUPES[result.type];
                                return (
                                    <React.Fragment key={result.id}>
                                        {nouveauGroupe && groupe && (
                                            <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-ui-10 font-black uppercase tracking-widest text-accent">
                                                <groupe.icone className="h-3.5 w-3.5" />{groupe.libelle}
                                            </div>
                                        )}
                                        <ResultItem
                                            rang={index}
                                            result={result}
                                            isSelected={index === selectedIndex}
                                            onSelect={() => result.action()}
                                            onHover={() => setSelectedIndex(index)}
                                        />
                                    </React.Fragment>
                                );
                            })
                        ) : query.trim() ? (
                            <div className="px-6 py-12 text-center">
                                <Search className="mx-auto mb-4 h-10 w-10 text-app-subtle" />
                                <p className="text-lg font-medium text-app-text">{t('common:spotlight.no_results', { query })}</p>
                                <p className="mt-1 text-sm text-app-muted">{t('common:spotlight.no_results_sub')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3 px-4 py-3">
                                <div className="px-1 text-ui-10 font-black uppercase tracking-widest text-app-muted">{t('common:spotlight.suggestions')}</div>
                                <div className="grid grid-cols-2 gap-2">
                                    <QuickTip icon={User} label={t('common:spotlight.quick_tips.npcs')} />
                                    <QuickTip icon={Music} label={t('common:spotlight.quick_tips.audio')} />
                                    <QuickTip icon={Book} label={t('common:spotlight.quick_tips.wiki')} />
                                    <QuickTip icon={Settings} label={t('common:spotlight.quick_tips.system')} />
                                </div>
                            </div>
                        )}
                    </div>

                    {entiteChoisie && (
                        <aside className="hidden w-72 shrink-0 flex-col gap-3 border-l border-app-border bg-app-bg/40 p-4 md:flex">
                            <p className="text-ui-10 font-black uppercase tracking-widest text-accent">Aperçu</p>
                            <div className="flex items-center gap-3">
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-app-border bg-app-surface-2">
                                    {entiteChoisie.avatar
                                        ? <ResolvedImage src={entiteChoisie.avatar} alt={entiteChoisie.name} className="h-full w-full object-cover" />
                                        : <span className="flex h-full w-full items-center justify-center text-app-subtle"><User size={22} /></span>}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate font-display text-base font-bold text-app-text">{entiteChoisie.name}</p>
                                    <Etiquette ton={TON_DU_CAMP[entiteChoisie.role] ?? 'neutre'}>{t(`modules:session.npc_gallery.roles.${entiteChoisie.role}`, { defaultValue: entiteChoisie.role })}</Etiquette>
                                </div>
                            </div>
                            {entiteChoisie.description && <p className="line-clamp-3 text-xs leading-relaxed text-app-muted">{entiteChoisie.description}</p>}
                            {fraction !== null ? (
                                <div className="rounded-lg border border-app-border p-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-app-muted">Santé</span>
                                        <span className="font-mono font-bold text-app-text">{entiteChoisie.hp} / {entiteChoisie.maxHp}</span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-app-bg">
                                        <div className={`h-full ${fraction > 0.5 ? 'bg-etat-succes' : fraction > 0.25 ? 'bg-etat-alerte' : 'bg-etat-danger'}`} style={{ width: `${fraction * 100}%` }} />
                                    </div>
                                </div>
                            ) : decrireLaSante(entiteChoisie) ? (
                                <p className="rounded-lg border border-app-border p-3 text-xs text-app-text">{decrireLaSante(entiteChoisie)}</p>
                            ) : null}
                            <button
                                onClick={() => choisi.action()}
                                className="mt-auto rounded-lg bg-accent py-2.5 text-ui-10 font-black uppercase tracking-widest text-app-on-accent hover:brightness-110"
                            >
                                Ouvrir la fiche <span className="ml-1 rounded border border-app-on-accent/30 px-1 font-mono">Entrée</span>
                            </button>
                        </aside>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-app-border px-4 py-2 text-ui-10 text-app-muted">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><kbd className="rounded border border-app-border px-1 font-mono">↑↓</kbd>{t('common:spotlight.nav_hint')}</span>
                        <span className="flex items-center gap-1.5"><kbd className="rounded border border-app-border px-1 font-mono">Entrée</kbd>{t('common:spotlight.select_hint')}</span>
                        <span className="flex items-center gap-1.5"><kbd className="rounded border border-app-border px-1 font-mono">Échap</kbd>Fermer</span>
                    </div>
                    {query.trim() && <span className="font-bold text-accent">{results.length} résultat(s)</span>}
                </div>
            </div>
        </div>
    );
};

/** Les sortes de résultat, dans l'ordre où `useSpotlight` les range. */
const GROUPES: Record<string, { libelle: string; icone: LucideIcon }> = {
    entity: { libelle: 'Entités', icone: User },
    map: { libelle: 'Cartes', icone: MapIcon },
    audio: { libelle: 'Audio', icone: Music },
    rule: { libelle: 'Règles & wiki', icone: Book },
    action: { libelle: 'Actions & outils', icone: Zap },
};
const TON_DU_CAMP = { ally: 'succes', neutral: 'neutre', hostile: 'danger', boss: 'accent' } as const;

const ResultItem: React.FC<{
    rang: number;
    result: SpotlightResult;
    isSelected: boolean;
    onSelect: () => void;
    onHover: () => void;
}> = ({ rang, result, isSelected, onSelect, onHover }) => {
    const { t } = useTranslation(['common']);
    const Icon = result.icon;

    return (
        <div
            data-rang={rang}
            onClick={onSelect}
            onMouseEnter={onHover}
            className={`mx-2 flex cursor-pointer items-center gap-3 rounded-lg border-l-2 px-3 py-2 transition-all duration-150 ${
                isSelected ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-app-text/5'
            }`}
        >
            <div className={`shrink-0 rounded-md border p-1.5 ${isSelected ? 'border-accent text-accent' : 'border-app-border text-app-muted'}`}>
                {result.icone ? <Icone nom={result.icone} taille={14} repli={<Icon className="h-4 w-4" />} /> : <Icon className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
                <div className={`truncate text-sm font-bold ${isSelected ? 'text-accent' : 'text-app-text'}`}>{result.title}</div>
                {result.subtitle && <div className="mt-0.5 truncate text-ui-11 text-app-muted">{result.subtitle}</div>}
            </div>
            {isSelected && (
                <span className="flex shrink-0 items-center gap-1 rounded border border-accent/50 px-2 py-0.5 text-ui-10 font-black uppercase tracking-widest text-accent">
                    {result.type === 'action' ? 'Exécuter' : t('common:spotlight.open_hint')}<CornerDownLeft className="h-3 w-3" />
                </span>
            )}
        </div>
    );
};

const QuickTip: React.FC<{ icon: LucideIcon; label: string }> = ({ icon: Icon, label }) => (
    <div className="flex cursor-default items-center gap-2 rounded-lg border border-app-border bg-app-bg/40 p-2 text-app-muted">
        <Icon className="h-4 w-4" />
        <span className="text-ui-11 font-medium">{label}</span>
    </div>
);
