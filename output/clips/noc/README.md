# Clip NOC — 3 min 18

[Ouvrir le MP4](../noc-mecanismes-et-outils.mp4) · [Tournage WebM](../noc-mecanismes-et-outils.webm) · [Huit chapitres](chapitres.md)

Demandé et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900, curseur et légendes
françaises, sans voix ni musique. Trois Héros fictifs des Veilleurs du Palier et dés préparés.

Talent/Domaine et test sans dé ; 10 facultatif, Fiel et Menace ; Vécu/Espoir/Singularité ;
apports de Cabale ; effets du Fiel ; piste HTML et Séquelle ; Extase donnée à un allié,
Soupçon réparti avant repos ; fiche de Cabale, grande Faveur de plusieurs Contacts ;
Rouage hostile avec bénéficiaire désigné ; début de séance et nouveau scénario.

NOC n’a pas de module indépendant dans le catalogue actuel. Le film montre ce constat
et les outils intégrés au pilote, aux fiches, à Session-OS et à Dice-OS. Aucune fonction
supplémentaire inventée. Les décisions de la Loi restent explicites.

Pilote NOC2.0.0 existant dans output/campagnes-tests/noc/, inchangé. Fiches HTML fictives
créées dans la bibliothèque du profil jetable avant le titre. Aucun profil personnel utilisé,
aucun paquet installé ou code applicatif modifié. Transport Hub et import/rechargement
ne sont pas rejoués. Les films Nephilim, Crimes et Dune sont conservés.

Build, lint, répétition et tournage normal réussis ; assertions sur les effets réels,
treize scènes et dix-huit images du MP4 relues. Rapports : verification.json et controle-video.json.
Pour refaire : npm run build puis npx playwright test e2e/clipNoc.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final. Aucun commit/push demandé.
