import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Palette, Save, RotateCcw, FilePlus2, AlertTriangle, Check, Loader2, History } from 'lucide-react';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useSessionStore } from '../store/useSessionStore';
import { gmToast } from '../stores/useToastStore';
import { jeuDeLaCampagneActive } from './jeuDeLaCampagne';
import { cheminDuTheme, extraireJetons, pontVersLInterface } from './jetonsDeTheme';
import { appliquerLeTheme, PALETTES, type ThemeID } from './themeDeLInterface';
import { poserLesPolices } from './themeDuJeu';
import {
    cheminDeLOriginal, contraste, ecrireLesJetons, ecrireLImportDePolices, echelleDeTexte,
    familleDeLaPile, GROUPES, JETONS_EDITABLES, JETONS_PAR_DEFAUT, PAIRES_A_CONTROLER,
    pileDePolice, policeFournie, POLICES_CONNUES, requeteDePolices, themeVierge,
    ECHELLE_MAX, ECHELLE_MIN, type JetonEditable,
} from './editionDuTheme';

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
            variables: pontVersLInterface(jetons),
            jetons,
            clarte,
        });
        const url = requeteDePolices(
            JETONS_EDITABLES.filter(j => j.famille === 'police')
                .map(j => familleDeLaPile(jetons[j.cle])),
        );
        poserLesPolices(url ? [url] : []);
    }, [theme, themeColor, clarte]);

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
            variables: pontVersLInterface(enregistrees.current),
            jetons: enregistrees.current,
            clarte,
        });
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
    const accentSurcharge = !!themeColor && themeColor !== PALETTES[theme as ThemeID]?.accent;

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* En-tête */}
            <div className="px-8 pt-6 pb-4 flex items-start justify-between gap-6 border-b border-app-border/10">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-app-text flex items-center gap-2">
                        <Palette size={16} className="text-accent" />
                        {nomDuJeu}
                    </h3>
                    <p className="text-[10px] font-mono text-app-text/40 mt-1">
                        docs/{cheminDuTheme(racine)}
                    </p>
                    <p className="text-[10px] text-app-text/40 mt-1 max-w-lg">
                        Ce fichier habille l’application <strong>et</strong> les fiches de personnage.
                        Les réglages s’appliquent tout de suite ; rien n’est écrit avant « Enregistrer ».
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/*
                      **Deux retours en arrière, et ils ne disent pas la même
                      chose.** « Annuler » défait ce qui n'est pas enregistré ;
                      « Restaurer » remonte au thème d'avant toutes les
                      retouches. Les confondre ferait perdre une séance de
                      réglages à qui voulait juste défaire son dernier geste —
                      d'où le second clic de confirmation, et lui seul.
                    */}
                    {originalPresent && (
                        <button
                            onClick={() => confirmeLaRestauration ? void restaurerLOriginal() : setConfirmeLaRestauration(true)}
                            onBlur={() => setConfirmeLaRestauration(false)}
                            disabled={enCoursDEcriture}
                            title="Remettre le thème tel qu’il était avant tes retouches"
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all disabled:opacity-30 ${
                                confirmeLaRestauration
                                    ? 'border-amber-500/60 bg-amber-500/15 text-amber-500'
                                    : 'border-app-border bg-app-bg text-app-text/60 hover:text-app-text'
                            }`}
                        >
                            <History size={13} />
                            {confirmeLaRestauration ? 'Confirmer ?' : 'Restaurer l’original'}
                        </button>
                    )}
                    <button
                        onClick={revenir}
                        disabled={!modifie}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-app-border bg-app-bg text-app-text/60 hover:text-app-text disabled:opacity-30 transition-all"
                    >
                        <RotateCcw size={13} /> Annuler
                    </button>
                    <button
                        onClick={() => void enregistrer()}
                        disabled={!modifie || enCoursDEcriture}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-accent text-app-bg disabled:opacity-30 transition-all"
                    >
                        {enCoursDEcriture ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Enregistrer
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-8">
                {cssOrigine === null && (
                    <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-4">
                        <FilePlus2 size={18} className="text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-widest text-amber-500">
                                Ce jeu n’a pas encore de thème
                            </p>
                            <p className="text-[11px] text-app-text/50 mt-1 max-w-xl">
                                Je peux en créer un neuf : les vingt-deux jetons, et rien d’autre. Les
                                habillages de fiche d’un thème complet décrivent une page de livre —
                                les inventer serait prétendre connaître la direction artistique de ton jeu.
                            </p>
                        </div>
                        <button
                            onClick={creerUnTheme}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0"
                        >
                            Créer un thème
                        </button>
                    </div>
                )}

                <ControleDuContraste valeurs={valeurs} />

                {GROUPES.map(groupe => (
                    <section key={groupe.id} className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-app-text/40 border-l-2 border-accent/30 pl-3">
                            {groupe.titre}
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            {JETONS_EDITABLES.filter(j => j.groupe === groupe.id).map(jeton => (
                                <ChampDeJeton
                                    key={jeton.cle}
                                    jeton={jeton}
                                    valeur={valeurs[jeton.cle] ?? ''}
                                    poser={poser}
                                    alerte={jeton.cle === 'accent' && accentSurcharge
                                        ? 'Un accent est choisi à la main dans les réglages : il passe devant celui du jeu.'
                                        : undefined}
                                />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

/* ────────────────────────────────────────────────────────────────────────────
   LES CHAMPS
   ──────────────────────────────────────────────────────────────────────────── */

const estUnHex = (v: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());

const ChampDeJeton: React.FC<{
    jeton: JetonEditable;
    valeur: string;
    poser: (cle: string, valeur: string) => void;
    alerte?: string;
}> = ({ jeton, valeur, poser, alerte }) => (
    <div className="p-4 rounded-2xl bg-app-bg/40 border border-app-border/60 space-y-2">
        <div className="flex items-center justify-between gap-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-app-text/80">
                {jeton.label}
            </label>
            {!jeton.surLInterface && (
                <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-app-surface text-app-text/30 border border-app-border/60">
                    {POUR_LES_FICHES}
                </span>
            )}
        </div>

        {jeton.famille === 'couleur' && (
            <div className="flex items-center gap-2">
                {estUnHex(valeur) && (
                    <input
                        type="color"
                        value={valeur.trim()}
                        onChange={e => poser(jeton.cle, e.target.value)}
                        title={jeton.label}
                        aria-label={`${jeton.label} — sélecteur`}
                        className="w-9 h-9 rounded-lg bg-transparent border border-app-border cursor-pointer shrink-0"
                    />
                )}
                <input
                    type="text"
                    value={valeur}
                    onChange={e => poser(jeton.cle, e.target.value)}
                    placeholder="#000000 ou rgba(…)"
                    aria-label={jeton.label}
                    className="flex-1 bg-app-surface border border-app-border rounded-lg px-3 py-2 text-xs font-mono text-app-text outline-none focus:border-accent/60"
                />
            </div>
        )}

        {jeton.famille === 'police' && <ChampDePolice jeton={jeton} valeur={valeur} poser={poser} />}

        {jeton.famille === 'echelle' && <ChampDEchelle valeur={valeur} poser={poser} />}

        {(jeton.famille === 'longueur' || jeton.famille === 'ombre') && (
            <input
                type="text"
                value={valeur}
                onChange={e => poser(jeton.cle, e.target.value)}
                placeholder={jeton.famille === 'ombre' ? '0 20px 60px rgba(0,0,0,.4)' : '0px'}
                aria-label={jeton.label}
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-xs font-mono text-app-text outline-none focus:border-accent/60"
            />
        )}

        <p className="text-[10px] text-app-text/35 leading-snug">{jeton.aide}</p>
        {alerte && (
            <p className="text-[10px] text-amber-500/90 leading-snug flex items-start gap-1.5">
                <AlertTriangle size={11} className="mt-0.5 shrink-0" /> {alerte}
            </p>
        )}
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

    return (
        <div className="space-y-2">
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
                className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-[11px] font-mono text-app-text outline-none focus:border-accent/60"
            />

            {famille && (
                <p className={`text-[10px] flex items-start gap-1.5 leading-snug ${
                    fourniture === 'locale' ? 'text-amber-500/90' : 'text-emerald-500/80'
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

const ChampDEchelle: React.FC<{
    valeur: string;
    poser: (cle: string, valeur: string) => void;
}> = ({ valeur, poser }) => {
    const echelle = echelleDeTexte(valeur);

    return (
        <div className="flex items-center gap-3">
            <input
                type="range"
                min={ECHELLE_MIN}
                max={ECHELLE_MAX}
                step={0.01}
                value={echelle ?? 1}
                onChange={e => poser('font-scale', e.target.value)}
                aria-label="Échelle du texte"
                className="flex-1 accent-[var(--app-accent)]"
            />
            <span className="text-xs font-black text-accent font-mono w-14 text-right">
                {Math.round((echelle ?? 1) * 100)} %
            </span>
            {echelle !== null && (
                <button
                    onClick={() => poser('font-scale', '')}
                    title="Retirer l’échelle du thème"
                    className="text-[9px] font-black uppercase tracking-widest text-app-text/40 hover:text-app-text"
                >
                    Défaut
                </button>
            )}
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
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold ${
                            passe
                                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500/90'
                                : 'border-amber-500/30 bg-amber-500/5 text-amber-500'
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
