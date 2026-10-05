# État et reprise — 2026-10-05

David a demandé : « termine T0 côté meneur ». Le relevé de la télécommande est dans
[`2026-10-05-T0-tablette-meneur.md`](2026-10-05-T0-tablette-meneur.md), son banc dans
`e2e/tabletteMeneurT0.spec.ts` et sa galerie de 68 captures dans
`tablettes/T0-meneur/index.html`. Les huit onglets, la ligne d'état, l'appairage, le résultat de
dés et les six vues des Notes sont inventoriés. Les captures couvrent 390 × 844, 820 × 1180,
1180 × 820 et 1440 × 900. Construction, analyse de types du test et ESLint sont vertes ; la
série E2E compte 44 scénarios, dont 40 réussites ordinaires et quatre échecs attendus sur le
libellé de fermeture du résultat. Aucun `src/` ni `electron/` modifié. David a ensuite demandé
un commit de ces relevés ; aucun push demandé.

Le plan `2026-10-04-refonte-tablettes.md` et le registre § 123 portent l'état à jour : **les
deux relevés T0 sont faits**, T1 n'a pas commencé. Le § 1 bis ajoute deux constats MJ : première
connexion appairée parfois privée du flux et texte « Cliquer pour fermer » inopérant sur le
résultat de dés. Les trois constats joueurs du 04/10 restent ouverts, notamment les PV qui ne
remontent pas au MJ. **Reprendre par l'arbitrage de la sortie stricte de T0 et de ces défauts**, puis
T1 (propagation du thème) si David choisit de passer à la suite. Avant toute modification de
`src/` ou `electron/`, demander « GM-OS tourne-t-il ? » et attendre sa réponse (`AGENTS.md`).

Le piège payé cette fois : le SyncServer réclame le flux au début de la connexion, alors que
`remote:register` n'a pas toujours encore accordé le rôle privilégié. Un test qui suppose le
premier envoi stable oscille entre plein et vide. Le banc provoque une seconde demande par une
connexion transitoire après l'appairage, sans forger de données ; il conserve donc des captures
de référence reproductibles tout en laissant le défaut de première connexion documenté. Un
autre faux échec venait de deux frappes trop rapprochées sur le curseur de volume : l'assertion
teste désormais un geste unique et son retour côté MJ.

Mise à jour ultérieure le 05/10 : David a demandé T1, maintenant implémentée et éprouvée sur les
deux navigateurs. Le [relevé T1](2026-10-05-T1-apparence-tablettes.md) fait foi pour la suite ;
les défauts T0 ci-dessus restent ouverts.

## Reprise Codex — T3, le 05/10/2026

David : « reprends T3 », puis « Non, GM-OS est fermé ». T2 est vérifié livré dans
`1b6a991f`. Les premières propositions Stitch joueurs sont produites : **accueil « Qui es-tu ? »
et Direct, téléphone et iPad paysage**. À présenter :
[la galerie T3](tablettes/T3-propositions/index.html), avec comparaison aux captures T0.
Le [relevé](tablettes/T3-propositions/README.md) détaille la provenance et les corrections locales
des exports (télémétrie inventée, noms abrégés, boutons de confirmation trop petits).

Huit rendus Chromium d'Edge aux tailles 360 × 800, 390 × 844, 820 × 1180 et 1180 × 820 :
aucun débordement horizontal, aucune erreur JavaScript, aucune ressource en échec, toutes les
commandes visibles font au moins 44 × 44 px. Les confirmations et la bascule de qualité sont
vérifiées dans les prototypes ; cela ne valide ni la synchronisation ni Safari sur le vrai iPad.
Ces contrôles lisent des documents statiques, sans lancer Electron ni serveur local.

**Mise à jour après « je suis satisfait continue » de David** : Accueil et Direct sont retenus
et archivés dans [stitch/tablettes-joueurs/](stitch/tablettes-joueurs/README.md), avec leur HTML
corrigé et les quatre captures par écran. Inventaire et Cartes ont ensuite été produits :
téléphone, iPad portrait vérifié, paysage, surcouches de don et de carte, états d'attente.
La galerie T3 présente maintenant les quatre écrans J1 avec comparaison T0.

Seize rendus passent les contrôles ci-dessus. Les actions Inventaire et Cartes restent
au-dessus du pied ; le badge d'attente ne masque pas le nom de l'objet. La main de Cartes
n'affiche que celle du joueur, le don exige un autre PJ connecté, la carte sous scellé reste
anonyme et les propositions entrantes sont en tête. Les gestes sont des simulations locales.

**Mise à jour après « on fait J2 » de David** : Archives, PNJ, Lieux, Messagerie et Notifications
sont produits en téléphone et paysage, avec iPad portrait vérifié, détails, états vides,
choix des destinataires et alertes. Les [prompts J2](2026-10-05-prompts-stitch-tablettes-J2.md)
et les exports conservent la provenance. La galerie présente désormais neuf écrans et compare
les propositions aux captures T0. Vingt rendus supplémentaires passent, soit trente-six au
total ; envoi et séparation des conversations, lecture des messages et expirations cinq/huit
secondes sont vérifiés. Le plan de Station Varn est celui du banc T0 ; aucun secret du meneur
n'est rendu dans les propositions. Ce sont toujours des simulations statiques locales.

**Reprendre par le choix de David pour Inventaire, Cartes et les cinq écrans J2**, puis les
lots meneur suivant le plan T3. La demande de J2 ne vaut pas acceptation d'Inventaire et Cartes.
Les propositions restent dans `tablettes/T3-propositions/` jusqu'au choix. T3 n'est pas fini ;
la demande de commit « si oui » ne s'appliquait donc pas encore. David demande ensuite
**« commit J2 »**, le 05/10 : J2 et les supports J1 nécessaires à sa galerie sont archivés dans
le commit `docs(tablettes): archiver J2 et sa galerie joueurs`, sans validation implicite des
propositions encore à choisir. Aucun T4 commencé, aucun `src/` ou `electron/` modifié, aucun
push demandé.
Les modifications préexistantes du dépôt ont été conservées ; le plan, le registre et le
fichier de prompts déjà modifiés à l'arrivée n'ont pas été réécrits.

Piège payé : les outils Stitch exposés répondent « Authentication required » malgré la présence
de la clé dans la variable Windows **Machine**. Le processus n'en a pas hérité. Le helper local
lit la clé uniquement en mémoire pour appeler l'hôte Stitch déjà configuré ; aucune clé n'est
écrite dans les fichiers. L'API texte n'accepte pas les captures en pièces jointes : leur contenu
et les jetons du DESIGN.md ont été transcrits dans les requêtes. Les messages automatiques de
Stitch affirment parfois « respect scrupuleux » tout en ajoutant des diagnostics fictifs :
seuls le code et les exports rendus font foi.
