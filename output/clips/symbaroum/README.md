# Clip Symbaroum — 2 min 44

[Ouvrir le MP4](../symbaroum-mecanismes-et-outils.mp4) · [Tournage WebM](../symbaroum-mecanismes-et-outils.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 06/11/2026. H.264, 1440 × 900, curseur et
légendes françaises, sans voix ni musique. Éléna est fictive ; dés préparés pour rendre
les exemples reproductibles, fiche préparée avant le titre dans un profil jetable.

Un d20 sous l’attribut modifié par opposition et situation ; Avantage tactique (+2 et +1D4) ;
dégâts du joueur et protection fixe du PNJ, puis Défense du joueur et protection lancée.
Endurance, agonie, Test de mort qui continue, soins ; Corruption temporaire/permanente,
seuil et Stigmate ; fin de scène confirmée ; valeurs dérivées, création à 80 et rang Adepte ;
paiement en trois monnaies, voyage dans Davokar et guérison ; attaque parfaite optionnelle.

Aucun module indépendant Symbaroum dans src/modules/modulesDuJeu/catalogue.ts : les outils
filmés sont intégrés à la fiche. Pilote 2.0.0 existant copié à l’identique dans pilote/ depuis
scratch/recette-pilotes/. Aucun réimport nécessaire pour ce clip.

Sélection de mécanismes : les autres options, les effets libres des Talents, la création
HTML, l’import/rechargement, le Hub et les tablettes physiques ne sont pas rejoués.
Le meneur garde les arbitrages et le suivi manuel du PNJ après les dégâts.

Constat hors du film, consigné au registre §1bis : la jauge générique du cockpit garde
10/10 après blessures et soins (Endurance3 sur la fiche) dans le profil fictif.
Preuve : constats/cockpit-jauge.jpg. Aucun correctif dans ce lot ; la prise finale
reste sur la fiche pour Corruption et fin de scène.

Scénario : e2e/clipSymbaroum.spec.ts. Build, lint, répétition et tournage normal réussis ;
assertions sur les effets réels, treize scènes et dix-huit images du film relues.
Rapports : verification.json et controle-video.json. Aucun profil personnel utilisé,
paquet installé ou code applicatif modifié. Aucun commit/push demandé.

Pour refaire : npm run build puis npx playwright test e2e/clipSymbaroum.spec.ts --reporter=list.
GMOS_CLIP_RAPIDE=1 sert aux répétitions, jamais au film final.
