import React, { useState, memo } from 'react';
import { ChevronLeft, Package, BookOpen, PenTool, Shield, Layout, FileText, Users2, Dices } from 'lucide-react';
import { pointsDeVieApres } from '../../modules/combat/logic/SanteDuCombattant';
import EtatDeSante from '../../modules/combat/components/EtatDeSante';
import { useSessionOSStore } from '../../modules/session/useSessionOSStore';
import { useClientStore } from '../../stores/useClientStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../data/defaultSheetTemplates';
import { ResolvedImage } from '../ResolvedImage';
import type { SheetSection, SheetField } from '../../data/defaultSheetTemplates';
import FicheHote from '../../modules/fiches/FicheHote';
import { useCorrespondanceDuJeu } from '../../modules/fiches/useCorrespondanceDuJeu';
import { useCorrespondanceDuGroupe } from '../../modules/fiches/useCorrespondanceDuGroupe';
import { tousLesPilotes } from '../../modules/session/store/tousLesPilotes';
import { campagneDuGroupe, groupePourLHote, nomDuGroupe } from '../../modules/session/logic/groupeDeLaCampagne';
import { ressourcesDeLaTable } from '../../modules/table/reservesDuGroupe';
import type { Rapprochement } from '../../modules/fiches/rapprochementDeLaFiche';
import type { PlayerCharacter, Campaign, SheetTemplate, InventoryItem } from '../../modules/session/store/types';
import { resolveSheetTemplate } from '../../modules/session/logic/templateResolver';
import { piloteDuPersonnage } from '../../modules/session/logic/piloteDuPersonnage';
import PanneauDesRessources from '../../modules/table/PanneauDesRessources';
import PanneauDeJet from '../../modules/session/components/PanneauJetDeFiche';
import { PanneauFatigueVoyageur } from '../../modules/session/components/PanneauFatigueVoyageur';
import { PanneauSanteVoyageur } from '../../modules/session/components/PanneauSanteVoyageur';
import { PanneauTachesVoyageur } from '../../modules/session/components/PanneauTachesVoyageur';
import { PanneauReposVoyageur } from '../../modules/session/components/PanneauReposVoyageur';
import { PanneauProgressionVoyageur } from '../../modules/session/components/PanneauProgressionVoyageur';
import { PanneauRecoursVoyageur } from '../../modules/session/components/PanneauRecoursVoyageur';
import { PanneauAstrologieVoyageur } from '../../modules/session/components/PanneauAstrologieVoyageur';
import { PanneauRepriseVoyageur } from '../../modules/session/components/PanneauRepriseVoyageur';
import { estUneFicheDeVoyageur, lireFicheDeVoyageur, CLE_REPRISE } from '../../modules/session/logic/ficheDeVoyageur';
import type { GameDriver } from '../../types/drivers';
import JetsDeLaFiche from './JetsDeLaFiche';
import { lireLesJetsDeLaFiche } from './lectureDesJetsDeLaFiche';
import OngletsDeLaFiche from '../../modules/session/components/OngletsDeLaFiche';
import { CarteDuJeu } from '../../modules/session/components/fields/EtapesDuJet';
import { Bouton, EnTeteDeModule, Etiquette, Panneau } from '../socle';
import { estUneSauvegarde, decrireLeJetDuPilote } from '../../modules/dice/lectureDuPilote';
import ChampDuReferentiel from '../../modules/session/components/fields/ChampDuReferentiel';
import { useSheetCalculator } from '../../modules/session/hooks/useSheetCalculator';
import { plafondDuChamp } from '../../modules/session/logic/plafondDuChamp';
import { useSaisieDifferee } from './useSaisieDifferee';

type OngletDuJoueur = 'synthese' | 'test' | 'fiche' | 'groupe';

interface HubCharacterSheetProps {
    onClose: () => void;
}

/**
 * HubCharacterSheet - Main Wrapper
 * Gère la sélection du personnage et injecte une 'key' pour réinitialiser l'état lors d'un changement.
 */
const HubCharacterSheet: React.FC<HubCharacterSheetProps> = ({ onClose }) => {
    const { characterId } = useClientStore();
    const { players, campaigns, remoteUpdateCharacterVitals, customSheetTemplates, remoteUpdateCharacterNarrative, remoteUpdateCharacterSheetData, customGameDrivers, activeCampaignId } = useSessionOSStore();

    const playerWithChar = players.find(p => p.characters.some(c => c.id === characterId));
    const character = playerWithChar?.characters.find(c => c.id === characterId);

    if (!character || !playerWithChar) return null;

    return (
        <HubCharacterSheetContent 
            key={character.id}
            character={character}
            playerId={playerWithChar.id}
            onClose={onClose}
            remoteUpdateCharacterVitals={remoteUpdateCharacterVitals}
            customSheetTemplates={customSheetTemplates}
            remoteUpdateCharacterNarrative={remoteUpdateCharacterNarrative}
            remoteUpdateCharacterSheetData={remoteUpdateCharacterSheetData}
            campaigns={campaigns}
            customGameDrivers={customGameDrivers}
            campaignId={character.campaignId ?? activeCampaignId ?? null}
        />
    );
};

interface ContentProps {
    character: PlayerCharacter;
    playerId: string;
    onClose: () => void;
    remoteUpdateCharacterVitals: (playerId: string, charId: string, updates: { hp?: number; mp?: number; ap?: number }) => void;
    customSheetTemplates: SheetTemplate[];
    remoteUpdateCharacterNarrative: (playerId: string, charId: string, updates: { description?: string; playerNotes?: string; inventory?: string }) => void;
    /** Ce que la fiche HTML impose depuis la tablette, remonté au meneur. */
    remoteUpdateCharacterSheetData: (playerId: string, charId: string, updates: { sheetData?: Record<string, unknown>; description?: string; playerNotes?: string; inventory?: string; inventoryItems?: InventoryItem[] }) => void;
    campaigns: Campaign[];
    customGameDrivers: GameDriver[];
    /** Table à laquelle ce personnage joue — celle dont les réserves comptent. */
    campaignId: string | null;
}

const HubCharacterSheetContent: React.FC<ContentProps> = ({
    character, playerId, onClose, remoteUpdateCharacterVitals, customSheetTemplates, remoteUpdateCharacterNarrative, remoteUpdateCharacterSheetData, campaigns, customGameDrivers, campaignId
}) => {
    // État local pour une saisie fluide
    const [localDescription, setLocalDescription] = useState(character.description ?? '');
    const [localPlayerNotes, setLocalPlayerNotes] = useState(character.playerNotes ?? '');
    const [localInventory, setLocalInventory] = useState(character.inventory ?? '');

    const allTemplates = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const template = resolveSheetTemplate(character, campaigns, allTemplates);

    /**
     * Le pilote du personnage — **la même règle que sur l'écran du meneur**.
     *
     * `piloteDuPersonnage` est partagé : `systemId`, sinon le pilote dont c'est
     * le gabarit, sinon la campagne. Deux copies de cette résolution auraient
     * fini par ne plus désigner le même jeu, et le joueur aurait lancé les dés
     * d'un autre système sans que rien ne le dise — c'est exactement ce qui est
     * arrivé le 2026-08-15 sur la fiche de Dune.
     *
     * Note : `customGameDrivers` n'arrivait pas jusqu'ici avant ce jour. Le MJ
     * les diffusait, `useHubSync` les jetait, et toute fiche de la tablette
     * retombait sur le gabarit « Generic ».
     */
    const pilote = piloteDuPersonnage(character, campaigns, customGameDrivers);

    /*
      **Les champs reliés à une liste du jeu, saisis sur la tablette** — Nephilim,
      2026-10-18 (choix de David : « consulter et choisir »). Les Incarnations et
      les Vécus proposent les époques et les Vécus du livre, comme chez le meneur.

      La saisie reste en **brouillon** sur la tablette et part au meneur après une
      pause de frappe (ou à la fermeture) : une écriture réseau par lettre
      inonderait la table. Le brouillon s'efface quand la fiche revenue du meneur
      porte la même valeur — c'est elle qui fait foi.
    */
    const { brouillons, saisir } = useSaisieDifferee(
        (champ, valeur) => remoteUpdateCharacterSheetData(playerId, character.id, { sheetData: { [champ]: valeur } }),
        character.sheetData,
    );
    const valeursBrutes: Record<string, unknown> = { ...(character.sheetData ?? {}), ...brouillons };
    const valeursVues = estUneFicheDeVoyageur(template) ? lireFicheDeVoyageur(template, valeursBrutes).valeurs : valeursBrutes;
    /* Les champs calculés (le degré du Ka dominant) et les plafonds lus sur un autre champ (la Stase). */
    const { evaluateFormula } = useSheetCalculator(character, template, valeursVues as PlayerCharacter['sheetData']);
    const champsDuGabarit = template.sections.flatMap(sec => sec.fields);

    const hubOptions = character.hubOptions ?? { showHP: true, showMP: true, showAP: true, showInventory: true, showRelations: true };

    /**
     * **La fiche du jeu, sur la tablette du joueur.**
     *
     * C'est ici qu'elle sert le plus : la fiche HTML n'est pas un outil de
     * meneur, c'est un objet d'immersion. Le joueur regarde SA fiche, avec le
     * fond de page du jeu, pas un formulaire.
     *
     * `liaison="locale"` parce que la bibliothèque du moteur vit **par appareil** :
     * les fiches du meneur n'existent pas sur cette tablette. Celle-ci en sème
     * une, semée depuis ce que GM-OS sait du PJ. *La vérité reste celle de GM-OS,
     * la tablette la redessine* — et ce que le joueur y écrit remonte au meneur.
     */
    const correspondance = useCorrespondanceDuJeu(character);
    const [onglet, setOnglet] = useState<OngletDuJoueur>('synthese');
    const [ficheDejaOuverte, setFicheDejaOuverte] = useState(false);

    /**
     * **La fiche du groupe, sur la tablette** — la Cabale de NOC, commune à
     * toute la table (2026-10-13). Celle de la campagne du personnage, dans le
     * jeu de cette campagne : le groupe n'appartient à aucun joueur, chacun le
     * voit et le remplit. Même hôte, même liaison locale que la fiche du PJ.
     */
    const campagneDeLaTable = campagneDuGroupe(character, campaigns, campaignId);
    const piloteDeLaTable = campagneDeLaTable
        ? tousLesPilotes(customGameDrivers).find(d => d.id === campagneDeLaTable.system)
        : undefined;
    const correspondanceDuGroupe = useCorrespondanceDuGroupe(campagneDeLaTable, piloteDeLaTable);
    const ficheDeGroupe = piloteDeLaTable?.ficheDeGroupe;
    const [groupeDejaOuvert, setGroupeDejaOuvert] = useState(false);
    const remoteEcrireLeGroupe = useSessionOSStore(s => s.remoteEcrireLeGroupe);
    const nomDeLaCabale = ficheDeGroupe
        ? nomDuGroupe(campagneDeLaTable?.groupe, correspondanceDuGroupe, ficheDeGroupe.libelle)
        : '';

    const appliquerLeRapprochement = (releve: Rapprochement) => {
        remoteUpdateCharacterSheetData(playerId, character.id, {
            sheetData: releve.aEcrire,
            ...(releve.narratifAEcrire ?? {}),
            ...(releve.inventoryItems ? { inventoryItems: releve.inventoryItems } : {}),
        });
    };

    const handleUpdateHP = (delta: number) => {
        // Sans jauge, il n'y a rien à ajuster : `pointsDeVieApres` rend `null`
        // plutôt que de créer des points de vie que le système n'a pas.
        const newHP = pointsDeVieApres(character, delta);
        if (newHP !== null && newHP !== character.hp) {
            remoteUpdateCharacterVitals(playerId, character.id, { hp: newHP });
        }
    };

    /*
      **Les onglets de la tablette** — David, 2026-10-22 : le test quitte la vue
      synthétique pour son onglet, avec tout ce qui lance (les Sauvegardes de
      Cthulhu Hack comprises) et les mécaniques du Voyageur de Rêve de Dragon. La vue synthétique reste l'onglet d'arrivée.
    */
    const jetDuJoueur = !!pilote?.jet && !estUneSauvegarde(decrireLeJetDuPilote(pilote))
        && (!estUneFicheDeVoyageur(template) || character.sheetData?.[CLE_REPRISE] === 1);
    const jetsDemandes = lireLesJetsDeLaFiche(pilote, template, character.sheetData ?? {});
    const voyageurRepris = estUneFicheDeVoyageur(template) && character.sheetData?.[CLE_REPRISE] === 1;
    const testDisponible = jetDuJoueur || voyageurRepris || jetsDemandes.sauvegardes.length > 0 || jetsDemandes.ressources.length > 0;
    const groupeDisponible = !!ficheDeGroupe && !!campagneDeLaTable;
    const onglets = [
        { id: 'synthese' as const, libelle: 'Vue synthétique', icone: <Layout size={13} /> },
        ...(testDisponible ? [{ id: 'test' as const, libelle: 'Lancer un test', icone: <Dices size={13} /> }] : []),
        ...(correspondance ? [{ id: 'fiche' as const, libelle: 'Ma fiche', icone: <FileText size={13} /> }] : []),
        ...(groupeDisponible ? [{ id: 'groupe' as const, libelle: ficheDeGroupe!.libelle, icone: <Users2 size={13} /> }] : []),
    ];
    const ongletVu: OngletDuJoueur = onglets.some(o => o.id === onglet) ? onglet : 'synthese';
    const choisirLOnglet = (choix: OngletDuJoueur) => {
        setOnglet(choix);
        if (choix === 'fiche') setFicheDejaOuverte(true);
        if (choix === 'groupe') setGroupeDejaOuvert(true);
    };

    const saveNarrative = () => {
        remoteUpdateCharacterNarrative(playerId, character.id, { 
            description: localDescription,
            playerNotes: localPlayerNotes,
            inventory: localInventory
        });
    };

    return (
        <div className="fixed inset-0 z-[150] bg-app-bg/95 backdrop-blur-3xl p-4 md:p-8 flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gm-cyan to-transparent opacity-50" />

            {/* Header */}
            <EnTeteDeModule habillage="libre" className="flex flex-wrap items-start justify-between gap-3 mb-4 flex-shrink-0">
                <Bouton habillage="libre" cibleTactile
                    onClick={onClose}
                    title="Fermer la fiche"
                    className="flex items-center gap-2 px-4 py-2 bg-app-surface/40 border border-app-border rounded-2xl text-ui-10 font-black text-app-text/40 uppercase tracking-widest hover:text-app-text hover:bg-app-surface/60 transition-all group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour
                </Bouton>

                <div className="min-w-0 text-right">
                    <h2 className="text-[24px] font-bold text-app-text leading-tight mb-1 break-words">{character.name}</h2>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        <Etiquette habillage="libre" ton="accent" className="px-2 py-0.5 bg-accent/10 border border-accent/30 rounded text-ui-9 font-black text-accent uppercase tracking-widest flex items-center gap-1.5 shadow-glow-accent/5">
                            <Shield size={10} />
                            SYSTÈME : {template.name}
                        </Etiquette>
                        <div className="w-1 h-1 rounded-full bg-app-text/20" />
                        <span className="text-ui-10 font-bold text-app-text/40 uppercase tracking-widest">{character.classRace || 'Agent Nexus'}</span>
                    </div>
                </div>
            </EnTeteDeModule>

            {onglets.length > 1 && (
                <OngletsDeLaFiche
                    onglets={onglets}
                    actif={ongletVu}
                    onChoisir={choisirLOnglet}
                    idDuPanneau="fiche-joueur"
                    className="mb-4 flex-shrink-0 flex-wrap [&>button]:min-h-[44px] [&>button]:flex-1 [&>button]:justify-center [&>button]:px-3 [&>button]:tracking-wider"
                />
            )}

            {/*
                **Les réserves communes, sous les yeux des joueurs.**

                Demandé par David le 2026-08-15 : *« permet juste aux joueurs
                d'avoir une vue sur l'Impulsion et de la gérer »*. Chez Dune,
                l'Impulsion est une réserve **commune aux joueurs** qui se
                dépense par décision collective — une réserve partagée que le
                groupe ne voit pas n'est pas partagée.

                Le composant est celui du meneur, en mode joueur : une réserve
                doit se dessiner au même endroit pour tout le monde, sans quoi
                les deux écrans finiraient par afficher deux vérités.
            */}
            {campaignId && (pilote?.ressourcesDeTable?.length ?? 0) > 0 && (
                <Panneau as="div" habillage="libre" className="flex-shrink-0 mb-4 rounded-2xl border border-app-border/20 overflow-hidden">
                    <PanneauDesRessources
                        campaignId={campaignId}
                        ressources={ressourcesDeLaTable(pilote, campagneDeLaTable)}
                        pourLesJoueurs
                    />
                </Panneau>
            )}

            {/*
                Montée à la première bascule puis gardée montée et masquée :
                l'iframe charge sept mégaoctets de fonds de page.
            */}
            {ficheDejaOuverte && (
                <div id="fiche-joueur-fiche" role="tabpanel" aria-labelledby="fiche-joueur-onglet-fiche"
                    className={`flex-1 overflow-hidden pb-4 ${ongletVu === 'fiche' ? '' : 'hidden'}`}>
                    <FicheHote
                        personnage={{
                            id: character.id,
                            name: character.name,
                            donneesModifieesLe: character.donneesModifieesLe,
                            sheetData: character.sheetData ?? {},
                            narratif: {
                                description: character.description ?? '',
                                playerNotes: character.playerNotes ?? '',
                                inventory: character.inventory ?? '',
                            },
                            inventoryItems: character.inventoryItems,
                        }}
                        table={correspondance}
                        liaison="locale"
                        onFicheLiee={() => { /* la fiche est locale à l'appareil : rien à ranger sur le PJ */ }}
                        onRapprochement={appliquerLeRapprochement}
                    />
                </div>
            )}

            {/*
                La Cabale : montée à la première bascule, gardée montée et
                masquée, comme la fiche du PJ. Ce que le joueur y écrit part au
                meneur par `remoteEcrireLeGroupe`.
            */}
            {groupeDejaOuvert && ficheDeGroupe && campagneDeLaTable && (
                <div id="fiche-joueur-groupe" role="tabpanel" aria-labelledby="fiche-joueur-onglet-groupe"
                    className={`flex-1 overflow-hidden pb-4 ${ongletVu === 'groupe' ? '' : 'hidden'}`}>
                    <FicheHote
                        personnage={groupePourLHote(campagneDeLaTable, campagneDeLaTable.groupe, nomDeLaCabale)}
                        table={correspondanceDuGroupe}
                        liaison="locale"
                        onFicheLiee={() => { /* locale à l'appareil : rien à ranger sur la campagne */ }}
                        onRapprochement={(releve: Rapprochement) =>
                            remoteEcrireLeGroupe(campagneDeLaTable.id, character.id, releve.aEcrire)}
                    />
                </div>
            )}

            {testDisponible && (
                <div id="fiche-joueur-test" role="tabpanel" aria-labelledby="fiche-joueur-onglet-test"
                    className={`flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12 ${ongletVu === 'test' ? '' : 'hidden'}`}>
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/*
                            **Lancer depuis sa propre fiche**, à côté des
                            valeurs qui composent le seuil. Chez Dune il vaut
                            une compétence plus un principe : le joueur seul
                            sait lequel il invoque, et jusqu'ici il devait tout
                            dicter au meneur pour qu'il lance à sa place.

                            Le panneau est celui de l'écran du meneur, sans
                            adaptation : mêmes dés, même seuil, même débit sur
                            la réserve commune. *Un jet qui change de règle
                            selon l'écran d'où on le lance n'est pas le même
                            jet.*

                            Il ne s'affiche que si le pilote décrit ses jets —
                            un système sans descripteur garde sa fiche telle
                            quelle, plutôt qu'un bouton qui lancerait n'importe
                            quoi.
                        */}
                        {/*
                            **Sauvegardes et ressources, lancées par le meneur**
                            (Cthulhu Hack, 2026-09-30). La tablette dit quoi ;
                            le meneur lit la fiche et lance — voir `JetsDeLaFiche`.
                        */}
                        <JetsDeLaFiche
                            playerId={playerId}
                            characterId={character.id}
                            sheetData={character.sheetData ?? {}}
                            pilote={pilote}
                            gabarit={template}
                        />

                        {/*
                            ⚠️ **Pour un jeu à Sauvegarde, ce panneau s'efface
                            devant le précédent.** Il lance CHEZ LE JOUEUR, et
                            son jet n'atteint pas le meneur : deux façons de
                            lancer la même Sauvegarde, dont une invisible pour
                            la table, ce serait pire qu'une seule.
                        */}
                        {jetDuJoueur && pilote?.jet && (
                            <PanneauDeJet
                                descripteur={pilote.jet}
                                dice={pilote.dice}
                                template={template}
                                valeurs={valeursVues}
                                campaignId={campaignId ?? undefined}
                                ressourcesDeTable={ressourcesDeLaTable(pilote, campagneDeLaTable)}
                                // La réserve dépensée remonte au meneur, comme ce que la fiche HTML impose.
                                ecrireSurLaFiche={maj => remoteUpdateCharacterSheetData(playerId, character.id, { sheetData: maj })}
                                pourLesJoueurs
                                personnageId={character.id}
                            />
                        )}

                        {/*
                            **Les mécaniques du Voyageur, avec le test** (David,
                            2026-10-22) : elles quittent la vue synthétique, comme
                            chez le meneur. Ce qui se valide chez lui reste en lecture.
                        */}
                        {voyageurRepris && <>
                            <CarteDuJeu id="fatigue-voyageur" titre="Fatigue et état général">
                                <PanneauFatigueVoyageur key={`fatigue-${character.id}`} donnees={valeursVues}
                                    appliquer={maj => remoteUpdateCharacterSheetData(playerId, character.id, {sheetData: maj})} />
                            </CarteDuJeu>
                            <CarteDuJeu id="sante-voyageur" titre="Encaissement et blessures">
                                <PanneauSanteVoyageur key={`sante-${character.id}`} donnees={valeursVues}
                                    appliquer={maj => remoteUpdateCharacterSheetData(playerId,character.id,{sheetData:maj})} />
                            </CarteDuJeu>
                            <CarteDuJeu id="progression-voyageur" titre="Stress, expérience et Archétype">
                                <PanneauProgressionVoyageur fiche={template} donnees={valeursVues} lectureSeule appliquer={() => { /* Validation MJ. */ }} />
                            </CarteDuJeu>
                            <CarteDuJeu id="recours-voyageur" titre="Chance, destinée et moral">
                                <PanneauRecoursVoyageur donnees={valeursVues} lectureSeule appliquer={() => { /* Validation MJ. */ }} />
                            </CarteDuJeu>
                            <CarteDuJeu id="astrologie-voyageur" titre="Astrologie et heures draconiques">
                                <PanneauAstrologieVoyageur campagneId={campaignId} personnageId={character.id} donnees={valeursVues} lectureSeule />
                            </CarteDuJeu>
                            <CarteDuJeu id="taches-voyageur" titre="Ouvrages et points de tâche">
                                <PanneauTachesVoyageur key={`taches-${character.id}`} nom={character.name} donnees={valeursVues}
                                    appliquer={maj => remoteUpdateCharacterSheetData(playerId,character.id,{sheetData:maj})} />
                            </CarteDuJeu>
                            <CarteDuJeu id="repos-voyageur" titre="Repos et Château Dormant">
                                <PanneauReposVoyageur key={`repos-${character.id}`} donnees={valeursVues} lectureSeule appliquer={() => { /* Validation du repos réservée au MJ. */ }} />
                            </CarteDuJeu>
                        </>}
                    </div>
                </div>
            )}

            <div id="fiche-joueur-synthese" role="tabpanel" aria-labelledby="fiche-joueur-onglet-synthese"
                className={`flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12 ${ongletVu === 'synthese' ? '' : 'hidden'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
                    
                    {/* Portrait & Vitals */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="relative mx-auto aspect-[3/4] w-full max-w-[180px] lg:max-w-none rounded-[2.5rem] overflow-hidden border border-app-border/20 shadow-2xl bg-app-surface">
                            {character.portraitUrl ? (
                                <ResolvedImage src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-app-text/10">
                                    <Shield size={80} />
                                </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-app-bg to-transparent opacity-80" />
                        </div>

                        {/*
                          **L'état de santé, quel que soit le modèle du jeu.**

                          Ce bloc ne s'affichait que pour le modèle `hp` : un
                          joueur de Dune, dont la défaite est une tâche étendue,
                          ne voyait **rien** — ni son seuil, ni où il en était.
                          La condition avait été posée pour ne plus afficher
                          « undefined / undefined », ce qui était juste, mais on
                          s'était arrêté à faire disparaître le faux sans mettre
                          le vrai à la place.

                          Les cinq modèles se dessinent dans `EtatDeSante`, et
                          les boutons de points de vie n'apparaissent que là où
                          des points existent.
                        */}
                        {hubOptions.showHP && (
                            <EtatDeSante
                                porteur={character}
                                onAjusterPV={handleUpdateHP}
                                libelle={pilote?.combat?.tacheDeDefaite?.label}
                            />
                        )}
                    </div>

                    {/* Stats & Notes */}
                    <div className="lg:col-span-8 space-y-8">
                        {estUneFicheDeVoyageur(template) && (
                            <PanneauRepriseVoyageur key={character.id} fiche={template} donnees={character.sheetData ?? {}}
                                vieCombat={character.hp} maxVieCombat={character.maxHp}
                                appliquer={donnees => remoteUpdateCharacterSheetData(playerId, character.id, { sheetData: donnees })} />
                        )}
                        {template.sections.map((section: SheetSection) => (
                            <section key={section.id} className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xs font-black text-accent uppercase tracking-[0.2em]">{section.label}</h3>
                                    <div className="h-[1px] w-full bg-gradient-to-r from-accent/20 to-transparent" />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {section.fields.map((field: SheetField) => {
                                        const value = valeursVues[field.id] ?? field.defaultValue;
                                        if (field.type === 'text' && field.referentiel) return (
                                            <div key={field.id} className="col-span-2 md:col-span-3">
                                                <ChampDuReferentiel field={field} value={String(value ?? '')}
                                                    onChange={v => saisir(field.id, v)} pilote={pilote}
                                                    valeurs={valeursVues} champsDeLaFiche={champsDuGabarit} />
                                            </div>
                                        );
                                        const plafond = plafondDuChamp(field, champsDuGabarit, id => valeursVues[id], f => evaluateFormula(f));
                                        const affiche = field.type === 'formula' ? evaluateFormula(field.formula || '') : value;
                                        return (
                                            <Panneau as="div" habillage="libre" key={field.id} className="p-4 bg-app-surface/40 border border-app-border/10 rounded-2xl">
                                                <span className="text-ui-9 font-black text-app-text/30 uppercase tracking-widest">{field.label}</span>
                                                {field.type === 'gauge' ? (
                                                    <div className="space-y-2 mt-1">
                                                        <span className="text-lg font-black text-app-text font-mono">{String(value)}</span>
                                                        <div className="h-1 bg-app-bg/40 rounded-full overflow-hidden">
                                                            <div className="h-full bg-accent" style={{ '--gauge-width': `${(Number(value) / 100) * 100}%`, width: 'var(--gauge-width)' } as React.CSSProperties} />
                                                        </div>
                                                    </div>
                                                ) : field.type === 'checkbox' ? (
                                                    <span className={`text-sm font-black uppercase mt-1 block ${value ? 'text-etat-succes' : 'text-app-text/10'}`}>
                                                        {value ? 'OUI' : 'NON'}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm font-black text-app-text block mt-1 truncate">
                                                        {String(affiche)}
                                                        {plafond !== undefined && <span className={`ml-1 font-mono text-ui-10 ${Number(affiche) > plafond ? 'text-etat-danger' : 'text-app-text/40'}`}>/ {plafond}</span>}
                                                    </span>
                                                )}
                                            </Panneau>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-app-border/10">
                            <section className="space-y-4">
                                <h3 className="text-xs font-black text-gm-violet uppercase tracking-widest flex items-center gap-2">
                                    <BookOpen size={14} /> Description
                                </h3>
                                <textarea 
                                    className="w-full bg-app-bg/40 border border-app-border/10 rounded-2xl p-4 text-sm text-app-text/80 focus:border-gm-violet/40 outline-none min-h-[140px] resize-none"
                                    value={localDescription}
                                    onChange={(e) => setLocalDescription(e.target.value)}
                                    onBlur={saveNarrative}
                                    placeholder="Éditer la description publique..."
                                    title="Description du personnage"
                                />
                            </section>
 
                            <section className="space-y-4">
                                <h3 className="text-xs font-black text-gm-gold uppercase tracking-widest flex items-center gap-2">
                                    <PenTool size={14} /> Notes Perso
                                </h3>
                                <textarea 
                                    className="w-full bg-app-bg/40 border border-app-border/10 rounded-2xl p-4 text-sm text-gm-gold/80 focus:border-gm-gold/40 outline-none min-h-[140px] resize-none font-mono"
                                    value={localPlayerNotes}
                                    onChange={(e) => setLocalPlayerNotes(e.target.value)}
                                    onBlur={saveNarrative}
                                    placeholder="Vos notes personnelles..."
                                    title="Notes du joueur"
                                />
                            </section>
                        </div>

                        {hubOptions.showInventory && (
                            <section className="space-y-4 pt-8">
                                <h3 className="text-xs font-black text-app-text/60 uppercase tracking-widest flex items-center gap-2">
                                    <Package size={14} /> Inventaire
                                </h3>
                                <textarea 
                                    className="w-full bg-app-surface/20 border border-app-border/10 rounded-[2rem] p-6 text-sm text-app-text/60 italic font-mono focus:border-accent/40 outline-none min-h-[160px] resize-none"
                                    value={localInventory}
                                    onChange={(e) => setLocalInventory(e.target.value)}
                                    onBlur={saveNarrative}
                                    placeholder="Éditer l'inventaire..."
                                    title="Inventaire du personnage"
                                />
                            </section>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-6 flex items-center justify-between border-t border-app-border/10">
                <div className="flex items-center gap-3 opacity-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-etat-succes animate-pulse" />
                    <span className="text-ui-10 font-black uppercase tracking-[0.3em] text-app-text">Liaison Active</span>
                </div>
                <Layout size={12} className="text-app-text/10" />
            </div>
        </div>
    );
};

export default memo(HubCharacterSheet);
