import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * **Les étapes du test** — la maquette retenue le 2026-10-22 (Stitch,
 * `Stitch/onglet-test/`) : composer, préparer, lancer, le résultat. Chaque
 * étape est un encadré numéroté ; le numéro dit l'ordre, qui est celui du geste.
 */
export function Etape({ numero, titre, droite, className = '', children }: {
    numero: number;
    titre: string;
    /** Ce qui se lit d'un coup d'œil à droite du titre : le verdict du résultat. */
    droite?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <section aria-label={titre} className={`space-y-3 rounded-xl border border-app-border bg-app-surface/40 p-4 ${className}`}>
            <header className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/15 font-mono text-ui-11 font-black text-accent">
                    {numero}
                </span>
                <h4 className="text-ui-11 font-black uppercase tracking-widest text-app-text">{titre}</h4>
                {droite && <div className="ml-auto">{droite}</div>}
            </header>
            {children}
        </section>
    );
}

/**
 * **Une carte repliable pour un bloc du jeu** — le dernier test, la santé, la
 * panique… Le bloc garde son contenu et ses gestes ; la carte ne fait que le
 * ranger. Elle s'ouvre par défaut et retient, sur cet appareil, celles que le
 * meneur ou le joueur a refermées : une carte qui se rouvrirait à chaque jet
 * obligerait à refaire le même geste à chaque fois.
 */
export function CarteDuJeu({ id, titre, children }: { id: string; titre: string; children: React.ReactNode }) {
    const cle = `gmos-carte-du-jet:${id}`;
    const [ouverte, setOuverte] = useState(() => {
        try { return localStorage.getItem(cle) !== 'fermee'; } catch { return true; }
    });
    return (
        <details
            data-carte-du-jeu={id}
            open={ouverte}
            onToggle={e => {
                const o = e.currentTarget.open;
                setOuverte(o);
                try { localStorage.setItem(cle, o ? 'ouverte' : 'fermee'); } catch { /* stockage indisponible : la carte reste ouverte au prochain rendu */ }
            }}
            className="group rounded-xl border border-app-border bg-app-surface/40"
        >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-ui-11 font-black uppercase tracking-widest text-app-text [&::-webkit-details-marker]:hidden">
                {titre}
                <ChevronDown size={14} className="shrink-0 text-app-text/50 transition-transform group-open:rotate-180" />
            </summary>
            {/*
                Le bloc dessine déjà son encadré et son titre : dans la carte,
                l'encadré s'efface et le titre, redit par la carte, se masque.
            */}
            <div className="px-4 pb-4 [&>section]:border-0 [&>section]:bg-transparent [&>section]:p-0 [&>section>h4:first-child]:hidden [&>section>h3:first-child]:hidden [&>[data-suites-alien]>p:first-child]:hidden">
                {children}
            </div>
        </details>
    );
}
