import React, { useEffect, useRef, useState } from 'react';
import { Dices, X } from 'lucide-react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { resultatsArrives, verdictADire, type ResultatArrive } from './filDesDemandes';
import { degreOuBooleen, estUneReussite } from './degresDeReussite';

/**
 * **Le résultat d'un jet demandé, 5 secondes dans une fenêtre volante** — David,
 * 11/11/2026 : « je voudrais que le résultat apparaisse 5 sec dans une fenêtre
 * volante ». Chez le meneur seulement, pour les jets **demandés** seulement
 * (décisions de David le même jour) ; l'habillage est celui de l'alerte
 * « Nouveau message » (`MessageAlertOverlay`), dans la colonne de laquelle les
 * cartes s'empilent — deux colonnes au même endroit se chevaucheraient.
 *
 * La source est le fil : la suite « lancée » qui clôt la demande porte le
 * résultat (`resultatsArrives`). Rien n'est rejoué au démarrage : seul compte
 * ce qui arrive après l'ouverture.
 */

/** Cinq secondes, le temps que David a demandé. */
const DUREE_DE_LA_FENETRE = 5000;

export const ResultatsDesDemandesVolants: React.FC = () => {
    const messages = useSessionOSStore(s => s.messages);
    const [ouvertLe] = useState(() => Date.now());
    const [cartes, setCartes] = useState<ResultatArrive[]>([]);
    const vues = useRef(new Set<string>());
    const minuteurs = useRef(new Map<string, ReturnType<typeof setTimeout>>());

    const retirer = (id: string) => {
        const m = minuteurs.current.get(id);
        if (m) clearTimeout(m);
        minuteurs.current.delete(id);
        setCartes(c => c.filter(x => x.id !== id));
    };

    useEffect(() => {
        const nouvelles = resultatsArrives(messages, ouvertLe).filter(r => !vues.current.has(r.id));
        if (nouvelles.length === 0) return;
        for (const r of nouvelles) {
            vues.current.add(r.id);
            minuteurs.current.set(r.id, setTimeout(() => {
                minuteurs.current.delete(r.id);
                setCartes(c => c.filter(x => x.id !== r.id));
            }, DUREE_DE_LA_FENETRE));
        }
        // Une carte par message neuf du fil, comme MessageAlertOverlay.
        setCartes(c => [...c, ...nouvelles]);
    }, [messages, ouvertLe]);

    useEffect(() => () => {
        for (const m of minuteurs.current.values()) clearTimeout(m);
        minuteurs.current.clear();
    }, []);

    return (
        <>
            {cartes.slice(-3).map(carte => {
                const degre = degreOuBooleen(carte.resultat.degre, carte.resultat.tagSuccess);
                const reussi = degre ? estUneReussite(degre) : undefined;
                const verdict = verdictADire(carte.resultat);
                const couleur = reussi === undefined ? 'text-app-text' : reussi ? 'text-etat-succes' : 'text-etat-danger';
                return (
                    <section key={carte.id} role="status" aria-label={`Jet demandé : ${carte.personnage}`} data-resultat-de-demande
                        className="relative w-80 overflow-hidden bg-app-surface/90 border border-accent/30 rounded-2xl shadow-2xl backdrop-blur-2xl p-4 pointer-events-auto animate-in slide-in-from-right-10 duration-300 border-l-4 border-l-accent">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 shrink-0 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/20">
                                    <Dices size={16} className="text-accent" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-black uppercase tracking-widest text-accent">Jet demandé</span>
                                    <span className="text-ui-10 font-bold text-app-text/80 truncate">{carte.personnage} — {carte.resultat.titre}</span>
                                </div>
                            </div>
                            <button type="button" onClick={() => retirer(carte.id)} title="Fermer"
                                className="p-1.5 hover:bg-app-text/10 rounded-lg transition-colors text-app-text/40 hover:text-app-text">
                                <X size={14} />
                            </button>
                        </div>
                        {verdict && <p className={`text-lg font-black pl-1 ${couleur}`}>{verdict}</p>}
                        {/* Le texte du jeu qui dit déjà son verdict prend la couleur et la taille du verdict. */}
                        <p className={verdict
                            ? 'text-sm text-app-text/90 line-clamp-3 leading-relaxed font-medium pl-1'
                            : `text-base font-black line-clamp-3 leading-snug pl-1 ${couleur}`}>
                            {carte.resultat.totalDisplay}
                        </p>
                        {/* Les cinq secondes, à l'œil. */}
                        <div className="absolute bottom-0 left-0 h-1 w-full bg-app-text/10" aria-hidden>
                            <div className="h-full bg-accent/50 animate-out slide-out-to-left-full linear fill-mode-forwards"
                                style={{ animationDuration: `${DUREE_DE_LA_FENETRE}ms` }} />
                        </div>
                    </section>
                );
            })}
        </>
    );
};

export default ResultatsDesDemandesVolants;
