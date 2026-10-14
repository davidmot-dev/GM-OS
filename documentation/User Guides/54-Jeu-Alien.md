# 👽 Jeu — Alien

> **Pilote décrit :** « ALIEN, le jeu de rôle », exporté le 2026-10-14. Retour à [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Le moteur Year Zero : une réserve de d6, et des **dés de Stress** qui font monter la peur.

---

## Le jet — la réserve et le Stress

![Le panneau de jet d'Alien : Force (4) + Combat rapproché (2) = six dés, plus deux dés de Stress](captures/jeu-alien-jet.jpg)

- On retient un **Attribut** et une **Compétence** : leur somme donne les dés (jusqu'à 10).
- On retient aussi le **Niveau de Stress** : autant de **dés de Stress** se lancent avec les autres,
  **comptés à part**.
- Chaque **6** est une réussite.
- **Un 1 sur un dé de Stress déclenche la Panique.** Le panneau l'**annonce**, désigne le dé, et
  propose **« Test de Panique »** : 1D6 + Niveau de Stress. Sur le poste du meneur, la ligne de la
  table `Alien/test_de_panique` s'affiche sous le résultat (au-delà de 15, c'est la Catatonie) ;
  sur la tablette, le total remonte au meneur, qui lit la ligne.

![Après le lancer : deux réussites, et une Panique sur un dé de Stress](captures/jeu-alien-jet-lance.jpg)

---

## Forcer le jet

Après le lancer, **« Forcer le jet »** :

- le **Niveau de Stress monte d'un point** sur la fiche, avant la relance, et le **nouveau dé de
  Stress** part avec elle ;
- les **6 restent** sur la table ; tout le reste se relance — les dés relancés sont **cerclés** ;
- **une fois par test**. Le bouton se grise ensuite, et dit pourquoi.

**On ne force pas** après une Panique au premier lancer (le bouton le dit), ni avec un **androïde**
(un « Type » de personnage qui contient « androïde » ou « synthétique »). Une Panique sur la relance
se joue de même, avec le Stress déjà monté.

> Les talents qui font forcer **deux fois** (Dépassement de soi, Cran, Vif…) ne sont pas lus : le
> second forçage se fait à la main.

---

## Combat et santé

- **Initiative :** des **cartes numérotées de 1 à 10**, une par combattant, dans l'ordre croissant.
- **Santé :** points de vie, dont le **maximum se lit sur la Force**.
- **Ressources suivies :** Niveau de Stress, Points de Récit, Air, Eau, Nourriture, Énergie.
- **Le Stress hors du jet**, sur la carte du combattant : − et +, puis **« Repos −1 »** (un Tour en
  lieu sûr) et **« Objet fétiche −1 »** (une fois par acte ou par séance).

---

## La fiche HTML

La fiche d'Alien se relie à son personnage GM-OS (« Fiche du jeu »). Les pistes en cases (Stress,
Santé, Radiation, Expérience, Points de Récit) se comptent, et les dix lignes d'équipement forment
l'inventaire. Voir [Fiche de personnage HTML](./63-Fiche-de-personnage-HTML.md).
