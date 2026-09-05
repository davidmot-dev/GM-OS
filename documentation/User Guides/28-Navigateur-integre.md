# 🌐 Web-OS

**Web-OS** est votre centre de commande pour toutes les ressources externes de votre campagne. C'est l'outil qui transforme GM-OS en une véritable plateforme unifiée en centralisant vos générateurs, wikis, et références de règles en un seul endroit.

---

## 🚀 Le Dashboard Web-OS
L'interface est conçue pour une efficacité maximale :
- **Bibliothèque de "Pads"** : Chaque lien est représenté par un "Pad" interactif.
- **Codes Couleurs** : Attribuez des couleurs à vos liens pour les catégoriser visuellement (ex: Orange pour les règles, Cyan pour les générateurs, Pourpre pour la musique).
- **Accès Rapide** : Cliquez simplement sur un Pad pour ouvrir le lien dans votre navigateur habituel.

---

## 📂 Gestion de la Bibliothèque
- **Nouveau Lien (New Link)** : Ajoutez une URL et donnez-lui un nom clair.
- **Édition** : Modifiez l'URL ou le titre d'un lien existant à tout moment.
- **Réinitialisation** : restaure les liens livrés avec GM-OS.

> ⚠️ **« Clear » et « Réinitialiser » ne font pas la même chose** : le premier vide la bibliothèque,
> le second la remplace par les liens d'origine. Aucun des deux ne se défait.

---

## 📺 Projeter une vidéo YouTube

**Ajouté le 2026-09-05, à la demande de David.** Collez l'adresse d'une vidéo
YouTube comme n'importe quel autre lien : Web-OS la **reconnaît**, remplace son
pictogramme par celui de YouTube, et ajoute un bouton **Projeter** dans les
commandes qui apparaissent au survol.

Les quatre écritures fonctionnent — celle du site, celle du bouton *Partager*,
celle du code d'intégration, et les *Shorts* — et le **point de départ est
conservé** si l'adresse en contient un (`?t=1m30s`).

**Vous choisissez l'écran au moment de lancer.** Le bouton ouvre la liste sur le pad
lui-même : *Player Hub*, puis chaque moniteur détecté. Une ligne déjà allumée se
coupe d'un second appui.

Chaque écran où la vidéo est à l'antenne porte son **étiquette sur le pad**, visible
sans survoler — *une vidéo qu'on a lancée et qu'on ne retrouve plus est une vidéo
qu'on ne peut pas couper.* Rien n'empêche de l'envoyer sur plusieurs écrans à la fois.

> ⭐ **Ce choix ne déplace pas la cible d'Image-OS.** Envoyer une vidéo sur le
> Moniteur 2 n'y enverra pas la prochaine image que vous projetterez depuis Image-OS.
> *Un geste ici ne doit pas déplacer vos images à votre insu.*

> ⛔ **Corrigé le 2026-09-05, à votre demande.** Le bouton nommait l'écran… réglé
> dans **Image-OS**, sans laisser en changer : viser le second moniteur demandait de
> quitter Web-OS, changer un réglage dans un autre module, et revenir.

> ⛔ **Trois choses qu'une vidéo YouTube ne fait pas comme un fichier**, et qu'il
> vaut mieux savoir avant la séance :
>
> - **Elle a besoin d'Internet.** Une coupure donne un cadre noir devant vos
>   joueurs.
> - **Elle ne part ni dans la sauvegarde ni dans Nexus.** Seule l'adresse voyage ;
>   la vidéo reste chez YouTube, et peut disparaître.
> - ⚠️ **Son son échappe entièrement au mixage.** Ni le volume général, ni le mode
>   Focus, ni le ducking de la voix ne l'atteignent — *un cadre distant ne se
>   branche sur aucun contexte audio, et aucun réglage n'y changera rien.* Réglez
>   le volume dans le lecteur, ou coupez l'écran.
>
> GM-OS bride ce qu'il peut : domaine sans traceur, et les suggestions de fin
> réduites à la même chaîne. **Il n'existe aucun moyen de supprimer l'écran de fin
> de YouTube** ; coupez l'écran avant que la vidéo se termine.

> 💡 **Pour une vidéo que vous montrerez souvent**, téléchargez-la et posez-la dans
> [Image-OS](./24-Image-OS-la-regie-visuelle.md) : elle devient un pad comme un
> autre — sauvegardée, transportable, mixée, et fiable hors ligne.

## 💾 Sauvegarde & Partage (JSON)
Votre bibliothèque Web-OS est précieuse. Vous pouvez l'exporter et l'importer très simplement :
- **Save (Export)** : Sauvegarde toute votre liste de liens dans un fichier JSON sur votre ordinateur.
- **Load (Import)** : Recharge une bibliothèque complète à partir d'un fichier JSON.
- **Clear** : Vide complètement l'interface pour repartir d'une page blanche.

---

## 🛠️ Le Bridge GM-OS
Web-OS utilise le **Bridge** système pour une expérience fluide :
- **Ouverture Externe** : Contrairement aux navigateurs web classiques, GM-OS demande à votre système d'exploitation d'ouvrir le lien. Cela signifie que le lien s'ouvrira dans votre navigateur par défaut (Chrome, Firefox, etc.) en dehors de GM-OS, vous permettant de garder vos outils favoris à portée de main sur un autre écran.

---

> [!TIP]
> **Organisation Tactique** : Créez une bibliothèque spécifique pour chaque système de jeu. Exportez-les en fichiers JSON nommés (ex: `web-alien.json`, `web-cthulhu.json`) et chargez la liste correspondante au début de votre séance !

---

*Complété le 2026-09-05 : Web-OS sait désormais **projeter une vidéo YouTube** sur un écran de
table, avec ses trois limites annoncées avant le clic. Voir aussi
[Image-OS](./24-Image-OS-la-regie-visuelle.md), qui a reçu les vidéos en fichier le même jour.*
