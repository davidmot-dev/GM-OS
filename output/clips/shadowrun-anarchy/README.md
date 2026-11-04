# Shadowrun Anarchy — clip des nouveautés

David, 04/11/2026 : « c'est testé marque le. Maintenant fais un clips avec Playright des
noouveauté de Shadowrun Anarchy. Est-ce que c'est possible ? Tu peux t'inspirer du clips
sur Runequest ». SR-A4/A5/A6 sont validés dans la synthèse et au registre § 212.

Le scénario est `e2e/clipShadowrunAnarchy.spec.ts`, inspiré de
`e2e/clipDuCombatRuneQuest.spec.ts` : curseur animé, zones entourées, chapitres et légendes
en français. Il filme les vrais contrôles de GM-OS sur un profil jetable, avec le pilote
2.2.0 et le personnage fictif Prisme. Les dés sont préparés pour montrer les cas choisis.
Aucune donnée personnelle, aucune narration sonore, aucun changement dans l’application.

**Livré le 04/11/2026 :** [clip MP4 — 3 min 12](../shadowrun-anarchy-nouveautes.mp4),
H.264, 1440 × 900, sans son. Le [WebM de tournage](../shadowrun-anarchy-nouveautes.webm)
est aussi conservé (3 min 20, chargement inclus). Le MP4 commence au titre.

Repères approximatifs dans le MP4 :

1. **00:06** — Drain confirmé, origine par case et soins refusés ; fin du malus sans guérison.
2. **00:33** — Anarchy 99 → 100 montré au premier chapitre ; correction d’une réserve 9 → 11 sans perdre la blessure.
3. **00:50** — Firewall, accès Administrateur, backdoor, surveillance et connexion hot-sim.
4. **01:30** — Planification, paiement unique du flashback et dépassement par la menace.
5. **01:57** — Égalité opposée sans vainqueur et valeur moyenne des seconds rôles.
6. **02:22** — Véhicule, équipement, plongée hot-sim, dommages et biofeedback séparés.

**Vérifié :** parcours Playwright passé sans saut, dix assertions métier ; lint du scénario
et de l’exporteur propre. Sept images de scènes et huit images du MP4 final relues, début
et fin compris (`planche-film.jpg`). `verification.json` provient du parcours ;
`export-video.json` décrit le retrait de 8,418 s de chargement et la durée finale de
192,08 s, vérifiée par FFprobe. Aucun code du produit modifié pour ce clip.

```powershell
$env:ELECTRON_RUN_AS_NODE=$null
npx.cmd playwright test e2e/clipShadowrunAnarchy.spec.ts --reporter=list
```

La construction du produit doit être à jour. La vidéo WebM ne nécessite aucune installation.
Une conversion MP4 est aussi produite si un FFmpeg complet existe (`GMOS_FFMPEG` ou PATH).
