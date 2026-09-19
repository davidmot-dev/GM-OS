import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, MoreHorizontal, Edit2, Trash2, Check } from 'lucide-react';
import { useSoundStore } from '../useSoundStore';
import type { Atmosphere } from '../useSoundStore';

const AtmosphereManager: React.FC = () => {
    const { 
        atmospheres, 
        activeAtmosphereId, 
        addAtmosphere, 
        removeAtmosphere, 
        setActiveAtmosphereId, 
        renameAtmosphere 
    } = useSoundStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    /**
     * **Le menu ouvert, et OÙ le peindre.**
     *
     * ⛔ **Il ne peut pas vivre dans la barre d'onglets**, signé David le
     * 2026-09-19, capture à l'appui : *« le cadre est caché derrière les
     * pads »*. Trois choses s'y opposent, et aucune ne se corrige par un
     * `z-index` :
     *
     * | Où | Ce que ça fait |
     * | --- | --- |
     * | La barre, `overflow-x-auto` | ⛔ En CSS, dès qu'un axe n'est pas `visible`, l'autre passe à `auto`. Le menu qui pend sous 50 px de haut est donc **découpé**. |
     * | `SoundDashboard`, `overflow-hidden` | un second ciseau, plus haut |
     * | Le même, `backdrop-blur-sm` | un **contexte d'empilement** : le `z-50` du menu y est enfermé, et les pads sont peints plus loin dans le document |
     *
     * *Un élément ne peut pas sortir de l'ordre de peinture de son parent* —
     * la leçon du Media Hub, le 16/09. ⚠️ **Mais là-bas un `z-index` sur le
     * bandeau suffisait ; ici non**, parce qu'un vrai découpage s'y ajoute. Le
     * seul remède qui échappe aux trois est un **portail**, avec la position
     * prise sur le bouton au moment du clic.
     */
    const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
    const menuOpenId = menu?.id ?? null;

    /** Ouvre le menu sous le bouton, ou le referme s'il l'était déjà. */
    const basculerLeMenu = (id: string, cible: HTMLElement) => {
        if (menuOpenId === id) { setMenu(null); return; }
        const r = cible.getBoundingClientRect();
        /* Le coin haut-gauche du menu : sous le bouton, aligné à gauche de
           l'onglet. `fixed` compte depuis la fenêtre, donc on prend les
           coordonnées écran telles quelles. */
        setMenu({ id, x: r.left, y: r.bottom + 8 });
    };

    const handleAdd = () => {
        const name = `Atmosphère ${atmospheres.length + 1}`;
        addAtmosphere(name);
    };

    const startRename = (atmos: Atmosphere) => {
        setEditingId(atmos.id);
        setEditValue(atmos.name);
        setMenu(null);
    };

    const handleRename = () => {
        if (editingId && editValue.trim()) {
            renameAtmosphere(editingId, editValue.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="flex items-center gap-3 py-2 overflow-x-auto no-scrollbar mask-fade-right min-h-[50px]">
            <div className="flex items-center gap-2 p-1.5 bg-app-bg/40 backdrop-blur-xl border border-app-border/50 rounded-2xl shadow-inner">
                {atmospheres.map((atmos) => (
                    <div key={atmos.id} className="relative group flex items-center">
                        {editingId === atmos.id ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 border border-accent rounded-xl shadow-glow-accent/20">
                                <input
                                    autoFocus
                                    className="bg-transparent text-ui-10 font-black uppercase tracking-widest text-white outline-none w-24"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={handleRename}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                />
                                <button onClick={handleRename}>
                                    <Check size={12} className="text-accent" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <button
                                    onClick={() => setActiveAtmosphereId(atmos.id)}
                                    onDoubleClick={() => startRename(atmos)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        basculerLeMenu(atmos.id, e.currentTarget);
                                    }}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-ui-10 font-black uppercase tracking-widest transition-all ${
                                        activeAtmosphereId === atmos.id
                                            ? 'bg-accent text-white shadow-glow-accent'
                                            : 'text-app-text/40 hover:text-app-text/80 hover:bg-white/5'
                                    }`}
                                >
                                    {atmos.name}
                                </button>
                                
                                {/* Hover Menu Trigger */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        /* On vise l'ONGLET, pas la pastille « … » : le menu
                                           s'aligne sur le bord gauche du nom, pas sur un
                                           rond de vingt pixels posé dans son coin. */
                                        basculerLeMenu(atmos.id, e.currentTarget.parentElement ?? e.currentTarget);
                                    }}
                                    className={`absolute -right-1 -top-1 size-5 bg-app-bg border border-app-border/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:border-app-border hover:bg-app-surface ${menuOpenId === atmos.id ? 'opacity-100' : ''}`}
                                >
                                    <MoreHorizontal size={10} className="text-app-text/40" />
                                </button>

                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/*
              **Le menu vit dans un portail, et il n'y en a qu'UN.**

              Il était rendu à l'intérieur de chaque onglet, dans une barre qui
              découpe et sous un `backdrop-filter` qui enferme : *le cadre était
              coupé et derrière les pads.* Monté sur `document.body`, il échappe
              aux deux ciseaux et au contexte d'empilement.

              ⚠️ **Un seul, pas un par onglet** : deux menus identiques empilés
              se disputeraient le clic de fermeture, et c'est de toute façon ce
              que `menu` dit — il n'y en a jamais deux d'ouverts.
            */}
            {menu && createPortal(
                <>
                    {/* Le voile qui referme. Il couvre la fenêtre, donc il doit
                        être sous le menu et au-dessus de tout le reste. */}
                    <div className="fixed inset-0 z-[90]" onClick={() => setMenu(null)} />
                    <div
                        style={{ left: menu.x, top: menu.y }}
                        className="fixed w-32 bg-app-surface/95 backdrop-blur-2xl border border-app-border rounded-xl shadow-3xl p-1 z-[91] animate-in fade-in zoom-in-95 duration-150"
                    >
                        <button
                            onClick={() => {
                                const atmos = atmospheres.find(a => a.id === menu.id);
                                if (atmos) startRename(atmos);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-ui-9 font-black text-app-text/40 uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
                        >
                            <Edit2 size={10} />
                            Rename
                        </button>
                        <button
                            onClick={() => {
                                if (confirm('Supprimer cette atmosphère ?')) {
                                    removeAtmosphere(menu.id);
                                }
                                setMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-ui-9 font-black text-red-400/70 uppercase tracking-widest hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                            <Trash2 size={10} />
                            Delete
                        </button>
                    </div>
                </>,
                document.body,
            )}

            <button
                onClick={handleAdd}
                className="size-9 flex items-center justify-center bg-app-bg/40 border border-app-border/50 text-slate-500 rounded-2xl hover:border-accent/30 hover:text-accent hover:bg-accent/5 transition-all active:scale-95 shadow-lg flex-shrink-0"
                title="Nouvelle Atmosphère"
            >
                <Plus size={18} />
            </button>
        </div>
    );
};

export default AtmosphereManager;
