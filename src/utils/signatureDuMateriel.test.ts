import { describe, it, expect } from 'vitest';
import {
    signatureDeLaSortie, signatureDeLEcran, retrouverLaSortie, migrerLesAlias,
    estUneSortieSysteme,
} from './signatureDuMateriel';

/**
 * **Reconnaître une enceinte d'une soirée à l'autre.**
 *
 * ⛔ Le test qui porte tout le module est *« le « 2- » de Windows ne change pas
 * la signature »* : sans lui, on aurait remplacé un identifiant instable par un
 * autre, et le correctif n'aurait rien corrigé.
 */

const enceinteArriere = { deviceId: 'abc123', label: 'Haut-parleurs (Realtek(R) Audio)' };

describe('la signature d’une sortie', () => {
    it('se calcule sur le libellé système', () => {
        expect(signatureDeLaSortie(enceinteArriere)).toBe('audio:haut-parleurs (realtek(r) audio)');
    });

    /*
      ⛔ **LE CŒUR DU MODULE.** Windows numérote ses périphériques au
      rebranchement : `Realtek` devient `2- Realtek`, puis `3-`. *Sans ce
      nettoyage, la signature serait aussi instable que l'identifiant qu'elle
      remplace* — et tout ceci ne servirait à rien.
    */
    it.each([
        'Haut-parleurs (2- Realtek(R) Audio)',
        'Haut-parleurs (3- Realtek(R) Audio)',
        'Haut-parleurs (12- Realtek(R) Audio)',
    ])('« %s » garde la même signature après rebranchement', (label) => {
        expect(signatureDeLaSortie({ deviceId: 'autre-id', label }))
            .toBe(signatureDeLaSortie(enceinteArriere));
    });

    it('et l’identifiant n’y entre pas — c’est tout l’intérêt', () => {
        expect(signatureDeLaSortie({ deviceId: 'xxx', label: enceinteArriere.label }))
            .toBe(signatureDeLaSortie(enceinteArriere));
    });

    it('les espaces surnuméraires ne comptent pas', () => {
        expect(signatureDeLaSortie({ deviceId: 'a', label: '  Casque   USB  ' }))
            .toBe(signatureDeLaSortie({ deviceId: 'b', label: 'Casque USB' }));
    });

    /*
      ⚠️ **Sans libellé, pas de signature.** `enumerateDevices` rend des entrées
      anonymes tant que l'autorisation micro n'a pas été donnée — *une signature
      vide rangerait toutes les enceintes ensemble.*
    */
    it.each([undefined, '', '   '])('sans libellé (%p), elle avoue ne pas savoir', (label) => {
        expect(signatureDeLaSortie({ deviceId: 'abc', label })).toBeNull();
    });

    /* Les sorties système désignent un rôle, pas un appareil. */
    it.each(['default', 'communications'])('« %s » n’a pas de signature', (deviceId) => {
        expect(signatureDeLaSortie({ deviceId, label: 'Système par défaut' })).toBeNull();
        expect(estUneSortieSysteme(deviceId)).toBe(true);
    });
});

describe('la signature d’un écran', () => {
    it('mêle la taille et la place', () => {
        expect(signatureDeLEcran({ bounds: { x: 1920, y: 0, width: 2560, height: 1440 } }))
            .toBe('ecran:2560x1440@1920,0');
    });

    it('survit à un changement d’identifiant', () => {
        const bounds = { x: 0, y: 0, width: 1920, height: 1080 };
        expect(signatureDeLEcran({ bounds })).toBe(signatureDeLEcran({ bounds: { ...bounds } }));
    });

    /* ⚠️ Et ce qu'elle ne sait pas faire, écrit noir sur blanc : deux écrans
       échangés de place échangent leur signature. C'est le prix de n'avoir
       aucun nom système à se mettre sous la dent. */
    it('mais deux places différentes font deux signatures', () => {
        expect(signatureDeLEcran({ bounds: { x: 0, y: 0, width: 1920, height: 1080 } }))
            .not.toBe(signatureDeLEcran({ bounds: { x: 1920, y: 0, width: 1920, height: 1080 } }));
    });

    it('sans géométrie, elle avoue ne pas savoir', () => {
        expect(signatureDeLEcran({})).toBeNull();
    });
});

describe('retrouver une sortie enregistrée', () => {
    const presentes = [
        { deviceId: 'neuf-999', label: 'Haut-parleurs (2- Realtek(R) Audio)' },
        { deviceId: 'casque-1', label: 'Casque USB' },
    ];

    it('rien de demandé : on suit la sortie par défaut', () => {
        expect(retrouverLaSortie(undefined, presentes)).toEqual({ sort: 'par-defaut' });
        expect(retrouverLaSortie('default', presentes)).toEqual({ sort: 'par-defaut' });
    });

    /*
      ⭐ **L'identifiant d'abord.** Quand l'appareil n'a pas bougé, il le désigne
      exactement ; passer par le libellé risquerait de confondre deux appareils
      qui portent le même nom. *La signature est un filet, pas une méthode.*
    */
    it('par son identifiant quand il est encore là', () => {
        expect(retrouverLaSortie('casque-1', presentes))
            .toEqual({ sort: 'trouvee', deviceId: 'casque-1', par: 'identifiant' });
    });

    /*
      ⛔ **LE CAS DU 12/09.** L'identifiant enregistré a disparu au
      rebranchement ; la signature le retrouve sous son nouveau numéro.
    */
    it('par sa signature quand l’identifiant a changé', () => {
        const verdict = retrouverLaSortie(
            'ancien-22ad7d4a',
            presentes,
            'audio:haut-parleurs (realtek(r) audio)',
        );

        expect(verdict).toEqual({ sort: 'trouvee', deviceId: 'neuf-999', par: 'signature' });
    });

    /*
      ⛔ **« Disparue » n'est PAS « par défaut ».** Les confondre est exactement
      ce que faisait le code d'avant : l'ambiance repartait devant sans que rien
      ne le dise. L'appelant doit pouvoir parler.
    */
    it('disparue quand elle n’est plus là, et ça se distingue du défaut', () => {
        const verdict = retrouverLaSortie('ancien-22ad7d4a', presentes, 'audio:enceinte bluetooth');

        expect(verdict).toEqual({ sort: 'disparue' });
        expect(verdict).not.toEqual({ sort: 'par-defaut' });
    });

    it('et disparue aussi quand aucune signature n’avait été mémorisée', () => {
        expect(retrouverLaSortie('ancien-22ad7d4a', presentes)).toEqual({ sort: 'disparue' });
    });

    it('sur une machine sans aucune sortie, tout est disparu', () => {
        expect(retrouverLaSortie('casque-1', [])).toEqual({ sort: 'disparue' });
    });
});

describe('la migration des alias', () => {
    const sigAudio = (a: { deviceId?: string; label?: string }) => signatureDeLaSortie(a);

    it('range l’alias sous la signature, sans perdre l’ancienne clé', () => {
        const migre = migrerLesAlias(
            { 'abc123': 'Enceintes du fond' },
            [enceinteArriere],
            sigAudio,
        );

        expect(migre['audio:haut-parleurs (realtek(r) audio)']).toBe('Enceintes du fond');
        expect(migre['abc123'], 'l’ancienne clé a été perdue').toBe('Enceintes du fond');
    });

    /*
      ⛔ **Une migration qui perd ce qu'elle ne comprend pas est une perte
      déguisée en nettoyage.** Un appareil débranché au moment de la migration
      n'a pas de signature calculable : son nom doit rester.
    */
    it('garde les alias des appareils absents, faute de pouvoir les classer', () => {
        const migre = migrerLesAlias({ 'debranche-77': 'Barre de son' }, [enceinteArriere], sigAudio);

        expect(migre['debranche-77']).toBe('Barre de son');
    });

    /* Elle doit pouvoir tourner à chaque démarrage sans rien abîmer. */
    it('est idempotente', () => {
        const une = migrerLesAlias({ 'abc123': 'Enceintes du fond' }, [enceinteArriere], sigAudio);
        const deux = migrerLesAlias(une, [enceinteArriere], sigAudio);

        expect(deux).toEqual(une);
    });

    /*
      ⚠️ Un alias déjà rangé sous sa signature est **plus récent** que celui de
      l'ancienne clé : la migration ne doit pas le remplacer par le vieux nom.
    */
    it('n’écrase pas un alias déjà rangé sous sa signature', () => {
        const migre = migrerLesAlias(
            {
                'abc123': 'Vieux nom',
                'audio:haut-parleurs (realtek(r) audio)': 'Nom actuel',
            },
            [enceinteArriere],
            sigAudio,
        );

        expect(migre['audio:haut-parleurs (realtek(r) audio)']).toBe('Nom actuel');
    });

    it('sans alias à migrer, elle rend un carnet vide', () => {
        expect(migrerLesAlias({}, [enceinteArriere], sigAudio)).toEqual({});
    });

    /* Elle sert aussi aux écrans, qui se classent par `id` et non `deviceId`. */
    it('vaut pour les écrans, qui portent un `id`', () => {
        const ecran = { id: '2528732444', bounds: { x: 0, y: 0, width: 1920, height: 1080 } };
        const migre = migrerLesAlias({ '2528732444': 'Écran de la table' }, [ecran], signatureDeLEcran);

        expect(migre['ecran:1920x1080@0,0']).toBe('Écran de la table');
    });
});
