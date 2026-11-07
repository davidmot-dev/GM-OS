// 2342616c31c92672358e82b9858f3c9ca8e27234
/**
 * **Les ports que GM-OS ouvre, et d'où ils viennent.**
 *
 * ⛔ **Ce fichier n'importe rien** — ni `electron`, ni `node`. Les écrans en
 * lisent les valeurs par défaut, et ils tournent dans le navigateur. Même parti
 * pris que `formeDuManuel.ts`, et pour la même raison : *une correction qui ne
 * tient que par l'élagage d'un outil est une correction qu'on casse sans le
 * voir.*
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI ILS DEVIENNENT RÉGLABLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Deux instances de GM-OS se disputaient 3001 et 3002. Depuis le 2026-09-11 le
 * second démarrage ne fait plus tomber le premier — `SyncServer` a enfin son
 * gestionnaire d'erreur — mais il démarre **infirme** : pas de tablettes, pas de
 * fiches.
 *
 * Les rendre réglables ouvre l'exécution **parallèle** des tests de bout en
 * bout : chaque instance reçoit sa paire de ports et personne ne marche sur
 * personne.
 *
 * ⚠️ **Les valeurs par défaut ne changent pas.** Un meneur qui ne pose aucune
 * variable retrouve 3001 et 3002, et ses tablettes déjà appairées continuent de
 * répondre. *Rendre réglable ne doit jamais vouloir dire déplacer.*
 */

/** Le SyncServer : WebSocket des tablettes, proxy des médias, et `dist/` en production. */
export const PORT_SYNC_PAR_DEFAUT = 3001;

/** Le serveur des fiches — un port à lui, c'est ce qui isole la fiche. */
export const PORT_FICHES_PAR_DEFAUT = 3002;
export const VARIABLE_PORT_SYNC = 'GMOS_PORT_SYNC';
export const VARIABLE_PORT_FICHES = 'GMOS_PORT_FICHES';

/**
 * Lit un port dans l'environnement, ou rend le défaut.
 *
 * ⚠️ **Une valeur illisible rend le défaut plutôt que de lever.** Un `0` ou un
 * `abc` dans une variable ne doit pas empêcher GM-OS de démarrer : le meneur
 * perdrait son cockpit pour une faute de frappe dans un script. On le signale,
 * et on continue.
 *
 * Le `0` mérite un mot : c'est un port valide pour `listen` — il demande au
 * système d'en attribuer un — mais ici il voudrait dire « je n'ai pas choisi »,
 * et les écrans ne sauraient pas lequel joindre. On le refuse.
 */
export function lirePort(valeur, defaut, nom) {
  if (valeur === undefined || valeur.trim() === '') return defaut;
  const port = Number(valeur);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.warn(`[Ports] ${nom} = « ${valeur} » n'est pas un port : on garde ${defaut}.`);
    return defaut;
  }
  return port;
}

/** Les deux ports, tels que ce démarrage les emploiera. */
export function portsDeGmOs(env) {
  const sync = lirePort(env[VARIABLE_PORT_SYNC], PORT_SYNC_PAR_DEFAUT, VARIABLE_PORT_SYNC);
  const fiches = lirePort(env[VARIABLE_PORT_FICHES], PORT_FICHES_PAR_DEFAUT, VARIABLE_PORT_FICHES);

  /*
    ⚠️ Deux serveurs sur le même port, c'est le second qui ne démarre pas — et
    en silence, puisque chacun a désormais sa garde. Le dire ici vaut mieux que
    de laisser chercher pourquoi les fiches n'arrivent pas.
  */
  if (sync === fiches) {
    console.warn(`[Ports] ${VARIABLE_PORT_SYNC} et ${VARIABLE_PORT_FICHES} valent tous deux ${sync} : ` + `le serveur des fiches ne démarrera pas.`);
  }
  return {
    sync,
    fiches
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJQT1JUX1NZTkNfUEFSX0RFRkFVVCIsIlBPUlRfRklDSEVTX1BBUl9ERUZBVVQiLCJWQVJJQUJMRV9QT1JUX1NZTkMiLCJWQVJJQUJMRV9QT1JUX0ZJQ0hFUyIsImxpcmVQb3J0IiwidmFsZXVyIiwiZGVmYXV0Iiwibm9tIiwidW5kZWZpbmVkIiwidHJpbSIsInBvcnQiLCJOdW1iZXIiLCJpc0ludGVnZXIiLCJjb25zb2xlIiwid2FybiIsInBvcnRzRGVHbU9zIiwiZW52Iiwic3luYyIsImZpY2hlcyJdLCJzb3VyY2VzIjpbInBvcnRzRGVHbU9zLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogKipMZXMgcG9ydHMgcXVlIEdNLU9TIG91dnJlLCBldCBkJ2/DuSBpbHMgdmllbm5lbnQuKipcbiAqXG4gKiDim5QgKipDZSBmaWNoaWVyIG4naW1wb3J0ZSByaWVuKiog4oCUIG5pIGBlbGVjdHJvbmAsIG5pIGBub2RlYC4gTGVzIMOpY3JhbnMgZW5cbiAqIGxpc2VudCBsZXMgdmFsZXVycyBwYXIgZMOpZmF1dCwgZXQgaWxzIHRvdXJuZW50IGRhbnMgbGUgbmF2aWdhdGV1ci4gTcOqbWUgcGFydGlcbiAqIHByaXMgcXVlIGBmb3JtZUR1TWFudWVsLnRzYCwgZXQgcG91ciBsYSBtw6ptZSByYWlzb24gOiAqdW5lIGNvcnJlY3Rpb24gcXVpIG5lXG4gKiB0aWVudCBxdWUgcGFyIGwnw6lsYWdhZ2UgZCd1biBvdXRpbCBlc3QgdW5lIGNvcnJlY3Rpb24gcXUnb24gY2Fzc2Ugc2FucyBsZVxuICogdm9pci4qXG4gKlxuICog4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSAXG4gKiBQT1VSUVVPSSBJTFMgREVWSUVOTkVOVCBSw4lHTEFCTEVTXG4gKiDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIBcbiAqXG4gKiBEZXV4IGluc3RhbmNlcyBkZSBHTS1PUyBzZSBkaXNwdXRhaWVudCAzMDAxIGV0IDMwMDIuIERlcHVpcyBsZSAyMDI2LTA5LTExIGxlXG4gKiBzZWNvbmQgZMOpbWFycmFnZSBuZSBmYWl0IHBsdXMgdG9tYmVyIGxlIHByZW1pZXIg4oCUIGBTeW5jU2VydmVyYCBhIGVuZmluIHNvblxuICogZ2VzdGlvbm5haXJlIGQnZXJyZXVyIOKAlCBtYWlzIGlsIGTDqW1hcnJlICoqaW5maXJtZSoqIDogcGFzIGRlIHRhYmxldHRlcywgcGFzIGRlXG4gKiBmaWNoZXMuXG4gKlxuICogTGVzIHJlbmRyZSByw6lnbGFibGVzIG91dnJlIGwnZXjDqWN1dGlvbiAqKnBhcmFsbMOobGUqKiBkZXMgdGVzdHMgZGUgYm91dCBlblxuICogYm91dCA6IGNoYXF1ZSBpbnN0YW5jZSByZcOnb2l0IHNhIHBhaXJlIGRlIHBvcnRzIGV0IHBlcnNvbm5lIG5lIG1hcmNoZSBzdXJcbiAqIHBlcnNvbm5lLlxuICpcbiAqIOKaoO+4jyAqKkxlcyB2YWxldXJzIHBhciBkw6lmYXV0IG5lIGNoYW5nZW50IHBhcy4qKiBVbiBtZW5ldXIgcXVpIG5lIHBvc2UgYXVjdW5lXG4gKiB2YXJpYWJsZSByZXRyb3V2ZSAzMDAxIGV0IDMwMDIsIGV0IHNlcyB0YWJsZXR0ZXMgZMOpasOgIGFwcGFpcsOpZXMgY29udGludWVudCBkZVxuICogcsOpcG9uZHJlLiAqUmVuZHJlIHLDqWdsYWJsZSBuZSBkb2l0IGphbWFpcyB2b3Vsb2lyIGRpcmUgZMOpcGxhY2VyLipcbiAqL1xuXG4vKiogTGUgU3luY1NlcnZlciA6IFdlYlNvY2tldCBkZXMgdGFibGV0dGVzLCBwcm94eSBkZXMgbcOpZGlhcywgZXQgYGRpc3QvYCBlbiBwcm9kdWN0aW9uLiAqL1xuZXhwb3J0IGNvbnN0IFBPUlRfU1lOQ19QQVJfREVGQVVUID0gMzAwMTtcblxuLyoqIExlIHNlcnZldXIgZGVzIGZpY2hlcyDigJQgdW4gcG9ydCDDoCBsdWksIGMnZXN0IGNlIHF1aSBpc29sZSBsYSBmaWNoZS4gKi9cbmV4cG9ydCBjb25zdCBQT1JUX0ZJQ0hFU19QQVJfREVGQVVUID0gMzAwMjtcblxuZXhwb3J0IGNvbnN0IFZBUklBQkxFX1BPUlRfU1lOQyA9ICdHTU9TX1BPUlRfU1lOQyc7XG5leHBvcnQgY29uc3QgVkFSSUFCTEVfUE9SVF9GSUNIRVMgPSAnR01PU19QT1JUX0ZJQ0hFUyc7XG5cbi8qKlxuICogTGl0IHVuIHBvcnQgZGFucyBsJ2Vudmlyb25uZW1lbnQsIG91IHJlbmQgbGUgZMOpZmF1dC5cbiAqXG4gKiDimqDvuI8gKipVbmUgdmFsZXVyIGlsbGlzaWJsZSByZW5kIGxlIGTDqWZhdXQgcGx1dMO0dCBxdWUgZGUgbGV2ZXIuKiogVW4gYDBgIG91IHVuXG4gKiBgYWJjYCBkYW5zIHVuZSB2YXJpYWJsZSBuZSBkb2l0IHBhcyBlbXDDqmNoZXIgR00tT1MgZGUgZMOpbWFycmVyIDogbGUgbWVuZXVyXG4gKiBwZXJkcmFpdCBzb24gY29ja3BpdCBwb3VyIHVuZSBmYXV0ZSBkZSBmcmFwcGUgZGFucyB1biBzY3JpcHQuIE9uIGxlIHNpZ25hbGUsXG4gKiBldCBvbiBjb250aW51ZS5cbiAqXG4gKiBMZSBgMGAgbcOpcml0ZSB1biBtb3QgOiBjJ2VzdCB1biBwb3J0IHZhbGlkZSBwb3VyIGBsaXN0ZW5gIOKAlCBpbCBkZW1hbmRlIGF1XG4gKiBzeXN0w6htZSBkJ2VuIGF0dHJpYnVlciB1biDigJQgbWFpcyBpY2kgaWwgdm91ZHJhaXQgZGlyZSDCqyBqZSBuJ2FpIHBhcyBjaG9pc2kgwrssXG4gKiBldCBsZXMgw6ljcmFucyBuZSBzYXVyYWllbnQgcGFzIGxlcXVlbCBqb2luZHJlLiBPbiBsZSByZWZ1c2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaXJlUG9ydChcbiAgICB2YWxldXI6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICBkZWZhdXQ6IG51bWJlcixcbiAgICBub206IHN0cmluZyxcbik6IG51bWJlciB7XG4gICAgaWYgKHZhbGV1ciA9PT0gdW5kZWZpbmVkIHx8IHZhbGV1ci50cmltKCkgPT09ICcnKSByZXR1cm4gZGVmYXV0O1xuXG4gICAgY29uc3QgcG9ydCA9IE51bWJlcih2YWxldXIpO1xuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihwb3J0KSB8fCBwb3J0IDwgMSB8fCBwb3J0ID4gNjU1MzUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbUG9ydHNdICR7bm9tfSA9IMKrICR7dmFsZXVyfSDCuyBuJ2VzdCBwYXMgdW4gcG9ydCA6IG9uIGdhcmRlICR7ZGVmYXV0fS5gKTtcbiAgICAgICAgcmV0dXJuIGRlZmF1dDtcbiAgICB9XG4gICAgcmV0dXJuIHBvcnQ7XG59XG5cbi8qKiBMZXMgZGV1eCBwb3J0cywgdGVscyBxdWUgY2UgZMOpbWFycmFnZSBsZXMgZW1wbG9pZXJhLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBvcnRzRGVHbU9zKGVudjogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPik6IHtcbiAgICBzeW5jOiBudW1iZXI7XG4gICAgZmljaGVzOiBudW1iZXI7XG59IHtcbiAgICBjb25zdCBzeW5jID0gbGlyZVBvcnQoZW52W1ZBUklBQkxFX1BPUlRfU1lOQ10sIFBPUlRfU1lOQ19QQVJfREVGQVVULCBWQVJJQUJMRV9QT1JUX1NZTkMpO1xuICAgIGNvbnN0IGZpY2hlcyA9IGxpcmVQb3J0KGVudltWQVJJQUJMRV9QT1JUX0ZJQ0hFU10sIFBPUlRfRklDSEVTX1BBUl9ERUZBVVQsIFZBUklBQkxFX1BPUlRfRklDSEVTKTtcblxuICAgIC8qXG4gICAgICDimqDvuI8gRGV1eCBzZXJ2ZXVycyBzdXIgbGUgbcOqbWUgcG9ydCwgYydlc3QgbGUgc2Vjb25kIHF1aSBuZSBkw6ltYXJyZSBwYXMg4oCUIGV0XG4gICAgICBlbiBzaWxlbmNlLCBwdWlzcXVlIGNoYWN1biBhIGTDqXNvcm1haXMgc2EgZ2FyZGUuIExlIGRpcmUgaWNpIHZhdXQgbWlldXggcXVlXG4gICAgICBkZSBsYWlzc2VyIGNoZXJjaGVyIHBvdXJxdW9pIGxlcyBmaWNoZXMgbidhcnJpdmVudCBwYXMuXG4gICAgKi9cbiAgICBpZiAoc3luYyA9PT0gZmljaGVzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgIGBbUG9ydHNdICR7VkFSSUFCTEVfUE9SVF9TWU5DfSBldCAke1ZBUklBQkxFX1BPUlRfRklDSEVTfSB2YWxlbnQgdG91cyBkZXV4ICR7c3luY30gOiBgICtcbiAgICAgICAgICAgIGBsZSBzZXJ2ZXVyIGRlcyBmaWNoZXMgbmUgZMOpbWFycmVyYSBwYXMuYCxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBzeW5jLCBmaWNoZXMgfTtcbn1cbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLE9BQU8sTUFBTUEsb0JBQW9CLEdBQUcsSUFBSTs7QUFFeEM7QUFDQSxPQUFPLE1BQU1DLHNCQUFzQixHQUFHLElBQUk7QUFFMUMsT0FBTyxNQUFNQyxrQkFBa0IsR0FBRyxnQkFBZ0I7QUFDbEQsT0FBTyxNQUFNQyxvQkFBb0IsR0FBRyxrQkFBa0I7O0FBRXREO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU8sU0FBU0MsUUFBUUEsQ0FDcEJDLE1BQTBCLEVBQzFCQyxNQUFjLEVBQ2RDLEdBQVcsRUFDTDtFQUNOLElBQUlGLE1BQU0sS0FBS0csU0FBUyxJQUFJSCxNQUFNLENBQUNJLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLE9BQU9ILE1BQU07RUFFL0QsTUFBTUksSUFBSSxHQUFHQyxNQUFNLENBQUNOLE1BQU0sQ0FBQztFQUMzQixJQUFJLENBQUNNLE1BQU0sQ0FBQ0MsU0FBUyxDQUFDRixJQUFJLENBQUMsSUFBSUEsSUFBSSxHQUFHLENBQUMsSUFBSUEsSUFBSSxHQUFHLEtBQUssRUFBRTtJQUNyREcsT0FBTyxDQUFDQyxJQUFJLENBQUMsV0FBV1AsR0FBRyxRQUFRRixNQUFNLG1DQUFtQ0MsTUFBTSxHQUFHLENBQUM7SUFDdEYsT0FBT0EsTUFBTTtFQUNqQjtFQUNBLE9BQU9JLElBQUk7QUFDZjs7QUFFQTtBQUNBLE9BQU8sU0FBU0ssV0FBV0EsQ0FBQ0MsR0FBdUMsRUFHakU7RUFDRSxNQUFNQyxJQUFJLEdBQUdiLFFBQVEsQ0FBQ1ksR0FBRyxDQUFDZCxrQkFBa0IsQ0FBQyxFQUFFRixvQkFBb0IsRUFBRUUsa0JBQWtCLENBQUM7RUFDeEYsTUFBTWdCLE1BQU0sR0FBR2QsUUFBUSxDQUFDWSxHQUFHLENBQUNiLG9CQUFvQixDQUFDLEVBQUVGLHNCQUFzQixFQUFFRSxvQkFBb0IsQ0FBQzs7RUFFaEc7QUFDSjtBQUNBO0FBQ0E7QUFDQTtFQUNJLElBQUljLElBQUksS0FBS0MsTUFBTSxFQUFFO0lBQ2pCTCxPQUFPLENBQUNDLElBQUksQ0FDUixXQUFXWixrQkFBa0IsT0FBT0Msb0JBQW9CLHFCQUFxQmMsSUFBSSxLQUFLLEdBQ3RGLHlDQUNKLENBQUM7RUFDTDtFQUVBLE9BQU87SUFBRUEsSUFBSTtJQUFFQztFQUFPLENBQUM7QUFDM0IiLCJpZ25vcmVMaXN0IjpbXX0=