# Torg — états de référence et restauration locale

Ces repères sont une annexe, **pas un import d’états**. Une seule campagne ; ne pas utiliser Nexus Remplacer pour réinitialiser un atelier. Les gestes de fin de scène/combat/Acte agissent sur les paquets du jeu : ils ne sont pas une restauration générale d’un atelier.

## PJ de recette

Ouvrir Trame > ATELIERS DE RECETTE — hors fiction, puis le personnage nommé. Les principaux restent hors des scènes d’atelier. Les valeurs ci-dessous sont choisies pour les cas, sans création novice réglementaire revendiquée.

| Code et ID | Valeurs de départ |
| --- | --- |
| [RECETTE] JET / recette-torg-aube-pj-jet | dexterite=9 ; esquive=2 ; esprit=9 ; raison=10 ; realite=3 ; blessures=1 ; choc=0 ; possibilites=3 ; torg_etats_ko=false ; torg_etats_deconnecte=false |
| [RECETTE] ATOUT / recette-torg-aube-pj-atout | dexterite=9 ; esprit=9 ; raison=10 ; sciences_humaines=3 ; alteration=2 ; realite=3 ; intimidation=3 ; blessures=0 ; choc=3 ; possibilites=3 ; torg_etats_ko=false ; torg_etats_deconnecte=false ; torg_atouts_aspectEffrayant=true ; torg_atouts_occultiste=true ; torg_atouts_ingenieux=true ; torg_atouts_populaire=true ; torg_atouts_chefNaturel=true ; torg_atouts_conscienceEnvironnementale=true |
| [RECETTE] SANTE / recette-torg-aube-pj-sante | esprit=9 ; realite=3 ; resistance=10 ; blessures=1 ; choc=8 ; possibilites=1 ; torg_etats_ko=false ; torg_etats_deconnecte=false |
| [RECETTE] ZERO / recette-torg-aube-pj-zero | esprit=9 ; resistance=10 ; blessures=3 ; choc=9 ; possibilites=0 ; torg_etats_ko=true ; torg_etats_deconnecte=false |
| [RECETTE] DECO / recette-torg-aube-pj-deco | esprit=9 ; raison=10 ; resistance=10 ; blessures=0 ; choc=0 ; possibilites=3 ; torg_etats_ko=false ; torg_etats_deconnecte=true ; torg_atouts_ingenieux=true |
| [RECETTE] NU / recette-torg-aube-pj-nu | esprit=9 ; resistance=10 ; blessures=0 ; choc=0 ; possibilites=3 ; torg_etats_ko=false ; torg_etats_deconnecte=false ; atouts=Le mot Ingénieux est un texte témoin, aucun Atout possédé. |

## Refaire un cas

1. Noter les champs réellement modifiés et l’atelier courant. Sur le formulaire du **PJ de recette**, ressaisir seulement les valeurs concernées du tableau et Sauvegarder. Pour SANTE : Choc 8, Blessures 1, Possibilités 1, KO et Déconnecté faux. Pour ATOUT : Possibilités 3, Choc 3, Blessures 0, six Atouts cochés, KO et Déconnecté faux.
2. Les cases de santé suivent le champ Blessures. Si Combat-OS possède encore un exemplaire autonome de recette, le retirer et recharger uniquement sa rencontre préparée ; ne pas effacer un combat de fiction. Les acteurs liés à un PJ lisent sa fiche.
3. Pour les cartes, noter les porteurs et les cartes, rendre ou déplacer seulement celles de l’exercice dans Deck-OS. Un usage par scène/Acte déjà consommé demande le vrai geste de fin correspondant, après accord du MJ et hors fiction. Il n’existe pas de bouton « reset atelier ». Si d’autres personnes jouent avec le même paquet, différer ce cas plutôt que remélanger leurs mains.
4. Ne pas changer une scène de fiction pour essayer une Loi : ouvrir l’atelier COSMS, régler explicitement son cosm, puis remettre Pan-Pacifica. Le choix du cosm ne restaure pas la santé.
5. Vérifier après rechargement la note narrative témoin et XP 17 du PJ principal Salomé ; ils ne doivent pas être modifiés par la restauration de SANTE. Le parcours Electron prouve cette remise en état locale, distincte d’un réimport de campagne.

## Principaux et fiches

Salomé, Ilyan et Mei sont les PJ de l’histoire (p-1, p-2, p-3). Leurs valeurs de départ sont dans PERSONNAGES.md et le fichier JSON de la campagne ; ne pas les rétablir par habitude après une séance. Les Atouts officiels des principaux sont à choisir avec le livre avant une création réglementaire ; les porteurs artificiels d’atelier ne les remplacent pas. Le champ libre Atouts n’active aucune possession.
