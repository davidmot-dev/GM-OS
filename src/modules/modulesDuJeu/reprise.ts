/** Secret propre au transport privé, renouvelé au redémarrage du serveur. Jamais synchronisé. */
export function lireRepriseDesModules(appareilId: string): string | undefined {
    try { return localStorage.getItem(`gmos:reprise-modules:${appareilId}`) || undefined; } catch { return undefined; }
}
export function enregistrerRepriseDesModules(appareilId: string, jeton: unknown) {
    if (typeof jeton !== 'string' || !/^[a-f0-9]{64}$/.test(jeton)) return;
    try { localStorage.setItem(`gmos:reprise-modules:${appareilId}`, jeton); } catch { /* La connexion actuelle fonctionne ; la reprise exigera un nouveau choix d'appareil. */ }
}
