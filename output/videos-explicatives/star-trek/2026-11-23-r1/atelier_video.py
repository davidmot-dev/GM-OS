"""Tutoriels GM-OS : textes français et temps de lecture, sans synthèse vocale."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import zipfile

ID = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


def exiger(condition, message):
    if not condition:
        raise ValueError(message)


def chemin(p):
    p = Path(p).expanduser().resolve()
    v = p.as_posix().lower()
    exiger('/appdata/roaming/gm-os-v5' not in v and 'security_backup_gmos' not in v,
           'Chemin personnel GM-OS interdit.')
    return p


def sha(p):
    h = hashlib.sha256()
    with chemin(p).open('rb') as f:
        for b in iter(lambda: f.read(1048576), b''):
            h.update(b)
    return h.hexdigest()


def lire(p):
    return json.loads(chemin(p).read_text(encoding='utf-8-sig'))


def ecrire(p, data):
    p = chemin(p)
    exiger(not p.exists(), 'Sortie existante, choisir une nouvelle révision : ' + str(p))
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(data if isinstance(data, str) else json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


def neuf(p):
    p = chemin(p)
    exiger(not p.exists(), 'Dossier existant, choisir une nouvelle révision : ' + str(p))
    p.mkdir(parents=True)
    return p


def lancer(args, cwd=None):
    r = subprocess.run([str(x) for x in args], cwd=cwd, capture_output=True,
                       encoding='utf-8', errors='replace', check=False)
    exiger(r.returncode == 0, 'Commande échouée : '+str(args[0])+'\n'+r.stderr[-3000:])
    return r.stdout


def binaire(nom):
    candidat = os.environ.get('GMOS_'+nom.upper()) or shutil.which(nom)
    if candidat:
        return str(candidat)
    local = os.environ.get('LOCALAPPDATA')
    if local:
        try:
            matches = sorted((Path(local)/'Microsoft/WinGet/Packages').glob('Gyan.FFmpeg_*/ffmpeg-*/bin/'+nom+'.exe'))
            if matches:
                return str(matches[-1])
        except OSError:
            pass
    raise ValueError(nom+' inaccessible : PATH ou GMOS_'+nom.upper()+'. Aucune installation automatique.')


def sonde(f):
    return json.loads(lancer([binaire('ffprobe'), '-v', 'error', '-show_streams', '-show_format', '-show_chapters', '-of', 'json', chemin(f)]))


def etat_archive(f):
    with zipfile.ZipFile(chemin(f)) as z:
        exiger(len(z.infolist()) < 20000, 'Archive démesurée.')
        exiger(all(not x.filename.startswith(('/', '\\')) and '..' not in x.filename.replace('\\','/').split('/') for x in z.infolist()), 'Chemin dangereux dans une archive.')
        exiger(z.getinfo('state.json').file_size < 32*1024*1024, 'state.json démesuré.')
        return json.loads(z.read('state.json'))


def inspecter(pilote, campagne):
    ps, cs = etat_archive(pilote), etat_archive(campagne)
    d, t, c = ps['gameDriver'], ps['sheetTemplate'], cs['campaign']
    exiger(c.get('system') == d['id'], 'La campagne ne référence pas ce pilote.')
    return {'controle':'Relevé structurel partiel ; règles et moteur à vérifier.',
            'pilote':{'fichier':str(chemin(pilote)), 'sha256':sha(pilote), 'id':d['id'], 'version':d.get('version'), 'nom':d.get('name'), 'corpusId':d.get('corpusId'), 'jet':d.get('jet'), 'combat':d.get('combat')},
            'gabarit':{'id':t['id'], 'champs':sum(len(s.get('fields',[])) for s in t.get('sections',[]))},
            'campagne':{'fichier':str(chemin(campagne)), 'sha256':sha(campagne), 'id':c['id'], 'nom':c.get('name'), 'comptes':{k:len(cs.get(k,[])) for k in ['players','entities','actes','scenes','sessions','atlasMaps']}}}


def nombre(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def plan_valide(f):
    p = lire(f)
    exiger(p.get('schemaVersion') == 2, 'Plan v2 à textes requis ; convertir le plan vocal ancien avant de filmer.')
    exiger('A_REMPLIR' not in json.dumps(p, ensure_ascii=False), 'Plan à compléter avant exécution.')
    exiger('voix' not in p, 'Le plan à textes ne doit pas déclarer de voix.')
    exiger(p.get('presentation') == {'mode':'texte','langue':'fr-FR'}, 'Textes français sans voix requis.')
    for k in ['titre','jeu']:
        exiger(isinstance(p.get(k), str) and p[k].strip(), k+' absent.')
    i = inspecter(p['pilote']['fichier'], p['campagne']['fichier'])
    for k in ['pilote','campagne']:
        exiger(p[k].get('sha256') == sha(p[k]['fichier']) and p[k]['id'] == i[k]['id'], 'Source différente : '+k)
    exiger(p['pilote']['version'] == i['pilote']['version'], 'Version de pilote différente.')
    exiger(p['campagne'].get('type') == 'test', 'Campagne de test requise.')
    l = p['lecture']
    for k in ['motsParMinute','caracteresParSeconde','minimumMs','installationMs','margeMs','caracteresParLigne','lignesMaximum']:
        exiger(nombre(l.get(k)), 'Réglage de lecture invalide : '+k)
    dynamique=p.get('profilRythme')=='dynamique-demande-David-2026-11-19'
    exiger(50 <= l['motsParMinute'] <= (125 if dynamique else 110) and 5 <= l['caracteresParSeconde'] <= (14 if dynamique else 12), 'Lecture trop rapide : au plus110 mots/min et12 caractères/s.')
    exiger(l['minimumMs'] >= (5000 if dynamique else 6000) and l['installationMs'] >= (800 if dynamique else 1200) and l['margeMs'] >= (1200 if dynamique else 1500), 'Temps de lecture ou marge insuffisants.')
    exiger(isinstance(l['caracteresParLigne'], int) and 20 <= l['caracteresParLigne'] <= 46, 'Largeur de carte :20 à46 caractères.')
    exiger(isinstance(l['lignesMaximum'], int) and 1 <= l['lignesMaximum'] <= 3, 'Une à trois lignes par carte.')
    r = p['rythme']
    exiger(all(nombre(r.get(k)) for k in ['avantGesteMs','stabilisationResultatMs','apresResultatMs']), 'Pauses invalides.')
    exiger(r['avantGesteMs'] >= (1000 if dynamique else 1800) and r['stabilisationResultatMs'] >= (700 if dynamique else 1000) and r['apresResultatMs'] >= (2500 if dynamique else 4500), 'Pauses trop courtes.')
    chap = [c['id'] for c in p['chapitres']]
    exiger(len(chap) == len(set(chap)) and all(ID.fullmatch(c) for c in chap), 'IDs de chapitre invalides.')
    exiger(all(isinstance(c.get('titre'),str) and c['titre'].strip() for c in p['chapitres']), 'Titre de chapitre absent.')
    exiger(({'reperes','preparer','initiative','jet','combat','creatures','suivi','projection','cloture','blade-runner','cthulhu-hack','dune','bilan'} if p.get('portee')=='module-combat-os' else {'reperes','specificites','jet','combat','bilan'}) <= set(chap), 'Chapitres obligatoires absents.')
    mod = p['moduleExterne']
    exiger(isinstance(mod.get('present'),bool) and bool(mod.get('raison','').strip()), 'Justifier le module ou son absence.')
    exiger(not mod['present'] or 'module' in chap, 'Module sans chapitre.')
    seq = p['sequences']; ids = [s['id'] for s in seq]
    exiger(seq and len(ids) == len(set(ids)) and all(ID.fullmatch(s) for s in ids), 'IDs de séquence invalides.')
    exiger(set(chap) == {s['chapitre'] for s in seq}, 'Chapitre vide ou inconnu.')
    ordre = [chap.index(s['chapitre']) for s in seq]
    exiger(ordre == sorted(ordre), 'Regrouper les séquences par chapitre.')
    for s in seq:
        for k in ['intention','avant','geste','apres','attendu']:
            exiger(isinstance(s.get(k),str) and s[k].strip(), s['id']+' : '+k+' absent.')
        exiger(all(len(s[k].split()) <= 65 for k in ['avant','apres']), 'Diviser cette explication en séquences courtes : '+s['id'])
        exiger(isinstance(s.get('sources'),list) and s['sources'] and all(isinstance(x,str) and x.strip() for x in s['sources']), 'Sources absentes : '+s['id'])
        supplement = s.get('lectureSupplementaireMs',0)
        exiger(nombre(supplement) and supplement >= 0, 'Lecture supplémentaire invalide.')
        for phase in ['avant','apres']:
            cartes(s[phase], l, supplement)
    return p


def cartes(texte, reglage, supplement=0):
    def lignes_de(t):
        lignes=[];ligne=''
        for mot in t.split():
            exiger(len(mot) <= reglage['caracteresParLigne'], 'Mot trop long : reformuler ou couper la séquence.')
            suivant=(ligne+' '+mot).strip()
            if len(suivant)>reglage['caracteresParLigne']:lignes.append(ligne);ligne=mot
            else:ligne=suivant
        if ligne:lignes.append(ligne)
        return lignes
    # Garder les phrases ensemble si elles tiennent ; sinon préférer une virgule.
    # Le dernier recours par lignes conserve les mots, sans réduire la police.
    n=reglage['lignesMaximum'];blocs=[];courant=''
    for phrase in re.split(r'(?<=[.!?;:])\s+', ' '.join(texte.split())):
        morceaux=[phrase] if len(lignes_de(phrase))<=n else re.split(r'(?<=,)\s+',phrase)
        for morceau in morceaux:
            candidat=(courant+' '+morceau).strip()
            if len(lignes_de(candidat))<=n:courant=candidat;continue
            if courant:blocs.append('\n'.join(lignes_de(courant)));courant=''
            lignes=lignes_de(morceau)
            if len(lignes)<=n:courant=morceau
            else:
                for i in range(0,len(lignes),n):blocs.append('\n'.join(lignes[i:i+n]))
    if courant:blocs.append('\n'.join(lignes_de(courant)))
    resultat=[]
    for bloc in blocs:
        mots=len(bloc.split());caracteres=len(bloc.replace('\n',' '))
        lecture=math.ceil(max(reglage['minimumMs'], mots*60000/reglage['motsParMinute'], caracteres*1000/reglage['caracteresParSeconde']))
        resultat.append({'texte':bloc,'mots':mots,'caracteres':caracteres,'lectureMs':lecture,
                         'dureeMs':math.ceil(lecture+reglage['installationMs']+reglage['margeMs']+supplement)})
    return resultat


def construire_lecture(p, plan):
    seq=[]
    for s in p['sequences']:
        e={'id':s['id']}
        for phase in ['avant','apres']:
            blocs=cartes(s[phase],p['lecture'],s.get('lectureSupplementaireMs',0))
            for i,c in enumerate(blocs):c['id']=s['id']+'-'+phase+'-'+str(i+1)
            e[phase]={'texte':s[phase],'cartes':blocs,'dureeMs':sum(c['dureeMs'] for c in blocs)}
        seq.append(e)
    return {'schemaVersion':2,'mode':'texte','langue':'fr-FR','planFichier':str(chemin(plan)), 'planSha256':sha(plan),'reglage':p['lecture'],'sequences':seq}


def textes(plan, sortie):
    p=plan_valide(plan); l=construire_lecture(p,plan); out=neuf(sortie)
    ecrire(out/'lecture.json',l)
    ecrire(out/'textes.md','# Textes à l’écran\n\n'+ '\n\n'.join('## '+s['id']+'\n\n'+'\n\n'.join('### '+phase+'\n\n'+'\n\n'.join(c['texte']+'\n\nAffichage minimal : '+str(c['dureeMs']/1000)+' s.' for c in s[phase]['cartes']) for phase in ['avant','apres']) for s in l['sequences'])+'\n')
    return l


def verifier_prises(p, plan, lecture_file, prises_file):
    l,r=lire(lecture_file),lire(prises_file)
    exiger(l == construire_lecture(p,plan), 'Manifeste de lecture modifié ou périmé : régénérer textes.')
    exiger(r.get('schemaVersion') == 2 and r.get('mode') == 'texte', 'Prises à textes v2 requises.')
    exiger(r.get('planSha256') == sha(plan) and r.get('lectureSha256') == sha(lecture_file), 'Plans/textes/prises de versions différentes.')
    exiger(r.get('modeRapide') is False and r.get('calageVerifie') is True, 'Répétition rapide ou calage non vérifié.')
    exiger([s['id'] for s in p['sequences']] == [s['id'] for s in r['sequences']], 'Séquences incomplètes ou désordonnées.')
    details=[]; probes={}
    for s,li,pr in zip(p['sequences'],l['sequences'],r['sequences']):
        exiger(pr.get('verifiee') is True and isinstance(pr.get('observation'),str) and pr['observation'].strip(), 'Observation non vérifiée : '+s['id'])
        off=pr.get('decalageMs',r.get('decalageMs')); exiger(nombre(off) and off>=0, 'Décalage explicite requis.')
        debut,fin,a0,a1=[pr[k] for k in ['debutMs','finMs','debutActionMs','finActionMs']]
        exiger(all(nombre(x) for x in [debut,fin,a0,a1]) and 0<=debut<=a0<=a1<fin, 'Horodatages invalides.')
        for phase,plancher,plafond in [('avant',debut,a0-p['rythme']['avantGesteMs']),('apres',a1+p['rythme']['stabilisationResultatMs'],fin-p['rythme']['apresResultatMs'])]:
            affichages=pr.get('affichages'+phase.capitalize(),[]); attendus=li[phase]['cartes']
            exiger([x.get('carteId') for x in affichages] == [x['id'] for x in attendus], 'Cartes manquantes ou désordonnées : '+s['id'])
            precedent=plancher
            for vu,c in zip(affichages,attendus):
                d,f=vu.get('debutMs'),vu.get('finMs')
                exiger(nombre(d) and nombre(f) and d>=precedent and f<=plafond+40 and f-d>=c['dureeMs']-40, 'Temps de lecture coupé ou geste trop tôt : '+c['id'])
                precedent=f
        source=pr['source']
        if source not in probes:probes[source]=sonde(source)
        probe=probes[source];v=next(x for x in probe['streams'] if x['codec_type']=='video')
        exiger(fin+off<=float(probe['format']['duration'])*1000+60, 'Prise au-delà du brut.')
        exiger(v['width']%2==0 and v['height']%2==0, 'Dimensions paires requises.')
        details.append((s,li,pr,off,(v['width'],v['height'])))
    exiger(len({d[4] for d in details})==1, 'Normaliser les prises de dimensions différentes sans étirer l’interface.')
    return details


def horloge(ms, srt=True):
    ms=round(ms); h,r=divmod(ms,3600000); m,r=divmod(r,60000); s,r=divmod(r,1000)
    return f'{h:02}:{m:02}:{s:02}{"," if srt else "."}{r:03}'


def metadata_texte(s):
    return str(s).replace('\\','\\\\').replace('=','\\=').replace(';','\\;').replace('#','\\#').replace('\n',' ')


def desactiver_sous_titres_par_defaut(f):
    # MP4 peut conserver track_enabled malgré disposition=0 : garder la piste optionnelle.
    f=chemin(f); b=bytearray(f.read_bytes())
    def boites(debut,fin):
        while debut<fin:
            exiger(debut+8<=fin, 'Boîte MP4 tronquée.')
            n,t=struct.unpack_from('>I4s',b,debut);h=8
            if n==1:n=struct.unpack_from('>Q',b,debut+8)[0];h=16
            if n==0:n=fin-debut
            exiger(n>=h and debut+n<=fin, 'Taille de boîte MP4 invalide.')
            yield t,debut,h,n
            debut+=n
    moov=next(x for x in boites(0,len(b)) if x[0]==b'moov');nombre_pistes=0
    for _,o,h,n in (x for x in boites(moov[1]+moov[2],moov[1]+moov[3]) if x[0]==b'trak'):
        enfants=list(boites(o+h,o+n));tkhd=next(x for x in enfants if x[0]==b'tkhd');mdia=next(x for x in enfants if x[0]==b'mdia')
        hdlr=next(x for x in boites(mdia[1]+mdia[2],mdia[1]+mdia[3]) if x[0]==b'hdlr')
        if b[hdlr[1]+hdlr[2]+8:hdlr[1]+hdlr[2]+12]!=b'sbtl':continue
        position=tkhd[1]+tkhd[2]+1;flags=int.from_bytes(b[position:position+3],'big')
        b[position:position+3]=(flags&~1).to_bytes(3,'big');nombre_pistes+=1
    exiger(nombre_pistes==1, 'Une piste de textes optionnelle attendue.')
    f.write_bytes(b)


def monter(plan, lecture_file, prises_file, sortie):
    p=plan_valide(plan);details=verifier_prises(p,plan,lecture_file,prises_file)
    ff=binaire('ffmpeg');out=neuf(sortie);(out/'segments').mkdir();(out/'controle').mkdir()
    largeur,hauteur=details[0][4];police=max(28,round(largeur*.027));bande=max(220,math.ceil(police*5.8/2)*2)
    cues=[];chapitres=[];segments=[];curseur=0
    transcription=['# '+p['titre'],'','Textes français à l’écran ; aucune voix.','']
    for i,(s,li,pr,off,dimensions) in enumerate(details):
        duree=(pr['finMs']-pr['debutMs'])/1000;dest=out/'segments'/f'{i:03}.mp4'
        lancer([ff,'-nostdin','-v','error','-ss',str((pr['debutMs']+off)/1000),'-i',chemin(pr['source']),
                '-map','0:v:0','-an','-vf',f'pad=iw:ih+{bande}:0:0:color=0x101b20,setsar=1,format=yuv420p',
                '-t',str(duree),'-r','25','-c:v','libx264','-preset','fast','-crf','20',dest])
        encoded=round(float(sonde(dest)['format']['duration'])*1000)
        if not chapitres or chapitres[-1]['id']!=s['chapitre']:
            chapitres.append({'id':s['chapitre'],'titre':next(c['titre'] for c in p['chapitres'] if c['id']==s['chapitre']),'debutMs':curseur})
        for phase in ['avant','apres']:
            for c,vu in zip(li[phase]['cartes'],pr['affichages'+phase.capitalize()]):
                cues.append((curseur+vu['debutMs']-pr['debutMs'],curseur+vu['finMs']-pr['debutMs'],c['texte']))
        transcription+=['## '+s['id']+' — '+s['intention'],'',s['avant'],'','**Geste :** '+s['geste'],'',s['apres'],'']
        segments.append({'id':s['id'],'fichier':'segments/'+dest.name,'dureeMs':encoded,'source':str(chemin(pr['source'])),'sourceSha256':sha(pr['source']),'observation':pr['observation']})
        curseur+=encoded
    exiger(all(f<=curseur for d,f,t in cues), 'Textes au-delà du montage.')
    ecrire(out/'sous-titres.srt',''.join(f'{i+1}\n{horloge(d)} --> {horloge(f)}\n{t}\n\n' for i,(d,f,t) in enumerate(cues)))
    ecrire(out/'transcription.md','\n'.join(transcription)+'\n')
    ass=(f'[Script Info]\nScriptType: v4.00+\nPlayResX: {largeur}\nPlayResY: {hauteur+bande}\nWrapStyle: 2\n'
         '[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n'
         f'Style: Default,Segoe UI,{police},&H00FFFFFF,&H00FFFFFF,&H00101B20,&H00101B20,0,0,0,0,100,100,0,0,1,1,0,2,40,40,36,1\n'
         '[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n')
    for d,f,t in cues:
        t=t.replace('\\','\\\\').replace('{','\\{').replace('}','\\}').replace('\n',r'\N')
        ass+=f'Dialogue: 0,{horloge(d,False)[:-1]},{horloge(f,False)[:-1]},Default,,0,0,0,,{t}\n'
    ecrire(out/'textes.ass',ass)
    meta=[';FFMETADATA1','title='+metadata_texte(p['titre'])]
    for i,c in enumerate(chapitres):
        c['finMs']=chapitres[i+1]['debutMs'] if i+1<len(chapitres) else curseur
        meta+=['[CHAPTER]','TIMEBASE=1/1000','START='+str(c['debutMs']),'END='+str(c['finMs']),'title='+metadata_texte(c['titre'])]
    ecrire(out/'chapitres.ffmeta','\n'.join(meta)+'\n')
    ecrire(out/'chapitres.md','# Chapitres\n\n'+'\n'.join('- '+horloge(c['debutMs'],False)+' — '+c['titre'] for c in chapitres)+'\n')
    ecrire(out/'segments.ffconcat',"ffconcat version 1.0\n"+''.join("file '"+s['fichier']+"'\n" for s in segments))
    lancer([ff,'-nostdin','-v','error','-f','concat','-safe','1','-i','segments.ffconcat','-c','copy','assemblage.mp4'],cwd=out)
    lancer([ff,'-nostdin','-v','error','-i','assemblage.mp4','-i','sous-titres.srt','-i','chapitres.ffmeta',
            '-map','0:v:0','-map','1:0','-map_metadata','2','-map_chapters','2','-an','-vf','ass=filename=textes.ass',
            '-c:v','libx264','-preset','fast','-crf','20','-c:s','mov_text','-metadata:s:s:0','language=fra',
            '-disposition:s:0','0','-movie_timescale','1000','-movflags','+faststart','video.mp4'],cwd=out)
    desactiver_sous_titres_par_defaut(out/'video.mp4')
    final=sonde(out/'video.mp4');types={s['codec_type'] for s in final['streams']}
    exiger({'video','subtitle'}<=types and 'audio' not in types, 'Vidéo à textes sans piste audio requise.')
    exiger([c['tags']['title'] for c in final.get('chapters',[])]==[c['titre'] for c in chapitres], 'Chapitres du MP4 différents.')
    for c,observe in zip(chapitres,final['chapters']):
        exiger(abs(float(observe['start_time'])*1000-c['debutMs'])<2 and abs(float(observe['end_time'])*1000-c['finMs'])<2, 'Bornes de chapitre différentes.')
    video=next(s for s in final['streams'] if s['codec_type']=='video');subs=next(s for s in final['streams'] if s['codec_type']=='subtitle')
    exiger((video['width'],video['height'])==(largeur,hauteur+bande), 'Bande ou dimensions incorrectes.')
    exiger(subs['disposition']['default']==0, 'La piste optionnelle ne doit pas doubler automatiquement les textes incrustés.')
    exiger(abs(float(final['format']['duration'])*1000-curseur)<500, 'Dérive de durée à contrôler.')
    lancer([ff,'-nostdin','-v','error','-i',out/'video.mp4','-map','0:v:0','-f','null','-'])
    for i,(debut,fin,texte) in enumerate(cues):
        lancer([ff,'-nostdin','-v','error','-ss',str((debut+fin)/2000),'-i',out/'video.mp4','-frames:v','1','-vf','scale=960:-2',out/'controle'/f'{i:03}.jpg'])
    rapport={'profilRythme':p.get('profilRythme','lecture-confort'),'demandeRythme':p.get('demandeRythme'),'titre':p['titre'],'mode':'texte','voix':False,'pisteAudio':False,'planSha256':sha(plan),'lectureSha256':sha(lecture_file),
             'prisesSha256':sha(prises_file),'videoSha256':sha(out/'video.mp4'),'dureeSecondes':float(final['format']['duration']),
             'decodageIntegral':True,'acceleration':False,'chapitres':chapitres,'segments':segments,'cartes':len(cues),
             'lecture':p['lecture'],'pisteTextesParDefaut':False,'visionnage':'NON EXÉCUTÉ',
             'confortLectureHumain':'NON ÉVALUÉ — relire toutes les cartes et augmenter leurs durées si nécessaire.',
             'note':'Calcul et minimums de lecture contrôlés ; ceci ne remplace pas la relecture du film final.'}
    ecrire(out/'rapport-technique.json',rapport)
    return rapport


def main():
    ap=argparse.ArgumentParser(description=__doc__);sub=ap.add_subparsers(dest='cmd',required=True)
    sub.add_parser('outils')
    q=sub.add_parser('inspecter');q.add_argument('--pilote',required=True);q.add_argument('--campagne',required=True);q.add_argument('--sortie',required=True)
    q=sub.add_parser('verifier-plan');q.add_argument('--plan',required=True)
    q=sub.add_parser('textes');q.add_argument('--plan',required=True);q.add_argument('--sortie',required=True)
    q=sub.add_parser('monter');q.add_argument('--plan',required=True);q.add_argument('--lecture',required=True);q.add_argument('--prises',required=True);q.add_argument('--sortie',required=True)
    a=ap.parse_args()
    if a.cmd=='outils':
        result={'python':sys.version.split()[0],'presentation':'Textes à l’écran ; aucune synthèse vocale','outils':{}}
        for nom in ['ffmpeg','ffprobe']:
            try:result['outils'][nom]={'chemin':binaire(nom),'version':lancer([binaire(nom),'-version']).splitlines()[0]}
            except (ValueError,OSError) as e:result['outils'][nom]={'erreur':str(e)}
    elif a.cmd=='inspecter':result=inspecter(a.pilote,a.campagne);ecrire(a.sortie,result)
    elif a.cmd=='verifier-plan':p=plan_valide(a.plan);result={'valide':True,'sequences':len(p['sequences']),'planSha256':sha(a.plan),'mode':'texte'}
    elif a.cmd=='textes':result=textes(a.plan,a.sortie)
    else:result=monter(a.plan,a.lecture,a.prises,a.sortie)
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=='__main__':
    try:main()
    except (ValueError,OSError,KeyError,StopIteration,zipfile.BadZipFile,struct.error) as e:
        print('ERREUR : '+str(e),file=sys.stderr);sys.exit(1)
