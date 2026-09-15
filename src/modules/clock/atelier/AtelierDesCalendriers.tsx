import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    X, Plus, Trash2, Save, AlertTriangle, Info, CheckCircle2,
    Loader2, Sparkles, ArrowUp, ArrowDown, CalendarPlus,
} from 'lucide-react';
import {
    controlerLeCalendrier,
    cycleBissextile,
    identifiantDuCalendrier,
    leCalendrierEstFautif,
    type CalendrierDatable,
    type Constat,
} from '../logic/formeDuCalendrier';
import { proposerUnCalendrier } from '../logic/propositionDeCalendrier';
import { MesureDeLAnnee } from './MesureDeLAnnee';
import { useFermetureParEchap } from '../../../hooks/useFermetureParEchap';
import { gmToast } from '../../../stores/useToastStore';

/**
 * **L'Atelier des calendriers — composer une année sans écrire de JSON.**
 *
 * *Demandé par David le 2026-09-15 : « peut-on faire un module d'aide à la
 * création de calendrier fantastique ? ».*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ CE QUE LE COMPTAGE A TROUVÉ AVANT QU'UNE LIGNE SOIT ÉCRITE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * **Un seul calendrier existait** — `harptos.json`, livré d'usine — et en un
 * mois de construction David n'en avait jamais fait un second. La raison
 * n'était pas le manque d'envie : **il n'existait aucun chemin d'écriture**.
 * `clock:list-calendars` et `clock:load-calendar`, point.
 *
 * ⛔⛔ **Et un calendrier mal formé ne rend pas une mauvaise date : il GÈLE
 * GM-OS.** `getFantasyDate` avance d'année en année par soustraction ; sur une
 * année de longueur nulle — aucun mois, ou `hoursPerDay: 0` — la boucle ne se
 * termine jamais. Mesuré : cinquante millions de tours sans sortir.
 *
 * > *Aujourd'hui c'est inatteignable, personne ne pouvant écrire un calendrier.*
 * > **Cet écran rend ça atteignable au clavier.** C'est pourquoi le contrôle
 * > n'est pas son confort mais sa condition — et pourquoi la même garde tient
 * > aussi dans le magasin, où arrivent les fichiers posés à la main.
 *
 * ⛔ **Trois familles de champs étaient écrites et lues par personne** :
 * `currentYear` et ses cinq compagnons — Harptos déclare 1492, et le choisir
 * affichait **l'an 56** —, et `daysPerWeek`, requis par le type et absent du
 * seul fichier existant. Elles vivent enfin.
 *
 * ⭐ **L'ordre des choses ici : la mesure d'abord, les champs ensuite.** Une
 * table trouée se voit ; *un calendrier dont l'année fait 358 jours au lieu de
 * 360 a l'air parfait.* Le seul nombre que l'auteur a en tête est celui
 * qu'aucune saisie ne montre.
 */

interface Props {
    ouvert: boolean;
    onFermer: () => void;
    /** Pour que le pupitre recharge sa liste après une écriture. */
    onCalendriersChanges: () => void;
    /** Le calendrier à reprendre, s'il y en a un de choisi au pupitre. */
    idDepart?: string | null;
}

/** Un calendrier neuf : le plus proche du nôtre, parce qu'on part de ce qu'on connaît. */
function calendrierNeuf(): CalendrierDatable {
    return {
        id: '',
        name: '',
        months: [{ name: 'Premier mois', days: 30 }],
        daysPerWeek: 7,
        daysOfWeek: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
        hoursPerDay: 24,
        minutesPerHour: 60,
    };
}

const ICONE: Record<Constat['gravite'], React.ReactNode> = {
    faute: <AlertTriangle size={12} className="text-red-400 shrink-0" />,
    doute: <AlertTriangle size={12} className="text-orange-400 shrink-0" />,
    note: <Info size={12} className="text-app-text/40 shrink-0" />,
};

const TEINTE: Record<Constat['gravite'], string> = {
    faute: 'text-red-400',
    doute: 'text-orange-300',
    note: 'text-app-text/50',
};

export const AtelierDesCalendriers: React.FC<Props> = ({
    ouvert, onFermer, onCalendriersChanges, idDepart,
}) => {
    const [calendrier, setCalendrier] = useState<CalendrierDatable>(calendrierNeuf);
    const [identifiants, setIdentifiants] = useState<string[]>([]);
    const [joursVises, setJoursVises] = useState<number | ''>('');
    const [enregistrement, setEnregistrement] = useState(false);

    /* La description libre pour l'IA, et son attente. */
    const [description, setDescription] = useState('');
    const [compositionEnCours, setCompositionEnCours] = useState(false);

    useFermetureParEchap(ouvert, onFermer, 'Atelier des calendriers');

    const pont = () => window.appBridge?.clock;

    const rafraichirLaListe = useCallback(async () => {
        const liste = await pont()?.listCalendars?.();
        setIdentifiants(liste ?? []);
    }, []);

    const reprendre = useCallback(async (id: string) => {
        const brut = await pont()?.loadCalendar?.(id);
        if (!brut) {
            gmToast(`« ${id} » est introuvable.`, 'warning');
            return;
        }
        setCalendrier({ ...(brut as unknown as CalendrierDatable), id });
    }, []);

    useEffect(() => {
        if (!ouvert) return;
        void rafraichirLaListe();
        if (idDepart) void reprendre(idDepart);
    }, [ouvert, idDepart, rafraichirLaListe, reprendre]);

    const constats = useMemo(() => controlerLeCalendrier(calendrier), [calendrier]);
    const fautif = useMemo(() => leCalendrierEstFautif(calendrier), [calendrier]);

    /* ─────────────────────────── Les gestes sur les mois ─────────────────────────── */

    const majMois = (i: number, sur: Partial<CalendrierDatable['months'][number]>) =>
        setCalendrier(c => ({
            ...c,
            months: c.months.map((m, n) => (n === i ? { ...m, ...sur } : m)),
        }));

    const ajouterUnMois = () => setCalendrier(c => ({
        ...c,
        months: [...c.months, { name: `Mois ${c.months.length + 1}`, days: 30 }],
    }));

    const retirerUnMois = (i: number) => setCalendrier(c => ({
        ...c,
        months: c.months.filter((_, n) => n !== i),
    }));

    /*
      **Déplacer un mois, plutôt que de le retaper.** L'ordre des mois EST
      l'année : insérer un solstice oublié au milieu de douze mois signifierait
      sinon renommer douze champs à la main, ce que personne ne fait sans se
      tromper une fois.
    */
    const deplacerUnMois = (i: number, sens: -1 | 1) => setCalendrier(c => {
        const vise = i + sens;
        if (vise < 0 || vise >= c.months.length) return c;
        const months = [...c.months];
        [months[i], months[vise]] = [months[vise], months[i]];
        return { ...c, months };
    });

    /* ─────────────────────────────── L'IA ─────────────────────────────── */

    /**
     * ⭐ **Le modèle propose, le contrôle relit, l'écran montre.**
     *
     * ⚠️ **La proposition ne s'enregistre jamais toute seule** : elle remplit
     * les champs, et le meneur voit la mesure de l'année avant de dire oui.
     * *C'est la seule raison pour laquelle on peut laisser une machine composer
     * un calendrier* — un modèle qui rend onze mois au lieu de douze produit
     * quelque chose de parfaitement plausible.
     */
    const composerParLIA = async () => {
        if (!description.trim() || compositionEnCours) return;
        setCompositionEnCours(true);
        try {
            const propose = await proposerUnCalendrier(description.trim(), {
                ...(typeof joursVises === 'number' && joursVises > 0
                    ? { joursParAnnee: joursVises }
                    : {}),
            });

            setCalendrier(c => ({
                ...propose,
                /* On garde l'identifiant en cours : composer n'est pas créer un
                   autre fichier, c'est remplir celui qu'on a ouvert. */
                id: c.id,
                /* Et le nom saisi l'emporte sur celui du modèle — comme à
                   l'import des tables : *un nom qu'on a tapé est une décision.* */
                name: c.name?.trim() || propose.name,
            }));
            gmToast('Proposition reçue — vérifiez la longueur de l’année.', 'info');
        } catch (err) {
            console.error('[Clock-OS] composition impossible :', err);
            gmToast('Le modèle n’a rien rendu d’exploitable.', 'warning');
        } finally {
            setCompositionEnCours(false);
        }
    };

    /* ──────────────────────────── L'enregistrement ──────────────────────────── */

    const identifiant = useMemo(
        () => calendrier.id?.trim() || identifiantDuCalendrier(calendrier.name),
        [calendrier.id, calendrier.name],
    );

    const enregistrer = async () => {
        if (fautif || enregistrement) return;
        if (!identifiant) {
            gmToast('Donnez un nom au calendrier avant de l’enregistrer.', 'warning');
            return;
        }

        setEnregistrement(true);
        try {
            const { id: _ignore, ...contenu } = calendrier;
            const r = await pont()?.saveCalendar?.(identifiant, contenu);
            if (r?.ok) {
                gmToast(`« ${calendrier.name} » est enregistré.`, 'success');
                setCalendrier(c => ({ ...c, id: identifiant }));
                await rafraichirLaListe();
                onCalendriersChanges();
            } else {
                gmToast(`Enregistrement refusé (${r?.motif ?? 'inconnu'}).`, 'warning');
            }
        } finally {
            setEnregistrement(false);
        }
    };

    const supprimer = async () => {
        if (!calendrier.id) return;
        if (!window.confirm(`Supprimer définitivement « ${calendrier.name || calendrier.id} » ?`)) return;

        const r = await pont()?.deleteCalendar?.(calendrier.id);
        if (r?.ok) {
            gmToast('Calendrier supprimé.', 'info');
            setCalendrier(calendrierNeuf());
            await rafraichirLaListe();
            onCalendriersChanges();
        } else {
            gmToast(`Suppression refusée (${r?.motif ?? 'inconnu'}).`, 'warning');
        }
    };

    if (!ouvert) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Atelier des calendriers"
                className="w-full max-w-5xl max-h-full flex flex-col rounded-2xl border border-app-border bg-app-surface shadow-2xl overflow-hidden"
            >

                {/* ── L'en-tête ── */}
                <div className="flex items-center gap-3 border-b border-app-border/60 px-5 py-3">
                    <CalendarPlus size={18} className="text-accent shrink-0" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-app-text/80">
                        Atelier des calendriers
                    </h2>

                    <select
                        value={calendrier.id || ''}
                        onChange={(e) => (e.target.value
                            ? void reprendre(e.target.value)
                            : setCalendrier(calendrierNeuf()))}
                        aria-label="Reprendre un calendrier"
                        className="ml-auto bg-app-bg/60 border border-app-border rounded-lg px-2 py-1 text-xs text-app-text"
                    >
                        <option value="">Nouveau calendrier…</option>
                        {identifiants.map(id => <option key={id} value={id}>{id}</option>)}
                    </select>

                    <button
                        onClick={onFermer}
                        aria-label="Fermer l’Atelier"
                        className="p-1.5 rounded-lg text-app-text/40 hover:text-app-text hover:bg-app-bg/60"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">

                    {/*
                      ⭐ **La mesure EN TÊTE, avant les champs.** Elle est le seul
                      endroit où l'on voit ce qu'on est en train de faire — un
                      calendrier faux a l'air parfait champ par champ.
                    */}
                    <MesureDeLAnnee
                        calendrier={calendrier}
                        joursVises={typeof joursVises === 'number' ? joursVises : undefined}
                    />

                    {/* ── L'identité ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <label className="md:col-span-2 space-y-1">
                            <span className="text-ui-9 uppercase tracking-wider text-app-text/40">Nom</span>
                            <input
                                type="text"
                                value={calendrier.name}
                                onChange={(e) => setCalendrier(c => ({ ...c, name: e.target.value }))}
                                placeholder="Calendrier de la Fondation…"
                                className="w-full bg-app-bg/60 border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-accent"
                            />
                        </label>

                        {/*
                          **La cible n'est pas une règle, c'est une intention.**
                          Elle ne contraint rien : elle affiche un écart dans la
                          mesure, et sert de consigne au modèle. *Un contrôle
                          qu'on n'a pas demandé est un contrôle qu'on apprend à
                          ignorer.*
                        */}
                        <label className="space-y-1">
                            <span className="text-ui-9 uppercase tracking-wider text-app-text/40">
                                Jours visés (facultatif)
                            </span>
                            <input
                                type="number"
                                min={1}
                                value={joursVises}
                                onChange={(e) => setJoursVises(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="360"
                                className="w-full bg-app-bg/60 border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-accent"
                            />
                        </label>
                    </div>

                    {/* ── La composition par l'IA ── */}
                    <div className="rounded-xl border border-app-border/50 bg-app-bg/30 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-ui-9 uppercase tracking-wider text-app-text/40">
                            <Sparkles size={11} /> Composer d’après une description
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') void composerParLIA(); }}
                                placeholder="Un calendrier lunaire de treize mois pour un monde de glace…"
                                className="flex-1 bg-app-bg/60 border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-accent"
                            />
                            <button
                                onClick={() => void composerParLIA()}
                                disabled={!description.trim() || compositionEnCours}
                                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-accent/50 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {compositionEnCours ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                                Composer
                            </button>
                        </div>
                        <p className="text-ui-9 italic text-app-text/30">
                            La proposition remplit les champs — elle n’enregistre rien. Vérifiez la
                            longueur de l’année avant de garder.
                        </p>
                    </div>

                    {/* ── Le jour, la semaine, le cycle ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label className="space-y-1">
                            <span className="text-ui-9 uppercase tracking-wider text-app-text/40">Heures / jour</span>
                            <input
                                type="number" min={1}
                                value={calendrier.hoursPerDay}
                                onChange={(e) => setCalendrier(c => ({ ...c, hoursPerDay: Number(e.target.value) }))}
                                className="w-full bg-app-bg/60 border border-app-border rounded-lg px-3 py-2 text-sm font-mono text-app-text focus:outline-none focus:border-accent"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-ui-9 uppercase tracking-wider text-app-text/40">Minutes / heure</span>
                            <input
                                type="number" min={1}
                                value={calendrier.minutesPerHour}
                                onChange={(e) => setCalendrier(c => ({ ...c, minutesPerHour: Number(e.target.value) }))}
                                className="w-full bg-app-bg/60 border border-app-border rounded-lg px-3 py-2 text-sm font-mono text-app-text focus:outline-none focus:border-accent"
                            />
                        </label>

                        {/*
                          ⚠️ **La règle bissextile était codée en dur, `year % 4 === 0`,
                          à cinq endroits.** Harptos tombait juste par chance. Elle se
                          déclare enfin — et `0` veut dire « jamais », ce qui est une
                          réponse parfaitement légitime.
                        */}
                        <label className="space-y-1">
                            <span className="text-ui-9 uppercase tracking-wider text-app-text/40">
                                Bissextile tous les
                            </span>
                            <input
                                type="number" min={0}
                                value={cycleBissextile(calendrier)}
                                onChange={(e) => setCalendrier(c => ({ ...c, cycleBissextile: Number(e.target.value) }))}
                                title="0 = jamais d’année bissextile"
                                className="w-full bg-app-bg/60 border border-app-border rounded-lg px-3 py-2 text-sm font-mono text-app-text focus:outline-none focus:border-accent"
                            />
                        </label>

                        {/*
                          ⛔ **`currentYear` était écrit dans Harptos et lu par
                          personne** : le choisir affichait l'an 56 au lieu de 1492.
                        */}
                        <label className="space-y-1">
                            <span className="text-ui-9 uppercase tracking-wider text-app-text/40">
                                Année de départ
                            </span>
                            <input
                                type="number"
                                value={calendrier.currentYear ?? ''}
                                placeholder="—"
                                onChange={(e) => setCalendrier(c => ({
                                    ...c,
                                    currentYear: e.target.value === '' ? undefined : Number(e.target.value),
                                }))}
                                title="Où la chronique commence. Vide : l’an zéro."
                                className="w-full bg-app-bg/60 border border-app-border rounded-lg px-3 py-2 text-sm font-mono text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-accent"
                            />
                        </label>
                    </div>

                    <label className="block space-y-1">
                        <span className="text-ui-9 uppercase tracking-wider text-app-text/40">
                            Jours de la semaine — séparés par des virgules
                        </span>
                        <input
                            type="text"
                            value={(calendrier.daysOfWeek ?? []).join(', ')}
                            onChange={(e) => {
                                const jours = e.target.value.split(',').map(j => j.trim()).filter(Boolean);
                                setCalendrier(c => ({
                                    ...c,
                                    daysOfWeek: jours,
                                    /* On tient `daysPerWeek` d'accord avec les noms plutôt
                                       que de le laisser se contredire — il n'a aucun
                                       lecteur, mais le type l'exige. */
                                    daysPerWeek: jours.length,
                                }));
                            }}
                            placeholder="Lundi, Mardi, Mercredi…"
                            className="w-full bg-app-bg/60 border border-app-border rounded-lg px-3 py-2 text-sm text-app-text placeholder:text-app-text/30 focus:outline-none focus:border-accent"
                        />
                    </label>

                    {/* ── Les mois ── */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-ui-9 uppercase tracking-wider text-app-text/40">
                                Les mois, dans l’ordre de l’année
                            </span>
                            <button
                                onClick={ajouterUnMois}
                                className="flex items-center gap-1 text-ui-9 uppercase tracking-wider text-app-text/50 hover:text-accent"
                            >
                                <Plus size={11} /> Ajouter
                            </button>
                        </div>

                        {calendrier.months.map((m, i) => (
                            <div
                                key={i}
                                className="flex flex-wrap items-center gap-2 rounded-lg border border-app-border/40 bg-app-bg/30 px-2 py-1.5"
                            >
                                <span className="w-6 shrink-0 text-center font-mono text-ui-9 text-app-text/30">
                                    {i + 1}
                                </span>

                                <input
                                    type="text"
                                    value={m.name}
                                    onChange={(e) => majMois(i, { name: e.target.value })}
                                    aria-label={`Nom du mois ${i + 1}`}
                                    className="flex-1 min-w-[140px] bg-transparent border-b border-app-border/40 px-1 py-1 text-sm text-app-text focus:outline-none focus:border-accent"
                                />

                                <input
                                    type="number"
                                    min={1}
                                    value={m.days}
                                    onChange={(e) => majMois(i, { days: Number(e.target.value) })}
                                    aria-label={`Jours du mois ${i + 1}`}
                                    className="w-16 shrink-0 bg-app-bg/60 border border-app-border rounded px-2 py-1 text-center font-mono text-sm text-app-text focus:outline-none focus:border-accent"
                                />
                                <span className="text-ui-9 text-app-text/30">j.</span>

                                <label
                                    className="flex items-center gap-1 text-ui-9 uppercase tracking-wider text-app-text/40 cursor-pointer"
                                    title="Un jour hors calendrier — fête, solstice"
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!m.isIntercalary}
                                        onChange={(e) => majMois(i, { isIntercalary: e.target.checked || undefined })}
                                    />
                                    Fête
                                </label>

                                <label
                                    className="flex items-center gap-1 text-ui-9 uppercase tracking-wider text-app-text/40 cursor-pointer"
                                    title="N’existe que les années bissextiles"
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!m.leapYearOnly}
                                        onChange={(e) => majMois(i, { leapYearOnly: e.target.checked || undefined })}
                                    />
                                    Bissext.
                                </label>

                                <div className="flex items-center gap-0.5 ml-auto">
                                    <button
                                        onClick={() => deplacerUnMois(i, -1)}
                                        disabled={i === 0}
                                        aria-label={`Monter le mois ${i + 1}`}
                                        className="p-1 text-app-text/30 hover:text-app-text disabled:opacity-20"
                                    >
                                        <ArrowUp size={12} />
                                    </button>
                                    <button
                                        onClick={() => deplacerUnMois(i, 1)}
                                        disabled={i === calendrier.months.length - 1}
                                        aria-label={`Descendre le mois ${i + 1}`}
                                        className="p-1 text-app-text/30 hover:text-app-text disabled:opacity-20"
                                    >
                                        <ArrowDown size={12} />
                                    </button>
                                    <button
                                        onClick={() => retirerUnMois(i)}
                                        aria-label={`Retirer le mois ${i + 1}`}
                                        className="p-1 text-app-text/30 hover:text-red-400"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Le contrôle ── */}
                    <div className="rounded-xl border border-app-border/50 bg-app-bg/30 p-3">
                        {constats.length === 0 ? (
                            <p className="flex items-center gap-2 text-xs text-emerald-400">
                                <CheckCircle2 size={13} /> Rien à signaler.
                            </p>
                        ) : (
                            <ul className="space-y-1.5">
                                {constats.map((c, i) => (
                                    <li key={i} className={`flex items-start gap-2 text-xs ${TEINTE[c.gravite]}`}>
                                        {ICONE[c.gravite]}
                                        <span>{c.message}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* ── Le pied ── */}
                <div className="flex items-center gap-3 border-t border-app-border/60 px-5 py-3">
                    {calendrier.id && (
                        <button
                            onClick={() => void supprimer()}
                            className="flex items-center gap-1.5 text-xs text-app-text/40 hover:text-red-400"
                        >
                            <Trash2 size={13} /> Supprimer
                        </button>
                    )}

                    <span className="ml-auto font-mono text-ui-9 text-app-text/30">
                        {identifiant ? `${identifiant}.json` : 'sans nom'}
                    </span>

                    {/*
                      ⛔ **La porte.** Un calendrier fautif ne s'enregistre pas —
                      et le motif est affiché juste au-dessus, jamais caché
                      derrière un bouton grisé sans explication. *Une garde qui
                      refuse sans dire pourquoi se contourne en copiant un
                      fichier à la main*, ce qui est précisément le chemin que
                      cet écran remplace.
                    */}
                    <button
                        onClick={() => void enregistrer()}
                        disabled={fautif || enregistrement}
                        title={fautif
                            ? 'Corrigez les fautes signalées : ce calendrier figerait l’horloge.'
                            : 'Enregistrer le calendrier'}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/50 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {enregistrement ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AtelierDesCalendriers;
