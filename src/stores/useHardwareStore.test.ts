import { describe, it, expect, beforeEach } from 'vitest';
import { useHardwareStore } from './useHardwareStore';

/**
 * **L'aller-retour que fait le meneur : taper un nom, le relire.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE TEST QUI MANQUAIT, ET CE QU'IL A COÛTÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le 2026-09-12, les alias sont passés d'une clé `deviceId` à une **signature
 * stable**. L'écriture a suivi ; **la lecture des champs de saisie, non** — ils
 * interrogeaient toujours `aliases[deviceId]` en direct. David, dans l'heure :
 * *« je n'arrive pas à donner un nom au moniteur »*. Un champ contrôlé dont la
 * valeur ne change jamais **refuse la frappe**.
 *
 * ⭐ **Trente-six tests venaient d'être écrits, et aucun ne pouvait le voir.**
 * Ils éprouvaient la signature, la migration, la résolution — *la mécanique
 * interne*. Pas une fois le geste complet.
 *
 * *Un lecteur et un écrivain qui n'emploient pas la même clé sont pires que deux
 * écrivains : personne ne voit rien, et rien ne plante.*
 */

const enceinte = {
    deviceId: 'brut-abc123',
    label: 'Haut-parleurs (Realtek(R) Audio)',
    kind: 'audiooutput' as const,
};

const moniteur = {
    id: '2528732444',
    label: 'Moniteur 2',
    bounds: { x: 1920, y: 0, width: 2560, height: 1440 },
};

beforeEach(() => {
    useHardwareStore.setState({
        audioDevices: [enceinte],
        displays: [moniteur],
        audioAliases: {},
        displayAliases: {},
        signaturesConnues: {},
    });
});

describe('⛔ nommer un appareil, puis relire son nom', () => {
    /*
      **LE TEST DE LA RÉGRESSION DU 12/09.** Il rougit dès que l'écriture et la
      lecture cessent d'employer la même clé — quel que soit le côté qui bouge.
    */
    it('une sortie audio garde le nom qu’on vient de lui donner', () => {
        const { setAudioAlias } = useHardwareStore.getState();

        setAudioAlias(enceinte.deviceId, 'Enceintes du fond');

        expect(
            useHardwareStore.getState().aliasDeLaSortie(enceinte.deviceId),
            'le champ de saisie se relirait vide — la frappe serait refusée',
        ).toBe('Enceintes du fond');
    });

    it('un écran garde le nom qu’on vient de lui donner', () => {
        const { setDisplayAlias } = useHardwareStore.getState();

        setDisplayAlias(moniteur.id, 'Écran de la table');

        expect(useHardwareStore.getState().aliasDeLEcran(moniteur.id)).toBe('Écran de la table');
    });

    /* La saisie caractère par caractère est le geste réel : chaque frappe
       réécrit la valeur entière, et chaque relecture doit suivre. */
    it('et il suit la frappe, lettre après lettre', () => {
        const { setAudioAlias } = useHardwareStore.getState();

        for (const partiel of ['E', 'En', 'Enc']) {
            setAudioAlias(enceinte.deviceId, partiel);
            expect(useHardwareStore.getState().aliasDeLaSortie(enceinte.deviceId)).toBe(partiel);
        }
    });

    it('effacer le nom le rend vraiment vide', () => {
        const { setAudioAlias } = useHardwareStore.getState();

        setAudioAlias(enceinte.deviceId, 'Enceintes du fond');
        setAudioAlias(enceinte.deviceId, '');

        expect(useHardwareStore.getState().aliasDeLaSortie(enceinte.deviceId)).toBe('');
    });
});

describe('le nom survit au changement d’identifiant', () => {
    /*
      ⭐ **Ce pour quoi tout ce chantier existe.** L'enceinte est rebranchée :
      Windows lui donne un nouvel identifiant et la renomme `2- Realtek`. Le nom
      du meneur doit suivre.
    */
    it('une enceinte rebranchée retrouve son nom', () => {
        useHardwareStore.getState().setAudioAlias(enceinte.deviceId, 'Enceintes du fond');

        /* Le lendemain : même appareil, autre identifiant, libellé renuméroté. */
        useHardwareStore.setState({
            audioDevices: [{
                deviceId: 'brut-zzz999',
                label: 'Haut-parleurs (2- Realtek(R) Audio)',
                kind: 'audiooutput',
            }],
        });

        expect(useHardwareStore.getState().aliasDeLaSortie('brut-zzz999')).toBe('Enceintes du fond');
    });

    it('et un écran retrouve le sien, à géométrie égale', () => {
        useHardwareStore.getState().setDisplayAlias(moniteur.id, 'Écran de la table');

        useHardwareStore.setState({
            displays: [{ ...moniteur, id: '999999999' }],
        });

        expect(useHardwareStore.getState().aliasDeLEcran('999999999')).toBe('Écran de la table');
    });
});

describe('⛔ l’alias n’est pas le libellé système', () => {
    /*
      **La distinction qui protège la saisie.** `getAudioLabel` retombe sur le
      nom Windows — c'est ce qu'on veut *afficher*. `aliasDeLaSortie` rend le nom
      du meneur, et **rien** : un champ de saisie pré-rempli avec le nom système
      ferait croire qu'on a déjà nommé l'appareil, et l'effacerait à la première
      touche.
    */
    it('sans nom donné, l’alias est vide et le libellé ne l’est pas', () => {
        const etat = useHardwareStore.getState();

        expect(etat.aliasDeLaSortie(enceinte.deviceId)).toBe('');
        expect(etat.getAudioLabel(enceinte.deviceId)).toBe(enceinte.label);
    });

    it('et une fois nommé, les deux disent le nom du meneur', () => {
        useHardwareStore.getState().setAudioAlias(enceinte.deviceId, 'Enceintes du fond');
        const etat = useHardwareStore.getState();

        expect(etat.aliasDeLaSortie(enceinte.deviceId)).toBe('Enceintes du fond');
        expect(etat.getAudioLabel(enceinte.deviceId)).toBe('Enceintes du fond');
    });

    /* Un appareil qu'on n'a jamais vu ne doit ni lever ni inventer un nom. */
    it('un appareil inconnu n’a pas d’alias, et ne lève pas', () => {
        const etat = useHardwareStore.getState();

        expect(etat.aliasDeLaSortie('jamais-vu')).toBe('');
        expect(etat.aliasDeLEcran('jamais-vu')).toBe('');
    });
});

describe('les alias d’avant la signature', () => {
    /*
      ⚠️ Une base écrite avant le 12/09 range ses alias sous le `deviceId` brut.
      Ils doivent rester lisibles **sans migration préalable** — sans quoi le
      meneur ouvrirait GM-OS sur des appareils redevenus anonymes.
    */
    it('se relisent encore sous leur ancienne clé', () => {
        useHardwareStore.setState({ audioAliases: { 'brut-abc123': 'Ancien nom' } });

        expect(useHardwareStore.getState().aliasDeLaSortie('brut-abc123')).toBe('Ancien nom');
    });

    /* Et la signature l'emporte quand les deux existent : elle est plus récente. */
    it('mais la signature l’emporte quand les deux existent', () => {
        useHardwareStore.setState({
            audioAliases: {
                'brut-abc123': 'Ancien nom',
                'audio:haut-parleurs (realtek(r) audio)': 'Nom actuel',
            },
        });

        expect(useHardwareStore.getState().aliasDeLaSortie('brut-abc123')).toBe('Nom actuel');
    });
});
