import ELK, { type ElkNode, type ElkPort, type ElkExtendedEdge, type ELK as Moteur } from 'elkjs/lib/elk-api';
import workerUrl from 'elkjs/lib/elk-worker.min.js?url';
import type { OrganisationDeTrame, EspacementDeTrame, FormeDeTrame, StyleDeLienDeTrame, PointDeTrame } from '../../../types/campaign.types';
import type { GrapheDeTrame, LienDeTrame } from './grapheDeLaTrame';
import { DIMENSIONS_DES_CARTES } from './geometrieDesCartesDeTrame';
import { normaliserLeStyleDeLien } from './stylesDesLiensDeTrame';
import { milieuDuTrajet, pointDeTrameValide } from './trajetsDeTrame';
import { organiserSelonLaForme, MARGES_DE_TRAME } from './formesDeTrame';

type Cote = NonNullable<StyleDeLienDeTrame['depart']>;
const SIDES = { haut: 'NORTH', bas: 'SOUTH', gauche: 'WEST', droite: 'EAST' };
const identite = (l: LienDeTrame) => JSON.stringify([l.nature, l.source, l.target]);

function entreeDuMoteur(graphe: GrapheDeTrame, styles: Record<string, StyleDeLienDeTrame> | undefined,
    espacement: EspacementDeTrame, direction: 'RIGHT' | 'DOWN', proportions: number) {
    const marge = MARGES_DE_TRAME[espacement];
    const noeuds = new Map<string, ElkNode>();
    const acteDe = new Map<string, string>();
    const actes = new Set(graphe.noeuds.filter(n => n.type === 'acte').map(n => n.id));
    for (const l of graphe.liens) if (l.nature === 'appartenance' && actes.has(l.source)) acteDe.set(l.target, l.source);
    // Une annexe partagée dans un acte y reste ; entre plusieurs actes, elle est commune.
    for (const n of graphe.noeuds.filter(n => n.type !== 'acte' && n.type !== 'scene')) {
        const parents = graphe.liens.filter(l => l.target === n.id).map(l => acteDe.get(l.source));
        if (parents.length && parents.every(p => p && p === parents[0])) acteDe.set(n.id, parents[0]!);
    }
    for (const n of graphe.noeuds) {
        const taille = DIMENSIONS_DES_CARTES[n.type];
        noeuds.set(n.id, { id: n.id, width: taille.largeur, height: taille.hauteur, ports: [],
            layoutOptions: { 'elk.portConstraints': 'FIXED_POS' } });
    }
    const ports = new Map<string, { depart: Cote; arrivee: Cote; pointDepart?: 1 | 2 | 3; pointArrivee?: 1 | 2 | 3 }>();
    const edges: ElkExtendedEdge[] = [];
    const port = (noeud: ElkNode, id: string, cote: Cote, point = 2): ElkPort => ({
        id, width: 0, height: 0,
        x: cote === 'gauche' ? 0 : cote === 'droite' ? noeud.width : noeud.width! * point / 4,
        y: cote === 'haut' ? 0 : cote === 'bas' ? noeud.height : noeud.height! * point / 4,
        layoutOptions: { 'elk.port.side': SIDES[cote] },
    });
    for (const l of [...graphe.liens].sort((a, b) => identite(a).localeCompare(identite(b)))) {
        const a = noeuds.get(l.source), b = noeuds.get(l.target);
        if (!a || !b) continue;
        const id = identite(l), style = normaliserLeStyleDeLien(styles?.[id]);
        const narratif = l.nature === 'enchainement' || l.nature === 'suite';
        const depart = style?.depart ?? (narratif && direction === 'RIGHT' ? 'droite' : 'bas');
        const arrivee = style?.arrivee ?? (narratif && direction === 'RIGHT' ? 'gauche' : 'haut');
        const pa = JSON.stringify([id, 'depart']), pb = JSON.stringify([id, 'arrivee']);
        a.ports!.push(port(a, pa, depart, style?.pointDepart)); b.ports!.push(port(b, pb, arrivee, style?.pointArrivee));
        ports.set(id, { depart, arrivee, pointDepart: style?.pointDepart, pointArrivee: style?.pointArrivee });
        edges.push({ id, sources: [pa], targets: [pb],
            labels: l.libelle ? [{ text: l.libelle, width: Math.min(260, Math.max(40, l.libelle.length * 6.5 + 16)), height: 24 }] : undefined });
    }
    const layoutOptions = { 'elk.algorithm': 'layered', 'elk.direction': direction,
        'elk.edgeRouting': 'ORTHOGONAL', 'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.spacing.nodeNode': String(marge), 'elk.layered.spacing.nodeNodeBetweenLayers': String(marge * 1.5),
        'elk.spacing.edgeNode': '18', 'elk.spacing.edgeEdge': '14', 'elk.randomSeed': '1',
        'elk.aspectRatio': String(proportions), 'elk.padding': '[top=24,left=24,bottom=24,right=24]' };
    const groupes = graphe.noeuds.filter(n => n.type === 'acte').map(a => ({
        id: `groupe:${a.id}`, children: [...noeuds.values()].filter(n => n.id === a.id || acteDe.get(n.id) === a.id),
        layoutOptions: { ...layoutOptions, 'elk.padding': `[top=44,left=${marge},bottom=${marge},right=${marge}]` },
    }));
    const root: ElkNode = { id: 'trame', layoutOptions, children: [...groupes,
        ...[...noeuds.values()].filter(n => !actes.has(n.id) && !acteDe.has(n.id))], edges };
    return { root, ports };
}

function lireLeResultat(root: ElkNode, graphe: GrapheDeTrame, ports: Map<string, { depart: Cote; arrivee: Cote; pointDepart?: 1 | 2 | 3; pointArrivee?: 1 | 2 | 3 }>, espacement: EspacementDeTrame): OrganisationDeTrame {
    const positions: OrganisationDeTrame['positions'] = {}, trajets: OrganisationDeTrame['trajets'] = {}, groupes: OrganisationDeTrame['groupes'] = [];
    const origines = new Map<string, PointDeTrame>([[root.id, { x: 0, y: 0 }]]);
    const noms = new Map(graphe.noeuds.map(n => [n.id, n.nom]));
    const liens = new Map(graphe.liens.map(l => [identite(l), l]));
    const edges: ElkExtendedEdge[] = [];
    const parcourir = (parent: ElkNode, origine: PointDeTrame) => {
        edges.push(...parent.edges ?? []);
        for (const n of parent.children ?? []) {
            const coin = { x: origine.x + (n.x ?? NaN), y: origine.y + (n.y ?? NaN) };
            if (!pointDeTrameValide(coin)) throw new Error('Le moteur a rendu une position invalide.');
            origines.set(n.id, coin);
            if (n.children) {
                groupes.push({ id: n.id, nom: noms.get(n.id.slice('groupe:'.length)) ?? '', ...coin,
                    largeur: n.width ?? 0, hauteur: n.height ?? 0, membres: n.children.map(c => c.id) });
                parcourir(n, coin);
            } else positions[n.id] = { x: coin.x + (n.width ?? 0) / 2, y: coin.y + (n.height ?? 0) / 2 };
        }
    };
    parcourir(root, { x: 0, y: 0 });
    if (Object.keys(positions).length !== graphe.noeuds.length) throw new Error('Le moteur n’a pas placé toutes les cartes.');
    for (const edge of edges) {
        const l = liens.get(edge.id), cotes = ports.get(edge.id), section = edge.sections?.[0];
        if (!l || !cotes || !section) continue;
        const origine = origines.get(edge.container ?? root.id) ?? { x: 0, y: 0 };
        const absolu = (p: PointDeTrame) => ({ x: p.x + origine.x, y: p.y + origine.y });
        const points = [section.startPoint, ...section.bendPoints ?? [], section.endPoint].map(absolu);
        if (!points.every(pointDeTrameValide)) throw new Error('Le moteur a rendu un trajet invalide.');
        const label = edge.labels?.[0];
        trajets[edge.id] = { points, ...cotes, positionDepart: { ...positions[l.source] }, positionArrivee: { ...positions[l.target] },
            libelle: l.libelle, etiquette: label && Number.isFinite(label.x) && Number.isFinite(label.y)
                ? absolu({ x: label.x! + (label.width ?? 0) / 2, y: label.y! + (label.height ?? 0) / 2 }) : milieuDuTrajet(points) };
    }
    return { positions, trajets, groupes, espacement };
}

/** Deux orientations comparées sur la forme de la toile ; aucun changement métier ou magasin. */
export async function organiserLaTrame(graphe: GrapheDeTrame, styles: Record<string, StyleDeLienDeTrame> | undefined,
    options: { espacement: EspacementDeTrame; proportions: number; forme?: FormeDeTrame; signal?: AbortSignal }, moteurFourni?: Moteur): Promise<OrganisationDeTrame> {
    options.signal?.throwIfAborted();
    const forme = options.forme ?? 'automatique';
    if (forme !== 'automatique' && forme !== 'arbre') return organiserSelonLaForme(graphe, forme, options.espacement, options.proportions);
    if (!graphe.noeuds.length) return { positions: {}, trajets: {}, groupes: [], espacement: options.espacement };
    const moteur = moteurFourni ?? new ELK({ workerFactory: () => new Worker(workerUrl) });
    const proportions = Number.isFinite(options.proportions) && options.proportions > 0 ? options.proportions : 16 / 9;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let arreter: (() => void) | undefined;
    try {
        const calcul = async () => {
            let meilleur: OrganisationDeTrame | undefined, score = Infinity;
            for (const direction of (forme === 'arbre' ? ['DOWN'] as const : ['RIGHT', 'DOWN'] as const)) {
                options.signal?.throwIfAborted();
                const entree = entreeDuMoteur(graphe, styles, options.espacement, direction, proportions);
                const sortie = await moteur.layout(entree.root);
                const resultat = lireLeResultat(sortie, graphe, entree.ports, options.espacement);
                const largeur = sortie.width ?? 1, hauteur = sortie.height ?? 1;
                const valeur = Math.abs(Math.log((largeur / hauteur) / proportions)) + 0.12 * Math.log(largeur * hauteur);
                if (valeur < score) { meilleur = resultat; score = valeur; }
            }
            return { ...meilleur!, forme };
        };
        return await Promise.race([calcul(), new Promise<never>((_, reject) => {
            arreter = () => reject(new DOMException('Organisation annulée', 'AbortError'));
            options.signal?.addEventListener('abort', arreter, { once: true });
            timeout = setTimeout(() => reject(new Error('Le calcul a pris trop de temps. Réduis le niveau affiché et réessaie.')), 20_000);
        })]);
    } finally {
        clearTimeout(timeout);
        if (arreter) options.signal?.removeEventListener('abort', arreter);
        if (!moteurFourni) moteur.terminateWorker();
    }
}
