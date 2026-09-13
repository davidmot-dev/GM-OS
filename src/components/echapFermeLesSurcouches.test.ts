import { describe, it, expect } from 'vitest';

/**
 * **La garde qui empêche la famille de se rouvrir.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'ELLE GARDE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-09-12, David : *« Échap ne ferme pas les Paramètres, et le modal
 * avale alors tous les clics »*. La ligne a été différée avec son motif —
 * **le nombre de surcouches dans ce cas n'avait pas été compté**. Comptées le
 * 2026-09-13 : **quarante fichiers** portent un `fixed inset-0`, **douze**
 * parlaient d'`Escape`, et la moitié de ces douze l'écoutaient sur un champ de
 * saisie, pas sur la surcouche.
 *
 * *Une famille de défauts ne se referme pas écran par écran*, et elle ne reste
 * refermée que si quelque chose compte à notre place. Cette garde balaie **tout
 * `src/`** : une quarante-et-unième surcouche devra prendre le crochet ou
 * s'expliquer ici.
 *
 * ⚠️ **Elle lit des noms, pas des intentions** — c'est sa limite, et elle est
 * connue du dépôt. Un fichier qui importerait le crochet sans jamais l'appeler
 * lui échapperait. Ce qu'elle attrape est l'oubli, qui est le cas réel : les
 * quarante l'étaient.
 */

const sources = import.meta.glob('/src/**/*.tsx', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>;

/**
 * **Les surcouches qui n'ont pas à répondre à Échap — chacune avec son motif.**
 *
 * ⛔ *Une exception qu'aucune décision n'explique est un oubli* : c'est
 * exactement ce qu'était la médiathèque avant le 12/09. D'où le motif écrit à
 * côté de chaque ligne, et non une liste de chemins.
 */
const DISPENSEES: ReadonlyArray<readonly [string, string]> = [
    // ── Des écrans entiers, pas des boîtes qu'on referme ──────────────────
    ['/src/components/PlayerHub.tsx', "l'écran des joueurs ; il se vide par Ctrl+0, il ne se ferme pas"],
    ['/src/components/TabletHub.tsx', "l'écran de la tablette : ni clavier, ni meneur devant"],
    ['/src/components/common/LoadingOverlay.tsx', 'une attente : il n’y a rien à fermer'],
    ['/src/modules/dice/DiceBox3D.tsx', 'la surface de rendu des dés, pas une boîte'],
    ['/src/modules/system/archive/NexusHUD.tsx', 'un import en cours ; une opération qui travaille ne s’annule pas d’une touche'],

    // ── Côté joueurs : pilotés par le meneur, jamais par leur clavier ─────
    ['/src/components/hub/HubAtlasViewer.tsx', 'vue joueurs, pilotée depuis le poste du meneur'],
    ['/src/components/hub/HubCharacterSheet.tsx', 'vue joueurs, pilotée depuis le poste du meneur'],
    ['/src/components/hub/HubClueViewer.tsx', 'vue joueurs, pilotée depuis le poste du meneur'],
    ['/src/components/hub/HubDiceDisplay.tsx', 'vue joueurs, pilotée depuis le poste du meneur'],
    ['/src/components/hub/HubInventory.tsx', 'vue joueurs, pilotée depuis le poste du meneur'],
    ['/src/components/hub/HubItemViewer.tsx', 'vue joueurs, pilotée depuis le poste du meneur'],
    ['/src/components/hub/HubNpcViewer.tsx', 'vue joueurs, pilotée depuis le poste du meneur'],
    ['/src/components/hub/HubRuleViewer.tsx', 'vue joueurs, pilotée depuis le poste du meneur'],
    ['/src/components/hub/HubMainDeCartes.tsx', 'vue joueurs ; sa carte agrandie porte déjà son propre Échap, sur son conteneur focalisé'],
    ['/src/components/hub/LobbyOnboarding.tsx', 'l’accueil d’un joueur qui se connecte : il n’a rien à refermer'],
    ['/src/modules/remote/components/RemoteDiceResultOverlay.tsx', 'un résultat de jet qui se retire tout seul'],

    // ── Le démarrage ─────────────────────────────────────────────────────
    ['/src/components/splash/CyberpunkSplash.tsx', 'écran de démarrage : il s’efface quand l’application est prête, personne ne le referme'],
    ['/src/components/splash/GrimoireSplash.tsx', 'écran de démarrage : il s’efface quand l’application est prête, personne ne le referme'],
    ['/src/components/splash/RecoverySplash.tsx', 'écran de démarrage : il s’efface quand l’application est prête, personne ne le referme'],
    ['/src/components/splash/ZenSplash.tsx', 'écran de démarrage : il s’efface quand l’application est prête, personne ne le referme'],
    ['/src/components/splash/SplashScreenSelector.tsx', 'aiguillage entre les écrans de démarrage'],

    // ── Des fonds de menus déroulants, déjà fermés au clic extérieur ──────
    ['/src/modules/map/components/MapControls.tsx', 'le fond cliquable d’un menu de sortie, pas une surcouche'],
    ['/src/modules/session/components/SocialGraph/SocialGraphFilters.tsx', 'le fond cliquable d’une liste de choix'],
    ['/src/modules/sound/components/AtmosphereManager.tsx', 'le fond cliquable d’un menu d’atmosphère'],

    // ── Portées par le ModalProvider, qui écoute pour elles ───────────────
    ['/src/modules/map/components/DangerZonePresetEditor.tsx', 'rendue comme variante `custom` : c’est le ModalProvider qui ferme'],

    // ── Refusée, et c'est une décision ───────────────────────────────────
    [
        '/src/modules/forge/rules/components/BrainstormOverlay.tsx',
        '⛔ sa croix **réinitialise** la série — 72 s d’inventaire et une demi-heure de fiches en revue, sans confirmation. '
        + 'Échap fait ce que fait le bouton de fermeture, jamais plus : ici ce bouton fait plus que fermer, donc Échap ne le prend pas.',
    ],
];

const cheminsDispenses = new Set(DISPENSEES.map(([chemin]) => chemin));

describe('les surcouches se ferment par Échap', () => {
    /*
      `fixed inset-0` est la signature d'une surcouche qui couvre l'écran — donc
      qui couvre la barre latérale, donc dont on ne sort qu'en la fermant. C'est
      le critère qui a servi au comptage du 13/09.
    */
    const surcouches = Object.entries(sources)
        .filter(([, source]) => source.includes('fixed inset-0'));

    it('la garde voit bien quelque chose', () => {
        // Une garde qui ne trouve rien passe pour de bonnes raisons.
        expect(Object.keys(sources).length).toBeGreaterThan(150);
        expect(surcouches.length).toBeGreaterThan(30);
    });

    it('chacune prend le crochet, ou figure ici avec son motif', () => {
        const orphelines = surcouches
            .filter(([chemin]) => !cheminsDispenses.has(chemin))
            .filter(([, source]) => !source.includes('useFermetureParEchap'))
            .map(([chemin]) => chemin);

        expect(orphelines, [
            'Ces surcouches couvrent l’écran et rien ne les ferme au clavier :',
            'le meneur y reste pris, et le modal avale alors tous les clics.',
            'Posez `useFermetureParEchap(actif, onFermer, "nom")`,',
            'ou inscrivez le fichier dans DISPENSEES avec la raison.',
        ].join(' ')).toEqual([]);
    });

    /**
     * ⚠️ *Une liste de dispenses qui survit à ce qu'elle dispense devient un
     * mensonge tranquille.* Celle-ci se plaint si un chemin n'existe plus, ou si
     * l'écran a fini par prendre le crochet.
     */
    it('aucune dispense ne parle d’un fichier disparu ou déjà réparé', () => {
        const mortes = DISPENSEES
            .filter(([chemin]) => {
                const source = sources[chemin];
                return source === undefined || source.includes('useFermetureParEchap');
            })
            .map(([chemin]) => chemin);

        expect(mortes, 'ces dispenses ne dispensent plus rien : retirez-les').toEqual([]);
    });

    /** Le motif est la moitié de la dispense — sans lui, c'est un oubli déguisé. */
    it('chaque dispense porte un motif lisible', () => {
        const sansMotif = DISPENSEES
            .filter(([, motif]) => motif.trim().length < 20)
            .map(([chemin]) => chemin);

        expect(sansMotif).toEqual([]);
    });
});
