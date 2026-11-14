# Maquettes du détecteur Alien — prompts proposés, 14/11/2026

Ces deux textes sont le contenu exact proposé pour envoi à **Stitch (Google)**, dans le projet privé
`10111230835253923961`. Ils décrivent les libellés, couleurs et interactions du module ; aucun
fichier de campagne, donnée personnelle, secret ni livre n'est joint. La revue automatique a refusé
le premier envoi faute d'autorisation explicite de cette destination. Aucun nouvel envoi avant
réponse de David. **Accord reçu le 14/11 : « Oui, envoie ces prompts à Stitch ».** Les deux
écrans sont générés et [conservés avec leur relecture](visuels/alien-detecteur-2026-11-14/README.md).
David valide ensuite : **« Oui, intègre cette disposition corrigée »**.

Spécification : [immobilité et orientation](2026-11-14-alien-detecteur-orientation.md).

## Écran joueur — 360 px

```text
GM-OS, existing Alien motion tracker external module, French interface. Create ONE MOBILE 360px screen for a player holding the M314. Extend the existing instrument without redesigning its visual identity. Existing design: very dark green #080e0c background, pale green #c5ebd0 monospace text, secondary #9abbab, thin #344b3f borders, rounded instrument panel and radar enclosure, no illustrations/photos, no external fonts. Dense but readable, 15px body, minimum 48px touch actions, no horizontal scrolling.
Existing content to KEEP in order: small header "INSTRUMENT PORTATIF · MODÈLE M314", title "Détecteur de mouvement", short subtitle "M314 · échos du dernier scan de jeu."; square dark radar with WEYLAND-YUTANI / SCAN ACTIF top bar, concentric rings and a central marker, bottom "ÉCHOS : 1" and "ACQUISITION"; button "Activer les bips ici" and short local audio help; section "Mode discret · Tour 3", "Énergie du M314 : 4", and "Coursive A : 1 écho".
NEW control directly below the radar before audio: compact panel "Orientation", readout "Cap : Est · 90°", "Champ : 90°". Two large buttons "↶ 15°" and "15° ↷" and accessible horizontal slider labeled "Cap du détecteur". Use a visible stable 90° sector pointing right on the radar with ONE glowing anonymous echo inside it. The center marker points right. Outside the sector, keep rings faint and show NO contacts or direction cues. Plain short help "Tourne le détecteur pour explorer le dernier scan." and tiny status "Orientation partagée avec le meneur".
This player can adjust only direction; NO cone width selector, no full plan, no character/enemy identities, no enemy counts outside field, no scan button, no battery controls, no map coordinates, no gyroscope, no authentication/HTTPS settings, no new sounds, no nav menus. Orientation controls must be usable with keyboard and fingers. Preserve the visual hierarchy of a simple tabletop prop. Do NOT add extra game rules or technical implementation details.
```

## Pupitre du meneur

```text
GM-OS — existing Alien M314 motion tracker, French game master panel. Create ONE DESKTOP screen extending the current interface. This is an external tabletop prop with very dark green #080e0c background, pale green #c5ebd0 monospace text, secondary #9abbab, thin #344b3f borders, simple rounded panels, 15px text and minimum 44px controls. No illustration or extra navigation.
Keep the existing two column layout: left a square circular radar (WEYLAND-YUTANI, SCAN ACTIF, ÉCHOS : 1), local audio toggle; right "Mode discret — M314", its enabled checkbox "Raccorder le détecteur au plan et à sa batterie", the existing two collapsed preparations "Préparer les zones du plan" and "Préparer les pions cachés", and the PRIVATE zone plan (Sas — Coursive A — Soute).
Add a compact "Orientation" panel beneath the radar with "Cap : Est · 90°", "Champ : 90°", two large rotation buttons "↶ 15°" / "15° ↷", horizontal slider "Cap du détecteur", and an opening select with 45°,90°,180°,360° (default existing saves360). Show a stable90 degree cone facing right and one anonymous echo inside. No echoes outside.
In the right column keep battery/porter controls: "Porteur du M314" (Nel Varga, a PRIVATE plan token), "Terrain du scan" (Intérieur), "Réserve propre à la batterie du M314"4, existing confirmation button. Add a separate person dropdown "Joueur qui oriente le M314" selected "Wilson", with "Meneur seul" as blank option. This links the player's tablet; it does NOT expose token identities to players. Show plain help "Le porteur et Maman partagent la même orientation."
Keep section "Déplacements — Tour 3" with three private token cards: "Nel Varga · Sas · 0/2 zones" / "Immobile", "Rôdeur dissimulé · Coursive A · 1/3 zones" / "En mouvement", "Créature immobile · Soute · 0/3 zones" / "Immobile". Each card adds one compact toggle-like button that visibly states the current movement and switches it (e.g. "Immobile" with aria pressed state). Keep destination select, "Déplacer d’une zone" and "Examiner pendant ce Tour". New quick state button must be distinct from those movement actions. Add helper "L’état de mouvement sera pris en compte au prochain scan." Preserve "Scanner ce Tour et tester l’Énergie" disabled after scan and "Valider le Tour suivant". No automatic enemy health, no new scan frequency, no gyroscope/HTTPS instructions, no fabricated game stats. Header "M314 · Plan privé de Maman". Prioritize clear French labels and practical live-session use.
```
