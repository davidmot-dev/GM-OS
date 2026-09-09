import { useEffect } from 'react';
import { useLightStore } from './useLightStore';
import { hueEngine } from './HueEngine';
import { estUneFrappeDePastille } from '../../utils/frappeDePastille';

/**
 * **Le clavier de Light-OS — une touche lance une scène, Échap l'arrête.**
 *
 * ⛔ Le guide le promettait depuis toujours ; `keyCode` n'avait **ni lecteur ni
 * écrivain** dans tout le dépôt. Branché le 2026-09-07.
 *
 * **Il est monté globalement**, dans `GlobalKeybinds`, exactement comme les
 * pastilles de Sound-OS et de Music-OS : *une scène qu'il faut ouvrir Light-OS
 * pour lancer n'a aucun intérêt* — le geste existe pour changer l'ambiance
 * **sans quitter ses notes**.
 *
 * ⚠️ **Troisième écouteur du clavier sur `window`.** Les trois sont
 * indépendants : une même touche peut donc lancer un son **et** sa lumière, ce
 * qui est un cumul utile. Ce qui ne l'est pas — deux scènes sur la même touche —
 * est écarté à l'écriture par `setSceneKeyCode`.
 */
export const useLightKeyboardControls = () => {
    useEffect(() => {
        const auClavier = (evenement: KeyboardEvent) => {
            /*
              La garde est partagée avec Sound-OS et Music-OS. Elle écarte les
              champs de saisie, les boîtes ouvertes, et les frappes tenues avec
              Ctrl/Alt/Cmd — `e.code` ignore les modificateurs, donc `Ctrl+C`
              produit `KeyC` et lancerait la scène liée à la touche C.
            */
            if (!estUneFrappeDePastille(evenement)) return;

            const etat = useLightStore.getState();
            const touche = evenement.code;

            // Mode apprentissage : la frappe s'inscrit au lieu d'agir.
            if (etat.sceneEnApprentissage) {
                evenement.preventDefault();
                /*
                  **Échap annule au lieu d'apprendre.** Sans cette porte, entrer
                  en apprentissage par erreur obligerait à sacrifier une touche
                  pour en sortir.
                */
                if (touche === 'Escape') {
                    etat.apprendreUneTouche(null);
                    return;
                }
                etat.setSceneKeyCode(etat.sceneEnApprentissage, touche);
                return;
            }

            /*
              **Échap arrête la scène en cours.** Choisi par David le
              2026-09-09 : c'est la touche universelle du « sortir », et la seule
              qu'on puisse réserver sans rien retirer au meneur — l'apprentissage
              l'utilise déjà pour s'annuler, elle ne peut donc **pas** être
              attribuée à une tuile par l'écran.

              ⚠️ Elle est lue **avant** la recherche par touche : une sauvegarde
              ancienne qui porterait `Escape` sur une tuile ne la lancerait pas.
              *Une touche réservée qui ne l'est qu'à l'écriture ne l'est pas.*

              ⛔ Et elle ne fait rien quand **aucune scène ne joue** — même règle
              que le bouton de la barre latérale : le retour vise l'éclairage
              normal, donc un « arrêter » sur une pièce au repos l'**allumerait**.
              *Le geste d'arrêt ne doit jamais être un geste d'allumage.*

              La garde partagée écarte déjà les champs de saisie et les boîtes
              ouvertes : Échap y garde son rôle habituel de fermeture.
            */
            if (touche === 'Escape') {
                if (!etat.activeSceneId) return;
                evenement.preventDefault();
                hueEngine.revenirALEclairageNormal();
                return;
            }

            const scene = Object.values(etat.scenes).find(s => s.keyCode === touche);
            if (!scene) return;

            /*
              **Une tuile vide ne répond pas.** Elle n'a l'état d'aucune lampe :
              l'appliquer ne ferait rien, et la touche passerait pour morte.
              `clearScene` retire déjà la touche, mais une sauvegarde ancienne
              peut en porter une.
            */
            if (Object.keys(scene.lightStates).length === 0) return;

            evenement.preventDefault();
            hueEngine.applyScene(scene.id);
        };

        window.addEventListener('keydown', auClavier);
        return () => window.removeEventListener('keydown', auClavier);
    }, []);
};

/**
 * `KeyA` → `A`, `Numpad1` → `Pavé 1`, `Digit2` → `2`.
 *
 * *On montre la touche telle qu'elle est gravée sur le clavier*, pas le nom que
 * le navigateur lui donne : `KeyA` sur une tuile ne se lit pas.
 */
export const toucheLisible = (code: string | undefined): string => {
    if (!code) return '';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    if (code.startsWith('Numpad')) return `⌨${code.slice(6)}`;
    if (code.startsWith('Arrow')) return code.slice(5);
    return code;
};
