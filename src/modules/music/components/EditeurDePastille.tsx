import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, X, Check } from 'lucide-react';
import { useMusicStore } from '../useMusicStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { padDuRaccourci } from '../logic/playlistsDeLaCampagne';
import {
    COULEURS_DE_PASTILLE,
    SANS_COULEUR,
    clesDeLaPalette,
    couleurDeLaPastille,
} from '../logic/couleursDePastille';

/**
 * **Éditer une pastille : le nom, la couleur, la touche — au même endroit.**
 *
 * Demandé par David le 2026-09-16. Deux des trois existaient déjà, mais
 * **éparpillés** : le nom derrière un `gmPrompt` du menu de la tuile, la touche
 * derrière un **mode global** (Key Learn) qu'il fallait activer dans l'en-tête
 * avant de cliquer la pastille. *Un réglage qu'on atteint par trois chemins
 * différents n'est pas trois fois plus accessible : il est introuvable deux
 * fois sur trois.*
 *
 * ⚠️ **Pourquoi une boîte et pas la tuile.** La tuile est un carré fixe — la
 * leçon de Light-OS : *ce qu'on y ajoute pousse ce qui y était.* Trois champs
 * n'y tiennent pas lisiblement.
 */

interface Props {
    playlistId: string;
    padIndex: number;
    onClose: () => void;
}

export const EditeurDePastille: React.FC<Props> = ({ playlistId, padIndex, onClose }) => {
    const { playlists, updatePad } = useMusicStore();

    const pad = playlists.find(p => p.id === playlistId)?.pads[padIndex];

    const [nom, setNom] = useState(pad?.label ?? '');
    const [couleur, setCouleur] = useState(pad?.couleur ?? SANS_COULEUR);
    const [touche, setTouche] = useState<string | undefined>(pad?.keybind);
    const [enEcoute, setEnEcoute] = useState(false);

    const champDuNom = useRef<HTMLInputElement>(null);
    useEffect(() => { champDuNom.current?.focus(); }, []);

    /*
      **La capture de touche vit ICI, et c'est sans danger précisément parce
      qu'on est dans une boîte.**

      `estUneFrappeDePastille` rend `false` dès qu'une surcouche est ouverte :
      l'écouteur global de Music-OS est donc **muet** tant que cet éditeur est à
      l'écran. Sans ça, appuyer sur « K » pour l'attribuer aurait **lancé** la
      pastille liée à K, en pleine attribution.

      ⚠️ C'est aussi pourquoi l'ancien mode Key Learn ne peut pas servir ici :
      il attend sa frappe sur ce même écouteur global, celui que la boîte fait
      taire. *Deux mécanismes qui se ressemblent, dont un seul peut fonctionner
      dans ce contexte.*

      L'écouteur est posé **en phase de capture** pour passer devant tout le
      reste, et il ne vit que le temps de l'écoute.
    */
    useEffect(() => {
        if (!enEcoute) return;

        const ecouter = (evenement: KeyboardEvent) => {
            evenement.preventDefault();
            evenement.stopPropagation();

            if (evenement.key === 'Escape') {
                setEnEcoute(false);
                return;
            }
            // On refuse ce qu'aucune pastille ne pourra jamais recevoir : la
            // garde partagée écarte Ctrl, Alt et Cmd. *Accepter une touche que
            // le clavier ignorera ensuite serait un réglage qui ment.*
            if (evenement.ctrlKey || evenement.metaKey || evenement.altKey) return;

            setTouche(evenement.code);
            setEnEcoute(false);
        };

        window.addEventListener('keydown', ecouter, true);
        return () => window.removeEventListener('keydown', ecouter, true);
    }, [enEcoute]);

    /*
      **Qui détient déjà cette touche ?** — et on le demande à `padDuRaccourci`,
      celui-là même que le clavier interroge en séance.

      *Deux règles écrites séparément finiraient par diverger, et l'écart ne se
      verrait qu'au moment où l'on appuie.* Une touche portée par deux pastilles
      n'est pas une erreur en soi — deux campagnes différentes y ont droit — ;
      elle ne l'est que si **la même frappe ne peut pas servir les deux**, ce
      que seule cette fonction sait dire.
    */
    const detenteur = useMemo(() => {
        if (!touche || !pad) return null;
        const { activeCampaignId, campaigns } = useSessionOSStore.getState();
        const trouve = padDuRaccourci(playlists, activeCampaignId, touche, campaigns.map(c => c.id));
        return trouve && trouve.id !== pad.id ? trouve : null;
    }, [touche, playlists, pad]);

    if (!pad) {
        return <div className="text-ui-10 text-slate-500 p-4">Cette pastille n'existe plus.</div>;
    }

    const enregistrer = () => {
        /*
          ⚠️ **La touche est retirée à son ancien détenteur.** C'est la règle de
          Light-OS, reprise telle quelle : *une touche ne commande qu'une
          chose.* Sans ça, la seconde pastille serait muette et rien ne le
          dirait — celle que l'ordre de parcours désigne l'emporterait.
        */
        if (detenteur) {
            for (const playlist of playlists) {
                const i = playlist.pads.findIndex(p => p.id === detenteur.id);
                if (i !== -1) updatePad(playlist.id, i, { keybind: undefined });
            }
        }

        updatePad(playlistId, padIndex, {
            label: nom.trim() || pad.label,
            couleur: couleur === SANS_COULEUR ? undefined : couleur,
            keybind: touche,
        });
        onClose();
    };

    const libelleDeLaTouche = touche
        ? touche.replace('Key', '').replace('Numpad', 'NUM ').replace('Digit', '')
        : null;

    return (
        <div className="flex flex-col gap-5 p-1">
            {/* Le nom */}
            <label className="flex flex-col gap-1.5">
                <span className="text-ui-9 font-black uppercase tracking-widest text-slate-500">Nom</span>
                <input
                    ref={champDuNom}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') enregistrer(); }}
                    className="w-full px-3 py-2 rounded-xl bg-app-bg border border-app-border/50 text-white outline-none focus:border-accent transition-colors"
                />
            </label>

            {/* La couleur */}
            <div className="flex flex-col gap-1.5">
                <span className="text-ui-9 font-black uppercase tracking-widest text-slate-500">Couleur</span>
                <div className="flex flex-wrap gap-2">
                    {clesDeLaPalette().map((cle) => {
                        const teinte = COULEURS_DE_PASTILLE[cle];
                        const choisie = cle === couleur;
                        return (
                            <button
                                key={cle}
                                onClick={() => setCouleur(cle)}
                                title={teinte.nom}
                                aria-label={teinte.nom}
                                aria-pressed={choisie}
                                className={`size-9 rounded-xl border-2 flex items-center justify-center transition-all ${teinte.echantillon} ${
                                    choisie ? 'ring-2 ring-white/80 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                                }`}
                            >
                                {choisie && <Check size={14} className="text-white drop-shadow" strokeWidth={3} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* La touche */}
            <div className="flex flex-col gap-1.5">
                <span className="text-ui-9 font-black uppercase tracking-widest text-slate-500">Touche</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setEnEcoute(true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-ui-10 font-black uppercase tracking-widest transition-all ${
                            enEcoute
                                ? 'bg-cyan-900/40 border-cyan-500 text-cyan-300 animate-pulse'
                                : 'bg-app-surface border-app-border/50 text-slate-300 hover:border-accent/40 hover:text-white'
                        }`}
                    >
                        <Keyboard size={12} />
                        {enEcoute
                            ? 'Appuyez sur une touche — Échap annule'
                            : libelleDeLaTouche
                                ? `Touche : ${libelleDeLaTouche}`
                                : 'Assigner une touche'}
                    </button>
                    {touche && !enEcoute && (
                        <button
                            onClick={() => setTouche(undefined)}
                            title="Retirer la touche"
                            className="p-2.5 rounded-xl bg-app-surface border border-app-border/50 text-slate-600 hover:text-red-500 hover:border-red-500/30 transition-all"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/*
                  Le conflit se dit **avant** d'enregistrer, et il nomme la
                  pastille concernée : *un avertissement qui ne dit pas qui
                  oblige à chercher soi-même.*
                */}
                {detenteur && (
                    <p className="text-ui-9 font-bold text-amber-500 leading-snug">
                        Cette touche lance déjà « {detenteur.label} ». L'enregistrement la lui retire —
                        une touche ne commande qu'une pastille.
                    </p>
                )}
            </div>

            <div className="flex gap-2 pt-1">
                <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-app-surface border border-app-border/50 text-ui-10 font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                >
                    Annuler
                </button>
                <button
                    onClick={enregistrer}
                    className="flex-1 py-2.5 rounded-xl bg-accent border border-accent text-ui-10 font-black uppercase tracking-widest text-white hover:brightness-110 transition-all"
                >
                    Enregistrer
                </button>
            </div>

            {/* Un aperçu du rendu, pour que la couleur ne se juge pas dans le vide. */}
            <div className="flex items-center gap-3 pt-1 border-t border-app-border/30">
                <span className="text-ui-9 font-black uppercase tracking-widest text-slate-600">Aperçu</span>
                <div className={`size-12 rounded-2xl border-2 flex items-center justify-center ${couleurDeLaPastille(couleur === SANS_COULEUR ? undefined : couleur).tuile}`}>
                    <span className={`text-ui-8 font-black uppercase ${couleurDeLaPastille(couleur === SANS_COULEUR ? undefined : couleur).icone}`}>
                        {(nom || pad.label).slice(0, 3)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default EditeurDePastille;
