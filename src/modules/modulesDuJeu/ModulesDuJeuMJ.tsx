import { ArrowLeft, Blocks } from 'lucide-react';
import { useState } from 'react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { HubConsultation } from '../../components/hub/HubConsultation';
import { modulesDuPilote } from './catalogue';
import { recevoirModulesMJ, useModulesDuJeuMJ } from './magasins';
import { VueDeModule } from './vuesDuRegistre';
import type { ResultatDeModule } from './protocole';

const ETATS = { pret: 'Adaptateur prêt', 'a-adapter': 'Adaptateur à préparer', inconnu: 'Absent du catalogue', incompatible: 'Incompatible avec ce jeu' };

export function ModulesDuJeuMJ() {
    const { campaigns, sessions, players, activeCampaignId, getActiveDriver, setCurrentView, setEditingDriverId, customGameDrivers } = useSessionOSStore();
    const { vue, erreur } = useModulesDuJeuMJ();
    const [selection, choisir] = useState<string | null>(null);
    const [erreurLocale, signaler] = useState('');
    const [occupe, occuper] = useState(false);
    const campagne = campaigns.find(c => c.id === activeCampaignId);
    const pilote = getActiveDriver();
    const resultat = modulesDuPilote(pilote, campagne?.systemPath);
    const courante = vue?.campagneId === activeCampaignId ? vue : null;
    const ouvert = courante?.modules.find(m => m.id === selection);
    const personnages = players.flatMap(j => j.characters.filter(p => p.campaignId === activeCampaignId));
    const enSeance = sessions.some(s => s.campaignId === activeCampaignId && s.status === 'active');
    async function executer(action: () => Promise<ResultatDeModule>): Promise<ResultatDeModule> {
        occuper(true); signaler('');
        try {
            const retour = await action();
            if (!retour.ok) signaler(retour.erreur);
            else if (window.appBridge?.modulesDuJeu) recevoirModulesMJ(await window.appBridge.modulesDuJeu.lire());
            return retour;
        } catch { const erreur = 'Le module n’a pas pu être enregistré. Réessaie après avoir vérifié le stockage.'; signaler(erreur); return { ok: false, erreur }; }
        finally { occuper(false); }
    }
    return <HubConsultation ecran="modules-du-jeu-mj" titre="Modules du jeu" description={campagne ? `Outils de ${campagne.name}` : 'Sélectionne une campagne pour retrouver ses outils.'}
        compteur={`${resultat.modules.length} module(s) proposé(s)`} icone={Blocks}
        commandes={<div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setCurrentView('cockpit')} className="flex items-center gap-2 rounded border border-app-border px-3 py-2 text-sm text-app-text"><ArrowLeft size={16} />Retour au cockpit</button>
            {courante && activeCampaignId && <button type="button" disabled={occupe} className="min-h-[44px] rounded border border-app-border px-4 text-app-text" onClick={() => {
                const pont = window.appBridge?.modulesDuJeu;
                if (pont) void executer(() => pont.toutCouper({ campagneId: activeCampaignId, contexte: courante.contexte }));
            }}>Tout couper</button>}
            {pilote && customGameDrivers.some(p => p.id === pilote.id) && <button type="button" className="rounded border border-app-border px-3 py-2 text-sm text-app-text"
                onClick={() => { setEditingDriverId(pilote.id); setCurrentView('driver-editor'); }}>Configurer le pilote</button>}
        </div>}>
        {(erreur || erreurLocale) && <p role="alert" className="text-sm text-etat-danger">{erreur || erreurLocale}</p>}
        {!courante && !erreur && <p className="text-sm text-app-muted">Connexion au poste MJ des modules…</p>}
        {!enSeance && <p className="text-sm text-app-muted">Tu peux préparer les modules. Démarre une séance pour ouvrir leurs accès aux joueurs.</p>}
        {resultat.erreurs.map(e => <p role="alert" key={e} className="text-etat-danger">{e}</p>)}
        {!resultat.modules.length && <p className="text-sm text-app-muted">Aucun module proposé par ce pilote.</p>}
        {resultat.modules.map(m => <article key={m.reference.id} className="space-y-3 rounded-lg border border-app-border bg-app-surface p-4">
            <h3 className="break-words text-lg font-bold text-app-text">{m.libelle}</h3>
            <p className="text-sm text-app-muted">{m.description}</p>
            {courante?.modules.some(module => module.id === m.reference.id) ? <>
                <button type="button" className="min-h-[44px] rounded border border-app-border px-4 text-app-text" onClick={() => choisir(selection === m.reference.id ? null : m.reference.id)}>{selection === m.reference.id ? 'Fermer le pupitre' : 'Ouvrir le pupitre'}</button>
                {courante.modules.find(module => module.id === m.reference.id)?.diffusionSonore && <div className="flex flex-wrap items-center gap-2">
                    <p className="w-full text-sm text-app-muted">Diffuser l’alarme sur un seul appareil. Le joueur devra y activer le son.</p>
                    {[{ id: 'poste-mj', libelle: 'Ce poste MJ', personnageId: '' }, ...(courante.appareils ?? []).filter(a => courante.modules.find(module => module.id === m.reference.id)!.acces.includes(a.personnageId))].map(a =>
                        <button type="button" key={a.id} disabled={occupe} aria-pressed={courante.modules.find(module => module.id === m.reference.id)?.appareilDeDiffusion === a.id}
                            className="min-h-[44px] rounded border border-app-border px-3 text-sm text-app-text" onClick={() => {
                            const pont = window.appBridge?.modulesDuJeu;
                            if (pont) void executer(() => pont.choisirDiffusion({ campagneId: activeCampaignId!, moduleId: m.reference.id, appareilId: a.id, contexte: courante.contexte }));
                        }}>Son : {a.libelle}{courante.modules.find(module => module.id === m.reference.id)?.appareilDeDiffusion === a.id ? ' (choisi)' : ''}</button>)}
                </div>}
                <fieldset disabled={occupe} className="space-y-2">
                    <legend className="text-sm font-bold text-app-text">Accès des personnages</legend>
                    {personnages.map(p => {
                        const acces = courante.modules.find(module => module.id === m.reference.id)!.acces;
                        return <label key={p.id} className="flex min-h-[44px] items-center gap-3 text-sm text-app-text">
                            <input type="checkbox" className="h-5 w-5" disabled={!enSeance} checked={acces.includes(p.id)} onChange={e => {
                                const pont = window.appBridge?.modulesDuJeu;
                                if (pont) void executer(() => pont.autoriser({ campagneId: activeCampaignId!, moduleId: m.reference.id, contexte: courante.contexte,
                                    personnages: e.target.checked ? [...acces, p.id] : acces.filter(id => id !== p.id) }));
                            }} />{p.name}</label>;
                    })}
                    {personnages.length === 0 && <p className="text-sm text-app-muted">Ajoute des personnages à cette campagne pour leur ouvrir le module.</p>}
                    <button type="button" className="min-h-[44px] rounded border border-app-border px-4 text-app-text" onClick={() => {
                        const pont = window.appBridge?.modulesDuJeu;
                        if (pont) void executer(() => pont.autoriser({ campagneId: activeCampaignId!, moduleId: m.reference.id, contexte: courante.contexte, personnages: [] }));
                    }}>Fermer tous les accès et couper les effets</button>
                </fieldset>
            </> : <p className="text-sm text-accent">{ETATS[m.disponibilite]}</p>}
        </article>)}
        {ouvert && courante && <VueDeModule key={`${activeCampaignId}:${ouvert.id}`} id={ouvert.id} role="mj" vue={ouvert.vue} envoyerCommande={commande => executer(() => window.appBridge!.modulesDuJeu!.commander({
            requeteId: crypto.randomUUID(), campagneId: activeCampaignId!, moduleId: ouvert.id, contexte: courante.contexte, commande,
        }))} />}
    </HubConsultation>;
}
