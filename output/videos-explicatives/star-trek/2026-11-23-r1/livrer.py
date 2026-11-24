import hashlib,json,shutil
from pathlib import Path
r=Path(__file__).resolve().parent;m=r/'montage-r1';j=lambda p:json.loads(p.read_text(encoding='utf8'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
t=j(m/'rapport-technique.json');p=j(r/'plan.json');c=j(r/'controle-final.json')
assert t['decodageIntegral'] and not t['pisteAudio'] and not t['acceleration']
assert c['imagesFinalesRelues'] and c['cartesControlees']==t['cartes']
assert c['videoSha256']==sha(m/'video.mp4')
for s in j(r/'sources.json')['fichiers']+j(r/'sources.json')['build']:assert sha(Path(s['fichier']))==s['sha256'],s['fichier']
assert j(r/'prises-r2/prises.json')['modeRapide'] is False
d=r/'livraison';d.mkdir();nom='Star-Trek-Adventures-2e-GM-OS'
for src,n in [(m/'video.mp4',nom+'.mp4'),(m/'sous-titres.srt',nom+'.srt')]+[(m/n,n) for n in ['chapitres.md','transcription.md','rapport-technique.json']]+[(r/n,n) for n in ['scenario.md','plan.json','couverture.md','REPRODUIRE.md','sources.json','verification-preparation.json','verification-pedagogique.md','controle-final.json','Star-Trek-Nacre-TOURNAGE.gmos']]+[(Path(p['pilote']['fichier']),'Star-Trek-2.0.0.gmos-driver'),(r/'prises-r2/etat-final.json','etat-final.json')]:shutil.copyfile(src,d/n)
minutes,secondes=divmod(round(t['dureeSecondes']),60)
(d/'LIRE-MOI.md').write_text(f'''# Star Trek Adventures 2e dans GM-OS

[Voir la vidéo]({nom}.mp4) — {minutes} min {secondes:02} s. Textes français incrustés, sans voix ni piste audio. SRT, transcription et chapitres joints. Gestes à vitesse réelle ; pauses de lecture préparées au rythme demandé par David.

## Refaire les gestes

Utiliser une instance de recette et le pilote Star Trek 2.0.0 avec le moteur du 23/11/2026. La copie du pilote est identique à la source courante, aucune modification. Importer Star-Trek-Nacre-TOURNAGE.gmos en Tel quel dans un profil de recette. Elle conserve les identifiants du lot historique Les Voix de Nacre : éviter les collisions avec une campagne active. L’archive ne transporte pas les réserves de table : préparer Impulsion 0/Menace 6 pour trois héros présents. Les profils RECETTE servent aux exemples, les héros restent hors des essais.

Suivre les chapitres et le scénario : tâche 2d20, spécialisation, achat en Menace, complication, Détermination, Stress et Répit ; échange PJ/adversaire, alternance et conséquence ; LCARS et Opérations, tâche et défi, rechargement réel. Les dés préparés sont annoncés et le hasard restauré après chaque lancer. En partie, laisser les dés réels décider.

## Limites

Le film utilise la fiche structurée du pilote ; la fiche HTML autonome n’est pas montrée. L’atelier reste hors séance et les accès joueurs des modules fermés. Aucun transport Hub, droits visibles côté joueur ou appareil physique certifié. LCARS montre affectations et alerte côté meneur ; aucun jet, tir ou soin automatique. Dans Opérations, les boutons suivent des résultats déjà résolus et leurs coûts indiqués ne débitent pas les réserves globales.

Le tir PJ échoue, le PNJ réussit et CORPS évite la blessure par deux Stress. La gravité 2 du phaseur adverse est renseignée explicitement au résultat ; son texte historique n’est pas reconnu automatiquement par le parseur. Aucun PNJ vaincu ne continue de tirer. Le Répit est accordé pour l’exercice.

Combat spatial complet, toutes les consoles, soins, blessures encaissées, réputation, progression, talents, opposition au contact et matériel non couverts. Revue IA des images finales ; aucun visionnage humain continu ni confort humain certifié, aucun essai attribué à David. Voir verification-pedagogique.md pour les contrôles réellement exécutés.

## Preuves et isolation

Build réussi ; 145 tests historiques ciblés repassés et test de préparation natif réussi. Répétition complète puis prise normale, calage visuel, décodage intégral et empreintes contrôlés. Profils/AppData/sauvegardes/corpus/coffre jetables, appareils désactivés, HTTP externe bloqué. Aucun code applicatif, pilote ou donnée personnelle modifié pour cette vidéo. Scripts, bruts et images de contrôle conservés dans le dossier parent ; aucun commit, push ou publication automatique.
''',encoding='utf8')
h={f.name:sha(f) for f in d.iterdir() if f.is_file()};(d/'empreintes.json').write_text(json.dumps(h,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
for n,v in h.items():assert sha(d/n)==v
print(json.dumps({'dureeSecondes':t['dureeSecondes'],'fichiers':len(h),'videoSha256':h[nom+'.mp4']}))
