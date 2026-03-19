# ⚡ Guide Utilisateur : Calculateur de Dégâts Intelligent (Cortex-Powered)

Le **Calculateur de Dégâts Intelligent** est un outil avancé intégré au **Combat OS**. Il permet de gérer les impacts de combat de manière groupée et automatisée, en tenant compte des caractéristiques spécifiques de chaque participant.

![Aperçu du Calculateur](file:///C:/Users/david/OneDrive/Jeux%20de%20Rôles/GM-OS-v5/documentation/User%20Guides/combat_mockup.png)

## 📋 Fonctionnement Général

Accessible via le bouton **"Calculateur de Dégâts"** dans le panneau de contrôle droit du combat, cet outil remplace les calculs manuels fastidieux :

1.  **Saisie du Montant** : Tapez le nombre de dégâts ou de soins de base.
2.  **Type de Dégâts** : Sélectionnez le type (Feu, Froid, Magique, etc.). Les types disponibles s'adaptent automatiquement selon le système de jeu (Driver) sélectionné.
3.  **Bascule Dégâts/Soins** : Un interrupteur permet de passer instantanément du mode offensif au mode récupération.

## 🧠 Intelligence de Prévisualisation (Cortex)

C'est ici que l'outil devient "intelligent". Avant même d'appliquer les dégâts, la liste des cibles affiche une **"PRÉCO"** (Prévisualisation) :

-   🛡️ **Résistance** : Si une cible est résistante au type choisi, le calculateur divise automatiquement les dégâts par deux. Un badge **RESIST** apparaît.
-   ⚠️ **Vulnérabilité** : Si la cible est vulnérable, les dégâts sont doublés. Un badge **VULN** apparaît.
-   🚫 **Immunité** : Si la cible est immunisée, le montant tombe à `0`. Un badge **IMMUNE** apparaît.
-   💚 **Soins** : En mode soins, le calculateur plafonne automatiquement les PV récupérés au maximum de chaque personnage.

## 👥 Gestion Multi-Cible

-   **Sélection Rapide** : Vous pouvez cocher individuellement les cibles ou utiliser le bouton **"Tout sélectionner"**.
-   **Indicateurs de Faction** : Les cibles sont bordées de couleurs thématiques (Bleu pour PJ, Rouge pour PNJ) pour éviter les erreurs de tir ami.
-   **Application Groupée** : Une fois la sélection terminée, cliquez sur **"Appliquer"**. Tous les combattants sont mis à jour simultanément.

## 🔄 Synchronisation avec la Session

Une fois les dégâts appliqués via le calculateur :
1.  Les barres de vie (Gauges) sur les cartes de combat se mettent à jour.
2.  Le **Cortex OS** réévalue la situation tactique (un monstre agonisant pourrait déclencher un nouveau conseil de fuite).
3.  Vous pouvez cliquer sur **"Sync PV vers Session"** à tout moment pour que ces changements soient définitifs dans vos fiches de personnages.

---

> [!TIP]
> **Le secret des Résistances** : Pour que le calculateur soit "intelligent", assurez-vous de bien remplir les champs **Résistances**, **Vulnérabilités** et **Immunités** dans la fiche de personnage ou d'entité (NPC OS/Session OS). Les noms des types doivent correspondre exactement (ex: "Feu").

> [!IMPORTANT]
> **Types de Dégâts Custom** : Vous pouvez personnaliser la liste des types de dégâts acceptés par le calculateur dans l'éditeur de **System Driver** (Section Combat).
