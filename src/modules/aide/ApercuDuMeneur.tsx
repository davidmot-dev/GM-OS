import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    CATALOGUE_DES_MODULES,
    FAMILLES,
    PLACES_DE_RACCOURCI,
    modulesDeLaFamille,
    type FamilleDeModule,
} from '../../data/catalogueDesModules';
import { useRaccourcisStore } from '../../stores/useRaccourcisStore';
import { GROUPES_DE_RACCOURCIS, NOMBRE_DE_RACCOURCIS } from '../../data/registreDesRaccourcis';

/**
 * **L'écran du meneur — la face intérieure du paravent.**
 *
 * Demandé par David le 2026-08-30. C'est une **surface de coup d'œil**, pas un
 * manuel : on la regarde sans quitter la table des yeux.
 *
 * ⚠️ **Elle était une incrustation jusqu'au 2026-09-11**, ouverte et refermée par
 * `Ctrl+H` par-dessus l'écran courant. Elle est devenue le premier onglet du
 * module d'aide, à côté du manuel — *lire un guide de deux cents lignes dans une
 * fenêtre de coup d'œil n'aurait rendu service ni à l'un ni à l'autre.*
 *
 * `Ctrl+H` garde son geste de bascule : il mène ici, et **ramène d'où l'on
 * vient**. La touche qui a fait apparaître la page doit la faire disparaître.
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

/**
 * Un des gestes maîtres — refonte, L6, maquette retenue : un surtitre, le nom,
 * ce qu'il fait, et ses touches en pied de carte.
 */
const Geste: React.FC<{ surtitre: string; titre: string; touches: React.ReactNode; children: React.ReactNode }> = ({ surtitre, titre, touches, children }) => (
    <article className="flex flex-col gap-2 rounded-xl border border-app-border bg-app-surface/60 p-5">
        <p className="text-ui-10 font-black uppercase tracking-widest text-accent">{surtitre}</p>
        <h4 className="font-display text-lg font-bold uppercase tracking-wide text-app-text">{titre}</h4>
        <p className="flex-1 text-sm leading-relaxed text-app-muted">{children}</p>
        <div className="mt-2 rounded-lg border border-app-border bg-app-bg/60 p-3">{touches}</div>
    </article>
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
    <div className="rounded-r-xl border border-l-[3px] border-app-border border-l-etat-alerte bg-app-surface/40 p-4">
        <h4 className="mb-1 text-[0.66rem] font-black uppercase tracking-[0.16em] text-etat-alerte">{titre}</h4>
        <p className="text-sm text-app-text/60">{children}</p>
    </div>
);

/*
  ⛔ **Le compte des modules se calcule, il ne s'écrit pas.** Cette page annonçait
  « les vingt modules » en toutes lettres — et le module d'aide en a fait
  vingt-et-un le jour de son arrivée. *Un nombre recopié dans une page d'aide est
  un nombre qui ment au premier ajout.*
*/
const NOMBRE_DE_MODULES = Object.keys(CATALOGUE_DES_MODULES).length;

const ApercuDuMeneur: React.FC = () => {
    const { t } = useTranslation(['modules']);
    const places = useRaccourcisStore(s => s.places);
    return (
        <div className="flex flex-col gap-10 p-8">

            {/* Les trois gestes ------------------------------------------ */}
            <section>
                <Titre>Les gestes qui ouvrent tout</Titre>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Geste surtitre="Recherche" titre="La palette" touches={<Combinaison touches={['Ctrl', 'K']} vive />}>
                        Elle liste tous les modules dès l'ouverture. Tapez deux ou trois
                        lettres&nbsp;: la recherche s'étend aux PNJ, aux lieux, au wiki et
                        aux fiches de règles.
                    </Geste>
                    <Geste
                        surtitre={`${places.filter(Boolean).length} places occupées`}
                        titre="Les neuf places"
                        touches={<span className="inline-flex flex-wrap items-center gap-1">
                            <Combinaison touches={['Ctrl', '1']} vive />
                            <span className="px-1 text-[0.7rem] text-app-subtle">…</span>
                            <Combinaison touches={['Ctrl', String(PLACES_DE_RACCOURCI)]} vive />
                        </span>}
                    >
                        {/* Les places du meneur, pas un exemple : elles se règlent dans
                            Paramètres → Matériel. */}
                        {places.some(Boolean)
                            ? places.map((m, rang) => m ? `${rang + 1} : ${t(CATALOGUE_DES_MODULES[m].cle)}` : null).filter(Boolean).join(', ') + '.'
                            : `Aucune place assignée — ${NOMBRE_DE_MODULES} modules pour neuf touches, à choisir dans Paramètres → Matériel.`}
                    </Geste>
                    <Geste surtitre="Sortir" titre="Échap" touches={<Combinaison touches={['Échap']} vive />}>
                        Ferme la fenêtre du dessus — la palette, une boîte, une image en
                        plein écran. Sans fenêtre ouverte, arrête la scène de lumière qui joue.
                    </Geste>
                </div>
            </section>

            {/* Les raccourcis, groupés par usage — lus dans le registre ------- */}
            <section>
                <Titre>Tous les raccourcis, groupés par usage · {NOMBRE_DE_RACCOURCIS}</Titre>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                    {GROUPES_DE_RACCOURCIS.map((groupe, rang) => (
                        <section key={groupe.titre} className="rounded-xl border border-app-border bg-app-surface/60 p-4">
                            <h4 className="mb-2 flex items-baseline justify-between gap-2 font-display text-sm font-bold uppercase tracking-wider text-app-text">
                                <span><span className="text-accent">{rang + 1}.</span> {groupe.titre}</span>
                                <span className="text-ui-10 font-black text-app-muted">{groupe.raccourcis.length}</span>
                            </h4>
                            <ul className="flex flex-col">
                                {groupe.raccourcis.map(r => (
                                    <li key={r.titre} className="flex items-start justify-between gap-3 border-b border-app-border/40 py-2.5 last:border-b-0">
                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold text-app-text">{r.titre}</span>
                                            {r.detail && <span className="mt-0.5 block text-xs leading-snug text-app-muted">{r.detail}</span>}
                                        </span>
                                        <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                                            {r.touches.map((combinaison, i) => (
                                                <React.Fragment key={i}>
                                                    {i > 0 && <span className="px-0.5 text-[0.7rem] text-app-subtle">ou</span>}
                                                    <Combinaison touches={combinaison} />
                                                </React.Fragment>
                                            ))}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
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
                <Titre>Les {NOMBRE_DE_MODULES} modules</Titre>
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

export default ApercuDuMeneur;
