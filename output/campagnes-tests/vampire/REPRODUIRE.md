# Reproduire le lot

Depuis la racine du dépôt GM-OS et ses dépendances déjà installées :

```powershell
node outils/campagnes-de-recette/vampire.mjs
node outils/campagnes-de-recette/vampire-executer-tests.mjs
node outils/campagnes-de-recette/vampire-verifier.mjs
```

Une assertion de conformité VAM-A01 est délibérément conservée en échec ; le vérificateur ne tolère que ce défaut nommé et le signale comme tel. Après lecture des rendus, consigner la relecture liée au SHA de l’archive, puis appeler le vérificateur avec --emballer. Tout rapport dépend de l’archive exacte ; renouveler les contrôles après régénération. La date fixe 2026-11-17T12:00:00.000Z sert aux données et aux en-têtes ZIP. Aucun profil privé, paquet supplémentaire ni serveur nécessaire.

Le générateur écrit seulement output/campagnes-tests/vampire/ ; ne pas modifier une archive livrée à la main ni réutiliser un ancien rapport sur un autre SHA. Pour porter les sources de reproduction dans un autre dépôt, remettre les fichiers sous outils/campagnes-de-recette/ et fournir le pilote 2.0.0, la bannière et le HTML correspondant.
