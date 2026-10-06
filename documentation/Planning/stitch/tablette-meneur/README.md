# Tablette du meneur — maquettes retenues

**David, le 06/10/2026 : « ok c'est bon pour moi, est-ce que t3 est fini ? ».** Son accord est
consigné pour l’ensemble présenté en T3, dont les huit écrans M1/M2. **T3 est terminé.**
La [galerie corrigée](../../tablettes/T3-meneur-propositions/index.html) guide l’intégration T4.

| Lot | Écran | Téléphone | Paysage |
| --- | --- | --- | --- |
| M1 | Pads | [HTML](pads-telephone.html) | [HTML](pads-paysage.html) |
| M1 | Dés | [HTML](des-telephone.html) | [HTML](des-paysage.html) |
| M1 | Combat | [HTML](combat-telephone.html) | [HTML](combat-paysage.html) |
| M2 | Sons | [HTML](sons-telephone.html) | [HTML](sons-paysage.html) |
| M2 | Scénario | [HTML](scenario-telephone.html) | [HTML](scenario-paysage.html) |
| M2 | Tableau | [HTML](tableau-telephone.html) | [HTML](tableau-paysage.html) |
| M2 | Notes | [HTML](notes-telephone.html) | [HTML](notes-paysage.html) |
| M2 | Messages | [HTML](messages-telephone.html) | [HTML](messages-paysage.html) |

Les huit écrans comprennent la ligne d’état et « Couper le son ». Les six vues des Notes,
les états particuliers, le portrait 820 px et le pupitre 1440 px sont dans `rendus/`.
Les rendus suffixés `original` documentent les exports bruts ; les versions corrigées sont
les références retenues. La grammaire commune de GM-OS tranche pendant T4.

Les HTML, la CSS et le décor fictif sont copiés à l’identique depuis le dossier de production,
avec contrôle [SHA-256](../../tablettes/T3-references-retenues.json). Le
[relevé M1/M2](../../tablettes/T3-meneur-propositions/README.md) détaille les corrections,
les contrôles et les limites : interactions simulées, aucun moteur de dés ou synchronisation
validé. Les polices et composants de GM-OS s’appliqueront lors de l’intégration.
Les chemins de requêtes et d’exports bruts de `ecrans.json` se rapportent au dossier de
production `tablettes/T3-meneur-propositions/`, qui conserve toute la provenance Stitch.
