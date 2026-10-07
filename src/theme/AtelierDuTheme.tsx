import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Palette, Save, RotateCcw, FilePlus2, AlertTriangle, Check, Loader2, History } from 'lucide-react';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useSessionStore } from '../store/useSessionStore';
import { gmToast } from '../stores/useToastStore';
import { jeuDeLaCampagneActive } from './jeuDeLaCampagne';
import { cheminDuTheme, extraireJetons, pontVersLInterface } from './jetonsDeTheme';
import { appliquerLeTheme, accentDuTheme } from './themeDeLInterface';
import { poserLesPolices } from './themeDuJeu';
import {
    cheminDeLOriginal, contraste, ecrireLesJetons, ecrireLImportDePolices, echelleDeTexte,
    familleDeLaPile, GROUPES, JETONS_EDITABLES, JETONS_PAR_DEFAUT, PAIRES_A_CONTROLER,
    pileDePolice, policeFournie, POLICES_CONNUES, requeteDePolices, themeVierge,
    palierDeLEchelle, PALIERS_DE_TAILLE, type JetonEditable,
} from './editionDuTheme';
import { Bouton, Etiquette } from '../components/socle';
import { VignetteDeZone } from './VignetteDeZone';
import { ZONE_DU_JETON } from './zonesDuTheme';

/**
 * **L'atelier de thème — demandé par David le 2026-09-03 :** *« si je veux
 * modifier les configurations CSS d'un jeu, est-ce que tu peux me faire un
 * module me permettant de changer les paramètres, couleurs, polices, tailles
 * des polices… ? »*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'IL ÉCRIT, ET OÙ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Dans `docs/systems/<jeu>/theme/theme.css`, le fichier que l'application ET
 * les fiches de personnage lisent déjà — décision de David. Seules les
 * **déclarations de jetons** sont réécrites ; les trois cents lignes de règles
 * `.rpg-*` qui habillent les fiches ressortent intactes (`editionDuTheme.ts`,
 * dont l'idempotence est éprouvée sur les six thèmes du dépôt).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ON APPLIQUE AVANT D'ENREGISTRER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Chaque réglage repeint l'interface **immédiatement**, sans toucher au disque.
 * *Une couleur ne se choisit pas dans un formulaire, elle se choisit à
 * l'écran* — et un thème qui ne se voit qu'après enregistrement se règle par
 * essais successifs sur un fichier qu'on abîme un peu plus à chaque fois.
 *
 * Fermer sans enregistrer **remet ce qui était là** : l'aperçu ne doit jamais
 * survivre à son atelier.
 */

/** Le libellé d'un jeton qui n'atteint que les fiches, dit une fois pour toutes. */
const POUR_LES_FICHES = 'Fiches uniquement';

export const AtelierDuTheme: React.FC = () => {
    const activeCampaignId = useSessionOSStore(s => s.activeCampaignId);
    const theme = useSessionStore(s => s.theme);
    const themeColor = useSessionStore(s => s.themeColor);
    // P1.7 : l'aperçu suit l'interrupteur des personnalités, comme l'interface qu'il prépare.
    const personnalites = useSessionStore(s => s.personnalites);

    const [racine, setRacine] = useState<string | null>(null);
    const [nomDuJeu, setNomDuJeu] = useState('');
    const [cssOrigine, setCssOrigine] = useState<string | null>(null);
    const [clarte, setClarte] = useState<'dark' | 'light' | undefined>();
    const [valeurs, setValeurs] = useState<Record<string, string>>({});
    const [chargement, setChargement] = useState(true);
    const [enCoursDEcriture, setEnCoursDEcriture] = useState(false);

    /*
      **La copie d'origine — demandée par David le 2026-09-03.**

      Elle est prise au PREMIER enregistrement et n'est jamais réécrite : c'est
      exactement ce qui la rend utile dix séances plus tard. *« Annuler » revient
      à la dernière sauvegarde ; celle-ci revient au thème que le jeu avait
      avant qu'on y touche.*

      Un jeu dont le thème a été créé ici n'en a pas : il n'y avait rien à
      sauver, et le bouton ne s'affiche pas plutôt que de promettre un retour
      qui n'existe pas.
    */
    const [originalPresent, setOriginalPresent] = useState(false);
    const [confirmeLaRestauration, setConfirmeLaRestauration] = useState(false);

    /** Ce qui est sur le disque : le repère du « modifié », et le retour arrière. */
    const enregistrees = useRef<Record<string, string>>({});
    const policesEnregistrees = useRef<string[]>([]);

    /* ── Lecture ─────────────────────────────────────────────────────────── */
    useEffect(() => {
        let annule = false;

        const lire = async () => {
            setChargement(true);
            const jeu = await jeuDeLaCampagneActive(activeCampaignId ?? null);
            if (annule) return;

            if (!jeu) {
                setRacine(null);
                setChargement(false);
                return;
            }

            setRacine(jeu.racine);
            setNomDuJeu(jeu.jeu);

            const css = (await window.appBridge?.ai?.readDoc?.(cheminDuTheme(jeu.racine))) ?? null;
            if (annule) return;

            const original = css
                ? await window.appBridge?.ai?.readDoc?.(cheminDeLOriginal(jeu.racine))
                : null;
            if (annule) return;
            setOriginalPresent(!!original);

            const releve = css ? extraireJetons(css) : { jetons: {}, clarte: undefined };
            setCssOrigine(css);
            setClarte(releve.clarte);
            setValeurs(releve.jetons);
            enregistrees.current = releve.jetons;
            setChargement(false);
        };

        void lire();
        return () => { annule = true; };
    }, [activeCampaignId]);

    /* ── Aperçu ──────────────────────────────────────────────────────────── */

    /**
     * Repeint l'interface avec un jeu de valeurs, sans rien écrire.
     *
     * C'est **le même chemin que le thème du jeu au démarrage** — le pont, puis
     * l'arbitre unique. Poser les variables à la main ici ferait un second
     * écrivain, et l'aperçu finirait par ne plus ressembler au résultat.
     */
    const appliquer = useCallback((jetons: Record<string, string>) => {
        appliquerLeTheme(theme, themeColor, {
            variables: pontVersLInterface(jetons, { personnalites }),
            jetons,
            clarte,
        }, { personnalites });
        const url = requeteDePolices(
            JETONS_EDITABLES.filter(j => j.famille === 'police')
                .map(j => familleDeLaPile(jetons[j.cle])),
        );
        poserLesPolices(url ? [url] : []);
    }, [theme, themeColor, clarte, personnalites]);

    useEffect(() => {
        if (chargement || !racine) return;
        appliquer(valeurs);
    }, [valeurs, chargement, racine, appliquer]);

    /*
      **L'aperçu ne survit pas à l'atelier.** Au démontage, on repose ce qui est
      sur le disque : sans ça, fermer les réglages laisserait l'interface peinte
      d'un thème que le fichier ne porte pas — et le meneur croirait avoir
      enregistré.
    */
    useEffect(() => () => {
        appliquerLeTheme(theme, themeColor, {
            variables: pontVersLInterface(enregistrees.current, { personnalites }),
            jetons: enregistrees.current,
            clarte,
        }, { personnalites });
        poserLesPolices(policesEnregistrees.current);
        // Volontairement sans dépendances : ce nettoyage ne doit jouer qu'une
        // fois, à la fermeture, avec les dernières valeurs enregistrées.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ── Écriture ────────────────────────────────────────────────────────── */
    const modifie = useMemo(
        () => JETONS_EDITABLES.some(j => (valeurs[j.cle] ?? '') !== (enregistrees.current[j.cle] ?? '')),
        [valeurs],
    );

    const enregistrer = async () => {
        if (!racine) return;
        setEnCoursDEcriture(true);

        const familles = JETONS_EDITABLES.filter(j => j.famille === 'police')
            .map(j => familleDeLaPile(valeurs[j.cle]));
        const url = requeteDePolices(familles);

        const base = cssOrigine ?? themeVierge(nomDuJeu, valeurs);
        const css = ecrireLImportDePolices(ecrireLesJetons(base, valeurs), url);

        /*
          **La copie d'origine part AVANT la première réécriture**, et son échec
          arrête tout : *on n'écrase pas un fichier qu'on ne sait pas rendre.*
          Elle n'est prise qu'une fois — la reprendre au deuxième enregistrement
          sauvegarderait nos propres retouches, ce qui reviendrait à n'avoir
          aucun filet tout en croyant en avoir un.
        */
        if (!originalPresent && cssOrigine !== null) {
            const sauve = await window.appBridge?.ai?.writeDoc?.(cheminDeLOriginal(racine), cssOrigine);
            if (!sauve) {
                setEnCoursDEcriture(false);
                gmToast('Impossible d’écrire la copie d’origine : rien n’a été modifié.', 'error');
                return;
            }
            setOriginalPresent(true);
        }

        const ecrit = await window.appBridge?.ai?.writeDoc?.(cheminDuTheme(racine), css);
        setEnCoursDEcriture(false);

        if (!ecrit) {
            gmToast('Le thème n’a pas pu être écrit. Voir la console pour le chemin.', 'error');
            return;
        }

        setCssOrigine(css);
        enregistrees.current = { ...valeurs };
        policesEnregistrees.current = url ? [url] : [];
        gmToast(`Thème de « ${nomDuJeu} » enregistré.`, 'success');
    };

    /**
     * Remet le thème d'avant les retouches, fichier compris.
     *
     * On réécrit `theme.css` avec la copie **telle quelle** : les règles de
     * fiche reviennent avec les jetons, puisque c'est le même fichier. La copie
     * d'origine, elle, reste — *un retour en arrière qui se détruit lui-même ne
     * se fait qu'une fois.*
     */
    const restaurerLOriginal = async () => {
        if (!racine) return;
        setConfirmeLaRestauration(false);
        setEnCoursDEcriture(true);

        const original = await window.appBridge?.ai?.readDoc?.(cheminDeLOriginal(racine));
        if (!original) {
            setEnCoursDEcriture(false);
            gmToast('La copie d’origine est introuvable.', 'error');
            return;
        }

        const ecrit = await window.appBridge?.ai?.writeDoc?.(cheminDuTheme(racine), original);
        setEnCoursDEcriture(false);
        if (!ecrit) {
            gmToast('Le thème n’a pas pu être restauré.', 'error');
            return;
        }

        const releve = extraireJetons(original);
        setCssOrigine(original);
        setClarte(releve.clarte);
        setValeurs(releve.jetons);
        enregistrees.current = releve.jetons;
        gmToast(`Thème de « ${nomDuJeu} » revenu à son original.`, 'success');
    };

    const creerUnTheme = () => {
        setCssOrigine(themeVierge(nomDuJeu, JETONS_PAR_DEFAUT));
        setValeurs({ ...JETONS_PAR_DEFAUT });
    };

    const revenir = () => setValeurs({ ...enregistrees.current });

    const poser = (cle: string, valeur: string) =>
        setValeurs(v => ({ ...v, [cle]: valeur }));

    /* ── Rendu ───────────────────────────────────────────────────────────── */

    if (chargement) {
        return (
            <div className="flex-1 flex items-center justify-center text-app-text/40 gap-3">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Lecture du thème…</span>
            </div>
        );
    }

    if (!racine) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                <Palette size={28} className="text-app-text/20" />
                <p className="text-sm font-black uppercase tracking-widest text-app-text/50">
                    Aucune campagne ouverte
                </p>
                <p className="text-xs text-app-text/40 max-w-sm">
                    Un thème appartient à un jeu. Ouvre une campagne, et son jeu s’habillera ici.
                </p>
            </div>
        );
    }

    /*
      **L'accent choisi à la main passe devant celui du jeu**, et c'est la règle
      « le jeu gagne, la main surcharge » du 2026-08-23. Le dire ici évite de
      chercher pourquoi une couleur enregistrée ne se voit pas.
    */
    const accentSurcharge = !!themeColor && themeColor !== accentDuTheme(theme);

    /*
      **L'atelier de la maquette retenue** — refonte, L6
      (`stitch/outillage/outillage-atelier-du-theme.png`) : chaque réglage dit
      où il se voit et le montre ; à droite, l'aperçu vivant ; en pied, les
      trois gestes — restaurer l'original, annuler, enregistrer. Les jetons CSS
      restent consultables, repliés : *utiles au développeur, pas au meneur*.
      « Empreinte SHA » et « Écran table connecté » sont des inventions du dessin.
    */
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/* En-tête : le jeu, son fichier, ce que fait l'atelier */}
            <div className="flex items-start gap-3 border-b border-app-border px-6 pb-3 pt-5">
                <Palette size={18} className="mt-0.5 shrink-0 text-accent" />
                <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold uppercase tracking-wide text-app-text">{nomDuJeu}</h3>
                    <p className="mt-0.5 font-mono text-ui-10 text-app-muted">docs/{cheminDuTheme(racine)}</p>
                    <p className="mt-1 max-w-2xl text-xs text-app-muted">
                        Ce fichier habille l’application <strong className="text-app-text">et</strong> les fiches de personnage.
                        Chaque réglage s’applique tout de suite à l’écran ; rien n’est écrit avant « Enregistrer le thème ».
                    </p>
                </div>
                {modifie && <Etiquette ton="alerte" className="ml-auto shrink-0">Modifié, pas enregistré</Etiquette>}
            </div>

            <div className="flex min-h-0 flex-1">
                {/* ── Les réglages ── */}
                <div className="min-w-0 flex-1 space-y-6 overflow-y-auto px-6 py-5 custom-scrollbar">
                    {cssOrigine === null && (
                        <div className="flex items-start gap-4 rounded-xl border border-etat-alerte/40 bg-etat-alerte/5 p-4">
                            <FilePlus2 size={18} className="mt-0.5 shrink-0 text-etat-alerte" />
                            <div className="flex-1">
                                <p className="text-xs font-black uppercase tracking-widest text-etat-alerte">Ce jeu n’a pas encore de thème</p>
                                <p className="mt-1 max-w-xl text-xs text-app-muted">
                                    Je peux en créer un neuf : les vingt-deux jetons, et rien d’autre. Les
                                    habillages de fiche d’un thème complet décrivent une page de livre —
                                    les inventer serait prétendre connaître la direction artistique de ton jeu.
                                </p>
                            </div>
                            <Bouton variante="accent" icone={<FilePlus2 size={14} />} onClick={creerUnTheme} className="shrink-0">Créer un thème</Bouton>
                        </div>
                    )}

                    {GROUPES.map((groupe, rang) => {
                        const jetons = JETONS_EDITABLES.filter(j => j.groupe === groupe.id);
                        return (
                            <section key={groupe.id} className="space-y-2">
                                <h4 className="flex items-baseline justify-between gap-3 border-b border-app-border pb-1.5 font-display text-sm font-bold uppercase tracking-wider text-app-text">
                                    <span><span className="text-accent">{String(rang + 1).padStart(2, '0')}</span> · {groupe.titre}</span>
                                    <span className="text-ui-10 font-black text-app-muted">{jetons.length} réglages</span>
                                </h4>
                                <div className="flex flex-col gap-2">
                                    {jetons.map(jeton => (
                                        <ChampDeJeton
                                            key={jeton.cle}
                                            jeton={jeton}
                                            valeur={valeurs[jeton.cle] ?? ''}
                                            enregistree={enregistrees.current[jeton.cle] ?? ''}
                                            poser={poser}
                                            alerte={jeton.cle === 'accent' && accentSurcharge
                                                ? 'Un accent est choisi à la main dans les réglages : il passe devant celui du jeu.'
                                                : undefined}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* ── L'aperçu vivant ── */}
                <aside className="hidden w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-app-border p-4 custom-scrollbar lg:flex">
                    <p className="text-ui-10 font-black uppercase tracking-widest text-app-muted">
                        Aperçu en direct <span className="font-normal normal-case tracking-normal">— suit chaque réglage</span>
                    </p>
                    <ApercuVivant />
                    <ControleDuContraste valeurs={valeurs} />
                    <details className="rounded-lg border border-app-border bg-app-bg/40 p-3">
                        <summary className="cursor-pointer text-ui-10 font-black uppercase tracking-widest text-app-muted hover:text-app-text">Les jetons, tels qu’écrits</summary>
                        <pre className="mt-2 max-h-56 overflow-auto font-mono text-ui-10 leading-relaxed text-app-muted custom-scrollbar">
                            {JETONS_EDITABLES.filter(j => valeurs[j.cle]).map(j => `--rpg-${j.cle}: ${valeurs[j.cle]};`).join('\n')}
                        </pre>
                    </details>
                </aside>
            </div>

            {/*
              **Deux retours en arrière, et ils ne disent pas la même chose.**
              « Annuler » défait ce qui n'est pas enregistré ; « Restaurer
              l'original » remonte au thème d'avant toutes les retouches. Les
              confondre ferait perdre une séance de réglages à qui voulait juste
              défaire son dernier geste — d'où le second clic de confirmation.
            */}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-app-border px-6 py-3">
                {originalPresent && (
                    <Bouton
                        variante={confirmeLaRestauration ? 'danger' : 'neutre'}
                        icone={<History size={14} />}
                        onClick={() => confirmeLaRestauration ? void restaurerLOriginal() : setConfirmeLaRestauration(true)}
                        onBlur={() => setConfirmeLaRestauration(false)}
                        disabled={enCoursDEcriture}
                        title="Remettre le thème tel qu’il était avant tes retouches"
                        className="mr-auto"
                    >
                        {confirmeLaRestauration ? 'Confirmer : revenir à l’original ?' : 'Restaurer l’original'}
                    </Bouton>
                )}
                <Bouton icone={<RotateCcw size={14} />} onClick={revenir} disabled={!modifie}>Annuler</Bouton>
                <Bouton
                    variante="accent"
                    icone={enCoursDEcriture ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    onClick={() => void enregistrer()}
                    disabled={!modifie || enCoursDEcriture}
                >
                    Enregistrer le thème
                </Bouton>
            </div>
        </div>
    );
};

/* ────────────────────────────────────────────────────────────────────────────
   L'APERÇU VIVANT
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * **Une carte de combattant, des badges** — la maquette retenue. Elle est
 * peinte avec les classes de l'interface : comme l'atelier repeint
 * l'interface à chaque réglage, la carte suit sans rien savoir des jetons.
 */
const ApercuVivant: React.FC = () => (
    <div className="flex flex-col gap-3 rounded-xl border border-app-border bg-app-surface p-4">
        <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
                <p className="flex items-center gap-2 font-display text-base font-bold uppercase tracking-wide text-app-text">
                    Roy Batty <Etiquette ton="danger">Hostile</Etiquette>
                </p>
                <p className="text-ui-10 uppercase tracking-widest text-app-muted">Réplicant · combat</p>
            </div>
            <div className="text-right">
                <p className="text-ui-9 font-black uppercase tracking-widest text-app-muted">Initiative</p>
                <p className="font-mono text-2xl font-bold text-accent">21</p>
            </div>
        </div>
        <div>
            <div className="mb-1 flex justify-between text-xs">
                <span className="text-app-muted">Santé</span>
                <span className="font-mono font-bold text-app-text">14 / 15</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-app-bg"><div className="h-full w-[93%] bg-etat-succes" /></div>
        </div>
        <div className="flex gap-2">
            <Bouton variante="accent" className="flex-1">Calculer</Bouton>
            <Bouton className="flex-1">Fiche</Bouton>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-app-border pt-3">
            <Etiquette ton="danger">Critique</Etiquette>
            <Etiquette ton="succes">Stable</Etiquette>
            <Etiquette ton="alerte">Enragé</Etiquette>
            <Etiquette ton="info">Couvert</Etiquette>
        </div>
    </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   LES CHAMPS
   ──────────────────────────────────────────────────────────────────────────── */

const estUnHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());

/**
 * **Un réglage : où il se voit, ce qu'il fait, sa valeur.** La vignette montre
 * la zone ; l'aide la dit ; « Réinit. » rend la valeur enregistrée — pas celle
 * d'usine, que « Restaurer l'original » sait rendre pour tout le thème.
 */
const ChampDeJeton: React.FC<{
    jeton: JetonEditable;
    valeur: string;
    enregistree: string;
    poser: (cle: string, valeur: string) => void;
    alerte?: string;
}> = ({ jeton, valeur, enregistree, poser, alerte }) => (
    <div className={`flex flex-wrap items-center gap-4 rounded-xl border bg-app-surface/60 p-3 ${valeur !== enregistree ? 'border-etat-alerte/50' : 'border-app-border'}`}>
        <VignetteDeZone zone={ZONE_DU_JETON[jeton.cle] ?? 'tailles'} />
        <div className="min-w-[14rem] flex-1">
            <p className="flex items-center gap-2 font-display text-sm font-bold text-app-text">
                {jeton.label}
                {!jeton.surLInterface && <Etiquette ton="neutre">{POUR_LES_FICHES}</Etiquette>}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-app-muted">{jeton.aide}</p>
            {alerte && (
                <p className="mt-1 flex items-start gap-1.5 text-ui-10 leading-snug text-etat-alerte">
                    <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {alerte}
                </p>
            )}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto sm:min-w-[16rem] sm:max-w-[24rem] sm:flex-1">
            {jeton.famille === 'couleur' && (
                <>
                    <input
                        type="text"
                        value={valeur}
                        onChange={e => poser(jeton.cle, e.target.value)}
                        placeholder="#000000 ou rgba(…)"
                        aria-label={jeton.label}
                        className="min-w-0 flex-1 rounded-lg border border-app-border bg-app-bg px-3 py-2 font-mono text-xs text-app-text outline-none focus:border-accent/60"
                    />
                    {estUnHex(valeur) && (
                        <input
                            type="color"
                            value={valeur.trim()}
                            onChange={e => poser(jeton.cle, e.target.value)}
                            title={jeton.label}
                            aria-label={`${jeton.label} — sélecteur`}
                            className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-app-border bg-transparent"
                        />
                    )}
                </>
            )}
            {jeton.famille === 'police' && <div className="min-w-0 flex-1"><ChampDePolice jeton={jeton} valeur={valeur} poser={poser} /></div>}
            {jeton.famille === 'echelle' && <div className="min-w-0 flex-1"><ChampDEchelle jeton={jeton} valeur={valeur} poser={poser} /></div>}
            {(jeton.famille === 'longueur' || jeton.famille === 'ombre') && (
                <input
                    type="text"
                    value={valeur}
                    onChange={e => poser(jeton.cle, e.target.value)}
                    placeholder={jeton.famille === 'ombre' ? '0 20px 60px rgba(0,0,0,.4)' : '0px'}
                    aria-label={jeton.label}
                    className="min-w-0 flex-1 rounded-lg border border-app-border bg-app-bg px-3 py-2 font-mono text-xs text-app-text outline-none focus:border-accent/60"
                />
            )}
            <button
                onClick={() => poser(jeton.cle, enregistree)}
                disabled={valeur === enregistree}
                title="Revenir à la valeur enregistrée"
                className="shrink-0 rounded-lg border border-app-border px-2.5 py-2 text-ui-10 font-black uppercase tracking-widest text-app-muted transition-colors hover:text-app-text disabled:opacity-30"
            >
                Réinit.
            </button>
        </div>
    </div>
);

/**
 * **La police, et la seule question qui compte : arrivera-t-elle ?**
 *
 * *Le piège du 2026-08-24* — une famille déclarée sans import n'est jamais
 * téléchargée, et le navigateur retombe **en silence** sur le repli. Choisir
 * dans la liste écrit l'import ; taper un nom libre ne le peut pas, et on le
 * dit au lieu de le laisser découvrir.
 */
const ChampDePolice: React.FC<{
    jeton: JetonEditable;
    valeur: string;
    poser: (cle: string, valeur: string) => void;
}> = ({ jeton, valeur, poser }) => {
    const famille = familleDeLaPile(valeur);
    const connue = POLICES_CONNUES.some(p => p.famille === famille);
    const fourniture = policeFournie(famille);

    /*
      **Les polices en choix nommés** — maquette retenue : quelques pastilles,
      chacune écrite dans sa police, choisies selon le rôle. La liste complète
      et la saisie libre restent dessous.
    */
    const genres: string[] = jeton.cle === 'font-mono' ? ['mono']
        : jeton.cle === 'font-display' ? ['titre', 'serif', 'atmosphere']
            : ['sans', 'serif'];
    const suggestions = POLICES_CONNUES.filter(p => genres.includes(p.genre)).slice(0, 6);

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
                {suggestions.map(p => (
                    <button
                        key={p.famille}
                        type="button"
                        onClick={() => poser(jeton.cle, pileDePolice(p.famille))}
                        aria-pressed={famille === p.famille}
                        style={{ fontFamily: `"${p.famille}"` }}
                        className={`rounded-md border px-2.5 py-1 text-sm transition-colors ${
                            famille === p.famille ? 'border-accent bg-accent text-app-on-accent' : 'border-app-border text-app-text hover:border-accent/60'
                        }`}
                    >
                        {p.famille}
                    </button>
                ))}
            </div>
            <select
                value={connue ? famille : ''}
                onChange={e => e.target.value && poser(jeton.cle, pileDePolice(e.target.value))}
                aria-label={`${jeton.label} — famille`}
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-xs font-bold text-app-text outline-none focus:border-accent/60"
            >
                <option value="">— autre (saisie libre) —</option>
                {POLICES_CONNUES.map(p => (
                    <option key={p.famille} value={p.famille}>
                        {p.famille}{p.deja ? ' · déjà chargée' : ''}
                    </option>
                ))}
            </select>

            <input
                type="text"
                value={valeur}
                onChange={e => poser(jeton.cle, e.target.value)}
                placeholder='"Ma Police", serif'
                aria-label={jeton.label}
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-ui-11 font-mono text-app-text outline-none focus:border-accent/60"
            />

            {famille && (
                <p className={`text-ui-10 flex items-start gap-1.5 leading-snug ${
                    fourniture === 'locale' ? 'text-etat-alerte/90' : 'text-etat-succes/80'
                }`}>
                    {fourniture === 'locale'
                        ? <><AlertTriangle size={11} className="mt-0.5 shrink-0" />
                            Police inconnue du catalogue : elle ne sera pas téléchargée. Elle ne
                            s’affichera que si elle est installée sur cette machine.</>
                        : <><Check size={11} className="mt-0.5 shrink-0" />
                            {fourniture === 'application'
                                ? 'Chargée par GM-OS : disponible partout, même hors ligne.'
                                : 'Téléchargée par l’import écrit dans le thème.'}</>}
                </p>
            )}
        </div>
    );
};

/**
 * **Une taille se choisit dans une liste, pas sur un curseur** — David, le
 * 2026-09-06 : *« ne serait-ce pas plus simple d'avoir une liste avec les
 * différentes tailles ? »*
 *
 * Le curseur d'avant affichait « 107 % », ce qui ne dit rien de ce qu'on va
 * obtenir et ne se repose jamais deux fois au même endroit. Les six paliers
 * nommés vivent dans `editionDuTheme.ts`, avec la raison pour laquelle une
 * liste **par police** reste refusée.
 *
 * ⛔ **Il écrivait `'font-scale'` en dur.** Trouvé par David le 2026-09-05, le
 * jour même où les quatre bandes de taille sont arrivées : *« quand je bouge un
 * slider, c'est le slider tout le texte qui bouge »*.
 *
 * Tant qu'il n'y avait **qu'un seul** réglage d'échelle, la clé en dur et la clé
 * du jeton se confondaient — le défaut n'existait pas encore, il attendait.
 * Les cinq réglages pilotaient donc tous le même jeton.
 *
 * *Un composant qui édite un champ doit savoir LEQUEL* : il le reçoit
 * maintenant, comme `ChampDePolice` le fait depuis toujours à deux lignes
 * d'ici. La ressemblance entre les deux rendait l'écart d'autant plus
 * invisible.
 */
const ChampDEchelle: React.FC<{
    jeton: JetonEditable;
    valeur: string;
    poser: (cle: string, valeur: string) => void;
}> = ({ jeton, valeur, poser }) => {
    const echelle = echelleDeTexte(valeur);
    const palier = palierDeLEchelle(valeur);
    /* Une valeur réglée qui ne tombe sur aucun palier — un curseur d'avant, ou
       un thème écrit à la main. On l'offre au lieu de la remplacer en silence. */
    const horsPalier = echelle !== null && palier === null;

    return (
        <div className="flex items-center gap-3">
            <select
                value={echelle === null ? '' : String(echelle)}
                onChange={e => poser(jeton.cle, e.target.value)}
                aria-label={jeton.label}
                className="flex-1 bg-app-surface border border-app-border rounded-lg px-3 py-2 text-xs font-bold text-app-text outline-none focus:border-accent/60"
            >
                {/* La valeur vide EFFACE le jeton : *ne rien dire et dire
                    « 100 % » ne sont pas la même chose pour le thème.* */}
                <option value="">Non réglé — laisse le défaut</option>
                {PALIERS_DE_TAILLE.map(p => (
                    <option key={p.valeur} value={p.valeur}>
                        {p.label} · {Math.round(Number(p.valeur) * 100)} %
                    </option>
                ))}
                {horsPalier && (
                    <option value={String(echelle)}>
                        Personnalisé · {Math.round(echelle * 100)} %
                    </option>
                )}
            </select>
        </div>
    );
};

/**
 * **Trois paires, pas vingt.** *Une liste d'avertissements ne se lit pas, donc
 * ne sert à rien.* Et une paire qu'on ne sait pas mesurer — une bordure en
 * `rgba` — ne dit rien du tout plutôt qu'un chiffre faux.
 */
const ControleDuContraste: React.FC<{ valeurs: Record<string, string> }> = ({ valeurs }) => {
    const mesures = PAIRES_A_CONTROLER
        .map(paire => ({ ...paire, valeur: contraste(valeurs[paire.texte] ?? '', valeurs[paire.fond] ?? '') }))
        .filter(m => m.valeur !== null);

    if (mesures.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {mesures.map(m => {
                const passe = (m.valeur as number) >= m.seuil;
                return (
                    <div
                        key={m.quoi}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-ui-10 font-bold ${
                            passe
                                ? 'border-etat-succes/20 bg-etat-succes/5 text-etat-succes/90'
                                : 'border-etat-alerte/30 bg-etat-alerte/5 text-etat-alerte'
                        }`}
                    >
                        {passe ? <Check size={11} /> : <AlertTriangle size={11} />}
                        <span className="uppercase tracking-widest">{m.quoi}</span>
                        <span className="font-mono">{m.valeur}:1</span>
                        <span className="opacity-50">min {m.seuil}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default AtelierDuTheme;
