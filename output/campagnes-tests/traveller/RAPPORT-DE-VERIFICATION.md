# Rapport — La Part des absents

**LOT PRÉPARÉ. 121 contrôles ciblés réussis, zéro échec.** Aucun essai humain ou import dans la fenêtre Electron revendiqué.

Archive : 01-Traveller-La-Part-des-Absents.gmos
SHA-256 : cea275bada5294581da97f31d9bdbc76d1a1907ff60fd23dca2d9167c3cc0689
Pilote 2.0.0 inchangé : 00eeb3f79fd80102024ee5f32d1bf866e5bd4c0d8fa6e89a68cd80097009fbd7
Date technique fixe : 2026-11-27T12:00:00.000Z

## Réalisé

- Une campagne, douze séances prévues, quatre actes narratifs de 36 scènes et dix ateliers hors fiction ; trois héros nouveaux pour les trois joueurs autorisés, trois profils d’essai, douze dossiers de PNJ, un opposant narratif et deux cibles de recette ; dix lieux, 26 indices, cinq pages de Wiki et deux rencontres préparées. Quatre fins adaptables et deux ordres de visite possibles pour les séances 4 et 5.
- Pilote réel et gabarit vérifiés, contrôle de Forge sans constat, 333 champs exacts. Naissance des six PJ par naissanceDansLeJeu ; MD et total physique par alignerLaFicheDeTraveller ; inventaire depuis objetPourLeSac et vrai catalogue.
- Jets via preparerLeJet sur les vrais champs : MD, zéro/vide, Polyvalent, spécialités et Profession. Vecteurs des six Effets, chaîne, Coup de pouce/sort, durée et simultanéité ; tests natifs du moteur inclus.
- Dégâts et soins par handleApplyImpact du magasin : 10 dégâts donnent END 0/FOR 3/DEX 8, Physique 11 ; un soin de 4 donne 2/5/8, Physique 15. Incapacitante sur END seule ; plafond des soins et créature à PdV 6→4→5 sans caractéristiques humaines. Tests natifs d’inconscience et de mort inclus.
- Correspondance HTML pure : 328 clés aller-retour, champs internes conservés. PSI actuelle reflétée dans le MD sans prétendre automatiser ses coûts.
- Injection Nexus native en mémoire : une campagne ajoutée, anciens PJ et avatars fictifs conservés ; sauvegarde construite et acceptée par validateSession. Cash JET 1000→750→1000 puis sérialisation, témoin de fiction et DEX de Nora conservés.
- GM-05 : secrets des campagnes, personnages, séances et lieux caviardés ; indices cachés absents, partage du seul indice de recette, charge source inchangée. Pas d’audit général du transport.
- gmos_bundle.py du plugin : structure Nexus partielle acceptée. Tous les médias ont leur SHA et leur taille vérifiés, et toutes les références de fichiers de l’état se résolvent dans l’archive.
- 47 images décodées/rendues hors ligne, dont 46 SVG originaux et la bannière ; aucun texte SVG ne déborde de sa page. Deux WAV synthétiques mono de quatre secondes décodés par Web Audio ; écoute humaine non effectuée. Six planches et deux rendus complets relus par l’IA.
- Fiction relue : pas de scène réduite à un titre, pistes redondantes, négociation et retrait, budget et mandats explicites, conséquences à noter plutôt que présumées. Corpus existant relu 21/21 réutilisé ; aucune nouvelle relecture intégrale du PDF prétendue.

## Non exécuté

Import/sauvegarde/rechargement Electron, fiche HTML dans Electron, transport réel des jets, droits à l’écran, Hub aux trois tailles, tablettes physiques, matériel, IA/TTS et partie humaine. Les fichiers de résultats conservent **62 cas NON TESTÉS**. Aucun service réseau ni paquet installé et aucune donnée du profil personnel touchée.

Les limites détaillées et les gestes manuels sont conservés dans ANOMALIES-CONNUES.md et dans chaque cas de la matrice.
