import { useSessionOSStore } from '../../session/useSessionOSStore';
import { useDiceStore } from '../../../stores/useDiceStore';
import { piloteDuPersonnage } from '../../session/logic/piloteDuPersonnage';
import { resolveSheetTemplate } from '../../session/logic/templateResolver';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { resoudreLeJetDeFiche, type DemandeDeJetDeFiche } from '../../dice/jetDepuisLaFiche';
import { lireLeResultatDeLaTablette } from '../../dice/resultatVenuDeLaTablette';
import { demandesOuvertes, type ResultatDeLaDemande } from '../../dice/filDesDemandes';
import type { RollResult } from '../../dice/DiceEngine';
import type { ActionRegistry } from './types';

/** Ce qui, du lancer, part avec la clôture : le titre, le total dit, le verdict. */
const resultatPourLaSuite = (titre: string, r: Pick<RollResult, 'totalDisplay' | 'degre' | 'tagSuccess'>): ResultatDeLaDemande => ({
    titre,
    totalDisplay: r.totalDisplay ?? '',
    ...(r.degre ? { degre: r.degre } : {}),
    ...(typeof r.tagSuccess === 'boolean' ? { tagSuccess: r.tagSuccess } : {}),
});

/**
 * **Un jet qui répond à une demande du meneur la clôt** — plan
 * `2026-11-11-jets-demandes-et-caches.md`, T4 (C4, C5).
 *
 * Seule une demande **ouverte**, adressée à **ce** personnage, se clôt : un
 * identifiant inconnu, déjà clos ou visant un autre ne change rien — le jet,
 * lui, s'inscrit comme tout jet. La clôture part à la tablette dans le fil,
 * pour qu'elle retire sa bannière, même après un rechargement.
 */
function cloreLaDemandeSatisfaite(demandeId: string | undefined, characterId: string, nomDuPersonnage: string, resultat: ResultatDeLaDemande) {
    if (!demandeId) return;
    const store = useSessionOSStore.getState();
    const ouverte = demandesOuvertes(store.messages, characterId).find(d => d.id === demandeId);
    if (ouverte) store.cloreLaDemande(ouverte, 'lancee', nomDuPersonnage, resultat);
}

/**
 * **Un joueur lance depuis sa fiche, sur sa tablette** — Cthulhu Hack,
 * demandé par David le 2026-09-30 : *« je voudrais que les joueurs soient
 * capables de faire les jets à partir de leur fiche sur leur tablette »*.
 *
 * ⛔ **Le trou que cette action ferme.** Le panneau de jet de la tablette
 * lançait bien — mais chez le joueur : le jet s'écrivait dans le journal de la
 * tablette et n'atteignait jamais le meneur. *Le chemin s'arrête avant le
 * moteur, et rien ne se plaint.*
 *
 * La demande ne porte **que ce que le joueur choisit** ; tout le reste se lit
 * ici, dans la fiche que le meneur détient (voir `jetDepuisLaFiche`). Le
 * personnage se retrouve par son seul `characterId` — authentifié en amont par
 * `actionPolicy`, qui refuse qu'un joueur vise la fiche d'un autre — et **le
 * `playerId` envoyé n'est pas cru** : c'est le magasin qui dit à qui il est.
 */
const jetDeFiche = (payload: unknown) => {
    const demande = payload as DemandeDeJetDeFiche | null;
    if (!demande || typeof demande.characterId !== 'string' || typeof demande.champ !== 'string'
        || (demande.genre !== 'sauvegarde' && demande.genre !== 'ressource')) return;

    const store = useSessionOSStore.getState();
    const joueur = store.players.find(p => p.characters.some(c => c.id === demande.characterId));
    const personnage = joueur?.characters.find(c => c.id === demande.characterId);
    if (!joueur || !personnage) return;

    const pilote = piloteDuPersonnage(personnage, store.campaigns, store.customGameDrivers);
    const gabarit = resolveSheetTemplate(personnage, store.campaigns, [...DEFAULT_SHEET_TEMPLATES, ...(store.customSheetTemplates ?? [])]);
    const jet = resoudreLeJetDeFiche(demande, personnage, pilote, gabarit);
    if (!jet) return;

    /*
      La fiche d'abord : si le jet partait avant, un écran qui le lirait verrait
      encore l'ancien dé à côté du résultat qui l'a fait descendre.
      `updateCharacter` et non `remoteUpdateCharacterSheetData`, qui renverrait
      l'écriture à la tablette qui vient de la demander.
    */
    if (jet.ecrire || jet.suiviCH) {
        store.updateCharacter(joueur.id, personnage.id, {
            sheetData: { ...personnage.sheetData, ...jet.suiviCH, ...(jet.ecrire ? {[jet.ecrire.champ]: jet.ecrire.valeur} : {}) },
        });
    }

    /* L'historique, le journal (au goulot de `setLastRoll`) et l'écran de la table. */
    useDiceStore.getState().setLastRoll({
        ...jet.resultat,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        title: jet.titre,
        // Pour que le pupitre propose la Fortune ou la suite d'un déclin, sur la bonne fiche.
        deFiche: { joueurId: joueur.id, characterId: personnage.id, genre: demande.genre, champ: demande.champ, modificateur: demande.modificateur },
    });
    cloreLaDemandeSatisfaite(typeof demande.demandeId === 'string' ? demande.demandeId.slice(0, 200) : undefined, personnage.id, personnage.name,
        resultatPourLaSuite(jet.titre, jet.resultat));
};

/**
 * **Un jet lancé sur la tablette, qui remonte au meneur** — demandé par David
 * le 2026-09-30 : *« que je les voie, et qu'ils soient pris en compte dans le
 * journal »*.
 *
 * Le panneau de jet de la fiche garde sa mécanique chez le joueur (composantes,
 * dés achetés, réserve commune) et envoie son résultat. On le relit champ par
 * champ (`lireLeResultatDeLaTablette`), et **le nom vient du magasin**, jamais
 * du message : un joueur ne signe pas au nom d'un autre — `actionPolicy` a déjà
 * refusé qu'il parle pour un personnage qui n'est pas le sien.
 */
const resultatDeFiche = (payload: unknown) => {
    const lu = lireLeResultatDeLaTablette(payload);
    if (!lu) return;
    const personnage = useSessionOSStore.getState().players
        .flatMap(p => p.characters)
        .find(c => c.id === lu.characterId);
    if (!personnage) return;

    /* L'historique de Dice-OS et le journal de séance, au goulot de `setLastRoll`. */
    useDiceStore.getState().setLastRoll({
        ...lu.resultat,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date(),
        title: `${personnage.name} — ${lu.titre}`,
    });
    cloreLaDemandeSatisfaite(lu.demandeId, personnage.id, personnage.name, resultatPourLaSuite(lu.titre, lu.resultat));
};

export const ficheActions: ActionRegistry = {
    'fiche:jet': jetDeFiche,
    'fiche:resultat': resultatDeFiche,
};
