import React from 'react';
import { Lock, Unlock, RotateCcw, Network, AlertTriangle, Info, Link2, Columns3 } from 'lucide-react';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useStoryboardStore } from '../../../storyboard/useStoryboardStore';
import { gmConfirm } from '../../../../stores/useModalStore';
import { gmToast } from '../../../../stores/useToastStore';
import { useFermetureParEchap } from '../../../../hooks/useFermetureParEchap';
import { grapheDeLaTrame, constatsDeLaTrame, typesDuNiveau, NIVEAUX, NIVEAU_MAXIMUM,
    LIBELLE_DU_TYPE, renvoiEcrit, coupleDeRenvoi, coupleDEnchainement,
    type NoeudDeTrame, type PorteeDeLIntrigue, type TypeDeNoeud } from '../../logic/grapheDeLaTrame';
import { rangerLaTrame, type Position } from '../../logic/rangementDeLaTrame';
import { contientLeCentre } from '../../logic/geometrieDesCartesDeTrame';
import { adapterLeGrapheDeTrame, positionDeLaCarte, TEINTE_DE_TRAME, type TraitDeTrame } from '../../logic/adapterLeGrapheDeTrame';
import { ToileDeLaTrame, type ToileDeTrameExposee } from './ToileDeLaTrame';
import { InspecteurDeTrame } from './InspecteurDeTrame';
import { InspecteurDeLienDeTrame } from './InspecteurDeLienDeTrame';
import type { StyleDeLienDeTrame, OrganisationDeTrame, EspacementDeTrame, FormeDeTrame } from '../../../../types/campaign.types';
import { FORMES_DE_TRAME } from '../../logic/formesDeTrame';
import { coteDeLAccroche } from '../../logic/stylesDesLiensDeTrame';
import { memePositionDeTrame } from '../../logic/trajetsDeTrame';

/** Cache par campagne seulement ; le magasin conserve les décisions persistées. */
const POSITIONS_VIVANTES = new Map<string, Record<string, Position>>();

const GrapheDeLaTrame: React.FC<{ onOuvrirLaFiche: (type: TypeDeNoeud, refId: string) => void }> = ({ onOuvrirLaFiche }) => {
    const { actes, scenes, atlasMaps, entities, clues, players, campaigns, activeCampaignId,
        figerLeGrapheDeTrame, libererLeGrapheDeTrame, reinitialiserLeGrapheDeTrame, rangerLeGrapheDeTrame,
        epinglerDansLaTrame, epinglerPlusieursDansLaTrame, detacherDeLaTrame, modifierScene, placerLaSceneApres, rattacherSceneAUnActe,
        ajouterUnEnchainement, retirerUnEnchainement, stylerLeLienDeTrame,
        organiserLeGrapheDeTrame, restaurerLaDispositionDeTrame } = useSessionOSStore();
    const moments = useStoryboardStore(s => s.moments);
    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const fige = !!campagne?.trameFigee;
    const [niveau, setNiveau] = React.useState(2);
    const [portee, setPortee] = React.useState<PorteeDeLIntrigue>('tout');
    const [masquerTerminees, setMasquerTerminees] = React.useState(false);
    const [selection, setSelection] = React.useState<Set<string>>(new Set());
    const choisi = selection.size === 1 ? [...selection][0] : null;
    const setChoisi = React.useCallback((id: string | null) => setSelection(new Set(id ? [id] : [])), []);
    const [lienChoisi, setLienChoisi] = React.useState<string | null>(null);
    const [apercu, setApercu] = React.useState<{ id: string; style?: StyleDeLienDeTrame } | null>(null);
    const [revisionDeJonction, setRevisionDeJonction] = React.useState(0);
    const [surlignes, setSurlignes] = React.useState<Set<string>>(new Set());
    const [liaison, setLiaison] = React.useState(false);
    const [cadrage, setCadrage] = React.useState(0);
    const [espacement, setEspacement] = React.useState<EspacementDeTrame>('equilibre');
    const [forme, setForme] = React.useState<FormeDeTrame>('automatique');
    React.useEffect(() => {
        const conservee = campagne?.organisationDeLaTrame;
        setForme(FORMES_DE_TRAME.some(f => f.id === conservee?.forme) ? conservee!.forme! : 'automatique');
        setEspacement(conservee?.espacement ?? 'equilibre');
    }, [activeCampaignId, campagne?.organisationDeLaTrame]);
    const [organisationApercue, setOrganisationApercue] = React.useState<OrganisationDeTrame | null>(null);
    const [calculEnCours, setCalculEnCours] = React.useState(false);
    const calcul = React.useRef<AbortController | null>(null);
    const toile = React.useRef<ToileDeTrameExposee>(null);
    const conteneur = React.useRef<HTMLDivElement>(null);
    const source = React.useMemo(() => ({ actes, scenes, atlasMaps, entities, clues, moments,
        personnages: players.flatMap(p => p.characters ?? []) }), [actes, scenes, atlasMaps, entities, clues, moments, players]);
    const complet = React.useMemo(() => grapheDeLaTrame(activeCampaignId, source, { niveau: NIVEAU_MAXIMUM, portee: 'tout' }), [activeCampaignId, source]);
    const rangement = React.useMemo(() => rangerLaTrame(complet, { cartes: true }).epingles, [complet]);
    const graphe = React.useMemo(() => grapheDeLaTrame(activeCampaignId, source, {
        niveau, portee, masquerLesScenesTerminees: masquerTerminees,
    }), [activeCampaignId, source, niveau, portee, masquerTerminees]);
    const positionDe = React.useCallback((id: string) => positionDeLaCarte(id, {
        epingles: campagne?.noeudsEpinglesDeLaTrame, instantane: campagne?.positionsDeLaTrame, fige,
        vivantes: activeCampaignId ? POSITIONS_VIVANTES.get(activeCampaignId) : undefined, rangement,
    }), [campagne?.noeudsEpinglesDeLaTrame, campagne?.positionsDeLaTrame, fige, activeCampaignId, rangement]);
    React.useEffect(() => {
        if (!activeCampaignId) return;
        const cache = { ...(POSITIONS_VIVANTES.get(activeCampaignId) ?? {}) };
        for (const n of complet.noeuds) cache[n.id] ??= positionDe(n.id);
        POSITIONS_VIVANTES.set(activeCampaignId, cache);
    }, [activeCampaignId, complet, positionDe]);
    React.useEffect(() => { setChoisi(null); setLienChoisi(null); setApercu(null); setSurlignes(new Set()); setLiaison(false); }, [activeCampaignId, setChoisi]);
    const styles = React.useMemo(() => apercu
        ? { ...campagne?.stylesDesLiensDeTrame, [apercu.id]: apercu.style ?? {} } : campagne?.stylesDesLiensDeTrame,
        [campagne?.stylesDesLiensDeTrame, apercu]);
    const organisation = organisationApercue ?? campagne?.organisationDeLaTrame;
    const positionAffichee = React.useCallback((id: string) => organisationApercue?.positions[id] ?? positionDe(id), [organisationApercue, positionDe]);
    const donnees = React.useMemo(() => adapterLeGrapheDeTrame(graphe, source, { positionDe: positionAffichee, choisi, selection, liaison, surlignes,
        fige: fige || !!organisationApercue || calculEnCours, styles, lienChoisi, organisation }),
        [graphe, source, positionAffichee, choisi, selection, liaison, surlignes, fige, styles, lienChoisi, organisation, organisationApercue, calculEnCours]);
    const groupes = React.useMemo(() => Array.isArray(organisation?.groupes) ? organisation.groupes.filter(g =>
        g && typeof g.nom === 'string' && Array.isArray(g.membres) && g.membres.every(id => graphe.noeuds.some(n => n.id === id)
            && memePositionDeTrame(positionAffichee(id), organisation.positions?.[id]))
        && [g.x, g.y, g.largeur, g.hauteur].every(Number.isFinite)) : [], [organisation, graphe, positionAffichee]);
    const traitChoisi = donnees.liens.find(l => l.id === lienChoisi);
    const noeudChoisi = graphe.noeuds.find(n => n.id === choisi) ?? null;
    React.useEffect(() => {
        const ids = new Set(graphe.noeuds.map(n => n.id));
        setSelection(avant => [...avant].every(id => ids.has(id)) ? avant : new Set([...avant].filter(id => ids.has(id))));
    }, [graphe]);
    React.useEffect(() => { if (liaison) setChoisi(null); }, [liaison, setChoisi]);
    React.useEffect(() => {
        if (lienChoisi && !traitChoisi) { setLienChoisi(null); setApercu(null); }
    }, [lienChoisi, traitChoisi]);
    // Les constats décrivent la trame entière, quels que soient les filtres.
    const constats = React.useMemo(() => constatsDeLaTrame(activeCampaignId, source), [activeCampaignId, source]);
    const onChoisir = (id: string | null, ajouter = false) => {
        if (id && ajouter && !liaison) setSelection(avant => {
            const suite = new Set(avant); if (suite.has(id)) suite.delete(id); else suite.add(id); return suite;
        });
        else setChoisi(id);
        setLienChoisi(null); setApercu(null); setSurlignes(new Set());
    };
    const onSelectionner = React.useCallback((ids: string[]) => {
        setSelection(avant => avant.size === ids.length && ids.every(id => avant.has(id)) ? avant : new Set(ids));
        if (ids.length) { setLienChoisi(null); setApercu(null); setSurlignes(avant => avant.size ? new Set() : avant); }
    }, []);
    const annulerOrganisation = () => {
        calcul.current?.abort(); calcul.current = null;
        setCalculEnCours(false); setOrganisationApercue(null); setCadrage(c => c + 1);
    };
    React.useEffect(() => {
        calcul.current?.abort(); calcul.current = null;
        setCalculEnCours(false); setOrganisationApercue(null);
    }, [activeCampaignId, graphe, campagne?.stylesDesLiensDeTrame, campagne?.noeudsEpinglesDeLaTrame, campagne?.trameFigee]);
    React.useEffect(() => () => { calcul.current?.abort(); }, []);
    useFermetureParEchap(liaison || selection.size > 0 || !!traitChoisi || !!organisationApercue || calculEnCours, () => {
        if (organisationApercue || calculEnCours) annulerOrganisation();
        else if (liaison) setLiaison(false); else onChoisir(null);
    }, 'Sélection du graphe de Trame');
    const organiser = async (densite = espacement, disposition = forme) => {
        calcul.current?.abort();
        const controle = new AbortController(); calcul.current = controle;
        setEspacement(densite); setForme(disposition); setOrganisationApercue(null); setCalculEnCours(true); setLiaison(false); onChoisir(null);
        try {
            // L'inspecteur libère sa place avant de mesurer la toile réellement disponible.
            await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            controle.signal.throwIfAborted();
            const cadre = conteneur.current?.getBoundingClientRect();
            const { organiserLaTrame } = await import('../../logic/organiserLaTrame');
            controle.signal.throwIfAborted();
            const resultat = await organiserLaTrame(graphe, campagne?.stylesDesLiensDeTrame,
                { espacement: densite, forme: disposition, proportions: cadre?.height ? cadre.width / cadre.height : 16 / 9, signal: controle.signal });
            if (!controle.signal.aborted) { setOrganisationApercue(resultat); setCadrage(c => c + 1); }
        } catch (erreur) {
            if (!controle.signal.aborted) gmToast(erreur instanceof Error ? erreur.message : 'L’organisation n’a pas abouti. Réessaie.', 'error');
        } finally {
            if (calcul.current === controle) { calcul.current = null; setCalculEnCours(false); }
        }
    };
    const appliquerOrganisation = () => {
        if (!activeCampaignId || !organisationApercue) return;
        const avant = Object.fromEntries(complet.noeuds.map(n => [n.id, { ...positionDe(n.id) }]));
        POSITIONS_VIVANTES.set(activeCampaignId, { ...avant, ...organisationApercue.positions });
        organiserLeGrapheDeTrame(activeCampaignId, organisationApercue, avant);
        setOrganisationApercue(null); setCadrage(c => c + 1);
    };
    const revenirALaDisposition = () => {
        if (!activeCampaignId || !campagne?.dispositionPrecedenteDeTrame) return;
        POSITIONS_VIVANTES.set(activeCampaignId, { ...campagne.dispositionPrecedenteDeTrame.positionsVivantes });
        restaurerLaDispositionDeTrame(activeCampaignId); setCadrage(c => c + 1);
    };
    const garder = (positions: Record<string, Position>) => {
        if (activeCampaignId) POSITIONS_VIVANTES.set(activeCampaignId, { ...(POSITIONS_VIVANTES.get(activeCampaignId) ?? {}), ...positions });
    };
    const detacher = (id: string) => {
        if (!activeCampaignId) return;
        garder(toile.current?.positions() ?? {});
        detacherDeLaTrame(activeCampaignId, id);
    };
    const ranger = () => {
        if (!activeCampaignId) return;
        const cadre = conteneur.current?.getBoundingClientRect();
        const resultat = rangerLaTrame(complet, { cartes: true, proportions: cadre?.height ? cadre.width / cadre.height : undefined });
        const appliquer = () => {
            POSITIONS_VIVANTES.set(activeCampaignId, { ...resultat.epingles });
            rangerLeGrapheDeTrame(activeCampaignId, resultat.epingles);
            setCadrage(c => c + 1);
        };
        if (fige || Object.keys(campagne?.noeudsEpinglesDeLaTrame ?? {}).length)
            gmConfirm('Ranger la trame ? Les positions que tu as épinglées seront remplacées.', appliquer);
        else appliquer();
    };
    const reinitialiser = () => {
        if (!activeCampaignId) return;
        POSITIONS_VIVANTES.delete(activeCampaignId);
        reinitialiserLeGrapheDeTrame(activeCampaignId);
        setCadrage(c => c + 1);
    };
    const figerOuLiberer = () => {
        if (!activeCampaignId) return;
        garder(toile.current?.positions() ?? {});
        if (fige) libererLeGrapheDeTrame(activeCampaignId);
        else figerLeGrapheDeTrame(activeCampaignId, Object.fromEntries(complet.noeuds.map(n => [n.id, positionDe(n.id)])));
    };
    const brancher = (a: NoeudDeTrame, b: NoeudDeTrame, relier: boolean) => {
        const branche = coupleDEnchainement(a, b);
        if (branche) {
            if (relier) ajouterUnEnchainement(branche.deId, branche.versId);
            else retirerUnEnchainement(branche.deId, branche.versId);
            gmToast(relier ? 'Enchaînement créé. Sa condition se tape dans le panneau.' : 'Enchaînement retiré.', 'success');
            return;
        }
        const couple = coupleDeRenvoi(a, b);
        if (!couple) {
            gmToast(a.type === 'acte' || b.type === 'acte'
                ? 'Un acte ne se relie pas : glisse la scène sur l’acte, hors mode liaison.'
                : 'Un lien part d’une scène et va vers une scène, un lieu, un PNJ, un indice, un personnage ou une ambiance.', 'info');
            return;
        }
        const scene = scenes.find(s => s.id === couple.sceneId);
        const ecrit = scene ? renvoiEcrit(scene, couple.type, couple.refId, relier) : null;
        if (!scene || !ecrit) return;
        modifierScene(scene.id, ecrit.updates);
        gmToast(ecrit.remplace ? LIBELLE_DU_TYPE[couple.type] + ' remplacé sur « ' + scene.titre + ' ».' : relier ? 'Lien créé.' : 'Lien retiré.', ecrit.remplace ? 'info' : 'success');
    };
    const relier = (sourceId: string, cibleId: string) => {
        if (!liaison) return;
        const a = graphe.noeuds.find(n => n.id === sourceId), b = graphe.noeuds.find(n => n.id === cibleId);
        if (a && b && a.id !== b.id) brancher(a, b, true);
    };
    const delier = (trait: TraitDeTrame) => {
        if (!trait.data) return;
        const lien = trait.data.lien;
        if (lien.nature === 'appartenance' || lien.nature === 'suite') {
            gmToast(lien.nature === 'suite' ? 'Ce trait est l’ordre du document, pas un enchaînement.' : 'La structure ne se délie pas : glisse la scène sur un autre acte.', 'info');
            return;
        }
        const a = graphe.noeuds.find(n => n.id === lien.source), b = graphe.noeuds.find(n => n.id === lien.target);
        if (a && b) {
            brancher(a, b, false);
            if (activeCampaignId) stylerLeLienDeTrame(activeCampaignId, trait.id);
        }
    };
    const choisirLien = (trait: TraitDeTrame) => {
        if (liaison) { delier(trait); return; }
        if (trait.id === lienChoisi) return;
        setChoisi(null); setLienChoisi(trait.id); setApercu(null); setSurlignes(new Set());
        // Le panneau prend sa place : garder les deux cartes et leurs cibles visibles.
        setCadrage(c => c + 1);
    };
    const deplacer = (id: string, position: Position, depot: boolean) => {
        if (!activeCampaignId || fige || liaison || organisationApercue || calculEnCours) return;
        garder({ [id]: { ...position } });
        epinglerDansLaTrame(activeCampaignId, id, { ...position });
        const noeud = graphe.noeuds.find(n => n.id === id);
        if (!depot || noeud?.type !== 'scene') return;
        const places = toile.current?.positions() ?? {};
        const dessous = graphe.noeuds.filter(n => n.id !== id && (n.type === 'acte' || n.type === 'scene'))
            .find(n => contientLeCentre(position, places[n.id] ?? positionDe(n.id), n.type));
        if (dessous?.type === 'acte') gmConfirm('Rattacher « ' + noeud.nom + ' » à l’acte « ' + dessous.nom + ' » ? Elle en prendra la dernière place.', () => rattacherSceneAUnActe(noeud.refId, dessous.refId));
        else if (dessous?.type === 'scene') gmConfirm('Placer « ' + noeud.nom + ' » juste après « ' + dessous.nom + ' » ?', () => placerLaSceneApres(noeud.refId, dessous.refId));
    };
    const deplacerPlusieurs = (positions: Record<string, Position>) => {
        if (!activeCampaignId || fige || liaison || organisationApercue || calculEnCours) return;
        const visibles = new Set(graphe.noeuds.map(n => n.id));
        const places = Object.fromEntries(Object.entries(positions).filter(([id]) => visibles.has(id)));
        garder(places); epinglerPlusieursDansLaTrame(activeCampaignId, places);
        // Un mouvement de groupe ne réordonne ni ne rattache ses scènes au dépôt.
    };
    const suivreLeConstat = (constat: { noeuds: string[]; niveau: number }) => {
        const actif = surlignes.size === constat.noeuds.length && constat.noeuds.every(n => surlignes.has(n));
        setSurlignes(actif ? new Set() : new Set(constat.noeuds));
        if (constat.niveau > niveau) setNiveau(constat.niveau);
        setChoisi(null);
        setLienChoisi(null); setApercu(null);
    };
    const voisins = noeudChoisi ? graphe.noeuds.filter(n => graphe.liens.some(l =>
        (l.source === noeudChoisi.id && l.target === n.id) || (l.target === noeudChoisi.id && l.source === n.id))) : [];
    if (!activeCampaignId) return null;
    const typesVisibles = typesDuNiveau(niveau);
    const scenesVisibles = graphe.noeuds.filter(n => n.type === 'scene').length;
    const rienAMontrer = graphe.noeuds.length === 0 || scenesVisibles === 0;
    return (
        <div className="h-full flex flex-col gap-3 min-h-0">
            {/* ── La barre : le niveau, la portée, et ce qui fige ─────────── */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/*
                  ⭐ **Le curseur de niveau, idée de David.** Sept bascules
                  indépendantes, c'est 128 vues possibles dont il faut choisir la
                  bonne ; un seul curseur, c'est une profondeur. *La densité se
                  règle par un geste, pas par une négociation.*
                */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-app-bg/40 border border-app-border/20">
                    {NIVEAUX.map((cran, index) => (
                        <button
                            key={cran.libelle}
                            onClick={() => setNiveau(index)}
                            title={index === 0 ? 'Les actes et leurs scènes' : `Jusqu'aux ${cran.libelle.toLowerCase()}`}
                            className={`px-2.5 py-1.5 rounded-lg text-ui-10 font-black uppercase tracking-widest transition-all ${
                                index <= niveau
                                    ? 'bg-accent/20 text-accent'
                                    : 'text-app-text/30 hover:text-app-text/60'
                            }`}
                        >
                            {cran.libelle}
                        </button>
                    ))}
                </div>

                <select
                    value={portee}
                    onChange={e => setPortee(e.target.value as PorteeDeLIntrigue)}
                    className="bg-app-bg/40 border border-app-border/20 rounded-xl px-3 py-2 text-ui-10 font-bold outline-none focus:border-accent/50 cursor-pointer"
                >
                    <option value="tout">Toutes les scènes</option>
                    <option value="sans-optionnelles">Sans les optionnelles</option>
                    <option value="principale">Intrigue principale seule</option>
                </select>

                <button
                    onClick={() => setMasquerTerminees(v => !v)}
                    className={`px-3 py-2 rounded-xl border text-ui-10 font-bold transition-all ${
                        masquerTerminees
                            ? 'bg-accent/20 border-accent/40 text-accent'
                            : 'bg-app-bg/40 border-app-border/20 text-app-text/40 hover:text-app-text/70'
                    }`}
                >
                    Masquer les scènes closes
                </button>

                <div className="flex-1" />

                {/*
                  ⭐ **Le mode liaison.** Il s'annonce en clair plutôt que de se
                  deviner : *un mode invisible est un mode dont on ne sort pas.*
                  Il coupe le glisser de rangement, sans quoi relier déplacerait
                  et épinglerait le nœud de départ.
                */}
                <button
                    disabled={calculEnCours || !!organisationApercue}
                    onClick={() => { setLiaison(v => !v); setLienChoisi(null); setApercu(null); }}
                    title={liaison
                        ? 'Quitter le mode liaison'
                        : 'Glisser d’une scène vers un lieu, un PNJ, un indice… et cliquer un lien pour le retirer'}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-ui-10 font-black uppercase tracking-widest transition-all ${
                        liaison
                            ? 'bg-etat-info/25 border-etat-info/50 text-etat-info'
                            : 'bg-app-bg/40 border-app-border/20 text-app-text/45 hover:text-app-text/80'
                    }`}
                ><Link2 size={13} /> Relier</button>

                <button
                    disabled={calculEnCours || !!organisationApercue}
                    onClick={ranger}
                    title="Chaque acte selon sa forme : une chaîne qui se lit de gauche à droite, ou une étoile autour de son carrefour. Tu peux ensuite ajuster à la main."
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-app-border/20 text-ui-10 font-bold text-app-text/60 hover:text-app-text hover:bg-app-text/5 transition-all"
                ><Columns3 size={13} /> Ranger</button>

                <div className="commande-organiser-trame">
                    <select aria-label="Disposition de la trame" title="Choisir la forme du rangement automatique" value={forme} disabled={calculEnCours}
                        onChange={e => {
                            const choix = e.target.value as FormeDeTrame;
                            if (organisationApercue) void organiser(espacement, choix); else setForme(choix);
                        }}>
                        {FORMES_DE_TRAME.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                    <select aria-label="Espacement de la trame" value={espacement} disabled={calculEnCours}
                        onChange={e => {
                            const choix = e.target.value as EspacementDeTrame;
                            if (organisationApercue) void organiser(choix); else setEspacement(choix);
                        }}>
                        <option value="compact">Compact</option><option value="equilibre">Équilibré</option><option value="aere">Aéré</option>
                    </select>
                    <button onClick={() => void organiser()} disabled={calculEnCours || rienAMontrer}
                        title="Organiser les cartes affichées par acte et calculer les trajets des liens. Aperçu avant application.">Organiser</button>
                </div>
                {campagne?.dispositionPrecedenteDeTrame && <button className="retour-disposition-trame"
                    disabled={calculEnCours || !!organisationApercue} onClick={revenirALaDisposition}>Disposition précédente</button>}

                <button
                    disabled={calculEnCours || !!organisationApercue}
                    onClick={figerOuLiberer}
                    title={fige ? 'Autoriser le déplacement des cartes' : 'Garder la disposition telle qu’elle est'}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-app-border/20 text-ui-10 font-bold text-app-text/60 hover:text-app-text hover:bg-app-text/5 transition-all"
                >
                    {fige ? <Lock size={13} className="text-accent" /> : <Unlock size={13} />}
                    {fige ? 'Figé' : 'Libre'}
                </button>
                <button
                    disabled={calculEnCours || !!organisationApercue}
                    onClick={reinitialiser}
                    title="Réinitialiser les positions" aria-label="Réinitialiser les positions"
                    className="p-2 rounded-xl border border-app-border/20 text-app-text/40 hover:text-app-text hover:bg-app-text/5 transition-all"
                ><RotateCcw size={13} /></button>
            </div>

            {(calculEnCours || organisationApercue) && <div className="apercu-organisation-trame" role="status">
                <span>{calculEnCours ? 'Organisation en cours…' : `Aperçu de la disposition — ${FORMES_DE_TRAME.find(f => f.id === organisationApercue?.forme)?.nom ?? 'Automatique'} — rien n’est encore enregistré.`}</span>
                {organisationApercue && <button onClick={appliquerOrganisation}>Appliquer la disposition</button>}
                <button onClick={annulerOrganisation}>Annuler l’aperçu</button>
            </div>}
            {selection.size > 1 && <p className="selection-multiple-trame" role="status">
                {selection.size} cartes sélectionnées · {fige ? 'Passe en Libre pour les déplacer.' : 'Glisse une carte ou le cadre pour déplacer le groupe.'} Ctrl + clic pour ajuster · Échap pour désélectionner.
            </p>}

            {liaison && (
                <p className="shrink-0 px-3 py-2 rounded-xl bg-etat-info/10 border border-etat-info/25 text-ui-10 font-bold text-etat-info/90">
                    Glisse d’une scène vers une autre par les points d’accroche pour dire qu’elle y mène, ou vers une annexe · clique un lien pour le retirer · Échap pour quitter.
                </p>
            )}

            {/* ── Les constats ───────────────────────────────────────────── */}
            {constats.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {constats.map(constat => {
                        const actif = surlignes.size === constat.noeuds.length
                            && constat.noeuds.every(n => surlignes.has(n));
                        return (
                            <button
                                key={constat.id}
                                onClick={() => suivreLeConstat(constat)}
                                title={constat.niveau > niveau
                                    ? `Monte au niveau « ${NIVEAUX[constat.niveau].libelle} » pour les voir`
                                    : 'Isoler ces nœuds'}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-ui-10 font-bold transition-all ${
                                    actif
                                        ? 'bg-accent/20 border-accent/40 text-accent'
                                        : constat.ton === 'alerte'
                                            ? 'bg-etat-alerte/10 border-etat-alerte/30 text-etat-alerte/90 hover:bg-etat-alerte/20'
                                            : 'bg-app-bg/40 border-app-border/20 text-app-text/45 hover:text-app-text/80'
                                }`}
                            >
                                {constat.ton === 'alerte' ? <AlertTriangle size={11} /> : <Info size={11} />}
                                <span className="font-black">{constat.noeuds.length}</span>
                                {constat.libelle}{constat.noeuds.length > 1 ? 's' : ''}
                            </button>
                        );
                    })}
                    {surlignes.size > 0 && (
                        <button
                            onClick={() => setSurlignes(new Set())}
                            className="px-2.5 py-1.5 rounded-lg text-ui-10 font-bold text-app-text/30 hover:text-app-text/70"
                        >Tout remontrer</button>
                    )}
                </div>
            )}

            <div className="corps-du-graphe-de-trame flex-1 min-h-0 flex gap-3">
                <div ref={conteneur} className="surface-du-graphe-de-trame flex-1 min-w-0 rounded-2xl border border-app-border/20 bg-app-bg/30 overflow-hidden relative">
                    {rienAMontrer ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-40 px-8">
                            <Network size={36} />
                            {/* ⚠️ Un écran vide doit dire POURQUOI il est vide, et
                                les trois raisons ne se confondent pas : rien du tout,
                                des actes sans scène, ou un filtre trop serré. */}
                            <p className="text-sm max-w-sm leading-relaxed">
                                {portee === 'principale'
                                    ? 'Aucune scène n’est classée « intrigue principale ». Le rang se choisit dans la fiche d’une scène.'
                                    : portee === 'sans-optionnelles' && scenesVisibles === 0
                                        ? 'Toutes les scènes visibles sont optionnelles.'
                                        : masquerTerminees && scenesVisibles === 0
                                            ? 'Toutes les scènes de cette trame sont closes.'
                                            : graphe.noeuds.length === 0
                                                ? 'Cette campagne n’a pas encore d’acte. Un acte porte un enjeu ; ses scènes portent ce qui s’y joue.'
                                                : 'Ces actes n’ont encore aucune scène.'}
                            </p>
                        </div>
                    ) : (
                        <ToileDeLaTrame key={activeCampaignId} ref={toile} noeuds={donnees.noeuds} liens={donnees.liens}
                            liaison={liaison} fige={fige} cadrage={cadrage} onChoisir={onChoisir}
                            groupes={groupes} apercuOrganisation={!!organisationApercue || calculEnCours}
                            onDeplacer={deplacer} onDeplacerPlusieurs={deplacerPlusieurs} onSelectionner={onSelectionner}
                            onRelier={relier} onChoisirLien={choisirLien}
                            onJonction={(lien, connexion) => {
                                setApercu({ id: lien.id, style: { ...styles?.[lien.id],
                                    depart: coteDeLAccroche(connexion.sourceHandle), arrivee: coteDeLAccroche(connexion.targetHandle) } });
                                setRevisionDeJonction(r => r + 1);
                            }} />
                    )}
                    {/* La légende ne montre que ce que le niveau affiche. */}
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 max-w-[70%] pointer-events-none">
                        {(Object.keys(TEINTE_DE_TRAME) as TypeDeNoeud[]).filter(t => typesVisibles.has(t)).map(type => (
                            <span key={type} className="flex items-center gap-1.5 text-ui-9 font-bold uppercase tracking-widest text-app-text/70">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TEINTE_DE_TRAME[type] }} />
                                {LIBELLE_DU_TYPE[type]}
                            </span>
                        ))}
                        <span className="text-ui-9 font-bold uppercase tracking-widest text-app-text/60">
                            · {scenesVisibles} scène{scenesVisibles > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                {noeudChoisi && <InspecteurDeTrame noeudChoisi={noeudChoisi} voisins={voisins}
                    onChoisir={onChoisir} onDetacher={detacher} onOuvrirLaFiche={onOuvrirLaFiche} />}
                {traitChoisi && <InspecteurDeLienDeTrame key={activeCampaignId + traitChoisi.id + revisionDeJonction} lien={traitChoisi}
                    depart={graphe.noeuds.find(n => n.id === traitChoisi.source)?.nom ?? ''}
                    arrivee={graphe.noeuds.find(n => n.id === traitChoisi.target)?.nom ?? ''}
                    style={campagne?.stylesDesLiensDeTrame?.[traitChoisi.id]}
                    brouillonInitial={apercu?.id === traitChoisi.id ? apercu.style : undefined}
                    onFermer={() => onChoisir(null)}
                    onApercu={style => setApercu(style ? { id: traitChoisi.id, style } : null)}
                    onAppliquer={style => { stylerLeLienDeTrame(activeCampaignId, traitChoisi.id, style); setApercu(null); }}
                    onRetirer={() => gmConfirm('Retirer ce lien de « ' + graphe.noeuds.find(n => n.id === traitChoisi.source)?.nom
                        + ' » vers « ' + graphe.noeuds.find(n => n.id === traitChoisi.target)?.nom + ' » ?', () => {
                        delier(traitChoisi); stylerLeLienDeTrame(activeCampaignId, traitChoisi.id); onChoisir(null);
                    })} />}
            </div>
        </div>
    );
};
export default GrapheDeLaTrame;
