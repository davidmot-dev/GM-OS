import * as THREE from 'three';

/**
 * **Les faces d'un dé : les regrouper, les numéroter, et savoir les montrer.**
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LE DÉFAUT QUI A MENÉ ICI
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ Le 2026-09-17, David : *« lorsque je jette les dés et que je projette sur
 * Player Hub, les dés en 3D sont affreux »*. Trois causes, dont deux qui ne se
 * règlent pas :
 *
 * | | Ce qu'il y avait |
 * | --- | --- |
 * | **Aucun chiffre** | des solides colorés nus, avec un liseré blanc — *un dé sans chiffres n'est pas un dé* |
 * | **L'atterrissage était tiré au hasard** | `Math.round(Math.random() * 4) * Math.PI / 2` — la face du dessus n'avait **aucun rapport** avec le résultat |
 * | Un matériau de verre sans rien à réfracter | voir `stylesDeDes.ts` |
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⭐ ON NE RÉÉCRIT PAS LES COORDONNÉES, ON REGROUPE PAR FACE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Poser des chiffres sur un polyèdre demande de connaître ses **faces**. Or
 * three.js ne livre que des **triangles** : un dodécaèdre arrive en 36 triangles,
 * pas en 12 pentagones.
 *
 * Le réflexe serait de retaper à la main les sommets des cinq solides de Platon.
 * ⭐ ***C'est exactement le genre de table qu'on recopie mal une fois sur deux, et
 * dont l'erreur ne se voit que sur un dé, en séance.*** On prend donc les
 * géométries de la bibliothèque — vérifiées, elles — et on **regroupe leurs
 * triangles par normale** : les triangles coplanaires d'une même face partagent
 * exactement la même normale.
 */

/** Une face plane du dé, reconstituée depuis les triangles. */
export interface FaceDuDe {
    /** La normale sortante, normalisée. */
    normale: THREE.Vector3;
    /** Le centre de la face. */
    centre: THREE.Vector3;
    /** Les indices de sommets (dans la géométrie non indexée) qui la composent. */
    sommets: number[];
}

/**
 * Deux normales sont-elles la même ? La tolérance absorbe les flottants sans
 * confondre deux faces voisines — sur un d20, deux faces adjacentes font 41°.
 */
const MEME_NORMALE = 1e-3;

/**
 * Rend une géométrie **sans index**, la seule forme sur laquelle ce module
 * travaille.
 *
 * ⚠️ `BoxGeometry` est indexée, les polyèdres ne le sont pas. Les deux formes ne
 * numérotent pas leurs sommets pareil.
 */
export const geometrieAPlat = (geometrie: THREE.BufferGeometry): THREE.BufferGeometry =>
    (geometrie.index ? geometrie.toNonIndexed() : geometrie);

/**
 * Regroupe les triangles d'une géométrie **à plat** en faces planes.
 *
 * ⛔ **Elle refuse une géométrie indexée, et ce refus est le garde-fou.** Une
 * première version dé-indexait ici, en silence : les indices rendus parlaient
 * alors d'une **copie**, pendant que `poserLesChiffres` lisait l'original. Sur un
 * d6 — la seule géométrie indexée du lot — *les chiffres seraient tombés sur les
 * mauvaises faces, et rien n'aurait signalé quoi que ce soit.*
 *
 * ⭐ ***Deux fonctions qui échangent des indices doivent regarder le même
 * tableau ; quand on ne peut pas le garantir, on refuse plutôt que de deviner.***
 */
export const facesDeLaGeometrie = (geometrie: THREE.BufferGeometry): FaceDuDe[] => {
    if (geometrie.index) {
        throw new Error(
            'facesDeLaGeometrie attend une géométrie à plat — passer par geometrieAPlat().',
        );
    }
    const position = geometrie.getAttribute('position');
    const faces: FaceDuDe[] = [];

    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    const normale = new THREE.Vector3();

    for (let t = 0; t < position.count; t += 3) {
        a.fromBufferAttribute(position, t);
        b.fromBufferAttribute(position, t + 1);
        c.fromBufferAttribute(position, t + 2);
        normale.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();

        const existante = faces.find(f => f.normale.distanceTo(normale) < MEME_NORMALE);
        const face = existante ?? { normale: normale.clone(), centre: new THREE.Vector3(), sommets: [] };
        if (!existante) faces.push(face);
        face.sommets.push(t, t + 1, t + 2);
    }

    /* Le centre d'une face est la moyenne de ses sommets **distincts** : un
       sommet partagé par deux triangles du même éventail le tirerait vers lui. */
    faces.forEach(face => {
        const vus = new Map<string, THREE.Vector3>();
        face.sommets.forEach(i => {
            const p = new THREE.Vector3().fromBufferAttribute(position, i);
            vus.set(`${p.x.toFixed(4)},${p.y.toFixed(4)},${p.z.toFixed(4)}`, p);
        });
        vus.forEach(p => face.centre.add(p));
        face.centre.divideScalar(vus.size);
    });

    return faces;
};

/**
 * Numérote les faces, **en gardant la règle des dés réels quand elle s'applique :
 * deux faces opposées font toujours `n + 1`.**
 *
 * ⭐ Ce n'est pas de la coquetterie. Sur un dé posé, on voit la face du dessus
 * *et* les flancs ; un joueur qui connaît ses dés remarque immédiatement un 20
 * collé à un 19. *Ce genre de détail est ce qui sépare un dé d'un caillou peint.*
 *
 * ⚠️ **Le tétraèdre n'a pas de faces opposées** — il n'est pas symétrique par
 * rapport à son centre. Il est donc numéroté à la suite, et c'est correct : un d4
 * réel ne suit pas cette règle non plus.
 */
export const valeursDesFaces = (faces: FaceDuDe[]): number[] => {
    const n = faces.length;
    const valeurs = new Array<number>(n).fill(0);

    /* Un ordre stable : sans lui, deux exécutions numéroteraient différemment et
       aucun essai ne pourrait rien affirmer. */
    const ordre = faces
        .map((f, i) => ({ i, cle: `${f.normale.y.toFixed(4)},${f.normale.x.toFixed(4)},${f.normale.z.toFixed(4)}` }))
        .sort((p, q) => (p.cle < q.cle ? -1 : p.cle > q.cle ? 1 : 0))
        .map(p => p.i);

    let prochaine = 1;
    ordre.forEach(i => {
        if (valeurs[i] !== 0) return;
        /* La face opposée a pu prendre une valeur d'avance : on saute à la
           prochaine encore libre plutôt que d'en réattribuer une. */
        while (prochaine <= n && valeurs.includes(prochaine)) prochaine++;

        valeurs[i] = prochaine;
        const oppose = faces.findIndex((f, j) =>
            j !== i && f.normale.distanceTo(faces[i].normale.clone().negate()) < MEME_NORMALE);
        if (oppose >= 0 && valeurs[oppose] === 0) valeurs[oppose] = n + 1 - prochaine;
        prochaine++;
    });

    return valeurs;
};

/**
 * La rotation qui amène une face **vers le ciel**.
 *
 * ⛔ C'est ce qui manquait : le dé se figeait sur une orientation tirée au sort,
 * donc *le dé ne montrait pas son résultat*. Ici on prend la normale de la face
 * portant la valeur et on l'amène sur `+Y`.
 *
 * Le `lacet` est la liberté qui reste — la rotation autour de la verticale, qui
 * ne change pas quelle face est en haut. On la tire au hasard : *deux dés figés
 * exactement pareil se voient tout de suite.*
 */
export const orientationPourMontrer = (
    normale: THREE.Vector3,
    lacet: number = 0,
): THREE.Quaternion => {
    const versLeHaut = new THREE.Quaternion().setFromUnitVectors(
        normale.clone().normalize(),
        new THREE.Vector3(0, 1, 0),
    );
    const autourDeY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), lacet);
    return autourDeY.multiply(versLeHaut);
};

/**
 * Écrit les coordonnées de texture qui posent **un chiffre par face**.
 *
 * Chaque face reçoit sa case dans un atlas de `colonnes × lignes` cases. Les
 * sommets de la face sont projetés dans le plan de la face, ramenés dans le carré
 * unité, puis déposés dans la case de leur valeur.
 *
 * ⚠️ Le repère du plan est construit **à partir du premier sommet de la face** :
 * le chiffre est donc orienté par rapport à sa propre face, pas par rapport au
 * dé. *C'est ce que font les vrais dés* — sur un d20, les chiffres ne pointent
 * pas tous dans la même direction.
 */
export const poserLesChiffres = (
    geometrie: THREE.BufferGeometry,
    faces: FaceDuDe[],
    valeurs: number[],
    colonnes: number,
    lignes: number,
    /**
     * ⚠️ **Il ne peut pas dépasser 0,5, et ce n'est pas un réglage de goût.**
     *
     * Un sommet est projeté à `dot / rayon`, donc dans `[-1, 1]` ; la case va de
     * 0 à 1 autour de son centre à 0,5. Au-delà de 0,5, les sommets **débordent
     * dans la case voisine** — le dé afficherait des morceaux du chiffre d'à
     * côté. *Une valeur qui paraît être un curseur de confort est en fait une
     * borne géométrique.*
     */
    remplissage = 0.48,
): void => {
    if (remplissage > 0.5) {
        throw new Error('poserLesChiffres : le remplissage dépasse 0,5, les faces déborderaient de leur case.');
    }
    const position = geometrie.getAttribute('position');
    const uv = new Float32Array(position.count * 2);

    const sommet = new THREE.Vector3();
    faces.forEach((face, iFace) => {
        const valeur = valeurs[iFace];
        const colonne = (valeur - 1) % colonnes;
        const ligne = Math.floor((valeur - 1) / colonnes);

        /* Un repère orthonormé du plan de la face. */
        const u = new THREE.Vector3()
            .fromBufferAttribute(position, face.sommets[0])
            .sub(face.centre).normalize();
        const w = new THREE.Vector3().crossVectors(face.normale, u).normalize();

        /* Le rayon de la face, pour ramener n'importe quel polygone au carré. */
        let rayon = 0;
        face.sommets.forEach(i => {
            sommet.fromBufferAttribute(position, i).sub(face.centre);
            rayon = Math.max(rayon, sommet.length());
        });
        if (rayon === 0) rayon = 1;

        face.sommets.forEach(i => {
            sommet.fromBufferAttribute(position, i).sub(face.centre);
            const x = (sommet.dot(u) / rayon) * remplissage + 0.5;
            const y = (sommet.dot(w) / rayon) * remplissage + 0.5;
            uv[i * 2] = (colonne + x) / colonnes;
            uv[i * 2 + 1] = (lignes - ligne - 1 + y) / lignes;
        });
    });

    geometrie.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
};

/**
 * **Le rapport qui rend les cerfs-volants PLANS.**
 *
 * ⛔ La géométrie d'origine posait les pôles à `1,5 r` et l'anneau à `0,5 r`, des
 * « coordonnées standard » recopiées de quelque part. **Elles ne décrivent pas un
 * trapézoèdre** : avec elles, chacun des dix cerfs-volants est *plié* — ses deux
 * triangles n'ont pas la même normale, et le solide a **vingt** facettes au lieu
 * de dix.
 *
 * Personne ne l'avait vu parce que rien ne regardait les faces. *Un dé n'a de
 * faces que le jour où on veut écrire dessus.*
 *
 * La condition de planéité, résolue plutôt que devinée, donne un rapport exact
 * entre la hauteur du pôle et celle de l'anneau :
 *
 * ```
 * hPole / hAnneau = 5 + 2√5 ≈ 9,472
 * ```
 */
export const RAPPORT_DU_TRAPEZOEDRE = 5 + 2 * Math.sqrt(5);

/**
 * **Le vrai d10 : un trapézoèdre pentagonal**, dix faces en cerf-volant.
 *
 * ⚠️ Aucun solide de three.js n'a cette forme — c'est la seule géométrie qu'il
 * faut construire à la main, et elle l'était déjà. Elle vit ici pour être
 * couverte par les mêmes essais que les autres : *une géométrie écrite à la main
 * est précisément celle dont l'erreur ne se verrait qu'en séance.*
 *
 * ⛔ Elle est rendue **à plat** : construite indexée, elle ne pourrait pas
 * traverser `facesDeLaGeometrie`.
 */
export const geometrieDuD10 = (rayon = 1.2): THREE.BufferGeometry => {
    const sommets: number[] = [];
    /* Aussi haut que large : c'est la proportion d'un d10 de jeu. */
    const hPole = rayon;
    const hAnneau = hPole / RAPPORT_DU_TRAPEZOEDRE;
    const rAnneau = rayon;

    sommets.push(0, hPole, 0); // 0 — pôle haut
    for (let i = 0; i < 5; i++) {
        const phi = (i * 72) * (Math.PI / 180);
        sommets.push(rAnneau * Math.cos(phi), hAnneau, rAnneau * Math.sin(phi)); // 1-5
    }
    sommets.push(0, -hPole, 0); // 6 — pôle bas
    for (let i = 0; i < 5; i++) {
        const phi = (i * 72 + 36) * (Math.PI / 180);
        sommets.push(rAnneau * Math.cos(phi), -hAnneau, rAnneau * Math.sin(phi)); // 7-11
    }

    const indices: number[] = [];
    /* Les cerfs-volants du haut : pôle → anneau bas → anneau haut → anneau haut suivant. */
    for (let i = 0; i < 5; i++) {
        const haut = i + 1;
        const hautSuivant = ((i + 1) % 5) + 1;
        const bas = i + 7;
        indices.push(0, bas, haut, 0, hautSuivant, bas);
    }
    /*
      ⛔ **Les cinq cerfs-volants du bas étaient enroulés à l'envers.**

      Leurs normales sortantes pointaient **vers l'intérieur** du dé. Le code
      d'origine compensait avec `side: THREE.DoubleSide`, commenté « Safety for
      visibility » — *la rustine décrivait le symptôme sans nommer la cause*, et
      sous un éclairage correct la moitié basse du d10 se serait éclairée à
      l'envers.

      ⭐ Trouvé par l'essai « deux faces opposées font n + 1 » : les dix normales
      sortaient toutes avec le même `y`, ce qui est impossible sur un solide
      fermé. *Un essai écrit pour la numérotation a trouvé un défaut de géométrie.*
    */
    for (let i = 0; i < 5; i++) {
        const bas = i + 7;
        const basSuivant = ((i + 1) % 5) + 7;
        const hautSuivant = ((i + 1) % 5) + 1;
        indices.push(6, bas, hautSuivant, 6, hautSuivant, basSuivant);
    }

    const geometrie = new THREE.BufferGeometry();
    geometrie.setAttribute('position', new THREE.Float32BufferAttribute(sommets, 3));
    geometrie.setIndex(indices);
    const plate = geometrie.toNonIndexed();
    geometrie.dispose();
    plate.computeVertexNormals();
    return plate;
};
