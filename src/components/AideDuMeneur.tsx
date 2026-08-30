import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    CATALOGUE_DES_MODULES,
    FAMILLES,
    PLACES_DE_RACCOURCI,
    modulesDeLaFamille,
    type FamilleDeModule,
} from '../data/catalogueDesModules';
import { useRaccourcisStore } from '../stores/useRaccourcisStore';
import { useModalStore } from '../stores/useModalStore';

/**
 * **L'écran du meneur — la face intérieure du paravent.**
 *
 * Demandé par David le 2026-08-30, ouvert par `Ctrl+H`. C'est une **surface de
 * coup d'œil**, pas un manuel : on la regarde sans quitter la table des yeux,
 * puis on la referme d'un `Échap`.
 *
 * Elle s'ouvre **par-dessus** l'écran courant plutôt que de le remplacer. Perdre
 * son Combat-OS pour se rappeler quelle touche ouvre Image-OS serait payer la
 * question plus cher que la réponse.
 *
 * **Les modules sont dérivés du catalogue**, jamais réécrits ici : leurs noms
 * viennent de `modules:names.<id>`, comme la barre latérale, et leur résumé du
 * `Record<ModuleID, …>` exhaustif. Ajouter un module au type oblige donc à le
 * décrire, et il paraît ici tout seul. *Une page d'aide recopiée à la main est
 * une page d'aide qui ment au bout de trois mois.*
 */

/** Une touche, dessinée comme une touche. */
const Touche: React.FC<{ children: React.ReactNode; vive?: boolean }> = ({ children, vive }) => (
    <kbd className={`inline-block rounded-md border border-b-[3px] px-1.5 py-1 font-mono text-[0.7rem] font-medium leading-none whitespace-nowrap ${vive
        ? 'border-accent/70 bg-accent/15 text-accent'
        : 'border-app-border bg-app-surface text-app-text/80'}`}>
        {children}
    </kbd>
);

const Combinaison: React.FC<{ touches: string[]; vive?: boolean }> = ({ touches, vive }) => (
    <span className="inline-flex flex-wrap items-center gap-1">
        {touches.map((t, i) => (
            <React.Fragment key={i}>
                {i > 0 && <span className="text-app-text/30 text-[0.7rem]">+</span>}
                <Touche vive={vive}>{t}</Touche>
            </React.Fragment>
        ))}
    </span>
);

const Titre: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 className="flex items-baseline gap-3 text-[0.7rem] font-black uppercase tracking-[0.18em] text-app-text/40">
        <span className="shrink-0">{children}</span>
        <span className="h-px flex-1 bg-app-border/60" />
    </h3>
);

/** Une ligne de raccourci : la combinaison à gauche, ce qu'elle fait à droite. */
const Ligne: React.FC<{ touches: string[]; children: React.ReactNode }> = ({ touches, children }) => (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 border-b border-app-border/40 py-2.5 last:border-b-0">
        <span className="w-[11rem] shrink-0"><Combinaison touches={touches} /></span>
        <span className="flex-1 min-w-[14rem] text-sm text-app-text/60">{children}</span>
    </div>
);

const Famille: React.FC<{ famille: FamilleDeModule }> = ({ famille }) => {
    const { t } = useTranslation(['modules']);
    const places = useRaccourcisStore(s => s.places);
    const { titre, sous } = FAMILLES[famille];

    return (
        <section className="rounded-2xl border border-app-border bg-app-surface/40 p-5">
            <h4 className="text-[0.7rem] font-black uppercase tracking-[0.16em] text-accent">{titre}</h4>
            <p className="mt-0.5 mb-4 text-xs italic text-app-text/40">{sous}</p>
            <ul className="flex flex-col gap-3">
                {modulesDeLaFamille(famille).map(id => {
                    const place = places.indexOf(id);
                    return (
                        <li key={id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                            <span className="text-sm font-semibold text-app-text">{t(CATALOGUE_DES_MODULES[id].cle)}</span>
                            {/*
                              La touche assignée s'affiche à côté du module :
                              c'est ici qu'on réapprend ses propres raccourcis,
                              et non dans un écran de réglages qu'on ne rouvre
                              jamais.
                            */}
                            {place >= 0 && <Combinaison touches={['Ctrl', String(place + 1)]} />}
                            <span className="flex-1 min-w-[11rem] text-[0.82rem] text-app-text/50">
                                {CATALOGUE_DES_MODULES[id].resume}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

const Regle: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
    <div className="rounded-r-xl border border-l-[3px] border-app-border border-l-amber-500 bg-app-surface/40 p-4">
        <h4 className="mb-1 text-[0.66rem] font-black uppercase tracking-[0.16em] text-amber-500">{titre}</h4>
        <p className="text-sm text-app-text/60">{children}</p>
    </div>
);

const AideDuMeneur: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const places = useRaccourcisStore(s => s.places);
    const closeModal = useModalStore(s => s.closeModal);

    /*
      **`Échap` referme, et c'est posé ICI plutôt que dans `ModalProvider`.**

      Les boîtes personnalisées n'écoutent pas `Échap` aujourd'hui, et leur
      donner toutes cette touche ferait perdre une fiche de campagne à moitié
      remplie sur une frappe distraite. Cette page-ci ne contient rien à perdre :
      elle peut se fermer d'un geste, et elle seule.
    */
    React.useEffect(() => {
        const auClavier = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', auClavier);
        return () => window.removeEventListener('keydown', auClavier);
    }, [closeModal]);

    return (
        <div className="flex flex-col gap-10 p-8">

            {/* Les deux gestes ------------------------------------------ */}
            <section>
                <Titre>Les deux gestes qui ouvrent tout</Titre>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <article className="flex flex-col gap-2 rounded-2xl border border-app-border bg-gradient-to-b from-app-surface/70 to-app-surface/30 p-6">
                        <Combinaison touches={['Ctrl', 'K']} vive />
                        <h4 className="text-base font-bold text-app-text">La palette</h4>
                        <p className="text-sm text-app-text/60">
                            Elle liste les vingt modules dès l'ouverture. Tapez deux ou trois
                            lettres pour filtrer&nbsp;; la recherche s'étend alors aux PNJ, aux
                            lieux, aux entrées du wiki et aux fiches de règles.
                        </p>
                    </article>
                    <article className="flex flex-col gap-2 rounded-2xl border border-app-border bg-gradient-to-b from-app-surface/70 to-app-surface/30 p-6">
                        <span className="inline-flex flex-wrap items-center gap-1">
                            <Combinaison touches={['Ctrl', '1']} vive />
                            <span className="px-1 text-app-text/30 text-[0.7rem]">…</span>
                            <Combinaison touches={['Ctrl', String(PLACES_DE_RACCOURCI)]} vive />
                        </span>
                        <h4 className="text-base font-bold text-app-text">Les neuf places</h4>
                        <p className="text-sm text-app-text/60">
                            Neuf modules sous les doigts, assignables dans
                            <strong className="text-app-text/80"> Paramètres → Matériel</strong>.
                            Vingt modules pour neuf touches&nbsp;: à vous de dire lesquels comptent,
                            selon le jeu que vous menez.
                        </p>
                    </article>
                </div>
            </section>

            {/* Raccourcis ----------------------------------------------- */}
            <section>
                <Titre>Tous les raccourcis</Titre>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                        <p className="mb-1 text-[0.66rem] font-black uppercase tracking-[0.16em] text-app-text/30">Aller quelque part</p>
                        <Ligne touches={['Ctrl', 'H']}>Ouvre et referme cette page.</Ligne>
                        <Ligne touches={['Ctrl', 'K']}>Ouvre et ferme la palette.</Ligne>
                        <Ligne touches={['Ctrl', '1…9']}>Ouvre le module assigné à cette place.</Ligne>
                        <Ligne touches={['↑', '↓']}>Parcourt les résultats de la palette.</Ligne>
                        <Ligne touches={['Entrée']}>Ouvre le résultat sélectionné.</Ligne>
                        <Ligne touches={['Échap']}>Referme cette page, la palette, une boîte, une image en plein écran.</Ligne>
                    </div>
                    <div>
                        <p className="mb-1 text-[0.66rem] font-black uppercase tracking-[0.16em] text-app-text/30">Faire sonner</p>
                        <Ligne touches={['A', 'Z', 'Pavé num.']}>
                            <strong className="text-app-text/80">Les pastilles.</strong> Chaque pastille de
                            Musique et d'Effets Sonores prend la touche que vous lui donnez, par le
                            mode <em>Key&nbsp;Learn</em>. Aucune ne demande de modificateur.
                        </Ligne>
                        <Ligne touches={['←', '→']}>Déplace la lecture de 5&nbsp;s, quand la forme d'onde a le focus.</Ligne>
                        <Ligne touches={['Maj', '←', '→']}>Le même déplacement, d'une seconde — pour tomber sur la mesure.</Ligne>
                        <Ligne touches={['Début', 'Fin']}>Va au début ou à la fin du morceau.</Ligne>
                        <p className="mt-4 mb-1 text-[0.66rem] font-black uppercase tracking-[0.16em] text-app-text/30">Écrire à l'Oracle</p>
                        <Ligne touches={['Ctrl', 'Entrée']}>Envoie la demande sans lâcher le clavier.</Ligne>
                    </div>
                </div>
            </section>

            {/* Règles ---------------------------------------------------- */}
            <section>
                <Titre>Trois règles qui évitent des surprises</Titre>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Regle titre="Le pavé numérique est aux pastilles">
                        Aucun raccourci de navigation ne s'y installe. Vos ambiances rangées sur
                        le pavé restent des ambiances.
                    </Regle>
                    <Regle titre="Une place libre laisse passer la frappe">
                        <Combinaison touches={['Ctrl', '3']} /> non assigné reste ce qu'il était
                        pour le navigateur. Un raccourci muet laisserait croire à une panne.
                    </Regle>
                    <Regle titre="Ces touches n'ouvrent que des écrans">
                        Rien ne se déclenche, rien ne se projette, aucun son ne part. Une frappe
                        malheureuse coûte un changement d'onglet.
                    </Regle>
                </div>
            </section>

            {/* Les places ------------------------------------------------ */}
            <section>
                <Titre>Vos neuf places</Titre>
                <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                    {places.map((module, rang) => (
                        <div key={rang} className="flex items-baseline gap-3 border-b border-app-border/40 py-2.5">
                            <Combinaison touches={['Ctrl', String(rang + 1)]} />
                            <span className={`text-sm ${module ? 'text-app-text' : 'italic text-app-text/30'}`}>
                                {module ? t(CATALOGUE_DES_MODULES[module].cle) : 'libre'}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Les modules ----------------------------------------------- */}
            <section>
                <Titre>Les vingt modules</Titre>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {(Object.keys(FAMILLES) as FamilleDeModule[]).map(famille => (
                        <Famille key={famille} famille={famille} />
                    ))}
                </div>
            </section>

            <p className="border-t border-app-border pt-5 text-xs text-app-text/30">
                Ces raccourcis n'existent que dans la fenêtre du meneur. Le Player Hub, le
                projecteur et la tablette n'écoutent pas le clavier.
            </p>
        </div>
    );
};

export default AideDuMeneur;
