import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { VueDeModule } from './vuesDuRegistre';
import type { GestesDuMeneur } from './canalMeneur';
import type { ResultatDeModule, VueDesModulesMJ } from './protocole';
import type { ModuleDuPilote } from './types';

const ETATS = { pret: 'Adaptateur prêt', 'a-adapter': 'Adaptateur à préparer', inconnu: 'Absent du catalogue', incompatible: 'Incompatible avec ce jeu' };

/**
 * Les classes des deux appareils. Le poste garde son écran d'avant (07/11/2026, aucun dessin neuf
 * pour lui) ; la tablette suit la maquette Stitch validée par David le même jour : de grosses
 * cases tactiles pour les accès, le pupitre en plein écran.
 */
const HABILLAGES = {
    poste: {
        carte: 'space-y-3 rounded-lg border border-app-border bg-app-surface p-4',
        titre: 'break-words text-lg font-bold text-app-text',
        bouton: 'min-h-[44px] rounded border border-app-border px-4 text-app-text',
        ouvrir: 'min-h-[44px] rounded border border-app-border px-4 text-app-text',
        couper: 'min-h-[44px] rounded border border-app-border px-4 text-app-text',
        legende: 'text-sm font-bold text-app-text',
        acces: 'flex min-h-[44px] items-center gap-3 text-sm',
        accesInactif: 'text-app-text',
        accesActif: 'text-app-text',
        caseAcces: 'h-5 w-5 shrink-0 accent-accent',
        grilleAcces: 'space-y-2',
        fermer: 'min-h-[44px] rounded border border-app-border px-4 text-app-text',
    },
    tablette: {
        carte: 'space-y-3 rounded-xl border border-app-text/10 bg-app-text/[0.03] p-4',
        titre: 'break-words text-[18px] font-bold text-app-text',
        bouton: 'min-h-[44px] rounded-lg border border-app-text/10 bg-app-text/[0.04] px-4 text-[14px] font-bold text-app-muted aria-pressed:border-accent aria-pressed:bg-accent/10 aria-pressed:text-accent',
        ouvrir: 'min-h-[44px] shrink-0 rounded-lg bg-accent px-5 text-[14px] font-black uppercase tracking-wide text-app-on-accent active:scale-95',
        couper: 'min-h-[44px] rounded-lg border border-etat-danger px-4 text-[14px] font-black text-etat-danger active:scale-95',
        legende: 'mb-2 text-[13px] font-black uppercase tracking-widest text-app-muted',
        // Couleurs choisies selon l'état, jamais superposées : l'ordre de la feuille Tailwind
        // ferait gagner la couleur de base (vu sur la capture du 07/11).
        acces: 'flex min-h-[48px] items-center justify-between gap-3 rounded-lg border px-4 text-[15px]',
        accesInactif: 'border-app-text/10 bg-app-text/[0.04] text-app-muted',
        accesActif: 'border-accent bg-accent/10 text-accent',
        // Une case dessinée : la couleur native d'une case cochée ne suit pas le thème partout.
        caseAcces: 'h-5 w-5 shrink-0 cursor-pointer appearance-none rounded border-2 border-app-text/30 checked:border-accent checked:bg-accent disabled:opacity-40',
        grilleAcces: 'grid grid-cols-1 gap-2 min-[700px]:grid-cols-3',
        fermer: 'min-h-[44px] px-2 text-[14px] text-app-muted underline underline-offset-4',
    },
} as const;

export interface PropsDuPanneau {
    habillage: 'poste' | 'tablette';
    campagneId: string | null;
    /** La vue de la campagne courante seulement : une autre campagne ne s'affiche jamais. */
    vue: VueDesModulesMJ | null;
    erreur?: string | null;
    proposes: ModuleDuPilote[];
    personnages: { id: string; nom: string }[];
    enSeance: boolean;
    gestes: GestesDuMeneur;
    /** Le poste relit sa vue après un geste réussi ; la tablette la reçoit par le réseau. */
    apresUnGeste?: () => Promise<void>;
}

/**
 * **Le panneau des modules du meneur, commun au poste et à sa tablette** — 07/11/2026, plan
 * `2026-11-07-modules-du-jeu-tablette-du-meneur.md`, T2. Extrait de `ModulesDuJeuMJ.tsx` : il
 * ne parle qu'à des `GestesDuMeneur`, l'IPC au poste, la WebSocket sur la tablette. Les cases
 * d'accès reflètent l'accusé du serveur, jamais une modification optimiste.
 */
export function PanneauDesModulesMJ({ habillage, campagneId, vue, erreur, proposes, personnages, enSeance, gestes, apresUnGeste }: PropsDuPanneau) {
    const h = HABILLAGES[habillage];
    const [selection, choisir] = useState<string | null>(null);
    const [erreurLocale, signaler] = useState('');
    const [occupe, occuper] = useState(false);
    const ouvert = vue?.modules.find(m => m.id === selection);

    async function executer(action: () => Promise<ResultatDeModule>): Promise<ResultatDeModule> {
        occuper(true); signaler('');
        try {
            const retour = await action();
            if (!retour.ok) signaler(retour.erreur);
            else await apresUnGeste?.();
            return retour;
        } catch { const message = 'Le module n’a pas pu être enregistré. Réessaie après avoir vérifié le stockage.'; signaler(message); return { ok: false, erreur: message }; }
        finally { occuper(false); }
    }
    const pupitre = ouvert && vue && <VueDeModule key={`${campagneId}:${ouvert.id}`} id={ouvert.id} role="mj" lieu={habillage} vue={ouvert.vue}
        envoyerCommande={commande => executer(() => gestes.commander(ouvert.id, commande))} />;

    // Sur la tablette, le pupitre prend toute la place : il remplace la liste.
    if (habillage === 'tablette' && ouvert) return <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={h.bouton} onClick={() => choisir(null)}><ArrowLeft size={16} className="mr-2 inline" />Modules</button>
            <h2 className="text-[18px] font-bold text-app-text">{ouvert.libelle}</h2>
        </div>
        {erreurLocale && <p role="alert" className="text-[14px] text-etat-danger">{erreurLocale}</p>}
        {pupitre}
    </div>;

    return <div className="space-y-4">
        {vue && campagneId && <div className="flex justify-end">
            <button type="button" disabled={occupe} className={h.couper} onClick={() => void executer(() => gestes.toutCouper())}>Tout couper</button>
        </div>}
        {(erreur || erreurLocale) && <p role="alert" className="text-sm text-etat-danger">{erreur || erreurLocale}</p>}
        {!vue && !erreur && <p className="text-sm text-app-muted">Connexion au poste MJ des modules…</p>}
        {!enSeance && <p className="text-sm text-app-muted">Tu peux préparer les modules. Démarre une séance{habillage === 'tablette' ? ' au poste MJ' : ''} pour ouvrir leurs accès aux joueurs.</p>}
        {vue && !proposes.length && <p className="text-sm text-app-muted">Aucun module proposé par ce pilote.</p>}
        {proposes.map(m => {
            const module = vue?.modules.find(x => x.id === m.reference.id);
            return <article key={m.reference.id} className={h.carte}>
                <div className={habillage === 'tablette' ? 'flex flex-wrap items-start justify-between gap-3' : 'space-y-3'}>
                    <div className="min-w-0">
                        <h3 className={h.titre}>{m.libelle}</h3>
                        <p className="text-sm text-app-muted">{m.description}</p>
                    </div>
                    {module && <button type="button" className={h.ouvrir} onClick={() => choisir(selection === m.reference.id ? null : m.reference.id)}>
                        {habillage === 'poste' && selection === m.reference.id ? 'Fermer le pupitre' : 'Ouvrir le pupitre'}</button>}
                </div>
                {vue?.indisponibles?.filter(i => i.id === m.reference.id).map(i => <p role="status" key={i.id} className="text-sm text-etat-attention">{i.raison}</p>)}
                {module ? <>
                    {module.diffusionSonore && <div className="flex flex-wrap items-center gap-2">
                        <p className={habillage === 'tablette' ? `w-full ${h.legende}` : 'w-full text-sm text-app-muted'}>
                            {habillage === 'tablette' ? 'Son de l’alarme' : 'Diffuser l’alarme sur un seul appareil. Le joueur devra y activer le son.'}</p>
                        {[{ id: 'poste-mj', libelle: habillage === 'tablette' ? 'Poste MJ' : 'Ce poste MJ', personnageId: '' }, ...(vue?.appareils ?? []).filter(a => module.acces.includes(a.personnageId))].map(a =>
                            <button type="button" key={a.id} disabled={occupe} aria-pressed={module.appareilDeDiffusion === a.id} className={h.bouton}
                                onClick={() => void executer(() => gestes.choisirDiffusion(m.reference.id, a.id))}>
                                Son : {a.libelle}{habillage === 'poste' && module.appareilDeDiffusion === a.id ? ' (choisi)' : ''}</button>)}
                    </div>}
                    <fieldset disabled={occupe} className="space-y-2">
                        <legend className={h.legende}>Accès des personnages</legend>
                        <div className={h.grilleAcces}>
                            {personnages.map(p => {
                                const coche = module.acces.includes(p.id);
                                return <label key={p.id} className={`${h.acces} ${coche ? h.accesActif : h.accesInactif}`}>
                                    {habillage === 'tablette' && <span className="min-w-0 break-words">{p.nom}</span>}
                                    <input type="checkbox" className={h.caseAcces} disabled={!enSeance} checked={coche}
                                        aria-label={habillage === 'tablette' ? p.nom : undefined}
                                        onChange={e => void executer(() => gestes.autoriser(m.reference.id, e.target.checked ? [...module.acces, p.id] : module.acces.filter(id => id !== p.id)))} />
                                    {habillage === 'poste' && p.nom}
                                </label>;
                            })}
                        </div>
                        {personnages.length === 0 && <p className="text-sm text-app-muted">Ajoute des personnages à cette campagne pour leur ouvrir le module.</p>}
                        <div className={habillage === 'tablette' ? 'flex justify-end' : ''}>
                            <button type="button" className={h.fermer} onClick={() => void executer(() => gestes.autoriser(m.reference.id, []))}>
                                {habillage === 'tablette' ? 'Fermer tous les accès' : 'Fermer tous les accès et couper les effets'}</button>
                        </div>
                    </fieldset>
                </> : <p className="text-sm text-accent">{ETATS[m.disponibilite]}</p>}
            </article>;
        })}
        {habillage === 'poste' && pupitre}
    </div>;
}
