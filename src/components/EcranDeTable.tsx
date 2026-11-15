import React, { useEffect, useState } from 'react';
import { Gauge, Moon, Sun } from 'lucide-react';
import { CadreDeTablette } from './socle/CadreDeTablette';
import { usePleinEcranAuToucher } from '../hooks/usePleinEcranAuToucher';
import { useEcranDeTable } from '../modules/ulanzi/useEcranDeTable';
import { enMinutesSecondes } from '../modules/ulanzi/widgets/minuteur';
import { lireLeTemps, type TuileDeLEcran } from '../modules/ulanzi/ecranDeTable';

/**
 * **L'écran de table** (`?window=ecran-de-table`) — Fire HD 8, registre § 256, T13.
 *
 * Une tablette debout face aux joueurs : des nombres, des barres, des couleurs — pas de phrases
 * (doctrine de l'afficheur Ulanzi). Le meneur coche les widgets au tableau de bord de l'Ulanzi,
 * section « Écran de table ». Dessin : maquette Stitch validée le 15/11/2026
 * (`documentation/Planning/visuels/fire-hd8-2026-11-15/5-ecran-de-table.png`), sans ce que Stitch
 * avait inventé (« Réserve O₂ nominale », « Cycle diurne normal », barre sous l'ordre du tour).
 */
const GRILLES: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2' };

/*
  **Le relief, retrouvé sur la maquette** (David, 15/11/2026 : « un peu plat »). Les lueurs passent
  par `currentColor` : chaque tuile prend sa teinte du thème (accent, alerte, danger) et la lueur
  suit, sans couleur brute — et sous le thème parchemin comme sous le thème néon.
*/
const LUEUR_TEXTE = { textShadow: '0 0 24px color-mix(in srgb, currentColor 55%, transparent)' };
const LUEUR_BLOC = { boxShadow: '0 0 12px color-mix(in srgb, currentColor 65%, transparent)' };

/*
  **L'impact** (David, 15/11/2026 : « plus impactante ») : un éclair quand une valeur change — la
  clé du nœud change, le nœud est recréé et rejoue l'animation —, des alertes qui battent, des
  chiffres calés sur la largeur de chaque tuile (`cqi`), un fond de scène à la teinte du thème.
*/
const ANIMATIONS = `
@keyframes ecran-eclair { 0% { transform: scale(1.22); filter: brightness(1.9); } 100% { transform: scale(1); filter: none; } }
@keyframes ecran-alerte { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
@media (prefers-reduced-motion: reduce) { .ecran-anime { animation: none !important; } }`;
const ECLAIR = { animation: 'ecran-eclair .7s ease-out', display: 'inline-block' };
const alerte = (rapide: boolean) => ({ animation: `ecran-alerte ${rapide ? '.5s' : '1.2s'} ease-in-out infinite` });
const FOND_DE_SCENE = {
    backgroundImage: 'radial-gradient(ellipse at 50% -10%, color-mix(in srgb, var(--app-accent) 18%, transparent), transparent 62%),'
        + ' repeating-linear-gradient(0deg, color-mix(in srgb, var(--app-text) 4%, transparent) 0 1px, transparent 1px 4px)',
};

/** Le cadre commun : dégradé, liseré et halo à la teinte de la tuile, icône ou étiquette à droite. */
function Cadre({ nom, teinte, droite, children }: { nom: string; teinte: string; droite?: React.ReactNode; children: React.ReactNode }) {
    return (
        <section aria-label={nom}
            className={`@container relative flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-app-border bg-gradient-to-b from-app-surface to-app-bg p-5 ${teinte}`}>
            <span aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-current opacity-70" />
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-current opacity-[0.08] blur-3xl" />
            <div className="relative flex items-center justify-between gap-3">
                {/* Plus grand et plus contrasté qu'au départ : le gris pâle se perdait sur le parchemin (photo du 15/11). */}
                <p className="text-[17px] font-bold uppercase tracking-[0.22em] text-app-text/80">{nom}</p>
                {droite}
            </div>
            {children}
        </section>
    );
}

const Etiquette = ({ children }: { children: React.ReactNode }) => (
    <span className="rounded-md border border-current/40 bg-current/10 px-2.5 py-0.5 text-[17px] font-bold uppercase tracking-widest">
        <span className="font-mono">{children}</span>
    </span>
);

function Tuile({ tuile, maintenant }: { tuile: TuileDeLEcran; maintenant: number }) {
    if (tuile.forme === 'rang') {
        return (
            <Cadre nom={tuile.nom} teinte="text-accent" droite={<Etiquette>Tour {tuile.ordre.round}</Etiquette>}>
                <div className="relative flex flex-1 items-center gap-5">
                    <span aria-hidden className="h-[45%] min-h-12 w-2.5 shrink-0 rounded-full bg-current" style={LUEUR_BLOC} />
                    <div className="min-w-0">
                        <p className="text-[16px] font-bold uppercase tracking-[0.3em]">Actif</p>
                        <p key={tuile.ordre.actif} className="ecran-anime text-[min(17cqi,13vh,80px)] font-black leading-none text-app-text [overflow-wrap:anywhere]"
                            style={{ ...ECLAIR, transformOrigin: 'left center' }}>{tuile.ordre.actif}</p>
                    </div>
                </div>
                {tuile.ordre.suivants.length > 0 && (
                    <p className="relative border-t border-app-border pt-3 text-[24px] text-app-text/80">
                        <span className="mr-3 text-[16px] font-bold uppercase tracking-[0.25em] text-app-text/70">Suivants</span>
                        {tuile.ordre.suivants.map((nom, i) => (
                            <span key={i}>{i > 0 && <span className="mx-2 text-current">›</span>}<span className={i === 0 ? 'text-app-text' : ''}>{nom}</span></span>
                        ))}
                    </p>
                )}
            </Cadre>
        );
    }

    if (tuile.forme === 'jauge') {
        const max = tuile.max ?? Math.max(tuile.valeur, 1);
        const segments = tuile.max !== undefined && tuile.max <= 20;
        const part = Math.max(0, Math.min(1, (tuile.valeur - (tuile.min ?? 0)) / (max - (tuile.min ?? 0) || 1)));
        // Critique : presque pleine pour une jauge qui monte, presque vide pour une qui s'épuise.
        const critique = tuile.seVide ? part <= 0.2 : part >= 0.8;
        const teinte = critique ? 'text-etat-danger' : tuile.couleur ? '' : tuile.seVide ? 'text-etat-alerte' : 'text-accent';
        const couleur = tuile.couleur && !critique ? { color: tuile.couleur } : undefined;
        return (
            <Cadre nom={tuile.nom} teinte={teinte} droite={<Gauge size={22} aria-hidden />}>
                {/* `.font-mono` fixe sa taille à 1em (index.css, l'échelle des chiffres) : la taille va sur le bloc, la police dedans. */}
                <p className="relative flex flex-1 items-center justify-center text-[min(34cqi,20vh,120px)] font-black leading-none" style={couleur}>
                    <span key={tuile.valeur} className="ecran-anime font-mono" style={{ ...LUEUR_TEXTE, ...ECLAIR, ...(critique ? alerte(false) : {}) }}>{tuile.valeur}</span>
                    {tuile.max !== undefined && <span className="text-[0.45em] text-app-muted"><span className="font-mono">/{tuile.max}</span></span>}
                </p>
                {segments ? (
                    <div className="relative flex gap-1.5" aria-hidden style={couleur}>
                        {Array.from({ length: tuile.max! }, (_, i) => i < tuile.valeur
                            ? <span key={i} className="h-5 flex-1 rounded bg-current" style={LUEUR_BLOC} />
                            : <span key={i} className="h-5 flex-1 rounded bg-app-text/10" />)}
                    </div>
                ) : (
                    <div className="relative h-3 rounded-full bg-app-text/10" aria-hidden style={couleur}>
                        <div className="h-3 rounded-full bg-current" style={{ ...LUEUR_BLOC, width: `${part * 100}%` }} />
                    </div>
                )}
            </Cadre>
        );
    }

    if (tuile.forme === 'compte-a-rebours') {
        const part = tuile.duree > 0 ? Math.max(0, Math.min(1, tuile.restant / tuile.duree)) : 0;
        return (
            <Cadre nom={tuile.nom} teinte="text-etat-danger" droite={<Etiquette>Compte à rebours</Etiquette>}>
                <p className="relative flex flex-1 items-center justify-center gap-4 text-[min(26cqi,22vh,130px)] font-black leading-none">
                    <span aria-hidden className="ecran-anime h-4 w-4 shrink-0 rounded-full bg-current" style={{ ...LUEUR_BLOC, ...alerte(tuile.restant <= 10) }} />
                    {/* Sous la minute, les chiffres battent ; sous dix secondes, deux fois plus vite. */}
                    <span className="ecran-anime font-mono" style={{ ...LUEUR_TEXTE, ...(tuile.restant <= 60 ? alerte(tuile.restant <= 10) : {}) }}>{enMinutesSecondes(tuile.restant)}</span>
                </p>
                <div className="relative h-3 rounded-full bg-app-text/10" aria-hidden>
                    <div className="h-3 rounded-full bg-current" style={{ ...LUEUR_BLOC, width: `${part * 100}%` }} />
                </div>
            </Cadre>
        );
    }

    const { haut, heure, nom: nomDeLHeure } = lireLeTemps(tuile.temps, maintenant);
    const heureDuJour = Number(heure.slice(0, 2));
    const nuit = Number.isFinite(heureDuJour) && (heureDuJour < 7 || heureDuJour >= 20);
    return (
        <Cadre nom={tuile.nom} teinte="text-etat-alerte" droite={nuit ? <Moon size={22} aria-hidden /> : <Sun size={22} aria-hidden />}>
            <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-1">
                {haut && <p className="text-center text-[min(7cqi,5vh,26px)] font-bold uppercase tracking-[0.2em] text-app-text/80">{haut}</p>}
                {/* Sans nom d'heure, les chiffres prennent la place ; avec, ils la partagent (la tuile coupait le nom, photo du 15/11). */}
                <p className={`${nomDeLHeure ? 'text-[min(20cqi,13vh,92px)]' : 'text-[min(24cqi,18vh,112px)]'} font-black leading-none text-app-text`}><span key={heure} className="ecran-anime font-mono" style={{ ...LUEUR_TEXTE, ...ECLAIR }}>{heure}</span></p>
                {/* Le nom de l'heure (Rêve de Dragon…) sur sa ligne, à une taille qui tient dans la tuile. */}
                {nomDeLHeure && <p className="text-center text-[min(8cqi,5vh,30px)] font-bold leading-tight [overflow-wrap:anywhere]">{nomDeLHeure}</p>}
            </div>
        </Cadre>
    );
}

const EcranDeTable: React.FC = () => {
    const { connexion, ecran } = useEcranDeTable();
    // L'heure réelle avance seule ; le reste ne bouge que quand le poste renvoie l'écran.
    const [maintenant, setMaintenant] = useState(() => Date.now());
    useEffect(() => { const id = setInterval(() => setMaintenant(Date.now()), 15_000); return () => clearInterval(id); }, []);

    // Plein écran au premier toucher : la barre d'adresse de Firefox mangeait un sixième de la Fire.
    const { pleinEcran, demander: passerEnPleinEcran } = usePleinEcranAuToucher();

    const tuiles = ecran?.tuiles ?? [];
    const message = connexion !== 'connecte' ? 'Connexion au poste du meneur…'
        : !ecran?.choisi ? 'Aucun widget choisi pour l’écran de table.'
        : 'Rien à montrer pour l’instant.';

    return (
        <CadreDeTablette className="h-dvh bg-app-bg text-app-text font-inter overflow-hidden flex flex-col p-4 gap-3" style={FOND_DE_SCENE}
            onClick={passerEnPleinEcran}>
            <style>{ANIMATIONS}</style>
            <header className="flex shrink-0 items-center gap-2 text-[12px] font-bold uppercase tracking-[0.3em] text-app-muted">
                <span aria-hidden className={`h-2 w-2 rounded-full ${connexion === 'connecte' ? 'bg-accent' : 'bg-app-text/30'}`} />
                GM-OS · Écran de table
                {!pleinEcran && <span className="ml-auto normal-case tracking-normal">Touche l’écran pour le plein écran</span>}
            </header>
            {tuiles.length > 0 ? (
                <main className={`grid flex-1 min-h-0 gap-3 ${GRILLES[tuiles.length] ?? 'grid-cols-3'} auto-rows-fr`}>
                    {tuiles.map(tuile => <Tuile key={tuile.id} tuile={tuile} maintenant={maintenant} />)}
                </main>
            ) : (
                <main className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                    <p className="text-[26px] font-bold text-app-text">{message}</p>
                    {connexion === 'connecte' && !ecran?.choisi && (
                        <p className="max-w-[44ch] text-[16px] text-app-muted">Le meneur les coche au tableau de bord de l’Ulanzi, section « Écran de table ».</p>
                    )}
                </main>
            )}
        </CadreDeTablette>
    );
};

export default EcranDeTable;
