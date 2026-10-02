/**
 * **Ouvrir le fichier local d'une séance** — le scénario, le PDF, le dossier.
 *
 * Une seule porte pour ce geste, qu'on le fasse depuis le cockpit de campagne
 * ou depuis « Préparer la séance » : *deux portes vers les mêmes données
 * finissent par diverger*, et c'est le refus des exécutables qui divergerait
 * le premier.
 */
export async function ouvrirLeFichierDeLaSeance(
    chemin: string,
    messages: { refuse: string; echec: string },
): Promise<void> {
    const ouvrir = window.appBridge?.openFile;
    /*
      **Hors d'Electron, il n'y a rien à ouvrir** — une tablette n'a pas de
      disque à nous. On montre le chemin, ce que ce bouton faisait déjà.
    */
    if (!ouvrir) {
        alert(chemin);
        return;
    }
    const resultat = await ouvrir(chemin);
    if (resultat?.ouvert) return;
    /*
      *Un bouton doit pouvoir dire pourquoi il n'a rien fait.* Le refus d'un
      exécutable a sa propre phrase : c'est le seul cas où ne rien faire est
      volontaire.
    */
    alert(resultat?.raison === 'extension-executable' ? messages.refuse : messages.echec);
}
