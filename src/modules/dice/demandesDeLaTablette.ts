import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { demandesOuvertes } from './filDesDemandes';
import type { DemandeDeJet } from './demandeDeJet';

/**
 * **Les demandes de jet, vues de la tablette** — plan
 * `2026-11-11-jets-demandes-et-caches.md`, T8 ; maquette Stitch adoptée le 11/11
 * (`documentation/Planning/stitch/jets-demandes/1-tablette-banniere.png`).
 *
 * Une demande est **à lancer** tant qu'elle est ouverte dans le fil (le meneur ne
 * l'a ni annulée ni reçue) et que cette tablette n'a pas encore envoyé de jet
 * qui y réponde. Entre l'envoi et la clôture par le meneur, elle est **envoyée** :
 * la bannière dit « Jet envoyé au meneur » au lieu de proposer de relancer.
 *
 * L'envoi se lit sur les deux événements qui partent au meneur avec
 * l'identifiant de la demande (T4) : `fiche:resultat` (le jet de la tablette) et
 * `fiche:jet` (la Sauvegarde que le meneur résout). En mémoire seulement : une
 * tablette rechargée retrouve la demande dans le fil rendu (C6), et le meneur
 * la clôt dès que le jet arrive.
 */

const signe = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** Ce que le meneur a fixé, en une ligne pour la bannière : « difficulté 2 · modificateur −1 ». */
export function precisionsDeLaDemande(demande: DemandeDeJet): string {
    if (demande.genre !== 'test') return '';
    const c = demande.composition;
    return [
        c.difficulte !== undefined ? `difficulté ${c.difficulte}` : null,
        c.ajustementDeDifficulte ? `difficulté ${signe(c.ajustementDeDifficulte)}` : null,
        c.modificateurDuSeuil ? `modificateur ${signe(c.modificateurDuSeuil)}` : null,
    ].filter(Boolean).join(' · ');
}

/** Combien de temps « Jet envoyé au meneur » reste affiché. */
export const ENVOI_AFFICHE_MS = 6000;

interface EtatDesEnvois {
    /** Identifiant de demande → instant de l'envoi. */
    envois: Record<string, number>;
    marquer: (demandeId: string) => void;
}

export const useEnvoisDeLaTablette = create<EtatDesEnvois>()((set) => ({
    envois: {},
    marquer: (demandeId) => set(etat => ({ envois: { ...etat.envois, [demandeId]: Date.now() } })),
}));

const demandeIdDe = (evenement: Event): string | undefined => {
    const detail = (evenement as CustomEvent<unknown>).detail;
    const id = detail && typeof detail === 'object' ? (detail as Record<string, unknown>).demandeId : undefined;
    return typeof id === 'string' && id ? id : undefined;
};

/** Écoute ce qui part au meneur ; à poser une fois, sur la tablette. Rend de quoi se retirer. */
export function suivreLesEnvois(): () => void {
    const noter = (e: Event) => {
        const id = demandeIdDe(e);
        if (id) useEnvoisDeLaTablette.getState().marquer(id);
    };
    window.addEventListener('fiche:resultat', noter);
    window.addEventListener('fiche:jet', noter);
    return () => {
        window.removeEventListener('fiche:resultat', noter);
        window.removeEventListener('fiche:jet', noter);
    };
}

/** Le hook de la tablette : `suivreLesEnvois` le temps du montage. */
export function useSuiviDesEnvois(): void {
    useEffect(() => suivreLesEnvois(), []);
}

export interface DemandesDeLaTablette {
    /** Les demandes ouvertes que ce personnage n'a pas encore lancées, de la plus ancienne. */
    aLancer: DemandeDeJet[];
    /** Les jets envoyés depuis peu, pour « Jet envoyé au meneur ». */
    envoyees: { id: string; titre: string }[];
}

/** Ce que la bannière montre pour ce personnage. */
export function useDemandesDeLaTablette(characterId: string | null | undefined): DemandesDeLaTablette {
    const messages = useSessionOSStore(s => s.messages);
    const envois = useEnvoisDeLaTablette(s => s.envois);
    const [maintenant, setMaintenant] = useState(() => Date.now());

    const ouvertes = useMemo(
        () => (characterId ? demandesOuvertes(messages, characterId) : []),
        [messages, characterId],
    );
    const titres = useMemo(() => {
        const t = new Map<string, string>();
        for (const m of messages) if (m.demandeDeJet && typeof m.demandeDeJet.id === 'string') t.set(m.demandeDeJet.id, m.demandeDeJet.titre);
        return t;
    }, [messages]);

    const recents = Object.entries(envois).filter(([, instant]) => maintenant - instant < ENVOI_AFFICHE_MS);
    /* Le message s'efface seul : un rendu de plus quand le dernier envoi expire. */
    const prochaineExpiration = recents.length > 0 ? Math.min(...recents.map(([, i]) => i)) + ENVOI_AFFICHE_MS : null;
    useEffect(() => {
        if (prochaineExpiration === null) return;
        const minuterie = window.setTimeout(() => setMaintenant(Date.now()), Math.max(0, prochaineExpiration - Date.now()) + 50);
        return () => window.clearTimeout(minuterie);
    }, [prochaineExpiration]);
    /*
      Un envoi neuf se montre sans attendre : `maintenant` est antérieur à son
      instant, l'écart est négatif, donc récent. La minuterie l'efface ensuite.
    */
    return {
        aLancer: ouvertes.filter(d => envois[d.id] === undefined),
        envoyees: recents
            .filter(([id]) => titres.has(id))
            .map(([id]) => ({ id, titre: titres.get(id) ?? '' })),
    };
}
