import { describe, it, expect } from 'vitest';
import { adresseDuPontDesBoutons } from './portsDuRenderer';
import { PORT_SYNC_PAR_DEFAUT } from '../../electron/portsDeGmOs';

/**
 * **L'adresse que Home Assistant doit appeler — et le port qu'elle ne doit pas prendre.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE DÉFAUT DU 2026-09-12, TROUVÉ LE LENDEMAIN
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Le panneau composait l'adresse avec `info.port`. En **production** les deux
 * ports sont identiques et tout marchait ; en **développement**, `port` désigne
 * Vite (5173), parce que c'est lui qui sert l'interface avec son rechargement à
 * chaud. Le panneau annonçait donc `http://…:5173/bouton`.
 *
 * **Home Assistant y postait, et Vite répondait son `index.html`.** Pas
 * d'erreur, pas d'effet, rien à diagnostiquer. David : *« ça ne marche pas »*.
 *
 * ⭐ **Le commentaire de `remote:get-connection-info` décrivait déjà ce mode
 * d'échec, mot pour mot**, pour le proxy média : *« jamais celui de Vite, qui ne
 * sert ni /media/ ni /temp/ et répond son index.html à leur place »*. J'ai pris
 * le mauvais champ malgré l'avertissement.
 *
 * *Un champ nommé `port` à côté d'un champ nommé `mediaPort` invite à prendre le
 * premier. La seule défense est de ne composer cette adresse qu'à un seul
 * endroit — celui que ce fichier garde.*
 */

describe('l’adresse du pont des boutons', () => {
    /*
      ⛔ **LE TEST DE LA RÉGRESSION.** C'est le seul cas où les deux ports
      diffèrent, donc le seul où la confusion se voit. En production, prendre
      l'un ou l'autre donnerait le même résultat — et le défaut serait resté
      invisible jusqu'à la prochaine session de développement.
    */
    it('prend le port du SyncServer, jamais celui de Vite', () => {
        const enDeveloppement = { ip: '192.168.0.211', port: 5173, mediaPort: 3001 };

        expect(adresseDuPontDesBoutons(enDeveloppement))
            .toBe('http://192.168.0.211:3001/bouton');
    });

    it('et en production, où les deux coïncident', () => {
        expect(adresseDuPontDesBoutons({ ip: '192.168.0.211', port: 3001, mediaPort: 3001 }))
            .toBe('http://192.168.0.211:3001/bouton');
    });

    /*
      ⚠️ Un pont plus ancien ne rend pas `mediaPort`. On retombe sur le défaut
      plutôt que sur `port` : *mieux vaut un port peut-être déplacé que celui
      dont on SAIT qu'il peut être le mauvais.*
    */
    it('sans `mediaPort`, elle retombe sur le défaut et non sur `port`', () => {
        const adresse = adresseDuPontDesBoutons({ ip: '192.168.0.211', port: 5173 });

        expect(adresse).toBe(`http://192.168.0.211:${PORT_SYNC_PAR_DEFAUT}/bouton`);
        expect(adresse, 'le port de Vite s’est glissé dans l’adresse').not.toContain('5173');
    });

    /*
      Sans réseau, `getLocalIP` ne rend rien d'utilisable. **On rend `null`
      plutôt qu'une adresse bancale** : l'écran affiche alors qu'il ne sait pas,
      au lieu de proposer une adresse qui ne marchera jamais.
    */
    it.each([undefined, null, {}, { port: 3001 }])('sans adresse IP (%p), elle rend null', (info) => {
        expect(adresseDuPontDesBoutons(info as never)).toBeNull();
    });

    it('le chemin est bien `/bouton`', () => {
        expect(adresseDuPontDesBoutons({ ip: '10.0.0.5', mediaPort: 3001 })).toMatch(/\/bouton$/);
    });
});
