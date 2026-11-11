import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AlarmClock } from 'lucide-react';
import { useClockStore } from '../../../store/useClockStore';
import { rappelsEnAttente, type RappelEnAttente } from '../logic/rappelDeLaJauge';
import CarteVolante from '../../../components/CarteVolante';
import { useCartesEphemeres } from '../../../hooks/useCartesEphemeres';
import BoutonsDuRappel from './BoutonsDuRappel';

/**
 * **Le rappel d'une jauge, 5 secondes dans la carte volante** — lot 2
 * (`documentation/Planning/2026-11-11-rappel-de-jet-du.md`, T5). David, 11/11 :
 * « bandeau + carte 5 s ». La ligne du cockpit (`RappelsDesJauges`) reste
 * jusqu'à « Fait » ; la carte se voit **hors du cockpit**, quand un rappel
 * **s'allume**.
 *
 * Seuls comptent les rappels qui s'allument **après l'ouverture** : ceux qui
 * attendaient déjà sont au cockpit, les rejouer à chaque démarrage serait du
 * bruit. Un rappel traité qui revient au passage suivant s'allume à nouveau.
 */

const DUREE_DE_LA_FENETRE = 5000;

type Carte = RappelEnAttente & { id: string };

export const RappelsVolants: React.FC = () => {
    const { t } = useTranslation('modules');
    const tensions = useClockStore(s => s.tensions);
    const { cartes, ajouter, retirer } = useCartesEphemeres<Carte>(DUREE_DE_LA_FENETRE);
    /** Les rappels allumés au dernier passage — `null` avant le premier : rien à annoncer. */
    const allumes = useRef<Set<string> | null>(null);

    useEffect(() => {
        const enAttente = rappelsEnAttente(tensions);
        const avant = allumes.current;
        allumes.current = new Set(enAttente.map(r => r.jaugeId));
        if (!avant) return;
        ajouter(enAttente.filter(r => !avant.has(r.jaugeId)).map(r => ({ ...r, id: `${r.jaugeId}-${Date.now()}` })));
    }, [tensions, ajouter]);

    return (
        <>
            {cartes.slice(-3).map(carte => (
                <CarteVolante key={carte.id} etiquette={t('clock.rappel_carte')}
                    sousTitre={`${carte.nom} — ${carte.bout === 'vide' ? t('clock.rappel_a_vide') : t('clock.rappel_au_plein')}`}
                    icone={<AlarmClock size={16} />} dureeMs={DUREE_DE_LA_FENETRE} onFermer={() => retirer(carte.id)}
                    ariaLabel={`${t('clock.rappel_carte')} : ${carte.nom}`} marque="rappel-de-jauge">
                    <p className="text-base font-black line-clamp-3 leading-snug pl-1 text-app-text">{carte.texte}</p>
                    {/* Répondre d'ici, quel que soit l'écran ouvert (David : « je ne vois pas de Fait »). */}
                    <div className="mt-3 pl-1"><BoutonsDuRappel rappel={carte} apres={() => retirer(carte.id)} /></div>
                </CarteVolante>
            ))}
        </>
    );
};

export default RappelsVolants;
