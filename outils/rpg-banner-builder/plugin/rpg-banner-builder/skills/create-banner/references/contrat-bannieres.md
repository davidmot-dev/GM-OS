# Contrat des bannières GM-OS

Source : `documentation/Planning/2026-10-04-prompts-bannieres.md`, revérifiée le 17/10/2026 dans
`SessionHeader.tsx`, `ChoixDeLaBanniere.tsx` et `banniereDuPilote.ts`. Cette copie est autonome.

| Point | Exigence |
| --- | --- |
| Livraison | Image raster JPG ou WebP, fond opaque |
| Dimensions | 4:1 ; au moins 2400 × 600 px |
| Poids | Au plus 500 000 octets, borne conservatrice pour « 500 Ko » |
| Affichage | En-tête d’environ 54 px, image `cover` centrée ; rapport visible variable, environ 22:1 sur grand écran |
| Intérêt visuel | Fin ruban horizontal passant par le centre vertical |
| Zones de lecture | 20 % gauche et 30 % droite calmes et sombres |
| Exclusions | Texte, logos, filigranes, cadres, UI, points lumineux agressifs, visages et personnages au premier plan |
| Rangement | Dossier du jeu existant `docs/systems/<jeu>/`, nom de fichier relatif choisi dans le pilote |
| Activation | Éditeur du pilote → Bannière de l’en-tête |

## Invite générique

```text
Ultra-wide cinematic panoramic banner, 4:1 aspect ratio, for the header of a tabletop RPG game master app.
Theme: [UNIVERSE DESCRIBED WITHOUT A BRAND NAME] — [MOOD].
Scene: a continuous panorama of [SETTING AND MOTIFS], all visual interest in a thin horizontal strip through the vertical center; calm, nearly uniform top and bottom thirds.
Composition: left 20% and right 30% dark and quiet, no focal subject near either edge.
Lighting & palette: low-key, muted, low contrast, [TWO OR THREE COLORS], atmospheric depth, subtle vignette, no bright highlights.
Style: [MEDIUM AND TEXTURE], decorative, background-only.
Exclusions: no text, letters, logo, watermark, signature, frame, border, UI, close-up faces or characters in the foreground.
```

Ne pas envoyer ces espaces réservés tels quels. Remplacer chaque partie avec les données du brief.
Un cadrage de sortie annoncé par le modèle n’est pas une mesure du fichier réellement obtenu.

## Recette visuelle

1. Ouvrir le fichier réellement livré et mesurer taille et poids.
2. Afficher la bande en `cover` centré sur un rectangle de 1188 × 54 px, puis sur une largeur étroite.
3. Vérifier que la partie centrale raconte encore l’univers, sans grande masse claire derrière le texte.
4. Vérifier le titre à gauche et les commandes à droite avec un voile sombre de démonstration.
   Cet aperçu n’est pas une capture de GM-OS ; son voile n’est pas une garantie de contraste du thème réel.
5. Corriger si nécessaire, en préservant ce qui a déjà été accepté.
