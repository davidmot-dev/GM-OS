# ⚡ Guide Utilisateur : Calculateur de Dégâts Intelligent (Cortex-Powered)

Le **Calculateur de Dégâts Intelligent** est un outil avancé intégré au **Combat OS**. Il permet de gérer les impacts de combat de manière groupée et automatisée, en tenant compte des caractéristiques spécifiques de chaque participant.

![Aperçu du Calculateur](file:///C:/Users/david/OneDrive/Jeux%20de%20Rôles/GM-OS-v5/documentation/User%20Guides/combat_mockup.png)

> [!NOTE]
> **Nouveauté v6.2.6** : L'interface du calculateur est désormais intégralement localisée en **Français** et en **Anglais**. Tous les types de dégâts et les badges de statut s'adaptent dynamiquement à la langue de votre session.

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

## ✨ Auto-Status Mapping

Le calculateur ne se contente plus de modifier les PV. Selon le **type de dégâts** choisi, il peut injecter automatiquement des effets de statut sur les cibles :

-   🔥 **Feu** ➡️ Applique **En feu** (3T)
-   ❄️ **Froid / Glace** ➡️ Applique **Gelé** (2T)
-   🧪 **Acide** ➡️ Applique **Corrodé** (2T)
-   ⚡ **Éclair / Foudre** ➡️ Applique **Choqué** (1T)
-   🤢 **Poison** ➡️ Applique **Empoisonné** (3T)
-   💀 **Nécrotique** ➡️ Applique **Affaibli** (2T)
-   😵 **Psychique** ➡️ Applique **Confus** (1T)
-   ✨ **Radiant** ➡️ Applique **Ébloui** (1T)
-   💖 **Soin** ➡️ Applique **Soin** (1T)

> [!NOTE]
> **Gestion intelligente des conflits** : L'ajout automatique d'un statut respecte les règles de conflit. Par exemple, appliquer des dégâts de Feu sur une cible ayant le statut "Mouillé" retirera automatiquement ce dernier.

## 🔄 Synchronisation avec la Session (v6 Robustesse)

Une fois les dégâts appliqués via le calculateur :
1.  Les barres de vie (Gauges) sur les cartes de combat se mettent à jour.
2.  Le **Cortex OS** réévalue la situation tactique (un monstre agonisant pourrait déclencher un nouveau conseil de fuite).
3.  Vous pouvez cliquer sur **"Sync PV vers Session"** à tout moment pour que ces changements soient définitifs dans vos fiches de personnages.
    - *Note technique* : Le moteur de calcul v6 utilise désormais un typage strict pour garantir que les PV ne tombent jamais dans des valeurs négatives ou non numériques.

---

> [!TIP]
> **Le secret des Résistances** : Pour que le calculateur soit "intelligent", assurez-vous de bien remplir les champs **Résistances**, **Vulnérabilités** et **Immunités** dans la fiche de personnage ou d'entité (NPC OS/Session OS). Les noms des types doivent correspondre exactement (ex: "Feu").

> [!IMPORTANT]
> **Types de Dégâts Custom** : Vous pouvez personnaliser la liste des types de dégâts acceptés par le calculateur dans l'éditeur de **System Driver** (Section Combat).
