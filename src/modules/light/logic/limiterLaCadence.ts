/**
 * **Un limiteur de cadence, par clé.**
 *
 * ⛔ Le pont Hue tient de l'ordre de **dix commandes par seconde**, toutes
 * lampes confondues, et chaque lampe sous effet a déjà sa propre boucle. Un
 * curseur traîné émet lui, sans se gêner, une valeur par pixel : quelques
 * secondes de glissement suffisent à mettre le pont en retard d'une minute, et
 * ce retard ne se voit pas à l'écran — il se voit dans la pièce.
 *
 * Le limiteur laisse **passer le premier geste tout de suite** (sinon le
 * curseur donnerait l'impression de coller) puis n'en garde plus qu'un par
 * intervalle : la **dernière** valeur demandée, jamais une valeur du milieu.
 * *C'est ce qui compte pour un curseur — on veut voir où la main s'est
 * arrêtée, pas par où elle est passée.*
 *
 * La clé sépare les émetteurs : deux lampes réglées coup sur coup ne se volent
 * pas leur tour.
 */
export interface Limiteur {
    (cle: string, action: () => void): void;
    /** Oublie tout ce qui attend — à appeler quand l'écran qui s'en sert disparaît. */
    annuler: () => void;
}

export const creerLimiteur = (intervalleMs: number): Limiteur => {
    const dernierEnvoi: Record<string, number> = {};
    const enAttente: Record<string, () => void> = {};
    const minuteries: Record<string, ReturnType<typeof setTimeout>> = {};

    const limiteur = ((cle: string, action: () => void) => {
        const maintenant = Date.now();
        const precedent = dernierEnvoi[cle];
        const reste = precedent === undefined ? 0 : intervalleMs - (maintenant - precedent);

        if (reste <= 0) {
            dernierEnvoi[cle] = maintenant;
            action();
            return;
        }

        /* On remplace ce qui attendait : seule la dernière valeur nous intéresse. */
        enAttente[cle] = action;
        if (minuteries[cle]) return;

        minuteries[cle] = setTimeout(() => {
            delete minuteries[cle];
            const derniere = enAttente[cle];
            delete enAttente[cle];
            if (!derniere) return;
            dernierEnvoi[cle] = Date.now();
            derniere();
        }, reste);
    }) as Limiteur;

    limiteur.annuler = () => {
        Object.keys(minuteries).forEach((cle) => {
            clearTimeout(minuteries[cle]);
            delete minuteries[cle];
            delete enAttente[cle];
        });
    };

    return limiteur;
};
