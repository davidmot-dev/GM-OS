# Les prompts des bannières de jeu — l'en-tête de Session-OS

**Demandés par David** le 2026-10-03 (le prompt générique, Cthulhu Hack et Blade Runner) et le
2026-10-04 (Dune, Alien, Rêve de Dragon). La bannière se choisit dans l'éditeur du pilote,
« Bannière de l'en-tête » (`ChoixDeLaBanniere.tsx`) ; elle doit être une image **du dossier du jeu**,
`docs/systems/<jeu>/`. Guide : `User Guides/10-Session-OS-le-cockpit.md`, le système de règles.

| Jeu | Dossier | Bannière |
| :--- | :--- | :--- |
| Blade Runner | `docs/systems/blade-runner/` | ✅ `Blade Runner Band.jpg` |
| Cthulhu Hack | `docs/systems/cthulhu hack/` | ✅ `Cthulhu-Hack Band.jpg` |
| Dune | `docs/systems/dune/` | ⏳ prompt prêt, image à générer |
| Alien | `docs/systems/alien/` | ⏳ prompt prêt, image à générer |
| Rêve de Dragon | `docs/systems/reves de dragons/` | ⏳ prompt prêt, image à générer |

---

## Pourquoi ces contraintes

L'en-tête mesure **environ 54 px de haut** sur toute la largeur du module — un rapport d'environ
**22:1** qu'aucun générateur ne produit. On génère donc en **4:1**, et GM-OS garde **la bande
horizontale du milieu**, sous un voile qui garde le titre (à gauche) et les boutons (à droite)
lisibles. D'où : l'intérêt au centre, des bords calmes, une image sombre et peu contrastée, ni
texte, ni logo, ni visage en gros plan.

Les univers sont décrits **par leur ambiance, sans nommer les licences** : certains générateurs
refusent les noms, et les autres recopient alors le film au lieu de composer une image.

**Le fichier** : au moins **2 400 × 600 px**, **JPG ou WebP**, 500 Ko au plus. Vérifier en plissant
les yeux que la bande du milieu « raconte » l'univers et que les bords restent calmes.

---

## Le prompt générique

```text
Ultra-wide cinematic panoramic banner, 4:1 aspect ratio, for the header of a tabletop RPG game master app.
Theme: [JEU] — [AMBIANCE EN 5 À 10 MOTS].
Scene: a wide, continuous horizontal panorama of [DÉCOR / MOTIFS DE L'UNIVERS], with all visual interest concentrated in a thin horizontal band through the vertical center of the image; the top and bottom thirds are calm, empty, almost uniform (sky, fog, darkness, texture).
Composition: no focal subject on the far left or far right edges; the left 20% and right 30% are especially dark and quiet so text and buttons stay readable over them.
Lighting & palette: low-key, dark, muted, low contrast, [PALETTE : 2 À 3 COULEURS], subtle atmospheric depth, soft vignette, no bright highlights.
Style: [STYLE : painterly illustration / matte painting / gritty photographic / engraving], seamless, decorative, background-only.
Strictly no text, no letters, no logo, no watermark, no UI, no frame, no border, no close-up faces, no characters in the foreground.
```

**Négatif**, pour tous :

```text
text, letters, typography, logo, watermark, signature, frame, border, UI elements, bright spots, high contrast, busy foreground, close-up faces, people in foreground, cropped subject at edges
```

## Cthulhu Hack et Blade Runner — les valeurs employées

- **Cthulhu Hack** : *1920s Lovecraftian investigation* — *dread, secrecy, fog, forbidden
  knowledge* — *a fog-covered 1920s New England harbor town at night, gambrel roofs, a lighthouse,
  faint tentacle shapes barely visible in the dark water* — *ivory grey, charcoal, desaturated olive
  green* — *aged engraving mixed with matte painting*.
- **Blade Runner** : *neo-noir cyberpunk* — *rain, neon haze, melancholy, surveillance* — *a
  rain-soaked megacity skyline at night, distant pyramid towers, flying spinner lights, neon
  reflections in mist* — *deep teal, amber, faint magenta* — *cinematic matte painting, film grain*.

## Dune

```text
Ultra-wide cinematic panoramic banner, 4:1 aspect ratio, for the header of a tabletop RPG game master app.
Theme: a desert planet of feudal space intrigue — scarcity, heat, ancient power, silent danger beneath the sand.
Scene: a wide, continuous horizontal panorama of an endless deep desert at dusk, towering dune crests in long parallel waves, a distant rock fortress-city carved into a cliff, a faint ripple of something enormous moving under the sand, tiny silhouettes of dragonfly-winged aircraft far away, a thin haze of glowing orange spice dust; all visual interest concentrated in a thin horizontal band through the vertical center of the image; the top and bottom thirds are calm, empty, almost uniform (pale hazy sky above, smooth shadowed sand below).
Composition: no focal subject on the far left or far right edges; the left 20% and right 30% are especially dark and quiet so text and buttons stay readable over them.
Lighting & palette: low-key, dark, muted, low contrast, burnt ochre, deep umber and a faint cold blue in the shadows, subtle atmospheric depth, soft vignette, no bright highlights.
Style: epic matte painting, painterly, seamless, decorative, background-only.
Strictly no text, no letters, no logo, no watermark, no UI, no frame, no border, no close-up faces, no characters in the foreground.
```

## Alien

```text
Ultra-wide cinematic panoramic banner, 4:1 aspect ratio, for the header of a tabletop RPG game master app.
Theme: industrial science-fiction horror — isolation, cold machinery, corporate indifference, something hunting in the dark.
Scene: a wide, continuous horizontal panorama of a long dim corridor inside a battered deep-space cargo vessel, ribbed metal walls, hanging cables, steam venting from pipes, flickering green monitor glow, emergency strobe light far down the corridor, and at the far end a barely visible organic, ribbed, biomechanical shape blending into the shadows; all visual interest concentrated in a thin horizontal band through the vertical center of the image; the top and bottom thirds are calm, almost uniform darkness (ceiling pipes lost in shadow, wet metal floor).
Composition: no focal subject on the far left or far right edges; the left 20% and right 30% are especially dark and quiet so text and buttons stay readable over them.
Lighting & palette: low-key, very dark, muted, low contrast, gunmetal grey, sickly phosphor green and a faint warning amber, subtle haze, soft vignette, no bright highlights.
Style: gritty cinematic still, 1970s–80s used-future aesthetic, film grain, seamless, decorative, background-only.
Strictly no text, no letters, no logo, no watermark, no UI, no frame, no border, no close-up faces, no characters in the foreground, no creature in full view.
```

## Rêve de Dragon

```text
Ultra-wide cinematic panoramic banner, 4:1 aspect ratio, for the header of a tabletop RPG game master app.
Theme: a dreamlike medieval world dreamt by sleeping dragons — wonder, strangeness, gentle melancholy, reality slightly unstable.
Scene: a wide, continuous horizontal panorama of a soft medieval valley at twilight, a winding river, a small village with crooked rooftops and a stone bridge, floating islands of earth drifting in the sky above the horizon, a faint luminous rift in the air like a tear in the fabric of the world, and on the far horizon the colossal silhouette of a sleeping dragon forming a line of hills; all visual interest concentrated in a thin horizontal band through the vertical center of the image; the top and bottom thirds are calm, almost uniform (misty violet sky above, dark meadow and still water below).
Composition: no focal subject on the far left or far right edges; the left 20% and right 30% are especially dark and quiet so text and buttons stay readable over them.
Lighting & palette: low-key, dark, muted, low contrast, dusky violet, moss green and a faint pale gold, dreamy atmospheric depth, soft vignette, no bright highlights.
Style: painterly storybook illustration, gouache and ink, slightly surreal, seamless, decorative, background-only.
Strictly no text, no letters, no logo, no watermark, no UI, no frame, no border, no close-up faces, no characters in the foreground.
```
