import type { DrawingPath, Point, WhiteboardTool } from '../useWhiteboardStore';

/**
 * **Dessiner un tracé du tableau blanc — un seul dessinateur pour trois écrans.**
 *
 * Refonte, L6 (2026-10-03). Le tableau du meneur (`DrawingCanvas`), le Player
 * Hub et le projecteur (`PlayerDrawingCanvas`) et la tablette
 * (`RemoteDrawingCanvas`) portaient chacun **la même fonction recopiée**. Les
 * trois outils retenus par David le 2026-09-29 — Pion, Cible, Règle — auraient
 * dû s'y écrire trois fois, et le premier oubli aurait montré aux joueurs un
 * tableau différent de celui du meneur. *Ce qui doit se voir pareil partout se
 * dessine à un seul endroit.*
 *
 * Les coordonnées des points sont normalisées (0 à 1) : chaque écran les
 * rapporte à sa propre taille.
 */

/**
 * **La case du tableau** : le pas de la grille pointillée du fond, en pixels
 * CSS. La règle compte en cases — le tableau n'a pas d'échelle à lui, et le
 * pilote donne le MOT de l'unité (« cases », « mètres », « zones »), jamais sa
 * taille. C'est la convention du Cortex tactique.
 */
export const TAILLE_DE_CASE = 24;

/** Les outils qui se posent d'un clic, au lieu de se tracer. */
export const OUTILS_A_POSER: readonly WhiteboardTool[] = ['pion', 'cible'];

/**
 * Les outils qu'un joueur peut tenir. Le tableau partage l'outil du meneur :
 * quand il tient un pion ou la règle, le trait d'un joueur reste un trait — un
 * pion sans nom posé par un doigt ne voudrait rien dire.
 */
export function outilDeTrait(outil: WhiteboardTool): WhiteboardTool {
    return outil === 'pion' || outil === 'cible' || outil === 'regle' ? 'brush' : outil;
}

/** La longueur d'une règle, en cases, sur un écran de `largeur` × `hauteur` pixels. */
export function longueurEnCases(debut: Point, fin: Point, largeur: number, hauteur: number): number {
    const dx = (fin.x - debut.x) * largeur;
    const dy = (fin.y - debut.y) * hauteur;
    return Math.hypot(dx, dy) / TAILLE_DE_CASE;
}

/**
 * Ce que la règle écrit : « 8,5 mètres ». Une décimale, la virgule française,
 * et le mot du pilote — « unités » quand il ne le donne pas, qui ne prétend
 * rien (même repli que le Cortex).
 */
export function libelleDeMesure(cases: number, unite: string | undefined, langue = 'fr'): string {
    const nombre = (Math.round(cases * 10) / 10).toLocaleString(langue, { maximumFractionDigits: 1 });
    return `${nombre} ${unite?.trim() || 'unités'}`;
}

/** Un libellé sur un fond, lisible quelle que soit la couleur du trait. */
function ecrire(ctx: CanvasRenderingContext2D, texte: string, x: number, y: number, couleur: string, fond: 'dark' | 'light') {
    ctx.save();
    ctx.font = 'bold 12px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const largeur = ctx.measureText(texte).width + 12;
    ctx.fillStyle = fond === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(2,6,23,0.85)';
    ctx.fillRect(x - largeur / 2, y - 10, largeur, 20);
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - largeur / 2, y - 10, largeur, 20);
    ctx.fillStyle = couleur;
    ctx.fillText(texte, x, y);
    ctx.restore();
}

/**
 * **Le blanc et le noir suivent le papier.** La première couleur de la palette
 * est blanche sur le papier sombre, noire sur le clair : un trait tracé dans
 * l'une **disparaissait** quand on changeait de papier, blanc sur blanc. Il se
 * lit maintenant dans l'autre. Les autres couleurs ne bougent pas.
 */
export function couleurSurLePapier(couleur: string, fond: 'dark' | 'light'): string {
    const c = couleur.trim().toLowerCase();
    if (fond === 'light' && (c === '#ffffff' || c === '#fff')) return '#000000';
    if (fond === 'dark' && (c === '#000000' || c === '#000')) return '#ffffff';
    return couleur;
}

export function dessinerUnTrace(ctx: CanvasRenderingContext2D, trace: DrawingPath, fond: 'dark' | 'light'): void {
    const path = { ...trace, color: couleurSurLePapier(trace.color, fond) };
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const premier = path.points[0];
    if (!premier) return;

    // ── Les outils qui se posent : un seul point suffit ──
    if (path.tool === 'pion' || path.tool === 'cible') {
        const x = premier.x * w;
        const y = premier.y * h;
        const rayon = Math.max(14, path.width * 3);
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = path.color;
        ctx.lineWidth = 2.5;
        if (path.tool === 'pion') {
            ctx.beginPath();
            ctx.arc(x, y, rayon, 0, Math.PI * 2);
            ctx.globalAlpha = 0.18;
            ctx.fillStyle = path.color;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.stroke();
            const initiale = path.label?.trim().charAt(0).toUpperCase();
            if (initiale) {
                ctx.font = `bold ${Math.round(rayon)}px ui-sans-serif, system-ui, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = path.color;
                ctx.fillText(initiale, x, y + 1);
            }
        } else {
            ctx.beginPath();
            ctx.arc(x, y, rayon, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x, y, rayon * 0.45, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x - rayon * 1.3, y); ctx.lineTo(x + rayon * 1.3, y);
            ctx.moveTo(x, y - rayon * 1.3); ctx.lineTo(x, y + rayon * 1.3);
            ctx.stroke();
        }
        ctx.restore();
        if (path.label?.trim()) ecrire(ctx, path.label.trim(), x, y + rayon + 16, path.color, fond);
        return;
    }

    if (path.points.length < 2) return;

    // ── La règle : un trait pointillé, ses deux butées, et sa mesure au milieu ──
    if (path.tool === 'regle') {
        const fin = path.points[path.points.length - 1];
        const [x1, y1, x2, y2] = [premier.x * w, premier.y * h, fin.x * w, fin.y * h];
        const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
        const [bx, by] = [Math.cos(angle) * 7, Math.sin(angle) * 7];
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = path.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x1 - bx, y1 - by); ctx.lineTo(x1 + bx, y1 + by);
        ctx.moveTo(x2 - bx, y2 - by); ctx.lineTo(x2 + bx, y2 + by);
        ctx.stroke();
        ctx.restore();
        if (path.label) ecrire(ctx, path.label, (x1 + x2) / 2, (y1 + y2) / 2, path.color, fond);
        return;
    }

    // ── Les tracés d'avant, à l'identique ──
    ctx.beginPath();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    if (path.tool === 'eraser') {
        ctx.strokeStyle = fond === 'light' ? '#ffffff' : '#0f172a';
        ctx.lineWidth = path.width * 16;
    } else if (path.tool === 'laser') {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
    } else {
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (path.tool === 'brush' || path.tool === 'eraser' || path.tool === 'laser') {
        ctx.moveTo(premier.x * w, premier.y * h);
        for (let i = 1; i < path.points.length; i++) {
            const p = path.points[i];
            ctx.lineTo(p.x * w, p.y * h);
        }
    } else if (path.tool === 'rect') {
        const end = path.points[path.points.length - 1];
        ctx.strokeRect(premier.x * w, premier.y * h, (end.x - premier.x) * w, (end.y - premier.y) * h);
        return;
    } else if (path.tool === 'circle') {
        const end = path.points[path.points.length - 1];
        const dx = (end.x - premier.x) * w;
        const dy = (end.y - premier.y) * h;
        ctx.arc(premier.x * w, premier.y * h, Math.sqrt(dx * dx + dy * dy), 0, 2 * Math.PI);
    }
    ctx.stroke();
}
