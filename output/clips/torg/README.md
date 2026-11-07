# Torg Eternity : mécanismes et joueur tactile — 2 min 58

[Clip MP4](../torg-mecanismes-et-tablette.mp4) · [WebM](../torg-mecanismes-et-tablette.webm) · [Huit chapitres](chapitres.md)

Demandé par David et filmé avec Playwright le 07/11/2026 : Electron pour le meneur,
vrai Hub HTTP/WebSocket dans Edge pour le joueur. Personnages Mara Quill et Teo Vale,
campagne et dommages fictifs, dés préparés, profils jetables. Vidéo 1440×900, légendes
françaises, curseur et repères tactiles ; sans voix ni musique.

Le clip montre le d20 explosif et la Table des Bonus, la Possibilité et son minimum
de 10, Ingénieux et sa limite par scène, la carte d’Action et Un de plus !, la Réserve
d’Action, l’échange atomique d’une carte contre une autre, la fiche HTML, Ténacité
en Pan-Pacifica, puis Sbires et la Loi de la Souffrance en Tharkold.

Les JPEG d’Action et du Destin viennent de `public/assets/decks/torg/` : aucune carte
redessinée. La carte d’Action d’index 12 est **Gardez la pose !**, imprimée 13-N ; sa
ligne standard donne la main aux Héros et Un de plus !, avec Intimidation et
Provocation approuvées. Les métadonnées de tournage reprennent cette image.
Les cinq cartes du Destin disponibles constituent un sous-ensemble : Monologue,
Plan de secours, Romance, Seconde chance et Échappé belle. Le paquet de Cosm est
présent dans la semence mais sa distribution n’est pas filmée ; les deux Lois
montrées sont des mécanismes distincts des effets imprimés des cartes.

La tablette est émulée en **768×1024**, avec `isMobile` et `hasTouch`, sans
`appBridge`. Les appuis utilisent `tap()` ; le glissement envoie les vrais événements
`touchStart`, `touchMove` et `touchEnd` de Chromium. La sélection des menus et la
saisie sont automatisées en HTML, sans clavier tactile natif filmé. Le test, le
coût de la Possibilité, la contrepartie de l’échange et la défense d’Esquive saisie
dans la fiche HTML sont vérifiés dans les magasins du meneur après réception.

La Réserve de Monologue chez Mara, l’Atout Ingénieux possédé et les états de combat
sont préparés avant leurs exercices. Le choix des cosms est préparé côté meneur.
La proximité du sbire est confirmée dans l’interface ; le test de Réalité et le
transfert du coup sont réels. Les effets narratifs des cartes restent arbitrés
selon leur texte. Sélection de mécanismes, sans combat complet, recette exhaustive
ou appareil physique. La validation des lots TORG-A0 à A4 déjà donnée par David
reste distincte des contrôles du clip.

Reproduction : `npm run build`, puis
`npx playwright test e2e/clipTorg.spec.ts --reporter=list`.
`GMOS_CLIP_RAPIDE=1` sert aux répétitions ; `GMOS_SORTIE_CLIP` choisit le dossier.
Le pilote est lu depuis `Export Dirvers/corriges/Torg-Eternity-2.0.0.gmos-driver` ;
aucun réimport nécessaire pour regarder le film. Aucun code applicatif modifié,
paquet installé ou profil personnel utilisé.

Pour remonter les tournages conservés :

```powershell
node outils/clips/monter_clip_torg.mjs output/clips/torg/tournage-mj.webm output/clips/torg/tournage-tablette.webm output/clips output/clips/torg/montage.json
```

Les attentes de connexion et de la dernière ouverture du moteur de fiche sont
retirées au montage. `verification.json` porte les assertions, les événements
tactiles et les repères ; `controle-video.json` porte le contrôle du fichier monté.
Build, lint, répétition rapide et tournage normal réussis ; 14 appuis tactiles et
18 événements de déplacement reçus par le Hub. MP4 H.264 et WebM VP9 de 178,2 s,
1440×900 ; décodage intégral du MP4 sans erreur. Quatorze scènes et vingt-six images
du film relues, dont les trois raccords. Le rapport de répétition est conservé
dans `verification-repetition.json` ; ses médias provisoires ont été retirés.
Aucun commit ou push demandé.
