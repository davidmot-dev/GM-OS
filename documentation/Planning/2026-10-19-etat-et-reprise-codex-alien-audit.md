# État et reprise — analyse Alien — 19/10/2026

Lire AGENTS.md et la passation. Base : `ed44c680`.

David demande les améliorations du pilote Alien, avec le dossier de livres CLOUDDAVID et
NotebookLM. **Analyse uniquement.** Le [rapport complet](2026-10-19-alien-propositions.md)
consigne les acquis, les écarts, les sources et les propositions A0–A8.

Livre français `ALIEN_le_jeu_de_rôle.pdf` (398 pages PDF), deux errata locaux datés du 09/04
et 04/11/2021, deux consultations du carnet ALIEN limitées au livre de base. Ne pas mélanger
Evolved Edition, Marines Coloniaux et résumés de campagnes avec les règles de ce PDF.
Aucun export récent du vrai pilote trouvé. La recette des accessoires est explicitement
fictive : elle ne décrit pas les règles Alien et ne doit pas servir d'export de référence.

Forçage, talents de second forçage, Panique, cumul, Point de Récit, Stress manuel et accessoires
sont déjà faits. Priorité proposée : conséquences de Panique sur le résultat, Stress subi,
armes/modificateurs et protection/critiques, puis synthétiques et réserves/états.
Les critiques humains/synthétiques/xénomorphes et attaques spéciales ont déjà leurs tables.

Preuves dans `scratch/alien-audit/` : deux réponses NotebookLM citées, texte du livre et des
errata, rendus, `constats.json`. Certaines vérifications concernent les fonctions du moteur
avec la déclaration de son test ; le rapport distingue ce cas d'un défaut affirmé du pilote
installé. Aucun développement ni essai d'interface réalisé.

**Demande suivante de David, le 19/10 : « consigne cela dans un registre d'amélioration
d'alien ».** [Registre Alien créé](2026-10-19-registre-ameliorations-alien.md) : A0–A8, priorités
proposées, dépendances, cas d’acceptation et historique. Tous les lots sont à planifier ;
aucun développement choisi ni lancé. Le registre dédié fait désormais foi pour l’avancement.

Reprendre sur une décision de David et son export actuel. Avant de modifier `src/` ou
`electron/`, demander si GM-OS tourne. Ne pas recopier le jet de protection de Blade Runner
pour Alien ; ne pas tirer un entier 1–66 pour une table D66.

Le registre et `2026-10-19-ameliorations-noc.md` étaient déjà modifiés/non suivis : laissés
intacts. Audit Alien et registre dédié conservés dans ces **trois nouveaux documents, non commités** ;
lien au registre général à coordonner avec son écrivain. Notes Dune et `tmp/` également intacts.
Aucun code applicatif, aucune donnée de campagne, aucun paquet/service, aucun commit/push.
