import React, { useState } from 'react';
import { Users, Crown, ChevronRight, Layers } from 'lucide-react';
import { gmToast } from '../../../stores/useToastStore';
import { useCombatStore } from '../useCombatStore';
import { useOrdreDuTourStore } from '../useOrdreDuTourStore';
import { useSessionOSStore } from '../../session/useSessionOSStore';
import { DeckInterpreter } from '../../session/logic/DeckInterpreter';
import FicheDeCarteDAction from '../../session/components/FicheDeCarteDAction';
import { ajusterLeChocDuCamp } from '../ficheDesCombattants';
import { candidats, campQuiALaMain, roundTermine, type Camp } from '../logic/OrdreDuTour';
import {
    ACTIONS_APPROUVEES,
    EFFETS_DE_CONFLIT,
    campQuiCommence,
    carteDecrite,
    effetsDuCamp,
    ligneActive,
    nomDuCampDeTorg,
    paquetDActionDuJeu,
    type SceneDeConflit,
} from '../logic/paquetDAction';
import type { CarteDAction, EffetDeConflit } from '../../../types/deck.types';

/**
 * **L'ordre d'action de Torg : le Paquet d'Action** — 2026-10-13.
 *
 * Au début de chaque round, le meneur retourne une carte ; sa Ligne de Conflit
 * dit quel camp commence et ce que chacun reçoit. Le camp désigné joue tous ses
 * tours dans l'ordre de son choix, puis l'autre. Remplace, pour ce mode, le
 * panneau d'alternance de Dune — même store, mêmes camps.
 *
 * Décisions de David : la carte se décrit **à la première retourne** (ou
 * d'avance dans Deck-OS) ; les effets sont **annoncés**, et Inspiration,
 * Fatigués et Vivacité s'appliquent **en un clic** ; Déstabilisés et « Un de
 * plus ! » sont lus par le panneau de jet.
 */

const IconeDuCamp: React.FC<{ camp: Camp }> = ({ camp }) => (camp === 'joueurs' ? <Users size={12} /> : <Crown size={12} />);

/** Ce qu'un clic fait pour un effet — les autres s'annoncent seulement. */
const GESTES: Partial<Record<EffetDeConflit, { libelle: (camp: Camp) => string; court: string }>> = {
    'inspiration': { libelle: camp => `−2 Choc aux ${nomDuCampDeTorg(camp)}`, court: '−2 Choc' },
    'fatigues': { libelle: camp => `+2 Choc aux ${nomDuCampDeTorg(camp)}`, court: '+2 Choc' },
    'vivacite': { libelle: camp => `Second tour des ${nomDuCampDeTorg(camp)}`, court: 'Second tour' },
};

const PanneauDuPaquetDAction: React.FC = () => {
    const combattants = useCombatStore(s => s.combatants);
    const {
        tour, carte, scene, dejaApplique, carteEnAttente,
        choisirLaScene, poserLaCarte, ouvrirSurLaCarte, ouvrir, faireAgirDansSonCamp, secondTour, noterLApplication, clore,
    } = useOrdreDuTourStore();
    const decks = useSessionOSStore(s => s.decks);
    const systeme = useSessionOSStore(s => s.campaigns.find(c => c.id === s.activeCampaignId)?.system);
    const [modifier, setModifier] = useState(false);

    if (combattants.length === 0) return null;

    const paquet = paquetDActionDuJeu(decks, systeme);
    const deckDeLaCarte = carte ? decks.find(d => d.id === carte.deckId) ?? null : null;
    const decrite = carteDecrite(deckDeLaCarte, carte?.index);
    const ligne = decrite ? ligneActive(decrite, scene) : null;
    /** La carte est posée mais son round n'est pas ouvert — elle attend d'être décrite ou tranchée. */
    const enAttenteDeLaCarte = !!carte && carteEnAttente;

    const retourner = () => {
        if (!paquet) return;
        const session = useSessionOSStore.getState();
        if ((session.deckStates[paquet.id]?.remainingIndices.length ?? 0) === 0) {
            // Le livre ne dit pas comment reconstituer un paquet épuisé : on remélange, et on le dit.
            session.shuffleDeck(paquet.id);
            gmToast('Paquet d’Action épuisé : remélangé.', 'info');
        }
        session.drawCard(paquet.id);
        const index = useSessionOSStore.getState().deckStates[paquet.id]?.currentCardIndex;
        if (index === null || index === undefined) return;
        const pose = { deckId: paquet.id, index };
        const connue = carteDecrite(useSessionOSStore.getState().decks.find(d => d.id === paquet.id), index);
        setModifier(false);
        poserLaCarte(pose, connue ? campQuiCommence(ligneActive(connue, scene)) : null);
    };

    const ouvrirApresDescription = (c: CarteDAction) => {
        setModifier(false);
        if (enAttenteDeLaCarte) ouvrirSurLaCarte(campQuiCommence(ligneActive(c, scene)));
    };

    const appliquer = (effet: EffetDeConflit, camp: Camp) => {
        const cle = `${effet}:${camp}`;
        if (effet === 'vivacite') {
            secondTour(camp);
        } else {
            const dits = ajusterLeChocDuCamp(camp, effet === 'inspiration' ? -2 : 2);
            gmToast(`${EFFETS_DE_CONFLIT[effet].libelle} — ${dits.length ? dits.join(' ; ') : 'personne n’avait de Choc'}`, 'info');
        }
        noterLApplication(cle);
    };

    const aJouer = tour ? candidats(combattants, tour) : [];
    const campEnMain = tour ? campQuiALaMain(combattants, tour) : null;

    return (
        <div className="space-y-3" data-paquet-d-action>
            <div className="flex items-center gap-2">
                <p className="text-ui-10 font-black uppercase tracking-widest text-app-text/40 flex items-center gap-1.5">
                    <Layers size={12} /> Paquet d’Action{tour ? ` · round ${tour.round}` : ''}
                </p>
                {tour && (
                    <button type="button" onClick={clore} className="ml-auto text-ui-9 font-bold uppercase tracking-widest text-app-text/30 hover:text-etat-danger">
                        Clore
                    </button>
                )}
            </div>
            {/* La colonne d'initiative est étroite : la scène a sa propre ligne. */}
            <div className="grid grid-cols-2 rounded-lg border border-app-border/40 overflow-hidden" role="group" aria-label="Scène">
                    {(['standard', 'dramatique'] as SceneDeConflit[]).map(s => (
                        <button
                            key={s}
                            type="button"
                            aria-pressed={scene === s}
                            onClick={() => choisirLaScene(s)}
                            title={s === 'dramatique' ? 'La ligne sombre : moments charnières, dénouements — et toute scène face à une créature à Effroi' : 'La ligne claire : la plupart des combats'}
                            className={`px-2 py-1 text-ui-9 font-black uppercase tracking-widest ${scene === s ? 'bg-accent/15 text-accent' : 'text-app-text/40'}`}
                        >
                            {s === 'standard' ? 'Standard' : 'Dramatique'}
                        </button>
                    ))}
            </div>

            {!paquet && (
                <p className="text-ui-11 text-app-text/50 leading-snug" data-sans-paquet>
                    Aucun paquet de ce jeu n’est marqué « Paquet d’Action » dans Deck-OS. En attendant vos
                    cartes, désignez le camp qui commence.
                </p>
            )}

            {/* ── La carte du round ─────────────────────────────────────────── */}
            {carte && deckDeLaCarte && (
                <div className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2" data-carte-du-round={carte.index}>
                    <div className="flex items-start gap-3">
                        <img
                            src={DeckInterpreter.getCardImageUrl(deckDeLaCarte.folderPath, carte.index, deckDeLaCarte)}
                            alt=""
                            className="h-16 w-auto shrink-0 rounded border border-app-border/40 object-cover"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                            <p className="flex items-baseline gap-2 text-xs font-bold text-app-text">
                                {deckDeLaCarte.cardMetadata?.[carte.index]?.name ?? `Carte n° ${carte.index}`}
                                {decrite && !modifier && (
                                    <button type="button" onClick={() => setModifier(true)} className="ml-auto text-ui-9 font-bold uppercase tracking-widest text-app-text/30 hover:text-accent">
                                        Modifier
                                    </button>
                                )}
                            </p>
                            <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                                ligne {scene === 'dramatique' ? 'dramatique' : 'standard'}
                            </p>
                            {ligne && (
                                <p className="flex items-center gap-1.5 text-sm font-black text-accent" data-qui-commence>
                                    <IconeDuCamp camp={campQuiCommence(ligne)} /> {nomDuCampDeTorg(campQuiCommence(ligne))} d’abord
                                </p>
                            )}
                            {decrite && decrite.approuvees.length > 0 && (
                                <p className="text-ui-11 text-app-text/70" data-action-approuvee>
                                    Action approuvée : <strong>{decrite.approuvees.map(a => ACTIONS_APPROUVEES[a]).join(', ')}</strong>
                                    <span className="text-app-text/40"> — réussie, une Carte du Destin en main</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {ligne && !modifier && (['joueurs', 'adversaires'] as Camp[]).map(camp => effetsDuCamp(ligne, camp).map(effet => {
                        const def = EFFETS_DE_CONFLIT[effet];
                        const geste = GESTES[effet];
                        const fait = dejaApplique.includes(`${effet}:${camp}`);
                        return (
                            <div key={`${camp}-${effet}`} className="space-y-0.5 border-t border-app-border/20 pt-1.5 text-ui-11" data-effet-de-conflit={`${effet}:${camp}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`font-black ${def.sorte === 'avantage' ? 'text-etat-succes' : 'text-etat-danger'}`}>
                                        {nomDuCampDeTorg(camp)} : {def.libelle}
                                    </span>
                                    {geste && tour && (
                                        <button
                                            type="button"
                                            disabled={fait}
                                            onClick={() => appliquer(effet, camp)}
                                            aria-label={fait ? 'Appliqué' : geste.libelle(camp)}
                                            title={geste.libelle(camp)}
                                            className="ml-auto shrink-0 px-2 py-0.5 rounded-md border border-accent/40 text-ui-10 font-bold text-accent disabled:opacity-30"
                                        >
                                            {fait ? 'Appliqué' : geste.court}
                                        </button>
                                    )}
                                </div>
                                <p className="text-app-text/50 leading-snug">{def.texte}</p>
                            </div>
                        );
                    }))}

                    {(!decrite || modifier) && (
                        <>
                            <FicheDeCarteDAction
                                key={`${carte.deckId}-${carte.index}`}
                                deck={deckDeLaCarte}
                                index={carte.index}
                                onEnregistree={ouvrirApresDescription}
                                onAnnuler={modifier ? () => setModifier(false) : undefined}
                            />
                            {!decrite && enAttenteDeLaCarte && (
                                <div className="flex flex-wrap items-center gap-2 text-ui-10 text-app-text/40">
                                    Ou ouvrir sans la décrire :
                                    {(['joueurs', 'adversaires'] as Camp[]).map(camp => (
                                        <button key={camp} type="button" onClick={() => ouvrirSurLaCarte(camp)}
                                            className="px-2 py-0.5 rounded-md border border-app-border/40 font-bold text-app-text/60 hover:text-accent">
                                            {nomDuCampDeTorg(camp)} d’abord
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── Retourner : le premier round, ou le suivant ────────────────── */}
            {(!tour || roundTermine(combattants, tour)) && !enAttenteDeLaCarte && (
                paquet ? (
                    <button
                        type="button"
                        onClick={retourner}
                        className="w-full px-3 py-2 rounded-xl border border-accent/50 bg-accent/10 text-ui-10 font-black uppercase tracking-widest text-accent hover:bg-accent/20"
                    >
                        {tour ? 'Retourner la carte suivante' : 'Retourner la première carte d’Action'}
                    </button>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {(['joueurs', 'adversaires'] as Camp[]).map(camp => (
                            <button key={camp} type="button" onClick={() => (tour ? ouvrirSurLaCarte(camp) : ouvrir(camp))}
                                className="px-3 py-2 rounded-xl border border-app-border/40 hover:border-accent/50 hover:text-accent text-app-text/70 text-ui-10 font-black uppercase tracking-widest flex items-center justify-center gap-1.5">
                                <IconeDuCamp camp={camp} /> {nomDuCampDeTorg(camp)} d’abord
                            </button>
                        ))}
                    </div>
                )
            )}

            {/* ── Le round en cours : le camp qui a la main choisit son ordre ─── */}
            {tour && !roundTermine(combattants, tour) && campEnMain && (
                <div className="space-y-2">
                    <p className="text-ui-11 text-app-text/50 leading-snug">
                        La main est aux <strong className="text-app-text/80">{nomDuCampDeTorg(campEnMain)}</strong>
                        <span className="text-app-text/30"> — dans l’ordre de leur choix</span>
                    </p>
                    <div className="space-y-1">
                        {aJouer.map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => faireAgirDansSonCamp(c.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-app-border/30 hover:border-accent/50 hover:bg-accent/5 transition-colors text-left"
                            >
                                <ChevronRight size={12} className="text-app-text/30" />
                                <span className="text-xs font-bold text-app-text/80 truncate">{c.name}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-ui-10 text-app-text/25">
                        {combattants.length - tour.ontAgi.length} sur {combattants.length} n’ont pas encore agi.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PanneauDuPaquetDAction;
