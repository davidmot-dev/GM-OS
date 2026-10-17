import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const dir=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(dir,'../../../..');
const html=await fs.readFile(path.join(dir,'nephilim-legende-interactive.html'),'utf8');
const m=JSON.parse(html.match(/<script[^>]*id="character-sheet-template"[^>]*>([\s\S]*?)<\/script>/)[1]);
const pages=m.template.pages,oldKeys=new Set(pages.slice(0,2).flatMap(p=>p.fields.map(f=>f.key)));
const added=pages.slice(2).flatMap((p,i)=>p.fields.map(f=>({...f,page:i+3})));
assert.equal(m.template.id,'nephilim-legende-fr');assert.equal(pages.length,7);assert.equal(oldKeys.size,239);assert.equal(added.length,747);assert.ok(added.every(f=>!oldKeys.has(f.key)));
const copies=added.filter(f=>f.derive);
const text=[
 '# Nephilim — livraison de la fiche enrichie à sept pages','',
 'Réalisée le 17/10/2026 avec GM-OS Studio, atelier Fiche. David demande un enrichissement de la fiche existante, sans changer ses deux premières pages ni ses clés.','',
 '**État actualisé avant commit :** Claude Code a réalisé l’intégration dans `6be8ff1a` : moteur version 9 et correspondance complète. Le HTML installé dans `docs/fiches/Nephilim/` est identique au livrable. Le validateur complet accepte la fiche avec **0 erreur et 0 avertissement**.','',
 '[Ouvrir le seul HTML livré](../../outils/gmos-studio/livraisons/nephilim/nephilim-legende-interactive.html). Il contient tous ses fonds et fonctionne hors ligne. La liste complète ci-dessous est aussi intégrée dans son bouton **Aide**, section « Liste exacte des 747 clés ajoutées ».','',
 '## Résultat et conservation','',
 '- Gabarit inchangé : `nephilim-legende-fr`.',
 '- 7 pages, 1 019 zones et 986 clés uniques : 239 anciennes et 747 nouvelles.',
 '- Aucune clé retirée, renommée, déplacée ou changée de type. Les deux premiers objets de page du manifeste sont strictement identiques à la version d’origine, fonds et géométries compris.',
 '- Comparaison du rendu rempli des pages 1 et 2 : captures identiques pixel pour pixel.',
 '- Fonctions conservées : navigation, zoom 20–400 %, raccourcis, Zones, autosauvegarde, import/export JSON v1 et v2, portrait, réinitialisation confirmée et impression de toutes les pages.','',
 '| Page | Contenu | Zones | Clés nouvelles |','| --- | --- | ---: | ---: |',
 ...pages.map((p,i)=>`| ${i+1} | ${['Personnage','Effets et simulacre','Magie — 24 sorts','Kabbale — arbre','Kabbale — 20 invocations et 10 ordonnances','Alchimie — constructs et Materiae Primae','Alchimie — 24 formules'][i]} | ${p.fields.length} | ${i<2?0:p.fields.length} |`),'',
 '## Choix de David et contenu réellement imprimé','',
 'David confirme : **« Oui, cinq valeurs par construct »** et **« Deux nombres par élément : MP actuelles et MP Max »**.','',
 '- Chaque construct possède ses cinq Ka propres, saisis indépendamment du Pentacle du personnage : `alchemy.constructs.<construct>.<element>`.',
 '- Materiae Primae : `alchemy.materia.<element>` porte les MP actuelles ; `alchemy.materia.<element>.max` porte le maximum. Deux nombres manuels, sans calcul de plafond ni piste inventée : le PDF ne contient pas de piste imprimée dans cette zone.',
 '- Les tableaux sans lignes horizontales reçoivent des zones transparentes régulières, sans modifier leurs fonds : 24 sorts, 20 invocations, 24 formules.',
 '- Les dix cases « Non respectée » des ordonnances sont indépendantes : leurs numéros désignent les lignes, pas une jauge cumulative.',
 '- Mémorisation reste une mention libre. Le PDF ne précise ni calcul ni case à cocher.',
 '- Les en-têtes imprimés sont suivis : Magie ajoute aussi Art occulte, Portée et Durée ; Kabbale ajoute Monde, Portée, Durée, Visibilité et Page ; Alchimie ajoute Substance, Ka-élément, Aire d’effet et Durée.',
 '- Pas de champ `ka.dominant` : rien ne l’imprime dans les cinq pages fournies. Pas de Pacte, Sceau, Pentacle ou Clé ajoutés : ces zones ne sont pas imprimées. Pas de champs `.work` et `.construct` dans les lignes de formules : l’en-tête porte Substance, pas ces deux valeurs.','',
 '## Valeurs répétées : choix pour chaque cas','',
 '| Valeur | Choix |','| --- | --- |',
 '| Monde de Kabbale | Report `copy`, nouvelle clé `kabbalah.world`, depuis `occult.kabbalah.world`. |',
 '| Dix Sephiroth | Reports `copy` en lecture seule ; correspondances exactes ci-dessous. |',
 '| Voie et trois Œuvres d’Alchimie | Reports `copy` en lecture seule ; correspondances exactes ci-dessous. |',
 '| Degrés globaux des cercles de Magie | Aucun bloc global imprimé sur la nouvelle page Magie : aucune deuxième saisie. Le cercle et le degré de chaque sort sont propres à ce sort. |',
 '| Ka-éléments du personnage | Pas de Pentacle répété. Les Ka des constructs sont leurs valeurs propres, autorisées par David ; les éléments des sorts/invocations/formules sont propres à leurs lignes. |',
 '| Stase | Aucune zone Stase imprimée sur les cinq nouvelles pages : aucun champ ajouté. |','',
 '| Nouvelle clé de report | Source conservée | Page |','| --- | --- | ---: |',
 ...copies.map(f=>`| \`${f.key}\` | \`${f.derive.source}\` | ${f.page} |`),'',
 'Les trois cercles du haut de l’arbre portent Kether, Binah et Chokmah : leur position correspond aux clés existantes `occult.kabbalah.third.center`, `.third.left` et `.third.right`. Aucune clé ancienne n’a été renommée pour ces noms.','',
 '## Validation et intégration','',
 '**17 contrôles de livraison réussis** : conservation du gabarit et des pages, fonds intégrés, géométries, copies, validation structurelle, compatibilité des 239 anciennes clés, comparaison pixel pour pixel, aller-retour JSON des 747 nouvelles clés, saisie, persistance locale, captures normales et Zones des cinq pages, impression, liste intégrée des clés, imports invalides ou annulés, réinitialisation, zoom/tactile, import et reports dans le moteur jetable, absence d’erreur JavaScript et de requête réseau. Certains points sont regroupés dans un même contrôle.','',
 'À la livraison initiale, la validation de fiche sans correspondance ne signalait aucune erreur ; la validation complète relevait uniquement les 747 nouvelles clés absentes de la correspondance (§ 7). Cette étape a été achevée ensuite par Claude Code dans `6be8ff1a` : le validateur complet ne renvoie désormais aucun diagnostic. Ne pas refaire le raccordement.','',
 'Les essais de moteur emploient un profil Edge jetable. Attendre `RPGSheet.list()` avant l’import pour laisser finir l’amorçage IndexedDB des modèles intégrés ; un import injecté pendant cet amorçage peut être remplacé par l’ancien modèle. Aucune donnée de David n’a été lue ou modifiée.','',
 '## Empreintes et provenance','',
 '- Original deux pages au moment de la livraison : `a4fdde65e03c71504e5d441ef249e97b7159c7756d0842c2b07ef1b861d845d3`.',
 '- HTML sept pages livré : `'+createHash('sha256').update(html).digest('hex')+'`.',
 '- Fiche initiale : `docs/fiches/Nephilim/nephilim-legende-interactive.html` ; elle contient maintenant la version enrichie intégrée dans `6be8ff1a`.',
 '- Source des nouvelles pages : `C:/Users/david/Downloads/Nephilim Magie.pdf`, cinq pages, ordre intégral conservé.',
 '- Livraison du Studio sans modification du code applicatif ; intégration ultérieure attribuée au commit ci-dessus. David demande ensuite « commit et pousse » pour les fichiers du Studio et leurs rapports.','',
 '## Liste exacte des 747 clés ajoutées','',
 'Aucune clé ancienne retirée ou renommée. Une ligne correspond à une clé nouvelle unique.','',
 '| Clé exacte | Type | Page | Source si report |','| --- | --- | ---: | --- |',
 ...added.map(f=>`| \`${f.key}\` | ${f.type} | ${f.page} | ${f.derive?'`'+f.derive.source+'`':'—'} |`),'',
 '## Reprise technique locale','',
 'La préparation et les captures sont dans `scratch/nephilim-occultes/` (ignoré par Git) : `enrichir.mjs`, `verifier.mjs`, `verification.json`, rapports du validateur, fonds rendus et captures normales/Zones. Le HTML livré est autonome ; ces fichiers ne sont pas nécessaires à son utilisation.',
 'Le présent rapport peut se régénérer en UTF-8 avec `node outils/gmos-studio/livraisons/nephilim/decrire-livraison.mjs`.',''
].join('\n');
await fs.writeFile(path.join(repo,'documentation/Planning/2026-10-17-nephilim-7-pages-livraison.md'),text,'utf8');
console.log('Rapport UTF-8 écrit : '+added.length+' clés exactes.');
