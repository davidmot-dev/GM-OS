import { lazy, Suspense, Component, type ReactNode } from 'react';
import type { CommandeDeModule, ResultatDeModule } from './protocole';
import type { VueMuthurMJ, VueMuthurJoueur } from '../../../outils/alien/modules/muthur/moteur.mjs';
import type { EtatDetecteur } from '../../../outils/alien/modules/detecteur/moteur.mjs';
import '../../../outils/alien/modules/muthur/style.css';
import '../../../outils/alien/modules/detecteur/style.css';

type Props = { vue: unknown; envoyerCommande: (commande: CommandeDeModule) => Promise<ResultatDeModule> };
const joueurMuthur = lazy(async () => {
    const { VueJoueur } = await import('../../../outils/alien/modules/muthur/vues.mjs');
    return { default: (props: Props) => <VueJoueur vue={props.vue as VueMuthurJoueur} envoyerCommande={props.envoyerCommande} /> };
});
const mjMuthur = lazy(async () => {
    const { PupitreMJ } = await import('../../../outils/alien/modules/muthur/vues.mjs');
    return { default: (props: Props) => <PupitreMJ vue={props.vue as VueMuthurMJ} envoyerCommande={props.envoyerCommande} /> };
});
const joueurDetecteur = lazy(async () => {
    const { VueJoueur } = await import('../../../outils/alien/modules/detecteur/vues.mjs');
    return { default: (props: Props) => <VueJoueur vue={props.vue as EtatDetecteur} envoyerCommande={props.envoyerCommande} /> };
});
const mjDetecteur = lazy(async () => {
    const { PupitreMJ } = await import('../../../outils/alien/modules/detecteur/vues.mjs');
    return { default: (props: Props) => <PupitreMJ vue={props.vue as EtatDetecteur} envoyerCommande={props.envoyerCommande} /> };
});
const REGISTRE_DES_VUES = new Map([
    ['alien-muthur', { joueur: joueurMuthur, mj: mjMuthur }],
    ['alien-detecteur', { joueur: joueurDetecteur, mj: mjDetecteur }],
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
