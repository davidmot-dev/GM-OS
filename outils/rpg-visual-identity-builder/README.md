# RPG Visual Identity Builder — le GPT de l'identité visuelle

Créé le 2026-10-17, à la demande de David : *« définir par drivers ou campagne une identité
visuelle avec des instructions précises que je pourrais donner au générateur d'image intégré […]
à partir d'une ou deux images d'exemple. »*

GM-OS sait déjà **proposer** une identité depuis des images d'exemple (bouton « Proposer depuis
ces images », modèle de vision de Cloudflare). Ce GPT sert quand on veut **en discuter** : comparer
deux pistes, resserrer une palette, écarter un défaut vu sur une génération ratée. Il rend
exactement les deux champs de l'éditeur de GM-OS.

## Créer le GPT (une fois)

1. ChatGPT → **Explorer les GPT** → **Créer** → onglet **Configurer**.
2. **Nom** : `RPG Visual Identity Builder`.
3. **Description** : « Tire d'images d'exemple l'identité visuelle d'un jeu de rôle, prête à coller
   dans GM-OS. »
4. **Instructions** : coller le contenu de [`instructions.md`](./instructions.md), en entier.
5. **Amorces de conversation** :
   - « Voici deux images d'exemple pour mon jeu : tire-en l'identité visuelle. »
   - « Cette génération est ratée (image jointe) : corrige l'identité. »
6. **Capacités** : cocher la **génération d'images** (pour un aperçu facultatif) ; le reste n'est
   pas nécessaire.

## S'en servir

1. Donner une à quatre images d'exemple, et dire pour quel jeu ou quelle campagne.
2. Discuter jusqu'à ce que le style convienne.
3. Dans GM-OS : **Identité visuelle…** (éditeur du pilote, ou carte de la campagne dans le
   cockpit) → coller **Style** et **À éviter** dans les deux champs → **Enregistrer**.
4. Les mêmes images d'exemple peuvent être ajoutées dans l'éditeur : avec un modèle FLUX.2, elles
   accompagnent chaque génération.

## Le contrat

Le GPT rend toujours un bloc final de cette forme, **en anglais** (les générateurs de GM-OS le
comprennent mieux), sans rien d'autre dans le bloc :

```
STYLE: <au plus 60 mots, des groupes séparés par des virgules>
AVOID: <au plus 15 mots>
```

Ce que GM-OS en fait est décrit au manuel, page
[Les jeux et leurs mécaniques](../../documentation/User%20Guides/53-Les-jeux-et-leurs-mecaniques.md)
(ligne « Identité visuelle »).
