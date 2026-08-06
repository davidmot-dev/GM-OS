import log from 'electron-log';

/**
 * Journal des événements de sécurité du process principal.
 *
 * Ces événements — rôle privilégié refusé, action non autorisée, accès fichier
 * hors périmètre — étaient jusqu'ici écrits en `console.warn`. Or rien ne
 * collecte la sortie standard du process principal : ils n'apparaissaient donc
 * ni dans le terminal de développement, ni dans `main.log`, qu'electron-log
 * n'alimente qu'à partir des appels `log.*`.
 *
 * Un refus qui ne laisse aucune trace ne vaut pas grand-chose : le lendemain
 * d'une partie, on ne peut plus savoir si quelqu'un a tenté quelque chose.
 * Ce module écrit donc dans le fichier, en plus de la console.
 */

const PREFIX = '[Sécurité]';

function write(level: 'warn' | 'info', message: string) {
    try {
        log[level](PREFIX, message);
    } catch {
        // electron-log indisponible (tests, environnement dégradé) : la console
        // reste préférable au silence.
        console[level](`${PREFIX} ${message}`);
    }
}

/** Refus : rôle non accordé, action non autorisée, accès fichier hors périmètre. */
export function auditDenied(message: string) {
    write('warn', message);
}

/** Événement notable sans refus, par exemple une rotation du secret d'appairage. */
export function auditNotice(message: string) {
    write('info', message);
}
