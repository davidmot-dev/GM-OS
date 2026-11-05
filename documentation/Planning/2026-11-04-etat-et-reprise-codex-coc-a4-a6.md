# Reprise Codex — COC-A4/A5/A6 — 04/11/2026

**État actuel — 05/11 :** David confirme le 05/11/2026 : « c'est bon c'est testé, tu peux commit et pousse ». COC-A1 à COC-A6 sont validés ; commit et push autorisés sur production.
[Reprise actuelle](2026-11-05-etat-et-reprise-codex-coc.md). Les attentes et états Git ci-dessous sont ceux de la livraison initiale.

David demande « on va commencer COC-A4, COC-A5 et COC-A6 », puis répond « non » à
« GM-OS tourne-t-il ? ». Aucun commit/push demandé pour COC. Branche production,
dernier commit e0a4422c (Shadowrun). Ne pas confondre avec l’ancienne autorisation de push.

## Produit

Pilote **2.2.0**, après 2.1.0 : héroïsme hors test/Légende, santé psychique et premier
ensemble de capacités contextuelles. [Suivi des règles, choix et vérifications](2026-11-04-coc-a4-a6.md),
[manuel](../User%20Guides/54-Jeu-COC.md), registre **§ 215 / ligne 151**. Les six lots COC
restent orange : réalisation livrée, essai de David distinct et attendu. Le passage à A4/A5/A6
ne vaut pas confirmation de son essai A1/A2/A3.

Pilotes : Export Dirvers/corriges/coc/COC-2.2.0-{d20,option-3d6}.gmos-driver, avec Remplacer.
Copies suivies : output/coc-a4-a6/pilote/. Génération reproductible depuis les 2.1 :
outils/coc/etendre_coc.mjs ; le 2.1 vient de ameliorer_coc.mjs sur les 2.0 de recette.
Identifiants et anciens champs gardés, six sélecteurs de référence de Voie ajoutés.

## Premier geste de reprise

Clôture technique terminée le 05/11 : réimporter2.2 avec Remplacer et faire essayer à David
une dépense DEF, un choc rang2 et Furtif au Hub. Les parcours et captures sont terminés.
Ne pas demander une seconde fois l’autorisation des services locaux en profil jetable : elle
est déjà donnée dans cette conversation. Redemander l’arrêt de GM-OS avant une nouvelle
session de modifications source après un essai de David.

## Ne pas repayer

- Livre complet sur le NAS, chemin dans le suivi A1/A3 ; l’exemplaire local dans docs/Reference/COC
  n’a que trois pages graphiques. Lecture seule, PDF = imprimée +3. Texte et sept rendus dans
  tmp/coc-a456-*. Tables77/78/79/82 et capacités36/37, option60 examinées.
- Table77 : rang3 = échec critique1–6 ; le paragraphe78 donne1–3, contradiction consignée.
  En3d6, convention de base3 et modifications de plage0/1/3 donnent3/4/6. Le+3 d’Enragé
  n’a pas de conversion chiffrée dans le livre, reste conservé et modifiable par le MJ.
- Héros hors test : __cocAvantages, reçus, destinations distinctes et expiration explicite.
  Init. ajustée sur le plateau par la projection ; l’ordre se retrie explicitement. Légende
  expire au début du prochain tour, pas à la fin du tour de quelqu’un d’autre. Une source de DM
  subis est réduite avant la RD ; le soin ne consomme pas de protection.
- Psychisme : __cocPsychisme, sans seconde jauge. Séquelle indépendante du choc temporaire,
  corps/choix/durée confirmés par MJ. Brisé n’a aucun malus numérique. Cumul de durée présenté
  puis arbitré, pas de formule présentée comme imposée par le livre.
- Voies : référence explicite + rangs contigus + contexte opt-in. Cinq capacités, six contextes :
  Amateur/contact et VOL, Furtif, Vigilant, Fin limier, Spécialiste. Pas de bonus par nom libre
  ou rang seul. Une référence dupliquée ne double pas un bonus. Pas de catalogue complet.
- Écritures HTML anciennes : __cocAvantages et __cocPsychisme préservés comme les métadonnées2.1.
- Essai : une séance active passe automatiquement au cockpit, donc importer avant de l’activer.
  Le Hub ne propose que ses sessionEntityIds : déclarer Amelia présente. Le Formulaire utilise
  un Select personnalisé (cliquer le titre puis l’option), pas un select natif. Désigner le vrai
  résultat du jet, sans comparer le compteur de ressource qui doit changer après une dépense.
- Stitch a fourni une hiérarchie ; noms/rangs/pages et plusieurs effets y étaient inventés :
  ils sont écartés. Projet14188215644082639742, écran2f670ef2236143fc802e18920151ef61.

## Vérifications et changements conservés

Suite complète : **9 871 tests passent, 4 ignorés, 833 fichiers réussis et 1 ignoré**.
Les 138 tests de corpus passent. Types et construction finale passent ; lint global zéro erreur,
avertissement préexistant useSaisieDifferee.ts, lint final du panneau propre. Deux parcours
Electron passent : A4/A5/A6 et captures communes ; neuf images2.2 relues et livrées au manuel.
Le parcours Hub a trouvé un défaut réel : bonus Furtif calculé mais source absente du titre
du journal. Corrigé et couvert par deux tests du panneau (MJ/Hub), puis prouvé au vrai journal.
Rapports : output/coc-a4-a6/verification-{technique,electron}.json ; inventaire combiné des
changements COC-A1 à A6 : output/coc-a4-a6/fichiers-de-livraison.json (99 fichiers, dont 95 destinés au commit).
Les deux suites du manuel passent leurs 36 tests après copie des images ; diff --check réussi.

Tous les changements A1/A2/A3 sont les nôtres et conservés, non commités. Les changements
étrangers restent exclus : export RuneQuest, guides10/12 (fins de ligne), vieux exports et
clips/traces d’autres jeux, docs/Reference/. Aucun accès aux profils personnels ni sauvegardes
de David, aucune installation. Export Dirvers/ ne se commite pas ; les copies output servent
à la reproductibilité. tmp/ et traces restent du travail local.
