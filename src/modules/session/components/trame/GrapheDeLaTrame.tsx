import React from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
    Lock, Unlock, RotateCcw, Pin, PinOff, ExternalLink, Network, AlertTriangle, Info,
    Link2, Unlink, Trash2, Play, Square, Columns3,
} from 'lucide-react';
import { useSessionOSStore } from '../../useSessionOSStore';
import { useStoryboardStore } from '../../../storyboard/useStoryboardStore';
import { gmConfirm } from '../../../../stores/useModalStore';
import { gmToast } from '../../../../stores/useToastStore';
import { placerLeNoeud } from '../../logic/socialNexusUtils';
import { scenesEmportees, etatDeLaScene } from '../../logic/trame';
import {
    grapheDeLaTrame, constatsDeLaTrame, typesDuNiveau, NIVEAUX, NIVEAU_MAXIMUM,
    COULEUR_DU_TYPE, LIBELLE_DU_TYPE, renvoiEcrit, coupleDeRenvoi, coupleDEnchainement, idDuNoeud,
    type NoeudDeTrame, type LienDeTrame, type PorteeDeLIntrigue, type TypeDeNoeud,
} from '../../logic/grapheDeLaTrame';
import {
    sortiesDeLaScene, entreesDeLaScene, libelleLisible, LIBELLE_MAXIMUM,
} from '../../logic/enchainementsDeLaTrame';
import ChoixDuRang from './ChoixDuRang';
import { rangerEnColonnes } from '../../logic/rangementDeLaTrame';

/**
 * **La trame vue d'ensemble** — demandé par David le 2026-09-22.
 *
 * Le pendant du Nexus social, sur l'autre moitié de la campagne : là où le Nexus
 * montre *qui connaît qui*, celui-ci montre *ce qui mène à quoi*. Il ne saisit
 * rien — il dessine des liens déjà écrits dans `Scene`.
 *
 * ⭐ **Ce qu'il apporte et qu'aucune liste ne peut donner** : un indice que plus
 * aucune scène ne livre, un PNJ qu'aucune scène ne convoque, un acte vide, un
 * renvoi vers un lieu supprimé. Une liste montre ce qui *est* ; un graphe montre
 * ce qui *manque*.
 *
 * ⚠️ **Il n'écrit qu'une chose : où les nœuds se trouvent.** Sur ses propres
 * champs de campagne — voir `Campaign.positionsDeLaTrame` : le Nexus social
 * montre les mêmes PNJ, et partager les positions aurait fait bouger l'un quand
 * on range l'autre.
 */

/**
 * Où chaque nœud se trouvait la dernière fois qu'on l'a vu.
 *
 * Même remède qu'au Nexus, et pour le même défaut : *un nœud rendu à d3 sans
 * coordonnées est reposé sur une spirale, d'où qu'il vînt.* Hors de React à
 * dessein — c'est un cache, rien ne doit se redessiner quand il change.
 */
const POSITIONS_VIVANTES = new Map<string, { x: number; y: number }>();

/**
 * L'épaisseur du trait selon ce que le lien raconte.
 *
 * ⭐ **La hiérarchie a changé le 2026-09-22, et c'est l'arrivée des
 * enchaînements qui l'a imposé.** Le trait appuyé revient à ce que **le meneur a
 * déclaré** ; l'ordre, qui n'est que le rangement de son document, passe au
 * second plan. *Deux traits de même force auraient dit que les deux répondent à
 * la même question — or c'est précisément ce qu'il fallait éviter.*
 */
const LIENS: Record<string, { couleur: string; largeur: number }> = {
    /* L'appartenance est une évidence structurelle : elle doit se deviner. */
    appartenance: { couleur: 'rgba(203,213,225,.18)', largeur: 1 },
    /* L'ordre : un fil ténu, et seulement là où le meneur n'a rien dit. */
    suite: { couleur: 'rgba(148,163,184,.35)', largeur: 1.2 },
    /* Ce qu'il a déclaré : c'est ça, l'histoire. */
    enchainement: { couleur: 'rgba(56,189,248,.8)', largeur: 2.6 },
};

const RAYONS: Record<TypeDeNoeud, number> = {
    acte: 9, scene: 6, lieu: 5, pnj: 4.5, indice: 4.5, pj: 5, ambiance: 4,
};

const GrapheDeLaTrame: React.FC<{ onOuvrirLaFiche: (type: TypeDeNoeud, refId: string) => void }> = ({
    onOuvrirLaFiche,
}) => {
    /*
      ⭐ **Les actions d'écriture sont CELLES DE LA FICHE, sans exception.** C'est
      la condition qui rendait l'édition acceptable ici : le graphe n'a pas sa
      propre logique de trame, il appelle `modifierScene` exactement comme les
      cases à cocher de `TrameDashboard`. *Il n'y a donc pas un sixième écrivain
      de la trame — il y en a un, avec une seconde porte.*
    */
    const {
        actes, scenes, atlasMaps, entities, clues, players, campaigns, activeCampaignId, sessions,
        figerLeGrapheDeTrame, libererLeGrapheDeTrame, reinitialiserLeGrapheDeTrame, rangerLeGrapheDeTrame,
        epinglerDansLaTrame, detacherDeLaTrame, navigateToNpcDetail,
        modifierScene, modifierActe, supprimerScene, supprimerActe,
        ouvrirLaScene, terminerLaScene, placerLaSceneApres, rattacherSceneAUnActe,
        ajouterUnEnchainement, retirerUnEnchainement, libellerUnEnchainement,
    } = useSessionOSStore();
    const moments = useStoryboardStore(s => s.moments);

    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const fige = !!campagne?.trameFigee;

    /* Deux crans par défaut : la trame seule est une chaîne, et l'on vient ici
       pour voir une toile. Lieux et PNJ suffisent à la faire apparaître. */
    const [niveau, setNiveau] = React.useState(2);
    const [portee, setPortee] = React.useState<PorteeDeLIntrigue>('tout');
    const [masquerTerminees, setMasquerTerminees] = React.useState(false);
    const [choisi, setChoisi] = React.useState<string | null>(null);
    /** Les nœuds qu'un constat désigne. Tout le reste s'estompe. */
    const [surlignes, setSurlignes] = React.useState<Set<string>>(new Set());

    /*
      ⛔ **Pourquoi un MODE et pas un simple glisser.** Glisser un nœud veut déjà
      dire « le déplacer et l'épingler ». Faire porter les deux sens au même
      geste est la confusion classique des éditeurs de graphe : *on croit ranger,
      on relie.* Le mode se voit, s'annonce, et se quitte d'un clic.
    */
    const [liaison, setLiaison] = React.useState(false);
    const [depart, setDepart] = React.useState<string | null>(null);
    const graphe2d = React.useRef<{
        screen2GraphCoords?: (x: number, y: number) => { x: number; y: number };
        zoomToFit?: (duree?: number, marge?: number) => void;
    } | null>(null);
    /** Cadrer la toile quand la simulation se pose, après un rangement. */
    const cadrerApresRangement = React.useRef(false);
    /* Le fil élastique. Dans une référence : il change à chaque pixel, et l'écrire
       dans l'état ferait un rendu React par mouvement de souris. */
    const fil = React.useRef<{ x: number; y: number } | null>(null);
    const [battement, setBattement] = React.useState(0);

    const conteneur = React.useRef<HTMLDivElement>(null);
    const [taille, setTaille] = React.useState({ largeur: 0, hauteur: 0 });

    React.useEffect(() => {
        if (!conteneur.current) return;
        const observateur = new ResizeObserver(entrees => {
            for (const entree of entrees) {
                setTaille({ largeur: entree.contentRect.width, hauteur: entree.contentRect.height });
            }
        });
        observateur.observe(conteneur.current);
        return () => observateur.disconnect();
    }, []);

    const source = React.useMemo(() => ({
        actes, scenes, atlasMaps, entities, clues, moments,
        personnages: players.flatMap(p => p.characters ?? []),
    }), [actes, scenes, atlasMaps, entities, clues, moments, players]);

    const placer = React.useCallback((id: string) => placerLeNoeud(id, {
        positionDe: (cle) => POSITIONS_VIVANTES.get(cle),
        epingles: campagne?.noeudsEpinglesDeLaTrame,
        verrouille: fige,
    }), [campagne?.noeudsEpinglesDeLaTrame, fige]);

    const graphe = React.useMemo(
        () => grapheDeLaTrame(activeCampaignId, source, {
            niveau, portee, masquerLesScenesTerminees: masquerTerminees, placer,
        }),
        [activeCampaignId, source, niveau, portee, masquerTerminees, placer],
    );

    /* ⛔ Les constats se calculent sur la trame ENTIÈRE, pas sur la vue : un
       constat qui disparaît quand on masque les scènes terminées ferait croire
       qu'un défaut se répare quand on détourne le regard. */
    const constats = React.useMemo(
        () => constatsDeLaTrame(activeCampaignId, source), [activeCampaignId, source]);

    const donnees = React.useMemo(
        () => ({ nodes: graphe.noeuds, links: graphe.liens }), [graphe]);

    const noeudChoisi = graphe.noeuds.find(n => n.id === choisi) ?? null;
    /* Les objets derrière le nœud : le panneau écrit dessus, pas sur le dessin. */
    const sceneChoisie = noeudChoisi?.type === 'scene'
        ? scenes.find(sc => sc.id === noeudChoisi.refId) ?? null : null;
    const acteChoisi = noeudChoisi?.type === 'acte'
        ? actes.find(a => a.id === noeudChoisi.refId) ?? null : null;
    /* Pour que les passages ouverts d’ici portent le nom de la soirée — même
       règle que la fiche : on ouvre quand même sans séance, mais le journal ne
       saura pas à quelle soirée le rattacher. */
    const seanceActive = sessions.find(se => se.campaignId === activeCampaignId && se.status === 'active');
    /* Les sorties déclarées et leurs sources. Les cibles disparues ne sont pas
       rendues : elles vont au constat, qui est l'endroit pour le dire. */
    const sorties = sceneChoisie ? sortiesDeLaScene(scenes, sceneChoisie) : [];
    const entrees = sceneChoisie ? entreesDeLaScene(scenes, sceneChoisie.id) : [];

    /** Ce que la simulation a produit, pour que le prochain calcul en parte. */
    const releverLesPositions = React.useCallback(() => {
        for (const noeud of graphe.noeuds) {
            if (noeud.x !== undefined && noeud.y !== undefined) {
                POSITIONS_VIVANTES.set(noeud.id, { x: noeud.x, y: noeud.y });
            }
        }
        if (cadrerApresRangement.current) {
            cadrerApresRangement.current = false;
            graphe2d.current?.zoomToFit?.(600, 40);
        }
    }, [graphe.noeuds]);

    /**
     * **Ranger en colonnes** — demandé par David le 2026-09-25 : *« le graphe de
     * la trame est illisible et très difficile à ranger correctement »*.
     *
     * ⚠️ **Sur la trame ENTIÈRE, pas sur la vue.** Ranger au niveau « Trame »
     * puis monter aux PNJ ne doit pas laisser les scènes masquées par un filtre
     * flotter sans place : toutes reçoivent la leur, même invisibles.
     */
    const ranger = () => {
        if (!activeCampaignId) return;
        const complet = grapheDeLaTrame(activeCampaignId, source, { niveau: NIVEAU_MAXIMUM, portee: 'tout' });
        const { epingles } = rangerEnColonnes(complet);
        const appliquer = () => {
            POSITIONS_VIVANTES.clear();
            cadrerApresRangement.current = true;
            rangerLeGrapheDeTrame(activeCampaignId, epingles);
        };
        const dejaArrange = fige || Object.keys(campagne?.noeudsEpinglesDeLaTrame ?? {}).length > 0;
        if (dejaArrange) {
            gmConfirm('Ranger la trame en colonnes ? Les positions que tu as épinglées seront remplacées.', appliquer);
        } else {
            appliquer();
        }
    };

    /**
     * **Un acte est-il rangé ?** Lui et toutes ses scènes sont épinglés. C'est ce
     * qui décide de dessiner son cadre, et de taire les traits acte → scène :
     * dans un rangement, *la position dit l'appartenance* — les traits ne
     * feraient qu'un éventail de plus sur le bloc.
     */
    const scenesDesActes = React.useMemo(() => {
        const parActe = new Map<string, NoeudDeTrame[]>();
        for (const lien of graphe.liens) {
            if (lien.nature !== 'appartenance') continue;
            const acte = typeof lien.source === 'string' ? lien.source : (lien.source as NoeudDeTrame).id;
            const cible = typeof lien.target === 'string' ? lien.target : (lien.target as NoeudDeTrame).id;
            const scene = graphe.noeuds.find(n => n.id === cible);
            if (scene) parActe.set(acte, [...(parActe.get(acte) ?? []), scene]);
        }
        return parActe;
    }, [graphe]);

    const acteRange = React.useCallback((acteId: string) => {
        const acte = graphe.noeuds.find(n => n.id === acteId);
        const sesScenes = scenesDesActes.get(acteId) ?? [];
        return acte?.fx !== undefined && sesScenes.length > 0 && sesScenes.every(sc => sc.fx !== undefined);
    }, [graphe.noeuds, scenesDesActes]);

    const noeudParId = React.useCallback(
        (id: string | null) => (id ? graphe.noeuds.find(n => n.id === id) ?? null : null),
        [graphe.noeuds]);

    /**
     * Le nœud à ce point **du graphe**, ou rien.
     *
     * ⚠️ *Le plus proche dans son propre rayon, et jamais « le plus proche » tout
     * court* : un relâchement dans le vide ne doit relier personne, et un nœud
     * situé à l'autre bout de la toile est le plus proche de quelque chose.
     */
    const noeudAuPoint = React.useCallback((
        x: number, y: number, sauf?: string,
    ): NoeudDeTrame | null => {
        let trouve: NoeudDeTrame | null = null;
        let meilleure = Infinity;
        for (const noeud of graphe.noeuds) {
            if (noeud.id === sauf) continue;
            const distance = Math.hypot((noeud.x ?? 0) - x, (noeud.y ?? 0) - y);
            if (distance <= RAYONS[noeud.type] + 4 && distance < meilleure) {
                meilleure = distance;
                trouve = noeud;
            }
        }
        return trouve;
    }, [graphe.noeuds]);

    /** Le même, depuis un point de l'écran. */
    const noeudSous = React.useCallback((clientX: number, clientY: number): NoeudDeTrame | null => {
        const cadre = conteneur.current?.getBoundingClientRect();
        const versGraphe = graphe2d.current?.screen2GraphCoords;
        if (!cadre || !versGraphe) return null;
        const point = versGraphe(clientX - cadre.left, clientY - cadre.top);
        return noeudAuPoint(point.x, point.y);
    }, [noeudAuPoint]);

    /**
     * Relier ou délier une scène et un nœud annexe.
     *
     * ⭐ Tout le calcul est dans `renvoiEcrit`, et l'écriture passe par
     * `modifierScene` — celle de la fiche. *Le graphe ne sait pas quel champ
     * porte un PNJ ; il sait à qui le demander.*
     */
    const brancher = React.useCallback((
        a: NoeudDeTrame, b: NoeudDeTrame, relier: boolean,
    ) => {
        /*
          ⭐ **Deux scènes : c'est un enchaînement, et le SENS du geste compte.**
          Demandé par David le 2026-09-22 : *« pouvoir dire qu'une scène A mène
          vers une scène B ou une scène C ».* On part du départ, on relâche sur
          l'arrivée — contrairement aux renvois, où les deux sens se valent.
        */
        const branche = coupleDEnchainement(a, b);
        if (branche) {
            if (relier) {
                ajouterUnEnchainement(branche.deId, branche.versId);
                gmToast('Enchaînement créé. Sa condition se tape dans le panneau.', 'success');
            } else {
                retirerUnEnchainement(branche.deId, branche.versId);
                gmToast('Enchaînement retiré.', 'success');
            }
            return;
        }

        const couple = coupleDeRenvoi(a, b);
        if (!couple) {
            /* Refuser en apprenant l'autre geste : un refus muet laisserait croire
               que le mode liaison ne marche pas. */
            const structure = a.type === 'acte' || b.type === 'acte';
            gmToast(structure
                ? 'Un acte ne se relie pas : glisse la scène sur l’acte, hors mode liaison.'
                : 'Un lien part d’une scène et va vers une autre scène, un lieu, un PNJ, un indice, un personnage ou une ambiance.',
                'info');
            return;
        }
        const scene = scenes.find(sc => sc.id === couple.sceneId);
        if (!scene) return;

        const ecrit = renvoiEcrit(scene, couple.type, couple.refId, relier);
        if (!ecrit) return;

        modifierScene(scene.id, ecrit.updates);
        gmToast(
            ecrit.remplace
                ? `${LIBELLE_DU_TYPE[couple.type]} remplacé sur « ${scene.titre} ».`
                : relier ? 'Lien créé.' : 'Lien retiré.',
            ecrit.remplace ? 'info' : 'success');
    }, [scenes, modifierScene, ajouterUnEnchainement, retirerUnEnchainement]);

    /**
     * Le glisser du mode liaison, en trois temps.
     *
     * ⚠️ `enableNodeDrag` est coupé pendant ce mode : sans ça, la bibliothèque
     * déplacerait ET épinglerait le nœud de départ, et **relier réarrangerait la
     * disposition à chaque fois**. *Un geste qui abîme ce qu'on vient de ranger
     * n'est pas utilisable.*
     */
    const auPointeurBas = (e: React.PointerEvent) => {
        if (!liaison) return;
        const noeud = noeudSous(e.clientX, e.clientY);
        if (!noeud) return;
        setDepart(noeud.id);
        fil.current = null;
    };

    const auPointeurBouge = (e: React.PointerEvent) => {
        if (!liaison || !depart) return;
        const cadre = conteneur.current?.getBoundingClientRect();
        const versGraphe = graphe2d.current?.screen2GraphCoords;
        if (!cadre || !versGraphe) return;
        fil.current = versGraphe(e.clientX - cadre.left, e.clientY - cadre.top);
        /* Un battement par image demandée, pas un par pixel : c'est ce qui
           redessine la toile alors que la simulation est refroidie. */
        requestAnimationFrame(() => setBattement(b => b + 1));
    };

    const auPointeurHaut = (e: React.PointerEvent) => {
        if (!liaison || !depart) return;
        const source = noeudParId(depart);
        const cible = noeudSous(e.clientX, e.clientY);
        setDepart(null);
        fil.current = null;
        setBattement(b => b + 1);
        if (!source || !cible || source.id === cible.id) return;
        brancher(source, cible, true);
    };

    /**
     * Glisser une scène SUR un autre nœud réorganise la trame.
     *
     * ⚠️ **La confirmation n'est pas une politesse.** On lâche des nœuds pour
     * ranger, et l'un tombera un jour pile sur un acte : *sans question, un geste
     * de rangement changerait l'acte d'une scène sans le dire.* La cible doit en
     * plus être touchée en plein — son rayon, pas son voisinage.
     */
    const auLacher = React.useCallback((noeud: NoeudDeTrame) => {
        if (noeud.x === undefined || noeud.y === undefined) return;

        const poser = () => {
            noeud.fx = noeud.x;
            noeud.fy = noeud.y;
            POSITIONS_VIVANTES.set(noeud.id, { x: noeud.x as number, y: noeud.y as number });
            if (activeCampaignId) {
                epinglerDansLaTrame(activeCampaignId, noeud.id, { x: noeud.x as number, y: noeud.y as number });
            }
        };
        poser();

        /*
          ⛔ **Et pas la position du pointeur.** `onNodeDragEnd` ne rend qu'un
          nœud et une translation — aucun événement de souris. Vérifié à la
          compilation, et c'est mieux ainsi : *les coordonnées du nœud lâché SONT
          le point de dépôt*, en unités du graphe, sans conversion d'écran qui
          pourrait se tromper d'un facteur de zoom.
        */
        if (noeud.type !== 'scene') return;
        const dessous = noeudAuPoint(noeud.x, noeud.y, noeud.id);
        if (!dessous) return;

        if (dessous.type === 'acte') {
            gmConfirm(
                `Rattacher « ${noeud.nom} » à l’acte « ${dessous.nom} » ? Elle en prendra la dernière place.`,
                () => rattacherSceneAUnActe(noeud.refId, dessous.refId),
            );
            return;
        }
        if (dessous.type === 'scene') {
            gmConfirm(
                `Placer « ${noeud.nom} » juste après « ${dessous.nom} » ?`,
                () => placerLaSceneApres(noeud.refId, dessous.refId),
            );
        }
    }, [activeCampaignId, epinglerDansLaTrame, noeudAuPoint, rattacherSceneAUnActe, placerLaSceneApres]);

    const peindre = React.useCallback((
        noeud: NoeudDeTrame, ctx: CanvasRenderingContext2D, echelle: number,
    ) => {
        const x = noeud.x ?? 0;
        const y = noeud.y ?? 0;
        const rayon = RAYONS[noeud.type];
        const enAvant = surlignes.size === 0 || surlignes.has(noeud.id);
        const estChoisi = noeud.id === choisi;

        ctx.globalAlpha = enAvant ? 1 : 0.12;

        /* Une scène terminée s'estompe, comme elle se barre dans les listes :
           elle reste là, elle n'est plus devant nous. */
        const pale = noeud.type === 'scene' && noeud.etat === 'terminee';
        ctx.fillStyle = COULEUR_DU_TYPE[noeud.type];
        if (pale || noeud.accompli) ctx.globalAlpha *= 0.4;

        /* ⭐ L'optionnelle est en pointillé, la principale a son halo : le même
           langage qu'en liste — plein pour l'épine, pointillé pour ce qu'on
           coupera. Un objet ne change pas d'apparence d'un écran à l'autre. */
        ctx.beginPath();
        ctx.arc(x, y, rayon, 0, 2 * Math.PI);
        if (noeud.importance === 'optionnelle') {
            ctx.setLineDash([2, 2]);
            ctx.strokeStyle = COULEUR_DU_TYPE.scene;
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            ctx.fill();
        }

        if (noeud.importance === 'principale') {
            ctx.beginPath();
            ctx.arc(x, y, rayon + 3, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(56,189,248,.5)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
        }

        /* Une scène en cours est cerclée de vert : c'est l'information qu'on
           cherche d'un coup d'œil quand on ouvre cet écran en jouant. */
        if (noeud.etat === 'en-cours') {
            ctx.beginPath();
            ctx.arc(x, y, rayon + 4.5, 0, 2 * Math.PI);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 1.8;
            ctx.stroke();
        }

        if (estChoisi) {
            ctx.beginPath();
            ctx.arc(x, y, rayon + 7, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255,255,255,.7)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        /* Les étiquettes disparaissent quand on dézoome : cent noms superposés
           ne sont pas cent noms, c'est une tache. */
        if (echelle > 1.1 || noeud.type === 'acte' || estChoisi) {
            const corps = Math.max(2.5, 10 / echelle);
            ctx.font = `${noeud.importance === 'principale' || noeud.type === 'acte' ? '800' : '500'} ${corps}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = pale ? 'rgba(226,232,240,.45)' : '#e2e8f0';
            const nom = noeud.nom.length > 28 ? `${noeud.nom.slice(0, 27)}…` : noeud.nom;
            ctx.fillText(nom, x, y + rayon + 2);
        }

        ctx.globalAlpha = 1;
    }, [choisi, surlignes]);

    const figerOuLiberer = () => {
        if (!activeCampaignId) return;
        if (fige) { libererLeGrapheDeTrame(activeCampaignId); return; }
        const instantane: Record<string, { x: number; y: number }> = {};
        for (const noeud of graphe.noeuds) {
            if (noeud.x !== undefined && noeud.y !== undefined) instantane[noeud.id] = { x: noeud.x, y: noeud.y };
        }
        figerLeGrapheDeTrame(activeCampaignId, instantane);
    };

    /** Un constat désigne ses coupables, et emmène le niveau qui les montre. */
    const suivreLeConstat = (constat: { id: string; noeuds: string[]; niveau: number }) => {
        const dejaLa = surlignes.size > 0 && constat.noeuds.every(n => surlignes.has(n))
            && surlignes.size === constat.noeuds.length;
        if (dejaLa) { setSurlignes(new Set()); return; }
        if (constat.niveau > niveau) setNiveau(constat.niveau);
        setSurlignes(new Set(constat.noeuds));
        setChoisi(null);
    };

    const voisins = React.useMemo(() => {
        if (!noeudChoisi) return [];
        const ids = new Set<string>();
        for (const lien of graphe.liens) {
            const de = typeof lien.source === 'string' ? lien.source : (lien.source as NoeudDeTrame).id;
            const vers = typeof lien.target === 'string' ? lien.target : (lien.target as NoeudDeTrame).id;
            if (de === noeudChoisi.id) ids.add(vers);
            if (vers === noeudChoisi.id) ids.add(de);
        }
        return graphe.noeuds.filter(n => ids.has(n.id));
    }, [noeudChoisi, graphe]);

    if (!activeCampaignId) return null;

    const typesVisibles = typesDuNiveau(niveau);
    const scenesVisibles = graphe.noeuds.filter(n => n.type === 'scene').length;
    /*
      ⛔ **Trouvé par l'essai de bout en bout, le 2026-09-22.** La condition était
      « aucun nœud » — or les actes restent toujours là. Avec « intrigue
      principale seule » sur une campagne que personne n'a classée, l'écran
      rendait **deux actes seuls et pas une phrase** : exactement le graphe
      cassé-en-apparence que cette phrase devait éviter. *Ce qui manque ici, ce ne
      sont pas des nœuds, ce sont des scènes.*
    */
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
                    onClick={() => { setLiaison(v => !v); setDepart(null); }}
                    title={liaison
                        ? 'Quitter le mode liaison'
                        : 'Glisser d’une scène vers un lieu, un PNJ, un indice… et cliquer un lien pour le retirer'}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-ui-10 font-black uppercase tracking-widest transition-all ${
                        liaison
                            ? 'bg-sky-500/25 border-sky-400/50 text-sky-200'
                            : 'bg-app-bg/40 border-app-border/20 text-app-text/45 hover:text-app-text/80'
                    }`}
                ><Link2 size={13} /> Relier</button>

                <button
                    onClick={ranger}
                    title="Une colonne par acte, de gauche à droite ; ses scènes dessous, dans leur ordre. Tu peux ensuite ajuster à la main."
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-app-border/20 text-ui-10 font-bold text-app-text/60 hover:text-app-text hover:bg-white/5 transition-all"
                ><Columns3 size={13} /> Ranger</button>

                <button
                    onClick={figerOuLiberer}
                    title={fige ? 'Rendre les nœuds à la simulation' : 'Garder la disposition telle qu’elle est'}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border border-app-border/20 text-ui-10 font-bold text-app-text/60 hover:text-app-text hover:bg-white/5 transition-all"
                >
                    {fige ? <Lock size={13} className="text-accent" /> : <Unlock size={13} />}
                    {fige ? 'Figé' : 'Libre'}
                </button>
                <button
                    onClick={() => activeCampaignId && reinitialiserLeGrapheDeTrame(activeCampaignId)}
                    title="Tout rendre à la simulation, épingles comprises"
                    className="p-2 rounded-xl border border-app-border/20 text-app-text/40 hover:text-app-text hover:bg-white/5 transition-all"
                ><RotateCcw size={13} /></button>
            </div>

            {liaison && (
                <p className="shrink-0 px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-400/25 text-ui-10 font-bold text-sky-200/90">
                    {depart
                        ? `Relie « ${noeudParId(depart)?.nom ?? ''} » à… relâche sur un lieu, un PNJ, un indice, un personnage ou une ambiance.`
                        : 'Glisse d’une scène vers une autre pour dire qu’elle y mène, ou vers un lieu, un PNJ, un indice · clique un lien pour le retirer.'}
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
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300/90 hover:bg-amber-500/20'
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

            {/* ── Le graphe, et le panneau du nœud choisi ─────────────────── */}
            <div className="flex-1 min-h-0 flex gap-3">
                <div
                    ref={conteneur}
                    onPointerDown={auPointeurBas}
                    onPointerMove={auPointeurBouge}
                    onPointerUp={auPointeurHaut}
                    onPointerLeave={() => { if (depart) { setDepart(null); fil.current = null; } }}
                    className={`flex-1 min-w-0 rounded-2xl border bg-app-bg/30 overflow-hidden relative transition-colors ${
                        liaison ? 'border-sky-400/40' : 'border-app-border/10'
                    } ${liaison ? 'cursor-crosshair' : ''}`}
                >
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
                    ) : taille.largeur > 0 && (
                        <ForceGraph2D
                            ref={graphe2d as never}
                            width={taille.largeur}
                            height={taille.hauteur}
                            graphData={donnees}
                            backgroundColor="transparent"
                            nodeCanvasObject={peindre}
                            nodePointerAreaPaint={(noeud: NoeudDeTrame, couleur, ctx) => {
                                ctx.fillStyle = couleur;
                                ctx.beginPath();
                                ctx.arc(noeud.x ?? 0, noeud.y ?? 0, RAYONS[noeud.type] + 4, 0, 2 * Math.PI);
                                ctx.fill();
                            }}
                            linkVisibility={(lien: LienDeTrame) => lien.nature !== 'appartenance'
                                || !acteRange(typeof lien.source === 'string' ? lien.source : (lien.source as NoeudDeTrame).id)}
                            /*
                              **Le cadre de chaque acte rangé** — un fond discret sous
                              ses scènes, pour qu'on lise d'un coup d'œil où l'acte
                              commence et finit. Calculé sur les positions du moment :
                              il suit ce que le meneur ajuste à la main.
                            */
                            onRenderFramePre={(ctx: CanvasRenderingContext2D) => {
                                for (const [acteId, sesScenes] of scenesDesActes) {
                                    if (!acteRange(acteId)) continue;
                                    const acte = graphe.noeuds.find(n => n.id === acteId);
                                    const points = [acte, ...sesScenes].filter(Boolean) as NoeudDeTrame[];
                                    const xs = points.map(n => n.x ?? 0);
                                    const ys = points.map(n => n.y ?? 0);
                                    const gauche = Math.min(...xs) - 70;
                                    const haut = Math.min(...ys) - 22;
                                    const largeur = Math.max(...xs) + 70 - gauche;
                                    const hauteur = Math.max(...ys) + 34 - haut;
                                    ctx.beginPath();
                                    ctx.roundRect(gauche, haut, largeur, hauteur, 14);
                                    ctx.fillStyle = 'rgba(148,163,184,.045)';
                                    ctx.fill();
                                    ctx.strokeStyle = 'rgba(148,163,184,.14)';
                                    ctx.lineWidth = 1;
                                    ctx.stroke();
                                }
                            }}
                            linkColor={(lien: LienDeTrame) =>
                                LIENS[lien.nature]?.couleur ?? `${COULEUR_DU_TYPE[lien.nature as TypeDeNoeud] ?? '#94a3b8'}44`}
                            linkWidth={(lien: LienDeTrame) => LIENS[lien.nature]?.largeur ?? 1}
                            /* La flèche dit le sens : indispensable pour un
                               enchaînement, utile pour l'ordre. */
                            linkDirectionalArrowLength={(lien: LienDeTrame) =>
                                (lien.nature === 'enchainement' ? 5 : lien.nature === 'suite' ? 3 : 0)}
                            linkDirectionalArrowRelPos={1}
                            linkLabel={(lien: LienDeTrame) => libelleLisible(lien.libelle) ?? ''}
                            /*
                              ⭐ **La condition, écrite sur le trait.** C'est elle qui
                              fait d'un graphe un plan de scénario : *« si elle
                              survit », « en cas d'échec ».* Elle disparaît quand on
                              dézoome — vingt conditions superposées ne sont pas
                              vingt conditions, c'est une tache.
                            */
                            linkCanvasObjectMode={() => 'after'}
                            linkCanvasObject={(lien: LienDeTrame, ctx: CanvasRenderingContext2D, echelle: number) => {
                                /* ⚠️ Le texte dessiné est NETTOYÉ, jamais celui qu'on
                                   tape : voir `libelleGarde`. Sans ça, une condition
                                   réduite à des espaces peindrait un cadre vide. */
                                const ecrit = libelleLisible(lien.libelle);
                                if (!ecrit || echelle < 1.4) return;
                                const de = lien.source as unknown as NoeudDeTrame;
                                const vers = lien.target as unknown as NoeudDeTrame;
                                if (typeof de !== 'object' || typeof vers !== 'object') return;
                                const x = ((de.x ?? 0) + (vers.x ?? 0)) / 2;
                                const y = ((de.y ?? 0) + (vers.y ?? 0)) / 2;
                                const corps = Math.max(2.5, 8 / echelle);
                                ctx.font = `600 ${corps}px Inter, sans-serif`;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                const largeur = ctx.measureText(ecrit).width;
                                /* Un fond, sinon le texte se lit par-dessus les traits. */
                                ctx.fillStyle = 'rgba(2,6,23,.85)';
                                ctx.fillRect(x - largeur / 2 - 2, y - corps / 2 - 1, largeur + 4, corps + 2);
                                ctx.fillStyle = 'rgba(186,230,253,.95)';
                                ctx.fillText(ecrit, x, y);
                            }}
                            /*
                              ⭐ **Des traits DROITS, et c’est le geste qui l’a
                              décidé.** Ils étaient légèrement bombés, par habitude.
                              Or on **clique** un lien pour le retirer : un trait
                              courbe ne passe pas par le milieu des deux nœuds, donc
                              on vise un endroit où il n’est pas. *Un élément qu’on
                              doit atteindre doit se trouver là où on le croit.* Et la
                              courbure ne servait à rien ici : il n’y a jamais deux
                              liens entre les deux mêmes nœuds.
                            */
                            onNodeClick={(noeud: NoeudDeTrame) => { setChoisi(noeud.id); setSurlignes(new Set()); }}
                            onNodeDragEnd={auLacher}
                            /*
                              ⚠️ **Délier ne se fait QUE dans le mode liaison.** Un
                              clic sur un trait est facile à rater : hors du mode, la
                              toile ne doit rien écrire. C'est la même règle que la
                              confirmation du rattachement — *le geste de rangement
                              ne doit jamais modifier la trame par accident.*
                            */
                            onLinkClick={(lien: LienDeTrame) => {
                                if (!liaison) return;
                                if (lien.nature === 'appartenance' || lien.nature === 'suite') {
                                    gmToast(lien.nature === 'suite'
                                        ? 'Ce trait est l’ordre du document, pas un enchaînement : il disparaîtra dès que cette scène en déclarera un.'
                                        : 'La structure ne se délie pas : glisse la scène sur un autre acte.', 'info');
                                    return;
                                }
                                const de = noeudParId(typeof lien.source === 'string' ? lien.source : (lien.source as NoeudDeTrame).id);
                                const vers = noeudParId(typeof lien.target === 'string' ? lien.target : (lien.target as NoeudDeTrame).id);
                                if (de && vers) brancher(de, vers, false);
                            }}
                            onEngineStop={releverLesPositions}
                            onBackgroundClick={() => setChoisi(null)}
                            /* Le fil du geste en cours. `battement` n'est là que pour
                               forcer le redessin quand la simulation est refroidie. */
                            onRenderFramePost={(ctx: CanvasRenderingContext2D) => {
                                void battement;
                                const source = noeudParId(depart);
                                if (!source || !fil.current) return;
                                ctx.beginPath();
                                ctx.moveTo(source.x ?? 0, source.y ?? 0);
                                ctx.lineTo(fil.current.x, fil.current.y);
                                ctx.strokeStyle = 'rgba(56,189,248,.8)';
                                ctx.lineWidth = 1.5;
                                ctx.setLineDash([3, 3]);
                                ctx.stroke();
                                ctx.setLineDash([]);
                            }}
                            cooldownTicks={fige ? 0 : 200}
                            d3VelocityDecay={fige ? 1 : 0.12}
                            enableNodeDrag={!fige && !liaison}
                            /*
                              ⛔ **Et le panoramique aussi, trouvé par l'essai de bout
                              en bout.** Couper `enableNodeDrag` ne suffisait pas : un
                              glisser qui ne saisit aucun nœud **déplace la vue**. En
                              mode liaison, la toile glissait donc sous le pointeur, et
                              on relâchait à côté du nœud visé. *Le geste semblait
                              rater une fois sur deux, sans rien dire.*

                              Perdre le panoramique dans ce mode n'est pas un sacrifice :
                              on y relie, on n'y navigue pas — et il revient d'un clic.
                            */
                            enablePanInteraction={!liaison}
                        />
                    )}

                    {/* La légende ne montre que ce que le niveau affiche. */}
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 max-w-[70%] pointer-events-none">
                        {(Object.keys(COULEUR_DU_TYPE) as TypeDeNoeud[]).filter(t => typesVisibles.has(t)).map(type => (
                            <span key={type} className="flex items-center gap-1.5 text-ui-9 font-bold uppercase tracking-widest text-app-text/35">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COULEUR_DU_TYPE[type] }} />
                                {LIBELLE_DU_TYPE[type]}
                            </span>
                        ))}
                        <span className="text-ui-9 font-bold uppercase tracking-widest text-app-text/25">
                            · {scenesVisibles} scène{scenesVisibles > 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {noeudChoisi && (
                    <div className="w-64 shrink-0 rounded-2xl border border-app-border/10 bg-app-surface/40 p-4 overflow-y-auto custom-scrollbar space-y-3">
                        <div>
                            <p className="text-ui-9 font-black uppercase tracking-widest" style={{ color: COULEUR_DU_TYPE[noeudChoisi.type] }}>
                                {LIBELLE_DU_TYPE[noeudChoisi.type]}
                            </p>

                            {/*
                              ⭐ **Le titre s'édite ici.** Un champ, et pas un
                              double-clic sur la toile : *un texte qu'on tape par
                              dessus un canevas ne dit jamais où il commence ni ce
                              qu'il remplace.* L'écriture part vers la même action
                              que la fiche.
                            */}
                            {sceneChoisie || acteChoisi ? (
                                <input
                                    value={noeudChoisi.nom}
                                    onChange={e => (sceneChoisie
                                        ? modifierScene(noeudChoisi.refId, { titre: e.target.value })
                                        : modifierActe(noeudChoisi.refId, { titre: e.target.value }))}
                                    className="w-full mt-1 bg-app-bg/40 px-2.5 py-1.5 rounded-lg border border-app-border/20 text-sm font-bold focus:border-accent/50 outline-none"
                                />
                            ) : (
                                <p className="text-sm font-bold leading-snug mt-0.5">{noeudChoisi.nom}</p>
                            )}

                            {noeudChoisi.etat && noeudChoisi.etat !== 'prevue' && (
                                <p className="text-ui-10 text-app-text/40 mt-1">{noeudChoisi.etat.replace('-', ' ')}</p>
                            )}
                        </div>

                        {/* Le rang, par le contrôle partagé avec la fiche — deux
                            copies auraient fini par ne plus offrir les mêmes rangs. */}
                        {sceneChoisie && (
                            <div className="space-y-1.5">
                                <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/30">
                                    Rang dans l’intrigue
                                </p>
                                <ChoixDuRang
                                    scene={sceneChoisie}
                                    onChange={updates => modifierScene(sceneChoisie.id, updates)}
                                    compact
                                />
                            </div>
                        )}

                        {/* Commencer et terminer : les deux gestes du parcours réel,
                            et les mêmes actions qu’en séance. Une scène en pause a
                            besoin des DEUX — c’est le défaut du 2026-08-20. */}
                        {sceneChoisie && (
                            <div className="flex gap-1.5">
                                {etatDeLaScene(sceneChoisie) !== 'en-cours' && (
                                    <button
                                        onClick={() => ouvrirLaScene(sceneChoisie.id, seanceActive?.id)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-app-border/20 text-ui-10 font-bold text-app-text/60 hover:text-emerald-300 hover:bg-white/5 transition-all"
                                    ><Play size={11} /> {etatDeLaScene(sceneChoisie) === 'terminee' ? 'Rouvrir' : 'Commencer'}</button>
                                )}
                                {(etatDeLaScene(sceneChoisie) === 'en-cours' || etatDeLaScene(sceneChoisie) === 'en-pause') && (
                                    <button
                                        onClick={() => terminerLaScene(sceneChoisie.id)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-app-border/20 text-ui-10 font-bold text-emerald-400 hover:text-red-300 hover:bg-white/5 transition-all"
                                    ><Square size={11} /> Terminer</button>
                                )}
                            </div>
                        )}

                        {/* Les deux gestes qui touchent à la disposition, jamais à la trame. */}
                        <div className="flex gap-1.5">
                            {campagne?.noeudsEpinglesDeLaTrame?.[noeudChoisi.id] ? (
                                <button
                                    onClick={() => activeCampaignId && detacherDeLaTrame(activeCampaignId, noeudChoisi.id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-accent/30 bg-accent/10 text-accent text-ui-10 font-bold"
                                ><PinOff size={11} /> Détacher</button>
                            ) : (
                                <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-ui-10 text-app-text/25">
                                    <Pin size={11} /> Glisse-le pour l’épingler
                                </span>
                            )}
                        </div>

                        {(noeudChoisi.type === 'scene' || noeudChoisi.type === 'acte' || noeudChoisi.type === 'pnj') && (
                            <button
                                onClick={() => {
                                    if (noeudChoisi.type === 'pnj') navigateToNpcDetail(noeudChoisi.refId);
                                    else onOuvrirLaFiche(noeudChoisi.type, noeudChoisi.refId);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-accent/15 border border-accent/30 text-accent text-ui-10 font-black uppercase tracking-widest hover:bg-accent/25 transition-all"
                            ><ExternalLink size={12} /> Ouvrir la fiche</button>
                        )}

                        {/*
                          ⭐ **Les sorties de la scène, et leur condition.** C'est ici
                          qu'on écrit *« si elle survit »* — le geste de la toile crée
                          la branche, le panneau lui donne son sens. ⚠️ Et une porte
                          pour les défaire sans passer par le mode liaison : *un lien
                          qu'on ne peut retirer que d'une façon est un lien qu'on
                          n'ose plus créer.*
                        */}
                        {sceneChoisie && sorties.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-ui-9 font-black uppercase tracking-widest text-sky-300/60">
                                    Mène à
                                </p>
                                {sorties.map(sortie => (
                                    <div key={sortie.vers.id} className="space-y-1 p-2 rounded-lg bg-sky-500/5 border border-sky-400/20">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => setChoisi(idDuNoeud('scene', sortie.vers.id))}
                                                className="flex-1 min-w-0 text-left text-ui-11 font-bold text-sky-200/90 truncate hover:text-sky-100"
                                            >{sortie.vers.titre}</button>
                                            <button
                                                onClick={() => retirerUnEnchainement(sceneChoisie.id, sortie.vers.id)}
                                                title="Retirer cette sortie"
                                                className="p-0.5 rounded text-app-text/30 hover:text-red-300"
                                            ><Unlink size={11} /></button>
                                        </div>
                                        <input
                                            value={sortie.libelle ?? ''}
                                            onChange={e => libellerUnEnchainement(sceneChoisie.id, sortie.vers.id, e.target.value)}
                                            maxLength={LIBELLE_MAXIMUM}
                                            placeholder="à quelle condition ?"
                                            className="w-full bg-app-bg/40 px-2 py-1 rounded text-ui-10 border border-app-border/20 focus:border-sky-400/50 outline-none placeholder:text-app-text/25"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* D'où l'on peut arriver. **Déduit, jamais stocké** : le
                            garder des deux côtés aurait fait deux écritures pour un
                            seul lien, et un jour l'une sans l'autre. */}
                        {sceneChoisie && entrees.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/30">
                                    On y arrive depuis
                                </p>
                                {entrees.map(entree => (
                                    <button
                                        key={entree.depuis.id}
                                        onClick={() => setChoisi(idDuNoeud('scene', entree.depuis.id))}
                                        className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-left hover:bg-white/5 transition-colors"
                                    >
                                        <span className="flex-1 min-w-0 text-ui-11 truncate text-app-text/60">{entree.depuis.titre}</span>
                                        {libelleLisible(entree.libelle) && (
                                            <span className="shrink-0 text-ui-9 italic text-app-text/35 max-w-[45%] truncate">
                                                {libelleLisible(entree.libelle)}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/*
                          ⛔ **Supprimer depuis une toile demande de dire ce que ça
                          coûte.** Sur un canevas on ne voit pas toujours ce qu’on
                          vise, et l’acte emporte ses scènes — la confirmation
                          reprend donc mot pour mot celle de la fiche.
                        */}
                        {(sceneChoisie || acteChoisi) && (
                            <button
                                onClick={() => {
                                    if (sceneChoisie) {
                                        gmConfirm(`Supprimer la scène « ${sceneChoisie.titre} » ?`, () => {
                                            supprimerScene(sceneChoisie.id);
                                            setChoisi(null);
                                        });
                                        return;
                                    }
                                    if (!acteChoisi) return;
                                    const emportees = scenesEmportees(scenes, acteChoisi.id).length;
                                    gmConfirm(
                                        emportees === 0
                                            ? `Supprimer « ${acteChoisi.titre} » ?`
                                            : `Supprimer « ${acteChoisi.titre} » et ses ${emportees} scène${emportees > 1 ? 's' : ''} ? `
                                              + 'Les scènes ne peuvent pas survivre à leur acte.',
                                        () => { supprimerActe(acteChoisi.id); setChoisi(null); },
                                    );
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-app-border/20 text-ui-10 font-bold text-app-text/40 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 transition-all"
                            ><Trash2 size={12} /> Supprimer</button>
                        )}

                        {voisins.length > 0 && (
                            <div className="space-y-1.5">
                                <p className="text-ui-9 font-black uppercase tracking-widest text-app-text/30">
                                    {voisins.length} lien{voisins.length > 1 ? 's' : ''}
                                </p>
                                {voisins.map(voisin => (
                                    <button
                                        key={voisin.id}
                                        onClick={() => setChoisi(voisin.id)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-white/5 transition-colors"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COULEUR_DU_TYPE[voisin.type] }} />
                                        <span className="flex-1 min-w-0 text-ui-11 truncate text-app-text/70">{voisin.nom}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrapheDeLaTrame;
