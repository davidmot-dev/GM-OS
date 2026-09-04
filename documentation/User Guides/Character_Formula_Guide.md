# 🧮 Guide : les formules de fiche

N'importe quel champ d'une fiche peut être **calculé** au lieu d'être saisi. Vous écrivez une
formule, elle se recalcule dès qu'une valeur change.

---

## ✍️ La syntaxe

Un `@` suivi du **nom du champ** en désigne la valeur.

```text
@Force + 10
@Force + @Dextérité        ⛔ ne marche pas — voir plus bas
@Niveau * 2
min(@Force, 20)
ceil(@Val / 2)
abs(@Modificateur)
```

Les opérateurs habituels (`+ - * / ^`), les parenthèses et les fonctions `min`, `max`, `floor`,
`ceil`, `abs` sont disponibles.

---

## ⛔ Comment écrire le nom d'un champ — la règle exacte

**Le nom du champ est nettoyé avant de devenir une variable :** les accents sont retirés, puis
**tout ce qui n'est ni lettre ni chiffre disparaît**.

| Le champ s'appelle… | Vous écrivez |
| :--- | :--- |
| `Force` | `@Force` |
| `Points de Vie` | `@PointsdeVie` |
| `Fôrcë` | `@Force` |
| `Défense (base)` | `@Defensebase` |
| `Sang-froid` | `@Sangfroid` |

> ⛔ **Les accents ne sont pas supportés dans la formule.** Ce guide disait qu'ils l'étaient tout en
> recommandant de les éviter — la première moitié est fausse. Le lecteur de formule ne reconnaît
> que **lettres non accentuées, chiffres et tiret bas**. `@Dextérité` s'arrête à `@Dext`, et la
> formule entière tombe. Écrivez `@Dexterite`.

---

## 🎲 Les dés dans une formule

`1d20 + @Bonus` fonctionne. Mais deux choses ne se devinent pas.

> ⛔ **Le nombre de dés ne peut pas être une variable.** Ce guide donnait `@NombreDeDes d6` en
> exemple : cette écriture **ne marche pas**. Le lecteur exige des chiffres des deux côtés du `d`.
> `2d6` oui, `@NombreDeDes d6` non.

<!-- -->

> ⚠️ **Un dé dans une formule de fiche est relancé à chaque recalcul.** Le résultat change dès que
> vous touchez à un autre champ. Une formule de fiche est faite pour des **valeurs dérivées**
> — un bonus, un seuil, un total —, pas pour un jet mémorisé. Pour lancer un dé et garder le
> résultat, c'est le [pupitre de dés](./Dice_OS_User_Guide.md).

---

## 🕳️ Quand une formule rend 0

C'est le comportement à connaître, parce qu'il ne ressemble pas à une erreur.

- **Un champ vide vaut 0.** Normal, et voulu : vos formules ne cassent pas sur une fiche à moitié
  remplie.
- ⛔ **Un nom que le lecteur ne reconnaît pas fait tomber TOUTE la formule à 0** — pas seulement ce
  terme. `@Force + 10` avec un `@Force` mal orthographié ne donne pas `10`, il donne **`0`**.

*C'est la conséquence pratique la plus utile de cette page : **une formule qui affiche
obstinément 0 est presque toujours un nom de champ mal écrit**, pas un champ vide.* Vérifiez
l'orthographe contre le tableau ci-dessus.

---

## 🛠️ Poser une formule (meneur)

1. Ouvrez l'**éditeur de gabarits** de fiches.
2. Ajoutez un champ, ou modifiez-en un.
3. Choisissez le type **Formule**.
4. Saisissez l'équation.
5. Enregistrez le gabarit.

> [!TIP]
> **Nommez vos champs sans accent ni ponctuation dès le départ.** « Points de vie » devient
> `@Pointsdevie` — lisible. « Défense (naturelle) » devient `@Defensenaturelle` — beaucoup moins.
> Le nom affiché peut rester joli, mais un champ qu'on référence souvent gagne à porter un nom
> simple.

---

*Guide révisé le 2026-09-04, code à l'appui. Deux affirmations fausses retirées : **les accents ne
sont pas supportés** dans une formule, et **le nombre de dés ne peut pas être une variable**.
Ajouté : la règle exacte de transformation d'un nom de champ, le fait qu'un nom inconnu fait tomber
toute la formule à 0, et qu'un dé y est relancé à chaque recalcul.*
