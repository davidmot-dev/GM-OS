# Reproduire le tournage Star Trek

Le dossier conserve scénario, plan, textes, sources, semence, modules, scripts et prises. Instance jetable obligatoire : le lanceur officiel e2e/lancerGmOs.ts protège AppData, sauvegardes, corpus, coffre et appareils. Ports locaux 4100/4101 déjà autorisés dans cette conversation. Ne pas lancer sur le profil personnel.

1. Préparer avec preparer.test.ts via vitest.config.mts (--maxWorkers=4), seulement avant de créer prises-r1. La garde refuse d'écraser une prise existante. Archive historique inchangée, import Nexus en mémoire ; modules séparés validés.
2. Construire avec npm.cmd run build puis fixer/contrôler les empreintes du build avant tout tournage. Sources enregistrées dans sources.json.
3. Plan et cartes sont préparés avec atelier_video.py textes. Le profil de rythme 125 mots/min et 14 caractères/s vient de la demande de David. Aucune accélération des gestes.
4. Playwright : GMOS_TOURNER=1, GMOS_REPETITION=1 et dossier GMOS_PRISE neuf pour une répétition. GMOS_REPETITION=0 pour une prise normale. Ne jamais livrer une répétition rapide.
5. caler.py prises-r1 détecte la mire ; examiner mire et début/milieu/fin puis valider prises.json. Aucun décalage emprunté à une autre prise.
6. atelier_video.py monter --plan plan.json --lecture textes-r2/lecture.json --prises prises-r1/prises.json --sortie montage-r1. FFmpeg/FFprobe existants, pas d'installation.
7. Extraire toutes les cartes et résultats du MP4 final et les relire. Consigner les limites réelles, notamment l'absence de visionnage humain continu. Vérifier sous-titres, chapitres, absence d'audio et empreintes avant livraison.

La campagne livrée est une copie identique des Voix de Nacre ; les données de réserve de table ne voyagent pas dans le .gmos. En interface, préparer Menace6 pour trois héros présents. Conserver les IDs et éviter les collisions avec une campagne active. Répéter dans un nouveau profil jetable ; pas de Nexus Remplacer utilisé comme reset d'un atelier.
