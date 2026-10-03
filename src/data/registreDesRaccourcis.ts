/**
 * **Le registre des raccourcis — la liste que l'aide affiche, et rien d'autre.**
 *
 * Refonte, L6 (2026-10-03). La maquette retenue de l'aide
 * (`stitch/outillage/outillage-aide.png`) groupe les raccourcis par usage —
 * mais elle **en invente plusieurs** (Ctrl+P, Espace pour le tour suivant,
 * Alt+D…), et la note du README le dit : *la liste doit venir du registre réel
 * des raccourcis, pas du dessin.*
 *
 * Chaque ligne ci-dessous est une écoute **qui existe**, avec l'endroit où elle
 * est posée (`ou`). L'aperçu en écrivait une partie à la main, et deux lignes
 * s'étaient écartées du code : l'Oracle envoie sur **Entrée** (pas Ctrl+Entrée,
 * qui est le geste de la fenêtre de demande à l'IA), et les scènes de lumière,
 * Échap qui les arrête, Espace dans les tables n'y figuraient pas.
 *
 * ⚠️ La garde `electron/registreDesRaccourcis.test.ts` relit
 * `useRaccourcisDeNavigation.ts` : une touche de navigation ajoutée là sans
 * être inscrite ici fait échouer les essais. *Une page d'aide recopiée à la
 * main est une page d'aide qui ment au bout de trois mois.*
 */

export interface Raccourci {
    /** Les combinaisons, chacune une liste de touches ; plusieurs = l'une ou l'autre. */
    touches: string[][];
    /** Ce que fait la frappe, en une ligne. */
    titre: string;
    /** Ce qu'il faut savoir de plus, si besoin. */
    detail?: string;
    /** Où l'écoute est posée — pour qui veut vérifier. */
    ou: string;
}

export interface GroupeDeRaccourcis {
    titre: string;
    raccourcis: Raccourci[];
}

export const GROUPES_DE_RACCOURCIS: readonly GroupeDeRaccourcis[] = [
    {
        titre: 'Aller quelque part',
        raccourcis: [
            { touches: [['Ctrl', 'K']], titre: 'Ouvrir ou fermer la palette', detail: 'Chercher un module, un PNJ, un lieu, une règle, une action.', ou: 'hooks/useSpotlight.ts' },
            { touches: [['Ctrl', '1…9']], titre: 'Ouvrir le module de cette place', detail: 'Neuf places, assignées dans Paramètres → Matériel.', ou: 'hooks/useRaccourcisDeNavigation.ts' },
            { touches: [['Ctrl', '²']], titre: 'Revenir au cockpit de séance', detail: "D'où que l'on vienne.", ou: 'hooks/useRaccourcisDeNavigation.ts' },
            { touches: [['Ctrl', 'T']], titre: 'Ouvrir les tables aléatoires', ou: 'hooks/useRaccourcisDeNavigation.ts' },
            { touches: [['Ctrl', 'H']], titre: "Ouvrir l'aide, et revenir d'où l'on vient", ou: 'hooks/useRaccourcisDeNavigation.ts' },
        ],
    },
    {
        titre: 'Le Player Hub',
        raccourcis: [
            { touches: [['Ctrl', '0']], titre: 'Vider le Player Hub', detail: 'Il revient au décor de la campagne.', ou: 'hooks/useRaccourcisDeNavigation.ts' },
            { touches: [['Ctrl', 'Maj', 'N']], titre: 'Écran noir', detail: 'Le Player Hub s’éteint.', ou: 'hooks/useRaccourcisDeNavigation.ts' },
        ],
    },
    {
        titre: 'Dans la palette et les fenêtres',
        raccourcis: [
            { touches: [['↑'], ['↓']], titre: 'Parcourir les résultats', ou: 'hooks/useSpotlight.ts' },
            { touches: [['Entrée']], titre: 'Ouvrir le résultat choisi', ou: 'hooks/useSpotlight.ts' },
            { touches: [['Échap']], titre: 'Fermer la fenêtre du dessus', detail: 'La palette, une boîte, une image en plein écran — une à la fois.', ou: 'utils/surcouchesOuvertes.ts' },
        ],
    },
    {
        titre: 'Son et lumière',
        raccourcis: [
            { touches: [['A…Z'], ['Pavé num.']], titre: 'Lancer une pastille ou une scène', detail: 'Musique, Effets sonores et Light-OS : chaque pastille prend la touche qu’on lui apprend (Key Learn), sans modificateur.', ou: 'useMusicKeyboardControls, KeyboardEngine, useLightKeyboardControls' },
            { touches: [['Échap']], titre: 'Arrêter la scène de lumière', detail: 'Retour à l’éclairage normal — seulement quand une scène joue et qu’aucune fenêtre n’est ouverte.', ou: 'modules/light/useLightKeyboardControls.ts' },
            { touches: [['←'], ['→']], titre: 'Avancer ou reculer de 5 s', detail: 'Quand la forme d’onde a le focus ; avec Maj, d’une seconde.', ou: 'modules/music/components/Deck.tsx' },
            { touches: [['Début'], ['Fin']], titre: 'Aller au début ou à la fin du morceau', ou: 'modules/music/components/Deck.tsx' },
        ],
    },
    {
        titre: 'À la table',
        raccourcis: [
            { touches: [['Espace']], titre: 'Lancer le dé de la table', detail: 'Dans les tables aléatoires, hors d’un champ de saisie.', ou: 'modules/tables/TableDashboard.tsx' },
        ],
    },
    {
        titre: "Écrire à l'IA",
        raccourcis: [
            { touches: [['Entrée']], titre: "Envoyer la question à l'Oracle", detail: 'Maj + Entrée passe à la ligne.', ou: 'modules/session/components/OraclePanel.tsx' },
            { touches: [['Ctrl', 'Entrée']], titre: 'Envoyer une demande de génération', detail: 'La fenêtre de demande d’un PNJ, d’un lieu, d’une fiche ou d’un indice.', ou: 'modules/ai/components/AIPromptOverlay.tsx' },
        ],
    },
];

/** Le nombre de raccourcis du registre — compté, jamais écrit. */
export const NOMBRE_DE_RACCOURCIS = GROUPES_DE_RACCOURCIS.reduce((n, g) => n + g.raccourcis.length, 0);
