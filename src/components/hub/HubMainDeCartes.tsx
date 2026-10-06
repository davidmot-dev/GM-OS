import React from 'react';
import { Layers, Check, X, Hand } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { DeckInterpreter } from '../../modules/session/logic/DeckInterpreter';
import { voisinsAQuiDonner } from '../../modules/session/logic/aQuiDonnerUneCarte';
import { paquetsOffertsAuxJoueurs, systemeDeLaCampagne } from '../../modules/session/logic/paquetsDuJeu';
import { ResolvedImage } from '../ResolvedImage';
import { Bouton, EnTeteDeModule, GabaritDeModule, Panneau } from '../socle';

/**
 * **L'onglet Cartes de la tablette : ce que ce joueur tient, et ce qu'il peut
 * tirer.**
 *
 * Décidé par David le 2026-08-30 : les joueurs aussi tiennent des cartes, et ils
 * peuvent les jouer ou les proposer à un autre. Le même jour, en le voyant à
 * l'écran, il a demandé deux choses de plus — *« mettre les cartes dans un menu
 * à part »*, parce qu'un panneau coincé dans la colonne de gauche entre
 * l'horloge et les jauges ne tient pas une main de cinq cartes, et *« voir
 * comment un joueur peut tirer lui-même une carte »*.
 *
 * Le paquet, lui, reste la source ; ceci n'en est qu'un reflet.
 *
 * **Rien n'est appliqué ici.** Chaque geste part vers le meneur, qui vérifie que
 * ce personnage tient bien cette carte — ou que ce paquet est bien ouvert aux
 * joueurs — avant d'agir. Le `characterId` vient du client, et le croire sur
 * parole laisserait jouer la carte du voisin. *C'est exactement pourquoi la
 * carte n'est pas devenue un objet d'inventaire : un inventaire aurait dû faire
 * confiance à l'expéditeur.*
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

const HubMainDeCartes: React.FC<{ characterId: string | null; commandes?: React.ReactNode; informations?: React.ReactNode }> = ({ characterId, commandes, informations }) => {
    const { t } = useTranslation(['modules']);
    const decks = useSessionOSStore(s => s.decks);
    const mainsDesPaquets = useSessionOSStore(s => s.mainsDesPaquets);
    const cartesRestantes = useSessionOSStore(s => s.cartesRestantes);
    const demandesDeCarte = useSessionOSStore(s => s.demandesDeCarte);
    const players = useSessionOSStore(s => s.players);
    const campaigns = useSessionOSStore(s => s.campaigns);
    const activeCampaignId = useSessionOSStore(s => s.activeCampaignId);
    /** `characterId → deviceId` : qui tient réellement un appareil, à l'instant. */
    const connectedCharacters = useSessionOSStore(s => s.connectedCharacters);

    /** La carte ouverte en grand, ou `null`. Purement local à cet appareil. */
    const [carteEnGrand, setCarteEnGrand] = React.useState<
        { url: string; nom: string; texte: string } | null
    >(null);

    /**
     * **Les personnages de la campagne ouverte qui tiennent réellement une
     * tablette** — signalé par David le 2026-08-30, la liste les prenait tous,
     * toutes chroniques confondues et connectés ou non.
     *
     * La règle vit dans `aQuiDonnerUneCarte`, qui est pur et testé : *offrir une
     * carte à quelqu'un qui n'est pas là ne fait pas rien, ça immobilise la
     * carte* — elle perd ses gestes tant que la demande attend une réponse qui
     * ne viendra pas.
     */
    const voisins = React.useMemo(
        () => voisinsAQuiDonner(players, characterId, activeCampaignId, connectedCharacters),
        [players, characterId, activeCampaignId, connectedCharacters],
    );

    const nomDuPersonnage = React.useCallback((id: string | null) =>
        (players ?? []).flatMap(p => p.characters ?? []).find(c => c.id === id)?.name
        ?? t('modules:session.deck_module.player.hands.gm'),
        [players, t]);

    /*
      **Les paquets où ce joueur a le droit de piocher : de CE jeu, et ouverts.**

      ⛔ **Il manquait la première moitié**, et David l'a vu le 2026-09-14 :
      *« j'ai désactivé les cartes pour Blade Runner mais elles restent visibles
      dans la tablette »*. Il avait sorti un paquet du jeu ; la bibliothèque du
      meneur l'a retiré, la tablette a continué de l'offrir — elle ne regardait
      que `ouvertAuxJoueurs`. *Deux lecteurs d'une même liste, dont un seul
      connaissait la règle.* La règle vit maintenant dans `paquetsDuJeu.ts`, et
      les deux écrans la prennent au même endroit.

      Ce filtrage reste un confort d'affichage, pas une sécurité : le magasin du
      meneur refuse de toute façon une pioche dans un paquet fermé, et c'est là
      que ça compte.
    */
    const paquetsOuverts = React.useMemo(
        () => paquetsOffertsAuxJoueurs(decks, systemeDeLaCampagne(campaigns, activeCampaignId)),
        [decks, campaigns, activeCampaignId],
    );

    /*
      On ne montre que **sa** main. Celle des autres est diffusée — le meneur en
      a besoin — mais l'afficher ici ferait de la tablette une fenêtre sur le
      jeu du voisin.

      ⚠️ **Et elle n'est PAS filtrée par jeu, exprès.** Une carte qu'on tient
      existe : la cacher parce que son paquet a changé de jeu la rendrait
      injouable et irrécupérable, sans que personne sache où elle est passée.
      *On ne retire pas de la main ce qu'on se contente de ne plus proposer.*
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

    return (
        <div data-cartes-joueur="" className="pointer-events-auto h-full min-h-0 w-full">
            <GabaritDeModule className="mx-auto max-w-7xl" entete={<EnTeteDeModule titre="Cartes" surtitre="Les paquets ouverts et votre main" />} barreDOutils={commandes}>
                <div className="space-y-4 pb-2">
                    {informations}
                    {proposeesAMoi.map(demande => (
                        <Panneau key={demande.id} className="space-y-3 p-4">
                            <p className="text-[14px]">{t('modules:session.deck_module.player.hands.offered', { qui: nomDuPersonnage(demande.deQui) })}</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Bouton cibleTactile variante="accent" onClick={() => demanderAuMeneur('deck:accepter-don', { demandeId: demande.id, characterId })} icone={<Check size={16} />}>
                                    {t('modules:session.deck_module.player.hands.accept')}
                                </Bouton>
                                <Bouton cibleTactile onClick={() => demanderAuMeneur('deck:refuser-don', { demandeId: demande.id, characterId })} icone={<X size={16} />}>
                                    {t('modules:session.deck_module.player.hands.refuse')}
                                </Bouton>
                            </div>
                        </Panneau>
                    ))}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <Panneau className="min-w-0 space-y-3 p-4">
                            <h2 className="flex items-center gap-2 text-[16px] font-bold"><Hand size={18} />{t('modules:session.deck_module.player.hands.open_decks')}</h2>
                            {!paquetsOuverts.length && <p className="text-[14px] text-app-muted">Aucun paquet ouvert aux joueurs.</p>}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                {paquetsOuverts.map(paquet => {
                                    const restantes = cartesRestantes?.[paquet.id] ?? 0;
                                    const vide = restantes === 0;
                                    return (
                                        <div key={paquet.id} className="min-w-0 space-y-3 border border-app-border p-3">
                                            <h3 className="text-[16px] font-bold break-words">{paquet.name}</h3>
                                            <p className="text-[14px] text-app-muted">Restant : {restantes}</p>
                                            <Bouton habillage="libre" cibleTactile disabled={vide}
                                                onClick={() => demanderAuMeneur('deck:piocher', { deckId: paquet.id, characterId })}
                                                title={t(`modules:session.deck_module.player.hands.${vide ? 'deck_empty' : 'draw'}`)}
                                                className="flex min-w-0 w-full items-center gap-3 border border-app-border bg-app-surface-2 p-3 disabled:opacity-40">
                                                <ResolvedImage src={DeckInterpreter.getBackImageUrl(paquet.folderPath, paquet)} alt={paquet.name} className="h-[84px] w-[60px] shrink-0 object-contain" />
                                                <span className="text-[14px] font-bold text-accent">{t(`modules:session.deck_module.player.hands.${vide ? 'deck_empty' : 'draw'}`)}</span>
                                            </Bouton>
                                        </div>
                                    );
                                })}
                            </div>
                        </Panneau>
                        <Panneau className="min-w-0 space-y-3 p-4">
                            <h2 className="flex items-center gap-2 text-[16px] font-bold"><Layers size={18} />{t('modules:session.deck_module.player.hands.title')}</h2>
                            {!mesCartes.length && <p className="text-[14px] text-app-muted">{t('modules:session.deck_module.player.hands.empty')}</p>}
                            <div className="space-y-4">
                                {mesCartes.map(({ paquet, revelees, scellees }) => (
                                    <section key={paquet.id} className="min-w-0 space-y-3">
                                        <h3 className="text-[14px] font-bold text-app-muted break-words">{paquet.name}</h3>
                                        {revelees.map(index => {
                                            const enAttente = mesPropositions.some(d => d.deckId === paquet.id && d.index === index);
                                            const nom = DeckInterpreter.getCardMetadata(paquet, index)?.name ?? `Carte ${index}`;
                                            return (
                                                <div key={index} className="flex min-w-0 flex-col gap-3 border border-app-border p-3 sm:flex-row">
                                                    <Bouton habillage="libre" cibleTactile onClick={() => setCarteEnGrand({
                                                        url: DeckInterpreter.getCardImageUrl(paquet.folderPath, index, paquet), nom,
                                                        texte: DeckInterpreter.getCardMetadata(paquet, index)?.description ?? '',
                                                    })} className="self-center rounded-lg">
                                                        <ResolvedImage src={DeckInterpreter.getCardImageUrl(paquet.folderPath, index, paquet)} alt={nom} className={`h-[168px] w-[120px] object-contain ${enAttente ? 'opacity-50 grayscale' : ''}`} />
                                                    </Bouton>
                                                    <div className="min-w-0 flex-1 space-y-3">
                                                        <h4 className="text-[16px] font-bold break-words">{nom}</h4>
                                                        {enAttente ? <p role="status" className="text-[14px] text-etat-alerte">{t('modules:session.deck_module.player.hands.pending')}</p> : (
                                                            <div className="flex flex-col gap-2">
                                                                <Bouton cibleTactile variante="accent" onClick={() => demanderAuMeneur('deck:jouer-carte', { deckId: paquet.id, index, characterId })}>
                                                                    {t('modules:session.deck_module.player.hands.play_own')}
                                                                </Bouton>
                                                                {voisins.length > 0 && <select value="" onChange={e => e.target.value && demanderAuMeneur('deck:demander-don', { deckId: paquet.id, index, deQui: characterId, versQui: e.target.value })}
                                                                    title={t('modules:session.deck_module.player.hands.give_to')} aria-label={t('modules:session.deck_module.player.hands.give_to')}
                                                                    className="min-h-[44px] min-w-[44px] w-full border border-app-border bg-app-surface-2 px-2 text-[14px] text-app-text">
                                                                    <option value="">{t('modules:session.deck_module.player.hands.give_to')}</option>
                                                                    {voisins.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}
                                                                </select>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Array.from({ length: scellees }, (_, i) => <div key={`scelle-${i}`} aria-label={t('modules:session.deck_module.player.hands.hidden')}
                                            className="flex items-center gap-3 border border-dashed border-app-border p-4 text-[14px] text-app-muted">
                                            <Layers size={24} />{t('modules:session.deck_module.player.hands.hidden')}
                                        </div>)}
                                    </section>
                                ))}
                            </div>
                        </Panneau>
                    </div>
                </div>
            </GabaritDeModule>
            {carteEnGrand && <div role="dialog" aria-modal="true" aria-label={carteEnGrand.nom}
                onClick={() => setCarteEnGrand(null)} onKeyDown={e => { if (e.key === 'Escape') setCarteEnGrand(null); }} tabIndex={-1} ref={n => n?.focus()}
                className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-3 bg-app-bg/95 p-4">
                <ResolvedImage src={carteEnGrand.url} alt={carteEnGrand.nom} className="max-h-[65dvh] max-w-full object-contain" />
                <p className="text-center text-[18px] font-bold break-words">{carteEnGrand.nom}</p>
                {carteEnGrand.texte && <p className="max-h-[15dvh] max-w-xl overflow-auto text-[14px] text-app-muted">{carteEnGrand.texte}</p>}
                <Bouton cibleTactile onClick={() => setCarteEnGrand(null)}>{t('modules:session.deck_module.player.hands.tap_to_close')}</Bouton>
            </div>}
        </div>
    );
};

export default HubMainDeCartes;
