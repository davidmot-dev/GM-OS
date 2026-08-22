import type { CurrentView } from '../../types/campaign.types';
import type { MomentDeJeu } from '../ai/budgetsDeTemps';

/**
 * **À quel moment chaque écran appartient — axe N, premier temps.**
 *
 * *« La partition existe déjà de fait dans `CurrentView`, et David l'a même
 * appliquée à un module : `session-prep` / `session-focus`. »* Elle n'était
 * simplement écrite nulle part, donc rien ne pouvait s'en servir.
 *
 * **Ce qui change entre les deux régimes n'est pas la liste des boutons** — le
 * plan est net là-dessus — mais *« la densité, les valeurs par défaut, et ce qui
 * est à portée de main »*. Ce classement sert la troisième : savoir qu'un écran
 * de préparation n'a rien à faire devant soi quand la table attend.
 *
 * **Exhaustif par construction.** `Record<CurrentView, …>` refuse de compiler si
 * une vue naît sans être classée. *Une table qu'on tient à la main finit
 * incomplète, et son trou ne se voit pas* — c'est le motif que ce dépôt a
 * rencontré tout le 22/08.
 */

export type Affinite = 'preparation' | 'partie' | 'les-deux';

/**
 * Le classement du § « axe N » du plan du 2026-08-07, **complété**.
 *
 * Trois vues manquaient à sa table parce qu'elles sont nées après elle :
 * `campaign-details`, `campaign-form` et `trame`. Les deux premières éditent une
 * campagne — de la préparation. La **trame**, elle, se consulte des deux côtés :
 * on la bâtit le samedi matin et on la suit le samedi soir.
 */
export const AFFINITE_DES_VUES: Record<CurrentView, Affinite> = {
    // On y travaille avant, et on n'y touche pas pendant.
    forge: 'preparation',
    'rule-workshop': 'preparation',
    'template-editor': 'preparation',
    'driver-editor': 'preparation',
    templates: 'preparation',
    library: 'preparation',
    'campaign-editor': 'preparation',
    'campaign-details': 'preparation',
    'campaign-form': 'preparation',
    'session-prep': 'preparation',
    storyboard: 'preparation',
    'deck-library': 'preparation',

    // On y est pendant qu'on joue.
    'session-focus': 'partie',
    'deck-player': 'partie',
    rulebook: 'partie',

    // Les deux, et ce n'est pas un aveu d'indécision : on les bâtit le samedi
    // matin et on les consulte le samedi soir.
    cockpit: 'les-deux',
    'npc-gallery': 'les-deux',
    'world-atlas': 'les-deux',
    'social-graph': 'les-deux',
    'timeline-wiki': 'les-deux',
    players: 'les-deux',
    trame: 'les-deux',
};

/**
 * Cet écran a-t-il sa place à ce moment-là ?
 *
 * **`les-deux` convient partout**, et c'est la majorité — *le classement sert à
 * repérer les deux extrémités, pas à cloisonner l'application.*
 */
export function vueConvientAu(moment: MomentDeJeu, vue: CurrentView): boolean {
    const affinite = AFFINITE_DES_VUES[vue];
    return affinite === 'les-deux' || affinite === moment;
}

/**
 * L'écran vers lequel on bascule quand celui qu'on quitte ne convient plus.
 *
 * **Le cockpit dans les deux cas, et c'est délibéré.** Il convient aux deux
 * moments, il porte le bouton de séance et le rail de navigation : *on rend la
 * main au meneur, on ne le téléporte pas dans un écran qu'il n'a pas demandé.*
 */
export function vueDeRepli(): CurrentView {
    return 'cockpit';
}

/** Les vues d'un moment donné — pour un écran qui voudrait les grouper. */
export function vuesDuMoment(moment: MomentDeJeu): CurrentView[] {
    return (Object.keys(AFFINITE_DES_VUES) as CurrentView[])
        .filter(v => AFFINITE_DES_VUES[v] === moment);
}
