# 🖖 Jeu — Star Trek

> **Pilote décrit :** « Star Trek », exporté le 2026-10-14. Retour à [Les jeux et leurs mécaniques](./53-Les-jeux-et-leurs-mecaniques.md).

Star Trek Adventures, deuxième édition : le système 2d20, comme [Dune](./54-Jeu-Dune.md), avec un Attribut
et une Fonction.

---

## L'Impulsion et la Menace

![Le bandeau de Star Trek : l'Impulsion des joueurs en six segments, la Menace du meneur, et « Fin de scène »](captures/jeu-star-trek-reserves.jpg)

| Réserve | Ce qu'elle fait dans GM-OS |
| :--- | :--- |
| **Impulsion** (0 à 6, aux joueurs) | Chaque **réussite excédentaire** l'alimente ; elle paie les dés achetés. **« Fin de scène »** lui retire un point. Les joueurs la voient et la dépensent depuis leur tablette |
| **Menace** (au meneur, sans plafond) | Visible des joueurs. **Un dé acheté sans Impulsion se paie en Menace** |

> La Menace de départ du livre est de **deux points par personnage joueur** ; le pilote en pose 2,
> à ajuster à la main au début de la partie.

---

## Le jet

![Le panneau de jet de Star Trek : Audace + Sécurité, un dé acheté](captures/jeu-star-trek-jet.jpg)

- On retient un **Attribut** et une **Fonction** : leur somme est le **seuil**.
- **2d20** sous le seuil ; un **1** vaut deux réussites, un **20** est une complication.
- **Spécialisation** : cochez la case quand la tâche entre dans une spécialisation du personnage
  (le *Focus* de l’édition anglaise). Chaque dé **inférieur ou égal à la Fonction** vaut alors deux
  réussites ; la borne s’affiche à côté de la case, « critique ≤ 4 ».
- Les dés achetés coûtent 1, 2 puis 3 points d'Impulsion, jusqu'à 5 dés.
- La **difficulté** (0 à 5) est le nombre de réussites à atteindre.

![Après le lancer](captures/jeu-star-trek-jet-lance.jpg)

---

## Combat et santé

- **Santé :** le modèle « blessures ».
- **Détermination** et **Réputation** sont suivies sur chaque carte de combattant.
- **Distances** en zones.

---

## LCARS — la passerelle dans le Tablet Hub

Dans **Bibliothèque des modèles › pilote Star Trek › Modules du jeu**, sélectionnez
**LCARS — Passerelle**. Le choix accompagne l’export/import du pilote. Un ancien pilote
Star Trek ne l’active pas automatiquement : il faut le sélectionner une première fois.

Dans **Cockpit › Modules du jeu**, ouvrez le pupitre LCARS. Vous pouvez préparer le
vaisseau, ses éléments et ses rapports avant de commencer la séance.

1. Dans **Passerelle**, choisissez un **Personnage à préparer**, puis **Préparer ce personnage**.
2. Attribuez-lui une ou plusieurs consoles. Les noms viennent des personnages de la campagne.
3. Démarrez la séance, puis cochez les personnages dans **Accès des personnages**, au-dessus
   du pupitre. Préparer un poste et ouvrir LCARS sont deux décisions séparées du meneur.
4. Sur la tablette, ouvrez **Modules du jeu › LCARS — Passerelle**. Seules les consoles
   attribuées au personnage apparaissent. Sans poste, il peut consulter les rapports communs.

![Affectations LCARS : Science et Médecine pour Nel Varga, Commandement et Tactique pour Idris Koa](captures/jeu-star-trek-lcars-equipage.jpg)

| Console | Ce qu’elle présente et permet de proposer |
| --- | --- |
| Commandement | Objectifs et suivi des ordres ; rapport de situation, proposition d’alerte et ordres avec accusés de lecture. |
| Science | Capteurs et contacts ; scan ou analyse ciblée. |
| Ingénierie | Coque et circuits ; diagnostic, réparation ou reconfiguration. |
| Communications | Canaux et récepteur ; ouverture de liaison, décodage ou transmission. |
| Navigation | Carte et itinéraires ; cap, évitement ou passage en distorsion. |
| Tactique / sécurité | Secteurs et contacts ; identification, verrouillage proposé ou intervention. |
| Médecine | Dossiers et examen ; diagnostic, analyse ou soins proposés. |

Les schémas sont illustratifs ; les états sont définis par le meneur. LCARS ne calcule ni
réussite, dégâts, boucliers ou soins, et ne modifie pas les réserves de la partie.

![Table de commandement LCARS dans le Hub : objectif de mission et ordre dont Nel Varga a accusé réception](captures/jeu-star-trek-lcars-commandement.jpg)

### Interventions et rapports

Le joueur choisit une fiche dans son instrument, indique l’action et son intention, puis
**Transmettre l’intervention**. Dans **Demandes**, le meneur peut prendre en charge la demande,
demander un jet, répondre, accepter/refuser et choisir un état résultant.
Le rapport préparé reste privé au meneur. La réponse est privée au demandeur ; elle devient
commune seulement si le meneur autorise le partage et si le joueur la partage volontairement.
Le meneur peut aussi publier directement un rapport ciblé dans **Diffusion**.

Les éléments se créent et se révèlent dans **Préparation**. **Préréglages** mémorise la
situation et les états sans effacer les affectations et rapports. Les alertes et comptes à
rebours sont **visuels dans cette première intégration**. Les pièces jointes et le diffuseur
sonore attendent les tranches suivantes ; l’atelier autonome conserve ses essais audio/vidéo.

### Conservation et import de l’atelier

GM-OS sauvegarde la préparation et les historiques privés par campagne et les inclut dans
ses sauvegardes/exportations. Fermer le pupitre les conserve. Au redémarrage ou à la restauration,
les effets sont arrêtés et le meneur doit rouvrir les accès. Une préparation d’une version
plus récente est conservée et signalée comme indisponible.

**Importer une préparation** accepte le JSON exporté de l’atelier LCARS. L’aperçu montre le
vaisseau et les nombres d’éléments/préréglages ; une confirmation précède le remplacement.
Celui-ci efface les historiques et affectations LCARS actuels et ferme les accès. Les
personnages fictifs et leurs échanges ne sont pas importés. Sauvegardez GM-OS avant de
remplacer une instance dont vous souhaitez conserver les rapports.

Retirer un poste annule ses demandes encore actives et conserve les autres consoles.
Décocher un accès retire immédiatement LCARS à ce personnage. **Tout couper** ferme tous
les modules ; une déconnexion ferme la vue jusqu’à la reprise de la liaison.

*Relu le 2026-10-16 : première intégration LCARS, tranches L1–L4 ; médias et audio à suivre.*
