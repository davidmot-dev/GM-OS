# -*- coding: utf-8 -*-
"""
Que coute un plafond RAG plus haut, en secondes, a chaque question ?

Le pendant de la mesure hors modele (`electron/mesurePlafond.test.ts`, qui dit
ce qu'un palier ACHETE). Ici on mesure ce qu'il COUTE.

Pourquoi la mesure est entiere a chaque fois : le bloc RAG vit dans le PROMPT
SYSTEME (`AIService.prepareSystemPrompt`), et il change a chaque question. Le
cache de prefixe d'Ollama ne couvre donc que la persona, quelques centaines de
tokens en tete. Tout le reste est re-prefille.

Le prompt est SALE a chaque execution : sans cela on mesure le cache et rien
d'autre (piege du 2026-08-11, deja paye une fois).

Usage : python sonde_cout_du_plafond.py
"""
import json, os, random, time, urllib.request, urllib.error

HOTE = 'http://127.0.0.1:11434'
SEL = random.randint(100000, 999999)   # sel de l'execution
CHARS_PAR_TOKEN = 3.5          # meme constante que ragSelection.ts
NUM_CTX = 16384                # meme valeur que electron/optionsDuModele.ts
PALIERS = [0, 4000, 6000, 8000, 10000, 12000]

RACINE = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'docs',
                      'systems', 'reves de dragons', 'rules')

QUESTION = ("En te fondant uniquement sur les extraits ci-dessus, reponds en UNE phrase : "
            "quelles sont les regles de l'ethylisme ?")


def modele():
    with urllib.request.urlopen(HOTE + '/api/tags', timeout=30) as r:
        noms = [m['name'] for m in json.load(r).get('models', [])]
    for prefere in ('gemma4:12b', 'gemma3:12b'):
        if prefere in noms:
            return prefere
    gemma = [n for n in noms if 'gemma' in n]
    return gemma[0] if gemma else noms[0]


def fiches():
    """Les vraies fiches, dans l'ordre du disque. De la prose francaise reelle :
    un remplissage synthetique ne se tokenise pas pareil."""
    out = []
    for nom in sorted(os.listdir(RACINE)):
        if not nom.endswith('.md'):
            continue
        with open(os.path.join(RACINE, nom), encoding='utf-8') as f:
            out.append((nom, f.read()))
    return out


def bloc(tokens_vises, corpus):
    """Assemble un bloc RAG d'environ `tokens_vises` tokens, habille comme le
    fait `selectContext` (en-tete [Source: ...] et separateur)."""
    if tokens_vises == 0:
        return ''
    morceaux, total, i = [], 0, 0
    while total < tokens_vises and i < len(corpus) * 4:
        nom, texte = corpus[i % len(corpus)]
        entete = '[Source: systems/reves de dragons/rules/' + nom + ']'
        m = entete + chr(10) + texte
        morceaux.append(m)
        total += int(len(m) / CHARS_PAR_TOKEN)
        i += 1
    joint = (chr(10) * 2 + '---' + chr(10) * 2).join(morceaux)
    # Coupe au plus pres du palier vise, pour comparer des paliers et non des fiches.
    return joint[:int(tokens_vises * CHARS_PAR_TOKEN)]


def appel(nom, prompt):
    charge = {
        'model': nom,
        'prompt': prompt,
        'stream': False,
        # `keep_alive` est de PREMIER NIVEAU : dans `options` il est ignore en
        # silence. Lecon du 2026-08-21, elle a coute un rechargement par appel.
        'keep_alive': '10m',
        'think': False,
        'options': {'num_ctx': NUM_CTX, 'num_predict': 60, 'temperature': 0},
    }
    req = urllib.request.Request(HOTE + '/api/generate',
                                 data=json.dumps(charge).encode('utf-8'),
                                 headers={'Content-Type': 'application/json'})
    depart = time.time()
    with urllib.request.urlopen(req, timeout=1800) as r:
        rep = json.load(r)
    return rep, time.time() - depart


def main():
    nom = modele()
    corpus = fiches()
    print('modele : ' + nom + '   |   ' + str(len(corpus)) + ' fiches reelles   |   sel ' + str(SEL))
    print('')
    print('palier |  invite traitee | prefill  | debit prefill | decodage | TOTAL  | surcout vs 4000')
    print('-------+-----------------+----------+---------------+----------+--------+----------------')

    base = None
    for palier in PALIERS:
        # Le sel change le PREMIER token utile : sans cela Ollama sert le prefixe
        # depuis son cache et on mesure le cache.
        # Un sel PAR APPEL, pas par execution. Rejouer le meme palier dans la
        # meme execution servait le prompt depuis le cache de prefixe : 722 puis
        # 1 331 tok/s au lieu de 110, mesures le 2026-08-23. C'est le piege du
        # 2026-08-11 a l'identique, et il se represente des qu'on repete un palier.
        sel = str(SEL) + '-' + str(palier) + '-' + str(random.randint(100000, 999999))
        prompt = ('Releve ' + sel + '.' + chr(10) * 2
                  + bloc(palier, corpus) + chr(10) * 2 + QUESTION)
        try:
            rep, mur = appel(nom, prompt)
        except urllib.error.HTTPError as err:
            print('palier ' + str(palier) + ' : refus HTTP ' + str(err.code) + ' — ' + err.read().decode('utf-8', 'replace')[:200])
            continue

        entree = rep.get('prompt_eval_count', 0)
        sortie = rep.get('eval_count', 0)
        prefill = rep.get('prompt_eval_duration', 0) / 1e9
        decode = rep.get('eval_duration', 0) / 1e9
        debit = entree / prefill if prefill > 0 else 0
        if palier == 4000:
            base = mur
        surcout = ('%+.1f s' % (mur - base)) if base is not None and palier != 4000 else ('reference' if palier == 4000 else '')

        # Une invite tronquee par llama.cpp ne mesure plus le palier demande :
        # au-dela de n_ctx il ne garde que n_keep tokens de tete et la derniere
        # moitie. On le DIT plutot que de laisser la ligne mentir.
        alerte = '  ⚠ TRONQUEE' if entree >= NUM_CTX else ''

        print('%6d | %8d tokens | %6.1f s | %8.1f tok/s | %6.1f s | %5.1f s | %s%s'
              % (palier, entree, prefill, debit, decode, mur, surcout, alerte))

    print('')
    print('n_ctx = ' + str(NUM_CTX) + '. Au-dela, llama.cpp tronque et GARDE LA QUEUE :')
    print('le prompt systeme, donc la persona et les consignes, tombe en premier.')


if __name__ == '__main__':
    main()
