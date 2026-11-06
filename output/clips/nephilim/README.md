# Clip Nephilim — 3 min 29

[Ouvrir le MP4](../nephilim-mecanismes.mp4) · [Tournage WebM](../nephilim-mecanismes.webm) · [Repères des huit chapitres](chapitres.md)

Demandé par David le05/11/2026, filmé avec Playwright dans GM-OS. H.264, 1440 × 900,
curseur et légendes françaises, sans voix ni musique. Personnage Aster et effets fictifs,
dés préparés pour montrer des exemples reproductibles. Aucun profil personnel utilisé.

Vécus et Mnémos ; métamorphe ; Magie, Stase, critique et Sacrifice ; invocation/pacte ;
Alchimie et Materiae Primae ; lieu, Conjonction et Traque ; santé et Conséquences ;
Chutes, recharge de Stase et expérience. Le récit et les décisions restent à la table.
La montée immédiate de l’Intensité de Traque est identifiée comme choix de David,
distinct de l’aube prévue dans l’errata. Pas de démonstration de tablette physique.

Scénario : e2e/clipNephilim.spec.ts ; pilote2.0.0 de output/campagnes-tests/nephilim/.
Construction et lint réussis, répétition et tournage normal réussis ; treize assertions
sur les changements réels, douze images de scènes et dix-huit images du film relues.
Rapports : verification.json (parcours/repères), controle-video.json (format/relecture).

Pour refaire : npm run build, puis npx playwright test e2e/clipNephilim.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert à répéter, jamais au film final. Aucun paquet installé,
aucun code applicatif modifié, aucun commit/push demandé pour cette livraison.
