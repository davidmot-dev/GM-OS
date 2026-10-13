import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useSessionOSStore } from '../useSessionOSStore';
import type { PlayerCharacter } from '../useSessionOSStore';
import { DEFAULT_SHEET_TEMPLATES } from '../../../data/defaultSheetTemplates';
import { ecartDeJeu, passerAuJeu } from '../logic/jeuDuPersonnage';
import { gmConfirm } from '../../../stores/useModalStore';
import { gmToast } from '../../../stores/useToastStore';

/**
 * **Le personnage suit un autre jeu que sa campagne — et on peut l'y faire passer.**
 *
 * Demandé par David le 2026-10-13, après « TEst NOC » : lié à une campagne NOC,
 * il portait la fiche de Within, et sa carte ne montrait que la campagne. Le
 * panneau de jet manquait sans que rien dise pourquoi.
 *
 * Posé sur la carte du personnage **et** en tête de sa fiche. Le bouton dit ce
 * qui sera perdu **avant** d'agir : les valeurs de l'ancienne fiche dont la
 * nouvelle n'a pas le champ.
 */
export const EcartDeJeuDuPersonnage: React.FC<{
    playerId: string;
    personnage: PlayerCharacter;
    className?: string;
}> = ({ playerId, personnage, className = '' }) => {
    const { t } = useTranslation(['modules']);
    const campaigns = useSessionOSStore(s => s.campaigns);
    const customGameDrivers = useSessionOSStore(s => s.customGameDrivers);
    const customSheetTemplates = useSessionOSStore(s => s.customSheetTemplates);
    const updateCharacter = useSessionOSStore(s => s.updateCharacter);

    const ecart = ecartDeJeu(personnage, campaigns, customGameDrivers);
    if (!ecart) return null;

    const gabarits = [...DEFAULT_SHEET_TEMPLATES, ...customSheetTemplates];
    const cible = ecart.jeuDeLaCampagne;
    const ficheDuJeu = gabarits.some(g => g.id === cible.templateId);

    const passer = (e: React.MouseEvent) => {
        e.stopPropagation();
        const { changements, perdus } = passerAuJeu(personnage, cible, gabarits);
        const message = [
            t('modules:session.characters.passer_confirm', { name: personnage.name, jeu: cible.name }),
            perdus.length
                ? t('modules:session.characters.passer_perdus', { count: perdus.length, champs: perdus.join(', ') })
                : t('modules:session.characters.passer_rien_perdu'),
        ].join(' ');
        gmConfirm(message, () => {
            updateCharacter(playerId, personnage.id, changements);
            gmToast(t('modules:session.characters.passer_fait', { name: personnage.name, jeu: cible.name }), 'success');
        });
    };

    return (
        <div
            role="status"
            className={`flex flex-wrap items-center gap-2 rounded-lg border border-etat-alerte/40 bg-etat-alerte/10 px-3 py-2 text-xs text-app-text ${className}`}
        >
            <AlertTriangle size={14} className="shrink-0 text-etat-alerte" />
            <span className="min-w-0 flex-1">
                {t('modules:session.characters.ecart_jeu', {
                    perso: ecart.jeuDuPersonnage?.name ?? t('modules:session.characters.ecart_sans_jeu'),
                    campagne: cible.name,
                })}
            </span>
            <button
                type="button"
                onClick={passer}
                disabled={!ficheDuJeu}
                title={ficheDuJeu ? undefined : t('modules:session.characters.passer_sans_fiche', { jeu: cible.name })}
                className="rounded-md border border-etat-alerte/50 px-2 py-1 font-bold text-app-text transition-colors hover:bg-etat-alerte/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
                {t('modules:session.characters.passer_au_jeu')}
            </button>
        </div>
    );
};

export default EcartDeJeuDuPersonnage;
