import type { FormeDeTrame, OrganisationDeTrame, EspacementDeTrame, PointDeTrame } from '../../../types/campaign.types';
import type { GrapheDeTrame, NoeudDeTrame } from './grapheDeLaTrame';
import { DIMENSIONS_DES_CARTES } from './geometrieDesCartesDeTrame';
import { centreDeLEtoile } from './rangementDeLaTrame';

export const FORMES_DE_TRAME: { id: FormeDeTrame; nom: string }[] = [
    { id: 'automatique', nom: 'Automatique' }, { id: 'etoile', nom: 'Étoile' },
    { id: 'ligne', nom: 'Ligne horizontale' }, { id: 'colonne', nom: 'Colonne verticale' },
    { id: 'arbre', nom: 'Arbre' }, { id: 'grille', nom: 'Grille' },
];
export const MARGES_DE_TRAME: Record<EspacementDeTrame, number> = { compact: 28, equilibre: 52, aere: 84 };
type Bloc = { largeur: number; hauteur: number; positions: Record<string, PointDeTrame> };
const ajouter = (dans: Bloc['positions'], bloc: Bloc, x: number, y: number) => {
    for (const [id, p] of Object.entries(bloc.positions)) dans[id] = { x: x + p.x, y: y + p.y };
};

/** Une cellule réserve toute sa scène et ses annexes, même sur le cercle d'une étoile. */
function cellule(noeud: NoeudDeTrame, annexes: NoeudDeTrame[], marge: number): Bloc {
    const taille = DIMENSIONS_DES_CARTES[noeud.type];
    const largeurAnnexe = Math.max(0, ...annexes.map(a => DIMENSIONS_DES_CARTES[a.type].largeur));
    const hauteurAnnexe = Math.max(0, ...annexes.map(a => DIMENSIONS_DES_CARTES[a.type].hauteur));
    const colonnes = Math.min(2, annexes.length);
    const largeur = Math.max(taille.largeur, colonnes * largeurAnnexe + Math.max(0, colonnes - 1) * marge);
    const hauteur = taille.hauteur + Math.ceil(annexes.length / 2) * (hauteurAnnexe + marge);
    const positions = { [noeud.id]: { x: largeur / 2, y: taille.hauteur / 2 } };
    annexes.forEach((a, i) => {
        positions[a.id] = { x: largeur / 2 + (i % 2 - (colonnes - 1) / 2) * (largeurAnnexe + marge),
            y: taille.hauteur + marge + hauteurAnnexe / 2 + Math.floor(i / 2) * (hauteurAnnexe + marge) };
    });
    return { largeur, hauteur, positions };
}

function enGrille(blocs: Bloc[], marge: number, proportions: number): Bloc {
    if (!blocs.length) return { largeur: 0, hauteur: 0, positions: {} };
    const pasX = Math.max(...blocs.map(b => b.largeur)) + marge;
    const pasY = Math.max(...blocs.map(b => b.hauteur)) + marge;
    let meilleur: Bloc | undefined, score = Infinity;
    // Dès quatre scènes, une grille offre réellement plusieurs rangées et colonnes.
    for (let colonnes = blocs.length >= 4 ? 2 : 1; colonnes <= (blocs.length >= 4 ? Math.ceil(blocs.length / 2) : blocs.length); colonnes++) {
        const lignes = Math.ceil(blocs.length / colonnes), largeur = colonnes * pasX - marge, hauteur = lignes * pasY - marge;
        const valeur = Math.abs(Math.log(largeur / hauteur / proportions)) + 0.12 * Math.log(largeur * hauteur);
        if (valeur >= score) continue;
        score = valeur;
        const positions: Bloc['positions'] = {};
        blocs.forEach((b, i) => ajouter(positions, b, (i % colonnes) * pasX + (pasX - marge - b.largeur) / 2,
            Math.floor(i / colonnes) * pasY));
        meilleur = { largeur, hauteur, positions };
    }
    return meilleur!;
}

/** Les actes ont des tailles différentes : ne pas réserver à chacun la taille du plus grand. */
function enPage(blocs: Bloc[], marge: number, proportions: number): Bloc {
    if (!blocs.length) return { largeur: 0, hauteur: 0, positions: {} };
    const minimum = Math.max(...blocs.map(b => b.largeur)), maximum = blocs.reduce((s, b) => s + b.largeur + marge, -marge);
    let meilleur: Bloc | undefined, score = Infinity;
    for (let essai = 0; essai <= 24; essai++) {
        const visee = minimum + (maximum - minimum) * essai / 24, positions: Bloc['positions'] = {};
        let x = 0, y = 0, hauteurLigne = 0, largeur = 0;
        for (const b of blocs) {
            if (x && x + b.largeur > visee) { y += hauteurLigne + marge; x = 0; hauteurLigne = 0; }
            ajouter(positions, b, x, y); largeur = Math.max(largeur, x + b.largeur);
            x += b.largeur + marge; hauteurLigne = Math.max(hauteurLigne, b.hauteur);
        }
        const hauteur = y + hauteurLigne;
        const valeur = Math.abs(Math.log(largeur / hauteur / proportions)) + 0.12 * Math.log(largeur * hauteur);
        if (valeur < score) { score = valeur; meilleur = { positions, largeur, hauteur }; }
    }
    return meilleur!;
}

/** David, 07/10/2026 : choisir la forme, en gardant l'histoire et les cartes partagées. */
export function organiserSelonLaForme(graphe: GrapheDeTrame, forme: 'etoile' | 'ligne' | 'colonne' | 'grille',
    espacement: EspacementDeTrame, proportions: number): OrganisationDeTrame {
    const marge = MARGES_DE_TRAME[espacement];
    const ratio = Number.isFinite(proportions) && proportions > 0 ? proportions : 16 / 9;
    const parId = new Map(graphe.noeuds.map(n => [n.id, n]));
    const actes = graphe.noeuds.filter(n => n.type === 'acte');
    const acteDe = new Map<string, string>();
    for (const l of graphe.liens) if (l.nature === 'appartenance' && parId.get(l.source)?.type === 'acte'
        && parId.get(l.target)?.type === 'scene') acteDe.set(l.target, l.source);
    const annexesDe = new Map<string, NoeudDeTrame[]>(), annexePlacee = new Set<string>();
    for (const n of graphe.noeuds.filter(n => n.type !== 'scene' && n.type !== 'acte')) {
        const parents = graphe.liens.filter(l => l.target === n.id && parId.get(l.source)?.type === 'scene').map(l => l.source);
        // Une annexe commune à plusieurs actes reste hors de leurs cadres.
        if (parents.length && parents.every(p => acteDe.get(p) === acteDe.get(parents[0]))) {
            const parent = parents[0]; annexesDe.set(parent, [...annexesDe.get(parent) ?? [], n]); annexePlacee.add(n.id);
        }
    }
    const menesPar = new Map<string, string[]>();
    for (const l of graphe.liens) if (l.nature === 'suite' || l.nature === 'enchainement')
        menesPar.set(l.target, [...menesPar.get(l.target) ?? [], l.source]);
    const groupes: OrganisationDeTrame['groupes'] = [];
    const blocs: Bloc[] = actes.map(acte => {
        const scenes = graphe.noeuds.filter(n => n.type === 'scene' && acteDe.get(n.id) === acte.id);
        const cellules = scenes.map(s => cellule(s, annexesDe.get(s.id) ?? [], marge));
        const tete = DIMENSIONS_DES_CARTES.acte;
        let corps: Bloc;
        if (forme === 'etoile' && scenes.length) {
            const centre = centreDeLEtoile(acte.id, scenes.map(s => s.id), menesPar) ?? acte.id;
            const milieu = centre === acte.id ? cellule(acte, [], marge) : cellules[scenes.findIndex(s => s.id === centre)];
            const branches = cellules.filter(c => !(centre in c.positions));
            const ancre = (c: Bloc) => c.positions[Object.keys(c.positions)[0]];
            // Les rayons suivent les scènes, pas le milieu de leurs annexes.
            // Réserver le cercle qui englobe chaque cellule autour de cette ancre.
            const diametre = 2 * Math.max(...[milieu, ...branches].map(c => {
                const p = ancre(c);
                return Math.hypot(Math.max(p.x, c.largeur - p.x), Math.max(p.y, c.hauteur - p.y));
            })) + marge;
            const rayon = Math.max(diametre, diametre / (2 * Math.sin(Math.PI / Math.max(2, branches.length))));
            const cote = 2 * rayon + diametre, positions: Bloc['positions'] = {};
            ajouter(positions, milieu, cote / 2 - ancre(milieu).x, cote / 2 - ancre(milieu).y);
            branches.forEach((c, i) => {
                const angle = -Math.PI / 2 + i * 2 * Math.PI / branches.length;
                ajouter(positions, c, cote / 2 + rayon * Math.cos(angle) - ancre(c).x,
                    cote / 2 + rayon * Math.sin(angle) - ancre(c).y);
            });
            corps = { largeur: cote, hauteur: cote, positions };
        } else if (forme === 'ligne' || forme === 'colonne') {
            const positions: Bloc['positions'] = {};
            let curseur = 0;
            const traverse = Math.max(0, ...cellules.map(c => forme === 'ligne' ? c.hauteur : c.largeur));
            for (const c of cellules) {
                ajouter(positions, c, forme === 'ligne' ? curseur : (traverse - c.largeur) / 2, forme === 'ligne' ? 0 : curseur);
                curseur += (forme === 'ligne' ? c.largeur : c.hauteur) + marge;
            }
            corps = { positions, largeur: forme === 'ligne' ? Math.max(0, curseur - marge) : traverse,
                hauteur: forme === 'ligne' ? traverse : Math.max(0, curseur - marge) };
        } else corps = enGrille(cellules, marge, ratio);
        const acteAuCentre = acte.id in corps.positions;
        const largeur = Math.max(tete.largeur, corps.largeur) + 2 * marge;
        const haut = 44 + marge + (acteAuCentre ? 0 : tete.hauteur + marge);
        const positions: Bloc['positions'] = {};
        ajouter(positions, corps, (largeur - corps.largeur) / 2, haut);
        if (!acteAuCentre) positions[acte.id] = { x: largeur / 2, y: 44 + marge + tete.hauteur / 2 };
        return { largeur, hauteur: haut + corps.hauteur + marge, positions };
    });
    const deja = new Set(blocs.flatMap(b => Object.keys(b.positions)));
    const libres = graphe.noeuds.filter(n => !deja.has(n.id) && !annexePlacee.has(n.id));
    if (libres.length) blocs.push(enGrille(libres.map(n => cellule(n, annexesDe.get(n.id) ?? [], marge)), marge, ratio));
    const page = enPage(blocs, marge * 2, ratio);
    for (let i = 0; i < actes.length; i++) {
        const b = blocs[i], premier = Object.keys(b.positions)[0];
        const coin = premier ? { x: page.positions[premier].x - b.positions[premier].x, y: page.positions[premier].y - b.positions[premier].y } : { x: 0, y: 0 };
        groupes.push({ id: `groupe:${actes[i].id}`, nom: actes[i].nom, ...coin, largeur: b.largeur, hauteur: b.hauteur, membres: Object.keys(b.positions) });
    }
    return { positions: page.positions, groupes, trajets: {}, espacement, forme };
}
