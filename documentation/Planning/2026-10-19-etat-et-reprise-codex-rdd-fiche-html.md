# RdD — fiche HTML du Livret du voyageur, 19/10/2026

> **Actualisation après livraison :** le raccord a été commité par Claude dans `fef92b06`.
> Le gabarit et la correspondance sont désormais intégrés (moteur v11, 813 clés couvertes).
> Le pilote à réimporter est `Export Dirvers/corriges/RDD_driver_gmos_relie.gmos-driver`.
> Les indications « pas intégrés » ci-dessous décrivent l'état à la livraison `5426215f`.

David invoque **GM-OS Studio** : « crée la fiche de personnage HTML pour Reve de dragon »,
avec `C:/Users/david/Downloads/Livret du voyageur - 2.0.pdf`, puis demande **« commit et pousse »**.
La sélection Nephilim affichée dans l'IDE ne concerne pas cette demande.

## Livraison et vérifications

Le livrable est `docs/fiches/Rêve de Dragon/reve-de-dragon-livret-voyageur-interactif.html` :
gabarit nouveau `reve-de-dragon-voyageur-fr`, cinq pages de 595 × 842 unités, 922 zones,
813 clés logiques, fonds d'origine intégrés en WebP. Aucun HTML RdD antérieur identifié.
Identité, caractéristiques/XP, compétences, équipement, sorts/rituels, feuille de route et
Archétype sont saisissables. Pistes cumulatives et choix exclusifs suivent le contrat du moteur.
Les seuls `derive` sont cinq copies : quatre bandeaux du nom et le SC de la feuille de route.
L'adaptation des cases de fatigue à l'Endurance reste manuelle et expliquée dans l'aide.

La fiche fonctionne seule hors ligne : navigation, zoom 20–400 %, raccourcis, Zones,
sauvegarde locale, export/import JSON, réinitialisation confirmée et impression.
Les cinq pages ont été relues en image avec Zones puis remplies dans un navigateur isolé.
Contrôle automatisé réussi : zéro chevauchement, zéro erreur JavaScript, zéro requête réseau,
aller-retour JSON et persistance, rejet des imports invalides sans perte, cinq pages imprimées.
Validateur GM-OS : zéro erreur ; deux avertissements attendus (nouveau gabarit absent du moteur,
correspondance absente). Rapports et captures dans `scratch/reve-de-dragon-fiche/`.

Sources reproductibles : `outils/reve-de-dragon/construire-fiche-voyageur.mjs` et
[`LIVRAISON.md`](../../outils/reve-de-dragon/fiche-voyageur/LIVRAISON.md), CSS, runtime et
vérificateur dans `outils/reve-de-dragon/fiche-voyageur/`. Le PDF reste hors du dépôt ; son
empreinte est consignée dans la livraison. Le HTML livré est vierge et ne dépend pas du PDF.

## Par quoi reprendre

Le gabarit HTML et la table de correspondance ne sont **pas intégrés**. Selon le § 7 du cahier
des charges, Claude Code écrit ensuite la correspondance depuis le pilote, intègre le gabarit
dans `Character_Sheet_Manager.html` et augmente `BUILTIN_VERSION`. Jusqu'alors, la saisie de
ce HTML ne remonte pas dans les données du pilote. La frontière du module externe TMR reste
inchangée ; aucun moteur de règle n'a été ajouté dans la fiche.

Aucune modification de `src/` ou `electron/` dans cette livraison : aucun nouvel état de
GM-OS demandé. Demander son état avant d'y reprendre des modifications. R5–R7 est déjà poussé
dans `9e7df47a`, après R3/R4 `ef659f35` ; le registre § 141 et sa ligne 76 sont actualisés.

Le commit demandé porte uniquement sur cette fiche, ses outils, cette note et les lignes du
registre. Les changements étrangers déjà présents (note TMR-sources, autres guides, exports,
campagne Nouvelle Ys, bannière Nephilim, outil PDF-vers-MD, réglage Claude local) restent exclus.
Les hooks de commit/push habituels sont conservés. Le journal Git fait foi pour la publication.

## Manuel et fichiers locaux — demande suivante du 19/10

David demande : « met à jour les manuel, ensuite commit tout ce qu'il reste (les fichiers locaux
déjà présent) et pousse ». Les quatre guides concernés sont l'index, 53, 54 RdD et 63 ; le dernier
rappel du guide 63 est aligné sur la dernière écriture gagnante, déjà décrite dans son § 2.
Les nouvelles captures montrent la page Archétype et les champs du formulaire étendu.

Le raccord du livret ne fusionne pas son Archétype et ses colonnes d'XP avec les métadonnées
des opérations R5 : **Reporter le potentiel** reste nécessaire avant l'allocation d'XP.
Les calculs par formule ne remontent pas des saisies HTML. Les réserves restent sur la fiche ;
le module externe TMR ne reçoit pas un second jeu de compteurs.

À sa demande explicite, les fichiers locaux préexistants entrent désormais dans Git : note
TMR-sources, trois exports d'origine et pilote RdD relié avec son JSON, quinze fiches de
Nouvelle Ys, bannière Nephilim, convertisseur PDF-vers-MD et réglage Claude local. Les guides
dont seules les fins de ligne diffèrent ne portent pas de changement de contenu.
Les archives d'export contiennent uniquement manifeste et état du pilote ; aucun profil
personnel de GM-OS n'a été ouvert. Aucun paquet installé. Le journal Git indique les commits
et la publication effective ; conserver les hooks de synchronisation des guides et pré-push.

Vérifications de cette mise à jour : reconstruction réussie, validateur de fiche sans diagnostic,
capture du formulaire avec le pilote étendu réussie dans `capturesDesJeux.spec.ts` (profil jetable,
pilote isolé dans `scratch/`, données fictives), deux nouvelles images relues avant copie au manuel.
L'autotest du convertisseur PDF-vers-MD réussit sans installer Marker ni convertir de livre.
