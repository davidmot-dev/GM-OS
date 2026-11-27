# Reproduire

Depuis le dépôt avec ses dépendances existantes, conserver les sources aux empreintes de provenance.json.

    node outils/campagnes-de-recette/traveller.mjs --regenerer
    node outils/campagnes-de-recette/traveller-executer-tests.mjs
    node outils/campagnes-de-recette/traveller-verifier.mjs

Relire la fiction et les planches, consigner la relecture liée au SHA courant, puis lancer traveller-livrer.mjs. Vitest est limité à --maxWorkers=4. Aucun service réseau, paquet ni profil personnel requis. Toute régénération invalide les preuves liées à l’ancienne empreinte. Les références aux moteurs réels ne sont pas remplacées par un faux module.
