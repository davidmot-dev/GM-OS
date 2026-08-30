import React from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Keyboard } from 'lucide-react';
import { useRaccourcisStore } from '../../stores/useRaccourcisStore';
import {
    CATALOGUE_DES_MODULES,
    MODULES_ATTEIGNABLES,
    PLACES_DE_RACCOURCI,
} from '../../data/catalogueDesModules';
import type { ModuleID } from '../../store/useSessionStore';

/**
 * **Les neuf places de `Ctrl+1` à `Ctrl+9`.**
 *
 * Vingt modules, neuf touches : c'est au meneur de dire lesquels, parce que les
 * modules d'une séance ne sont pas les mêmes selon le jeu qu'on mène. Le reste
 * s'atteint par la palette (`Ctrl+K`), qui les connaît tous.
 */
const RaccourcisDeNavigation: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const places = useRaccourcisStore(s => s.places);
    const assignerLaPlace = useRaccourcisStore(s => s.assignerLaPlace);
    const reinitialiser = useRaccourcisStore(s => s.reinitialiser);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                    <Keyboard size={12} /> Raccourcis de navigation
                </p>
                <button
                    onClick={reinitialiser}
                    className="text-[10px] text-accent font-bold uppercase transition-opacity hover:opacity-70 flex items-center gap-1.5"
                >
                    <RotateCcw size={11} /> Par défaut
                </button>
            </div>

            <p className="text-[11px] text-app-text/50 leading-relaxed px-1">
                Ces touches <strong>ouvrent un écran</strong>, rien de plus : aucune ne
                déclenche de son, de projection ni de jet. Le pavé numérique reste aux
                pastilles de Music-OS et Sound-OS. Tout le reste s'atteint par{' '}
                <span className="font-mono text-app-text/70">Ctrl+K</span>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Array.from({ length: PLACES_DE_RACCOURCI }, (_, rang) => (
                    <div
                        key={rang}
                        className="flex bg-app-bg border border-app-border rounded-xl overflow-hidden shadow-inner h-[38px]"
                    >
                        <span className="bg-app-surface text-app-text/60 text-[10px] font-mono px-2.5 flex items-center border-r border-app-border shrink-0">
                            Ctrl+{rang + 1}
                        </span>
                        <select
                            value={places[rang] ?? ''}
                            onChange={(e) => assignerLaPlace(rang, (e.target.value || null) as ModuleID | null)}
                            title={`Module ouvert par Ctrl+${rang + 1}`}
                            aria-label={`Module ouvert par Ctrl+${rang + 1}`}
                            className="w-full bg-transparent px-2 text-sm text-app-text outline-none"
                        >
                            {/*
                              Une place peut rester libre, et la frappe passe
                              alors au navigateur : un raccourci muet laisserait
                              croire à une panne.
                            */}
                            <option value="">— libre —</option>
                            {MODULES_ATTEIGNABLES.map(id => (
                                <option key={id} value={id}>{t(CATALOGUE_DES_MODULES[id].cle)}</option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RaccourcisDeNavigation;
