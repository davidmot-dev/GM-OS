# Dix-septième lot du lint — sources de Storyboard

David demande le 08/10 **« commit et passe à l'étape suivante (GM-OS est éteint) »**.
Les lots 14 à 16 et leurs documents sont d'abord commités localement sous
`f72243d0`, `b08b836d`, `089ed4fe`, puis `cc91326f`. Leurs **23 fichiers Codex**
sont vérifiés dans les quatre commits ; aucun changement de Claude inclus.
Aucun push demandé ni exécuté, dernier poussé documenté : `861eaca4`.
Le présent lot commence après ces commits et reprend les douze `any`
de `StoryboardDashboard.tsx`.

## Un seul contrat pour lire chaque source

`magasinsDuHub` ajoute les états réels de Music-OS, Sound-OS et Light-OS
par des références de types. Cela ne charge aucun moteur ni magasin à
l'exécution et ne ferme pas les cycles d'import audio.

Storyboard lit désormais les cinq magasins de ses sources par ce registre :
musique, lumière, carte, image et bruitage. Les types de playlists, pads,
atmosphères, projections et diaporamas viennent des magasins réels. Les douze
`any`, les formes recopiées à la main et les conversions de chaînes inutiles
sont retirés, y compris dans les deux listes d'images/diaporamas qui
employaient encore une forme locale derrière `unknown`.

Les lectures restent faites au rendu ou au clic, comme auparavant, sans
nouvel abonnement. Une capture lit donc l'état courant, et non une copie
figée à l'ouverture de l'éditeur. Les magasins absents gardent leurs replis.
Priorité des platines musicales, verdict vidéo de la carte, identité du pad
d'image retrouvée par chemin ou ancien identifiant, atmosphère du bruitage,
listes, noms et repli sur l'identifiant restent. Aucun changement de lecture
audio, de commande matérielle, de filtre de campagne, de persistance, de
temporisation ou de présentation. Aucune règle abaissée ou désactivée.

## Contrôles

Types et construction passent. Les **131 tests ciblés dans quatorze fichiers**
de Storyboard passent ; suite complète : **7 042 tests dans 548 fichiers**,
un fichier et quatre tests ignorés. Aucun nouveau test unitaire pour ces
conversions de types ; les contrats existants des sources et de leur jeu restent.

**Neuf scénarios Electron sont validés** : trois pour l'accès en/hors séance,
quatre pour l'état vide, l'éditeur, l'enregistrement et le retour au module,
et deux nouveaux pour les sources dans `storyboardOs.spec.ts`. Le premier
capture depuis les vrais magasins musique, lumière, carte vidéo sans extension
et image ; il change la platine après ouverture de l'éditeur et vérifie les
identifiants enregistrés. Le second choisit entre deux atmosphères portant
le même `PAD_01`, vérifie l'atmosphère conservée et le nom du bruitage dans
le détail. Les sélecteurs des deux nouveaux essais ont été resserrés après
un premier échec : les titres de colonnes ne sont pas les listes, et le
bouton de capture porte le nom accessible de sa source. Les deux essais
repassent après correction ; les sept scénarios existants étaient déjà verts.

Ces captures partent d'états artificiels dans les vrais magasins du profil
jetable : aucun son joué, aucune lampe commandée. Le détail du moment est
affiché sans déclencher sa lecture. Profils, sauvegardes, corpus et coffre
Obsidian jetables, appareils désactivés ; aucune donnée réelle ni capture
du manuel modifiée. Les sorties physiques restent hors de ces contrôles.

Lint global : **1 563 fichiers, zéro erreur, 334 avertissements**, contre 346.
**Douze `any` applicatifs retirés** : restent 330 `any` (107 applicatifs,
223 dans les tests), trois diagnostics de mémoïsation et une directive
inutile. Aucun `set-state-in-effect` ne revient. Lint ciblé final propre,
règles et JSON des 540 alertes initiales inchangés. `git diff --check` passe.

## Reprise

Dix-septième lot réalisé, documenté et **non commité : huit fichiers Codex**,
trois de code/tests et cinq documents. Dernier commit local : `cc91326f`.
Les lots 14 à 16 sont commités ; aucun push exécuté dans ce tour.
Reprendre les neuf `any` d'`InlinedMediaMigration.ts` (listes de données et
hôte de migration), puis les autres modules et les faux objets des tests,
selon l'audit ; mémoïsation et directive inutile gardent leurs lots ciblés.
Préserver les changements de Claude et l'isolation des essais.
