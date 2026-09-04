# 🎭 Brouillard et calques : l'atelier

Cette page complète le [guide de Map-OS](./Map_OS_User_Guide.md). Elle ne redit pas où sont les
boutons : elle explique **comment le brouillard est fabriqué**, ce que les calques changent
vraiment, et quoi regarder quand l'écran des joueurs ne montre pas ce que vous attendiez.

---

## 🖌️ Comment le brouillard est fabriqué

Ce n'est pas un calcul de visibilité, c'est **une image**. Un calque noir posé par-dessus la carte,
dans lequel vous découpez des trous.

- **Révéler** efface la peinture noire ; **Masquer** la repose.
- Ce calque est ensuite converti en image et rangé dans la base locale (IndexedDB), **sous l'adresse
  du média**. C'est cette clé qui fait que le brouillard est *par carte*.
- Il n'est **pas** dans le stockage local ordinaire du navigateur : une image de brouillard pèse
  trop lourd pour y tenir.

Trois conséquences pratiques :

1. **Rien n'est calculé depuis les pions.** Aucun mur, aucune ligne de vue, aucune source de
   lumière. Ce que vous peignez est ce que vos joueurs voient — ni plus, ni moins.
2. **Le brouillard suit l'image, pas la scène.** Deux campagnes qui utilisent le même fichier de
   carte partagent le même brouillard.
3. **Réimporter la même carte sous un autre nom de fichier repart de zéro** (noir complet), parce
   que l'adresse a changé.

### Le départ en noir

Toute carte jamais explorée s'ouvre **noire à 100 %**, sur votre écran comme sur celui des joueurs.
Et si, pour une raison quelconque, l'image de brouillard ne peut pas être relue, le repli est **le
noir**, jamais la carte nue. C'est la seule bonne façon d'échouer ici.

---

## 🍱 Ce que les calques masquent, et pour qui

Le panneau **Gestion des Couches** ne supprime rien : il éteint l'affichage. Mais **cinq calques
n'agissent que sur votre écran, et deux agissent sur les deux**.

| Calque | Votre écran | Écran des joueurs |
| :--- | :---: | :---: |
| Brouillard de Guerre | ✅ | — |
| Grille Tactique | ✅ | — |
| Pions & Acteurs | ✅ | — |
| Effets Magiques | ✅ | — |
| Zones de Danger | ✅ | — |
| **Climat & Météo** | ✅ | ⛔ **aussi** |
| **Ambiance & Heure** | ✅ | ⛔ **aussi** |

> ⛔ **Correction.** Cette page affirmait que le panneau permettait « d'isoler des éléments sans
> affecter la projection des joueurs ». C'est faux pour les deux derniers calques. Vérifié dans le
> code le 2026-09-04.

**L'état des sept calques est unique et suit l'application**, pas la carte. Le pied du panneau
annonçait « sauvegardés par carte » jusqu'au 2026-09-04 ; il dit désormais « Ces réglages valent
pour toutes les cartes ».

---

## 🛠️ Le déroulé qui marche

1. **Importez la carte.** Elle est noire.
2. **Éteignez le calque *Brouillard de Guerre*.** Vous voyez tout ; les joueurs, rien.
3. **Posez vos pions, vos zones de danger, vos effets.** Réglez la grille sur le dessin.
4. **Rallumez le calque.** Votre écran redevient sombre — mais à 80 % seulement, vous distinguez ce
   qu'il y a dessous.
5. **Projetez**, et révélez au pinceau à mesure que le groupe avance.
6. **Changez de carte quand la scène change** : le brouillard de celle que vous quittez est gardé.

---

## 🔍 Quand l'écran des joueurs ne montre pas ce qu'il faut

| Symptôme | Cause la plus fréquente |
| :--- | :--- |
| **Un pion invisible chez les joueurs** | Il est **sous du brouillard non révélé** — le masquage est physique, rien ne passe au travers. Vous, vous le voyez à travers votre calque à 80 %. |
| **Un pion invisible, et pas de brouillard dessus** | Il est marqué **Cacher aux Joueurs** (clic droit sur le pion), ou il porte un statut d'invisibilité dans Combat-OS. Chez vous il apparaît grisé et translucide. |
| **La pluie a disparu chez les joueurs** | Le calque **Climat & Météo** est éteint : il agit sur les deux écrans. |
| **La carte reste noire chez les joueurs alors que vous avez tout révélé** | Vérifiez que la **projection est active** (le panneau affiche la destination) et non simplement préparée. |
| **Les joueurs voient une zone révélée qui ne correspond pas à cette carte** | Vous avez changé de carte alors que la nouvelle n'avait encore **aucun brouillard enregistré**. Donnez un coup de pinceau (ou **Tout masquer**) pour forcer l'enregistrement, ce qui remet les deux écrans d'accord. |
| **Un pion refuse d'être saisi, et paraît terni** | Quelqu'un d'autre le tient — une tablette, une autre fenêtre. Le verrou se relâche au bout de cinq secondes. |

---

## ⚠️ Rien de tout cela n'est sauvegardé

Le brouillard, les calques, les pions posés et les configurations de carte **ne font partie d'aucune
sauvegarde**, ni automatique ni manuelle. Le détail est dans le
[guide de Map-OS](./Map_OS_User_Guide.md).

---

*Page refaite le 2026-09-04 : deux affirmations retirées (les calques « sans effet sur la
projection », et une promesse de 60 images par seconde que rien ne mesure), et le tableau de
dépannage ajouté.*
