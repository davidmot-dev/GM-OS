import React from 'react';
import { Layers, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { DeckInterpreter } from '../../modules/session/logic/DeckInterpreter';
import { ResolvedImage } from '../ResolvedImage';

/**
 * **Les cartes que ce joueur tient, et ce qu'il peut en faire — côté tablette.**
 *
 * Décidé par David le 2026-08-30 : les joueurs aussi tiennent des cartes, et
 * ils peuvent les jouer ou les proposer à un autre. Le paquet, lui, reste la
 * source ; ceci n'en est qu'un reflet.
 *
 * **Rien n'est appliqué ici.** Chaque geste part vers le meneur, qui vérifie
 * que ce personnage tient bien cette carte avant d'agir — le `characterId`
 * vient du client, et le croire sur parole laisserait jouer la carte du voisin.
 * *C'est exactement pourquoi la carte n'est pas devenue un objet d'inventaire :
 * un inventaire aurait dû faire confiance à l'expéditeur.*
 *
 * **Une carte sous scellé est comptée, jamais montrée** — pas même à son
 * porteur. La diffusion est un seul message pour toutes les tablettes, donc son
 * index n'est pas dans la charge : `mainsPourLaTable` le retire à la source.
 * *Un secret caviardé à l'affichage n'est pas un secret, c'est un secret
 * affiché plus tard.*
 */

/** Un geste part vers le meneur, et rien d'autre. */
const demanderAuMeneur = (type: string, detail: Record<string, unknown>) => {
    window.dispatchEvent(new CustomEvent(type, { detail }));
};

const HubMainDeCartes: React.FC<{ characterId: string | null }> = ({ characterId }) => {
    const { t } = useTranslation(['modules']);
    const decks = useSessionOSStore(s => s.decks);
    const mainsDesPaquets = useSessionOSStore(s => s.mainsDesPaquets);
    const demandesDeCarte = useSessionOSStore(s => s.demandesDeCarte);
    const players = useSessionOSStore(s => s.players);

    /** La carte ouverte en grand, ou `null`. Purement local à cet appareil. */
    const [carteEnGrand, setCarteEnGrand] = React.useState<
        { url: string; nom: string; texte: string } | null
    >(null);

    /** Les autres personnages, à qui l'on peut proposer une carte. */
    const voisins = React.useMemo(
        () => (players ?? [])
            .flatMap(p => (p.characters ?? []).map(c => ({ id: c.id, nom: c.name })))
            .filter(c => c.id !== characterId),
        [players, characterId],
    );

    const nomDuPersonnage = React.useCallback((id: string | null) =>
        (players ?? []).flatMap(p => p.characters ?? []).find(c => c.id === id)?.name
        ?? t('modules:session.deck_module.player.hands.gm'),
        [players, t]);

    /*
      On ne montre que **sa** main. Celle des autres est diffusée — le meneur en
      a besoin — mais l'afficher ici ferait de la tablette une fenêtre sur le
      jeu du voisin.
    */
    const mesCartes = React.useMemo(() => {
        if (!characterId || !mainsDesPaquets) return [];

        return Object.entries(mainsDesPaquets).flatMap(([deckId, mains]) => {
            const paquet = decks.find(d => d.id === deckId);
            const mienne = mains.find(m => m.porteur === characterId);
            if (!paquet || !mienne) return [];
            return [{ paquet, revelees: mienne.revelees, scellees: mienne.scellees }];
        });
    }, [characterId, mainsDesPaquets, decks]);

    /** Ce qu'on me propose, et ce que j'ai proposé et qui attend encore. */
    const proposeesAMoi = (demandesDeCarte ?? []).filter(d => d.versQui === characterId);
    const mesPropositions = (demandesDeCarte ?? []).filter(d => d.deQui === characterId);

    if (mesCartes.length === 0 && proposeesAMoi.length === 0) return null;

    return (
        <>
        {/*
          **La carte en grand, par-dessus tout le reste.**

          Elle se ferme d'un clic n'importe où : sur une tablette, chercher une
          petite croix pendant qu'on lit est le geste qu'on rate. `Échap` marche
          aussi pour ceux qui ont un clavier.
        */}
        {carteEnGrand && (
            <div
                role="dialog"
                aria-modal="true"
                aria-label={carteEnGrand.nom}
                onClick={() => setCarteEnGrand(null)}
                onKeyDown={(e) => { if (e.key === 'Escape') setCarteEnGrand(null); }}
                tabIndex={-1}
                ref={(n) => n?.focus()}
                className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/90 p-6 backdrop-blur-md"
            >
                <ResolvedImage
                    src={carteEnGrand.url}
                    alt={carteEnGrand.nom}
                    className="max-h-[75vh] max-w-full rounded-2xl border border-accent/40 object-contain shadow-2xl"
                />
                <p className="text-center text-lg font-bold text-white">{carteEnGrand.nom}</p>
                {carteEnGrand.texte && (
                    <p className="max-w-xl text-center text-sm leading-relaxed text-white/70">
                        {carteEnGrand.texte}
                    </p>
                )}
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                    Touchez pour fermer
                </p>
            </div>
        )}

        <div className="rounded-2xl border border-app-border/40 bg-app-surface/50 p-4 backdrop-blur-xl">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40">
                <Layers size={12} /> {t('modules:session.deck_module.player.hands.title')}
            </p>

            {/*
              Ce qu'on me propose passe **en tête** : c'est la seule chose ici
              qui attende une réponse de ma part, et une décision en attente ne
              se met pas au bas d'une liste.
            */}
            {proposeesAMoi.map(demande => (
                <div key={demande.id} className="mb-3 rounded-xl border border-accent/40 bg-accent/10 p-3">
                    <p className="mb-2 text-xs text-app-text">
                        {t('modules:session.deck_module.player.hands.offered', { qui: nomDuPersonnage(demande.deQui) })}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => demanderAuMeneur('deck:accepter-don', { demandeId: demande.id, characterId })}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                        >
                            <Check size={12} /> {t('modules:session.deck_module.player.hands.accept')}
                        </button>
                        <button
                            onClick={() => demanderAuMeneur('deck:refuser-don', { demandeId: demande.id, characterId })}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-app-border px-3 py-2 text-[10px] font-black uppercase tracking-widest text-app-text/60"
                        >
                            <X size={12} /> {t('modules:session.deck_module.player.hands.refuse')}
                        </button>
                    </div>
                </div>
            ))}

            <div className="flex flex-col gap-4">
                {mesCartes.map(({ paquet, revelees, scellees }) => (
                    <div key={paquet.id} className="flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-app-text/30">
                            {paquet.name}
                        </span>

                        <div className="flex flex-wrap gap-3">
                            {revelees.map(index => {
                                const enAttente = mesPropositions.some(
                                    d => d.deckId === paquet.id && d.index === index);
                                return (
                                    <div key={index} className="flex flex-col gap-1">
                                        {/*
                                          **Un clic agrandit la carte.** Demandé
                                          par David le 2026-08-30 : à 112 px de
                                          haut sur une tablette, le texte d'une
                                          carte ne se lit pas. Une vignette
                                          qu'on ne peut pas lire ne sert qu'à
                                          rappeler qu'on a une carte.
                                        */}
                                        <button
                                            type="button"
                                            onClick={() => setCarteEnGrand({
                                                url: DeckInterpreter.getCardImageUrl(paquet.folderPath, index, paquet),
                                                nom: DeckInterpreter.getCardMetadata(paquet, index)?.name ?? `Carte ${index}`,
                                                texte: DeckInterpreter.getCardMetadata(paquet, index)?.description ?? '',
                                            })}
                                            className="rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                                        >
                                            <ResolvedImage
                                                src={DeckInterpreter.getCardImageUrl(paquet.folderPath, index, paquet)}
                                                alt={DeckInterpreter.getCardMetadata(paquet, index)?.name ?? `Carte ${index}`}
                                                className={`h-28 rounded-lg border object-cover shadow-lg transition-transform active:scale-95 ${enAttente
                                                    ? 'border-app-border opacity-40 grayscale'
                                                    : 'border-accent/40'}`}
                                            />
                                        </button>

                                        {/*
                                          Une carte déjà proposée n'offre plus
                                          ses gestes : la reproposer ou la jouer
                                          pendant qu'on attend une réponse
                                          créerait deux vérités sur une carte.
                                        */}
                                        {enAttente ? (
                                            <span className="text-center text-[9px] font-bold uppercase tracking-wider text-app-text/30">
                                                {t('modules:session.deck_module.player.hands.pending')}
                                            </span>
                                        ) : (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => demanderAuMeneur('deck:jouer-carte', {
                                                        deckId: paquet.id, index, characterId,
                                                    })}
                                                    className="flex-1 rounded-md border border-app-border px-2 py-1 text-[9px] font-black uppercase tracking-wider text-app-text/60 hover:border-accent/40 hover:text-app-text"
                                                >
                                                    {t('modules:session.deck_module.player.hands.play_own')}
                                                </button>
                                                {voisins.length > 0 && (
                                                    <select
                                                        value=""
                                                        onChange={(e) => e.target.value && demanderAuMeneur('deck:demander-don', {
                                                            deckId: paquet.id, index,
                                                            deQui: characterId, versQui: e.target.value,
                                                        })}
                                                        title={t('modules:session.deck_module.player.hands.give_to')}
                                                        aria-label={t('modules:session.deck_module.player.hands.give_to')}
                                                        className="flex-1 cursor-pointer rounded-md border border-app-border bg-transparent px-1 py-1 text-[9px] font-black uppercase tracking-wider text-app-text/60"
                                                    >
                                                        <option value="">{t('modules:session.deck_module.player.hands.give_to')}</option>
                                                        {voisins.map(v => (
                                                            <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                                                                {v.nom}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/*
                              Le dos, autant de fois qu'il y a de cartes sous
                              scellé. Le joueur sait qu'il en tient, et combien ;
                              il ne sait pas lesquelles, et ne peut donc rien en
                              faire tant que le meneur ne les a pas révélées.
                            */}
                            {Array.from({ length: scellees }, (_, i) => (
                                <div
                                    key={`scelle-${i}`}
                                    title={t('modules:session.deck_module.player.hands.hidden')}
                                    className="flex h-28 w-20 items-center justify-center rounded-lg border border-dashed border-app-border bg-app-bg/60 text-app-text/20"
                                >
                                    <Layers size={20} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </>
    );
};

export default HubMainDeCartes;
