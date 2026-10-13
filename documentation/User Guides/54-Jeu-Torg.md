# ⚡️ Jeu — Torg Eternity

> **Pilote décrit :** « Torg Eternity », exporté le 2026-10-13, corrigé le même soir. Retour à [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Les Chevaliers des Tempêtes contre les Seigneurs de Réalité.

---

## Le jet — la Table des Bonus

![Le panneau de jet de Torg : Dextérité et Esquive forment le niveau, contre un Niveau de Difficulté de 10](captures/jeu-torg-jet.jpg)

1. On retient un **attribut** et, s'il y en a une, une **compétence** : leur somme est le **niveau**.
   Une compétence **non entraînée** se laisse vide (« — aucune — ») : le test se fait sur
   l'attribut seul.
2. On règle le **Niveau de Difficulté** : 10 par défaut (Normale), de 6 (Très facile) à 20 (Presque
   impossible).
3. **Lancer** : un d20. **Sur 10 ou 20, il explose** — on relance et on cumule, autant de fois qu'il
   le faut.
4. Le total du dé devient un **bonus** par la Table des Bonus, ajouté au niveau : c'est le **total
   d'action**.

| Total d'action moins ND | Résultat |
| :--- | :--- |
| 10 et plus | **Succès Spectaculaire** |
| 5 à 9 | **Succès Supérieur** |
| 0 à 4 | **Succès Simple** |
| moins de 0 | **Échec** |
| un **1 au premier dé** | **Échec critique**, quel que soit le reste |

Le panneau dit tout le calcul : « Succès Supérieur — dé 10 + 7 = 17 → bonus +4 ; total d'action 15
(niveau 11) contre ND 10, marge +5 ».

![Après le lancer](captures/jeu-torg-jet-lance.jpg)

### La Table des Bonus

| Dé | Bonus | Dé | Bonus |
| :---: | :---: | :---: | :---: |
| 1 | Échec | 15 | +2 |
| 2 | −8 | 16 | +3 |
| 3–4 | −6 | 17 | +4 |
| 5–6 | −4 | 18 | +5 |
| 7–8 | −2 | 19 | +6 |
| 9–10 | −1 | 20 | +7 |
| 11–12 | 0 | 21–25 | +8 |
| 13–14 | +1 | puis +1 par tranche de 5 | |

> ⚠️ **La table vient du carnet NotebookLM « Torg »** (livre de base, page 109), pas du corpus, qui
> ne la contient pas. À relire contre le livre ; si une ligne diffère, elle se corrige dans
> `src/modules/dice/systemes/torg.ts`, et ses tests avec.

---

## Ce que le panneau ne fait pas encore

- **Les Possibilités** : dépenser une Possibilité pour lancer un dé de plus (minimum 10 garanti) se
  fait encore à la main, au pupitre.
- **L'échec critique étendu** (de 1 à 2, ou de 1 à 4, selon le risque) n'est pas réglable : seul le
  1 naturel au premier dé compte.
- **Les compétences favorisées** (relancer le premier dé) ne sont pas proposées.

---

## Combat et santé

- **Initiative :** la Dextérité, dans l'ordre croissant.
- **Choc** (la jauge principale) et **Blessures** sont suivis sur chaque carte de combattant.
- **Distances** en mètres, de « au corps à corps » à « Portée Longue ».
