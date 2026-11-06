# Clip Dune — 4 min 14

[Ouvrir le MP4](../dune-mecanismes-et-modules.mp4) · [Tournage WebM](../dune-mecanismes-et-modules.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026 dans GM-OS. H.264, 1440 × 900,
curseur et légendes françaises, sans voix ni musique. Fiction de la Maison Vaëlan,
trois personnages fictifs, dés préparés pour rendre les exemples reproductibles.

Compétence + Principe, spécialisation, achat en Menace et aide ; Impulsion normale/bonus,
complication, dépenses et reliquat ; Détermination et maximes, bafouer puis récupérer ;
gain et acquisition de progression. Le module natif « Dune : conflits et Maison » montre
accès des personnages, fiche de Maison et Menace de séance, cinq arènes, Agent/Architecte,
liaisons et déplacements des atouts, deux tests d’enquête pour découvrir un désir,
neutralisation/destruction et changement de scène. Les décisions narratives restent au MJ.

Scénario : e2e/clipDune.spec.ts. Pilote2.0.0 existant dans output/campagnes-tests/dune/,
inchangé. Un seul module couvre les cinq arènes. Plateau et suivi fictifs préparés avant
le film ; les clics filmés exécutent les commandes natives.

Construction, lint, répétition et tournage normal réussis ; assertions sur les effets réels,
douze scènes et dix-huit images du MP4 relues. Rapports : verification.json (parcours et repères),
controle-video.json (format, provenance et relecture), constat-validation.json (défaut distinct).

DonneesDeFicheSchema refuse actuellement _gmos_dune structuré : constat au registre §1bis.
La semence du tournage est scalaire ; le suivi est préparé après hydratation uniquement
dans ce profil fictif. Import/rechargement et transports Hub ne sont pas validés par ce clip.
Aucun correctif applicatif, paquet installé ou profil personnel utilisé.

Pour refaire : npm run build, puis npx playwright test e2e/clipDune.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final. Aucun commit/push demandé
pour cette livraison. Les films Nephilim et Crimes sont conservés.
