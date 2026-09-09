/**
 * **Ce qu'on accepte d'ouvrir avec l'application par défaut du système.**
 *
 * `shell.openPath` ne « montre » pas un fichier : il le **confie au système**,
 * qui le lance avec ce qui lui est associé. Sur un `.exe`, un `.bat` ou un
 * `.ps1`, cela veut dire **exécuter**.
 *
 * ⚠️ Le chemin vient de la fiche de campagne. Il est donc écrit par le meneur —
 * *mais une campagne s'importe*, archive Nexus comprise, et le champ voyage avec
 * elle. Le geste « ouvrir le fichier de ma campagne » ne doit pas pouvoir
 * devenir « exécuter ce que quelqu'un d'autre y a mis ».
 *
 * D'où une **liste noire d'extensions exécutables** plutôt qu'une liste blanche
 * de formats : un meneur range ses notes dans ce qu'il veut — `.md`, `.pdf`,
 * `.docx`, `.odt`, un tableur —, et une liste blanche l'aurait bloqué sur le
 * premier format auquel personne n'avait pensé. *On nomme ce qui est dangereux,
 * pas ce qui est permis, parce que c'est le premier des deux qui est fini.*
 */
export const EXTENSIONS_EXECUTABLES = [
    '.exe', '.msi', '.msix', '.appx', '.com', '.scr', '.pif',
    '.bat', '.cmd', '.ps1', '.psm1', '.vbs', '.vbe', '.js', '.jse',
    '.wsf', '.wsh', '.hta', '.jar', '.reg', '.inf', '.msc', '.cpl',
    '.lnk', '.url', '.sh', '.command', '.app',
];

export type RaisonDeRefus = 'chemin-vide' | 'extension-executable';

export type VerdictDOuverture =
    | { autorise: true }
    | { autorise: false; raison: RaisonDeRefus };

/**
 * Dit si un chemin peut être confié au système.
 *
 * @param chemin Le chemin tel qu'il vient de la fiche de campagne.
 * @param estUnDossier Un dossier n'a pas d'extension à juger : l'ouvrir revient
 *   à l'afficher dans l'explorateur, et c'est sans danger.
 */
export const verdictDOuverture = (chemin: unknown, estUnDossier = false): VerdictDOuverture => {
    if (typeof chemin !== 'string' || chemin.trim() === '') {
        return { autorise: false, raison: 'chemin-vide' };
    }
    if (estUnDossier) return { autorise: true };

    /*
      **On juge le dernier point, et rien d'autre.** `notes.pdf.exe` est un
      `.exe` — c'est même la forme classique du déguisement. Comparer en
      minuscules : le système Windows, lui, ne fait pas la différence.
    */
    const dernierPoint = chemin.lastIndexOf('.');
    const extension = dernierPoint === -1 ? '' : chemin.slice(dernierPoint).toLowerCase();

    if (EXTENSIONS_EXECUTABLES.includes(extension)) {
        return { autorise: false, raison: 'extension-executable' };
    }

    /*
      **Une absence d'extension passe.** Sous Windows le système demandera avec
      quoi ouvrir — il n'exécute rien tout seul —, et sous Linux un fichier de
      notes sans extension est ordinaire. *Refuser ici bloquerait des cas
      légitimes sans fermer le vecteur, qui est l'extension associée.*
    */
    return { autorise: true };
};
