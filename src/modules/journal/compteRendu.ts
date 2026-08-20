import type { Journal, PourLaSuite } from './types';
import type { Acte, Scene } from '../../types/trame.types';
import { actesOrdonnes, scenesOrdonnees, etatDeLaScene } from '../session/logic/trame';

/**
 * Le compte rendu d'une séance, en trois sections.
 *
 * **Structure décidée par David le 2026-08-17**, là où le plan du 2026-08-08
 * disait « avec une structure » sans jamais dire laquelle : le récit de la
 * séance, l'état des lieux à sa clôture, et ce qui reste devant.
 *
 * **Seule la première a besoin d'un modèle.** Les deux autres se calculent — et
 * c'est l'argument que le plan opposait déjà au résumé de combat : *une chaîne
 * construite est instantanée, gratuite, déterministe et fonctionne hors ligne.*
 * Elles allègent d'autant ce qu'on envoie à Ollama, qui se faisait tronquer.
 *
 * **Tout se relève à la clôture, jamais à la lecture.** Un compte rendu est une
 * photographie : relire une séance de mars doit montrer où l'on en était en
 * mars, pas où l'on en est aujourd'hui.
 */

/** Ce qui reste devant, relevé sur la trame au moment où la séance s'arrête. */
export function relevePourLaSuite(
    actes: readonly Acte[],
    scenes: readonly Scene[],
    indices: readonly { campaignId: string; title: string; isRevealed: boolean }[],
    campaignId: string | null | undefined,
): PourLaSuite {
    if (!campaignId) {
        return { scenesNonJouees: [], scenesEnPause: [], indicesNonReveles: [], actesOuverts: [] };
    }

    const mesActes = actesOrdonnes(actes, campaignId);
    /*
      Dans l'ordre de la trame, et non celui du tableau plat : ce compte rendu se
      lit, et une liste de scènes désordonnée ne dit pas où reprendre.
    */
    const dansLOrdre = mesActes.flatMap(a => scenesOrdonnees(scenes, a.id));

    return {
        /*
          Jamais ouvertes, et pas encore closes. Une scène que l'achèvement de
          son acte a barrée sans qu'on y passe n'est plus « à jouer » : elle a
          été écartée, et l'annoncer comme prévue ferait revenir sur une décision
          déjà prise.
        */
        scenesNonJouees: dansLOrdre.filter(s => etatDeLaScene(s) === 'prevue').map(s => s.titre),
        // Celles-ci reprendront seules à la prochaine séance : elles méritent
        // d'être annoncées à part, on ne les « commence » pas, on y revient.
        scenesEnPause: dansLOrdre.filter(s => etatDeLaScene(s) === 'en-pause').map(s => s.titre),
        indicesNonReveles: indices
            .filter(i => i.campaignId === campaignId && !i.isRevealed)
            .map(i => i.title),
        actesOuverts: mesActes.filter(a => !a.acheve).map(a => a.titre),
    };
}

/** Vrai quand il n'y a rien à annoncer — on n'écrit pas une section vide. */
export function laSuiteEstVide(suite: PourLaSuite | undefined): boolean {
    if (!suite) return true;
    return suite.scenesNonJouees.length === 0
        && suite.scenesEnPause.length === 0
        && suite.indicesNonReveles.length === 0
        && suite.actesOuverts.length === 0;
}

const liste = (titre: string, valeurs: readonly string[]): string[] =>
    valeurs.length === 0 ? [] : [`**${titre}**`, ...valeurs.map(v => `- ${v}`), ''];

/**
 * Le compte rendu complet, en Markdown — pour l'écran, l'export et le carnet.
 *
 * **Une section absente ne s'écrit pas.** Un titre suivi de rien se lit comme
 * une perte de données ; l'omettre se lit comme « il n'y avait rien », ce qui
 * est la vérité. Même règle que la pastille de préparation et le résumé vide.
 */
export function rendreLeCompteRendu(journal: Journal): string {
    const lignes: string[] = [`# ${journal.title}`, ''];

    if (journal.resumeIA?.trim()) {
        lignes.push('## Ce qui s’est joué', '', journal.resumeIA.trim(), '');
    }

    const etat = journal.etatDeFin;
    if (etat) {
        const bloc: string[] = [];
        if (etat.presentPCs?.length) {
            bloc.push(...liste('Personnages', etat.presentPCs.map(pc => {
                // Les points de vie ne s'annoncent que si le jeu en compte : un
                // « undefined/undefined » a déjà été écrit ici par le passé.
                const vie = typeof pc.hp === 'number' && typeof pc.maxHp === 'number'
                    ? ` — ${pc.hp}/${pc.maxHp}` : '';
                return `${pc.name}${vie} (${pc.state})`;
            })));
        }
        if (etat.sessionEntities?.length) {
            bloc.push(...liste('PNJ', etat.sessionEntities.map(n => `${n.name} (${n.status})`)));
        }
        if (etat.clocks?.length) {
            bloc.push(...liste('Horloges', etat.clocks.map(c => `${c.name} : ${c.filled}/${c.total}`)));
        }
        if (etat.pendingChecklist?.length) {
            bloc.push(...liste('Préparation restée en plan', etat.pendingChecklist));
        }
        if (bloc.length > 0) lignes.push('## Où en sont les choses', '', ...bloc);
    }

    const suite = journal.pourLaSuite;
    if (!laSuiteEstVide(suite)) {
        lignes.push('## Ce qui attend', '',
            ...liste('Actes encore ouverts', suite!.actesOuverts),
            ...liste('Scènes en pause — elles reprendront', suite!.scenesEnPause),
            ...liste('Scènes jamais jouées', suite!.scenesNonJouees),
            ...liste('Indices non révélés', suite!.indicesNonReveles),
        );
    }

    return lignes.join('\n').trimEnd();
}

/**
 * Le fichier qu'on télécharge quand on exporte une séance.
 *
 * **Le compte rendu, et non le magasin.** L'export téléchargeait
 * `JSON.stringify(journal)` — la forme interne du store, dans un fichier que
 * rien ne sait relire puisqu'il n'existe aucun import de journal. Le seul
 * lecteur possible était un humain, à qui l'on tendait la structure de données
 * plutôt que le texte. Pendant ce temps le bouton « Copier » rendait déjà le
 * compte rendu : *les deux gestes qui sortent une séance de l'application n'en
 * sortaient pas la même chose.*
 *
 * Séparé de la partie navigateur pour être vérifiable : ce qui décide du nom et
 * du contenu est ici, le `Blob` et le clic restent dans l'écran.
 */
export function leFichierDuCompteRendu(journal: Journal): {
    nom: string;
    contenu: string;
    type: string;
} {
    return {
        // Les espaces deviennent des tirets bas, parce qu'un titre de séance en
        // porte toujours et qu'ils survivent mal au trajet jusqu'à un carnet.
        nom: `${journal.title.replace(/\s+/g, '_')}.md`,
        contenu: rendreLeCompteRendu(journal),
        type: 'text/markdown;charset=utf-8',
    };
}
