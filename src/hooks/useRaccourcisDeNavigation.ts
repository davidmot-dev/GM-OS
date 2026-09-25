import { useEffect, useRef } from 'react';
import { useSessionStore, type ModuleID } from '../store/useSessionStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useRaccourcisStore } from '../stores/useRaccourcisStore';
import { useModalStore } from '../stores/useModalStore';
import { PLACES_DE_RACCOURCI } from '../data/catalogueDesModules';
import { effacerLePlayerHub } from '../modules/image/logic/effacerLePlayerHub';
import { noircirLePlayerHub } from '../modules/image/logic/noircirLePlayerHub';

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
            if (evenement.altKey) return;
            /*
              **`Maj` n'est admis que pour le N** — `Ctrl+Maj+N`, l'écran noir.
              Voir plus bas pourquoi ce n'est plus `Ctrl+Maj+0`.
            */
            if (evenement.shiftKey && evenement.code !== 'KeyN') return;

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

            /*
              **`Ctrl+T` ouvre Table-OS, `Ctrl+²` ramène au Cockpit** —
              demandés par David le 2026-09-25.

              Deux places fixes, hors des neuf qu'on assigne : elles ne
              dépendent pas du rangement de la barre. Le Cockpit est une *vue*
              de Session-OS et non un module — d'où les deux gestes : ouvrir
              Session-OS, puis y choisir la vue. Sans le second, on
              reviendrait sur la dernière vue ouverte (la galerie de PNJ, la
              trame…), ce qui n'est pas « revenir au Cockpit ».

              `²` est la touche à gauche du 1 sur un clavier français : la
              place zéro, devant `Ctrl+1…9`. Son `code` est `Backquote`, quelle
              que soit la disposition.
            */
            if (evenement.code === 'KeyT') {
                evenement.preventDefault();
                useSessionStore.getState().setActiveModule('table');
                return;
            }
            if (evenement.code === 'Backquote') {
                evenement.preventDefault();
                useSessionStore.getState().setActiveModule('dashboard');
                useSessionOSStore.getState().setCurrentView('cockpit');
                return;
            }

            /*
              **`Ctrl+0` vide le Player Hub** — demandé par David le 2026-09-13 :
              *« en tant que MJ je ne vois pas toujours l'écran Player Hub »*. Ce
              qu'on y laisse traîner y reste, faute de le voir.

              ⛔ **C'est la seule exception à la règle énoncée en tête de ce
              fichier** — *« rien ne se déclenche, rien ne se projette »* — et
              elle mérite d'être dite plutôt que glissée. Le motif de cette règle
              est qu'*une image projetée devant les joueurs ne se rattrape pas* :
              or ce geste ne peut que **retirer**, jamais montrer. Une frappe
              malheureuse coûte une projection à refaire, pas un secret éventé.
              *L'asymétrie est ce qui autorise l'exception.*

              Le « 0 » se lit comme « rien », et il tombe à côté des neuf places
              de modules — même famille de touches, mêmes gardes.
            */
            if (evenement.code === 'Digit0') {
                evenement.preventDefault();
                /*
                  Depuis le 2026-09-17, le Hub au repos rend le **décor de la
                  campagne** : `Ctrl+0` retire donc ce qui est projeté et laisse
                  l'image de fond. Pour **éteindre vraiment** l'écran de la
                  table, c'est `Ctrl+Maj+N` — David a voulu garder les deux.
                */
                effacerLePlayerHub(window.appBridge);
                return;
            }

            /*
              **`Ctrl+Maj+N` éteint le Player Hub** — N comme *noir*.

              ⛔ **C'était `Ctrl+Maj+0` jusqu'au 2026-09-25, et ce geste n'a
              jamais rien éteint, deux fois de suite.** D'abord parce que la
              garde d'entrée rejetait toute frappe avec `Maj` : la branche était
              inatteignable. Puis, une fois la garde réparée, parce que
              **Windows réserve `Ctrl+Maj+0`** — raccourci de bascule de
              disposition clavier (`HKCU\Control Panel\Input Method\Hot Keys\
              00000104`), le même qui prive Excel de « afficher les colonnes ».
              La frappe n'atteint aucune fenêtre ; l'essai, qui envoie le
              `keydown` lui-même, passait au vert. *Un essai qui fabrique
              l'événement ne dit rien de ce que le système laisse passer.*

              ⚠️ **Ne pas choisir une touche de cette liste Windows** : on y
              trouve aussi `Ctrl+Espace` et `Ctrl+.`.

              L'exception à *« rien ne se déclenche, rien ne se projette »*
              tient comme pour `Ctrl+0`, et pour la même raison : **ce geste ne
              peut que retirer.**
            */
            if (evenement.code === 'KeyN' && evenement.shiftKey) {
                evenement.preventDefault();
                noircirLePlayerHub(window.appBridge);
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
