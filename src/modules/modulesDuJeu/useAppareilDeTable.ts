import { useEffect, useRef, useState } from 'react';
import { CanalDesModulesJoueur } from './canalJoueur';
import { APPAREIL_DE_TABLE, objetSimple, type CommandeDeModule, type ResultatDeModule, type VueDesModulesJoueurRecue } from './protocole';
import { lireRepriseDesModules, enregistrerRepriseDesModules } from './reprise';
import { useClientStore } from '../../stores/useClientStore';
import { portDeSynchronisation } from '../../utils/portsDuRenderer';

/**
 * **La connexion de l'appareil de table** — Fire HD 8, registre § 256, T11.
 *
 * Une WebSocket qui s'inscrit en rôle `table` : le serveur la caviarde comme un joueur, lui donne
 * l'identité des modules `APPAREIL_DE_TABLE` et refuse un second appareil de table (`table_prise`).
 * Les modules passent par `CanalDesModulesJoueur`, le canal des tablettes de joueur, sans copie.
 *
 * L'identité de campagne du canal est celle de la dernière vue reçue : la table n'a pas de fiche,
 * donc pas de campagne à elle ; c'est le serveur qui lui adresse ses vues, et lui seul.
 *
 * Rien n'est persisté ici, sauf le jeton de reprise des modules (comme chaque tablette).
 */
const BACKOFF_INITIAL = 1000;
const BACKOFF_MAX = 30000;

export type EtatDeLAppareil = 'connexion' | 'connecte' | 'deconnecte' | 'table-prise';

export function useAppareilDeTable() {
    const [etat, setEtat] = useState<EtatDeLAppareil>('connexion');
    const [vue, setVue] = useState<VueDesModulesJoueurRecue | null>(null);
    const canalRef = useRef<CanalDesModulesJoueur | null>(null);
    const campagneRef = useRef<string | null>(null);
    const { deviceId } = useClientStore();

    useEffect(() => {
        let socket: WebSocket | null = null;
        let minuterie: ReturnType<typeof setTimeout> | null = null;
        let attente = BACKOFF_INITIAL;
        let fini = false;

        const connecter = () => {
            if (fini) return;
            setEtat(e => (e === 'table-prise' ? e : 'connexion'));
            socket = new WebSocket(`ws://${window.location.hostname}:${portDeSynchronisation()}`);
            const ici = socket;
            ici.onopen = () => {
                attente = BACKOFF_INITIAL;
                canalRef.current?.fermer();
                canalRef.current = new CanalDesModulesJoueur(
                    message => ici.send(JSON.stringify(message)),
                    () => ({ personnageId: APPAREIL_DE_TABLE.id, campagneId: campagneRef.current }),
                    setVue,
                );
                ici.send(JSON.stringify({ type: 'remote:register', payload: {
                    deviceId, pseudo: 'Appareil de table', role: 'table', repriseModules: lireRepriseDesModules(deviceId),
                } }));
            };
            ici.onmessage = evenement => {
                let message: unknown;
                try { message = JSON.parse(String(evenement.data)); } catch { return; }
                if (!objetSimple(message)) return;
                if (message.type === 'remote:registered') {
                    const charge = objetSimple(message.payload) ? message.payload : {};
                    enregistrerRepriseDesModules(deviceId, charge.repriseModules);
                    setEtat(charge.role === 'table' ? 'connecte' : 'deconnecte');
                    ici.send(JSON.stringify({ type: 'modules:consulter' }));
                    return;
                }
                if (message.type === 'remote:error' && objetSimple(message.payload) && message.payload.code === 'table_prise') {
                    setEtat('table-prise');
                    return;
                }
                if (message.type === 'modules:vue' && objetSimple(message.payload)) {
                    const campagne = message.payload.campagneId;
                    campagneRef.current = typeof campagne === 'string' ? campagne : null;
                }
                canalRef.current?.recevoir(message);
            };
            ici.onclose = () => {
                if (socket === ici) { canalRef.current?.fermer(); canalRef.current = null; setVue(null); }
                if (fini) return;
                setEtat(e => (e === 'table-prise' ? e : 'deconnecte'));
                minuterie = setTimeout(connecter, attente);
                attente = Math.min(attente * 2, BACKOFF_MAX);
            };
        };

        connecter();
        return () => {
            fini = true;
            if (minuterie) clearTimeout(minuterie);
            canalRef.current?.fermer();
            socket?.close();
        };
    }, [deviceId]);

    const commander = (moduleId: string, commande: CommandeDeModule): Promise<ResultatDeModule> =>
        canalRef.current?.commander(moduleId, commande) ?? Promise.resolve({ ok: false, erreur: 'Appareil déconnecté.' });

    return { etat, vue, commander };
}
