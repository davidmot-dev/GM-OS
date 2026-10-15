import { useEffect } from 'react';
import { useSessionOSStore } from '../session/useSessionOSStore';
import { recevoirModulesMJ, useModulesDuJeuMJ } from './magasins';
import type { ContexteDesModules } from './protocole';

/** Le contexte est poussé par le MJ natif ; aucun état privé n'entre dans Nexus Sync. */
export function useHoteDesModules(actif: boolean) {
    useEffect(() => {
        const pont = window.appBridge?.modulesDuJeu;
        if (!actif || !pont) return;
        let vivant = true, dernier = '', file = Promise.resolve();
        const erreur = (e: unknown) => { if (vivant) useModulesDuJeuMJ.setState({ erreur: e instanceof Error ? e.message : 'Le raccordement des modules a échoué.' }); };
        const pousser = () => {
            const s = useSessionOSStore.getState();
            const campagne = s.campaigns.find(c => c.id === s.activeCampaignId);
            const seance = s.sessions.find(session => session.campaignId === campagne?.id && session.status === 'active');
            const pilote = s.getActiveDriver();
            const contexte: ContexteDesModules = {
                campagneId: campagne?.id ?? null, seanceId: seance?.id ?? null,
                pilote: pilote ? { id: pilote.id, name: pilote.name, corpusId: pilote.corpusId, ragPath: pilote.ragPath, modulesDuJeu: pilote.modulesDuJeu } : null,
                systemPath: campagne?.systemPath,
                personnages: campagne ? s.players.flatMap(j => j.characters.filter(p => p.campaignId === campagne.id).map(p => ({ id: p.id, nom: (p.name || 'Personnage').slice(0, 40) }))) : [],
            };
            const cle = JSON.stringify(contexte);
            if (cle === dernier) return;
            dernier = cle;
            useModulesDuJeuMJ.setState({ vue: null });
            file = file.then(async () => {
                if (!vivant) return;
                const resultat = await pont.contexte(contexte);
                if (!resultat.ok) throw new Error(resultat.erreur);
                const vue = await pont.lire();
                if (vivant) recevoirModulesMJ(vue);
            }).catch(erreur);
        };
        const desabonner = pont.surChangement(vue => { if (vivant) recevoirModulesMJ(vue); });
        const magasin = useSessionOSStore.subscribe(pousser);
        pousser();
        return () => { vivant = false; desabonner(); magasin(); };
    }, [actif]);
}
