# Plugin GM-OS Campagnes de test — livraison du 30/10/2026

Demande de David : « Tu m'as créé des campagnes de Tests pour GM-OS, notamment pour Rêve de Dragon, Nephilim, Barbarian of Lemuria. Je voudrais que tu me crées un plugin pour systèmatiser cette création vers d'autres jeu. »

## Livré

**[GM-OS Campagnes de test](https://chatgpt.com/plugins/plugins_6ae484c30bd4819186676a390b1b74bf)**, plugin privé personnel **0.1.0**, créé et relu depuis le compte via Plugin Creator. Identifiants conservés dans `outils/gmos-campagnes-tests/plugin-compte.json`. Un skill et ses références, aucun serveur ni outil MCP requis.

Sources et [guide d'utilisation](../../outils/gmos-campagnes-tests/README.md) sous `outils/gmos-campagnes-tests/`. [ZIP](../../outils/gmos-campagnes-tests/dist/gmos-campagnes-tests-0.1.0.zip) : 11 fichiers, 20 246 octets, SHA-256 `d8e6b33380ef447d3fe59b30e55b59416116229b331824735fe6018c1244e9e8`. Le service ajoute un manifeste de compatibilité à la version enregistrée ; skill, références, agents et script Python présents et relus après création.

## Méthode généralisée

Pilote réel, gabarit et règles fournis ou accessibles ; mêmes joueurs via leurs vrais IDs fournis, sans copier d'anciens PJ ; aventure originale et deux laboratoires choisis d'après le jeu. Couverture des mécaniques explicite, états créés par les vraies fonctions métier quand accessibles, modules réellement compatibles, médias originaux embarqués, cahier et CSV humains vierges, rapport distinguant structure/règles/import/tablettes/matériel/recette humaine. Pas de modification applicative ou de module inventé pour prétendre couvrir une fonction absente.

Les sources retrouvées sont les six lots sous `outils/campagnes-de-recette/` et leurs notes (25–26/10), ainsi que `.claude/skills/campagne-de-recette/SKILL.md`. Aucun lot de campagne Barbarians of Lemuria n'était présent dans `output/campagnes-tests/` lors de cette livraison : le plugin n'en revendique pas la vérification et cite ce jeu uniquement comme piste à déduire du pilote fourni.

Les noms et identifiants privés des joueurs ne sont pas inclus dans le plugin. En dépôt, un relevé déjà autorisé peut être lu ; dans ChatGPT, les fichiers nécessaires doivent être joints. Les garde-fous AGENTS sont repris et adaptés au contexte sans dépôt. Le besoin de correctif applicatif reste un chantier distinct.

## Vérifications effectuées

- Paquet : JSON/YAML analysés, liens du skill résolus, icône contenue, pas de dépendance serveur ni export privé. ZIP rouvert et SHA de chaque entrée comparé.
- **11 tests Python réussis** : génération et déterminisme, refus d'écrasement, SHA/taille et média corrompu, traversées ZIP et source refusées, rattachement PJ, IDs répétés, liens inconnus, nombre non fini, date avec fuseau, CSV humain vierge.
- **18 archives existantes sur 18** acceptées par l'utilitaire structurel, sans modification de leurs fichiers. Les rapports donnent la portée partielle ; aucune recette Electron de ces jeux n'est rejouée par ce test.
- `inspect` testé sur le pilote RuneQuest courant : archive pilote reconnue, un pilote, un gabarit, 313 champs retrouvés.
- Compte : plugin créé PRIVATE / USER, manifeste portable et compatibilité relus, agent, skill et script Python retrouvés ; pas de composant serveur à connecter. L'invocation du nouveau skill dans une nouvelle conversation reste à éprouver avec un jeu choisi.

## Reprendre

Invoquer le plugin pour un nouveau jeu, joindre/indiquer pilote, règles et relevé autorisé des joueurs. Le premier usage peut être RuneQuest ; **aucune nouvelle campagne RuneQuest n'a été demandée ou générée dans ce chantier**. Pour modifier le plugin, lire son état distant puis mettre à jour le plugin existant, jamais créer un doublon.

Aucun `src/`, `electron/`, export de pilote ou campagne existante modifié, aucune installation de paquet ni service réseau démarré, aucun Git d'écriture. Les registres et la note d'état commune déjà modifiés par l'autre session sont laissés intacts ; la présente note conserve la passation de ce chantier autonome. Fichiers non commités.
