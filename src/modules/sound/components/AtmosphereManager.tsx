import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, MoreHorizontal, Edit2, Trash2, Check, Globe, Bookmark, Unlink } from 'lucide-react';
import { useSoundStore } from '../useSoundStore';
import type { Atmosphere } from '../useSoundStore';
import { useAtmospheresVisibles } from '../hooks/useAtmospheresVisibles';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';

const AtmosphereManager: React.FC = () => {
    const {
        activeAtmosphereId,
        addAtmosphere,
        removeAtmosphere,
        setActiveAtmosphereId,
        renameAtmosphere,
        assignerLAtmosphere,
    } = useSoundStore();

    /*
      **Les onglets de la campagne ouverte.** Le même verdict que le clavier,
      qui appelle la même logique pure — *deux filtres écrits séparément
      finiraient par diverger, et l'écart ne se verrait qu'en séance.*
    */
    const { visibles: atmospheres, classees, active, campagneId } = useAtmospheresVisibles();
    const estCommune = (active?.campagneId ?? null) === null;
    const orphelines = new Set(classees.orphelines.map(a => a.id));

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

    /*
      ⛔ **Échap ferme ce menu — et il ne le fermait PAS.**

      Trouvé le 2026-09-20 par le garde-fou écrit une heure plus tôt, qui a
      échoué en essayant de cliquer ailleurs : *le menu porte un voile plein
      écran*, et tant qu'il est là, **plus rien d'autre n'est cliquable**.

      ⚠️ **C'est le portail qui a rendu ce défaut réel.** Avant lui, le voile
      était enfermé dans un contexte d'empilement et ne couvrait pas grand-chose
      — le même défaut existait, **inoffensif par accident**. *Un correctif qui
      fait enfin marcher un mécanisme fait aussi marcher ce qu'il avait de
      faux.*

      Le registre partagé donne la règle : Échap ferme la surcouche du dessus,
      et fait ce que ferait son bouton de fermeture — ici, refermer sans rien
      exécuter.
    */
    useFermetureParEchap(menu !== null, () => setMenu(null), "Menu d'atmosphère");

    const handleAdd = () => {
        const name = `Atmosphère ${atmospheres.length + 1}`;
        /*
          ⚠️ **Une atmosphère naît rattachée à la campagne ouverte**, comme une
          playlist de Music-OS — et contrairement à une tuile de Light-OS, qui
          naît commune. Les tuiles sont dix-huit cases partagées ; les
          atmosphères, une bibliothèque sans fin. *On ne rationne pas ce qui ne
          coûte rien.*
        */
        addAtmosphere(name, campagneId);
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
        /*
          ⛔ **Ce qui défile et ce qui ne défile PAS.**

          La barre entière était en `overflow-x-auto`, avec `no-scrollbar` et un
          dégradé sur le bord droit. Tout ce qui suivait les onglets — le bouton
          « + », puis l'interrupteur de campagne posé le 2026-09-19 — partait
          donc **hors de l'écran dès qu'il y avait assez d'atmosphères**, et
          *sans la moindre barre de défilement pour dire qu'il restait quelque
          chose à droite.*

          ⚠️ David le voyait encore à trois atmosphères : le défaut était
          **latent**, pas actif. Il se serait réveillé à la quatrième, ou sur
          une fenêtre plus étroite. *Une fonctionnalité qu'on ne voit pas est
          une fonctionnalité absente* — la leçon du Media Hub, reproduite ici
          le soir même où le portail la refermait deux lignes plus haut.

          Seuls **les onglets** défilent désormais. Le « + » et l'interrupteur
          sont ancrés à droite, toujours visibles.
        */
        <div className="flex items-center gap-3 py-2 min-h-[50px]">
            <div className="flex items-center gap-2 p-1.5 bg-app-bg/40 backdrop-blur-xl border border-app-border/50 rounded-2xl shadow-inner overflow-x-auto no-scrollbar mask-fade-right min-w-0">
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
                                    {/* Rattachée à une campagne qui n'existe plus : elle
                                        reste visible, sinon le travail s'évanouirait sans
                                        cause apparente — mais elle le dit. */}
                                    {orphelines.has(atmos.id) && (
                                        <Unlink size={9} className="text-amber-500 shrink-0" />
                                    )}
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

            {/*
              **À qui appartient l'atmosphère choisie.**

              Sans campagne ouverte, il n'y a rien à rattacher *à* quoi que ce
              soit : l'interrupteur disparaît plutôt que de proposer un geste
              sans effet — même décision que pour les atmosphères de Music-OS,
              prise par David le 2026-08-30.
            */}
            {campagneId !== null && active && (
                <div className="flex items-center gap-2 shrink-0">
                    <span
                        className="text-ui-8 font-black uppercase tracking-widest text-slate-600 truncate max-w-[9rem]"
                        title={active.name}
                    >
                        « {active.name} »
                    </span>
                    <div className="flex bg-app-surface/40 p-1 rounded-xl border border-app-border/50 shadow-inner">
                        {([
                            { pour: null, icone: <Globe size={11} />, texte: 'Toutes', actif: estCommune },
                            { pour: campagneId, icone: <Bookmark size={11} />, texte: 'Cette campagne', actif: !estCommune },
                        ] as const).map(({ pour, icone, texte, actif }) => (
                            <button
                                key={texte}
                                onClick={() => assignerLAtmosphere(active.id, pour)}
                                aria-pressed={actif}
                                title={actif
                                    ? `« ${active.name} » est déjà ${pour === null ? 'commune' : 'rattachée à cette campagne'}`
                                    : pour === null
                                        ? `Rendre « ${active.name} » commune — elle apparaîtra dans toutes les campagnes`
                                        : `Rattacher « ${active.name} » à la campagne ouverte — elle n'apparaîtra plus ailleurs`}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ui-8 font-black uppercase tracking-widest transition-all ${actif
                                    ? 'bg-accent text-white shadow-glow-accent'
                                    : 'text-slate-500 hover:text-slate-200 hover:bg-app-surface/60'}`}
                            >
                                {icone}
                                <span>{texte}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AtmosphereManager;
