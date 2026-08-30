import { useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { useRaccourcisStore } from '../stores/useRaccourcisStore';
import { useModalStore } from '../stores/useModalStore';
import { PLACES_DE_RACCOURCI } from '../data/catalogueDesModules';

/**
 * **`Ctrl+1` à `Ctrl+9` ouvrent un module.**
 *
 * Demandé par David le 2026-08-30. Ils ne font **qu'ouvrir un écran** : rien ne
 * se déclenche, rien ne se projette, aucun son ne part. C'est son choix, et
 * c'est le bon — une frappe malheureuse en séance ne coûte alors qu'un
 * changement d'onglet, quand une image projetée devant les joueurs ne se
 * rattrape pas.
 *
 * **On lit `e.code` et non `e.key`.** Sur un clavier français, le chiffre 1
 * s'obtient avec la touche `&` : `e.key` vaudrait `'&'` et le raccourci ne
 * répondrait jamais. `e.code` rend `Digit1` quelle que soit la disposition —
 * c'est déjà ce que font les pastilles de Music-OS et Sound-OS.
 *
 * Le pavé numérique est **volontairement exclu** : il est le territoire des
 * pastilles, et un meneur qui a rangé ses ambiances sur `Numpad1…9` ne doit pas
 * les voir se transformer en changement d'écran.
 */
export function useRaccourcisDeNavigation(estLaFenetreDuMJ: boolean) {
    useEffect(() => {
        /*
          Les fenêtres joueur, projecteur et tablette n'ont pas de barre
          latérale : un raccourci de navigation n'y mènerait nulle part, et
          l'écouter donnerait à un joueur prise sur ce que le meneur montre.
        */
        if (!estLaFenetreDuMJ) return;

        const auClavier = (evenement: KeyboardEvent) => {
            if (!evenement.ctrlKey && !evenement.metaKey) return;
            if (evenement.altKey || evenement.shiftKey) return;

            const cible = evenement.target;
            if (cible instanceof HTMLInputElement || cible instanceof HTMLTextAreaElement) return;
            if (cible instanceof HTMLElement && cible.isContentEditable) return;

            /*
              **Une boîte ouverte a la main sur le clavier.** Sans cela,
              `Ctrl+5` changerait le module *derrière* la boîte : le meneur
              refermerait sa fiche de campagne pour se retrouver ailleurs sans
              savoir quand il y était allé.

              Seul l'écran d'aide fait exception, et pour lui-même : c'est la
              boîte qu'on ouvre et referme de la même touche.
            */
            const modale = useModalStore.getState();
            const aideOuverte = modale.customVariant === 'aide-du-meneur' && modale.type === 'custom';
            if (modale.type !== null && !aideOuverte) return;

            /*
              **`Ctrl+H` ouvre et referme l'écran du meneur.**

              Une bascule, et non une ouverture : la même touche qui a fait
              apparaître la page doit la faire disparaître, sinon on cherche
              comment sortir de l'aide qu'on venait chercher.

              Elle passe **par-dessus** l'écran courant. Perdre son Combat-OS
              pour se rappeler quelle touche ouvre Image-OS coûterait plus cher
              que la question ne vaut.
            */
            if (evenement.code === 'KeyH') {
                evenement.preventDefault();
                if (aideOuverte) modale.closeModal();
                else modale.showCustom('aide-du-meneur');
                return;
            }

            // Les places n'ouvrent rien tant que l'aide est devant : on la
            // referme d'abord, sinon le module changerait sous une page qui le
            // cache.
            if (aideOuverte) return;

            const correspondance = /^Digit([1-9])$/.exec(evenement.code);
            if (!correspondance) return;

            const rang = Number(correspondance[1]) - 1;
            if (rang < 0 || rang >= PLACES_DE_RACCOURCI) return;

            const module = useRaccourcisStore.getState().places[rang];
            /*
              Une place libre laisse passer la frappe. `Ctrl+3` non assigné doit
              rester ce qu'il était pour le navigateur, pas devenir un geste
              muet qui laisse croire à une panne.
            */
            if (!module) return;

            evenement.preventDefault();
            useSessionStore.getState().setActiveModule(module);
        };

        window.addEventListener('keydown', auClavier);
        return () => window.removeEventListener('keydown', auClavier);
    }, [estLaFenetreDuMJ]);
}
