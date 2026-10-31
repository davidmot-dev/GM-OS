# Bannière COC2 — 31/10/2026

Fichier final : `docs/systems/coc/COC Band.jpg`. Illustration originale générée avec l’outil
natif d’images : panorama urbain au bord d’un canal, pont métallique et reflets assourdis au
crépuscule, dans une palette violette, bleu pétrole et ambre. Aucun texte, logo, cadre ou
personnage au premier plan.

La source générée a été copiée dans `source.png`, sans supprimer son original dans le cache du
générateur. Résolution réellement obtenue : **2 172 × 724 px**, malgré la demande de 3 840 × 1 280
ou du maximum natif disponible. Recadrage technique 4:1 : x=0, y=90, largeur=2 172, hauteur=543.

Le 31/10/2026, David a autorisé : **« Oui, exporter à 2 400 × 600 »**, après explication du facteur
d’agrandissement de 10,5 %. Le JPEG final fait donc **2 400 × 600 px**, par rééchantillonnage ;
aucun détail supplémentaire n’est revendiqué. La version native reste disponible dans
`banniere-native.jpg` pour inspection.

Invite exacte en anglais : `prompt-generation.md`. Dimensions, poids, qualité JPEG et empreintes
dans `verification-finale.json`. L’export refuse un écrasement sans demande ; la qualité est
ajustée pour rester sous **500 000 octets**. Les deux simulations d’en-tête 1188 × 54 et
700 × 54 utilisent un voile sombre de démonstration : **ce ne sont pas des captures de GM-OS**.
Le pont et le quai restent reconnaissables au centre ; les bords gardent une lecture calme.

Dans GM-OS : **éditeur du pilote → Bannière de l’en-tête → sélectionner COC Band.jpg**. Le fichier
est déposé, mais le pilote n’a pas été modifié et aucune sélection dans les données de David
n’est annoncée.

## Reproduire l’export

```text
node outils/coc/preparer-banniere.mjs
node outils/coc/preparer-banniere.mjs --2400 --accord-coc
```

La première commande produit la version native, la seconde celle autorisée pour cette source.
Le script refuse de remplacer un fichier déjà présent. Toute nouvelle génération exige mesure,
recadrage et revue propres ; l’accord ci-dessus concerne la bannière COC2 de cette livraison.
