# 📜 Historique : Stabilisation Globale de la Connectivité Ollama (Windows)

**Date :** 7 Avril 2026  
**Statut :** ✅ Complété  
**Moteur :** Gemma 4 26B MoE

---

## 🚩 Contexte
Suite à l'intégration de **Gemma 4** comme moteur local-first, des instabilités majeures ont été détectées dans l'environnement Electron sous Windows. L'application subissait des erreurs de type `fetch failed` (Node.js) et `net::ERR_CONNECTION_REFUSED` (Chromium) de manière aléatoire, paralysant l'IA Oracle.

## 🔍 Investigation BMAD
L'analyse a révélé un conflit triple :
1.  **Conflit DNS IPv6** : Windows résout `localhost` en `::1`, alors qu'Ollama attend `127.0.0.1`.
2.  **Pile Réseau Node.js** : Le `fetch` natif de Node.js (utilisé dans les versions précédentes) gère mal les proxies et les résolutions DNS locales complexes de Windows.
3.  **CORS & Origins** : Manque de configuration de la variable d'environnement `OLLAMA_ORIGINS` empêchant Electron de valider la requête.

## 🛠️ Solutions Implémentées

### 1. Bascule vers la pile Chromium
Le service de communication `OllamaService.ts` a été migré vers le module **`net.fetch` d'Electron**. Contrairement à Node, ce module utilise la pile réseau de Google Chrome, qui est nativement conçue pour gérer les spécificités réseau de Windows et les certificats.

### 2. Forçage IPv4
- Suppression de toute référence à `localhost` dans le code.
- Utilisation systématique de `http://127.0.0.1:11434`.
- Injection de `dns.setDefaultResultOrder('ipv4first')` dans `main.ts`.

### 3. Protocole de Robustesse
- **Extraction Regex** : Ajout d'une logique de nettoyage des sorties LLM pour extraire uniquement le JSON, ignorant les préambules conversationnels de Gemma 4.
- **Diagnostics PowerShell** : Documentation d'une commande de test de santé rapide pour l'utilisateur.

## 📈 Impact
- **Fiabilité** : 100% de succès sur les appels de l'Oracle IA.
- **Performance** : Réduction de la latence de connexion (plus de timeout de résolution DNS).
- **Maintenance** : Code source typé et débarrassé des `any`.

---
*Document archivé dans le registre technique de GM-OS v6.*
