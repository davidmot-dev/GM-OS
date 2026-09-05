import React, { useMemo, useState } from 'react';
import { Music, Waves, Image as ImageIcon, Search, X } from 'lucide-react';
import { type RemoteUniversalPad, type RemoteComptesDePads } from '../types/remote.types';

/**
 * **La grille de pads, refaite le 2026-09-05.**
 *
 * Elle rendait vingt-cinq pads en une seule grille plate, chacun dans un cadre
 * 16/9 — donc un rectangle vide de la taille d'une photo pour porter une ligne
 * de texte, quand le pad n'a pas d'image. Trois choses changent :
 *
 * - **Les familles sont séparées** et nommées. Musique, ambiance et image ne se
 *   déclenchent pas dans le même geste de jeu.
 * - **Les plafonds se disent.** La grille est bornée à cinq morceaux, huit
 *   ambiances et douze images, et elle tronquait **en silence** : trente favoris
 *   en donnaient douze sans un mot. *Une liste tronquée sans le dire se lit comme
 *   une liste complète, et on cherche longtemps ce qui n'y est pas.*
 * - **Un champ de filtre**, parce qu'on ne fait pas défiler une tablette d'une
 *   main pendant qu'on décrit une scène.
 *
 * Les pads sans image passent en **lignes denses** ; seules les images gardent
 * la vignette, qui est leur seule raison d'occuper de la place.
 */

interface RemoteUniversalPadsProps {
    pads: RemoteUniversalPad[];
    comptes?: RemoteComptesDePads;
    onTrigger: (id: string) => void;
}

const FAMILLES = [
    { type: 'music' as const, titre: 'Musique', icone: Music, teinte: 'text-accent' },
    { type: 'ambient' as const, titre: 'Ambiances', icone: Waves, teinte: 'text-cyan-400' },
    { type: 'image' as const, titre: 'Images', icone: ImageIcon, teinte: 'text-emerald-400' },
];

/** Sans accents ni casse : « Forêt » se trouve en tapant « foret ». */
const aplati = (texte: string) =>
    texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const RemoteUniversalPads: React.FC<RemoteUniversalPadsProps> = ({ pads, comptes, onTrigger }) => {
    const [filtre, setFiltre] = useState('');

    const parFamille = useMemo(() => {
        const cherche = aplati(filtre.trim());
        const retenus = cherche
            ? pads.filter(p => aplati(`${p.label} ${p.sublabel ?? ''}`).includes(cherche))
            : pads;
        return FAMILLES.map(f => ({ ...f, pads: retenus.filter(p => p.type === f.type) }));
    }, [pads, filtre]);

    const totalRetenu = parFamille.reduce((n, f) => n + f.pads.length, 0);

    if (!pads || pads.length === 0) {
        return (
            <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.02]">
                <p className="text-sm italic text-slate-500">Aucun pad configuré sur cet univers.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                <input
                    type="search"
                    value={filtre}
                    onChange={(e) => setFiltre(e.target.value)}
                    placeholder="Filtrer les pads…"
                    aria-label="Filtrer les pads"
                    className="w-full h-9 pl-9 pr-9 rounded-xl bg-white/5 border border-white/10 text-sm text-app-text placeholder:text-slate-600 outline-none focus:border-accent/40 transition-colors"
                />
                {filtre && (
                    <button
                        onClick={() => setFiltre('')}
                        aria-label="Effacer le filtre"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {filtre && totalRetenu === 0 && (
                <p className="text-center py-10 text-sm italic text-slate-500">
                    Rien ne correspond à « {filtre} ».
                </p>
            )}

            {parFamille.map(({ type, titre, icone: Icone, teinte, pads: padsDeLaFamille }) => {
                if (padsDeLaFamille.length === 0) return null;
                const compte = comptes?.[type];
                /* On ne signale le plafond que hors filtre : pendant une
                   recherche, « 12 sur 30 » parlerait d'autre chose que ce que
                   l'écran montre. */
                const tronque = !filtre && compte && compte.total > compte.montres;

                return (
                    <section key={type} className="flex flex-col gap-2">
                        <div className="flex items-baseline gap-2 px-1">
                            <Icone size={13} className={`${teinte} shrink-0 self-center`} />
                            <h2 className="text-ui-10 font-black uppercase tracking-widest text-slate-400">{titre}</h2>
                            {tronque && (
                                <span className="text-ui-10 text-amber-500/80 italic">
                                    {compte.montres} sur {compte.total} — les autres restent sur le PC
                                </span>
                            )}
                        </div>

                        {type === 'image' ? (
                            <div className="grid grid-cols-3 min-[700px]:grid-cols-4 min-[1000px]:grid-cols-6 gap-2">
                                {padsDeLaFamille.map(pad => (
                                    <button
                                        key={pad.id}
                                        onClick={() => onTrigger(pad.id)}
                                        className={`group relative overflow-hidden aspect-[4/3] rounded-xl border transition-colors ${
                                            pad.isActive ? 'border-accent' : 'border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        {pad.imageUrl ? (
                                            <img
                                                src={pad.imageUrl}
                                                alt=""
                                                className={`absolute inset-0 w-full h-full object-cover transition-opacity ${pad.isActive ? 'opacity-70' : 'opacity-35 group-hover:opacity-55'}`}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-white/5" />
                                        )}
                                        {/* Le voile part du bas : le titre reste lisible sur une image claire. */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-4 pb-1.5">
                                            <span className={`block text-ui-10 font-bold leading-tight text-left line-clamp-2 ${pad.isActive ? 'text-accent' : 'text-slate-200'}`}>
                                                {pad.label}
                                            </span>
                                        </div>
                                        {pad.isActive && (
                                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent shadow-glow-accent" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            /*
                              Sans image, un cadre 16/9 est un rectangle vide :
                              ces pads passent en lignes, quatre fois plus denses.
                            */
                            <div className="grid grid-cols-2 min-[700px]:grid-cols-3 min-[1100px]:grid-cols-4 gap-2">
                                {padsDeLaFamille.map(pad => (
                                    <button
                                        key={pad.id}
                                        onClick={() => onTrigger(pad.id)}
                                        className={`flex items-center gap-2.5 px-3 h-14 rounded-xl border text-left transition-colors ${
                                            pad.isActive
                                                ? 'border-accent bg-accent/10'
                                                : 'border-white/5 bg-white/[0.03] hover:border-white/20'
                                        }`}
                                    >
                                        <Icone size={15} className={`shrink-0 ${pad.isActive ? 'text-accent' : teinte}`} />
                                        <span className="flex flex-col min-w-0">
                                            <span className={`text-xs font-bold truncate ${pad.isActive ? 'text-accent' : 'text-slate-200'}`}>
                                                {pad.label}
                                            </span>
                                            {pad.sublabel && (
                                                <span className="text-ui-10 text-slate-500 truncate">{pad.sublabel}</span>
                                            )}
                                        </span>
                                        {pad.isActive && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
};

export default RemoteUniversalPads;
