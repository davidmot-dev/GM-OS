import React, { useMemo, useState } from 'react';
import { Bouton } from '../../../components/socle/Bouton';
import { Music, Waves, Image as ImageIcon, Search, X } from 'lucide-react';
import { type RemoteUniversalPad, type RemoteComptesDePads } from '../types/remote.types';
import { type RemoteReglagesAudio, type NomDeVoie } from '../reglagesAudio';
import LigneDeVolume from './LigneDeVolume';

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
    audio: RemoteReglagesAudio;
    onVolume: (voie: NomDeVoie, volume: number) => void;
    onSortie: (voie: NomDeVoie, sortie: string) => void;
    onTrigger: (id: string) => void;
}

const FAMILLES = [
    { type: 'music' as const, titre: 'Musique', icone: Music, teinte: 'text-accent' },
    { type: 'ambient' as const, titre: 'Ambiances', icone: Waves, teinte: 'text-gm-cyan' },
    { type: 'image' as const, titre: 'Images', icone: ImageIcon, teinte: 'text-etat-succes' },
];

/** Sans accents ni casse : « Forêt » se trouve en tapant « foret ». */
const aplati = (texte: string) =>
    texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const RemoteUniversalPads: React.FC<RemoteUniversalPadsProps> = ({
    pads, comptes, audio, onVolume, onSortie, onTrigger,
}) => {
    const [filtre, setFiltre] = useState('');

    const parFamille = useMemo(() => {
        const cherche = aplati(filtre.trim());
        const retenus = cherche
            ? pads.filter(p => aplati(`${p.label} ${p.sublabel ?? ''}`).includes(cherche))
            : pads;
        return FAMILLES.map(f => ({ ...f, pads: retenus.filter(p => p.type === f.type) }));
    }, [pads, filtre]);

    const totalRetenu = parFamille.reduce((n, f) => n + f.pads.length, 0);

    /*
      ⭐ **Les deux lignes de volume, demandées par David le 2026-09-22** :
      *« le slider du soundboard fonctionne bien, mais il n'y a pas de slider
      dans les pads »*. Cet onglet lance de la musique et des ambiances sans
      pouvoir les doser — et sans pouvoir dire où elles sortent.

      ⚠️ **Elles sont rendues même quand la grille est vide.** Une ambiance peut
      tourner alors qu'aucun pad n'est configuré sur cet univers : *un réglage
      qui disparaît avec la liste qu'il ne commande pas est un réglage perdu au
      moment où il sert.*
    */
    const reglages = (
        <div className="flex flex-col gap-2">
            <LigneDeVolume
                voie="music" reglages={audio} icone={<Music size={15} />}
                onVolume={(v) => onVolume('music', v)}
                onSortie={(sortie) => onSortie('music', sortie)}
            />
            <LigneDeVolume
                voie="ambient" reglages={audio} icone={<Waves size={15} />}
                onVolume={(v) => onVolume('ambient', v)}
                onSortie={(sortie) => onSortie('ambient', sortie)}
            />
        </div>
    );

    if (!pads || pads.length === 0) {
        return (
            <div className="flex flex-col gap-3">
                {reglages}
                <div className="text-center py-16 rounded-2xl border border-app-text/5 bg-app-text/[0.02]">
                    <p className="text-sm italic text-app-muted">Aucun pad configuré sur cet univers.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* ⛔ **Les deux lignes sont rendues ICI AUSSI, et l'essai l'a exigé.**
                Ma première version ne les posait que dans la branche « aucun pad » :
                elles n'existaient donc **que** sur un univers vide, c'est-à-dire
                jamais quand elles servent. */}
            {reglages}
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-subtle pointer-events-none" />
                <input
                    type="search"
                    value={filtre}
                    onChange={(e) => setFiltre(e.target.value)}
                    placeholder="Filtrer les pads…"
                    aria-label="Filtrer les pads"
                    className="w-full h-[44px] pl-9 pr-16 rounded-xl bg-app-text/5 border border-app-text/10 text-sm text-app-text placeholder:text-app-subtle outline-none focus:border-accent/40 transition-colors"
                />
                {filtre && (
                    <Bouton habillage="libre" cibleTactile
                        onClick={() => setFiltre('')}
                        aria-label="Effacer le filtre"
                        className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] w-6 h-6 rounded-lg flex items-center justify-center text-app-muted hover:text-app-text"
                    >
                        <X size={14} />
                    </Bouton>
                )}
            </div>

            {filtre && totalRetenu === 0 && (
                <p className="text-center py-10 text-sm italic text-app-muted">
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
                            <h2 className="text-ui-10 font-black uppercase tracking-widest text-app-muted">{titre}</h2>
                            {tronque && (
                                <span className="text-ui-10 text-etat-alerte/80 italic">
                                    {compte.montres} sur {compte.total} — les autres restent sur le PC
                                </span>
                            )}
                        </div>

                        {type === 'image' ? (
                            <div className="grid grid-cols-3 min-[700px]:grid-cols-4 min-[1000px]:grid-cols-6 gap-2">
                                {padsDeLaFamille.map(pad => (
                                    <Bouton habillage="libre" cibleTactile
                                        key={pad.id}
                                        onClick={() => onTrigger(pad.id)}
                                        className={`group relative overflow-hidden aspect-[4/3] rounded-xl border transition-colors ${
                                            pad.isActive ? 'border-accent' : 'border-app-text/5 hover:border-app-text/20'
                                        }`}
                                    >
                                        {pad.imageUrl ? (
                                            <img
                                                src={pad.imageUrl}
                                                alt=""
                                                className={`absolute inset-0 w-full h-full object-cover transition-opacity ${pad.isActive ? 'opacity-70' : 'opacity-35 group-hover:opacity-55'}`}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-app-text/5" />
                                        )}
                                        {/* Le voile part du bas : le titre reste lisible sur une image claire. */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-app-bg/85 to-transparent px-2 pt-4 pb-1.5">
                                            <span className={`block text-ui-10 font-bold leading-tight text-left line-clamp-2 ${pad.isActive ? 'text-accent' : 'text-app-text'}`}>
                                                {pad.label}
                                            </span>
                                        </div>
                                        {pad.isActive && (
                                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent shadow-glow-accent" />
                                        )}
                                    </Bouton>
                                ))}
                            </div>
                        ) : (
                            /*
                              Sans image, un cadre 16/9 est un rectangle vide :
                              ces pads passent en lignes, quatre fois plus denses.
                            */
                            <div className="grid grid-cols-2 min-[700px]:grid-cols-3 min-[1100px]:grid-cols-4 gap-2">
                                {padsDeLaFamille.map(pad => (
                                    <Bouton habillage="libre" cibleTactile
                                        key={pad.id}
                                        onClick={() => onTrigger(pad.id)}
                                        className={`flex items-center gap-2.5 px-3 h-14 rounded-xl border text-left transition-colors ${
                                            pad.isActive
                                                ? 'border-accent bg-accent/10'
                                                : 'border-app-text/5 bg-app-text/[0.03] hover:border-app-text/20'
                                        }`}
                                    >
                                        <Icone size={15} className={`shrink-0 ${pad.isActive ? 'text-accent' : teinte}`} />
                                        <span className="flex flex-col min-w-0">
                                            <span className={`text-xs font-bold truncate ${pad.isActive ? 'text-accent' : 'text-app-text'}`}>
                                                {pad.label}
                                            </span>
                                            {pad.sublabel && (
                                                <span className="text-ui-10 text-app-muted truncate">{pad.sublabel}</span>
                                            )}
                                        </span>
                                        {pad.isActive && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                        )}
                                    </Bouton>
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
