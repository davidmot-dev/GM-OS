import React from 'react';
import { useNPCStore } from '../useNPCStore';
import { Trash2, Trash, User, MapPin, Package, Zap, Quote, ChevronRight, Skull } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRegimeDInterface } from '../../session/hooks/useRegimeDInterface';
import HorsDePortee from '../../session/components/HorsDePortee';
import { gmConfirm } from '../../../stores/useModalStore';

const NPCHistory: React.FC = () => {
    /**
     * **Axe N — ce qui est à portée de main.** Les PNJ sont le cinquième et
     * dernier des modules dédoublés. Retirer un PNJ de l'historique se fait
     * **sans confirmation**, et la corbeille est logée juste à côté du chevron
     * qui ouvre la fiche — *deux gestes voisins dont l'un consulte et l'autre
     * efface.*
     */
    const regime = useRegimeDInterface();
    const { t } = useTranslation(['modules', 'common']);
    const { savedEntities, deleteFromMemo, setCurrentEntity, clearHistory } = useNPCStore();

    if (savedEntities.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-slate-600 text-center animate-in fade-in duration-700">
                <div className="w-12 h-12 rounded-full border border-app-border flex items-center justify-center mb-4">
                    <Trash2 size={24} className="opacity-20" />
                </div>
                <p className="text-xs uppercase tracking-widest font-bold mb-1">{t('npc.history.empty_title')}</p>
                <p className="text-[10px]">{t('npc.history.empty_desc')}</p>
            </div>
        );
    }

    const getMiniIcon = (category: string) => {
        switch (category) {
            case 'npcs': return <User size={14} className="text-accent" />;
            case 'places': return <MapPin size={14} className="text-emerald-400" />;
            case 'items': return <Package size={14} className="text-amber-400" />;
            case 'events': return <Zap size={14} className="text-purple-400" />;
            case 'rumors': return <Quote size={14} className="text-rose-400" />;
            default: return <User size={14} />;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-app-border bg-app-bg/30">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('npc.history.title')}</span>
                {/*
                    **Le massif était nu, et j'avais protégé le détail.**

                    « Tout effacer » vide l'historique **entier**, et il est
                    toujours visible en haut du panneau — alors que la corbeille
                    par ligne, qui ne retire qu'un mémo, était déjà repliée.

                    Il passait aussi par `window.confirm` : une boîte native au
                    milieu d'une séance, qui ne ressemble à rien de ce que
                    l'application montre par ailleurs. *Une alerte qu'on ne
                    reconnaît pas se clique sans se lire.*
                */}
                <HorsDePortee regime={regime} libelle={t('npc.history.clear')} compact icone={<Trash size={14} />}>
                    <button
                        onClick={() => gmConfirm(t('npc.history.clear_confirm'), clearHistory)}
                        className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded transition-colors text-slate-600"
                        title={t('npc.history.clear')}
                    >
                        <Trash size={14} />
                    </button>
                </HorsDePortee>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                {savedEntities.map((entity) => (
                    <div
                        key={entity.id}
                        onClick={() => setCurrentEntity(entity)}
                        className="group flex items-center gap-3 p-2 rounded-lg bg-app-surface/20 hover:bg-app-surface/50 border border-transparent hover:border-app-border cursor-pointer transition-all shrink-0"
                    >
                        <div className="w-8 h-8 rounded-md bg-app-bg flex items-center justify-center shrink-0 border border-app-border overflow-hidden">
                            {entity.avatar ? (
                                <img
                                    src={entity.avatar.startsWith('http') || entity.avatar.startsWith('blob:') || entity.avatar.startsWith('gmos://') || entity.avatar.startsWith('data:')
                                        ? entity.avatar
                                        : `gmos://media/${entity.avatar.replace(/^file:\/\/\//, '').replace(/\\/g, '/')}`}
                                    alt={entity.name}
                                    className={`w-full h-full object-cover ${entity.isDead ? 'grayscale opacity-50' : ''}`}
                                />
                            ) : (
                                getMiniIcon(entity.category)
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className={`text-[11px] font-bold truncate ${entity.isDead ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                    {entity.name}
                                </p>
                                {entity.isDead && <Skull size={10} className="text-rose-500 shrink-0" />}
                            </div>
                            <p className="text-[8px] text-slate-500 uppercase">{t(`npc.categories.${entity.category}`)}</p>
                        </div>

                        <HorsDePortee regime={regime} libelle={t('npc.history.delete_tooltip')} compact surInvitation icone={<Trash2 size={12} />}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    /*
                                      **La confirmation manquait.** La corbeille
                                      est logée juste à côté du chevron qui ouvre
                                      la fiche — *deux gestes voisins dont l'un
                                      consulte et l'autre efface* — et elle est
                                      `opacity-0` jusqu'au survol, donc on ne la
                                      voyait pas venir.
                                    */
                                    gmConfirm(
                                        t('npc.history.delete_confirm', { name: entity.name }),
                                        () => deleteFromMemo(entity.id),
                                    );
                                }}
                                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 hover:text-rose-500 rounded transition-all text-slate-500"
                                title={t('npc.history.delete_tooltip')}
                            >
                                <Trash2 size={12} />
                            </button>
                        </HorsDePortee>

                        <ChevronRight size={14} className="text-slate-700 group-hover:text-accent transition-colors" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NPCHistory;

