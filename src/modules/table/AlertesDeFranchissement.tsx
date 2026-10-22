import React, { useEffect, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { gmToast } from '../../stores/useToastStore';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { useJournalStore } from '../journal/useJournalStore';
import type { Franchissement } from '../../types/drivers';
import type { SheetTemplate } from '../../data/defaultSheetTemplates';
import { herosDeLaCampagne } from './gestesDesHeros';
import { franchissementsEnAttente, noterLeFranchissement, rearmer, type FranchissementEnAttente } from './franchissements';
import { DiceEngine } from '../dice/DiceEngine';
import { avecOrigine } from '../session/logic/origineDesModifications';

const CLASSE_DU_BOUTON = 'px-3 py-1 rounded-lg border text-ui-9 font-black uppercase tracking-widest transition-colors';

/**
 * **Les seuils franchis, proposés au meneur** — la Séquelle de NOC, 2026-10-22.
 *
 * Sous le bandeau des réserves, une ligne par seuil franchi et pas encore
 * traité : « Ilya Vorn — Blessures 8 : Blessure lourde ». **Noter** écrit ce que
 * le pilote déclare (la séquelle +1) ; **Écarter** le laisse de côté. Dans les
 * deux cas la fiche retient le passage (`franchissements.ts`) : rien ne revient
 * au rechargement ni à la reconnexion d'une tablette.
 *
 * Monté avec le tableau de bord de la séance : c'est là aussi qu'il réarme les
 * seuils dont la jauge est redescendue — le moment de calme, qui les fait
 * redescendre, vit dans le même bandeau.
 */
const AlertesDeFranchissement: React.FC<{
    campaignId: string;
    franchissements: readonly Franchissement[];
    gabarit?: Pick<SheetTemplate, 'sections'>;
}> = ({ campaignId, franchissements, gabarit }) => {
    const players = useSessionOSStore(s => s.players);
    const updateCharacter = useSessionOSStore(s => s.updateCharacter);
    const heros = useMemo(() => herosDeLaCampagne(players, campaignId), [players, campaignId]);
    const libelles = useMemo(
        () => new Map((gabarit?.sections ?? []).flatMap(s => s.fields.map(f => [f.id, f.label] as const))),
        [gabarit],
    );
    const nom = (champ: string) => libelles.get(champ) ?? champ;

    // Une jauge redescendue sous son seuil le réarme : le prochain passage se proposera.
    useEffect(() => {
        for (const h of heros) {
            const maj = rearmer(franchissements, h.valeurs);
            if (maj) updateCharacter(h.joueurId, h.id, { sheetData: { ...h.valeurs, ...maj } });
        }
    }, [heros, franchissements, updateCharacter]);

    const enAttente = franchissementsEnAttente(franchissements, heros, nom);
    if (enAttente.length === 0) return null;

    const ecrire = (a: FranchissementEnAttente, noter: boolean) => {
        // Le dé du seuil (le 1D4 de Corruption de Symbaroum) se lance ici, au geste.
        const note = noter ? noterLeFranchissement(a, faces => DiceEngine.roll(faces), nom) : { maj: a.ecarter, lignes: [] };
        // Ce qui est noté se dit au journal, ci-dessous : l'historique des fiches se tait (H1).
        avecOrigine('silencieuse', () =>
            updateCharacter(a.heros.joueurId, a.heros.id, { sheetData: { ...a.heros.valeurs, ...note.maj } }));
        const quoi = `${a.heros.nom} — ${a.franchissement.label ?? nom(a.franchissement.champ)} ${a.valeur}`;
        if (noter) {
            gmToast(`${quoi} : ${note.lignes.join(', ') || a.franchissement.rappel || 'noté'}.`, 'info');
            useJournalStore.getState().addEvent({
                type: 'SYSTEM',
                title: `Seuil franchi — ${quoi}`,
                content: [a.franchissement.rappel, ...note.lignes].filter(Boolean).join('\n'),
            });
        }
    };

    return (
        <ul data-alertes-de-franchissement aria-label="Seuils franchis" className="flex flex-col gap-1 border-b border-app-border/20 bg-etat-alerte/5 px-6 py-2">
            {enAttente.map(a => (
                <li key={`${a.heros.id}-${a.franchissement.id}`} className="flex flex-wrap items-center gap-3 text-xs">
                    <AlertTriangle size={12} className="text-etat-alerte shrink-0" />
                    <span className="font-bold text-app-text">{a.heros.nom}</span>
                    <span className="text-app-text/70">
                        {a.franchissement.label ?? nom(a.franchissement.champ)} {a.valeur}
                        {a.franchissement.rappel ? ` : ${a.franchissement.rappel}` : ''}
                    </span>
                    {a.lignes.length > 0 && <span className="font-mono text-app-text/50">{a.lignes.join(' ; ')}</span>}
                    <span className="ml-auto flex gap-2">
                        <button onClick={() => ecrire(a, true)}
                            className={`${CLASSE_DU_BOUTON} border-etat-alerte/40 text-etat-alerte hover:bg-etat-alerte/10`}>
                            Noter
                        </button>
                        <button onClick={() => ecrire(a, false)}
                            title="Le seuil ne sera plus proposé tant que la jauge ne redescend pas en dessous"
                            className={`${CLASSE_DU_BOUTON} border-app-border/40 text-app-text/50 hover:border-accent/40 hover:text-accent`}>
                            Écarter
                        </button>
                    </span>
                </li>
            ))}
        </ul>
    );
};

export default AlertesDeFranchissement;
