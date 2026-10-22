import { useEffect } from 'react';
import { useSessionOSStore } from '../useSessionOSStore';
import { useJournalStore } from '../../journal/useJournalStore';
import { resolveSheetTemplate } from '../logic/templateResolver';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { origineCourante, type OrigineDeModification } from '../logic/origineDesModifications';
import {
    CHAMPS_NARRATIFS, SEUIL_D_UN_CHARGEMENT, changementsDeFiche, cumuler, direLeChangement,
    type ChangementDeChamp,
} from '../logic/historiqueDesFiches';
import type { PlayerCharacter } from '../store/types';

/** Le calme après lequel un moment se dit : assez pour un curseur, pas assez pour mélanger deux gestes. */
const DELAI_DU_MOMENT = 5_000;

const LIBELLES_NARRATIFS: Record<string, string> = {
    description: 'Description', playerNotes: 'Notes du joueur', gmNotes: 'Notes du meneur', inventory: 'Inventaire',
};

/**
 * **L'historique des fiches au journal de séance** — H1 de l'audit du
 * 2026-10-22, décision de David : *toutes* les modifications, avec leur
 * origine (`origineDesModifications.ts`).
 *
 * Un seul observateur, au poste du meneur, comme `useSuiviSanteVoyageur` : il
 * voit aussi ce qu'une tablette envoie quand aucune fiche n'est ouverte. Les
 * changements d'un même personnage et d'une même origine se cumulent, puis se
 * disent en une ligne après cinq secondes de calme : « Fiche — Ilya Vorn
 * (tablette) : Force 3 → 4 ». Ce que le journal dit déjà (`silencieuse`) et un
 * chargement entier (`SEUIL_D_UN_CHARGEMENT`) ne se disent pas.
 *
 * Le journal n'écrit qu'en séance enregistrée (`addEvent`, type `PJ`).
 */
export function useHistoriqueDesFiches(actif: boolean) {
    useEffect(() => {
        if (!actif) return;
        const moments = new Map<string, {
            personnage: PlayerCharacter;
            origine: OrigineDeModification;
            champs: Map<string, ChangementDeChamp>;
            minuterie: ReturnType<typeof setTimeout>;
        }>();

        const dire = (cle: string) => {
            const moment = moments.get(cle);
            moments.delete(cle);
            if (!moment || moment.champs.size === 0) return;
            const etat = useSessionOSStore.getState();
            const gabarit = resolveSheetTemplate(moment.personnage, etat.campaigns ?? [],
                [...DEFAULT_SHEET_TEMPLATES, ...(etat.customSheetTemplates ?? [])]);
            const libelles = new Map((gabarit?.sections ?? []).flatMap(s => s.fields.map(f => [f.id, f.label] as const)));
            const lignes = [...moment.champs.values()].map(c =>
                direLeChangement(c, LIBELLES_NARRATIFS[c.champ] ?? libelles.get(c.champ) ?? c.champ));
            const origine = moment.origine === 'meneur' ? '' : ` (${moment.origine})`;
            useJournalStore.getState().addEvent({
                type: 'PJ',
                title: `Fiche — ${moment.personnage.name}${origine}`,
                content: lignes.join('\n'),
                nature: 'trace',
                metadata: { characterId: moment.personnage.id, origine: moment.origine },
            });
        };

        const arreter = useSessionOSStore.subscribe((etat, precedent) => {
            if (etat.players === precedent.players) return;
            const origine = origineCourante();
            if (origine === 'silencieuse') return;
            const avant = new Map(precedent.players.flatMap(p => p.characters).map(c => [c.id, c]));
            for (const personnage of etat.players.flatMap(p => p.characters)) {
                const ancien = avant.get(personnage.id);
                // Un personnage qui naît, ou qui ne bouge pas, n'a rien à dire.
                if (!ancien || ancien === personnage) continue;
                const narratifs = (c: PlayerCharacter) =>
                    Object.fromEntries(CHAMPS_NARRATIFS.map(champ => [champ, c[champ]]));
                const changements = [
                    ...(ancien.sheetData === personnage.sheetData ? [] : changementsDeFiche(ancien.sheetData, personnage.sheetData)),
                    ...changementsDeFiche(narratifs(ancien), narratifs(personnage)),
                ];
                if (changements.length === 0 || changements.length > SEUIL_D_UN_CHARGEMENT) continue;
                const cle = `${personnage.id}|${origine}`;
                const moment = moments.get(cle);
                if (moment) clearTimeout(moment.minuterie);
                const champs = moment?.champs ?? new Map<string, ChangementDeChamp>();
                cumuler(champs, changements);
                moments.set(cle, { personnage, origine, champs, minuterie: setTimeout(() => dire(cle), DELAI_DU_MOMENT) });
            }
        });

        return () => {
            arreter();
            // Ce qui attendait se dit avant de partir : rien ne se perd au démontage.
            for (const [cle, moment] of moments) { clearTimeout(moment.minuterie); dire(cle); }
        };
    }, [actif]);
}
