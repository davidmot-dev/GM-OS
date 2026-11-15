# Alien : utiliser les trois modules — 15/11/2026

[Lire le MP4](../alien-modules-m314-orientable.mp4) · [Version WebM](../alien-modules-m314-orientable.webm) · [Chapitres](chapitres.md)

**2 min 57, 1440×900, 25 images/s, légendes françaises, sans voix ni piste sonore.**
Demandé par David : les trois modules, avec un passage détaillé sur le M314.
Pilote **1.11.0**, détecteur **0.5.0**, tournage Playwright à vitesse normale.

Le meneur ouvre les accès de Nel Varga. Nel pose une question privée à MU/TH/UR et
reçoit sa réponse. Le meneur désigne le porteur du M314, choisit un cône de 90° et
lance un scan. Le joueur tourne à l'Est puis au Nord : le cap est partagé avec le
meneur, le relevé payé et la batterie restent les mêmes. Un pion devient immobile ;
son ancien écho reste dans le relevé jusqu'au scan du Tour suivant. Le joueur retrouve
alors seulement le mouvement de la coursive. Enfin, il transmet un ordre du poste
Senseurs ; le meneur révèle les ordres et enregistre la préparation du détecteur.

## Ce qui est réellement exécuté

- Vraie application Electron sur profil jetable et vrai Hub HTTP/WebSocket sans
  `appBridge`, dans Edge. Aucune campagne personnelle utilisée.
- Écran tactile émulé 768×1024 dans un cadre de présentation à 75 %. Les boutons du
  Hub utilisent `tap()` : **23 événements tactiles reçus**. Saisies et sélections HTML ;
  aucune tablette physique ni aucun clavier tactile natif revendiqué.
- Accès indépendants, question/réponse, cap, échos et ordre spatial transmis par les
  clients réels. Les identités privées et les cibles hors cône sont absentes de la vue
  joueur. Les assertions correspondantes figurent dans [verification.json](verification.json).
- Plan, pions, vaisseaux et équipages fictifs préparés avant le générique. Le test
  natif de batterie du M314 reste aléatoire. Orientation manuelle, sans gyroscope.
- Le combat s'arrête après révélation des ordres : jets, dégâts et avaries ne sont pas
  démontrés. Le film enregistre un préréglage ; il ne rappelle pas ce préréglage et ne
  déclenche pas la remise à zéro. Les légendes expliquent leurs effets.

## Vérification et fichiers conservés

Build réussi avant tournage ; répétition et parcours Playwright final réussis.
ESLint ciblé sans constat ; 28 tests du manuel réussis (`electron/manuelDesJeux.test.ts`).
MP4 H.264 de 9 199 527 octets, WebM VP9 de 10 175 264 octets : **177,08 secondes**
chacun, décodage complet sans erreur. **31 images** du film, les six raccords et une
planche supplémentaire de la dernière séquence ont été examinés. Les radars Est/Nord
et du second Tour sont cadrés en entier. Voir [controle-video.json](controle-video.json)
et [les planches](controle-images/planche-01.jpg).

Les 15 captures JPEG, les deux tournages bruts et `montage.json` permettent de reprendre
le montage. Le pilote est copié sans modification dans `pilote/ALIEN-1.11.0.gmos-driver` ;
aucun réimport n'est nécessaire pour regarder le film. L'ancien clip du 06/11 est conservé.
Le contrôle vidéo ne remplace pas l'essai matériel A11/T9 de David.

## Refaire le film

Depuis la racine du dépôt, sous PowerShell, avec les dépendances et navigateurs déjà présents :

```powershell
npm.cmd run build
# Si FFmpeg n'est pas dans PATH, définir ces deux chemins vers l'installation existante.
$env:GMOS_FFMPEG = 'C:/chemin/ffmpeg.exe'
$env:GMOS_FFPROBE = 'C:/chemin/ffprobe.exe'
npx.cmd playwright test e2e/clipModulesAlien.spec.ts --reporter=list
node outils/clips/verifier_clip_modules_alien.mjs
```

`GMOS_CLIP_RAPIDE=1` sert uniquement à répéter ; le retirer pour la livraison.
`GMOS_SORTIE_CLIP` change la racine de sortie et `GMOS_PILOTE_ALIEN` l'archive source.
Le vérificateur peut recevoir la racine de sortie en argument. Après régénération,
relire les images : le rapport revient volontairement à « à effectuer ».
Les horloges murales des photos donnent des repères approximatifs dans la vidéo ;
les raccords viennent du montage et les deux vues finales ont des prélèvements supplémentaires.

Aucun fichier `src/` ou `electron/` modifié, aucun paquet installé.
Commit demandé par David le 15/11 (« ok commit ») ; aucun push demandé.
