/**
 * **Envoyer un son sur une sortie choisie, sans déplacer les autres.**
 *
 * *Demandé par David le 2026-08-31 :* « dans une séquence de storyboard, est-ce
 * qu'on peut choisir sur quelle sortie une musique, un son, une ambiance doit
 * être jouée ». Il a tranché pour le **vrai routage par son** — deux sons du
 * même module peuvent partir sur deux enceintes **en même temps**.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE N'ÉTAIT PAS QU'UN CHAMP DE PLUS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `setSinkId` ne se pose pas sur un son : il se pose sur un **contexte audio**
 * (Sound-OS, Ambient-OS) ou sur l'unique élément `<audio>` qui porte tout
 * Music-OS. Choisir une sortie déplaçait donc **tout ce que le module joue**.
 *
 * La seule façon d'en router deux à la fois est d'ouvrir une **seconde voie de
 * sortie** : un `MediaStreamAudioDestinationNode`, un élément `<audio>` caché
 * qui en porte le flux, et `setSinkId` sur cet élément-là. C'est exactement ce
 * que Music-OS faisait déjà pour sa voie unique ; on en fait un objet, et on en
 * ouvre autant que de sorties demandées.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QU'UNE VOIE DÉTOURNÉE DOIT GARDER
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Une voie qui partirait droit vers sa destination échapperait au **volume
 * général** et au **ducking de la voix** — le son de la table baisserait quand
 * le meneur parle, sauf celui-là. *Un réglage qui ne vaut plus pour une partie
 * de ce qu'on entend est pire qu'un réglage absent : on le tourne et il ne se
 * passe qu'à moitié quelque chose.*
 *
 * Chaque voie porte donc **sa copie du master et du ducking**, et le moteur les
 * mène ensemble — `canaux` existe pour ça.
 *
 * ⚠️ **Rien ne change tant qu'on ne demande rien.** `canal()` rend `null` pour
 * la sortie par défaut : les sons non routés suivent la chaîne d'origine, avec
 * le réglage global du module. C'est ce qui rend l'ajout sans risque pour tout
 * ce qui marchait hier.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⛔ LE DÉTOUR NE SE PREND QUE POUR ALLER AILLEURS — 2026-09-22
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * David : *« j'ai toujours des problèmes de lag dans Ambient-OS quand j'exécute
 * une séquence ; quand je lance Ambient-OS directement j'ai moins de soucis »*.
 *
 * Les deux gestes ne sortaient pas par le même tuyau :
 *
 * | Geste | Route |
 * | --- | --- |
 * | Une tuile de scène dans Ambient-OS | `AudioContext.setSinkId` — **native** |
 * | La même scène dans une séquence | `MediaStreamAudioDestinationNode` → `<audio>` → `setSinkId` |
 *
 * ⭐ **Et le détour était pris même quand il ne menait nulle part** :
 * `estLaSortieParDefaut` ne reconnaissait que `''` et `'default'`, donc un
 * moment qui nomme *l'enceinte sur laquelle le module est déjà* payait tout le
 * trajet par le flux — son tampon, son ré-échantillonnage — pour arriver
 * exactement là où la chaîne native arrivait. C'est la même famille de cause
 * que les 48 kHz retirés le matin même : *le hoquet ne venait pas du graphe, il
 * venait du transport.*
 *
 * ⚠️ **La reconnaissance se fait sur l'identifiant, et c'est une garantie
 * bornée.** Deux numéros différents peuvent désigner la même enceinte — un
 * identifiant périmé, ou le rôle `'default'` du système face au numéro concret
 * du même appareil. Dans ce cas on garde le détour : *se tromper du bon côté,
 * c'est payer un tuyau de trop, jamais sortir sur la mauvaise enceinte.*
 */

/** Une voie de sortie ouverte vers un appareil nommé. */
export interface CanalDeSortie {
    /** L'appareil visé, tel que `enumerateDevices` le nomme. */
    readonly deviceId: string;
    /** Où les sources se branchent — la copie du master de ce canal. */
    readonly entree: GainNode;
    /** Le ducking de ce canal, à mener comme celui de la voie normale. */
    readonly ducking: GainNode;
    /** L'élément qui porte le flux : c'est lui qui sait sur quoi il sort. */
    readonly element: HTMLAudioElement;
}

/** La sortie par défaut, sous les trois noms qu'elle porte dans les magasins. */
export function estLaSortieParDefaut(deviceId: string | null | undefined): boolean {
    return !deviceId || deviceId === 'default';
}

export class SortiesAudio {
    private readonly context: AudioContext;
    /** Le nom du moteur, pour que le journal dise qui route quoi. */
    private readonly nom: string;
    private readonly ouverts = new Map<string, CanalDeSortie>();
    /**
     * **Ce que le contexte du module porte déjà** — `''` pour la sortie du
     * système. Tant que le moteur ne l'a pas dit, on suppose la sortie par
     * défaut : *c'est l'état d'un contexte sur lequel personne n'a rien posé.*
     */
    private sortieDuModule = '';

    constructor(context: AudioContext, nom: string) {
        this.context = context;
        this.nom = nom;
    }

    /**
     * **Ce que le contexte porte VRAIMENT**, à poser par le moteur juste après
     * son `setSinkId`.
     *
     * ⚠️ **Jamais d'après le magasin.** Une sortie enregistrée peut avoir été
     * retrouvée sous un autre numéro, ou avoir disparu — et le repli sur la
     * sortie par défaut doit se voir ici. *Croire le contexte sur une enceinte
     * qu'il n'a pas ferait renoncer au détour, c'est-à-dire sortir sur la
     * mauvaise enceinte en silence.*
     */
    sortieDuModuleEst(deviceId: string | null | undefined): void {
        this.sortieDuModule = estLaSortieParDefaut(deviceId) ? '' : deviceId!;
    }

    /**
     * **Cette enceinte est-elle celle que le contexte porte déjà ?** Le moteur
     * s'en sert pour ramener dans la chaîne native les pistes qu'un détour
     * servait avant que le meneur ne change la sortie du module.
     */
    estLaSortieDuModule(deviceId: string | null | undefined): boolean {
        return this.sortieDuModule !== '' && deviceId === this.sortieDuModule;
    }

    /** Les voies ouvertes — le moteur y propage volume général et ducking. */
    get canaux(): CanalDeSortie[] {
        return [...this.ouverts.values()];
    }

    /**
     * La voie vers cet appareil, ouverte au besoin.
     *
     * **`null` veut dire « la voie normale »**, et c'est le cas courant : sans
     * sortie demandée, le moteur branche comme il l'a toujours fait.
     */
    canal(deviceId: string | null | undefined): CanalDeSortie | null {
        if (estLaSortieParDefaut(deviceId)) return null;

        /*
          ⛔ **L'enceinte du module est déjà au bout de la chaîne native.**
          Ouvrir une voie détournée vers elle ferait passer le son par le
          pipeline de flux pour arriver au même endroit — c'est le saccadé des
          séquences du 2026-09-22. Voir l'en-tête.
        */
        if (this.estLaSortieDuModule(deviceId)) return null;

        const existant = this.ouverts.get(deviceId!);
        if (existant) return existant;

        const entree = this.context.createGain();
        const ducking = this.context.createGain();
        const destination = this.context.createMediaStreamDestination();
        entree.connect(ducking);
        ducking.connect(destination);

        const element = new Audio();
        element.srcObject = destination.stream;
        // Attaché au DOM comme les platines de Music-OS : sous Electron, un
        // élément détaché perd sa priorité de lecture.
        element.style.display = 'none';
        document.body.appendChild(element);

        const canal: CanalDeSortie = { deviceId: deviceId!, entree, ducking, element };
        this.ouverts.set(deviceId!, canal);

        void this.poserLaSortie(canal);
        void this.jouer(canal);

        return canal;
    }

    /**
     * Pose l'appareil sur l'élément.
     *
     * **Un appareil disparu ne rend pas muet.** On laisse alors l'élément sur la
     * sortie par défaut : le son sort des mauvaises enceintes, ce qui s'entend
     * et se corrige, là où le silence passerait pour une panne du moment.
     */
    private async poserLaSortie(canal: CanalDeSortie): Promise<void> {
        const element = canal.element as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
        if (!element.setSinkId) {
            console.warn(`[${this.nom}] setSinkId indisponible : la sortie choisie sera ignorée.`);
            return;
        }
        try {
            await element.setSinkId(canal.deviceId);
        } catch (e) {
            console.warn(`[${this.nom}] sortie ${canal.deviceId} introuvable, repli sur la sortie par défaut.`, e);
        }
    }

    /** L'autoplay peut refuser : on retentera au prochain geste. Voir `reveiller`. */
    private async jouer(canal: CanalDeSortie): Promise<void> {
        try {
            await canal.element.play();
        } catch {
            console.warn(`[${this.nom}] voie ${canal.deviceId} en attente d'un geste de l'utilisateur.`);
        }
    }

    /**
     * Relance les voies que l'autoplay avait bloquées.
     *
     * À appeler sur un geste du meneur — c'est la même contrainte que celle qui
     * oblige déjà les moteurs à `resume()` leur contexte.
     */
    reveiller(): void {
        for (const canal of this.ouverts.values()) {
            if (canal.element.paused) void this.jouer(canal);
        }
    }

    /** Referme une voie devenue inutile. */
    fermer(deviceId: string): void {
        const canal = this.ouverts.get(deviceId);
        if (!canal) return;
        canal.element.pause();
        canal.element.srcObject = null;
        canal.element.remove();
        canal.entree.disconnect();
        canal.ducking.disconnect();
        this.ouverts.delete(deviceId);
    }

    fermerTout(): void {
        for (const deviceId of [...this.ouverts.keys()]) this.fermer(deviceId);
    }
}
