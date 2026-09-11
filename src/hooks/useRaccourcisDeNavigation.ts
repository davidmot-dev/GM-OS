import { useEffect, useRef } from 'react';
import { useSessionStore, type ModuleID } from '../store/useSessionStore';
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
    /** L'écran quitté pour aller à l'aide — c'est là que `Ctrl+H` ramène. */
    const venuDe = useRef<ModuleID | null>(null);

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
            if (modale.type !== null) return;

            /*
              **`Ctrl+H` mène à l'aide, et ramène d'où l'on vient.**

              Une bascule, et non une ouverture : la même touche qui a fait
              apparaître la page doit la faire disparaître, sinon on cherche
              comment sortir de l'aide qu'on venait chercher.

              ⚠️ **C'était une incrustation jusqu'au 2026-09-11**, posée
              par-dessus l'écran courant pour ne pas le perdre. L'aide est
              devenue un module — le manuel des 52 guides n'aurait pas tenu dans
              une fenêtre de coup d'œil — et le retour remplace la fermeture :
              *on ne perd toujours pas son Combat-OS, on y revient.*
            */
            if (evenement.code === 'KeyH') {
                evenement.preventDefault();
                const session = useSessionStore.getState();
                if (session.activeModule === 'aide') {
                    /* Le repli sur `dashboard` couvre le cas où l'aide a été
                       ouverte par la barre latérale : il n'y a alors pas de
                       « d'où l'on vient », et rester coincé serait pire. */
                    session.setActiveModule(venuDe.current ?? 'dashboard');
                } else {
                    venuDe.current = session.activeModule;
                    session.setActiveModule('aide');
                }
                return;
            }

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
