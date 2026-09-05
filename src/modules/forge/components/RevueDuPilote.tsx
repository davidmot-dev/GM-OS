import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { MECANIQUES_DE_CIBLE } from '../../dice/systemes';
import type { GameDriver } from '../../../types/drivers';
import type { SheetTemplate } from '../../../data/defaultSheetTemplates';
import { controlerLePilote, type ConstatDuPilote } from '../rules/controlesDuPilote';
import { peutEtreRequalifie, requalifierEnDesEchelonnes } from '../rules/convertirEnDesEchelonnes';
import LienAuCorpus from '../corpus/LienAuCorpus';

/**
 * Le pilote dérivé, montré **avant** d'être enregistré.
 *
 * **Ce que cela corrige, relevé le 2026-08-12 sur la première dérivation
 * réussie.** L'écran de revue affichait quatre valeurs — un nom, un moteur de
 * dés, deux libellés de jauge — pour un pilote qui en compte une quarantaine.
 * Ni les `sectionId` du jet, ni les sections du gabarit, ni les réserves de
 * table n'apparaissaient, et un gros bouton ENREGISTRER attendait juste en
 * dessous. **Ce n'était pas une revue.**
 *
 * La règle vient de l'Atelier, où elle est tenue depuis le 2026-08-10 : *la
 * fiche se montre avant d'être écrite*. Un pilote posé dans le catalogue est
 * aussitôt lu par les écrans de combat ; c'est l'artefact qui porte le plus
 * d'autorité, il ne peut pas être celui qui reçoit le moins de revue.
 *
 * **Les identifiants sont affichés, et c'est le point.** Ce sont eux qui
 * cassent en silence : un `fieldId` qui ne correspond à rien affiche une jauge
 * à zéro, *qui ressemble à un personnage en pleine forme*.
 */

const Bloc: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
  <div className="bg-app-text/5 rounded-2xl border border-app-border/10 p-5 space-y-3">
    <p className="text-ui-10 uppercase font-black text-accent tracking-[0.2em] font-display">{titre}</p>
    {children}
  </div>
);

const Ligne: React.FC<{ clef: string; children: React.ReactNode }> = ({ clef, children }) => (
  <div className="flex gap-3 text-xs leading-relaxed">
    <span className="text-app-text/40 shrink-0 w-40">{clef}</span>
    <span className="text-app-text/80 min-w-0 break-words">{children}</span>
  </div>
);

/** Un identifiant, et s'il se raccorde ou non. */
/**
 * Un identifiant du pilote, et **le dire quand il n'y en a pas**.
 *
 * Le type promet une chaîne ; le pilote vient d'un modèle de langage. Une
 * valeur absente rendait une pastille VIDE — indiscernable d'un identifiant
 * correct pour qui parcourt l'écran. *Sur la revue, c'est le pire des rendus :
 * elle existe pour montrer ce qui manque.*
 */
const Id: React.FC<{ valeur?: string; resolu?: boolean }> = ({ valeur, resolu }) => {
  if (!valeur) {
    return <em className="text-red-300">absent ✕</em>;
  }
  return (
    <code className={`font-mono px-1.5 py-0.5 rounded ${
      resolu === false ? 'bg-red-500/20 text-red-300' : 'bg-app-text/10 text-app-text/70'
    }`}>
      {valeur}
      {resolu === false && ' ✕'}
    </code>
  );
};

/**
 * Les sections où une composante se choisit — **toutes**, pas seulement la
 * première.
 *
 * Depuis le 2026-08-23 une composante peut nommer plusieurs sous-groupes
 * (`sectionsSupplementaires`). N'en montrer qu'un sur la revue laisserait les
 * autres se raccorder — ou pas — sans que rien ne le dise, et *c'est
 * exactement ce que cet écran existe pour empêcher.*
 *
 * Écrit une fois et appelé quatre : la cible, son ajustement, le seuil et la
 * réserve montrent la même chose, et quatre rendus jumeaux auraient fini par
 * diverger.
 */
const SectionsDeLaComposante: React.FC<{
  composante?: { sectionId?: string; sectionsSupplementaires?: string[] };
  idsDeSections: Set<string | undefined>;
}> = ({ composante, idsDeSections }) => {
  const autres = (composante?.sectionsSupplementaires ?? []).filter(Boolean);
  return (
    <>
      <Id valeur={composante?.sectionId} resolu={idsDeSections.has(composante?.sectionId)} />
      {autres.map(nom => (
        <React.Fragment key={nom}>
          {' ou '}
          <Id valeur={nom} resolu={idsDeSections.has(nom)} />
        </React.Fragment>
      ))}
    </>
  );
};

const JournalDesConstats: React.FC<{ constats: ConstatDuPilote[] }> = ({ constats }) => {
  if (constats.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
        <p className="text-xs text-emerald-300/80">
          Chaque identifiant du pilote se raccorde à un champ ou à une section réelle de la fiche.
        </p>
      </div>
    );
  }

  const erreurs = constats.filter(c => c.gravite === 'erreur');
  return (
    <div className={`rounded-2xl border p-5 space-y-3 ${
      erreurs.length > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'
    }`}>
      <p className={`flex items-center gap-2 text-ui-10 uppercase font-black tracking-[0.2em] font-display ${
        erreurs.length > 0 ? 'text-red-400' : 'text-amber-400'
      }`}>
        <AlertTriangle size={14} />
        Ce qui ne se raccorde à rien ({constats.length})
      </p>
      <ul className="space-y-2">
        {constats.map((constat, i) => (
          <li key={`${constat.ou}-${i}`} className="flex gap-2 text-xs leading-relaxed">
            {constat.gravite === 'erreur'
              ? <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              : <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />}
            <span>
              <code className="font-mono text-app-text/50">{constat.ou}</code>
              <span className="text-app-text/80"> — {constat.message}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-ui-10 text-app-text/40 leading-relaxed">
        Rien n'est refusé pour autant : un identifiant introuvable peut venir d'une fiche incomplète
        autant que d'une invention du modèle. C'est à vous de trancher avant d'enregistrer.
      </p>
    </div>
  );
};

export const RevueDuPilote: React.FC<{
  driver: Partial<GameDriver>;
  template: Partial<SheetTemplate>;
  /**
   * Le corpus auquel ce pilote **sera** rattaché à l'enregistrement.
   *
   * Il ne se lit pas encore sur `driver.corpusId` : celui-ci n'est écrit qu'au
   * moment d'enregistrer. Or c'est précisément avant d'enregistrer qu'il faut
   * pouvoir le corriger — après, il faut supprimer le pilote et recommencer.
   */
  corpusId?: string;
  /**
   * Appelé quand le meneur requalifie le jet en dés échelonnés.
   *
   * Absent, le bouton ne s'affiche pas : une revue qui propose un geste sans
   * destinataire est pire qu'une revue qui n'en propose aucun.
   */
  onRequalifier?: (driver: Partial<GameDriver>) => void;
}> = ({ driver, template, corpusId, onRequalifier }) => {
  const constats = controlerLePilote(driver, template);
  const sections = template.sections ?? [];
  const idsDeSections = new Set(sections.map(s => s.id));
  const tousLesChamps = new Set(sections.flatMap(s => (s.fields ?? []).map(f => f.id)));

  const jet = driver.jet;
  const combat = driver.combat;
  const portees = driver.tactical?.ranges;

  return (
    <div className="space-y-6">
      <JournalDesConstats constats={constats} />

      {/*
        **Requalifier le jet, à la main — parce que la consigne a échoué trois
        fois.**

        Le 2026-08-29, David a dérivé son pilote Blade Runner trois fois, avec
        une consigne corrigée entre chaque, et il est ressorti trois fois avec un
        seuil. `desEchelonnes` est une clé que le modèle n'a jamais vue ; `seuil`
        lui est familier depuis toujours. *Quand une consigne échoue trois fois,
        ce n'est plus la consigne qu'il faut réécrire.*

        Le modèle a fait la moitié difficile correctement — les bonnes
        composantes, dans les bonnes sections. Ce bouton ne crée rien : il
        DÉPLACE ce qu'il a trouvé vers la mécanique que le meneur, lui, connaît.
      */}
      {onRequalifier && peutEtreRequalifie(driver) && (
        <div className="bg-app-text/5 border border-app-border/20 rounded-2xl p-5 space-y-3">
          <p className="text-ui-10 uppercase font-black text-accent tracking-[0.2em] font-display">
            Ce jeu lance-t-il des dés échelonnés ?
          </p>
          <p className="text-xs text-app-text/60 leading-relaxed">
            Si les attributs et compétences de ce jeu valent une <strong>lettre</strong> — A, B, C, D —
            qui désigne une taille de dé, et qu'on lance <strong>un dé par valeur</strong> au lieu de
            les additionner, ce pilote se trompe de mécanique. C'est le cas de Blade Runner et de la
            famille Year Zero à dés échelonnés.
          </p>
          <button
            type="button"
            onClick={() => onRequalifier(requalifierEnDesEchelonnes(driver).driver)}
            className="px-4 py-2 rounded-xl bg-accent/15 border border-accent/40 text-ui-10 font-black uppercase tracking-widest text-accent hover:bg-accent/25 transition-colors"
          >
            Requalifier en dés échelonnés
          </button>
          <p className="text-ui-10 text-app-text/40 leading-relaxed">
            Rien n'est inventé : les {driver.jet?.seuil?.length ?? 0} composantes trouvées par la
            Forge sont déplacées telles quelles, avec leurs sections. Le seuil, qui n'a pas de sens
            ici, est retiré.
          </p>
        </div>
      )}

      {/*
        **Le corpus, avant le reste.** Un pilote rattaché au mauvais dossier
        produit exactement les mêmes écrans qu'un pilote juste : les fiches
        lues, les personas de l'Oracle et l'index RAG changent tous, et rien
        n'en dit rien. C'est ici qu'on peut encore le corriger sans supprimer
        le pilote et recommencer.
      */}
      <LienAuCorpus
        pilote={{ id: driver.id, name: driver.name, corpusId: corpusId ?? driver.corpusId, ragPath: driver.ragPath }}
        titre="Corpus auquel ce pilote sera rattaché"
      />

      <div className="grid grid-cols-2 gap-6">
        <Bloc titre="Identité">
          <p className="text-xl font-bold font-display">
            {driver.emoji} {driver.name || <span className="text-app-text/30">— sans nom —</span>}
          </p>
          {driver.description && <p className="text-xs text-app-text/50 leading-relaxed">{driver.description}</p>}
          {driver.ui_config?.themeColor && (
            <Ligne clef="Couleur">
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: driver.ui_config.themeColor }} />
                <code className="font-mono">{driver.ui_config.themeColor}</code>
              </span>
            </Ligne>
          )}
        </Bloc>

        <Bloc titre="Dés">
          <Ligne clef="Jet par défaut">{driver.dice?.defaultDice ?? '—'}</Ligne>
          <Ligne clef="Lecture">{driver.dice?.logic ? <Id valeur={driver.dice.logic} /> : '—'}</Ligne>
          {driver.dice?.engine && <Ligne clef="Moteur"><Id valeur={driver.dice.engine} /></Ligne>}
          {jet?.sens && <Ligne clef="Sens">{jet.sens}</Ligne>}
          {jet?.critique !== undefined && <Ligne clef="Critique">{jet.critique}</Ligne>}
          {jet?.complication !== undefined && <Ligne clef="Complication">{jet.complication}</Ligne>}
          {jet?.difficulte && (
            <Ligne clef="Difficulté">
              {jet.difficulte.min} à {jet.difficulte.max}, défaut {jet.difficulte.defaut}
            </Ligne>
          )}
        </Bloc>
      </div>

      {(jet?.seuil?.length || jet?.reserve || jet?.cible) && (
        <Bloc titre="Composition du jet">
          {/*
            **La cible calculée se montre en PREMIER, et elle manquait.**

            Ajoutée au modèle, aux contrôles et à la Forge le 2026-08-22, elle
            n'avait pas été ajoutée ici — l'écran qui sert précisément à relire
            un pilote avant de l'enregistrer. Un pilote dont la cible se calcule
            n'affichait donc RIEN de sa composition, et « aucun constat » se
            lisait comme « tout va bien » alors que ça pouvait aussi vouloir dire
            « il n'y a pas de cible du tout ».

            *Vérifier qu'une chose ne se plaint pas n'est pas vérifier qu'elle
            est là.*
          */}
          {jet.cible && (
            <>
              <Ligne clef="Cible">
                calculée par <Id valeur={jet.cible.mecanique} resolu={jet.cible.mecanique in MECANIQUES_DE_CIBLE} />
                {' '}— la caractéristique multiplie, elle ne s’additionne pas
              </Ligne>
              <Ligne clef="Caractéristique">
                <Id valeur={jet.cible.caracteristique?.id} /> pris dans la section{' '}
                <SectionsDeLaComposante
                  composante={jet.cible.caracteristique}
                  idsDeSections={idsDeSections}
                />
              </Ligne>
              {(jet.cible.ajustement ?? []).map((composante, i) => (
                <Ligne key={`ajustement-${i}`} clef={`${composante?.label ?? '—'} (ajustement)`}>
                  <Id valeur={composante?.id} /> pris dans la section{' '}
                  <SectionsDeLaComposante composante={composante} idsDeSections={idsDeSections} />
                </Ligne>
              ))}
            </>
          )}
          {(jet.seuil ?? []).map((composante, i) => (
            <Ligne key={i} clef={composante.label}>
              <Id valeur={composante.id} /> pris dans la section{' '}
              <SectionsDeLaComposante composante={composante} idsDeSections={idsDeSections} />
            </Ligne>
          ))}
          {/* Les composantes de la réserve se montrent comme celles du seuil :
              elles désignent des sections de la fiche, donc elles peuvent les
              manquer, donc elles doivent être relues avant d'enregistrer. */}
          {(jet.reserve?.composantes ?? []).map((composante, i) => (
            <Ligne key={`reserve-${i}`} clef={`${composante.label} (dés)`}>
              <Id valeur={composante.id} /> pris dans la section{' '}
              <SectionsDeLaComposante composante={composante} idsDeSections={idsDeSections} />
            </Ligne>
          ))}
          {jet.reserve && (
            <Ligne clef="Réserve de dés">
              {(jet.reserve.composantes?.length ?? 0) > 0
                ? <>{jet.reserve.base} + {jet.reserve.composantes!.map(c => c.label.toLowerCase()).join(' + ')}, jusqu’à {jet.reserve.max} dés à {jet.reserve.faces} faces</>
                : <>{jet.reserve.base} à {jet.reserve.max} dés à {jet.reserve.faces} faces</>}
              {jet.reserve.cout?.length ? `, coût ${jet.reserve.cout.join(' puis ')}` : ''}
              {jet.reserve.ressource && (
                <> — payés en <Id valeur={jet.reserve.ressource} resolu={(driver.ressourcesDeTable ?? []).some(r => r.id === jet.reserve?.ressource)} /></>
              )}
            </Ligne>
          )}
        </Bloc>
      )}

      {(driver.ressourcesDeTable?.length ?? 0) > 0 && (
        <Bloc titre="Monnaie de table">
          {driver.ressourcesDeTable!.map((ressource, i) => (
            <Ligne key={i} clef={ressource.label}>
              <Id valeur={ressource.id} /> — {ressource.proprietaire}, départ {ressource.depart},
              min {ressource.min}{ressource.max !== undefined ? `, max ${ressource.max}` : ', sans plafond'}
              {ressource.erosionFinDeScene ? `, −${ressource.erosionFinDeScene} en fin de scène` : ''}
              {ressource.reportSurEpuisement && (
                <> — trop-plein vers <Id valeur={ressource.reportSurEpuisement} resolu={driver.ressourcesDeTable!.some(r => r.id === ressource.reportSurEpuisement)} /></>
              )}
            </Ligne>
          ))}
        </Bloc>
      )}

      <Bloc titre="Combat">
        <Ligne clef="Ordre d'action">
          {combat?.initiative?.mode
            ? <>mode <Id valeur={combat.initiative.mode} /></>
            : combat?.initiativeFormula
              ? <code className="font-mono">{combat.initiativeFormula}</code>
              : <span className="text-app-text/30">aucun classement</span>}
        </Ligne>
        {combat?.defaultHealthType && <Ligne clef="Modèle de santé"><Id valeur={combat.defaultHealthType} /></Ligne>}
        {combat?.tacheDeDefaite && (
          <Ligne clef="Tâche de défaite">
            seuil lu dans <Id valeur={combat.tacheDeDefaite.sectionDuSeuil} resolu={idsDeSections.has(combat.tacheDeDefaite.sectionDuSeuil)} />
            {combat.tacheDeDefaite.champParDefaut && (
              <>, champ <Id valeur={combat.tacheDeDefaite.champParDefaut} resolu={tousLesChamps.has(combat.tacheDeDefaite.champParDefaut)} /></>
            )}
            {' '}({combat.tacheDeDefaite.seuil.min}–{combat.tacheDeDefaite.seuil.max}),
            progression {combat.tacheDeDefaite.progressionDeBase}
          </Ligne>
        )}
        {(combat?.statsToTrack ?? []).map((stat, i) => (
          <Ligne key={i} clef={i === 0 ? 'Jauges suivies' : ''}>
            {stat.label} → <Id valeur={stat.fieldId} resolu={tousLesChamps.has(stat.fieldId)} />
            {stat.isMainHP ? ' (jauge principale)' : ''}
          </Ligne>
        ))}
        {(combat?.damageTypes?.length ?? 0) > 0 && (
          <Ligne clef="Types de dégâts">{combat!.damageTypes!.join(', ')}</Ligne>
        )}
      </Bloc>

      {portees && (
        <Bloc titre="Distances">
          {Object.entries(portees).map(([clef, portee]) => (
            <Ligne key={clef} clef={clef}>
              {(portee as { label?: string })?.label ?? '—'}
              {(portee as { modifier?: number })?.modifier !== undefined && ` (modificateur ${(portee as { modifier: number }).modifier})`}
            </Ligne>
          ))}
        </Bloc>
      )}

      <Bloc titre={`Fiche de personnage — ${sections.length} section${sections.length > 1 ? 's' : ''}`}>
        {sections.length === 0 && (
          <p className="text-xs text-amber-300/70">Aucune section : la fiche ne porterait rien.</p>
        )}
        {sections.map(section => (
          <div key={section.id} className="space-y-1">
            <p className="text-xs font-bold text-app-text/80">
              {section.label} <Id valeur={section.id} />
            </p>
            <div className="flex flex-wrap gap-1.5 pl-3">
              {(section.fields ?? []).map(champ => (
                <span key={champ.id} className="text-ui-10 bg-app-text/5 border border-app-border/10 rounded-lg px-2 py-1">
                  {champ.label} <code className="font-mono text-app-text/40">{champ.id}</code>
                  <span className="text-app-text/30"> · {champ.type}</span>
                  {champ.max !== undefined && <span className="text-app-text/30"> · max {champ.max}</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Bloc>
    </div>
  );
};

export default RevueDuPilote;
