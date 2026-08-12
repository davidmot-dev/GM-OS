# -*- coding: utf-8 -*-
"""
Que fait vraiment Ollama quand l'invite depasse le contexte ?

Hypothese a tester : llama.cpp ne jette pas « la moitie du contexte », il
TRONQUE l'invite en gardant `n_keep` tokens de tete et la DERNIERE moitie du
contexte. Avec n_ctx=16384 et n_keep=4, cela ferait 4 + (16384-4)/2 = 8194
tokens — soit tres exactement les 8 195 mesures le 2026-08-11.

Deux marqueurs encadrent un remplissage volontairement trop long. Le modele ne
peut nommer que ce qu'il a reellement recu :
  - ALPHA seul  -> la tete est gardee, la queue est jetee ;
  - OMEGA seul  -> la queue est gardee (hypothese) ;
  - les deux    -> rien n'a ete tronque.

Le prompt est SALE a chaque execution : sans cela Ollama repond depuis son
cache de prefixe et on mesure le cache, pas le modele (piege du 2026-08-11).
"""
import json, random, time, urllib.request

HOTE = 'http://127.0.0.1:11434'
SEL = random.randint(100000, 999999)
ALPHA = 'MARQUEUR-ALPHA-7391'
OMEGA = 'MARQUEUR-OMEGA-4682'


def modele():
    with urllib.request.urlopen(f'{HOTE}/api/tags', timeout=30) as r:
        noms = [m['name'] for m in json.load(r).get('models', [])]
    for prefere in ('gemma4:12b', 'gemma3:12b'):
        if prefere in noms:
            return prefere, noms
    gemma = [n for n in noms if 'gemma' in n]
    return (gemma[0] if gemma else noms[0]), noms


def remplissage(debut, fin):
    return '\n'.join(
        f'Ligne {i} du releve {SEL} : le convoi {i * 7 % 97} progresse vers le sud.'
        for i in range(debut, fin)
    )


def main():
    nom, disponibles = modele()
    # La consigne est repetee AUX DEUX BOUTS. Quel que soit le morceau garde,
    # le modele en recoit une — et il ne peut nommer que le marqueur qui
    # l'accompagne. C'est ce qui distingue « la tete est gardee » de « la queue
    # est gardee », que la premiere sonde ne savait pas trancher.
    consigne = ('CONSIGNE : ce texte contient UN SEUL marqueur. Reponds par ce marqueur '
                'et rien d\'autre.')
    prompt = '\n'.join([
        consigne,
        ALPHA,
        remplissage(0, 1500),
        OMEGA,
        consigne,
    ])

    charge = {
        'model': nom,
        'prompt': prompt,
        'stream': False,
        'options': {'num_predict': 300, 'temperature': 0},
        # Un modele a raisonnement remplit `thinking` et laisse `response` vide :
        # la premiere sonde a rendu 40 tokens pour une reponse vide.
        'think': False,
    }
    corps = json.dumps(charge).encode('utf-8')

    def appel(charge_utile):
        requete = urllib.request.Request(
            f'{HOTE}/api/generate', data=json.dumps(charge_utile).encode('utf-8'),
            headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(requete, timeout=1800) as r:
            return json.load(r)

    depart = time.time()
    try:
        rep = appel(charge)
    except urllib.error.HTTPError as err:
        # `think` n'est accepte que des modeles a raisonnement : un refus ici
        # n'est pas une panne, c'est un modele ordinaire.
        print(f'(« think: false » refuse — {err.code}, on relance sans)')
        charge.pop('think')
        rep = appel(charge)
    duree = time.time() - depart

    entree = rep.get('prompt_eval_count', 0)
    sortie = rep.get('eval_count', 0)
    prefill = rep.get('prompt_eval_duration', 1) / 1e9
    decode = rep.get('eval_duration', 1) / 1e9
    # Les deux champs comptent : un modele a raisonnement peut ne rien mettre
    # dans `response`, et ce qu'il a VU se lit alors dans `thinking`.
    reponse = ((rep.get('response') or '') + '\n' + (rep.get('thinking') or '')).strip()

    print(f'modele            : {nom}   (disponibles : {", ".join(disponibles)})')
    print(f'invite envoyee    : {len(prompt)} caracteres, ~{round(len(prompt)/2.92)} tokens estimes')
    print(f'invite TRAITEE    : {entree} tokens')
    print(f'  -> attendu si troncature a la moitie du contexte : 8194')
    print(f'  -> attendu si tout passe (n_ctx 16384)           : ~{round(len(prompt)/2.92)}')
    print(f'prefill           : {entree/prefill:.1f} tok/s ({prefill:.1f} s)')
    print(f'decodage          : {sortie/decode:.1f} tok/s ({decode:.1f} s, {sortie} tokens)')
    print(f'duree totale      : {duree:.1f} s')
    print(f'ALPHA (tete) vu   : {ALPHA in reponse}')
    print(f'OMEGA (queue) vu  : {OMEGA in reponse}')
    print(f'reponse brute     : {reponse[:300]}')


if __name__ == '__main__':
    main()
