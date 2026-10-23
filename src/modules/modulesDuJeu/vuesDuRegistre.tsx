import { lazy, Suspense, Component, type ReactNode } from 'react';
import type { CommandeDeModule, ResultatDeModule } from './protocole';
import type { VueMuthurMJ, VueMuthurJoueur } from '../../../outils/alien/modules/muthur/moteur.mjs';
import type { EtatDetecteur } from '../../../outils/alien/modules/detecteur/moteur.mjs';
import '../../../outils/alien/modules/muthur/style.css';
import '../../../outils/alien/modules/detecteur/style.css';
import '../../../outils/star-trek/lcars/style.css';
import type { VueLcarsMJ, VueLcarsJoueur } from '../../../outils/star-trek/lcars/moteur.mjs';

type Props = { vue: unknown; horloge?: () => number; envoyerCommande: (commande: CommandeDeModule) => Promise<ResultatDeModule> };
const vueTmr = lazy(async () => {
    const { VuesTMR } = await import('./tmr/VuesTMR');
    return { default: (props: Props) => <VuesTMR {...props} vue={props.vue as import('../../../outils/reve-de-dragon/tmr/moteur.mjs').VueTMRMJ | import('../../../outils/reve-de-dragon/tmr/moteur.mjs').VueTMRJoueur} /> };
});
const mjTmr = lazy(async () => {
    const { PupitreTMR } = await import('./tmr/PupitreTMR');
    return { default: (props: Props) => <PupitreTMR {...props} vue={props.vue as import('../../../outils/reve-de-dragon/tmr/moteur.mjs').VueTMRMJ} /> };
});
const joueurLcars = lazy(async () => {
    const { VueJoueur } = await import('../../../outils/star-trek/lcars/vues.mjs');
    return { default: (props: Props) => <VueJoueur {...props} vue={props.vue as VueLcarsJoueur} /> };
});
const mjLcars = lazy(async () => {
    const { PupitreMJ } = await import('../../../outils/star-trek/lcars/vues.mjs');
    return { default: (props: Props) => <PupitreMJ {...props} vue={props.vue as VueLcarsMJ} /> };
});
const joueurMuthur = lazy(async () => {
    const { VueJoueur } = await import('../../../outils/alien/modules/muthur/vues.mjs');
    return { default: (props: Props) => <VueJoueur vue={props.vue as VueMuthurJoueur} horloge={props.horloge} envoyerCommande={props.envoyerCommande} /> };
});
const mjMuthur = lazy(async () => {
    const { PupitreMJ } = await import('../../../outils/alien/modules/muthur/vues.mjs');
    return { default: (props: Props) => <PupitreMJ vue={props.vue as VueMuthurMJ} envoyerCommande={props.envoyerCommande} /> };
});
const joueurDetecteur = lazy(async () => {
    const { VueJoueur } = await import('../../../outils/alien/modules/detecteur/vues.mjs');
    return { default: (props: Props) => <VueJoueur vue={props.vue as EtatDetecteur} horloge={props.horloge} envoyerCommande={props.envoyerCommande} /> };
});
const mjDetecteur = lazy(async () => {
    const { PupitreMJ } = await import('../../../outils/alien/modules/detecteur/vues.mjs');
    return { default: (props: Props) => <PupitreMJ vue={props.vue as EtatDetecteur} envoyerCommande={props.envoyerCommande} /> };
});
const joueurCombatSpatial = lazy(async () => {
    const { VueEquipage } = await import('./combatSpatial/VuesCombatSpatial');
    return { default: (props: Props) => <VueEquipage vue={props.vue as import('../../../outils/alien/modules/combat-spatial/moteur.mjs').VueCombatSpatial} envoyerCommande={props.envoyerCommande} /> };
});
const mjCombatSpatial = lazy(async () => {
    const { PupitreCombatSpatial } = await import('./combatSpatial/VuesCombatSpatial');
    return { default: (props: Props) => <PupitreCombatSpatial vue={props.vue as import('../../../outils/alien/modules/combat-spatial/moteur.mjs').VueCombatSpatial} envoyerCommande={props.envoyerCommande} /> };
});
const REGISTRE_DES_VUES = new Map([
    ['rdd-tmr', { joueur: vueTmr, mj: mjTmr }],
    ['star-trek-lcars', { joueur: joueurLcars, mj: mjLcars }],
    ['alien-muthur', { joueur: joueurMuthur, mj: mjMuthur }],
    ['alien-detecteur', { joueur: joueurDetecteur, mj: mjDetecteur }],
    ['alien-combat-spatial', { joueur: joueurCombatSpatial, mj: mjCombatSpatial }],
]);
class GardeDuModule extends Component<{ children: ReactNode }, { echec: boolean }> {
    state = { echec: false };
    static getDerivedStateFromError() { return { echec: true }; }
    render() { return this.state.echec ? <p role="alert" className="p-4 text-etat-danger">Le module n’a pas pu s’afficher. Reviens à la liste pour le rouvrir.</p> : this.props.children; }
}
export function VueDeModule({ id, role, ...props }: Props & { id: string; role: 'mj' | 'joueur' }) {
    const Vue = REGISTRE_DES_VUES.get(id)?.[role];
    return Vue ? <GardeDuModule><Suspense fallback={<p className="p-4 text-app-muted">Ouverture du module…</p>}><Vue {...props} /></Suspense></GardeDuModule>
        : <p className="text-app-muted">Ce module est indisponible dans cette version.</p>;
}
