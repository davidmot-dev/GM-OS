import type { App } from 'electron';

/**
 * **Le navigateur intégré — une page web DANS GM-OS, sans rien de GM-OS.**
 *
 * Refonte, L6 (2026-10-03) : David a choisi la page intégrée de la maquette
 * retenue (`stitch/outillage/outillage-navigateur.png`) plutôt que l'ouverture
 * dans le navigateur de Windows. Elle passe par une `<webview>` Electron, et
 * c'est ici que se décide **ce qu'elle n'a pas le droit d'avoir** :
 *
 * - **aucun preload** — donc aucun `appBridge` : une page d'Internet ne doit
 *   pas pouvoir écrire une campagne, lire une clé, lancer un son ;
 * - **ni Node, ni intégration** dans ses cadres ; bac à sable et isolation ;
 * - **sa propre session** (`persist:navigateur`) : ses cookies ne se mêlent
 *   pas à ceux de l'application ;
 * - **seules les adresses web** y entrent (`http`, `https`) : ni `file:`, qui
 *   ouvrirait le disque, ni `gmos:`, ni `javascript:`, ni `data:`.
 *
 * Une fenêtre qu'une page voudrait ouvrir (« ouvrir dans un nouvel onglet »)
 * s'ouvre **dans la même vue** : une fenêtre Electron nue, sans barre ni
 * retour, serait un cul-de-sac.
 *
 * *Cette garde est posée pour toute l'application, pas pour le seul module :
 * une `<webview>` ajoutée demain ailleurs en hériterait.*
 */

export const PARTITION_DU_NAVIGATEUR = 'persist:navigateur';

/** Une adresse qu'on laisse entrer dans la vue : du web, rien d'autre. */
export function adresseNavigable(url: string | undefined): boolean {
    if (!url) return false;
    try {
        const { protocol } = new URL(url);
        return protocol === 'https:' || protocol === 'http:';
    } catch {
        return false;
    }
}

export function garderLesVuesWeb(app: App): void {
    app.on('web-contents-created', (_evenement, contents) => {
        // Avant qu'une <webview> ne s'attache : on lui retire tout ce qui vient de GM-OS.
        contents.on('will-attach-webview', (evenement, preferences, parametres) => {
            delete preferences.preload;
            delete (preferences as { preloadURL?: string }).preloadURL;
            preferences.nodeIntegration = false;
            preferences.nodeIntegrationInSubFrames = false;
            preferences.contextIsolation = true;
            preferences.sandbox = true;
            preferences.webSecurity = true;
            parametres.partition = PARTITION_DU_NAVIGATEUR;
            if (!adresseNavigable(parametres.src)) evenement.preventDefault();
        });

        if (contents.getType() !== 'webview') return;

        contents.setWindowOpenHandler(({ url }) => {
            if (adresseNavigable(url)) void contents.loadURL(url);
            return { action: 'deny' };
        });
        contents.on('will-navigate', (evenement, url) => {
            if (!adresseNavigable(url)) evenement.preventDefault();
        });
    });
}
