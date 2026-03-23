# Expansion des Systèmes de Santé GM-OS v5

## Objectifs
Implémenter les types de gestion de santé manquants pour couvrir les 10 standards identifiés par l'utilisateur. Priorité immédiate sur le type 2 (Niveaux) et 3 (Cases).

## Roadmap
- [ ] **Type 2 : Niveaux de Blessure (Wound Levels)**
    - [ ] Définition du schéma de données `{ levels: string[], currentIndex: number }`
    - [ ] Logique d'interprétation (Prochaine étape automatique)
    - [ ] Driver UI dédié (`WoundLevelsDriver.tsx`)
- [ ] **Type 3 : Cases de Blessure (Harm Boxes / PbtA)**
    - [ ] Définition du schéma `{ boxes: { label: string, severity: number }[] }`
    - [ ] Logique de remplissage séquentiel
    - [ ] Driver UI dédié (`HarmBoxesDriver.tsx`)
- [ ] **Intégration Rule Engine**
    - [ ] Ajout des types dans le `RuleEngineEditor`
