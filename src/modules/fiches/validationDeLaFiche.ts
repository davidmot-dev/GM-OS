import { verifierLaCorrespondance, type CorrespondanceDeFiche } from './correspondanceDeFiche';

/**
 * **Le validateur des fiches de personnage** — `npm run fiche:valider -- <Jeu>`.
 *
 * Construit le 2026-10-13 avec le cahier des charges des fiches
 * (`documentation/Architecture/Cahier-des-charges-fiche-de-personnage.md`), sur
 * le modèle de `src/theme/validationDuTheme.ts`. Les numéros de règle (§ 2, § 6…)
 * sont ceux du cahier : le rapport se colle tel quel dans *Character Sheet HTML
 * Studio*, qui y retrouve la règle citée.
 *
 * **Ce qu'il vérifie, c'est ce que GM-OS lit** : le manifeste
 * `character-sheet-template`, que le moteur de fiches importe, et rien de ce que
 * la fiche autonome fait pour elle-même — son zoom, son impression, son export
 * restent l'affaire du constructeur (décision de David, 2026-10-13).
 *
 * Fonction pure : elle reçoit des textes et rend un rapport. La lecture des
 * fichiers vit dans `scripts/fiche-valider.mjs`.
 */

export const VERSION_DU_CAHIER = '1.0';

/** Les types que le moteur rend (`renderField`), et les alias que l'import normalise. */
export const TYPES_DE_CHAMP = ['text', 'textarea', 'number', 'checkbox', 'select', 'tracker', 'portrait', 'hotspot'] as const;
const ALIAS_DE_TYPE: Readonly<Record<string, string>> = {
    image: 'portrait', 'tracker-cell': 'hotspot', trackerCell: 'hotspot', 'hotspot-cell': 'hotspot', clickzone: 'hotspot',
};
const OPERATIONS_DERIVEES = ['floor-divide', 'round-divide', 'copy'];

/** Un champ, tel que le manifeste le déclare. */
export interface ChampDeFiche {
    key?: string;
    label?: string;
    type?: string;
    x?: number; y?: number; w?: number; h?: number;
    value?: unknown;
    options?: unknown[];
    legacy?: boolean;
    derive?: { source?: string; operation?: string };
}

/** Un gabarit de fiche : celui du manifeste, ou un gabarit intégré au moteur. */
export interface GabaritDeFiche {
    id: string;
    name?: string;
    system?: string;
    legacySeries?: Record<string, string[]>;
    pages?: { id?: string; width?: number; height?: number; backgroundData?: string; fields?: ChampDeFiche[] }[];
}

export interface ConstatDeFiche {
    gravite: 'erreur' | 'avertissement';
    regle: string;
    message: string;
}

export interface RapportDeFiche {
    fiche: string;
    gabarit?: string;
    accepte: boolean;
    erreurs: ConstatDeFiche[];
    avertissements: ConstatDeFiche[];
    mesures: { pages: number; champs: number; cles: number };
    /** La table de correspondance qui vise ce gabarit, si elle existe. */
    correspondance?: string;
    /** Le gabarit déjà intégré au moteur sous le même identifiant, s'il existe. */
    dansLeMoteur: boolean;
}

const normaliser = (type: string | undefined) => {
    const t = type || 'text';
    return ALIAS_DE_TYPE[t] ?? t;
};

const champsDu = (g: GabaritDeFiche): ChampDeFiche[] => (g.pages ?? []).flatMap(p => p.fields ?? []);

/** Les gabarits intégrés du moteur, lus dans `Character_Sheet_Manager.html`. */
export function gabaritsDuMoteur(source: string): GabaritDeFiche[] {
    const balise = source.indexOf('<script id="builtinTemplates" type="application/json">');
    if (balise < 0) return [];
    const ouvert = source.indexOf('>', balise) + 1;
    try {
        return JSON.parse(source.slice(ouvert, source.indexOf('</script>', ouvert))) as GabaritDeFiche[];
    } catch {
        return [];
    }
}

/** Le bloc `character-sheet-template` d'une fiche, quel que soit l'ordre de ses attributs. */
export function extraireLeManifeste(html: string): { json?: string; absent?: true } {
    const m = /<script\b[^>]*\bid=["']character-sheet-template["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
    return m ? { json: m[1] } : { absent: true };
}

/** Ce qui ferait charger quelque chose depuis le réseau (§ 5). */
function ressourcesDistantes(html: string): string[] {
    const trouvees = new Set<string>();
    const motifs = [
        /<(?:script|img|link|iframe|source|video|audio)\b[^>]*\b(?:src|href)=["'](https?:)?\/\/[^"']+/gi,
        /@import\s+(?:url\()?["']?(https?:)?\/\/[^"')\s;]+/gi,
        /url\(\s*["']?(https?:)?\/\/[^"')\s]+/gi,
    ];
    for (const motif of motifs) {
        for (const m of html.matchAll(motif)) trouvees.add(m[0].slice(0, 90));
    }
    return [...trouvees];
}

export interface EntreeDeFiche {
    /** Le nom affiché dans le rapport, d'ordinaire le chemin de la fiche. */
    fiche: string;
    html: string;
    gabaritsDuMoteur: GabaritDeFiche[];
    correspondances: { chemin: string; table: CorrespondanceDeFiche }[];
}

export function validerLaFiche(entree: EntreeDeFiche): RapportDeFiche {
    const constats: ConstatDeFiche[] = [];
    const erreur = (regle: string, message: string) => constats.push({ gravite: 'erreur', regle, message });
    const avertir = (regle: string, message: string) => constats.push({ gravite: 'avertissement', regle, message });
    const rapport = (gabarit?: GabaritDeFiche, extra: Partial<RapportDeFiche> = {}): RapportDeFiche => {
        const champs = gabarit ? champsDu(gabarit) : [];
        return {
            fiche: entree.fiche,
            gabarit: gabarit?.id,
            accepte: !constats.some(c => c.gravite === 'erreur'),
            erreurs: constats.filter(c => c.gravite === 'erreur'),
            avertissements: constats.filter(c => c.gravite === 'avertissement'),
            mesures: { pages: gabarit?.pages?.length ?? 0, champs: champs.length, cles: new Set(champs.map(c => c.key)).size },
            dansLeMoteur: false,
            ...extra,
        };
    };

    // ---- § 5 · Autonomie : rien ne se charge depuis le réseau ---------------
    for (const distante of ressourcesDistantes(entree.html)) {
        erreur('§ 5', `Ressource distante : « ${distante}… ». La fiche doit fonctionner hors ligne, sur une tablette sans Internet : intègre la ressource dans le HTML.`);
    }

    // ---- § 2 · Le manifeste -------------------------------------------------
    const extrait = extraireLeManifeste(entree.html);
    if (extrait.absent) {
        erreur('§ 2', 'Manifeste absent : aucun bloc `<script type="application/json" id="character-sheet-template">`. Sans lui, le moteur de fiches ne peut pas importer la fiche, et GM-OS ne la voit pas.');
        return rapport();
    }
    let manifeste: { format?: unknown; formatVersion?: unknown; template?: GabaritDeFiche };
    try {
        manifeste = JSON.parse(extrait.json!);
    } catch (e) {
        erreur('§ 2', `Le manifeste n'est pas du JSON valide (${(e as Error).message}).`);
        return rapport();
    }
    if (manifeste.format !== 'character-sheet-studio-html') {
        erreur('§ 2', `« format » vaut ${JSON.stringify(manifeste.format)} ; attendu "character-sheet-studio-html".`);
    }
    if (manifeste.formatVersion !== 1) {
        erreur('§ 2', `« formatVersion » vaut ${JSON.stringify(manifeste.formatVersion)} ; attendu 1.`);
    }
    const gabarit = manifeste.template;
    if (!gabarit || typeof gabarit !== 'object') {
        erreur('§ 2', 'Le manifeste ne porte pas de « template ».');
        return rapport();
    }
    if (!gabarit.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gabarit.id)) {
        erreur('§ 2', `« template.id » vaut ${JSON.stringify(gabarit.id)} : un identifiant en minuscules et tirets est attendu (ex. "blade-runner-fr"). Il ne change JAMAIS d'une version à l'autre.`);
    }
    if (!gabarit.name) erreur('§ 2', '« template.name » manque : c\'est le nom que le meneur voit dans la liste des modèles.');
    if (!gabarit.system) avertir('§ 2', '« template.system » manque : le nom du jeu aide le meneur à reconnaître la fiche.');

    // ---- § 3 · Les pages ----------------------------------------------------
    const pages = gabarit.pages ?? [];
    if (pages.length === 0) erreur('§ 3', 'Le gabarit ne déclare aucune page.');
    pages.forEach((page, i) => {
        const ou = `page ${i + 1}${page.id ? ` (« ${page.id} »)` : ''}`;
        if (!(Number(page.width) > 0) || !(Number(page.height) > 0)) {
            erreur('§ 3', `${ou} : « width » et « height » doivent être des nombres positifs (dimensions natives de la page).`);
        }
        if (!/^data:image\/(png|jpeg|webp);base64,/.test(page.backgroundData ?? '')) {
            erreur('§ 3', `${ou} : « backgroundData » doit intégrer l'image de la page (data:image/png|jpeg|webp;base64,…). Une image référencée par un chemin ne voyage pas avec la fiche.`);
        }
        if (!Array.isArray(page.fields)) erreur('§ 3', `${ou} : « fields » doit être un tableau.`);
    });

    // ---- § 4 · Les champs ---------------------------------------------------
    const champs = champsDu(gabarit);
    const parCle = new Map<string, ChampDeFiche[]>();
    pages.forEach((page, i) => {
        for (const champ of page.fields ?? []) {
            const ou = `page ${i + 1}, champ « ${champ.key ?? champ.label ?? '?'} »`;
            if (!champ.key) { erreur('§ 4', `${ou} : « key » manque.`); continue; }
            const type = normaliser(champ.type);
            if (!(TYPES_DE_CHAMP as readonly string[]).includes(type)) {
                erreur('§ 4', `${ou} : type « ${champ.type} » inconnu (${TYPES_DE_CHAMP.join(', ')}).`);
            }
            const geometrie = [champ.x, champ.y, champ.w, champ.h];
            if (geometrie.some(v => typeof v !== 'number' || !Number.isFinite(v)) || (champ.w ?? 0) <= 0 || (champ.h ?? 0) <= 0) {
                erreur('§ 4', `${ou} : « x », « y », « w », « h » doivent être des nombres, en coordonnées natives de la page.`);
            } else if (Number(page.width) > 0 && Number(page.height) > 0
                && (champ.x! < -2 || champ.y! < -2 || champ.x! + champ.w! > page.width! + 2 || champ.y! + champ.h! > page.height! + 2)) {
                avertir('§ 4', `${ou} : déborde de la page (${page.width} × ${page.height}).`);
            }
            if (type === 'hotspot' && (champ.value === undefined || champ.value === null || champ.value === '')) {
                erreur('§ 4', `${ou} : un hotspot porte la « value » qu'il pose.`);
            }
            if (type === 'select' && !(Array.isArray(champ.options) && champ.options.length > 0)) {
                erreur('§ 4', `${ou} : une liste déroulante déclare ses « options ».`);
            }
            const liste = parCle.get(champ.key) ?? [];
            liste.push({ ...champ, type });
            parCle.set(champ.key, liste);
        }
    });

    for (const [cle, liste] of parCle) {
        if (liste.length < 2) continue;
        if (liste.some(c => c.type !== 'hotspot')) {
            erreur('§ 4', `La clé « ${cle} » est portée par ${liste.length} champs dont au moins un n'est pas un hotspot : seuls les hotspots d'une même piste partagent une clé.`);
            continue;
        }
        const valeurs = liste.map(c => JSON.stringify(c.value));
        if (new Set(valeurs).size !== valeurs.length) {
            erreur('§ 4', `La piste « ${cle} » a deux hotspots de même « value » : on ne saurait pas lequel allumer.`);
        }
        const sortes = new Set(liste.map(c => typeof c.value));
        if (sortes.size > 1) {
            erreur('§ 4', `La piste « ${cle} » mêle des « value » nombres et texte. Un NOMBRE fait une jauge (toutes les cases jusqu'à la valeur s'allument) ; un TEXTE fait un choix (seule la case égale s'allume) : une piste est l'un ou l'autre.`);
        }
    }

    for (const champ of champs) {
        if (!champ.derive) continue;
        const ou = `champ « ${champ.key} »`;
        if (!champ.derive.source || !parCle.has(champ.derive.source)) {
            erreur('§ 4', `${ou} : « derive.source » (${JSON.stringify(champ.derive.source)}) n'est la clé d'aucun champ.`);
        }
        if (!OPERATIONS_DERIVEES.includes(champ.derive.operation ?? '')) {
            erreur('§ 4', `${ou} : opération dérivée « ${champ.derive.operation} » inconnue (${OPERATIONS_DERIVEES.join(', ')}).`);
        }
    }

    /*
      Une piste imprimée encodée en cases indépendantes (`stress.1` … `stress.10`)
      oblige la correspondance à traduire « série contre nombre » ; une piste de
      hotspots EST un nombre. Mesuré sur Blade Runner le 2026-08-24 : converger
      sur le hotspot vaut le cinquième du coût de la correspondance.
    */
    const series = new Map<string, number>();
    const anciennesPistes = new Set<string>();
    for (const [cle, anciennes] of Object.entries(gabarit.legacySeries ?? {})) {
        const piste = champs.filter(c => c.key === cle);
        if (!Array.isArray(anciennes) || !anciennes.length || new Set(anciennes).size !== anciennes.length
            || piste.length !== anciennes.length || piste.some(c => normaliser(c.type) !== 'hotspot' || typeof c.value !== 'number')
            || anciennes.some(k => !champs.some(c => c.key === k && c.type === 'checkbox' && c.legacy === true))) {
            erreur('§ 6', `Migration legacySeries invalide pour « ${cle} » : une piste numérique et toutes ses anciennes cases conservées sont requises.`);
        } else anciennes.forEach(k => anciennesPistes.add(k));
    }
    for (const champ of champs) {
        const m = /^(.*)\.(\d+)$/.exec(champ.key ?? '');
        if (m && normaliser(champ.type) === 'checkbox' && !anciennesPistes.has(champ.key!)) series.set(m[1], (series.get(m[1]) ?? 0) + 1);
    }
    for (const [prefixe, n] of series) {
        if (n >= 3) {
            avertir('§ 4', `« ${prefixe}.1 … ${prefixe}.${n} » : ${n} cases à cocher numérotées. Si c'est une piste (on remplit jusqu'à un niveau), une série de hotspots de valeur 1 à ${n} sous la clé « ${prefixe} » en fait un seul nombre.`);
        }
    }

    // ---- § 6 · Les clés sont un contrat --------------------------------------
    const cles = new Set(parCle.keys());
    const dansLeMoteur = entree.gabaritsDuMoteur.find(g => g.id === gabarit.id);
    if (dansLeMoteur) {
        const anciennes = new Map(champsDu(dansLeMoteur).filter(c => c.key).map(c => [c.key!, normaliser(c.type)]));
        const disparues = [...anciennes.keys()].filter(k => !cles.has(k));
        if (disparues.length) {
            erreur('§ 6', `${disparues.length} clé(s) de la version intégrée au moteur ont disparu : ${disparues.slice(0, 12).join(', ')}${disparues.length > 12 ? '…' : ''}. Une clé ne se renomme JAMAIS : les personnages déjà remplis et la correspondance avec GM-OS la perdraient en silence. Reprends-la telle quelle.`);
        }
        const nouvelles = [...cles].filter(k => !anciennes.has(k));
        if (nouvelles.length) {
            avertir('§ 6', `${nouvelles.length} clé(s) nouvelle(s) par rapport au moteur : ${nouvelles.slice(0, 12).join(', ')}${nouvelles.length > 12 ? '…' : ''}. C'est permis ; la correspondance devra les citer.`);
        }
        for (const [cle, liste] of parCle) {
            const avant = anciennes.get(cle);
            if (avant && avant !== liste[0].type) {
                avertir('§ 6', `La clé « ${cle} » change de type (« ${avant} » → « ${liste[0].type} ») : les valeurs déjà saisies peuvent ne plus s'afficher.`);
            }
        }
    } else if (gabarit.id) {
        avertir('§ 6', `Aucun gabarit « ${gabarit.id} » dans le moteur : c'est une fiche nouvelle. Si elle remplace une fiche existante, elle doit reprendre son identifiant${entree.gabaritsDuMoteur.length ? ` (${entree.gabaritsDuMoteur.map(g => g.id).join(', ')})` : ''}.`);
    }

    // ---- § 7 · La correspondance avec GM-OS ----------------------------------
    const visee = entree.correspondances.find(c => c.table.gabaritDeLaFiche === gabarit.id);
    if (visee) {
        for (const d of verifierLaCorrespondance(visee.table, cles)) {
            (d.gravite === 'erreur' ? erreur : avertir)('§ 7', `${visee.chemin} — ${d.message}`);
        }
    } else if (gabarit.id) {
        avertir('§ 7', `Aucune correspondance ne vise « ${gabarit.id} » : la fiche s'affichera, mais rien de ce qu'on y saisit ne remontera dans GM-OS. Claude Code l'écrit après la livraison.`);
    }

    return rapport(gabarit, { correspondance: visee?.chemin, dansLeMoteur: !!dansLeMoteur });
}

export function rapportEnTexte(r: RapportDeFiche): string {
    const lignes: string[] = [];
    lignes.push(`# Rapport du validateur GM-OS — fiche « ${r.fiche} »`);
    lignes.push('');
    lignes.push(`Cahier des charges des fiches v${VERSION_DU_CAHIER}. **Verdict : ${r.accepte ? 'ACCEPTÉE' : 'REFUSÉE'}** — ${r.erreurs.length} erreur(s), ${r.avertissements.length} avertissement(s).`);
    lignes.push('');
    lignes.push(`Gabarit : \`${r.gabarit ?? 'illisible'}\` · ${r.mesures.pages} page(s), ${r.mesures.champs} champ(s), ${r.mesures.cles} clé(s) · ${r.dansLeMoteur ? 'déjà intégré au moteur' : 'absent du moteur'} · correspondance : ${r.correspondance ? `\`${r.correspondance}\`` : 'aucune'}.`);
    if (r.erreurs.length) {
        lignes.push('', '## Erreurs — à corriger', '');
        r.erreurs.forEach((e, i) => lignes.push(`${i + 1}. [${e.regle}] ${e.message}`));
    }
    if (r.avertissements.length) {
        lignes.push('', '## Avertissements', '');
        r.avertissements.forEach((e, i) => lignes.push(`${i + 1}. [${e.regle}] ${e.message}`));
    }
    return lignes.join('\n') + '\n';
}
