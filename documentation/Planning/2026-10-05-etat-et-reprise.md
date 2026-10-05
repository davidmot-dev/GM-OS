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
