import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Keyboard, Search, X } from 'lucide-react';
import TexteMarkdown from '../../components/TexteMarkdown';
import ApercuDuMeneur from './ApercuDuMeneur';
import { chercherDansLeManuel } from './rechercheDansLeManuel';
import { FAMILLES_DU_MANUEL, DOSSIER_DU_MANUEL, type GuideDuManuel } from '../../../electron/formeDuManuel';

/**
 * **Le module d'aide — l'aperçu du meneur, et le manuel.**
 *
 * Demandé par David le 2026-09-11 : *« un module d'aide qui me permet de lire la
 * documentation de l'application à partir de GM-OS »*, avec un moteur de
 * recherche à lui.
 *
 * ⚠️ **`Ctrl+H` et l'aperçu existaient déjà** — demandés le 30/08 — mais sous la
 * forme d'une incrustation, avec cette note : *« une surface de coup d'œil, pas
 * un manuel »*. Les 52 guides n'y auraient pas tenu : lire deux cents lignes
 * dans une fenêtre de coup d'œil n'aurait rendu service ni à l'un ni à l'autre.
 * L'aperçu est donc devenu le **premier onglet** de ce module, intact, et le
 * manuel a la place qu'il lui faut.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI UN SECOND MOTEUR DE RECHERCHE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * La palette (`Ctrl+K`) sait **mener** à un guide. Elle ne sait pas dire **où**
 * dans le guide, ni montrer la phrase qui répond. Celui-ci cherche dans le corps
 * des 456 Ko de markdown, nomme la section qui porte la réponse et en donne
 * l'extrait — *de quoi choisir sans ouvrir.*
 *
 * Les deux coexistent à dessein : on ouvre la palette en séance pour aller vite,
 * et ce module-ci quand on cherche à comprendre.
 */

/** Le dossier du manuel, tel que le protocole `gmos://` le résout depuis APP_ROOT. */
const RACINE_DES_IMAGES = `gmos://media/${DOSSIER_DU_MANUEL.replace(/\\/g, '/')}`;

/**
 * Un onglet du module.
 *
 * ⛔ **Défini ici et non dans le corps du rendu.** Un composant créé pendant le
 * rendu est un composant *neuf* à chaque rendu : React démonte son sous-arbre et
 * le remonte, ce qui perd le focus et l'état à chaque frappe dans la recherche.
 * `react-hooks/static-components` l'a signalé avant que ça ne se voie.
 */
const Onglet: React.FC<{
    id: OngletDAide;
    actif: OngletDAide;
    surChoix: (id: OngletDAide) => void;
    icone: React.ReactNode;
    children: React.ReactNode;
}> = ({ id, actif, surChoix, icone, children }) => (
    <button
        type="button"
        onClick={() => surChoix(id)}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${actif === id
            ? 'bg-accent/15 text-accent border border-accent/40'
            : 'border border-transparent text-app-text/50 hover:text-app-text'}`}
    >
        {icone}{children}
    </button>
);

type OngletDAide = 'apercu' | 'manuel';

const AideDashboard: React.FC = () => {
    const [onglet, setOnglet] = useState<OngletDAide>('apercu');
    const [guides, setGuides] = useState<GuideDuManuel[] | null>(null);
    const [ouvert, setOuvert] = useState<string | null>(null);
    const [requete, setRequete] = useState('');

    /*
      **Les guides sont chargés une fois, à l'ouverture du module.** 456 Ko
      mesurés : assez peu pour tenir en mémoire, et c'est ce qui rend la
      recherche instantanée. Voir `electron/guidesDuManuel.ts`.
    */
    useEffect(() => {
        let vivant = true;
        window.appBridge?.aide?.guides()
            .then(lus => { if (vivant) setGuides(lus); })
            .catch(err => {
                console.error('[Aide] Manuel illisible :', err);
                if (vivant) setGuides([]);
            });
        return () => { vivant = false; };
    }, []);

    const resultats = useMemo(
        () => (guides && requete.trim() ? chercherDansLeManuel(guides, requete) : []),
        [guides, requete],
    );

    const guideOuvert = useMemo(
        () => guides?.find(g => g.nom === ouvert) ?? null,
        [guides, ouvert],
    );

    /** Les guides rangés par famille, pour la liste au repos. */
    const parFamille = useMemo(() => {
        const carte = new Map<string, GuideDuManuel[]>();
        for (const g of guides ?? []) {
            if (!carte.has(g.famille)) carte.set(g.famille, []);
            carte.get(g.famille)!.push(g);
        }
        return [...carte.entries()];
    }, [guides]);

    /*
      **Les liens entre guides mènent au guide, pas au navigateur.**

      L'index renvoie vers `./01-Prise-en-main.md` ; sans cette interception, un
      clic tenterait de charger un fichier et laisserait l'écran blanc. On les
      rend cliquables *à l'intérieur du module* — et on laisse passer tout le
      reste, qui part vers le navigateur comme il se doit.
    */
    const composants = useMemo(() => ({
        a: ({ href, children, ...props }: React.ComponentPropsWithoutRef<'a'> & { href?: string }) => {
            const interne = href?.match(/([^/]+\.md)$/);
            if (!interne) return <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>;
            return (
                <button
                    type="button"
                    onClick={() => { setOuvert(interne[1]); setRequete(''); }}
                    className="text-accent underline underline-offset-2 hover:text-accent/80"
                >
                    {children}
                </button>
            );
        },
        /* Les captures vivent à côté des guides : `gmos://` les résout depuis APP_ROOT. */
        img: ({ src, alt, ...props }: React.ComponentPropsWithoutRef<'img'>) => {
            const chemin = typeof src === 'string' && !/^[a-z]+:/i.test(src)
                ? `${RACINE_DES_IMAGES}/${src.replace(/^\.\//, '')}`
                : src;
            return <img src={chemin} alt={alt} className="rounded-xl border border-app-border" {...props} />;
        },
    }), []);

    return (
        <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b border-app-border px-6 py-3">
                <Onglet id="apercu" actif={onglet} surChoix={setOnglet} icone={<Keyboard size={15} />}>Aperçu</Onglet>
                <Onglet id="manuel" actif={onglet} surChoix={setOnglet} icone={<BookOpen size={15} />}>
                    Manuel{guides ? ` · ${guides.length}` : ''}
                </Onglet>
            </div>

            {onglet === 'apercu' ? (
                <div className="flex-1 overflow-y-auto"><ApercuDuMeneur /></div>
            ) : (
                <div className="flex min-h-0 flex-1">
                    {/* La colonne de gauche : chercher, ou parcourir. */}
                    <aside className="flex w-[22rem] shrink-0 flex-col border-r border-app-border">
                        <div className="relative shrink-0 p-3">
                            <Search size={14} className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-app-text/30" />
                            <input
                                type="text"
                                value={requete}
                                onChange={e => setRequete(e.target.value)}
                                placeholder="Chercher dans les guides…"
                                className="w-full rounded-xl border border-app-border bg-app-bg/40 py-2.5 pl-9 pr-9 text-sm text-app-text outline-none focus:border-accent/50"
                            />
                            {requete && (
                                <button
                                    type="button"
                                    onClick={() => setRequete('')}
                                    title="Effacer la recherche"
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-app-text/30 hover:text-app-text"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
                            {guides === null && (
                                <p className="p-3 text-sm italic text-app-text/40">Lecture du manuel…</p>
                            )}

                            {guides?.length === 0 && (
                                /* Une installation sans son manuel doit le dire, pas rester vide. */
                                <p className="p-3 text-sm text-app-text/50">
                                    Aucun guide trouvé dans <code className="text-xs">{DOSSIER_DU_MANUEL}</code>.
                                </p>
                            )}

                            {requete.trim() && (
                                <>
                                    <p className="px-1 pb-2 text-[0.66rem] font-black uppercase tracking-[0.16em] text-app-text/30">
                                        {resultats.length === 0
                                            ? 'Aucun guide ne répond'
                                            : `${resultats.length} guide${resultats.length > 1 ? 's' : ''}`}
                                    </p>
                                    {resultats.map(r => (
                                        <button
                                            key={r.guide.nom}
                                            type="button"
                                            onClick={() => setOuvert(r.guide.nom)}
                                            className={`mb-1.5 block w-full rounded-xl border p-3 text-left transition-all ${ouvert === r.guide.nom
                                                ? 'border-accent/40 bg-accent/10'
                                                : 'border-app-border/50 hover:border-app-border hover:bg-app-surface/40'}`}
                                        >
                                            <span className="block text-sm font-semibold text-app-text">{r.guide.titre}</span>
                                            {r.section && (
                                                <span className="mt-0.5 block text-[0.7rem] font-medium text-accent">{r.section}</span>
                                            )}
                                            <span className="mt-1 block text-xs leading-snug text-app-text/45">{r.extrait}</span>
                                        </button>
                                    ))}
                                </>
                            )}

                            {!requete.trim() && parFamille.map(([famille, sesGuides]) => (
                                <section key={famille} className="mb-4">
                                    <p className="px-1 pb-1.5 text-[0.66rem] font-black uppercase tracking-[0.16em] text-app-text/30">
                                        {FAMILLES_DU_MANUEL[famille] ?? famille}
                                    </p>
                                    {sesGuides.map(g => (
                                        <button
                                            key={g.nom}
                                            type="button"
                                            onClick={() => setOuvert(g.nom)}
                                            className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-all ${ouvert === g.nom
                                                ? 'bg-accent/15 text-accent'
                                                : 'text-app-text/70 hover:bg-app-surface/50 hover:text-app-text'}`}
                                        >
                                            {g.titre}
                                        </button>
                                    ))}
                                </section>
                            ))}
                        </div>
                    </aside>

                    {/* La colonne de droite : le guide ouvert. */}
                    <div className="min-w-0 flex-1 overflow-y-auto">
                        {guideOuvert ? (
                            <article className="prose prose-invert max-w-3xl p-8 prose-headings:text-app-text prose-p:text-app-text/70 prose-li:text-app-text/70 prose-strong:text-app-text prose-a:text-accent">
                                <TexteMarkdown components={composants}>{guideOuvert.contenu}</TexteMarkdown>
                            </article>
                        ) : (
                            <div className="flex h-full items-center justify-center p-8 text-center">
                                <p className="max-w-sm text-sm text-app-text/35">
                                    Choisissez un guide à gauche, ou cherchez un mot&nbsp;: la recherche
                                    porte sur le <strong className="text-app-text/60">corps</strong> des
                                    guides et vous dit dans quelle section se trouve la réponse.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AideDashboard;
