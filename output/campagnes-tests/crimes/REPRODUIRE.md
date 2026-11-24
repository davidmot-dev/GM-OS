# Reproduire le lot

Depuis la racine du dépôt GM-OS, avec ses dépendances déjà installées :

```powershell
node outils/campagnes-de-recette/crimes.mjs --regenerer
node outils/campagnes-de-recette/crimes-executer-tests.mjs
node outils/campagnes-de-recette/crimes-verifier.mjs
```

La régénération invalide les contrôles antérieurs : tous doivent viser la nouvelle empreinte. Le test de conformité CRI-A01 doit actuellement échouer ; le runner le consigne en échec et refuse tout autre échec. Ce n’est pas un résultat entièrement vert.

Relire les43rendus et l’histoire, consigner verification-relecture.json lié au SHA (rendusExaminees et narrationRelue), puis appeler node outils/campagnes-de-recette/crimes-livrer.mjs. Aucune installation, service, profil privé ou commande git nécessaire.

Les sources de reproduction sont des copies des fichiers de outils/campagnes-de-recette/ : les replacer à cet endroit dans un dépôt compatible. Fournir le pilote inchangé, la bannière et la fiche HTML/correspondance du GM-OS courant. Date fixe des données et en-têtes ZIP : 2026-11-20T12:00:00.000Z. L’utilitaire portable joint contrôle la structure ; il n’invente pas un moteur de règles.
