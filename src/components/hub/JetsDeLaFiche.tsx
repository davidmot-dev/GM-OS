import React, { useState } from 'react';
import { Dices, Flame, Send } from 'lucide-react';
import { caracteristiquesDeSauvegarde, type DemandeDeJetDeFiche } from '../../modules/dice/jetDepuisLaFiche';
import { deCourant, ressourcesDUsure } from '../../modules/dice/ressourcesDUsure';
import type { ModificateurDeSauvegarde } from '../../modules/dice/DiceEngine';
import type { GameDriver } from '../../types/drivers';

/**
 * **Lancer depuis sa fiche, sur sa tablette** — Cthulhu Hack, demandé par
 * David le 2026-09-30.
 *
 * Les Sauvegardes du personnage en boutons, avec l'avantage et le désavantage ;
 * ses ressources à dé d'usure, chacune avec son dé. **La tablette ne lance
 * rien** : elle dit au meneur ce que le joueur lance (`fiche:jet`), et c'est lui
 * qui lit la fiche, lance, écrit le dé qui descend et inscrit le jet. Le
 * résultat revient à la table comme tout jet — l'écran de résultat de la
 * tablette l'affiche. *La vérité reste chez le meneur ; la tablette demande.*
 *
 * Des cibles de 48 px : on vise du pouce, la tablette posée sur la table.
 */
interface JetsDeLaFicheProps {
    playerId: string;
    characterId: string;
    sheetData: Record<string, unknown>;
    pilote: GameDriver | null | undefined;
    gabarit: { sections: { id: string; fields: { id: string; label: string }[] }[] };
}

const MODIFICATEURS: { cle: ModificateurDeSauvegarde; titre: string }[] = [
    { cle: 'aucun', titre: 'Normal' },
    { cle: 'avantage', titre: 'Avantage' },
    { cle: 'desavantage', titre: 'Désavantage' },
];

export const JetsDeLaFiche: React.FC<JetsDeLaFicheProps> = ({ playerId, characterId, sheetData, pilote, gabarit }) => {
    const [modificateur, setModificateur] = useState<ModificateurDeSauvegarde>('aucun');
    const [envoye, setEnvoye] = useState<string | null>(null);

    const sauvegardes = caracteristiquesDeSauvegarde(pilote, gabarit)
        .map(c => ({ ...c, valeur: Number(sheetData[c.fieldId]) }))
        .filter(c => Number.isFinite(c.valeur));
    const ressources = ressourcesDUsure(pilote, sheetData)
        .map(r => ({ ...r, de: deCourant(sheetData[r.fieldId]) }));

    if (sauvegardes.length === 0 && ressources.length === 0) return null;

    const demander = (genre: DemandeDeJetDeFiche['genre'], champ: string, libelle: string) => {
        const demande: DemandeDeJetDeFiche = {
            playerId, characterId, genre, champ,
            ...(genre === 'sauvegarde' ? { modificateur } : {}),
        };
        window.dispatchEvent(new CustomEvent('fiche:jet', { detail: demande }));
        setEnvoye(libelle);
        window.setTimeout(() => setEnvoye(courant => (courant === libelle ? null : courant)), 3000);
    };

    return (
        <section className="space-y-5 rounded-2xl border border-app-border bg-app-surface/60 p-4" data-jets-de-la-fiche="">
            {sauvegardes.length > 0 && (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-accent">
                            <Dices size={14} /> Sauvegardes
                        </h3>
                        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Avantage">
                            {MODIFICATEURS.map(({ cle, titre }) => (
                                <button
                                    key={cle}
                                    onClick={() => setModificateur(cle)}
                                    aria-pressed={modificateur === cle}
                                    className={`min-h-12 px-3 rounded-xl border text-ui-11 font-black uppercase tracking-wider transition-all ${modificateur === cle
                                        ? 'bg-accent/20 border-accent text-accent'
                                        : 'bg-app-bg border-app-border text-app-muted'}`}
                                >
                                    {titre}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {sauvegardes.map(s => (
                            <button
                                key={s.fieldId}
                                onClick={() => demander('sauvegarde', s.fieldId, `Sauvegarde de ${s.label}`)}
                                className="min-h-14 flex items-center justify-between gap-2 px-4 rounded-xl border border-app-border bg-app-bg hover:border-accent active:bg-accent/15 transition-all"
                            >
                                <span className="truncate text-sm font-bold text-app-text">{s.label}</span>
                                <span className="shrink-0 font-mono text-lg font-black text-accent">{s.valeur}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {ressources.length > 0 && (
                <div className="space-y-3">
                    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-accent">
                        <Flame size={14} /> Ressources
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {ressources.map(r => (
                            <button
                                key={r.fieldId}
                                disabled={typeof r.de !== 'number'}
                                onClick={() => demander('ressource', r.fieldId, r.label)}
                                className="min-h-14 flex items-center justify-between gap-2 px-4 rounded-xl border border-app-border bg-app-bg hover:border-accent active:bg-accent/15 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span className="truncate text-sm font-bold text-app-text">{r.label}</span>
                                <span className={`shrink-0 font-mono text-lg font-black ${r.de === null ? 'text-etat-danger' : 'text-accent'}`}>
                                    {r.de === null ? 'épuisée' : typeof r.de === 'number' ? `d${r.de}` : '—'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {envoye && (
                <p role="status" className="flex items-center gap-2 text-ui-11 font-bold text-app-muted">
                    <Send size={12} /> {envoye} — lancé par le meneur
                </p>
            )}
        </section>
    );
};

export default JetsDeLaFiche;
