# -*- coding: utf-8 -*-
"""
Pourquoi la fiche d'Alien s'arrete en plein milieu d'un tableau.

Le journal du serveur dit 403 tokens generes pour un plafond de 2048 : la
reponse n'a donc PAS ete coupee par `num_predict`. Le modele s'est arrete de
lui-meme, JSON incomplet — ce que la grammaire de `format: json` est justement
censee empecher.

Deux appels, sur la vraie charge (les deux fiches Alien du groupe `fiche`) :
  A. avec `format: json`  — ce que l'application est censee envoyer ;
  B. sans                 — pour voir si la grammaire change quoi que ce soit.

On regarde `done_reason`, le nombre de tokens, et si le JSON se parse.
"""
import json, re, time, urllib.request

HOTE = 'http://127.0.0.1:11434'
MODELE = 'gemma4:12b'
RULES = 'C:/Projet_David/GM-OS-v5/docs/systems/alien/rules'

CIBLE = ('"template" avec name, emoji et sections. Chaque champ porte un "type" pris parmi '
         'number, text, checkbox, gauge, select, textarea, rating. Prevois une section pour '
         'les jauges individuelles (stress, determination, sante mentale...) si le jeu en a')
EXEMPLE = ('{"template":{"name":"Fiche de Personnage","emoji":"P","sections":['
           '{"id":"competences","label":"Competences","fields":[{"id":"combat","label":"Combat",'
           '"type":"number","defaultValue":4,"max":8}]},{"id":"jauges","label":"Jauges","fields":'
           '[{"id":"determination","label":"Determination","type":"gauge","defaultValue":0,"max":5}]}]}}')

SYSTEME = ("Tu es l'ingenieur en chef de la Forge GM-OS. Tu rends EXCLUSIVEMENT un objet "
           'JSON compact et valide, sans texte avant ni apres. Si les fiches ne permettent '
           'pas de repondre, rends un objet vide {}.'
           '\n\n    IMPORTANT : Tu dois repondre UNIQUEMENT avec un bloc JSON valide.\n'
           '    Ta reponse doit commencer par { ou [ et se terminer par } ou ].')


def fiche(slug):
    brut = open(f'{RULES}/{slug}.md', encoding='utf-8').read().replace('\r\n', '\n')
    fin = brut.index('\n---', 3)
    entete, corps = brut[4:fin], brut[fin + 4:].strip()
    sujet = re.search(r'^sujet\s*:\s*(.*)$', entete, re.M).group(1).strip().strip('"')
    return sujet, corps


def invite():
    corps = '\n\n'.join(f'### {s}\n{c}' for s, c in
                        (fiche('composition-de-la-fiche-de-personnage'),
                         fiche('jauges-et-ressources-individuelles')))
    return '\n'.join([
        "Voici les fiches de regles verifiees d'un jeu de role, pour le sujet « Fiche de personnage ».",
        '', corps, '',
        f'TACHE : rends un JSON compact contenant {CIBLE}. Rien d\'autre.', '',
        "N'INVENTE RIEN. Si les fiches ne disent pas comment fonctionne une mecanique, OMETS le champ.",
        '',
        'FORME ATTENDUE (la forme seulement, pas les valeurs) :', EXEMPLE, '',
        'Reponds par le JSON seul, sans indentation, sans commentaire, sans texte autour.',
    ])


def appel(nom, extra):
    charge = {
        'model': MODELE,
        'messages': [{'role': 'system', 'content': SYSTEME},
                     {'role': 'user', 'content': invite()}],
        'stream': False,
        'think': False,
        'options': {'num_ctx': 16384, 'num_predict': 2048},
    }
    charge.update(extra)

    depart = time.time()
    requete = urllib.request.Request(
        f'{HOTE}/api/chat', data=json.dumps(charge).encode('utf-8'),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(requete, timeout=1800) as r:
        rep = json.load(r)
    duree = time.time() - depart

    contenu = rep.get('message', {}).get('content') or ''
    try:
        json.loads(contenu)
        verdict = 'JSON COMPLET ET VALIDE'
    except Exception as err:
        verdict = f'INVALIDE — {err}'

    print(f'\n--- {nom}  ({duree:.0f} s, {rep.get("prompt_eval_count")} entres, '
          f'{rep.get("eval_count")} sortis, done_reason={rep.get("done_reason")})')
    print(f'    {len(contenu)} caracteres — {verdict}')
    print(f'    fin de la reponse : ...{contenu[-160:]}')


print(f'invite : {len(invite())} caracteres')

SCHEMA = {"type":"object","properties":{"template":{"type":"object","properties":{
  "name":{"type":"string"},"emoji":{"type":"string"},
  "sections":{"type":"array","items":{"type":"object","properties":{
     "id":{"type":"string"},"label":{"type":"string"}},
     "required":["id","label"],"additionalProperties":False}}},
  "required":["name","sections"],"additionalProperties":False}},
  "required":["template"],"additionalProperties":False}


CHAMP = {"type":"object","properties":{
  "id":{"type":"string"},"label":{"type":"string"},
  "type":{"type":"string","enum":["number","text","checkbox","gauge","select","textarea","rating"]},
  "defaultValue":{"type":["number","string","boolean"]},"max":{"type":"number"}},
  "required":["id","label","type"],"additionalProperties":False}

SCHEMA_COMPLET = {"type":"object","properties":{"template":{"type":"object","properties":{
  "name":{"type":"string"},"emoji":{"type":"string"},
  "sections":{"type":"array","items":{"type":"object","properties":{
     "id":{"type":"string"},"label":{"type":"string"},
     "fields":{"type":"array","items":CHAMP}},
     "required":["id","label","fields"],"additionalProperties":False}}},
  "required":["name","sections"],"additionalProperties":False}},
  "required":["template"],"additionalProperties":False}

BASE = {'num_ctx': 16384, 'num_predict': 2048, 'temperature': 0, 'top_k': 1}
appel('G. SCHEMA DU GABARIT ENTIER (sections ET champs)',
      {'format': SCHEMA_COMPLET, 'options': dict(BASE, repeat_penalty=1, repeat_last_n=0)})
