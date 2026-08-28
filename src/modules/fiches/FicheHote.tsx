import React from 'react';
import { FileText, Link2, Plus, RefreshCw, AlertTriangle } from 'lucide-react';
import {
    ouvrirLePont, ADRESSE_DU_MOTEUR,
    type PontDeLaFiche, type ApercuDeFiche, type InstantaneDeFiche,
} from './pontDeLaFiche';
import { versLaFiche, type CorrespondanceDeFiche, type CotesGmOs } from './correspondanceDeFiche';
import { rapprocher, type Rapprochement } from './rapprochementDeLaFiche';
import { journaliserLesDivergences } from './journalDesDivergences';

/**
 * **L'hôte : la fiche HTML affichée dans GM-OS, et branchée.**
 *
 * L'iframe est servie par `gmos://media/…`, donc sur une **autre origine** que le
 * cockpit : `window.RPGSheet` ne la traverse pas, et tout passe par le pont.
 * C'est prévu depuis la publication de la couture, ce n'est pas une contrainte
 * subie.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE COMPOSANT NE TOUCHE PAS LE STORE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il reçoit le personnage et rend ses conclusions par `onRapprochement` et
 * `onFicheLiee`. Deux raisons, et la seconde est la vraie : il est éprouvable
 * sans monter la moitié de l'application, et **le seul endroit qui écrit dans le
 * store reste celui qui y écrivait déjà**. Ce dépôt a payé cinq fois « plusieurs
 * écrivains pour une même donnée ».
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA FICHE FAIT FOI — DANS QUEL SENS COULE QUOI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * - **La fiche → GM-OS** : à l'ouverture, et à chaque saisie du joueur. C'est la
 *   règle de David du 2026-08-28, et chaque valeur écrasée passe par le journal.
 * - **GM-OS → la fiche** : une seule fois, **à la création**. On sème la fiche
 *   neuve avec ce que GM-OS savait déjà du PJ, puis on ne pousse plus. Semer
 *   ailleurs qu'à la création rouvrirait la question de qui gagne, à chaque
 *   frappe.
 */

/** Ce que l'hôte a besoin de savoir du PJ — pas tout `PlayerCharacter`. */
export interface PersonnageDeLHote extends CotesGmOs {
    id: string;
    name: string;
    /** L'identifiant de sa fiche dans la bibliothèque du moteur, s'il en a une. */
    ficheId?: string;
}

export interface FicheHoteProps {
    personnage: PersonnageDeLHote;
    /** La correspondance du jeu. Sans elle, on affiche la fiche sans la brancher. */
    table: CorrespondanceDeFiche | null;
    /** Appelé quand le PJ vient d'être lié à une fiche — à ranger sur le PJ. */
    onFicheLiee: (ficheId: string) => void;
    /** Appelé chaque fois que la fiche impose quelque chose à GM-OS. */
    onRapprochement: (rapprochement: Rapprochement) => void;
    /** Fabrique le pont — remplacée dans les tests. */
    fabriquerLePont?: typeof ouvrirLePont;
}

type Etat =
    | { nom: 'chargement' }
    | { nom: 'a-lier'; bibliotheque: ApercuDeFiche[] }
    | { nom: 'branchee'; fiche: InstantaneDeFiche }
    | { nom: 'erreur'; motif: string };

const FicheHote: React.FC<FicheHoteProps> = ({
    personnage, table, onFicheLiee, onRapprochement, fabriquerLePont = ouvrirLePont,
}) => {
    const cadre = React.useRef<HTMLIFrameElement>(null);
    const pont = React.useRef<PontDeLaFiche | null>(null);
    const [etat, setEtat] = React.useState<Etat>({ nom: 'chargement' });
    const [occupe, setOccupe] = React.useState(false);

    /*
      Les rappels dans une référence : le pont s'ouvre une fois, à la charge de
      l'iframe, et son abonnement vivrait sinon avec le personnage du premier
      rendu. C'est le défaut classique d'un abonnement posé dans un effet — et
      ici il se verrait comme une fiche qui cesse de remonter au bout d'un moment.
    */
    const dernier = React.useRef({ personnage, table, onFicheLiee, onRapprochement });
    dernier.current = { personnage, table, onFicheLiee, onRapprochement };

    /** La fiche vient de parler : elle fait foi, et on dit ce qu'elle écrase. */
    const accueillir = React.useCallback((fiche: InstantaneDeFiche | null) => {
        if (!fiche) return;
        setEtat({ nom: 'branchee', fiche });

        const { personnage: pj, table: t, onRapprochement: rendre } = dernier.current;
        if (!t) return;

        const releve = rapprocher(fiche.data, pj, t);
        journaliserLesDivergences(
            { personnage: pj.name, gabarit: t.gabaritDeLaFiche },
            releve.divergences,
        );

        const quelqueChoseADire = Object.keys(releve.aEcrire).length > 0
            || Object.keys(releve.narratifAEcrire ?? {}).length > 0
            || !!releve.inventoryItems;
        if (quelqueChoseADire) rendre(releve);
    }, []);

    const brancher = React.useCallback(async (p: PontDeLaFiche) => {
        const { personnage: pj } = dernier.current;

        if (pj.ficheId) {
            try {
                accueillir(await p.ouvrirPersonnage(pj.ficheId));
                return;
            } catch {
                /*
                  La fiche a disparu de la bibliothèque du moteur — supprimée à la
                  main, ou jamais restaurée sur ce profil. On ne la recrée PAS
                  d'office : ce serait fabriquer un doublon silencieux. On propose.
                */
            }
        }
        setEtat({ nom: 'a-lier', bibliotheque: (await p.bibliotheque()).characters });
    }, [accueillir]);

    const surCharge = React.useCallback(() => {
        const fenetre = cadre.current?.contentWindow;
        if (!fenetre) return;

        pont.current?.fermer();
        const p = fabriquerLePont(fenetre);
        pont.current = p;

        p.surChangement(ev => {
            // `host` est notre propre écriture qui nous revient : la réappliquer
            // ferait une boucle. `sheet` est la saisie du joueur, `open` un
            // changement de PJ — les deux nous concernent.
            if (ev.origin === 'host') return;
            accueillir(ev.character);
        });

        p.bonjour()
            .then(() => brancher(p))
            .catch(err => setEtat({ nom: 'erreur', motif: String(err?.message ?? err) }));
    }, [fabriquerLePont, accueillir, brancher]);

    React.useEffect(() => () => { pont.current?.fermer(); pont.current = null; }, []);

    const lier = async (ficheId: string) => {
        const p = pont.current;
        if (!p) return;
        setOccupe(true);
        try {
            accueillir(await p.ouvrirPersonnage(ficheId));
            dernier.current.onFicheLiee(ficheId);
        } catch (err) {
            setEtat({ nom: 'erreur', motif: String((err as Error)?.message ?? err) });
        } finally { setOccupe(false); }
    };

    /** Semer la fiche neuve avec ce que GM-OS sait déjà — la seule poussée. */
    const creer = async () => {
        const p = pont.current;
        const { personnage: pj, table: t } = dernier.current;
        if (!p || !t) return;
        setOccupe(true);
        try {
            const graine = versLaFiche(pj, t);
            const fiche = await p.creer(pj.name, t.gabaritDeLaFiche, graine);
            setEtat({ nom: 'branchee', fiche });
            dernier.current.onFicheLiee(fiche.id);
        } catch (err) {
            setEtat({ nom: 'erreur', motif: String((err as Error)?.message ?? err) });
        } finally { setOccupe(false); }
    };

    return (
        <div className="relative w-full h-full min-h-[24rem] rounded-3xl overflow-hidden border border-app-border/20 bg-app-surface">
            <iframe
                ref={cadre}
                src={ADRESSE_DU_MOTEUR}
                title={`Fiche de ${personnage.name}`}
                onLoad={surCharge}
                className="w-full h-full border-0 bg-white"
            />

            {etat.nom !== 'branchee' && (
                <div className="absolute inset-0 bg-app-bg/95 backdrop-blur-xl flex items-center justify-center p-8">
                    <div className="w-full max-w-lg space-y-5">

                        {etat.nom === 'chargement' && (
                            <div className="flex items-center gap-3 text-app-text/50">
                                <RefreshCw size={16} className="animate-spin" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Ouverture de la fiche…</span>
                            </div>
                        )}

                        {etat.nom === 'erreur' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-amber-500">
                                    <AlertTriangle size={16} />
                                    <span className="text-[11px] font-black uppercase tracking-widest">La fiche ne répond pas</span>
                                </div>
                                <p className="text-xs text-app-text/50 font-mono">{etat.motif}</p>
                            </div>
                        )}

                        {etat.nom === 'a-lier' && (
                            <>
                                <div className="flex items-center gap-2 text-accent">
                                    <Link2 size={16} />
                                    <h3 className="text-[11px] font-black uppercase tracking-widest">
                                        À quelle fiche relier {personnage.name} ?
                                    </h3>
                                </div>

                                {!table && (
                                    <p className="text-xs text-amber-500/80">
                                        Ce jeu n'a pas de <span className="font-mono">correspondance.json</span> :
                                        la fiche s'affichera sans être branchée.
                                    </p>
                                )}

                                <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                                    {etat.bibliotheque.map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            disabled={occupe}
                                            onClick={() => lier(f.id)}
                                            className="w-full flex items-center gap-3 p-3 bg-app-surface/40 border border-app-border/10 rounded-2xl text-left hover:border-accent/40 transition-colors disabled:opacity-40"
                                        >
                                            <FileText size={14} className="text-app-text/30 shrink-0" />
                                            <span className="text-sm font-bold text-app-text truncate">{f.name}</span>
                                            <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-app-text/30 shrink-0">
                                                {f.templateName}
                                            </span>
                                        </button>
                                    ))}
                                    {etat.bibliotheque.length === 0 && (
                                        <p className="text-xs text-app-text/40 italic">La bibliothèque du moteur est vide.</p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    disabled={occupe || !table}
                                    onClick={creer}
                                    title={table ? undefined : 'Sans correspondance, GM-OS ne saurait pas quoi écrire dans la fiche neuve.'}
                                    className="w-full flex items-center justify-center gap-2 p-3 bg-accent/10 border border-accent/30 rounded-2xl text-[11px] font-black uppercase tracking-widest text-accent hover:bg-accent/20 transition-colors disabled:opacity-30"
                                >
                                    <Plus size={14} /> Créer une fiche pour {personnage.name}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FicheHote;
