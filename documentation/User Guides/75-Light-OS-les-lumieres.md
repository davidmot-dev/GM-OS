# 💡 Light-OS

Le module **Light OS** est votre centre de contrôle domotique dédié à l'immersion. Il intègre vos lumières **Philips Hue** directement dans votre environnement de jeu, permettant de synchroniser l'éclairage de votre pièce avec l'action, la musique et les effets sonores.

![Aperçu du module Light OS](light_mockup.png)

## 📋 Présentation du Module

Light OS transforme vos lampes connectées en véritables accessoires de jeu :

1. **Gestion des Scènes** : Une grille de 18 emplacements pour sauvegarder vos ambiances (Snapshots).
2. **Contrôle en Temps Réel** : Ajustez la luminosité, la température et la couleur de chaque lampe individuellement.
3. **Moteur d'Effets Logiciels** : Déclenchez des animations complexes (Orage, Feu de camp, Stroboscope) non disponibles nativement.
4. **Synchronisation Globale** : Le cerveau de l'OS qui fait le lien entre l'audio et le visuel.

## 🚀 Connexion au Pont (Bridge)

Avant de commencer, vous devez lier GM-OS à votre installation Philips Hue :

1. Cliquez sur le statut de connexion dans l'en-tête (indique "Disconnected").
2. Suivez les instructions : GM-OS va détecter votre Bridge sur le réseau.
3. Lorsque l'OS vous le demande, appuyez sur le bouton physique central de votre **Philips Hue Bridge**.
4. Une fois jumelé, le statut passe au vert ("Connected") et vos lampes apparaissent dans l'interface.

### 🔁 La reconnexion au démarrage, et quand elle s'arrête

Au lancement de GM-OS, si un pont a déjà été appairé, Light-OS **tente de le rejoindre tout seul**.
Vous n'avez rien à faire : dans le cas normal, le statut passe au vert en une seconde.

**Si le pont ne répond pas** — il est éteint, débranché, ou vous n'êtes pas sur le même réseau —
GM-OS réessaie **quatre fois**, en espaçant : une demi-seconde, trois secondes, quinze secondes,
puis une minute. Après quoi **il renonce et vous le dit** : *« Pont Hue injoignable (adresse) —
reconnexion abandonnée. Relance-la depuis Light-OS quand il répondra. »*

> ⭐ **Pourquoi renoncer plutôt que d'insister.** Un pont absent ne revient pas de lui-même dans la
> minute. Réessayer sans fin ne le fait pas revenir — ça occupe l'application pour rien. Et
> l'abandon est **annoncé** parce que vous devez pouvoir distinguer *« GM-OS n'a pas encore
> essayé »* de *« le pont ne répond pas »* : un abandon silencieux se lit comme une panne de GM-OS,
> alors que la panne est ailleurs.

Rien n'est perdu : **le bouton de connexion de l'en-tête n'est pas concerné par ce plafond**.
Cliquez-le quand le pont est de nouveau joignable, et la connexion repart. Poser une nouvelle
adresse relance le cycle depuis zéro.

> ⚠️ **En déplacement, c'est le cas normal.** Emporter GM-OS loin de son pont ne pose aucun
> problème : quatre tentatives, un message, puis le silence. *Avant le 2026-09-12, GM-OS appelait
> le pont indéfiniment — une tentative toutes les cinq secondes et demie, toute la soirée.*

> [!TIP]
> **Réinitialisation (Forget Bridge)** : Si vous changez de pont ou si vous souhaitez réinitialiser la détection automatique, utilisez le bouton **"Forget Bridge"** (icône 🗑️) dans la barre latérale. Cela effacera l'IP du pont et votre clé utilisateur pour repartir sur une installation propre.


## 🎭 Création et Gestion des Scènes

Le système de "Snapshots" vous permet de capturer une ambiance parfaite en quelques secondes :

- **Ajustement Manuel** : Utilisez les curseurs et sélecteurs de couleur du pied de page pour régler
  chaque lampe à votre convenance.
- **Sauvegarde** : survolez une tuile et cliquez l'**appareil photo 📷** en bas à gauche. L'état
  actuel de toutes les lampes y est mémorisé. Une tuile encore vide se capture d'un simple clic.
  La capture **va d'abord demander au pont** ce que vos lampes font vraiment — voir juste en dessous.
- **Personnalisation** : le **crayon ✏️** en bas à droite ouvre l'éditeur de la tuile — son **nom**,
  son **icône** (vingt-quatre proposées, ou n'importe quel nom de Material Symbol) et sa **couleur**.
  Cette couleur ne commande aucune lampe : elle **repère la tuile dans la grille** — son icône, sa
  bordure, son halo quand elle joue. La première pastille, « Aucune couleur », rend la tuile au gris
  par défaut.
- **Activation** : un clic gauche applique l'ambiance. La transition dure **5 secondes par
  défaut**, réglable dans les options — de l'instantané pour un combat au fondu très lent pour un
  voyage.
- **Effacement** : la croix ✕ en haut à gauche vide la tuile. Elle perd alors son nom, son icône, sa
  couleur, sa touche — et cesse d'être l'éclairage normal si elle l'était.

### 📱 Quand vous réglez vos lampes depuis votre téléphone

Light-OS tenait le compte de **ce qu'il avait lui-même envoyé** au pont. Tant que vous ne réglez vos
lampes que depuis GM-OS, les deux disent la même chose. Mais dès que vous prenez l'application Hue
sur votre téléphone — pour monter une lampe, en éteindre une, changer une teinte — l'application ne
le voit pas : le pont obéit, et personne ne le lui dit.

Deux gestes s'appuient là-dessus :

- **Capturer une tuile** va maintenant **relire le pont avant d'enregistrer**. C'est ce que son nom
  promettait depuis toujours : la tuile retient la pièce telle qu'elle est, pas telle que GM-OS la
  croyait. L'icône tourne le temps de l'aller-retour — une fraction de seconde sur le réseau local.
- **« Relire les lampes »**, à droite de la barre du haut, fait la même lecture sans rien
  enregistrer. Les **curseurs et les couleurs du pied de page** se remettent alors sur vos vraies
  lampes. C'est le bouton à cliquer quand vous revenez du téléphone et que vous voulez repartir de
  ce que vous voyez.

> ⚠️ **Deux lampes ne sont jamais relues**, et c'est voulu : celle qui **joue un effet** — sa
> brillance à cet instant est l'image d'un battement, pas un réglage, et la relire figerait une
> bougie sur le creux où la lecture est tombée — et celle que le pont dit **injoignable**, dont il ne
> répète qu'un souvenir.

> 💡 **Le curseur global est défait en chemin.** Si vous éclairez la pièce à 50 % et que votre
> téléphone pousse une lampe à fond, la tuile enregistre de quoi **reproduire ce que vous voyez** une
> fois le curseur repassé dessus. Une lampe que GM-OS avait réglée lui-même, elle, n'est pas touchée
> — *sans quoi chaque relecture l'aurait baissée d'un cran, et la scène se serait éteinte par
> étapes.*

> ⚠️ **La relecture ne se fait pas toute seule.** Le pont Hue tient une dizaine de commandes par
> seconde et les effets en consomment déjà : une interrogation permanente les ferait bégayer. C'est
> donc un geste, au moment où vous en avez besoin.

### ⌨️ Lancer une scène à la touche

Survolez une tuile et cliquez le **⌨** en haut à droite, puis pressez la touche voulue. Elle
s'affiche alors en permanence sur la tuile, et **fonctionne depuis n'importe quel écran de GM-OS** —
c'est tout l'intérêt : changer l'ambiance sans quitter vos notes.

> [!NOTE]
> **Une touche ne commande qu'une scène** : l'attribuer à une seconde tuile la retire à la première,
> sans quoi la gagnante serait tirée au hasard de l'ordre interne. **Échap** (ou un clic sur la
> tuile) annule l'apprentissage.
>
> ⚠️ **En revanche, Sound-OS et Music-OS écoutent le clavier de leur côté.** La même touche peut donc
> lancer un bruitage **et** sa lumière — un cumul souvent utile, mais qui surprend si on l'a fait sans
> le vouloir. Les touches tenues avec **Ctrl, Alt ou Cmd** ne déclenchent jamais rien, et rien ne se
> déclenche pendant que vous tapez dans un champ ou qu'une boîte est ouverte.

### 🔖 Vos tuiles, campagne par campagne

Vous aviez **dix-huit tuiles en tout**, partagées par toutes vos campagnes : les ambiances d'*Alien*
se mélangeaient à celles de *Rêves de Dragons*, et rattacher une tuile à l'une la retirait de la
grille de l'autre. On ne rangeait pas, on rétrécissait.

**Chaque campagne a désormais ses dix-huit cases**, plus un **pot commun**. La grille les montre
séparément :

| Section | Ce qu'on y trouve |
| :--- | :--- |
| **Cette campagne** | Dix-huit cases qui n'appartiennent qu'à la campagne ouverte. |
| **Communes** | Les ambiances sans étiquette — une « Taverne », un « Combat » servent partout. |
| **Campagne disparue** | Des tuiles rattachées à une campagne supprimée. Elles restent visibles pour que vous puissiez les re-rattacher ou les effacer. |

> ⭐ **Rien ne disparaît le jour de la mise à jour.** Vos dix-huit tuiles actuelles n'ont pas
> d'étiquette : elles sont donc **communes**, et vous les retrouvez dans toutes vos campagnes,
> exactement comme hier. Il n'y a aucune migration à subir.

#### Rattacher une tuile

Ouvrez l'éditeur d'une tuile (le **crayon ✏️**) : la ligne **« Cette tuile appartient à »** propose
*Toutes* ou *Cette campagne*.

> ⚠️ **Capturer ne rattache pas.** Une tuile capturée reste commune. C'est voulu : la plupart des
> ambiances servent dans plusieurs campagnes, et le rattachement est un geste, pas une conséquence.

> ℹ️ **Dix-huit est un plancher, pas un plafond.** Si vous rattachez une tuile commune à votre
> campagne, son râtelier en compte dix-neuf — on ne vous en retire pas une — et le pot commun se
> recomplète à la prochaine ouverture de Light-OS.

**Quatre choses suivent le réglage, et c'est le but :**
- la **grille** de Light-OS ;
- les listes des autres modules — lier une pastille de Sound-OS, de Music-OS ou une piste
  d'Ambient-OS à une lumière, une **zone de danger** de Map-OS, un **moment de storyboard** ;
- le **clavier**. Deux campagnes peuvent donner la même touche à leur ambiance d'ouverture sans se
  marcher dessus — *et une campagne peut redéfinir une touche commune.*

> ✨ **Votre éclairage normal reste toujours modifiable**, même s'il appartient à une autre
> campagne : il commande vos lampes, donc il doit rester sous vos yeux dans la barre de gauche.

> ℹ️ **Effacer une tuile (la croix ✕) lui laisse son rattachement.** Elle perd son nom, son
> état et sa touche, mais la case reste celle de sa campagne — prête à recevoir une nouvelle
> capture.

## 🪄 Les effets — le catalogue complet

GM-OS embarque **48 effets** jouables sur n'importe quelle lampe, plus vos propres ambiances. Ils se
choisissent dans le menu déroulant sous chaque lampe, au pied de l'écran, et se rangent dans une tuile
comme le reste.

Chaque effet est un **rythme** : une courbe de brillance, une ou deux teintes, une cadence. Ce qui les
distingue n'est pas la couleur — c'est ce que la lumière *fait*.

> [!NOTE]
> **La couleur que vous posez sur une lampe ne change qu'onze de ces effets.** Les autres écrivent
> leur palette eux-mêmes : une torche est orange, un gyrophare est rouge et bleu, et le sélecteur de
> couleur n'y peut rien. Pour recolorer n'importe lequel des 48, il faut en faire une **ambiance** —
> voir la section suivante.

---

### 🏙️ Urbain & Tech

| Effet | Ce qu'il fait dans la pièce |
| --- | --- |
| **Lumières de la ville** | Un ambre de lampadaire, constant, que traverse de temps à autre le passage bref d'un phare. |
| **Terminal Retro** | Le vert d'un écran cathodique, qui vibre en continu, très vite. |
| **Cyberpunk Night** | Magenta et cyan qui se remplacent sèchement — une enseigne, pas une transition. |
| **Néon Défectueux** | De longues secondes allumées, puis un grésillement court. C'est l'irrégularité qui fait le tube fatigué. |
| **Stroboscope** | Blanc, plein, dix fois par seconde. À employer par salves : c'est le plus agressif du catalogue. |
| **Police** | Rouge et bleu alternés, sans fondu. Le fondu tuerait le gyrophare — on ne verrait que du violet. |
| **Sirène lointaine** | Le même rouge, mais qui monte et redescend lentement : le véhicule est dehors, pas dans la pièce. |
| **Panne de courant** | Quatre battements hésitants, l'obscurité, puis le retour. Un cycle complet dure une quinzaine de secondes. |
| **Chute de tension** | La lumière s'affaisse par paliers sur dix secondes, du blanc franc vers un jaune moribond. |

### 🌲 Nature & Éléments

| Effet | Ce qu'il fait dans la pièce |
| --- | --- |
| **Forêt d'Émeraude** | Un vert profond qui respire, avec de brèves éclaircies — le soleil entre deux branches. |
| **Aurore Boréale** | Vert, cyan et violet qui se fondent l'un dans l'autre sur cinq secondes. Lent, jamais brusque. |
| **Crépuscule** | Une descente de dix secondes par palier, de l'ambre vers le bleu de la nuit. |
| **Sous-marin** | Une ondulation lente autour de la couleur que vous avez posée. ⭐ **Recolorable.** |
| **Abysses** | Le même mouvement, mais très sombre et très bleu : la lumière vient d'en haut, de loin. |
| **Lever de Soleil** | Une **progression** de cinq minutes : rouge profond, orange, or, blanc chaud, en montant en intensité. Elle va quelque part. |
| **Aube dorée** | Un or chaud **tenu**, qui respire sur cinquante secondes. Elle ne va nulle part : c'est le matin déjà installé. |
| **Stores** | ⚠️ **À poser sur deux ou trois lampes.** Chacune se place à un endroit différent du motif — l'une dans une bande claire, l'autre dans l'ombre — et le motif dérive lentement. *Sur une seule lampe, ce n'est qu'une pulsation.* |
| **Orage** | Le noir presque complet, déchiré par des flashs blancs imprévisibles. |

### ⚔️ Fantastique & Magie

| Effet | Ce qu'il fait dans la pièce |
| --- | --- |
| **Bougie** | Une petite flamme : faible, nerveuse, sur une plage de brillance basse. Elle n'éclaire pas la pièce — c'est ce qui en fait une bougie. |
| **Feu de camp** | Plus large et plus lent que la bougie, avec des bourrasques qui font monter la flamme. |
| **Incendie** | La même famille, poussée au maximum : violent, clair, et il se ralentit tout seul quand plusieurs lampes le jouent. |
| **Torche qui faiblit** | Un orange qui décline puis se reprend — la torche qu'on ranime en la secouant. |
| **Lave Fusion** | Rouge sombre et orange qui roulent lentement l'un dans l'autre. |
| **Arcanique** | Une respiration ample et intense autour de votre couleur, avec de légères dérives de teinte. ⭐ **Recolorable.** |
| **Souffle de Dragon** | Des montées brusques suivies de retombées : ça respire fort, pas régulièrement. |
| **Aura Sacrée** | Une pulsation régulière et lumineuse, très peu de variation de teinte. Solennel. ⭐ **Recolorable.** |
| **Spectre / Fantôme** | Une lueur pâle qui apparaît et s'efface sans jamais s'éteindre tout à fait. |

### 🚀 Espace & SF

| Effet | Ce qu'il fait dans la pièce |
| --- | --- |
| **Le Néant** | Un violet presque éteint, immobile — et de rares étincelles blanches. L'attente, pas l'action. |
| **Trou Noir** | Une lumière qui s'étire et s'effondre, en cycles lents. |
| **Hyper-vitesse** | Des traits blancs et bleus à dix par seconde : le défilement, pas la destination. |
| **Cœur de Réacteur** | Une pulsation bleue rapide et régulière, comme une machine en charge. |
| **Sonar** | Un ping cyan bref, puis près de quatre secondes de silence sombre. C'est l'attente qui fait le sonar. |
| **Passerelle Stellaire** | Un bleu calme qui monte et descend doucement — l'éclairage de service d'un vaisseau. |
| **Ruche Alien** | Violet et orange qui alternent très lentement. Organique, jamais mécanique. |
| **Saut Spatial** | Une accélération de traits qui se resserrent. Fait pour être lancé, pas laissé tourner. |

### 🚨 Alertes & Danger

| Effet | Ce qu'il fait dans la pièce |
| --- | --- |
| **Alerte Rouge** | Rouge qui pulse deux fois par seconde. Lisible de loin, tenable longtemps. |
| **Fusillade** | Des rafales d'éclairs blancs séparées par des silences. ⭐ **Chaque lampe a sa propre rafale** : à plusieurs, elles se décalent et le tir se croise. Elle compte le budget du pont et allonge ses pauses quand vous en ajoutez. |
| **Explosion** | ⚡ **Coup unique.** Un flash, une retombée, et **la lampe reste éteinte** — c'est le seul effet du catalogue qui laisse la pièce dans le noir. Il faut un geste pour la ranimer. |
| **Impact** | ⚡ **Coup unique.** Une secousse brève, puis la lampe **retrouve la couleur de sa scène**. |
| **Battement de Cœur** | Deux coups rapprochés, puis une pause. Le rythme cardiaque, pas une pulsation régulière. |
| **Radiation** | Des crépitements verts irréguliers, comme un compteur qui s'affole par à-coups. |
| **Nuage Toxique** | Un vert malsain qui ondule lentement. Plus lourd que Radiation, moins nerveux. |
| **Glitch** | Des ruptures brutales et imprévisibles de brillance et de teinte. |
| **Télévision CRT** | Le scintillement bleuté d'un écran dans une pièce sombre. |

### ⚙️ Divers

| Effet | Ce qu'il fait dans la pièce |
| --- | --- |
| **Disco Party** | Douze couleurs saturées qui se remplacent trois fois par seconde. |
| **Lampe Torche** | Un faisceau blanc qui vacille : la pile faiblit. |
| **Respiration** | Une montée et une descente régulières autour de votre couleur. Le plus neutre du catalogue. ⭐ **Recolorable.** |
| **Méditation Zen** | Un blanc très doux qui enfle et retombe, plus lentement encore que Respiration. |

---

### ⚡ Les deux coups uniques

**Explosion** et **Impact** ne tournent pas en boucle : ils arrivent une fois et retombent. Ils sont
faits pour une ponctuation — le piège qui se déclenche, le sort qui part — pas pour une ambiance.

⚠️ **Explosion est le seul effet qui laisse une lampe éteinte.** C'est voulu : une explosion qui se
rallume toute seule n'est pas une explosion. Mais il faudra rallumer la lampe, ou relancer une scène.

### 🔢 Pourquoi certains effets ne jouent que sur une ou deux lampes

Le pont Hue accepte environ **dix commandes par seconde, toutes lampes confondues**. Sept effets
battent assez vite pour dépasser ce budget à quatre lampes : *Hyper-vitesse, Stroboscope, Terminal,
Cyberpunk Night, Cœur de Réacteur, Télévision CRT, Saut Spatial*.

Plutôt que de tout ralentir — *un stroboscope ralenti cesse d'être un stroboscope* — GM-OS en fait
jouer **moins, à la bonne vitesse**. Les lampes en trop s'arrêtent et **retrouvent la couleur de leur
scène** : elles ne s'éteignent pas, elles cessent de battre.

> [!NOTE]
> **Fusillade et Incendie échappent à cette règle**, et c'est délibéré : ils se rationnent eux-mêmes
> en allongeant leurs pauses selon le nombre de lampes. *Il n'y a pas de tir croisé à une lampe.*

---

### ⏱️ Régler la vitesse d'un effet

Chaque tuile qui contient au moins un effet porte un **curseur de vitesse**, sous son nom. Il va de
**×0,25 à ×3**, par quarts, et **×1** est la vitesse d'origine de l'effet.

- **Vers la droite, tout s'accélère** : la bougie qui scintillait toutes les 250 ms scintille deux
  fois plus vite en ×2, l'orage frappe plus souvent, le cœur bat plus fort.
- **Vers la gauche, tout s'étire** : un crépuscule réglé sur ×0,25 met quarante secondes entre deux
  changements de teinte au lieu de dix — de quoi tenir une scène entière.
- **Le chiffre affiché est un bouton** : un clic dessus revient à ×1.

Le réglage **agit immédiatement** si la scène est en cours : pas besoin de la relancer. Il appartient
à la tuile, il est retenu avec elle, et il repart dans la sauvegarde automatique.

> [!TIP]
> **Deux tuiles, deux vitesses.** Rien ne vous oblige à ranger un effet une seule fois : capturez la
> même ambiance dans deux tuiles, l'une en ×0,5 pour l'attente, l'autre en ×2 pour l'assaut. Vous
> changez de rythme d'un clic, sans toucher aux lampes.

> [!NOTE]
> **Le curseur n'apparaît que là où il a prise.** Une scène sans effet n'a rien à accélérer — elle
> n'affiche donc pas de curseur, comme elle n'affiche pas l'étoile ✨.
>
> Deux limites voulues : un effet choisi **à la main** dans le pied de page (sous une lampe précise)
> garde sa cadence d'origine, car il n'appartient à aucune tuile ; et même poussé à ×3, un effet ne
> descend jamais sous **un dixième de seconde** entre deux commandes — au-delà, le pont Hue sature et
> la lumière prend du retard sur ce que vous faites.
>
> ⚠️ **À ne pas confondre avec le *Temps de transition*** de la barre du haut : celui-ci règle le
> **fondu d'une scène à l'autre**, le curseur règle la **vitesse de l'animation** une fois la scène
> installée.

## 🔎 Choisir un effet — l'écran volant

Sous chaque lampe, un bouton porte le **nom de l'effet en cours**. Un clic ouvre l'écran de choix, qui
occupe le centre de l'application :

- **Une recherche en tête.** Tapez « feu », « bleu », « aurore boreale » — *les accents et les
  majuscules n'ont pas d'importance*. L'identifiant technique du guide fonctionne aussi :
  `aube-doree` trouve Aube dorée.
- **Vos ambiances d'abord**, chacune avec l'effet dont elle descend, et une corbeille pour l'oublier.
- **Les six catégories** en pastilles, l'effet en cours mis en évidence.
- **Une palette sur chaque effet** : elle en fait une ambiance, **sans fermer l'écran ni changer ce
  que la lampe joue**. Vous pouvez en préparer trois d'affilée, puis choisir.

**Échap ferme l'écran.** Dans le champ de recherche, Échap vide d'abord la recherche — il faut une
seconde frappe pour fermer.

> [!NOTE]
> **Ce module a longtemps eu une liste déroulante**, et elle a été retirée le 2026-09-18. Avec les
> 48 effets et les ambiances du meneur, elle dépassait la cinquantaine d'entrées. *Une liste
> déroulante de cinquante entrées n'est plus une liste, c'est un couloir* — on y descend, on dépasse
> ce qu'on cherchait, on remonte, et rien ne s'y cherche.

---

## 🎨 Mes ambiances — copier un effet et le faire vôtre

Une **ambiance** est une copie d'un effet du catalogue, avec votre nom, votre teinte et votre rythme.
L'effet d'origine n'est jamais modifié.

**Pour en créer une** : ouvrez l'écran de choix et cliquez la **palette** à droite de n'importe quel
effet. Elle apparaît aussitôt en tête de l'écran, sous « Mes ambiances ».

**Pour la régler** : posez-la sur une lampe. L'éditeur s'ouvre alors sous cette lampe, et vous réglez
pendant que la pièce change.

| Réglage | Ce qu'il fait |
| --- | --- |
| **Le nom** | Il s'écrit directement, et c'est lui qui apparaîtra partout. |
| **La teinte** | Un sélecteur de couleur. Toute la palette de l'effet est **tirée** vers cette couleur. |
| **La force** | De 0 à 100 %. À 0, la couleur d'origine est intacte ; à 100 %, tout devient la même teinte. |
| **La vitesse** | De ×0,25 à ×3. Elle se **multiplie** avec celle de la tuile, elle ne la remplace pas. |

Vos ambiances sont retenues avec le reste de vos réglages et repartent dans la sauvegarde automatique.
Elles se capturent dans une tuile comme n'importe quel effet.

> [!TIP]
> **Chercher l'effet d'origine ramène ses copies.** Tapez « torche » et vous obtenez *Torche qui
> faiblit* **et** la « Bleue de nuit » que vous en avez tirée — même si son nom ne contient pas le mot
> « torche ». *Sans ça, une copie se perdrait derrière le nom qu'on lui a donné.*

> [!TIP]
> **La force par défaut est à 70 %, et ce n'est pas de la timidité.** À 100 %, un gyrophare devient
> monochrome — et un gyrophare monochrome n'est plus un gyrophare. Ce qui fait un effet, ce n'est pas
> sa teinte : c'est le **rapport** entre ses teintes et son rythme. À 70 %, Police viré au vert garde
> son battement à deux temps, décalé dans une autre famille de couleurs.
>
> Poussez à 100 % quand vous voulez justement aplatir : une pulsation d'une seule couleur.

> [!NOTE]
> **Une ambiance descend toujours d'un effet réel**, et l'écran rappelle lequel. On ne duplique pas
> une ambiance : une copie de copie ne dirait plus de quoi elle descend.
>
> Si l'effet d'origine venait à disparaître d'une version à l'autre, la lampe **retrouve la couleur de
> sa scène** au lieu de battre dans le vide, et la console le dit.

> [!WARNING]
> **La teinte d'une ambiance agit sur les 48 effets, y compris les 36 qui écrivent leur palette.**
> C'est toute la raison d'être des ambiances : le sélecteur de couleur d'une lampe, lui, ne touche que
> les onze effets recolorables du catalogue.


## 🛠️ L'atelier — fabriquer un effet qui n'existe pas

« Mes ambiances » **décline** un des 48 : la torche, mais bleue et plus lente. L'atelier, lui,
**invente**. Un orage lointain — deux éclairs blancs rapprochés, puis vingt secondes de bleu
sombre — n'est la déclinaison d'aucun effet existant.

**Pour en créer un** : ouvrez l'écran de choix d'un effet, section **Mes effets**, bouton
**« Créer un effet »**. L'atelier s'ouvre par-dessus.

### Ce qu'est un effet, ici

Une lampe Hue ne sait qu'une chose : *va à cette couleur et à cette brillance, en tant de temps*.
Tout le catalogue n'est que des façons d'enchaîner cet ordre-là. Un effet d'atelier est donc une
**suite d'étapes**, jouée en boucle, et chaque étape porte quatre nombres :

| Réglage | Ce qu'il fait |
| :--- | :--- |
| **La couleur** | où la lampe va. |
| **La luminosité** | en pourcentage. **À 0 %, la lampe s'éteint** pour la durée de l'étape — c'est ainsi qu'on fait un clignotement franc. |
| **La durée** | le temps passé sur cette étape, fondu compris. |
| **Le fondu** | le temps mis pour y arriver. **Zéro change d'un coup** ; égal à la durée, la lampe glisse sans jamais s'arrêter. |

Les étapes se montent, se descendent et se suppriment. Il en reste toujours au moins une.

### ✨ Demander la suite à l'IA

En haut de l'atelier, un champ : **décrivez l'effet que vous cherchez** — *« un orage lointain »*,
*« une forge »*, *« la respiration d'un vaisseau endormi »*. L'IA écrit la suite d'étapes, avec
son désordre et une phrase qui dit ce qu'on verra dans la pièce.

> ⛔ **Rien n'est remplacé tant que vous n'avez pas dit oui.** La proposition s'affiche en
> aperçu, sous le champ, avec sa propre bande de couleurs. Trois réponses : **Remplacer les
> étapes**, **Une autre**, **Refuser**. *L'atelier enregistre en continu et n'a pas
> d'annulation — écraser d'office effacerait votre travail sans retour.*

**Ce que « Remplacer les étapes » fait** : la suite et le désordre prennent la place des vôtres.
Le **nom** n'est repris que si vous n'avez pas encore baptisé l'effet — *on ne renomme pas ce que
vous avez nommé.*

> [!TIP]
> **Dites le geste, pas la couleur.** « Un orage lointain » donne un meilleur résultat que
> « du bleu qui clignote » : ce qu'on reconnaît d'un orage, c'est le contraste entre l'éclair et
> l'attente, pas la teinte du ciel. Le modèle a reçu cette règle, autant lui parler dans les
> mêmes termes.

> [!NOTE]
> **La proposition passe par un contrôle avant d'arriver à l'écran.** Une étape dont la couleur
> n'est pas un hexadécimal est **jetée** ; une durée sous 100 ms est remontée ; un fondu plus long
> que son étape est ramené. Si tout est illisible, l'écran vous le dit au lieu de montrer une
> bande vide. *Un modèle qui invente ne lève aucune erreur — il rend des nombres plausibles et
> faux.*

> ⚠️ **Il faut un moteur d'IA actif**, celui que vous avez choisi dans le Cortex — et sa clé,
> pour ceux qui en demandent une. Sans lui, le bouton le dit et ne propose rien.
>
> ⭐ **Et le moteur change la fiabilité de la forme, pas la qualité de l'idée.** Avec **Ollama**,
> la forme de la réponse est *contrainte* : GM-OS impose la grammaire au décodeur. Avec les
> autres, elle est seulement *demandée* dans l'invite — et *une consigne s'ignore*. Vous verrez
> donc plus souvent, ailleurs, une proposition amputée de quelques étapes ou un
> « L'IA n'a pas répondu ». → [Le Cortex](./82-Cortex-OS.md)

### ⭐ Le désordre, et pourquoi c'est le réglage qui fait le plus

Un curseur unique, en bas. Il tire au sort, à chaque passage, un écart sur la **luminosité** et
sur la **durée** de l'étape.

> [!TIP]
> **Une bougie sans désordre est un métronome ; à 30 %, c'est une flamme.** Les quarante-huit
> effets du catalogue tirent tous au sort quelque part — aucun n'est une boucle pure. Si votre
> effet « fait machine », c'est presque toujours ce curseur qu'il lui manque.

### Régler pendant que ça joue

En bas de l'atelier, un bouton par lampe : **Essayer sur**. La lampe joue l'effet, et **chaque
retouche se voit au passage suivant** — le moteur relit votre effet à chaque tour.

> [!NOTE]
> **Tout est enregistré au fur et à mesure** : il n'y a pas de bouton « Valider ». Fermer
> l'atelier **rend la lampe** à ce qu'elle montrait.

> [!WARNING]
> **Une étape ne descend pas sous 100 ms**, et ce n'est pas de l'esthétique : le pont Hue tient une
> dizaine de commandes par seconde, **toutes lampes confondues**. Si vous posez votre effet sur six
> lampes, GM-OS **ralentit** la cadence pour tenir le budget — il préfère ralentir que d'en
> éteindre : *une lampe qui ne joue pas ne s'explique pas.*

> [!TIP]
> **Vos effets se capturent dans une tuile** comme n'importe quel effet du catalogue, et ils partent
> dans la sauvegarde automatique. *Une suite de huit étapes ne se retrouve pas de mémoire.*

## 🏠 L'éclairage normal de la pièce

Votre lumière de jeu est aussi celle sous laquelle on lit ses notes et on sert à boire. **Désignez la
scène qui est votre éclairage normal**, et c'est vers elle que la pièce revient quand quelque chose
s'arrête — au lieu de tomber dans le noir.

Deux façons de la désigner, au choix :

- **L'icône 🏠 sur une tuile** : elle apparaît au survol, un clic désigne la tuile, un second la
  libère. La tuile désignée garde sa maison affichée en permanence.
- **Le bloc « Éclairage normal »** de la barre latérale, juste au-dessus du bouton d'extinction : la
  liste de vos scènes capturées, et « Aucun ».

### Ce que ça change, geste par geste

| Geste | Sans éclairage normal | Avec |
| :--- | :--- | :--- |
| **Un son, une piste, une musique se termine** | retour à la dernière scène que vous avez cliquée — et **noir** si vous n'en avez cliqué aucune | retour à votre éclairage normal |
| **Stop All** (barre du haut) | tout au noir | retour à votre éclairage normal |
| **Extinction d'urgence** (bouton rouge de Light-OS) | tout au noir | **tout au noir** — inchangé |
| **« Revenir » après un essai d'ambiance** (dans la trame) | la pièce **exactement comme elle était** | la pièce exactement comme elle était |

> [!IMPORTANT]
> **Le défaut que cela répare.** Si vous n'aviez cliqué aucune scène depuis le lancement, la fin du
> premier bruitage éteignait votre pièce — en pleine partie, sans que vous ayez rien demandé.
> Désigner un éclairage normal ferme ce trou ; ne rien désigner laisse le comportement d'avant,
> à l'identique.

> [!NOTE]
> **Le Stop All ne repasse pas par la dernière scène jouée.** Il vise votre éclairage normal
> directement : *on ne veut pas retomber sur la scène d'alerte qui jouait il y a trois secondes.* Les
> retours automatiques, eux, préfèrent ce que vous aviez choisi à la main — l'éclairage normal n'est
> leur recours que si vous n'avez rien choisi.
>
> **Le bouton rouge reste une vraie extinction**, pour finir la soirée ou pour le noir complet : sinon
> plus aucune porte ne mènerait au noir tant qu'un éclairage normal serait désigné.
>
> Seules les scènes **capturées** peuvent être désignées, et **effacer la tuile désignée retire la
> désignation** — un repli qui vise une tuile vide ne ferait rien, en silence.

> [!NOTE]
> **Le retour d'un essai ne vise aucune scène**, et c'est pour cela qu'il est à part. Vous essayez
> une ambiance en **préparant** une séance : la pièce est allumée, personne ne joue encore. Les
> trois autres gestes vous auraient laissé dans le noir, puisqu'aucune scène n'a été cliquée.
> « Revenir » repose ce que vos lampes montraient — ou rejoue la scène qui tournait, effets
> compris. → [La trame](./11-Trame-actes-et-scenes.md)

## 🔄 Synchronisation Multi-Modules (Sync Mode)

C'est ici que GM-OS révèle toute sa puissance. Si le bouton **Sync** est activé :

- **Music OS** : Lancer une musique "Combat" peut automatiquement passer l'éclairage en rouge.
- **Sound OS** : Déclencher un effet sonore de "Tonnerre" lancera instantanément un flash orageux dans votre pièce.
- **Intelligence de Retour** : Lorsque l'effet sonore ou la musique s'arrête, Light OS est capable de rétablir automatiquement l'ambiance manuelle précédente, évitant que vos joueurs ne restent dans le noir après une action héroïque.

---

## ⚙️ Configuration Avancée

- **Luminosité Globale (Master)** : Un curseur général pour atténuer toute votre installation sans modifier les réglages de chaque scène.
- **Transition Time** : Réglez la vitesse à laquelle les scènes changent (de l'instantané pour les combats au fondu très lent pour les scènes de voyage).
- **Synchro des modules** : l'interrupteur qui décide si les sons, musiques et ambiances ont le droit
  de commander vos lampes. Allumé par défaut.
- **Key Learn** : associez une touche à vos scènes préférées pour les changer sans quitter vos notes
  — voir « Lancer une scène à la touche » plus haut.

---

> [!WARNING]
> En mode **Synchro**, les commandes envoyées par les modules audio sont prioritaires. Pour garder le
> contrôle manuel absolu, coupez l'interrupteur **Synchro des modules**, dans la barre du haut de
> Light-OS.
>
> ⚠️ **Ne le confondez pas avec son voisin, « Mode simulé »** — celui-là *débranche votre pont Hue*
> et simule quatre lampes, pour préparer une ambiance sans matériel. Il s'appelait « Synchro
> Simulée » jusqu'au 2026-09-07, et un meneur qui suivait ce guide coupait donc son pont en croyant
> couper la synchro.

---

## 💡 Qui d'autre commande vos lampes

Light-OS n'est pas le seul à parler à votre pont. **Cinq modules** peuvent appliquer une scène, et
c'est utile de savoir lequel a agi quand la lumière change sans qu'on ait rien touché :

| Module | Quand |
| :--- | :--- |
| **Sound-OS** | Un pad peut porter une scène, jouée avec le son |
| **Music-OS** | Un pad de musique, de même |
| **Ambient-OS** | Une piste d'ambiance ; à son arrêt, la lumière **revient** à une autre piste allumée |
| **Map-OS** | Une **zone de danger** où un pion entre |
| **Le Storyboard** | Une séquence, parmi ses six éléments |

⚠️ **Le Stop All de la barre du haut agit sur vos lampes** — ce n'est pas qu'un bouton audio. Il les
éteint, ou les ramène à votre **éclairage normal** si vous en avez désigné un (voir plus haut).
→ [Tour de contrôle audio](./70-Tour-de-controle-audio.md)

---

*Repris le 2026-09-07 au soir, sur deux retours de David à l'écran : la **couleur d'une tuile ne se
voyait nulle part** (elle n'était lue que sur la scène en cours de lecture, et la teinte par défaut
était invisible sur le fond sombre), et l'**étoile ✨ se télescopait avec l'icône de la scène** — elle
est descendue dans la ligne de vitesse. **Les deux corrections ont été vérifiées à l'écran le soir
même.***

*Corrigé le 2026-09-07 — **trois promesses que rien ne tenait**, trouvées dans le code : le bouton
**Sync** n'existait pas (et son voisin « Synchro Simulée » débranchait le pont), le **Key Learn**
n'avait aucun code derrière, et seul le **nom** d'une tuile pouvait changer — jamais son icône ni sa
couleur. Les trois sont désormais vraies. Corrigé aussi : la capture se fait par un appareil photo et
non une disquette, et l'éditeur s'ouvre au crayon, pas au clic droit.*

*Complété le 2026-09-07 : le **curseur de vitesse** de chaque tuile (×0,25 à ×3), ce qu'il ne
touche pas, et la différence avec le temps de transition. Puis l'**éclairage normal de la pièce** —
les deux façons de le désigner, ce qu'il change pour les trois gestes de retour, et le défaut qu'il
répare (la pièce s'éteignait à la fin du premier bruitage d'une soirée). **Les deux ont été
éprouvés sur les lampes de la table le jour même.***

*Élargi le 2026-09-18, en deux temps. Le soir : **l'écran volant** remplace la liste déroulante —
elle dépassait la cinquantaine d'entrées une fois les ambiances ajoutées, et *rien ne s'y cherchait*.
⚠️ **Cette page décrivait déjà l'ancien écran une heure après sa mise en service** : la section a été
réécrite le même soir. *Un guide écrit en même temps que le code vieillit à la vitesse du code.*

*Élargi le 2026-09-18 : **le catalogue complet des 48 effets**, un par un, avec ce que chacun fait
dans la pièce — les descriptions sont dérivées du moteur, pas des noms. Ajoutés au même moment : les
deux **coups uniques** et le seul qui laisse la pièce dans le noir, la raison pour laquelle sept
effets ne jouent que sur une ou deux lampes (le pont tient dix commandes par seconde), et
**« Mes ambiances »** — dupliquer un effet, le reteinter, le re-rythmer. ⚠️ Deux effets sont neufs de
ce jour, **Aube dorée** et **Stores** ; le second n'a de sens que sur deux ou trois lampes.*

*Guide révisé le 2026-09-04, code à l'appui. Précisé : **trente-neuf effets** — ils sont 48
aujourd'hui — là où la page en
citait quatre avant un « etc. » — et *Grisaille* n'en fait pas partie. Ajouté : la liste des **cinq
modules** qui peuvent commander vos lampes sans passer par Light-OS, et le fait que le **Stop All
les éteint**. Les 18 scènes, l'appairage du pont et la transition de 5 secondes par défaut sont
exacts.*

*Élargi le 2026-09-19, sur une demande de David : **« je règle aussi parfois les lumières depuis mon
téléphone »**. Le miroir des lampes ne connaissait que ce que GM-OS avait envoyé — capturer une tuile
après un réglage au téléphone enregistrait donc une ambiance que plus personne ne voyait, **et rien
ne le disait**. La capture relit désormais le pont, et le bouton **« Relire les lampes »** fait la
même lecture pour le pied de page. ⚠️ Jamais éprouvé à l'écran à cette date.*

*Élargi le 2026-09-19 : **les tuiles peuvent appartenir à une campagne**, sur le modèle des
atmosphères de Music-OS — *étiquette, pas cloison*. Sans étiquette, une tuile est commune : rien ne
change tant que vous ne rattachez rien, et il n'y a aucune migration. ⚠️ Le réglage suit jusqu'au
**clavier**, qui était le dernier chemin non cloisonné de Music-OS en août. Deux exceptions
délibérées : une case **vide** reste toujours visible (c'est là qu'on capture) et l'**éclairage
normal** reste toujours modifiable. ⚠️ Jamais éprouvé à l'écran à cette date.*

*Élargi le 2026-09-19, seconde fois du jour : **chaque campagne a ses dix-huit cases**, et le pot
commun garde les vôtres. ⚠️ Deux règles posées le matin même se sont **inversées** en cours de
route, et c'est normal : quand les cases étaient partagées, effacer une tuile devait la rendre au
pot commun et une case vide devait rester visible partout — deux protections contre un râtelier qui
rétrécit. Le râtelier ne rétrécit plus, donc les deux protections sont devenues des gênes. *Une
règle juste peut s'inverser quand ce qu'elle protégeait change de forme.* ⚠️ Jamais éprouvé à
l'écran à cette date.*
