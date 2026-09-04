# 📓 Guide : NotebookLM, et ce qu'il fait vraiment dans GM-OS

> ⛔ **Cette page décrivait NotebookLM comme le moteur de l'Oracle. Il ne l'est pas.**
>
> On y lisait que « l'Oracle s'appuie sur le NotebookLM MCP Server », que chaque campagne « pointe
> vers une URL NotebookLM », et que sans ce pont l'IA ne répondrait pas. **Rien de tout cela n'est
> vrai pour la conversation avec l'Oracle** : elle passe par le fournisseur choisi dans les
> réglages IA — Ollama, Gemini, OpenAI, Anthropic ou une adresse à vous.
>
> Un meneur dont l'Oracle ne répondait plus était donc envoyé réparer un pont sans rapport.
> Corrigé le 2026-09-04. → [Le vrai guide de l'Oracle](./AI_Oracle_User_Guide.md)

---

## 🎯 À quoi NotebookLM sert, alors

À **une** chose, et elle est précieuse : **distiller un gros document**.

NotebookLM est un service de Google qui ingère des sources — un PDF de règles, un scénario de
cent pages, une vidéo, un site — et sait en tirer des réponses. GM-OS s'en sert dans **la Forge de
campagne** : c'est l'étape qui transforme un scénario écrit en actes, scènes, PNJ et lieux.

C'est un travail de **préparation**, long (deux à cinq minutes), fait une fois. Rien à voir avec la
question qu'on pose en pleine partie.

→ [Guide de la Forge de campagne](./Forge_De_Campagne_User_Guide.md)

---

## 🔌 Le pont, et quand il vous concerne

GM-OS parle à NotebookLM par un **serveur MCP**, qui doit être installé et authentifié sur votre
machine.

- **Le carnet se désigne par son URL**, dans l'atelier de campagne. GM-OS en extrait l'identifiant.
- **Si l'authentification expire**, le bouton **Forcer la reconnexion au pont NotebookLM** de
  l'atelier rafraîchit les jetons. En dernier recours, la commande
  `notebooklm-mcp-auth` dans un terminal.

> ⚠️ **Le diagnostic des réglages IA porte une ligne « Oracle » qui teste ce pont-là**, et non la
> conversation. Une croix rouge sur cette ligne ne dit **rien** de la capacité de l'Oracle à
> répondre. C'est un nom malheureux dans le code ; le savoir évite une heure de dépannage inutile.

---

## 📤 « Sync Oracle », depuis le module Obsidian

Le bouton **Sync Oracle** du module Obsidian envoie la note affichée **comme source dans votre
carnet NotebookLM**. Il est grisé tant qu'aucune URL de carnet n'est renseignée.

> ⛔ **Il ne fait pas ce que son nom promet.** La note rejoint le carnet ; elle **n'entre pas** dans
> le corpus que l'Oracle interroge en conversation. Pour que l'Oracle lise vos notes Obsidian, c'est
> **l'interrupteur du coffre** qu'il faut, dans les réglages IA. →
> [Guide Obsidian](./Obsidian_User_Guide.md)

---

## 🧭 Lequel des trois, pour quoi

| Ce que vous voulez | L'outil |
| :--- | :--- |
| Poser une question en cours de partie | **L'Oracle**, sur son corpus local |
| Que l'Oracle connaisse vos notes Obsidian | **L'interrupteur du coffre**, réglages IA |
| Transformer un scénario de cent pages en campagne jouable | **La Forge de campagne**, avec NotebookLM |

---

*Page refaite le 2026-09-04. Son sujet a changé : elle prétendait décrire le moteur de l'Oracle, et
décrit désormais NotebookLM pour ce qu'il est — l'outil de distillation de la Forge de campagne. Le
tableau des six personas qu'elle portait est supprimé : il en manquait deux, et il faisait doublon
avec le guide de l'Oracle, qui les tient à jour.*
