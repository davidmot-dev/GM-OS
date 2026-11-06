# Clip Degenesis — 3 min 57

[MP4](../degenesis-mecanismes-et-outils.mp4) · [WebM](../degenesis-mecanismes-et-outils.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900 ; curseur,
surlignages et légendes françaises, sans voix ni musique. Falberg, Kum et Usudi sont fictifs,
avec des valeurs d’exercice et dés préparés dans un profil jetable, sans création novice revendiquée.

Test d’action à4+ et déclencheurs ; Égo payé et maxima sans remplissage ; combinaison,
action complexe, confrontation et aide à usage unique ; adversaire autonome préparé ;
initiative et actions ; défense active, une seule armure et dégâts nets ; deux pistes,
Traumatismes et dés perdus ; Germe, EX, nouveau jour ; Argus et Potentiel choisi.
Le catalogue actuel ne contient aucun module indépendant Degenesis : les outils intégrés
de la fiche et de Combat-OS sont filmés. Pilote2.3.0 copié à l’identique dans pilote/ depuis
Export Dirvers/corriges/ ; aucun réimport nécessaire pour le clip.

Sélection de mécanismes : les autres défenses/propriétés, l’exposition, tous les Chakras,
la chirurgie, la fiche HTML, l’import/rechargement et le Hub ne sont pas rejoués. La condition
Sporulation11/10 est préparée avant le titre ; les nouveaux tests du Germe après l’Argus
restent à résoudre. Les durées et effets narratifs sont arbitrés à la table.

Constat distinct : le calculateur générique du PJ réduit les PV sans répartir les pistes
Degenesis. Preuves dans constats/, suivi au registre §1bis ; aucun correctif applicatif dans
ce lot. Le clip utilise les commandes natives de santé qui répartissent bien les blessures.

Scénario : e2e/clipDegenesis.spec.ts. Build, lint, répétition et tournage normal réussis ;
assertions sur les fiches, aides/reports et états du plateau ; seize scènes et dix-huit images
du MP4 relues. Rapports : verification.json et controle-video.json. Aucun profil personnel,
paquet installé ou code applicatif modifié ; aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipDegenesis.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
