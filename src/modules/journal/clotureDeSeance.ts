import { useJournalStore } from './useJournalStore';
import { relevePourLaSuite } from './compteRendu';
import type { SessionSnapshot } from './types';
import type { Acte, Scene } from '../../types/trame.types';

/**
 * Clore le journal quand une séance se termine.
 *
 * **Le chaînon qui manquait, trouvé le 2026-08-17.** `stopJournal` n'était
 * appelé que depuis `setActiveCampaign` — donc **terminer une séance ne fermait
 * pas son journal**, et il restait ouvert jusqu'à ce qu'on change de campagne.
 * Pire : aucun appelant ne lui passait d'instantané, si bien que **toute la
 * branche `SessionSnapshot` de `stopJournal` n'avait jamais tourné**. Du code
 * écrit, testé par personne, et mort depuis toujours.
 *
 * *Un module que personne ne regarde tourner accumule des défauts qu'aucune
 * revue de code ne trouve* — David n'a jamais utilisé Journal-OS, et c'est
 * l'explication de fond de tout ce qu'on y trouve.
 *
 * **Les stores sont atteints par le global**, comme le fait déjà `useCombatStore` :
 * un import direct fermerait un cycle entre le journal et la séance. Et toute
 * absence est traitée comme un cas normal — *une séance ne doit pas échouer à se
 * terminer parce qu'un module n'a pas encore été monté.*
 */
export function cloturerLeJournalDeLaSeance(campaignId: string | null | undefined): void {
    try {
        const journal = useJournalStore.getState();
        // Rien à clore : la séance n'enregistrait pas.
        if (!journal.isRecording) return;

        journal.stopJournal(releverLEtatDeFin(campaignId), releverLaSuite(campaignId));
    } catch (err) {
        console.error('[Journal] Clôture de séance impossible :', err);
    }
}

/** Ce que la table montre au moment où l'on s'arrête. */
function releverLEtatDeFin(campaignId: string | null | undefined): SessionSnapshot {
    const s = magasinDeSeance();
    const seance = (s?.sessions ?? []).find(x => x.campaignId === campaignId && x.status === 'active');

    /*
      La santé n'est relevée que si le jeu en compte. Écrire un `0` là où le jeu
      n'a pas de jauge inventerait un mourant — c'est la règle du module de
      santé, et le compte rendu écrivait « undefined/undefined » avant elle.
    */
    const presentPCs = (s?.players ?? [])
        .flatMap(p => p.characters ?? [])
        .filter(c => c.campaignId === campaignId)
        .map(c => ({
            name: c.name,
            ...(typeof c.hp === 'number' ? { hp: c.hp } : {}),
            ...(typeof c.maxHp === 'number' ? { maxHp: c.maxHp } : {}),
            state: 'présent',
        }));

    const sessionEntities = (s?.entities ?? [])
        .filter(e => e.campaignId === campaignId && (seance?.sessionEntityIds ?? []).includes(e.id))
        .map(e => ({
            name: e.name,
            ...(typeof e.hp === 'number' ? { hp: e.hp } : {}),
            status: e.status ?? 'inconnu',
        }));

    const pendingChecklist = (seance?.checklist ?? [])
        .filter(item => !item.isCompleted)
        .map(item => item.text);

    const clocks = (magasinDHorloges()?.tensions ?? [])
        .map(c => ({ name: c.name, filled: c.filledSegments, total: c.totalSegments }));

    /*
      **Les notes prises pendant la séance, enfin ramassées.**

      `stopJournal` sait depuis toujours quoi faire de `snapshot.notes` : il en
      fait un événement `NOTE`, donc de nature `chronique`, donc **la seule
      matière écrite de la main du meneur qui parte au résumé**. Mais aucun
      appelant ne remplissait ce champ — `sessionNotes` restait sur la séance,
      lue par deux écrans et par personne d'autre.

      Le meneur qui note « Milo avoue avoir menti » pendant la partie écrivait
      donc la phrase la plus utile de la soirée à l'endroit exact où le résumé ne
      la lirait jamais. *Une branche prête à recevoir une donnée que personne ne
      lui passe ne se distingue pas d'une branche morte.*
    */
    const notes = seance?.sessionNotes?.trim();

    return {
        ...(notes ? { notes } : {}),
        presentPCs,
        sessionEntities,
        pendingChecklist,
        clocks,
    };
}

/** Ce qui reste devant, lu sur la trame. */
function releverLaSuite(campaignId: string | null | undefined) {
    const s = magasinDeSeance();
    if (!s) return undefined;
    return relevePourLaSuite(
        (s.actes ?? []) as Acte[],
        (s.scenes ?? []) as Scene[],
        s.clues ?? [],
        campaignId,
    );
}

function magasinDeSeance() {
    return (window as unknown as {
        useSessionOSStore?: { getState: () => {
            sessions?: {
                id: string; campaignId: string; status: string;
                sessionEntityIds?: string[];
                checklist?: { text: string; isCompleted: boolean }[];
                /** Ce que le meneur a écrit pendant la partie. */
                sessionNotes?: string;
            }[];
            players?: { characters?: { name: string; campaignId?: string | null; hp?: number; maxHp?: number }[] }[];
            entities?: { id: string; name: string; campaignId: string; hp?: number; status?: string }[];
            clues?: { campaignId: string; title: string; isRevealed: boolean }[];
            actes?: Acte[];
            scenes?: Scene[];
        } };
    }).useSessionOSStore?.getState();
}

function magasinDHorloges() {
    return (window as unknown as {
        useClockStore?: { getState: () => {
            tensions?: { name: string; filledSegments: number; totalSegments: number }[];
        } };
    }).useClockStore?.getState();
}
