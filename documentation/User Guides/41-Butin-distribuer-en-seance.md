# 💰 Loot-OS — le butin de séance
 
Le **Module de Loot** de Session-OS permet au MJ de gérer un pool d'objets trouvés durant la session et de les distribuer aux joueurs de manière fluide et documentée.

---

## 🎒 Le Pool de Butin (MJ)

Lorsqu'un groupe triomphe d'un défi ou fouille un lieu, le MJ peut ajouter des objets au **Pool de Butin**.

Le butin arrive dans le pool par **quatre portes** :

1. **Une table du pilote** — onglet *Génération*, section « Tables de Système ».
2. **Une description libre confiée à l'IA** — « un coffre de pirate maudit ».
3. **Un oracle de Table-OS** — le bouton « Verser au butin » sur un résultat de tirage,
   quand l'entrée déclare ce qu'elle donne (voir le *Guide Table-OS*).
4. **Une entrée de type Oracle** dans une table du pilote, qui appelle Table-OS pour vous.

Puis :

- **Consultation** : onglet *Pool Actif*. Les objets y restent tant qu'ils ne sont pas
  distribués ou supprimés.
- **Vider le pool** : d'un clic — et **seulement pour la campagne ouverte**, jamais pour les
  autres.

> ⭐ **Depuis le 2026-09-04, le pool appartient à une campagne et survit à la fermeture.**
> Avant, il était commun à toutes les campagnes et **disparaissait quand vous quittiez
> l'application** : ni la persistance vivante, ni les sauvegardes ne le contenaient. Le butin
> d'avant cette date n'a pas de campagne : il apparaît dans celle que vous regardez.

---

## 🤝 Distribution aux Joueurs

La distribution est instantanée et synchronisée avec les tablettes des joueurs.

1. **Sélectionner un objet** : Cliquez sur l'objet dans le pool de loot.
2. **Choisir le destinataire** : les personnages présents à la séance apparaissent sous
   l'objet, avec leur portrait.
3. **Assignation** :
    - L'objet est retiré du pool MJ.
    - Il est ajouté à l'inventaire **structuré** du personnage — l'onglet *Inventaire* de sa
      tablette, pas la zone de texte libre de sa fiche.
    - Le don est écrit au **journal de séance**, et **annoncé sur les tablettes**.

> ⚠️ **L'annonce part vers toutes les tablettes**, pas seulement celle du destinataire :
> `HubNotification` ne vise pas un personnage en particulier. Toute la table apprend donc que
> Brucelin a reçu l'Épée — c'est cohérent avec l'entrée de journal, mais à valider en séance.

---

## 📜 Historique du Loot

Chaque mouvement d'objet est enregistré dans l'**Historique du Loot**.

- **Traçabilité** : Consultez qui a reçu quoi et à quel moment.
- **Récupération** : En cas d'erreur, l'historique permet de vérifier la distribution et de rectifier manuellement si besoin.
- **Persistance** : L'historique est sauvegardé avec la campagne, permettant un décompte des richesses à la fin d'un arc narratif.

---

## 💡 Astuces pour le MJ

- **Objets groupés** : beaucoup de petits objets (50 pièces) se distribuent mieux en un seul
  « Bourse de pièces ».
- **D'où sort cet objet ?** Un objet versé par un oracle garde l'écriture de sa provenance —
  le nom de la table et celui de l'entrée tirée.
- **Le résumé ne compte que ce que vous voyez** : « Valeur totale » et « Objets remarquables »
  portent sur la campagne ouverte. Ils resteront à zéro tant que vos entrées de table n'ont ni
  valeur ni rareté — la Forge a désormais un champ pour chacune.
- **Récupération P2P** : Si un joueur veut donner son loot à un autre après coup, il peut utiliser la fonction **"Donner"** directement depuis son Tablet Hub (voir Guide Tablette).

---

*Dernière mise à jour : 2026-09-04 — pool par campagne et persisté, quatre portes d'entrée,
annonce sur les tablettes.*
