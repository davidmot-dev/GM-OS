# 🎭 Guide Utilisateur : NPC Live Generator (IA)

Le **NPC Live Generator** est une extension majeure de NPC-OS. Il permet de générer instantanément des portraits et des décors immersifs pour vos entités (PNJ, Lieux, Objets) en générant l'image à la demande.

## 🌟 Pourquoi utiliser le Live Generator ?

- **Improvisation Totale** : Ne soyez plus jamais bloqué par le manque d'illustrations pour un PNJ improvisé.
- **Cohérence Visuelle** : L'IA adapte le style artistique à l'univers sélectionné (Fantasy, Cyberpunk, etc.).
- **Immersion Immédiate** : Projetez des visuels uniques sur le Hub Joueur en quelques secondes.

## 🖼️ Générer un Portrait (Avatar)

Pour donner un visage à votre entité :

1. **Générez une entité** ou sélectionnez-en une dans vos **Mémos**.
2. **Survolez l'avatar** (le cercle central) avec votre souris.
3. Cliquez sur l'icône **IA (Étincelles)** qui apparaît en surbrillance.
4. Patientez quelques secondes : l'IA analyse les caractéristiques (Race, Classe, Traits) pour peindre un portrait correspondant.

> [!TIP]
> Si le résultat ne vous convient pas, vous pouvez cliquer à nouveau sur l'icône pour relancer une génération différente.

## 🏔️ Générer un Décor (Background)

Pour situer votre entité dans son environnement :

1. Dans la fiche de l'entité, localisez la barre d'actions en bas.
2. Cliquez sur l'icône **Image (Paysage)**.
3. L'IA génère un décor cinématique basé sur le thème de l'univers et les détails de la fiche.
4. Le décor s'affiche automatiquement en fond de l'en-tête de la carte.

## 💾 Gestion et Sauvegarde

Toutes les images générées sont gérées de manière intelligente :

- **Media Hub** : Chaque visuel est enregistré dans votre bibliothèque locale (`Media Hub`).
- **Persistance** : Si vous enregistrez l'entité en **Mémo**, l'avatar et le décor sont conservés pour vos prochaines sessions.
- **Modification Manuelle** : Vous pouvez à tout moment remplacer une image IA par une image locale en cliquant sur l'icône **Partager/Dossier** sur l'avatar.

## ⚙️ Qui fabrique l'image

> ⛔ **Correction.** Cette page annonçait « l'IA Gemini (Imagen-3) » et demandait une **clé API
> Gemini**. Ni l'une ni l'autre : **Gemini ne génère aucune image dans GM-OS.** Relevé le
> 2026-09-04.

GM-OS essaie trois chemins, dans cet ordre :

| Ordre | Moteur | Quand |
| :---: | :--- | :--- |
| 1 | **FLUX en local**, par Ollama | Seulement **hors séance**. Voir l'encadré ci-dessous. |
| 2 | **Cloudflare Workers AI** (`flux-1-schnell`) | Le chemin normal, quelques secondes |
| 3 | **Z-Image**, via HuggingFace | Dernier recours |

**Ce qu'il faut configurer** : dans *Paramètres → IA → Image*, un **identifiant de compte
Cloudflare** et un **jeton** portant la permission `Workers AI — Edit`. Le forfait gratuit couvre
largement une campagne. Un bouton **Tester** emprunte exactement le même chemin que la génération
réelle — *un test qui refait l'appel à sa façon ne teste pas ce qui tourne en séance.*

> ⚠️ **En pleine partie, la diffusion locale est court-circuitée.** Un modèle local met jusqu'à
> quatre-vingt-dix secondes, et pendant ce temps il occupe **l'unique créneau de calcul** — donc
> l'Oracle et le Cortex avec lui. Séance ouverte, GM-OS va droit au service distant ; **mettre la
> séance en pause rouvre le local.**

Les messages d'erreur sont ceux que le service a rendus, jamais un « échec » générique : un quota
épuisé, un jeton sans la bonne permission et un identifiant de compte erroné sont trois problèmes
différents, et les confondre ferait chercher au mauvais endroit.

---

*Guide révisé le 2026-09-04, code à l'appui. Le moteur d'images n'est pas Gemini/Imagen-3 mais
**Cloudflare Workers AI**, avec FLUX en local hors séance et Z-Image en dernier recours — et la clé
à configurer n'est pas une clé Gemini. Ajouté : pourquoi le local est écarté pendant une séance.*
