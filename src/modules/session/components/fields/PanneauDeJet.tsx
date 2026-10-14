import React, { Fragment, useMemo, useState } from 'react';
import { Dices, AlertTriangle, Info, Plus, Minus, Coins } from 'lucide-react';
import { EtiquetteDuDegre } from '../../../dice/EtiquetteDuDegre';
import { consignerLeJet } from '../../../journal/consignerLeJet';
import { DiceEngine, type RollResult } from '../../../dice/DiceEngine';
import {
    preparerLeJet, sectionsDeLaComposante, verdict,
    type ComposanteDeJet, type DescripteurDeJet,
} from '../../../dice/DescripteurDeJet';
import { ventilerLaDepense, type RessourceDeTable } from '../../../table/RessourcesDeTable';
import { useRessourcesDeTableStore } from '../../../table/useRessourcesDeTableStore';
import { apportsDisponibles, effetDesApports, idDeReserveDuGroupe, niveauDuGroupe, type ApportDisponible } from '../../../table/reservesDuGroupe';
import { malusDePeril, resoudreLeDestin } from '../../../dice/systemes/nocturne';
import {
    lancerUneChaine, lancerLaPossibilite, ceQueLAnnulationAnnule, resoudreTorg, ND_DE_L_ANNULATION,
    type DesDeTorg, type OptionsDeTorg,
} from '../../../dice/systemes/torg';
import {
    cumulDePanique, entreeDeLaTable, forcerLeJet, pourquoiNePasForcer, prixDuForcage, testDePanique,
    type FamilleYearZero,
} from '../../../dice/systemes/yearZero';
import { pontDesTables } from '../../../tables/pontDesTables';
import type { TableEntry } from '../../../tables/types';
import { useEffetsDuRound } from '../../../combat/useEffetsDuRound';
import { useCosmsCourants } from '../../hooks/useCosmsCourants';
import { loiEnVigueur } from '../../logic/cosmsCourants';
import { useSessionOSStore } from '../../useSessionOSStore';
import { tousLesPilotes } from '../../store/tousLesPilotes';
import { appliquerAuGroupe } from '../../logic/groupeDeLaCampagne';
import ApportsDuGroupe from './ApportsDuGroupe';
import type { SheetTemplate } from '../../../../data/defaultSheetTemplates';
import type { DiceConfig } from '../../../../types/drivers';

/**
 * Lancer depuis la fiche de personnage.
 *
 * **Ce qu'il change.** Jusqu'ici la fiche était un formulaire : on y notait des
 * valeurs qu'il fallait reporter à la main dans Dice OS pour lancer. Le seuil,
 * chez Dune, se calcule à partir de deux champs de la fiche — une compétence et
 * un principe — et personne ne pouvait faire ce calcul à la place du joueur.
 *
 * **Le résultat reste sur la fiche**, à côté des valeurs qui l'ont produit. On
 * voit d'où vient le seuil, ce qui est la moitié de l'intérêt : un jet dont on
 * ne sait pas de quoi il est fait ne se vérifie pas.
 *
 * Le panneau ne s'affiche que si le pilote décrit ses jets. Un système sans
 * descripteur garde sa fiche telle quelle, sans bouton mort.
 */
/** Ce que le sélecteur affiche, et ce que le journal de séance retient. */
const LIBELLES = { avantage: 'Avantage', desavantage: 'Désavantage' } as const;

interface PanneauDeJetProps {
    descripteur: DescripteurDeJet;
    dice: DiceConfig;
    template: SheetTemplate;
    /** Valeurs courantes de la fiche, telles que l'éditeur les tient. */
    valeurs: Record<string, unknown>;
    /**
     * De quoi faire payer les dés et créditer l'excédent.
     *
     * Les deux facultatifs et solidaires : un système sans monnaie de table
     * garde le panneau tel quel, les dés y sont simplement gratuits.
     */
    campaignId?: string;
    ressourcesDeTable?: RessourceDeTable[];
    /**
     * Le panneau tourne sur la tablette d'un joueur.
     *
     * Le jet est **exactement le même** — mêmes dés, même seuil, même règle :
     * *un jet qui change selon l'écran d'où on le lance n'est pas le même jet.*
     * Seule la dépense change de chemin : elle doit remonter au meneur au lieu
     * de rester dans la fenêtre où elle a été faite.
     */
    pourLesJoueurs?: boolean;
    /**
     * Le personnage qui lance, sur la tablette : son jet **remonte au meneur**
     * (`fiche:resultat`) au lieu de s'écrire dans le journal de la tablette,
     * que personne ne lit (demandé par David le 2026-09-30).
     */
    personnageId?: string;
    /**
     * Écrit sur la fiche du personnage ce que ses réserves ont donné — le Vécu,
     * l'Espoir, la Singularité d'un Héros de NOC. Sans elle, ces réserves ne se
     * proposent pas : on ne dépense pas ce qu'on ne saurait décompter.
     */
    ecrireSurLaFiche?: (maj: Record<string, unknown>) => void;
}

const PanneauDeJet: React.FC<PanneauDeJetProps> = ({
    descripteur, dice, template, valeurs, campaignId, ressourcesDeTable, pourLesJoueurs = false, personnageId,
    ecrireSurLaFiche,
}) => {
    /** Champ retenu pour chaque composante — `{ competence: 'combat' }`. */
    const [choix, setChoix] = useState<Record<string, string>>({});
    const [desAchetes, setDesAchetes] = useState(0);
    // Un jeu sans difficulté déclarée n'en affiche pas, et part de zéro : chez
    // Alien, un seul six suffit — il n'y a pas de seuil à atteindre.
    const [difficulte, setDifficulte] = useState(descripteur.difficulte?.defaut ?? 0);
    /**
     * L'ajustement de difficulté — **et ce n'est pas la même chose que
     * `difficulte`**, qui compte des réussites à atteindre. Celui-ci déplace la
     * colonne de la table et change le pourcentage. Zéro est la difficulté
     * moyenne, et c'est pourquoi il est le défaut.
     */
    const [ajustementDeDifficulte, setAjustementDeDifficulte] = useState(0);
    const [resultat, setResultat] = useState<RollResult | null>(null);
    const [seuilDuLancer, setSeuilDuLancer] = useState(0);
    /**
     * Avantage, désavantage, ou rien — **la règle de Dice OS**, et c'est
     * délibérément la même : *un jet qui change selon l'écran d'où on le lance
     * n'est pas le même jet.* On lance deux dés et on garde le meilleur, ou le
     * moins bon ; « meilleur » se lit selon le sens du comptage, donc le PLUS
     * BAS sur un jeu qui jette sous un seuil.
     */
    const [modificateur, setModificateur] = useState<'aucun' | 'avantage' | 'desavantage'>('aucun');
    /** La spécialisation s'applique à ce jet — c'est le joueur qui le sait (Star Trek). */
    const [specialisation, setSpecialisation] = useState(false);
    /** Ce que le dernier lancer a fait aux réserves de la table. */
    const [mouvements, setMouvements] = useState<string[]>([]);

    const { etatDe, depenser, gagner, ajusterDepuisLaTablette } = useRessourcesDeTableStore();
    const monnaie = useMemo(
        () => campaignId && ressourcesDeTable?.length ? { campaignId, ressourcesDeTable } : null,
        [campaignId, ressourcesDeTable],
    );

    /**
     * **Ce que le groupe apporte au jet** — la Cabale de NOC (2026-10-13) : les
     * dés de ses Domaines, son Espoir, son Vécu, ses Atouts. Le groupe est celui
     * de la campagne où l'on joue, déclaré par son pilote.
     *
     * Absent des dés échelonnés : ils décident seuls de leur poignée, et une
     * réserve ajoutée n'y aurait pas de sens.
     */
    const campagnes = useSessionOSStore(s => s.campaigns);
    const pilotesPerso = useSessionOSStore(s => s.customGameDrivers);
    const updateCampaign = useSessionOSStore(s => s.updateCampaign);
    const remoteEcrireLeGroupe = useSessionOSStore(s => s.remoteEcrireLeGroupe);
    const campagne = campaignId ? campagnes.find(c => c.id === campaignId) : undefined;
    const ficheDeGroupe = campagne
        ? tousLesPilotes(pilotesPerso).find(d => d.id === campagne.system)?.ficheDeGroupe
        : undefined;
    const apports = descripteur.desEchelonnes ? [] : (ficheDeGroupe?.apports ?? []);
    const [engages, setEngages] = useState<Record<string, number>>({});
    /** Le bonus que le groupe a donné au dernier lancer — dit à côté des réussites. */
    const [bonusDuLancer, setBonusDuLancer] = useState(0);
    const [choixDesApports, setChoixDesApports] = useState<Record<string, string>>({});
    const etatDesReserves = monnaie ? etatDe(monnaie.campaignId, monnaie.ressourcesDeTable) : {};
    const disponibles = apportsDisponibles(
        apports, choix, choixDesApports, engages, campagne?.groupe?.sheetData, etatDesReserves,
    );
    const { des: desDuGroupe, bonus: bonusDuGroupe, annule: annuleDuGroupe } = effetDesApports(disponibles);

    /*
      **Les réserves du personnage** — le Vécu, l'Espoir, la Singularité d'un Héros
      de NOC. Même forme que les apports du groupe ; les stocks se lisent sur SA
      fiche et s'y décomptent, par `ecrireSurLaFiche`.
    */
    const reservesPerso = ecrireSurLaFiche && !descripteur.desEchelonnes ? (descripteur.reservesDuPersonnage ?? []) : [];
    const [engagesPerso, setEngagesPerso] = useState<Record<string, number>>({});
    const disponiblesPerso = apportsDisponibles(reservesPerso, choix, {}, engagesPerso, valeurs, {});
    const { des: desPerso, bonus: bonusPerso, annule: annulePerso } = effetDesApports(disponiblesPerso);

    /** Ce qui reste dans un stock précis — pour proposer les Atouts encore garnis. */
    const resteDe = (apportId: string, champ: string) => {
        const apport = apports.find(a => a.id === apportId);
        if (!apport) return 0;
        return Math.max(0, apport.epuisement === 'piste'
            ? niveauDuGroupe(campagne?.groupe?.sheetData, champ)
            : (etatDesReserves[idDeReserveDuGroupe(champ)] ?? 0));
    };

    /**
     * Débiter ou créditer la réserve, du bon côté du réseau.
     *
     * Sur la tablette, `depenser` n'écrirait que dans la fenêtre du joueur : sa
     * réserve baisserait chez lui et nulle part ailleurs, ce qui est pire que
     * de ne pas la lui donner — deux tables joueraient avec deux Impulsions.
     *
     * `motif` accompagne le mouvement jusqu'au journal de séance : *une
     * Impulsion qui passe de quatre à un ne veut rien dire sans le jet qui l'a
     * dépensée.*
     */
    const mouvoir = (id: string, delta: number, motif: string) => {
        if (!monnaie) return { avertissements: [] as string[] };
        if (pourLesJoueurs) {
            return ajusterDepuisLaTablette(monnaie.campaignId, monnaie.ressourcesDeTable, id, delta, motif);
        }
        return delta < 0
            ? depenser(monnaie.campaignId, monnaie.ressourcesDeTable, id, -delta, motif)
            : gagner(monnaie.campaignId, monnaie.ressourcesDeTable, id, delta, motif);
    };

    /**
     * Les champs proposés pour une composante, **groupés par sous-groupe**.
     *
     * **La résolution est partagée avec `preparerLeJet`**, et c'est essentiel :
     * un menu rempli depuis une section que le calcul ignorerait — ou l'inverse
     * — rendrait un jet dont l'écran et le moteur ne parlent plus du même
     * endroit de la fiche.
     *
     * **On rend les sections, pas une liste à plat de champs.** Chez Rêves de
     * Dragons une composante peut couvrir plusieurs sous-groupes de compétences,
     * et fondre trente entrées en une seule liste rendrait le menu illisible là
     * où il sert : à table, de loin, en parlant. Les sections deviennent des
     * `optgroup`, ce qui garde le geste que le meneur connaît — le sous-groupe,
     * puis la compétence — **en un seul menu au lieu de deux.**
     */
    const sousGroupesDe = (composante: ComposanteDeJet) =>
        sectionsDeLaComposante(template.sections, composante).sections;

    const jet = useMemo(
        () => preparerLeJet(
            descripteur, valeurs,
            {
                champs: choix, desSupplementaires: desAchetes, difficulte, ajustementDeDifficulte, specialisation,
                /*
                  Sur un jeu à dés échelonnés, avantage et désavantage ajoutent
                  ou retirent un DÉ : c'est `preparerLeJet` qui les applique à la
                  poignée. Ailleurs, ils font garder un dé sur deux, et c'est
                  `rollAdvantage` — deux mécaniques, un seul sélecteur à l'écran.
                */
                modificateurDeDes: descripteur.desEchelonnes ? modificateur : 'aucun',
            },
            template.sections,
        ),
        [descripteur, valeurs, choix, desAchetes, difficulte, ajustementDeDifficulte, modificateur, specialisation, template.sections],
    );

    /*
      **Provoquer le destin** (NOC). Le plafond des dés est le Domaine, moins les
      malus de péril ; le joueur en lance autant qu'il veut, de zéro au plafond.
      `null` : il n'a pas touché au compte, on propose le plafond.
    */
    const destin = descripteur.destin;
    const malus = destin?.peril ? malusDePeril(destin.peril, valeurs) : { domaines: 0, talents: 0, etats: [] as string[] };
    const plafondDuDestin = destin ? Math.max(0, jet.nombreDeDes - malus.domaines) : 0;
    const [desDeDestin, setDesDeDestin] = useState<number | null>(null);
    const desLances = Math.min(desDeDestin ?? plafondDuDestin, plafondDuDestin);
    /*
      **Torg : le test se complète APRÈS le premier dé** — la Possibilité se
      dépense quand on a vu le dé, la compétence favorisée relance le premier,
      « Un de plus ! » vient de la carte d'action. On garde donc les dés du
      dernier test pour les compléter (carnet « Torg », 2026-10-13).
    */
    const torg = descripteur.tableDeBonus === 'torg';
    /** Une compétence facultative laissée vide : sans entraînement, le 20 n'explose pas. */
    const entraine = !(descripteur.seuil ?? []).some(c => c.facultative && !choix[c.id]);
    const blessuresTorg = torg && descripteur.torg?.blessures
        ? Math.min(3, Math.max(0, niveauDuGroupe(valeurs, descripteur.torg.blessures))) : 0;
    const possibilitesTorg = torg && descripteur.torg?.possibilites
        ? Math.max(0, niveauDuGroupe(valeurs, descripteur.torg.possibilites)) : 0;
    /*
      **La carte d'Action du round** (2026-10-13) : le panneau de jet est celui
      des fiches de personnage, donc des Héros. « Déstabilisés » retire 2 au
      total d'action ; « Un de plus ! » se signale sur son bouton.
    */
    const effetsDuRound = useEffetsDuRound('joueurs');
    const destabilises = torg && effetsDuRound.includes('destabilises');
    const unDePlusDeLaCarte = torg && effetsDuRound.includes('un-de-plus');
    const malusTorg = blessuresTorg + (destabilises ? 2 : 0);
    const raisonsDuMalusTorg = [
        blessuresTorg ? `${blessuresTorg} Blessure${blessuresTorg > 1 ? 's' : ''}` : '',
        destabilises ? 'Déstabilisés (carte d’Action)' : '',
    ].filter(Boolean).join(', ');
    const [plageCritique, setPlageCritique] = useState(1);
    const [testDeTorg, setTestDeTorg] = useState<{
        des: DesDeTorg; options: OptionsDeTorg; niveau: number; difficulte: number; entraine: boolean; titre: string;
    } | null>(null);

    /*
      **Forcer le jet** (Year Zero, 2026-10-14 — `systemes/yearZero.ts`). Le
      forçage se décide APRÈS avoir vu les dés : on garde le dernier lancer, ce
      que le joueur avait retenu sur sa fiche, et ce que les forçages y ont déjà
      écrit — sur la tablette, la fiche ne revient du meneur qu'après coup, et un
      second forçage de réplicant ne doit pas relire l'ancienne Santé.
    */
    const regleDuForcage = descripteur.forcer && (descripteur.reserve || descripteur.desEchelonnes) && !torg && !destin
        ? descripteur.forcer : undefined;
    const familleYearZero: FamilleYearZero = descripteur.desEchelonnes ? 'echelonnee' : 'reserve';
    const libelleDuUn = descripteur.reserve?.secondaire?.libelleDuUn;
    const [dernierLancer, setDernierLancer] = useState<{
        titre: string;
        choix: Record<string, string>;
        /** Le champ de la seconde réserve — le Niveau de Stress d'Alien. */
        seconde?: { champ: string; label: string };
    } | null>(null);
    const [forcage, setForcage] = useState<{ fois: number; unsPayes: number; ecrits: Record<string, number> }>(
        { fois: 0, unsPayes: 0, ecrits: {} },
    );
    const [paniqueJouee, setPaniqueJouee] = useState<{
        de: number; niveau: number; total: number; entree?: TableEntry;
        /** Le total qui s'applique, après le cumul avec une panique en cours. */
        effectif: number; precedent: number; cumule: boolean;
    } | null>(null);
    const lireLeNombre = (champ: string) => forcage.ecrits[champ] ?? (Number(valeurs[champ]) || 0);

    /*
      **Les Lois du Monde du cosm courant** (Torg, 2026-10-14) : la Loi de l'Action
      (une seconde Possibilité, la meilleure compte), la Persévérance (Annulation
      réduite), la Magie (Choc volontaire en bonus aux compétences magiques).
    */
    const cosms = useCosmsCourants();
    const loiAction = torg ? loiEnVigueur(cosms, 'action') : undefined;
    const loiPerseverance = torg ? loiEnVigueur(cosms, 'perseverance') : undefined;
    const loiMagie = torg ? loiEnVigueur(cosms, 'magie') : undefined;
    /** La compétence magique retenue pour ce jet, s'il y en a une. */
    const champMagique = loiMagie ? Object.values(choix).find(c => loiMagie.competences?.includes(c)) : undefined;
    /** « Jusqu'à un maximum égal à son nombre de rangs dans la compétence utilisée. » */
    const rangsMagiques = champMagique ? Math.max(0, Number(valeurs[champMagique]) || 0) : 0;
    const [chocVolontaire, setChocVolontaire] = useState(0);
    const chocDeMagie = champMagique && descripteur.torg?.choc && ecrireSurLaFiche ? Math.min(chocVolontaire, rangsMagiques) : 0;
    /** Les Possibilités restantes, y compris celles que ce jet vient de dépenser. */
    const possibilitesRestantes = descripteur.torg?.possibilites
        ? (forcage.ecrits[descripteur.torg.possibilites] ?? possibilitesTorg) : 0;

    /** Le niveau du Talent, malus retirés, Vécu et Atouts ajoutés — avant les dés. */
    const niveauDuDestin = jet.seuil - malus.talents + bonusPerso + bonusDuGroupe;

    /*
      **Le seuil composé ne remplace un seuil fixe que s'il existe.**

      Le panneau écrasait `dice.successThreshold` par `jet.seuil` dans tous les
      cas. Or un jeu à réserve n'en compose aucun : `jet.seuil` vaut alors
      **zéro**, et `rollFromConfig` traite ce zéro comme une absence —
      `(… ?? config.successThreshold) || 10`. Un pilote déclarant « chaque six
      est une réussite » aurait donc lancé contre **dix**.

      Alien y échappait par chance : son moteur `yze` court-circuite ce chemin et
      compte les six en dur. Le défaut n'attendait que le premier jeu à réserve
      déclarant un autre moteur.
    */
    const seuilDuMoteur = jet.composantes.length > 0 ? jet.seuil : dice.successThreshold;

    /**
     * L'Avantage ne s'offre que là où il veut dire quelque chose.
     *
     * *Lancer un dé de plus et garder celui qu'on préfère* suppose qu'un seul
     * dé tranche, et qu'il y ait une valeur à comparer. Sur une réserve il n'y a
     * pas de « meilleur dé », il y a un compte de réussites — proposer le
     * sélecteur là inviterait à inventer une règle que le jeu n'a pas, ce que
     * l'outil ne fait jamais.
     *
     * La liste des moteurs qui résolvent eux-mêmes vit dans `DiceEngine`, et
     * nulle part ailleurs : recopiée ici, elle dériverait.
     */
    const avantagePossible = descripteur.tableDeBonus
        // Torg n'a pas d'avantage : son dé se relance quand il explose, il ne se double pas.
        ? false
        : descripteur.desEchelonnes
        // Sur les dés échelonnés, le livre les décrit explicitement : un
        // troisième dé copié du plus petit, ou le plus petit retiré.
        ? jet.desEchelonnes.length > 0
        : DiceEngine.unSeulDeDecide(dice.engine, jet.nombreDeDes) && !!seuilDuMoteur;

    /**
     * **Tout ce que le joueur doit retenir sur sa fiche, en une seule liste.**
     *
     * Elle vivait en deux exemplaires — l'une pour savoir si le jet est prêt,
     * l'autre pour dessiner les menus — et elles ne portaient pas le même ordre.
     * *Deux listes de la même chose finissent par diverger* : ajouter la cible
     * à l'une seulement aurait donné un menu qu'on ne peut pas remplir, ou un
     * bouton qui part sans caractéristique.
     */
    const composantesARetenir = useMemo(() => [
        /*
          **Ce que les dés échelonnés décident, ils le décident seuls.**

          La Forge enrichit sans jamais remplacer : un pilote qui portait déjà un
          `seuil` le garde après une nouvelle dérivation. Continuer à réclamer
          ses composantes demanderait au joueur de choisir deux fois la même
          chose — et le bouton resterait gris sur un pilote pourtant corrigé.
          `preparerLeJet` applique la même préséance.
        */
        ...(descripteur.desEchelonnes
            ? descripteur.desEchelonnes.composantes
            : [
                ...(descripteur.cible ? [descripteur.cible.caracteristique] : []),
                ...(descripteur.cible?.ajustement ?? []),
                ...(descripteur.seuil ?? []),
            ]),
        ...(descripteur.reserve?.composantes ?? []),
        ...(descripteur.reserve?.secondaire?.composantes ?? []),
    ], [descripteur]);

    /** Rien ne part tant que chaque composante n'a pas son champ. */
    // Un jeu qui ne compose rien depuis la fiche est prêt d'emblée. Les
    // composantes de la réserve comptent autant que celles du seuil : lancer
    // sans attribut ni compétence donnerait une poignée de dés arbitraire.
    const pret = composantesARetenir.every(c => c.facultative || choix[c.id]) && jet.avertissements.length === 0;

    /**
     * D'où sortiront les points, **avant** de lancer.
     *
     * Chez Dune, les dés qu'on ne peut pas payer en Impulsion se paient en
     * Menace : la dépense alimente la réserve du meneur. Ce n'est jamais une
     * surprise acceptable — donc on l'annonce, et le joueur décide ensuite.
     */
    const ventilation = useMemo(() => {
        if (!monnaie || !jet.cout.ressource || jet.cout.total === 0) return null;
        const etat = etatDe(monnaie.campaignId, monnaie.ressourcesDeTable);
        return ventilerLaDepense(monnaie.ressourcesDeTable, etat, jet.cout.ressource, jet.cout.total);
    }, [monnaie, jet.cout.ressource, jet.cout.total, etatDe]);

    const nomDe = (id?: string) =>
        ressourcesDeTable?.find(r => r.id === id)?.label ?? id ?? '';

    const lancer = () => {
        const dits: string[] = [];
        // Un nouveau jet : rien n'est encore forcé, aucune Panique n'est jouée.
        setForcage({ fois: 0, unsPayes: 0, ecrits: {} });
        setPaniqueJouee(null);
        setDernierLancer(null);

        // Le coût se prélève au moment où l'on s'engage, pas pendant qu'on
        // tourne les boutons : régler avant de lancer ferait payer les
        // hésitations.
        /**
         * Ce que le jet a coûté, dit au journal avec ce qui l'a composé.
         *
         * « Jet : Combat + Devoir (seuil 11), 2 dés achetés » — relire une
         * séance et y trouver une Impulsion tombée de quatre à un sans savoir
         * pourquoi ne renseigne sur rien.
         */
        const dit = modificateur === 'aucun' ? '' : ` avec ${LIBELLES[modificateur]}`;
        /*
          Une poignée échelonnée se dit dé par dé — « D10 + D6 » —, jamais
          « 2d10 » : les deux dés n'ont pas la même taille, et c'est justement
          ce que le joueur doit retrouver en relisant sa séance.
        */
        const poigneeDite = jet.desEchelonnes.map(d => `D${d.faces}`).join(' + ');
        const enTete = (jet.composantes.length > 0
            ? `Jet : ${jet.composantes.map(c => c.label).join(' + ')} (seuil ${jet.seuil})`
            : jet.desEchelonnes.length > 0
                ? `Jet : ${poigneeDite}`
                : `Jet : ${jet.nombreDeDes}d${jet.faces}`) + dit;

        /*
          **Ce qu'on a puisé dans le groupe part avec le lancer.** Une piste
          (l'Espoir de la Cabale) descend sur sa feuille — par le meneur, ou par
          la tablette qui le prévient ; une réserve de scénario (les dés d'un
          Domaine) se débite comme toute réserve de table.
        */
        const engagesDuGroupe = disponibles.filter(d => d.points > 0 && d.stock);
        const engagesPerso = disponiblesPerso.filter(d => d.points > 0 && d.stock);

        /**
         * Dépense ce que des apports ont donné. `combien` dit ce qui part
         * vraiment : tout ce qu'on a engagé pour des dés ou un bonus, mais
         * seulement les 1 effectivement annulés pour la Singularité.
         */
        const depenser = (liste: ApportDisponible[], porteur: 'groupe' | 'personnage', combien: (d: ApportDisponible) => number) => {
            const surLaFeuille: Record<string, number> = {};
            for (const d of liste) {
                const n = combien(d);
                if (n <= 0 || !d.stock) continue;
                const nom = d.apport.stocks.length > 1 ? `${d.apport.label} (${d.stock.label})` : d.apport.label;
                dits.push(`${nom} −${n} → ${d.reste - n}`);
                if (d.apport.epuisement === 'piste') surLaFeuille[d.stock.champ] = d.reste - n;
                else dits.push(...mouvoir(idDeReserveDuGroupe(d.stock.champ), -n, `${enTete}, ${nom}`).avertissements);
            }
            if (Object.keys(surLaFeuille).length === 0) return;
            if (porteur === 'personnage') {
                ecrireSurLaFiche?.(surLaFeuille);
            } else if (campagne) {
                if (pourLesJoueurs && personnageId) remoteEcrireLeGroupe(campagne.id, personnageId, surLaFeuille);
                else if (!pourLesJoueurs) updateCampaign(campagne.id, { groupe: appliquerAuGroupe(campagne.groupe, { aEcrire: surLaFeuille }) });
            }
        };
        // Avant le lancer : les dés et les bonus. Les annulations attendent de voir les 1.
        const avant = (d: ApportDisponible) => (d.apport.effet === 'annuleLesUns' ? 0 : d.points);
        depenser(engagesDuGroupe, 'groupe', avant);
        depenser(engagesPerso, 'personnage', avant);
        setEngages({});
        setEngagesPerso({});

        if (monnaie && jet.cout.ressource && jet.cout.total > 0) {
            dits.push(...mouvoir(
                jet.cout.ressource, -jet.cout.total,
                `${enTete}, ${jet.desAchetes} dé${jet.desAchetes > 1 ? 's' : ''} acheté${jet.desAchetes > 1 ? 's' : ''}`,
            ).avertissements);
        }

        /*
          **La seconde poule part avec la première, et compte à part.**

          `rollYZE` distingue les deux depuis toujours — les 1 de la seconde
          deviennent des « fléaux » — mais **personne ne lui passait le
          nombre** : `gearCount` restait à zéro. Un personnage d'Alien lançait
          donc sa réserve sans ses dés de stress, et la Panique ne pouvait pas
          se déclencher. Le moteur savait faire ; le chemin s'arrêtait avant lui.
        */
        /*
          **Avantage et désavantage court-circuitent le pilote, et c'est voulu.**

          Le jet ne se compte plus, il se tranche : deux dés, on en garde un.
          `rollAdvantage` sait déjà lire le sens — en « sous-ou-egal », le
          meilleur dé est le PLUS BAS —, et il conserve le dé écarté dans son
          résultat, marqué `isDropped`. *On montre les deux dés :* garder pour
          le joueur la trace de ce qu'il a évité est la moitié de l'intérêt, et
          c'est aussi ce qui permet au meneur de trancher autrement quand la
          fiche dit « généralement le plus bas ».

          Le verdict se relit ensuite dans la monnaie commune du panneau — une
          réussite ou zéro —, sans quoi l'écran afficherait « Échec » sur un dé
          qui passe : `verdict` compte des réussites, et `rollAdvantage` n'en
          rend pas.
        */
        /*
          **Les dés échelonnés passent par `rollFromConfig`, comme tout le reste.**

          *Question de David, le 2026-08-29 : « ne faudrait-il pas construire un
          nouveau moteur dans Dice-OS ? »* Ce panneau appelait `rollYZEEchelonne`
          en direct, et ça marchait — pour lui seul. Le pupitre et la tablette
          passent par `rollFromConfig` : un raccourci ici aurait laissé les deux
          autres lancer des d6 pour Blade Runner, sans que rien ne le dise.
          *C'est le motif que ce fichier a déjà payé quatre fois : le chemin
          s'arrête avant le moteur, et le résultat reste plausible.*

          La poignée voyage par `taillesDeBase` : elle n'a pas de taille commune,
          et `jet.faces` seul ferait lancer deux D10 là où le personnage a un D10
          et un D6. L'avantage et le désavantage sont déjà appliqués par
          `preparerLeJet` — ils ajoutent ou retirent un dé, ils n'en gardent pas
          un sur deux comme `rollAdvantage`.
        */
        /*
          **Provoquer le destin** (NOC) : les dés du Héros, ceux de l'Espoir et
          ceux de la Cabale partent ensemble ; chaque 8 et plus élève le niveau,
          un 10 fait lancer un dé de plus (le moteur `pool_explode`), un 1 verse
          une goutte de Fiel — sauf ceux qu'une Singularité annule.
        */
        if (destin) {
            const nombre = desLances + desPerso + desDuGroupe;
            const tires = nombre > 0
                ? DiceEngine.rollFromConfig({ ...dice, successThreshold: 8 }, { baseCount: nombre })
                : null;
            const faces = (tires?.rolls ?? []).map(r => (typeof r.val === 'number' ? r.val : 0));
            const verdictDuDestin = resoudreLeDestin(niveauDuDestin, difficulte, faces, annulePerso + annuleDuGroupe);

            // Les 1 annulés se paient d'abord sur la Singularité du Héros, puis sur celle du groupe.
            let aPayer = verdictDuDestin.annules;
            const apres = (d: ApportDisponible) => {
                if (d.apport.effet !== 'annuleLesUns') return 0;
                const n = Math.min(aPayer, d.points * d.apport.parPoint);
                aPayer -= n;
                return Math.ceil(n / Math.max(1, d.apport.parPoint));
            };
            depenser(engagesPerso, 'personnage', apres);
            depenser(engagesDuGroupe, 'groupe', apres);
            if (destin.fiel && verdictDuDestin.fiel > 0) {
                dits.push(...mouvoir(destin.fiel, verdictDuDestin.fiel,
                    `${enTete}, ${verdictDuDestin.fiel} goutte${verdictDuDestin.fiel > 1 ? 's' : ''} de Fiel`).avertissements);
            }

            const resultatDuDestin: RollResult = {
                total: verdictDuDestin.niveauFinal,
                rolls: tires?.rolls ?? [],
                modifier: 0,
                successes: verdictDuDestin.marge >= 0 ? 1 : 0,
                // Les 1 sont du Fiel, dit dans la ligne : pas des « fléaux » à compter.
                fails: 0,
                tagSuccess: verdictDuDestin.marge >= 0,
                degre: verdictDuDestin.degre,
                totalDisplay: verdictDuDestin.texte,
            };
            setSeuilDuLancer(jet.seuil);
            setBonusDuLancer(0);
            setResultat(resultatDuDestin);
            setDesDeDestin(null);
            const titre = `${jet.composantes.map(c => c.label).join(' + ') || 'Destin'}`;
            if (pourLesJoueurs && personnageId) {
                window.dispatchEvent(new CustomEvent('fiche:resultat', {
                    detail: {
                        characterId: personnageId, titre, total: resultatDuDestin.total, modifier: 0,
                        totalDisplay: verdictDuDestin.texte, rolls: resultatDuDestin.rolls,
                        successes: resultatDuDestin.successes, tagSuccess: resultatDuDestin.tagSuccess, degre: resultatDuDestin.degre,
                    },
                }));
            } else {
                consignerLeJet({ titre, totalDisplay: verdictDuDestin.texte, degre: verdictDuDestin.degre, tagSuccess: resultatDuDestin.tagSuccess });
            }
            setMouvements(dits);
            return;
        }

        // Torg : le niveau est le seuil additionné, la difficulté le Niveau de Difficulté.
        const optionsTorg: OptionsDeTorg = {
            plageCritique,
            malus: malusTorg,
            // « −3 Blessures », « −2 Déstabilisés », « −4 (2 Blessures, Déstabilisés) ».
            raisonDuMalus: blessuresTorg && destabilises ? `(${raisonsDuMalusTorg.replace(' (carte d’Action)', '')})`
                : blessuresTorg ? `Blessure${blessuresTorg > 1 ? 's' : ''}`
                : destabilises ? 'Déstabilisés' : undefined,
            bonus: chocDeMagie,
            raisonDuBonus: chocDeMagie ? 'Choc volontaire (Loi de la Magie)' : undefined,
        };
        if (torg && chocDeMagie > 0 && descripteur.torg?.choc) {
            const choc = (Number(valeurs[descripteur.torg.choc]) || 0) + chocDeMagie;
            ecrireSurLaFiche?.({ [descripteur.torg.choc]: choc });
            dits.push(`Choc +${chocDeMagie} → ${choc} (Loi de la Magie) — ne se récupère pas avant la fin du sort`);
            setChocVolontaire(0);
        }
        const desTorg: DesDeTorg | null = torg ? { premier: lancerUneChaine(() => DiceEngine.roll(20), entraine) } : null;
        setTestDeTorg(desTorg ? {
            des: desTorg, options: optionsTorg, niveau: jet.seuil, difficulte, entraine,
            titre: jet.composantes.map(c => c.label).join(' + '),
        } : null);
        const brut = desTorg
            ? DiceEngine.resultatDeTorg(jet.seuil, difficulte, desTorg, optionsTorg)
            : jet.desEchelonnes.length > 0
            ? DiceEngine.rollFromConfig(
                { ...dice, engine: 'yze-echelonne' },
                { taillesDeBase: jet.desEchelonnes.map(d => d.faces) },
            )
            : modificateur !== 'aucun' && avantagePossible
            ? (() => {
                const brut = DiceEngine.rollAdvantage(
                    jet.faces,
                    0,
                    modificateur === 'avantage',
                    seuilDuMoteur!,
                    jet.sens === 'sous-ou-egal' ? 'under' : 'over',
                    jet.echelle,
                );
                return { ...brut, successes: brut.tagSuccess ? 1 : 0, fails: 0 };
            })()
            : DiceEngine.rollFromConfig(
                // `jet.sens` accompagne le seuil : sans lui, une réserve « sous
                // le seuil » comptait les dés au-dessus, et rendait des
                // réussites plausibles et exactement inverses.
                { ...dice, successThreshold: seuilDuMoteur, sens: jet.sens },
                {
                    // Les dés puisés dans le groupe s'ajoutent à la réserve.
                    baseCount: jet.nombreDeDes + desDuGroupe + desPerso,
                    gearCount: jet.desSecondaires,
                    doubleSous: jet.doubleSous,
                    // Sans elle, le moteur retomberait sur le booléen : réussi ou
                    // raté, et jamais « particulière ». C'est le même oubli que
                    // `jet.sens`, qui n'arrivait pas non plus jusqu'ici.
                    echelle: jet.echelle,
                },
            );
        /*
          Le bonus du groupe (Vécu, Atout) s'ajoute au résultat compté : chez NOC
          chaque réussite élève le niveau d'un point, comme lui.
        */
        const bonusTotal = bonusDuGroupe + bonusPerso;
        const res: RollResult = bonusTotal > 0
            ? { ...brut, successes: (brut.successes ?? 0) + bonusTotal, totalDisplay: `${brut.totalDisplay} (+${bonusTotal})` }
            : brut;
        setSeuilDuLancer(jet.seuil);
        setBonusDuLancer(bonusDuGroupe + bonusPerso);
        setResultat(res);

        /*
          **Le panneau de fiche ne traverse pas le registre des dés**, donc il
          consigne lui-même. Ses jets n'apparaissaient ni dans l'historique du
          pupitre, ni au journal : le seul moment où ils laissaient une trace
          était quand ils dépensaient une ressource, et c'est le MOUVEMENT de
          réserve qui était consigné, pas le jet.

          Le brancher sur `setLastRoll` l'aurait aussi projeté sur le Hub des
          joueurs — un changement de comportement que ce chantier n'a pas à
          faire. On appelle donc le même décideur, par l'autre porte.
        */
        const titreDuJet = (jet.composantes.length > 0
            ? jet.composantes.map(c => c.label).join(' + ')
            : jet.desEchelonnes.length > 0
                ? jet.desEchelonnes.map(d => `${d.label} D${d.faces}`).join(' + ')
                : `${jet.nombreDeDes}d${jet.faces}`)
            // Ce qu'on a puisé dans le groupe se relit avec le jet.
            + (engagesDuGroupe.length > 0
                ? ` · ${engagesDuGroupe.map(d => `${d.apport.label}${d.apport.stocks.length > 1 ? ` (${d.stock!.label})` : ''} ×${d.points}`).join(', ')}`
                : '');
        const seconde = jet.composantesDeLaSecondeReserve[0];
        setDernierLancer({
            titre: titreDuJet + (modificateur !== 'aucun' ? ` · ${LIBELLES[modificateur]}` : ''),
            choix: { ...choix },
            seconde: seconde ? { champ: seconde.champ, label: seconde.label } : undefined,
        });
        /*
          ⛔ **Sur la tablette, le jet restait chez le joueur** (David,
          2026-09-30 : *« je voudrais que les jets des tablettes remontent vers
          GM-OS pour que je les voie et pour qu'ils soient pris en compte dans le
          journal »*). `consignerLeJet` écrivait dans le journal de la TABLETTE —
          un journal que personne ne lit. Le résultat part donc au meneur, qui
          l'inscrit à son historique et à son journal (`fiche:resultat`).
        */
        if (pourLesJoueurs && personnageId) {
            window.dispatchEvent(new CustomEvent('fiche:resultat', {
                detail: {
                    characterId: personnageId,
                    titre: titreDuJet + (modificateur !== 'aucun' ? ` · ${LIBELLES[modificateur]}` : ''),
                    total: res.total,
                    modifier: res.modifier,
                    /* Le seuil voyage avec le total, comme le journal l'écrit ici. */
                    totalDisplay: descripteur.cible || jet.composantes.length > 0
                        ? `${res.totalDisplay} (seuil ${jet.seuil})`
                        : res.totalDisplay,
                    rolls: res.rolls,
                    successes: res.successes,
                    tagSuccess: res.tagSuccess,
                    degre: res.degre,
                },
            }));
        } else {
            consignerLeJet({
                titre: titreDuJet,
                totalDisplay: res.totalDisplay,
                degre: res.degre,
                tagSuccess: res.tagSuccess,
                seuil: descripteur.cible || jet.composantes.length > 0 ? jet.seuil : undefined,
            });
        }

        /**
         * « Après la résolution d'un test réussi, chaque réussite excédentaire
         * génère un point d'Impulsion ajouté à la réserve du groupe. »
         *
         * Le crédit est automatique parce que la règle l'est — `verdict` rend
         * un excédent nul sur un échec, ce qui couvre « aucune Impulsion ne
         * peut être générée si le test échoue ». Le plafond, lui, se dit :
         * gagner trois points et n'en voir arriver qu'un doit s'expliquer.
         */
        if (monnaie && jet.cout.ressource) {
            const excedent = verdict(res.successes ?? 0, jet.reussitesRequises).excedent;
            if (excedent > 0) {
                dits.push(...mouvoir(
                    jet.cout.ressource, excedent,
                    `${enTete}, ${excedent} réussite${excedent > 1 ? 's' : ''} excédentaire${excedent > 1 ? 's' : ''}`,
                ).avertissements);
            }
        }

        setMouvements(dits);
    };

    /**
     * Complète le dernier test de Torg et le redit — au journal, ou au meneur
     * depuis la tablette, comme un jet neuf : c'est le résultat qui compte.
     */
    const completerTorg = (geste: 'relance' | 'possibilite' | 'action' | 'unDePlus') => {
        if (!testDeTorg) return;
        const { des, options, niveau, difficulte: nd, entraine: ok, titre } = testDeTorg;
        const de = () => DiceEngine.roll(20);
        const suivants: DesDeTorg = geste === 'relance'
            ? { ...des, premier: lancerUneChaine(de, ok), relance: true }
            : geste === 'possibilite'
                ? { ...des, possibilite: lancerLaPossibilite(de, ok) }
                : geste === 'action'
                    ? { ...des, possibiliteDeLAction: lancerLaPossibilite(de, ok) }
                    : { ...des, unDePlus: lancerUneChaine(de, ok) };
        const res = DiceEngine.resultatDeTorg(niveau, nd, suivants, options);
        setTestDeTorg({ ...testDeTorg, des: suivants });
        setResultat(res);

        const nomDuGeste = geste === 'relance' ? 'compétence favorisée' : geste === 'possibilite' ? 'Possibilité'
            : geste === 'action' ? 'Loi de l’Action' : 'Un de plus !';
        if ((geste === 'possibilite' || geste === 'action') && descripteur.torg?.possibilites) {
            const champ = descripteur.torg.possibilites;
            const reste = possibilitesRestantes - 1;
            setForcage(f => ({ ...f, ecrits: { ...f.ecrits, [champ]: reste } }));
            ecrireSurLaFiche?.({ [champ]: reste });
            setMouvements(m => [...m, `Possibilités −1 → ${reste}${geste === 'action' ? ' (Loi de l’Action : la meilleure des deux compte)' : ''}`]);
        }
        if (pourLesJoueurs && personnageId) {
            window.dispatchEvent(new CustomEvent('fiche:resultat', {
                detail: {
                    characterId: personnageId, titre: `${titre} · ${nomDuGeste}`, total: res.total, modifier: res.modifier,
                    totalDisplay: res.totalDisplay, rolls: res.rolls, successes: res.successes, tagSuccess: res.tagSuccess, degre: res.degre,
                },
            }));
        } else {
            consignerLeJet({ titre: `${titre} · ${nomDuGeste}`, totalDisplay: res.totalDisplay, degre: res.degre, tagSuccess: res.tagSuccess });
        }
    };
    const torgCritique = resultat?.degre === 'echec-total';

    /**
     * **L'Annulation des dommages** : une Possibilité, un test de Réalité
     * (attribut + compétence) contre ND 10, et ce qu'il annule de l'attaque en
     * cours. Le résultat se dit ; les cases se décochent par « Soins », sur la
     * carte de combattant — GM-OS ne sait pas quelle part de quel coup annuler.
     */
    const annulation = torg ? descripteur.torg?.annulation : undefined;
    const annuler = () => {
        if (!annulation || !descripteur.torg?.possibilites) return;
        const niveau = niveauDuGroupe(valeurs, annulation.attribut) + niveauDuGroupe(valeurs, annulation.competence);
        const options: OptionsDeTorg = { malus: blessuresTorg, raisonDuMalus: blessuresTorg ? `Blessure${blessuresTorg > 1 ? 's' : ''}` : undefined };
        const des: DesDeTorg = { premier: lancerUneChaine(() => DiceEngine.roll(20)) };
        const res = DiceEngine.resultatDeTorg(niveau, ND_DE_L_ANNULATION, des, options);
        const effet = ceQueLAnnulationAnnule(resoudreTorg(niveau, ND_DE_L_ANNULATION, des, options), { perseverance: !!loiPerseverance });
        const ecrit: RollResult = { ...res, totalDisplay: `Annulation des dommages : ${effet} — ${res.totalDisplay}` };
        ecrireSurLaFiche?.({ [descripteur.torg.possibilites]: possibilitesTorg - 1 });
        setTestDeTorg(null);
        setResultat(ecrit);
        setMouvements([`Possibilités −1 → ${possibilitesTorg - 1}`]);
        if (pourLesJoueurs && personnageId) {
            window.dispatchEvent(new CustomEvent('fiche:resultat', {
                detail: {
                    characterId: personnageId, titre: 'Annulation des dommages', total: ecrit.total, modifier: ecrit.modifier,
                    totalDisplay: ecrit.totalDisplay, rolls: ecrit.rolls, successes: ecrit.successes, tagSuccess: ecrit.tagSuccess, degre: ecrit.degre,
                },
            }));
        } else {
            consignerLeJet({ titre: 'Annulation des dommages', totalDisplay: ecrit.totalDisplay, degre: ecrit.degre, tagSuccess: ecrit.tagSuccess });
        }
    };

    /** Redit un jet complété — au journal, ou au meneur depuis la tablette. */
    const redire = (titre: string, res: RollResult) => {
        if (pourLesJoueurs && personnageId) {
            window.dispatchEvent(new CustomEvent('fiche:resultat', {
                detail: {
                    characterId: personnageId, titre, total: res.total, modifier: res.modifier,
                    totalDisplay: res.totalDisplay, rolls: res.rolls, successes: res.successes, tagSuccess: res.tagSuccess, degre: res.degre,
                },
            }));
        } else {
            consignerLeJet({ titre, totalDisplay: res.totalDisplay, degre: res.degre, tagSuccess: res.tagSuccess });
        }
    };

    const raisonDeNePasForcer = regleDuForcage && resultat && dernierLancer
        ? pourquoiNePasForcer(regleDuForcage, {
            resultat, valeurs, choix: dernierLancer.choix, dejaForce: forcage.fois, libelleDuUn,
        })
        : null;

    /**
     * **Forcer le jet.** Ce qui se paie AVANT la relance (le Stress d'Alien, qui
     * ajoute son dé) puis ce qui se paie APRÈS (un point par 1 chez Blade Runner),
     * écrit sur la fiche et dit sous le résultat.
     */
    const forcer = () => {
        if (!regleDuForcage || !resultat || !dernierLancer || raisonDeNePasForcer) return;
        const ecrits = { ...forcage.ecrits };
        const dits: string[] = [];
        const aReporter = ecrireSurLaFiche ? '' : ' (à reporter sur la fiche)';

        const montee = dernierLancer.seconde ? (regleDuForcage.monteeDeLaSeconde ?? 0) : 0;
        if (montee > 0 && dernierLancer.seconde) {
            const { champ, label } = dernierLancer.seconde;
            ecrits[champ] = lireLeNombre(champ) + montee;
            ecrireSurLaFiche?.({ [champ]: ecrits[champ] });
            dits.push(`${label} +${montee} → ${ecrits[champ]}${aReporter}`);
        }

        const res = forcerLeJet(resultat, regleDuForcage, {
            famille: familleYearZero, desEnPlus: montee, libelleDuUn, de: faces => DiceEngine.roll(faces),
        });

        const prix = prixDuForcage(regleDuForcage, {
            resultat: res, valeurs, choix: dernierLancer.choix, dejaPayes: forcage.unsPayes,
        });
        if (prix && prix.points > 0) {
            const reste = Math.max(0, lireLeNombre(prix.champ) - prix.points);
            ecrits[prix.champ] = reste;
            ecrireSurLaFiche?.({ [prix.champ]: reste });
            dits.push(`${prix.label} −${prix.points} (${prix.points > 1 ? `${prix.points} dés` : 'un dé'} sur 1) → ${reste}${aReporter}`
                // « L'action est résolue avant d'être Brisé. »
                + (reste === 0 ? ' — Brisé, une fois l’action résolue' : ''));
        } else if (prix) {
            dits.push('Aucun 1 : le forçage ne coûte rien.');
        }

        const gardes = res.rolls.filter(d => d.relance === false).length;
        const relances = res.rolls.length - gardes;
        setForcage({ fois: forcage.fois + 1, unsPayes: forcage.unsPayes + (prix?.points ?? 0), ecrits });
        setPaniqueJouee(null);
        setResultat(res);
        setMouvements(m => [
            ...m,
            `Jet forcé : ${gardes} dé${gardes > 1 ? 's' : ''} gardé${gardes > 1 ? 's' : ''}, ${relances} relancé${relances > 1 ? 's' : ''}`,
            ...dits,
        ]);
        redire(`${dernierLancer.titre} · forcé`, res);
    };

    /*
      **Le test de Panique** (Alien) : un 1 sur un dé de la seconde réserve le
      déclenche. Un dé, plus le Niveau de Stress — celui d'après le forçage. La
      table vit dans Table-OS, que seul le poste du meneur atteint : la tablette
      dit le total, et c'est le meneur qui lit la ligne.
    */
    const paniqueDeclenchee = !!descripteur.panique
        && !!resultat?.rolls.some(d => d.source === 'gear' && d.val === 1);
    const jouerLaPanique = () => {
        const regle = descripteur.panique;
        if (!regle || !dernierLancer) return;
        const niveau = dernierLancer.seconde ? lireLeNombre(dernierLancer.seconde.champ) : 0;
        const tire = testDePanique(niveau, regle.faces, faces => DiceEngine.roll(faces));
        /*
          **Le cumul** : déjà en panique, un total plus bas ou égal donne la ligne
          juste au-dessus de la panique en cours. Celle-ci se garde sur la fiche,
          et se remet à 0 sur la carte du combattant quand elle cesse.
        */
        const seuil = regle.seuil ?? 1;
        const precedent = regle.champ ? lireLeNombre(regle.champ) : 0;
        const { effectif, cumule } = cumulDePanique(tire.total, precedent, seuil);
        const joue = { ...tire, effectif, precedent, cumule };
        setPaniqueJouee(joue);
        if (regle.champ && effectif >= seuil) {
            const champ = regle.champ;
            setForcage(f => ({ ...f, ecrits: { ...f.ecrits, [champ]: effectif } }));
            ecrireSurLaFiche?.({ [champ]: effectif });
        }
        const nom = libelleDuUn ?? 'Panique';
        const calcul = `1d${regle.faces} (${tire.de}) + ${dernierLancer.seconde?.label ?? 'Stress'} ${niveau} = ${tire.total}`
            + (cumule ? ` ; déjà en panique (${precedent}) : ${effectif}` : '');
        const dire = (entree?: TableEntry) => redire(`Test de ${nom}`, {
            total: effectif, modifier: niveau, rolls: [{ val: tire.de, sides: regle.faces }],
            totalDisplay: entree ? `${calcul} — ${entree.title}` : calcul,
        });
        const pont = pontDesTables();
        if (!regle.table || !pont || pourLesJoueurs) {
            dire();
            return;
        }
        pont.loadTable(regle.table.univers, regle.table.table)
            .then(data => {
                const entree = data ? entreeDeLaTable(data.entries, effectif) : undefined;
                if (entree) setPaniqueJouee({ ...joue, entree });
                dire(entree);
            })
            .catch(() => dire());
    };

    /*
      **Une réussite qui se paie** (le Point de Récit d'Alien) : après le lancer,
      un point de la fiche ajoute un six au jet. Il reste sur la table si l'on
      force ensuite — c'est une réussite.
    */
    const reussiteDepensee = descripteur.reussiteDepensee && ecrireSurLaFiche && !torg && !destin
        ? descripteur.reussiteDepensee : undefined;
    const pointsDisponibles = reussiteDepensee ? lireLeNombre(reussiteDepensee.champ) : 0;
    const depenserUneReussite = () => {
        if (!reussiteDepensee || !resultat || !dernierLancer || pointsDisponibles <= 0) return;
        const { champ, label } = reussiteDepensee;
        const reste = pointsDisponibles - 1;
        setForcage(f => ({ ...f, ecrits: { ...f.ecrits, [champ]: reste } }));
        ecrireSurLaFiche?.({ [champ]: reste });
        const successes = (resultat.successes ?? 0) + 1;
        const res: RollResult = {
            ...resultat,
            rolls: [...resultat.rolls, { val: 6, sides: 6, source: 'base', isCritMax: true, cssClass: 'reussite-depensee' }],
            total: successes,
            successes,
            tagSuccess: true,
            degre: 'reussite-normale',
            totalDisplay: `${resultat.totalDisplay} (+1 ${label})`,
        };
        setResultat(res);
        setMouvements(m => [...m, `${label} −1 → ${reste} : un 6 ajouté`]);
        redire(`${dernierLancer.titre} · ${label}`, res);
    };

    const reussites = resultat?.successes ?? 0;
    /** Une réserve, qui compte ses réussites — et non un verdict sur un seul dé. */
    const compteDeReussites = !descripteur.cible && !descripteur.tableDeBonus && !descripteur.destin
        && (jet.desEchelonnes.length > 0 || jet.nombreDeDes + jet.desSecondaires > 1);
    const v = verdict(reussites, jet.reussitesRequises);
    // Un dé écarté n'a rien déclenché : le compter ici annoncerait une
    // complication que le tirage vient précisément d'éviter.
    const complications = descripteur.complication
        ? (resultat?.rolls ?? []).filter(
            d => !d.isDropped && typeof d.val === 'number' && d.val >= descripteur.complication!,
        ).length
        : 0;

    return (
        <div data-panneau-de-jet className="space-y-3 rounded-2xl border border-accent/20 bg-accent/5 p-4">
            <h3 className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-[0.2em] text-accent">
                <Dices size={14} /> Lancer un test
            </h3>

            {/*
                Les composantes que le joueur retient sur sa fiche : celles du
                seuil, et **celles de la réserve**.

                Chez Alien le nombre de dés vaut un attribut plus une compétence
                — le pilote ne savait offrir qu'un nombre fixe, et tous les
                personnages lançaient la même poignée. Les deux familles se
                choisissent au même endroit parce que c'est le même geste : le
                joueur désigne ce qu'il invoque, avant de lancer.
            */}
            <div className="grid grid-cols-2 gap-3">
                {composantesARetenir.map(composante => {
                  const sousGroupes = sousGroupesDe(composante);
                  return (
                    <label key={composante.id} className="flex flex-col gap-1">
                        <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                            {composante.label}
                        </span>
                        <select
                            value={choix[composante.id] ?? ''}
                            onChange={e => setChoix(c => ({ ...c, [composante.id]: e.target.value }))}
                            className="bg-app-bg/60 border border-app-border/40 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-accent/50"
                        >
                            {/* Facultative : la laisser vide est un choix (Torg, compétence non entraînée). */}
                            <option value="">{composante.facultative ? '— aucune —' : '— choisir —'}</option>
                            {/*
                                **Un seul sous-groupe ne s'annonce pas.** Coiffer
                                une liste unique du nom de sa section ajouterait
                                une ligne qui ne distingue rien — l'`optgroup` ne
                                sert que là où il y a un choix de sous-groupe à
                                faire, et c'est le cas de Rêves de Dragons, pas
                                celui de Dune.
                            */}
                            {sousGroupes.map(section => {
                                const options = section.fields.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.label} ({String(valeurs[f.id] ?? f.defaultValue)})
                                    </option>
                                ));
                                return sousGroupes.length > 1
                                    ? <optgroup key={section.id} label={section.label || section.id}>{options}</optgroup>
                                    : <Fragment key={section.id}>{options}</Fragment>;
                            })}
                        </select>
                    </label>
                  );
                })}
            </div>

            {/* Le seuil, décomposé — on doit voir d'où il sort. Un jeu à
                réserve pure n'en compose aucun : on ne montre pas un « Seuil 0 »
                qui se lirait comme une mesure. */}
            {((descripteur.seuil ?? []).length > 0 || descripteur.cible) && (
                <div className="flex items-baseline gap-2 text-xs">
                    <span className="text-app-text/40 font-bold uppercase tracking-widest text-ui-9">
                        {descripteur.cible ? 'Chances' : descripteur.tableDeBonus || destin ? 'Niveau' : 'Seuil'}
                    </span>
                    <span className="font-mono text-lg font-black text-accent">
                        {jet.seuil}{descripteur.cible ? ' %' : ''}
                    </span>
                    {/*
                        **L'explication vient du calcul, jamais d'ici.** Joindre
                        les valeurs par « + » dit vrai sur un jeu qui additionne
                        et faux sur un jeu qui multiplie : il aurait montré
                        « 12 + 3 » sous une cible de 78.
                    */}
                    {jet.explicationDuSeuil ? (
                        <span className="text-app-text/30 font-mono">
                            = {jet.explicationDuSeuil}
                            {jet.composantes.length > 0 && (
                                <span className="ml-1 opacity-60">
                                    ({jet.composantes.map(c => c.champ).join(', ')})
                                </span>
                            )}
                        </span>
                    ) : jet.composantes.length > 0 && (
                        <span className="text-app-text/30 font-mono">
                            = {jet.composantes.map(c => `${c.valeur}`).join(' + ')}
                            <span className="ml-1 opacity-60">({jet.composantes.map(c => c.champ).join(' + ')})</span>
                        </span>
                    )}
                </div>
            )}

            {/*
                L'ajustement de difficulté, quand la cible se calcule. Il ne
                s'affiche que là : sur un jeu qui compte des réussites, il n'a
                aucun sens, et deux réglages nommés « difficulté » côte à côte
                seraient exactement le piège que ce chantier a défait.
            */}
            {descripteur.cible && (
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-app-text/40 font-bold uppercase tracking-widest text-ui-9">
                        Difficulté
                    </span>
                    <input
                        type="range"
                        min={-10}
                        max={7}
                        value={ajustementDeDifficulte}
                        onChange={e => setAjustementDeDifficulte(Number(e.target.value))}
                        className="flex-1 accent-accent"
                    />
                    <span className="font-mono font-black text-accent w-8 text-right">
                        {ajustementDeDifficulte > 0 ? `+${ajustementDeDifficulte}` : ajustementDeDifficulte}
                    </span>
                </div>
            )}

            {/*
                Ce que le calcul a dû supposer — hors de la table du livre, borné
                à son dernier palier — s'affiche **avec les remarques du pilote**,
                plus bas, et pas ici : le panneau en a déjà un endroit, et deux
                listes de la même chose finissent par diverger.
            */}

            {/*
                **La poignée échelonnée se montre dé par dé.**

                Un nombre seul — « 2 dés » — ne dirait rien ici : deux D6 et deux
                D12 ne sont pas le même jet, et c'est la fiche qui décide. Le
                joueur doit voir « Attribut D10 + Compétence D6 » pour reconnaître
                son personnage dans ce qu'il lance.
            */}
            {jet.desEchelonnes.length > 0 && (
                <div className="flex items-baseline gap-2 text-xs flex-wrap">
                    <span className="text-app-text/40 font-bold uppercase tracking-widest text-ui-9">Dés</span>
                    {jet.desEchelonnes.map((d, i) => (
                        <span key={`${d.champ}-${i}`} className="font-mono">
                            {i > 0 && <span className="text-app-text/30 mr-2">+</span>}
                            <span className="text-lg font-black text-accent">D{d.faces}</span>
                            <span className="text-app-text/30 ml-1">({d.label})</span>
                        </span>
                    ))}
                </div>
            )}

            {/* La seconde poule, nommée par le jeu. Elle se montre à part parce
                qu'elle se compte à part : chez Alien, un 1 sur un dé de stress
                déclenche la Panique, ce qu'un dé de base ne fait jamais. */}
            {jet.desSecondaires > 0 && (
                <div className="flex items-baseline gap-2 text-xs">
                    <span className="text-etat-alerte/60 font-bold uppercase tracking-widest text-ui-9">
                        {descripteur.reserve?.secondaire?.label ?? 'Seconde réserve'}
                    </span>
                    <span className="font-mono text-lg font-black text-etat-alerte">{jet.desSecondaires}</span>
                    {jet.composantesDeLaSecondeReserve.length > 0 && (
                        <span className="text-app-text/30 font-mono">
                            ({jet.composantesDeLaSecondeReserve.map(c => c.champ).join(' + ')})
                        </span>
                    )}
                </div>
            )}

            {/* La réserve, décomposée pour la même raison : un joueur d'Alien
                doit voir que ses cinq dés sont « Force 4 + Pilotage 1 », et non
                un nombre tombé du ciel. */}
            {jet.composantesDeLaReserve.length > 0 && (
                <div className="flex items-baseline gap-2 text-xs">
                    <span className="text-app-text/40 font-bold uppercase tracking-widest text-ui-9">{destin ? 'Domaine' : 'Réserve'}</span>
                    <span className="font-mono text-lg font-black text-accent">{jet.nombreDeDes}</span>
                    <span className="text-app-text/30 font-mono">
                        = {[
                            ...(descripteur.reserve?.base ? [`${descripteur.reserve.base}`] : []),
                            ...jet.composantesDeLaReserve.map(c => `${c.valeur}`),
                            ...(jet.desAchetes > 0 ? [`${jet.desAchetes}`] : []),
                        ].join(' + ')}
                        <span className="ml-1 opacity-60">
                            ({[
                                ...(descripteur.reserve?.base ? ['base'] : []),
                                ...jet.composantesDeLaReserve.map(c => c.champ),
                                ...(jet.desAchetes > 0 ? ['achetés'] : []),
                            ].join(' + ')})
                        </span>
                    </span>
                </div>
            )}

            {/*
                **Les malus de péril, dits avant de lancer.** Ils retirent au
                Domaine (donc aux dés de destin) et au Talent ; on nomme les états
                qui les causent, pour que le joueur sache d'où vient le moins.
            */}
            {torg && (
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    <label className="flex items-center gap-2">
                        <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Échec critique sur</span>
                        <select
                            value={plageCritique}
                            onChange={e => setPlageCritique(Number(e.target.value))}
                            title="Le livre l'étend selon le risque : rafale, axiomes, certains Atouts et pouvoirs"
                            className="bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50"
                        >
                            <option value={1}>1</option>
                            <option value={2}>1 – 2</option>
                            <option value={3}>1 – 3</option>
                            <option value={4}>1 – 4</option>
                        </select>
                    </label>
                    {malusTorg > 0 && (
                        <span className="text-etat-alerte/80" data-malus-de-torg>
                            Malus : −{malusTorg} au total d'action — {raisonsDuMalusTorg}
                        </span>
                    )}
                    {unDePlusDeLaCarte && (
                        <span className="text-etat-succes/80" data-un-de-plus-de-la-carte>
                            La carte d’Action accorde « Un de plus ! » aux Héros ce round.
                        </span>
                    )}
                    {!entraine && <span className="text-app-text/40 italic">Sans compétence : seul le 10 explose, pas le 20.</span>}
                    {champMagique && descripteur.torg?.choc && ecrireSurLaFiche && (
                        <label className="flex items-center gap-2" data-loi-de-la-magie
                            title={`${loiMagie?.nom ?? 'Loi de la Magie'} : +1 par point de Choc, jusqu'aux rangs de la compétence (${rangsMagiques}). Annoncé avant le jet, il ne se récupère pas avant la fin du sort.`}>
                            <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Choc volontaire</span>
                            <input type="number" min={0} max={rangsMagiques} value={chocVolontaire}
                                onChange={e => setChocVolontaire(Math.max(0, Math.min(rangsMagiques, Number(e.target.value) || 0)))}
                                className="w-14 bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-accent/50" />
                            <span className="text-app-text/40">max {rangsMagiques}</span>
                        </label>
                    )}
                    {annulation && ecrireSurLaFiche && descripteur.torg?.possibilites && (
                        <button
                            type="button"
                            disabled={possibilitesTorg <= 0}
                            onClick={annuler}
                            title="Une Possibilité, un test de Réalité contre ND 10 — avant que les dommages de l'attaque ne prennent effet"
                            className="ml-auto px-3 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent text-ui-10 font-bold hover:bg-accent/20 transition-colors disabled:opacity-30"
                        >
                            Annulation des dommages ({possibilitesTorg})
                        </button>
                    )}
                </div>
            )}

            {destin && (malus.domaines > 0 || malus.talents > 0) && (
                <p className="text-ui-11 text-etat-alerte/80">
                    Malus : {malus.domaines > 0 && `−${malus.domaines} au Domaine`}
                    {malus.domaines > 0 && malus.talents > 0 && ', '}
                    {malus.talents > 0 && `−${malus.talents} au Talent`} — {malus.etats.join(', ')}
                </p>
            )}

            {destin && (
                <div data-destin className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Provoquer le destin</span>
                    <button
                        type="button"
                        onClick={() => setDesDeDestin(Math.max(0, desLances - 1))}
                        aria-label="Un dé de destin de moins"
                        className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                    ><Minus size={12} /></button>
                    <span className="font-mono text-sm font-black w-6 text-center">{desLances}</span>
                    <button
                        type="button"
                        disabled={desLances >= plafondDuDestin}
                        onClick={() => setDesDeDestin(Math.min(plafondDuDestin, desLances + 1))}
                        aria-label="Un dé de destin de plus"
                        className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors disabled:opacity-30"
                    ><Plus size={12} /></button>
                    <span className="text-app-text/40">
                        sur {plafondDuDestin} — niveau {niveauDuDestin}
                        {desLances === 0 && ' : sans dé, le Talent seul contre la difficulté'}
                    </span>
                </div>
            )}

            {reservesPerso.length > 0 && (
                <ApportsDuGroupe
                    titre="Puiser dans ses réserves"
                    disponibles={disponiblesPerso}
                    choixDuJoueur={{}}
                    onChoisir={() => { /* un seul stock par réserve */ }}
                    onEngager={(id, points) => setEngagesPerso(e => ({ ...e, [id]: points }))}
                    resteDe={(_id, champ) => Math.max(0, niveauDuGroupe(valeurs, champ))}
                />
            )}

            {apports.length > 0 && ficheDeGroupe && (
                <ApportsDuGroupe
                    titre={`Puiser dans la ${ficheDeGroupe.libelle}`}
                    disponibles={disponibles}
                    choixDuJoueur={choixDesApports}
                    onChoisir={(id, champ) => {
                        setChoixDesApports(c => ({ ...c, [id]: champ }));
                        setEngages(e => ({ ...e, [id]: 0 }));
                    }}
                    onEngager={(id, points) => setEngages(e => ({ ...e, [id]: points }))}
                    resteDe={resteDe}
                />
            )}

            <div className="flex items-center gap-6">
                {/* Réserve : les dés supplémentaires s'achètent, jusqu'au plafond du système. */}
                <div className={`flex items-center gap-2 ${destin || torg ? 'hidden' : ''}`}>
                    <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Dés</span>
                    <button
                        onClick={() => setDesAchetes(d => Math.max(0, d - 1))}
                        className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                    ><Minus size={12} /></button>
                    <span className="font-mono text-sm font-black w-6 text-center">{jet.nombreDeDes}</span>
                    <button
                        /* Le plafond se compte à partir de la réserve RÉELLE du
                           personnage, composantes comprises — sinon un joueur
                           d'Alien à cinq dés pourrait en acheter dix de plus. */
                        onClick={() => setDesAchetes(d => Math.min(
                            (descripteur.reserve?.max ?? 0)
                                - (descripteur.reserve?.base ?? 0)
                                - jet.composantesDeLaReserve.reduce((s, c) => s + c.valeur, 0),
                            d + 1,
                        ))}
                        className="p-1 rounded-md bg-app-bg/60 border border-app-border/40 hover:border-accent/40 transition-colors"
                    ><Plus size={12} /></button>
                </div>

                {/*
                    Le prix des dés achetés, ventilé. « 3 — 2 d'Impulsion,
                    1 de Menace » : ce qui part chez le meneur se voit avant
                    le lancer, pas après.
                */}
                {ventilation && (
                    <span
                        className="flex items-center gap-1.5 text-ui-10 font-bold text-etat-alerte/80"
                        title="Coût des dés supplémentaires"
                    >
                        <Coins size={11} />
                        {ventilation.surLaReserve > 0 && (
                            <span>{ventilation.surLaReserve} {nomDe(jet.cout.ressource)}</span>
                        )}
                        {ventilation.reporte > 0 && (
                            <span className="text-etat-danger/80">
                                {ventilation.surLaReserve > 0 && '+ '}
                                {ventilation.reporte} {nomDe(ventilation.ressourceDeReport)}
                            </span>
                        )}
                    </span>
                )}

                {/*
                    **Avantage / Désavantage — la règle de Dice OS, à l'identique.**

                    Deux dés, on garde le meilleur ou le moins bon. Le sélecteur
                    ne paraît que là où un seul dé tranche : sur une réserve, il
                    n'y a pas de meilleur dé, et l'offrir inviterait à inventer
                    une règle que le jeu n'a pas.

                    Il reste affiché après le lancer, et c'est délibéré — un
                    modificateur qui se remettrait seul à zéro se rejouerait sans
                    qu'on le voie, et un qui persiste se lit à l'écran.
                */}
                {avantagePossible && (
                    <label className="flex items-center gap-2">
                        <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Tirage</span>
                        <select
                            value={modificateur}
                            onChange={e => setModificateur(e.target.value as typeof modificateur)}
                            title={jet.sens === 'sous-ou-egal'
                                ? 'Deux dés : l’Avantage garde le plus BAS, le Désavantage le plus haut'
                                : 'Deux dés : l’Avantage garde le plus HAUT, le Désavantage le plus bas'}
                            className={`bg-app-bg/60 border rounded-lg px-2 py-1 text-ui-11 font-bold focus:outline-none focus:border-accent/50 ${
                                modificateur === 'avantage'
                                    ? 'border-etat-succes/50 text-etat-succes'
                                    : modificateur === 'desavantage'
                                        ? 'border-etat-danger/50 text-etat-danger'
                                        : 'border-app-border/40 text-app-text/60'
                            }`}
                        >
                            <option value="aucun">Normal</option>
                            <option value="avantage">Avantage</option>
                            <option value="desavantage">Désavantage</option>
                        </select>
                    </label>
                )}

                {/*
                    Pas de champ pour ce que le jeu ne fixe pas : un sélecteur de
                    difficulté sur un jeu qui n'en a pas invite à en inventer une.

                    **Et pas non plus quand une cible est calculée.** Le
                    commentaire de l'ajustement, plus haut, affirmait que « deux
                    réglages nommés difficulté côte à côte » étaient le piège
                    « que ce chantier a défait ». Il ne l'était pas : les deux
                    gardes sont indépendants, et rien n'empêchait un pilote de
                    déclarer `cible` **et** `difficulte`. Le pilote de Rêves de
                    Dragons le faisait, et les deux s'affichaient — vu sur une
                    capture de David le 2026-08-23.

                    *L'exclusivité doit être écrite, pas supposée.* Ici la cible
                    l'emporte, comme partout ailleurs.
                */}
                {/*
                    **La spécialisation** (Star Trek) : cochée, chaque dé égal ou
                    inférieur à la composante nommée vaut deux réussites. La borne
                    se dit à côté, pour qu'on voie ce qu'elle change.
                */}
                {descripteur.specialisation && (
                    <label className="flex items-center gap-2" title="Chaque dé inférieur ou égal à cette valeur vaut deux réussites">
                        <input
                            type="checkbox"
                            checked={specialisation}
                            onChange={e => setSpecialisation(e.target.checked)}
                            className="accent-current"
                        />
                        <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">
                            {descripteur.specialisation.label}
                            {specialisation && jet.doubleSous > (descripteur.critique ?? 0) && ` (critique ≤ ${jet.doubleSous})`}
                        </span>
                    </label>
                )}

                {descripteur.difficulte && !descripteur.cible && (
                    <label className="flex items-center gap-2">
                        <span className="text-ui-9 font-black uppercase tracking-widest text-app-text/40">Difficulté</span>
                        <input
                            type="number"
                            min={descripteur.difficulte.min}
                            max={descripteur.difficulte.max}
                            value={difficulte}
                            onChange={e => setDifficulte(Number(e.target.value))}
                            className="w-14 bg-app-bg/60 border border-app-border/40 rounded-lg px-2 py-1 text-xs font-mono font-bold focus:outline-none focus:border-accent/50"
                        />
                    </label>
                )}

                <button
                    onClick={lancer}
                    disabled={!pret}
                    className={`ml-auto px-6 py-2 rounded-xl text-ui-10 font-black uppercase tracking-widest transition-all ${
                        pret
                            ? 'bg-accent text-app-on-accent hover:scale-105 active:scale-95'
                            : 'bg-app-text/5 text-app-text/20 cursor-not-allowed'
                    }`}
                >
                    Lancer
                </button>
            </div>

            {/*
                Ce qui manque se dit. Un champ absent de la fiche est une erreur
                de configuration du pilote, et le joueur doit savoir pourquoi le
                bouton refuse plutôt que de le voir grisé sans explication.
            */}
            {jet.avertissements.length > 0 && (
                <ul className="space-y-1">
                    {jet.avertissements.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-ui-11 text-etat-alerte/70">
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}
                        </li>
                    ))}
                </ul>
            )}

            {/*
                Ce qui s'est raccordé malgré une dérive du pilote. Plus discret
                que les avertissements — le jet est juste et part —, mais dit :
                un défaut silencieux finit toujours par coûter plus cher qu'une
                ligne de texte.
            */}
            {jet.remarques.length > 0 && (
                <ul className="space-y-1">
                    {jet.remarques.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-ui-10 text-app-text/35">
                            <Info size={11} className="mt-0.5 shrink-0" /> {r}
                        </li>
                    ))}
                </ul>
            )}

            {/*
                **Compléter le test de Torg.** Chaque geste ne sert qu'une fois ; la
                relance favorisée seulement avant les autres ; rien après un échec
                critique — « aucune Possibilité ne peut modifier ce jet ».
            */}
            {torg && testDeTorg && resultat && !torgCritique && (
                <div data-gestes-de-torg className="flex flex-wrap items-center gap-2">
                    {!testDeTorg.des.relance && !testDeTorg.des.possibilite && !testDeTorg.des.unDePlus && (
                        <button type="button" onClick={() => completerTorg('relance')}
                            className="px-3 py-1 rounded-lg border border-app-border/40 text-ui-10 font-bold hover:border-accent/40 transition-colors">
                            Relancer (compétence favorisée)
                        </button>
                    )}
                    {!testDeTorg.des.possibilite && ecrireSurLaFiche && descripteur.torg?.possibilites && (
                        <button type="button" disabled={possibilitesRestantes <= 0} onClick={() => completerTorg('possibilite')}
                            className="px-3 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent text-ui-10 font-bold hover:bg-accent/20 transition-colors disabled:opacity-30">
                            Dépenser une Possibilité ({possibilitesRestantes})
                        </button>
                    )}
                    {loiAction && testDeTorg.des.possibilite && !testDeTorg.des.possibiliteDeLAction && ecrireSurLaFiche && descripteur.torg?.possibilites && (
                        <button type="button" disabled={possibilitesRestantes <= 0} onClick={() => completerTorg('action')}
                            title={loiAction.texte}
                            className="px-3 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent text-ui-10 font-bold hover:bg-accent/20 transition-colors disabled:opacity-30">
                            {loiAction.nom} : seconde Possibilité ({possibilitesRestantes})
                        </button>
                    )}
                    {!testDeTorg.des.unDePlus && (
                        <button type="button" onClick={() => completerTorg('unDePlus')}
                            className={`px-3 py-1 rounded-lg border text-ui-10 font-bold hover:border-accent/40 transition-colors ${
                                unDePlusDeLaCarte ? 'border-etat-succes/60 bg-etat-succes/10 text-etat-succes' : 'border-app-border/40'}`}>
                            Un de plus !
                        </button>
                    )}
                </div>
            )}

            {/*
                **Forcer le jet, jouer la Panique** (Year Zero). Le bouton se grise
                avec sa raison — une Panique, un forçage déjà fait, un androïde —,
                jamais en silence.
            */}
            {resultat && dernierLancer && (regleDuForcage || paniqueDeclenchee || reussiteDepensee) && (
                <div data-gestes-year-zero className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {regleDuForcage && (
                            <button type="button" onClick={forcer} disabled={!!raisonDeNePasForcer}
                                className="px-3 py-1 rounded-lg border border-accent/40 bg-accent/10 text-accent text-ui-10 font-bold hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                Forcer le jet{forcage.fois > 0 ? ` (${forcage.fois + 1}e fois)` : ''}
                            </button>
                        )}
                        {reussiteDepensee && compteDeReussites && (
                            <button type="button" onClick={depenserUneReussite} disabled={pointsDisponibles <= 0}
                                className="px-3 py-1 rounded-lg border border-etat-succes/50 bg-etat-succes/10 text-etat-succes text-ui-10 font-bold hover:bg-etat-succes/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                Dépenser un {reussiteDepensee.label} ({pointsDisponibles})
                            </button>
                        )}
                        {paniqueDeclenchee && !paniqueJouee && (
                            <button type="button" onClick={jouerLaPanique}
                                className="px-3 py-1 rounded-lg border border-etat-alerte/60 bg-etat-alerte/10 text-etat-alerte text-ui-10 font-bold hover:bg-etat-alerte/20 transition-colors">
                                Test de {libelleDuUn ?? 'Panique'}
                            </button>
                        )}
                    </div>
                    {regleDuForcage && raisonDeNePasForcer && (
                        <p className="flex items-start gap-2 text-ui-10 text-app-text/40">
                            <Info size={11} className="mt-0.5 shrink-0" /> {raisonDeNePasForcer}
                        </p>
                    )}
                </div>
            )}

            {resultat && (
                <div className="rounded-xl border border-app-border/30 bg-app-bg/40 p-3 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                        {resultat.rolls.map((d, i) => {
                            const val = typeof d.val === 'number' ? d.val : 0;
                            /*
                              **Le dé écarté se montre, et ne compte pour rien.**
                              C'est le dé qu'on a évité — un joueur doit voir de
                              quoi l'Avantage l'a sauvé. Mais lui appliquer les
                              couleurs du critique ou de la complication
                              annoncerait un événement qui n'a pas eu lieu.
                            */
                            const ecarte = d.isDropped === true;
                            const critique = !ecarte && descripteur.critique !== undefined && val <= jet.doubleSous;
                            const complique = !ecarte && descripteur.complication !== undefined && val >= descripteur.complication;
                            /*
                              **Quel dé a déclenché, et pas seulement combien.**
                              Un compte de Paniques sans savoir lequel des huit
                              dés l'a causée n'aide personne à raconter la scène.
                              La seconde poule se distingue à l'œil, et son 1
                              porte le nom que le jeu lui donne.
                            */
                            const seconde = d.source === 'gear';
                            const declenche = seconde && d.isCritMin;
                            const nomDuUn = descripteur.reserve?.secondaire?.libelleDuUn ?? 'Fléau';
                            return (
                                <span
                                    key={i}
                                    title={ecarte ? 'Dé écarté — celui que le tirage n’a pas retenu'
                                        : declenche ? nomDuUn
                                        : seconde ? descripteur.reserve?.secondaire?.label
                                        : critique ? 'Deux réussites'
                                        : complique ? 'Complication' : undefined}
                                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono text-sm font-black border ${
                                        ecarte
                                            ? 'bg-transparent border-dashed border-app-border/30 text-app-text/25 line-through'
                                        : declenche
                                            ? 'bg-etat-alerte/25 border-etat-alerte text-etat-alerte shadow-[0_0_10px_rgba(251,191,36,0.35)]'
                                            : critique
                                                ? 'bg-etat-succes/20 border-etat-succes/50 text-etat-succes'
                                                : d.isCritMax
                                                    ? 'bg-etat-succes/10 border-etat-succes/20 text-etat-succes/80'
                                                    : complique
                                                        ? 'bg-etat-danger/20 border-etat-danger/50 text-etat-danger'
                                                        : seconde
                                                            ? 'bg-app-text/5 border-dashed border-etat-alerte/40 text-app-text/50'
                                                            : 'bg-app-text/5 border-app-border/30 text-app-text/40'
                                    }${d.relance ? ' ring-2 ring-accent/50' : ''}${d.cssClass === 'reussite-depensee' ? ' ring-2 ring-etat-succes/60' : ''}`}
                                >
                                    {val}
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                        {/*
                            **Le septième lecteur, et il écrivait lui aussi son
                            propre mot.** Le degré l'emporte quand le jeu en
                            gradue ; sinon c'est le verdict du compte de
                            réussites, qui reste l'autorité sur une réserve.
                        */}
                        <EtiquetteDuDegre
                            resultat={{ degre: resultat.degre, tagSuccess: v.reussi }}
                            classes={reussi => 'font-black uppercase tracking-widest '
                                + (reussi ? 'text-etat-succes' : 'text-etat-danger')}
                        />
                        {/* « difficulté 0 » ne voulait rien dire sur un jeu qui
                            n'en gradue aucune : il en faut une, et c'est ça
                            qu'on annonce. */}
                        {/*
                            **Un compte de réussites n'a de sens que sur une réserve.**
                            Sous une Sauvegarde, un pourcentage ou le jet de Torg, il
                            écrivait « 0 réussite / 1 requise » à côté d'un verdict
                            réussi (vu sur les captures du manuel, 2026-10-13) : on y
                            dit plutôt ce que le moteur a calculé.
                        */}
                        {compteDeReussites ? (
                            <span className="text-app-text/50 font-mono">
                                {reussites} réussite{reussites > 1 ? 's' : ''}
                                {bonusDuLancer > 0 && ` (dont +${bonusDuLancer} ${ficheDeGroupe?.libelle ?? 'groupe'})`}
                                {descripteur.difficulte
                                    ? ` / difficulté ${difficulte}`
                                    : ` / ${jet.reussitesRequises} requise${jet.reussitesRequises > 1 ? 's' : ''}`}
                            </span>
                        ) : (
                            <span className="text-app-text/50 font-mono">{resultat.totalDisplay}</span>
                        )}
                        {/*
                            **Les 1 de la seconde poule, nommés par le jeu.**

                            `rollYZE` les compte comme des « fléaux » — un terme
                            générique de la famille Year Zero. Chez Alien, ce
                            sont des **Paniques**, et le mot compte : c'est lui
                            qui dit au meneur d'ouvrir la table de Panique. On
                            affiche donc ce que le pilote déclare, et « fléau »
                            seulement à défaut.

                            **On annonce, on ne déclenche pas.** Jouer la
                            Panique est une décision de table — l'outil tient le
                            compte, il n'arbitre pas.
                        */}
                        {(resultat?.fails ?? 0) > 0 && (
                            <span className="text-etat-alerte font-black uppercase tracking-widest">
                                {resultat!.fails} {descripteur.reserve?.secondaire?.libelleDuUn ?? 'fléau'}
                                {resultat!.fails! > 1 ? 's' : ''}
                            </span>
                        )}
                        {/* L'excédent alimente la monnaie de table — et depuis
                            le mur n° 4, il y est réellement versé. */}
                        {v.excedent > 0 && (
                            <span className="text-etat-alerte/80 font-mono">
                                +{v.excedent}{monnaie && jet.cout.ressource ? ` ${nomDe(jet.cout.ressource)}` : ' excédent'}
                            </span>
                        )}
                        {complications > 0 && (
                            <span className="text-etat-danger/80 font-mono">
                                {complications} complication{complications > 1 ? 's' : ''}
                            </span>
                        )}
                        {/* Torg ne lance pas sous un seuil : son calcul dit déjà le ND. Une
                            réserve sans seuil (NOC, Alien) affichait « sous 0 ». */}
                        {!descripteur.tableDeBonus && !destin && seuilDuLancer > 0 && (
                            <span className="ml-auto text-app-text/25 font-mono text-ui-10">sous {seuilDuLancer}</span>
                        )}
                    </div>

                    {/*
                        Ce que le lancer a fait aux réserves de la table : un
                        report en Menace, un gain refusé par le plafond. Une
                        réserve qui bouge sans le dire est exactement le genre
                        de silence qu'on traque.
                    */}
                    {mouvements.length > 0 && (
                        <ul className="space-y-1 pt-1 border-t border-app-border/20">
                            {mouvements.map((m, i) => (
                                <li key={i} className="flex items-start gap-2 text-ui-11 text-etat-alerte/70">
                                    <Coins size={11} className="mt-0.5 shrink-0" /> {m}
                                </li>
                            ))}
                        </ul>
                    )}

                    {paniqueJouee && (
                        <div data-test-de-panique className="rounded-lg border border-etat-alerte/40 bg-etat-alerte/10 p-2 space-y-1">
                            <p className="text-ui-11 font-black uppercase tracking-widest text-etat-alerte">
                                Test de {libelleDuUn ?? 'Panique'} : {paniqueJouee.de} + {paniqueJouee.niveau} = {paniqueJouee.total}
                                {paniqueJouee.cumule ? ` ; déjà en panique (${paniqueJouee.precedent}) : ${paniqueJouee.effectif}` : ''}
                                {paniqueJouee.entree ? ` — ${paniqueJouee.entree.title}` : ''}
                            </p>
                            {paniqueJouee.entree ? (
                                <>
                                    {paniqueJouee.entree.description && (
                                        <p className="text-ui-11 text-app-text/70">{paniqueJouee.entree.description}</p>
                                    )}
                                    {paniqueJouee.entree.effect && (
                                        <p className="text-ui-11 font-bold text-app-text/80">{paniqueJouee.entree.effect}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-ui-10 text-app-text/50">
                                    {pourLesJoueurs ? 'Le meneur lit la ligne dans la table.' : 'Cherchez ce total dans la table du jeu.'}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PanneauDeJet;
