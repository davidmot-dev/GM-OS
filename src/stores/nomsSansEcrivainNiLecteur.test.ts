import { describe, it, expect } from 'vitest';

/**
 * **Tout nom déclaré dans un magasin a quelqu'un qui l'écrit et quelqu'un qui le
 * lit.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE CONTRÔLE EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Trois fois en un mois, un réglage a été **déclaré, implémenté, documenté dans
 * un guide — et branché à rien** :
 *
 * | Quand | Quoi |
 * | --- | --- |
 * | 2026-09-05 (§ 17) | `timeMultiplier` n'était lu par personne ; `includeSounds` déclaré et lu nulle part |
 * | 2026-09-07 (§ 31) | `isSyncEnabled` lu **dix fois** dans trois modules et **écrit par aucun écran** ; `keyCode` déclaré sans lecteur ni écrivain |
 * | 2026-09-07 (§ 32) | `isMapVideo` lu et passé à `setMap`, **écrit par personne** : une carte vidéo rejouée depuis un moment repartait en image fixe |
 *
 * **Aucun outil ne les voyait.** TypeScript est content : le nom existe et son
 * type est juste. Les tests sont verts : ils exercent ce qui est branché. Une
 * relecture de guide ne les voit pas non plus — *elle trouve ce qu'elle est
 * venue chercher*, et les trois de Light-OS ont survécu à une revue des
 * trente-huit guides.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE TEST FAIT, ET CE QU'IL NE FAIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Il compare des **noms**, pas des références : c'est du texte, pas un graphe
 * d'appels. Il ne peut donc pas prouver qu'un nom est mort — seulement qu'il
 * **n'apparaît nulle part ailleurs que dans son magasin**, ce qui est un signal
 * fort et sans faux négatif dans ce sens-là.
 *
 * D'où la forme retenue : **une liste d'exceptions qui ne doit pas grandir.**
 * Chaque entrée porte sa raison. Un nom neuf qui tombe ici fait échouer le test
 * avec la question à se poser — *qui est censé l'écrire, qui est censé le
 * lire ?* — et deux réponses honnêtes existent : le brancher, ou le supprimer.
 *
 * ⚠️ **Un nom sous six lettres n'est pas examiné** : `id`, `name`, `url`, `type`
 * apparaissent partout pour d'autres raisons, et les compter rendrait ce test
 * bavard sans rien attraper.
 */

const toutesLesSources = import.meta.glob<string>('../**/*.{ts,tsx}', {
    eager: true,
    query: '?raw',
    import: 'default',
});

/*
  ⛔ **Les fichiers de test sont écartés du corpus, et ce n'est pas un détail.**

  Deux raisons, et la seconde a mordu tout de suite :

  1. *Un nom qui n'est cité que par son propre test n'est pas branché.* Du code
     qui n'existe que pour la sonde qui le mesure est exactement ce que ce
     contrôle doit voir.
  2. **Ce fichier-ci écrit les noms tolérés en toutes lettres.** Sans cette
     exclusion il se lisait lui-même, et chaque tolérance se déclarait aussitôt
     « employée ailleurs ». *Un contrôle qui s'inclut dans ce qu'il mesure
     mesure sa propre existence.*
*/
const sources = Object.fromEntries(
    Object.entries(toutesLesSources).filter(([chemin]) => !/\.test\.tsx?$/.test(chemin)),
);

/**
 * Les magasins : tout `use*Store.ts`, plus les fichiers de `src/stores/`.
 *
 * ⚠️ **Les voisins de ce fichier arrivent en `./x.ts`, pas en `../stores/x.ts`.**
 * Le premier filtre écrit ici n'en attrapait donc **aucun** — quinze magasins
 * hors examen, sans que rien ne le dise. C'est la garde du compte, juste en
 * dessous, qui l'a révélé : *un contrôle qui n'examine rien passe au vert.*
 */
const magasins = Object.keys(sources).filter(
    chemin => /use\w*Store\.ts$/.test(chemin) || /^\.\/\w+\.ts$/.test(chemin),
);

/** Les champs et actions déclarés dans un bloc `interface … { … }`. */
const declaration = /^[ \t]{2,8}(\w+)[ \t]*\??:[ \t]/gm;

/**
 * **TOUS** les blocs `interface` de premier niveau du fichier.
 *
 * ⛔ La première version n'en prenait qu'un — le premier — et c'était le défaut
 * le plus grave de ce contrôle : dans `useLightStore.ts`, le premier bloc est
 * `HueLightState`, et l'interface d'état du magasin, `LightState`, n'était
 * **jamais examinée**. Le contrôle passait au vert sur des magasins dont il
 * n'avait rien lu.
 *
 * *Trouvé en dégradant volontairement un magasin* — un champ fantôme ajouté à
 * `LightState` n'a rien déclenché. **Une sonde qui ne réveille pas le défaut ne
 * prouve rien**, et c'est la seule façon de s'en apercevoir.
 */
const blocsDInterface = /\n(?:export )?interface \w+\b[^{]*\{([\s\S]*?)\n\}/g;

/** Six lettres au moins : en dessous, un nom se croise partout par hasard. */
const LONGUEUR_MINIMALE = 6;

/**
 * **Les noms tolérés, et pourquoi.** Cette liste ne doit pas grandir.
 *
 * *Un nom n'est pas fautif parce qu'il est seul* : une action peut n'être
 * appelée que par une autre action du même magasin, et c'est légitime. Ce qui
 * est fautif, c'est de ne pas savoir dans quel cas on est.
 */
const TOLERES: Record<string, string> = {
    // Employés à l'intérieur de leur propre magasin — chaînes internes légitimes.
    'terminerLaFiche': 'appelée par une autre action du même magasin (useImageStore)',
    'removePing': 'appelée par le minuteur de son propre magasin (useMapStore)',
    'showAlert': 'appelée par le raccourci `gmAlert`, dans le même fichier',
    'allumeeLe': "l'instant d'allumage d'une piste, lu par le tri du repli lumineux (useAmbientStore)",
    'creeLe': "l'instant de création d'un gabarit, lu par son propre tri (useBestiaireStore)",
    'imagePrecedente': "le décor qui revient quand une fiche s'en va — écrit et relu dans useImageStore",
    'fogRegistry': 'le cache de brouillard par carte, écrit et relu dans useMapStore',
    'lastSyncedEntityId': "garde-fou contre la resynchronisation d'un même PNJ, lu dans useVoiceStore",
    'daysOfWeek': 'les noms des jours du calendrier, lus par le calcul de date (useClockStore)',
    'hoursPerDay': 'la longueur du jour, lue par le calcul de date (useClockStore)',
    'minutesPerHour': "la longueur de l'heure, lue par le calcul de date (useClockStore)",
    'volumeAvantCoupure': 'le volume retenu pendant une coupure, relu au rétablissement (useAudioMasterStore)',
    'signaturesConnues': "la signature qu'un appareil portait la dernière fois qu'on l'a vu — écrite au recensement et relue par `sortieAEmployer`, dans useHardwareStore",
    /*
      ⭐ **Ces deux-là ont cessé d'être cités ailleurs le 2026-09-12, et c'est le
      correctif.** Les champs des Réglages les lisaient en direct
      (`aliases[deviceId]`) pendant que `setAlias` écrivait sous la signature :
      **le champ refusait la frappe**. Ils passent désormais par
      `aliasDeLaSortie` / `aliasDeLEcran`, qui résolvent dans les deux sens.
      *Un carnet qui ne se lit plus que par ses sélecteurs ne peut plus se
      désaccorder avec son écrivain.*
    */
    'audioAliases': 'le carnet des noms de sorties — lu par `aliasDeLaSortie` et `getAudioLabel`, dans useHardwareStore',
    'displayAliases': "le carnet des noms d'écrans — lu par `aliasDeLEcran` et `getDisplayLabel`, dans useHardwareStore",

    // Écrites, jamais appelées de l'extérieur : code mort assumé, à retirer un jour.
    'projectUrl': 'code mort constaté le 2026-09-07 — aucun appelant, aucun écran',
    'setLinks': 'code mort constaté le 2026-09-07 — les liens s\'ajoutent et se retirent un à un',

    // ⚠️ Réglages complets dont il manque le bouton — décision de David en attente.
    'setBrushSize': '⚠️ 2026-09-07 : `brushSize` est figé à 50, lu par FogEngine et persisté — aucun écran ne l\'offre',
    'setAutoPerformance': '⚠️ 2026-09-07 : `autoPerformanceEnabled` force les graphismes bas et rien ne permet de le contredire',
    'setSeuil': '⚠️ 2026-09-07 : `seuilSansPause` est borné 1-6, donc prévu réglable, et aucun écran ne le règle',
    'attachZoneToToken': '⚠️ 2026-09-07 : aucun écran ne sait attacher une zone de danger à un pion',

    // ⚠️ Déclarés et rien d'autre — ni écrivain, ni lecteur, nulle part.
    'daysPerWeek': "⚠️ 2026-09-07 : UNE SEULE occurrence dans tout le dépôt, sa propre déclaration. Ses trois voisins du calendrier (daysOfWeek, hoursPerDay, minutesPerHour) sont lus par le calcul de date ; celui-là ne l'est pas — la semaine du calendrier n'a jamais eu de longueur",

    // Employés chez eux, mesuré le 2026-09-07 (3 occurrences ou plus dans leur propre magasin).
    'trackVolumes': "les volumes par piste, relus par le magasin des ambiances",
    'dejaConsigne': "garde anti-doublon du journal de combat, relue 16 fois chez elle",
    'ouvertureConsignee': "marque d'ouverture du combat, relue par son propre magasin",
    'faitsDArmes': "les hauts faits du combat, écrits et relus dans useCombatStore",
    'consignerLOuvertureDuCombat': "appelée par les autres actions du combat",
    'setSonie': "appelée par la mesure de sonie du magasin de musique",
    'updateEntityNotes': "appelée par une autre action de useNPCStore",
    'imageAvantLeMoment': "le décor d'avant un moment, relu à sa fermeture (useStoryboardStore)",
    /*
      ⚠️ **`sonsDuMoment` a quitté cette liste le 2026-09-13, et pas parce qu'il a
      changé.** Un module frère (`lumiereDuMoment.ts`) le cite désormais **dans sa
      documentation**, et ce contrôle compare du texte : il ne distingue pas un
      renvoi d'un usage. *Une garde qui lit des noms ne peut pas lire des
      intentions* — c'est écrit dans son en-tête, et c'en est un cas.

      Si ce renvoi disparaît un jour, le contrôle redemandera la tolérance. C'est
      du bruit, mais du bruit qui pose une question plutôt que d'en taire une.
    */
    'lumiereDuMoment': "la scène de lumière posée par un moment, relue à la prise de main suivante et à l'arrêt (useStoryboardStore)",
    'undoStack': "la pile d’annulation du tableau blanc, relue chez elle",
    'redoStack': "la pile de rétablissement du tableau blanc, relue chez elle",
    'loadCalendar': "appelée par une autre action de useClockStore",

    // ⚠️ Déclarés, parfois implémentés, et appelés par PERSONNE — mesuré le 2026-09-07.
    'isRemoteSyncing': "⚠️ useCombatStore : UNE seule occurrence : déclaré, même pas implémenté",
    'resetCombat': "⚠️ useCombatStore : implémentée, aucun appelant",
    'setAnalysisResult': "⚠️ useForgeStore : implémentée, aucun appelant",
    'clearPlaylistPads': "⚠️ useMusicStore : implémentée, aucun appelant",
    'addTime': "⚠️ useClockStore : implémentée, aucun appelant — le temps ne s'avance pas par cette porte",
    'resetTensionClock': "⚠️ useClockStore : implémentée, aucun appelant — une horloge de tension ne se remet pas à zéro",
    'setActiveCalendar': "⚠️ useClockStore : implémentée, aucun appelant — le calendrier actif ne se choisit pas",
    'setGems': "⚠️ useGemStore : implémentée, aucun appelant",
};

/** Les noms déclarés dans `chemin` qui n'apparaissent dans aucun autre fichier. */
function orphelinsDe(chemin: string): string[] {
    const texte = sources[chemin] ?? '';

    const noms = new Set<string>();
    for (const bloc of texte.matchAll(blocsDInterface)) {
        for (const trouve of bloc[1].matchAll(declaration)) {
            if (trouve[1].length >= LONGUEUR_MINIMALE) noms.add(trouve[1]);
        }
    }

    return [...noms].filter(nom => {
        const motif = new RegExp(`\\b${nom}\\b`);
        return !Object.entries(sources).some(
            ([autre, texte]) => autre !== chemin && motif.test(texte),
        );
    });
}

describe('les noms déclarés dans les magasins', () => {
    /**
     * **La garde qui a déjà servi.** Elle a attrapé un filtre de chemins qui ne
     * reconnaissait aucun des quinze magasins de `src/stores/` — *un contrôle
     * qui n'examine rien passe au vert, et c'est la pire des façons d'échouer.*
     */
    it('sont cherchés dans un nombre plausible de magasins', () => {
        expect(magasins.length, `magasins examinés : ${magasins.length}`).toBeGreaterThanOrEqual(30);
    });

    it.each(magasins)('%s : chaque nom est cité ailleurs, ou toléré avec sa raison', (chemin) => {
        const inattendus = orphelinsDe(chemin).filter(nom => !(nom in TOLERES));

        expect(
            inattendus,
            inattendus.length === 0 ? '' :
                `Déclaré dans ${chemin} et cité NULLE PART ailleurs : ${inattendus.join(', ')}.\n` +
                `Qui est censé l'écrire ? Qui est censé le lire ?\n` +
                `Deux réponses honnêtes : le brancher, ou le supprimer. ` +
                `Si le nom n'est employé que dans son propre magasin, l'ajouter à TOLERES avec sa raison.`,
        ).toEqual([]);
    });

    /**
     * *Une tolérance qui survit à sa cause devient un mensonge.* Si un nom toléré
     * se met à être employé ailleurs, sa ligne doit partir — sans quoi la liste
     * grandit sans jamais rétrécir, et cesse de vouloir dire quelque chose.
     */
    it('n’ont pas de tolérance devenue inutile', () => {
        const encoreOrphelins = new Set(magasins.flatMap(orphelinsDe));
        const perimees = Object.keys(TOLERES).filter(nom => !encoreOrphelins.has(nom));

        expect(
            perimees,
            `Ces noms sont désormais employés ailleurs : retirer leur ligne de TOLERES — ${perimees.join(', ')}`,
        ).toEqual([]);
    });
});
