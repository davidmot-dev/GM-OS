import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { decrireLaSante } from '../combat/logic/SanteDuCombattant';
import { natureParDefaut, estUnTypeDEvenement, TYPES_D_EVENEMENT } from './types';
import { laSceneCourante } from './sceneCourante';
import { rendreLeCompteRendu } from './compteRendu';
import { reparerLesTitres, rattacherLesCampagnes } from './titreDeJournal';
import { contexteDuJournal } from './contexteDeCampagne';
import type { JournalState, JournalEvent, Journal } from './types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import i18next from 'i18next';

const formatDuration = (ms: number): string => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      journals: [],
      activeJournalId: null,
      isRecording: false,

      startJournal: (campagne, sessionName, startSnapshot) => {
        const id = uuidv4();
        const now = Date.now();
        const actualSessionName = sessionName || i18next.t('modules:journal.dashboard.new_session');
        const title = `${campagne.nom} - ${format(now, 'dd/MM HH:mm')} (${actualSessionName})`;

        const newJournal: Journal = {
          id,
          title,
          /*
            **Le journal retient sa campagne, et non plus seulement son nom.**
            Le titre servait de rattachement, ce qui obligeait toute question sur
            la campagne d'une séance à passer par une correspondance de chaîne —
            et privait le résumé par IA de savoir à quel jeu il joue.
          */
          ...(campagne.id ? { campaignId: campagne.id } : {}),
          startTimestamp: now,
          events: [],
        };

        set((state) => ({
          journals: [newJournal, ...state.journals],
          activeJournalId: id,
          isRecording: true,
        }));

        // Initial SYSTEM events
        get().setActiveJournal(id); // Ensure we're targeting the new one
        
        get().addEvent({
          type: 'SYSTEM',
          title: i18next.t('modules:journal.events.session_start'),
          content: i18next.t('modules:journal.events.session_start_content', { 
            name: actualSessionName, 
            date: format(now, 'dd/MM/yyyy à HH:mm:ss') 
          })
        });

        if (startSnapshot) {
          if (startSnapshot.presentPlayers && startSnapshot.presentPlayers.length > 0) {
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.players_present'),
              content: i18next.t('modules:journal.events.players_present_content', { 
                players: startSnapshot.presentPlayers.map(p => `- ${p}`).join('\n')
              })
            });
          }

          if (startSnapshot.publicSummary) {
            get().addEvent({
              type: 'NOTE',
              title: i18next.t('modules:journal.events.synopsis'),
              content: startSnapshot.publicSummary
            });
          }
        }
      },

      stopJournal: (snapshot, pourLaSuite) => {
        const { activeJournalId, journals, isRecording } = get();
        if (!activeJournalId || !isRecording) return;

        const now = Date.now();
        const journal = journals.find(j => j.id === activeJournalId);
        if (!journal) return;

        const durationMs = now - journal.startTimestamp;
        const durationStr = formatDuration(durationMs);

        // Add termination events before stopping recording
        get().addEvent({
          type: 'SYSTEM',
          title: i18next.t('modules:journal.events.session_end'),
          content: i18next.t('modules:journal.events.session_end_content', { 
            date: format(now, 'dd/MM/yyyy à HH:mm:ss') 
          })
        });

        get().addEvent({
          type: 'SYSTEM',
          title: i18next.t('modules:journal.events.session_duration'),
          content: i18next.t('modules:journal.events.session_duration_content', { duration: durationStr })
        });

        // Process Snapshot Data
        if (snapshot) {
          if (snapshot.notes) {
            get().addEvent({
              type: 'NOTE',
              title: i18next.t('modules:journal.events.end_session_notes'),
              content: snapshot.notes
            });
          }

          if (snapshot.presentPCs && snapshot.presentPCs.length > 0) {
            const pcContent = snapshot.presentPCs
              // Le compte rendu n'annonce des points de vie que si le jeu en a.
              // Il écrivait « undefined/undefined HP » sur un jeu sans jauge.
              .map(pc => {
                const vie = decrireLaSante(pc);
                return `- **${pc.name}**${vie ? ` : ${vie}` : ''} (${pc.state})`;
              })
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.pc_status'),
              content: i18next.t('modules:journal.events.pc_status_content', { pcContent })
            });
          }

          if (snapshot.sessionEntities && snapshot.sessionEntities.length > 0) {
            const npcContent = snapshot.sessionEntities
              .map(npc => {
                const vie = decrireLaSante(npc);
                return `- **${npc.name}**${vie ? ` : ${vie}` : ''} (${npc.status})`;
              })
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.npc_status'),
              content: i18next.t('modules:journal.events.npc_status_content', { npcContent })
            });
          }

          if (snapshot.pendingChecklist && snapshot.pendingChecklist.length > 0) {
            const checklistContent = snapshot.pendingChecklist
              .map(item => `- [ ] ${item}`)
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.checklist_remaining'),
              content: i18next.t('modules:journal.events.checklist_remaining_content', { 
                checklist: checklistContent 
              })
            });
          }

          if (snapshot.clocks && snapshot.clocks.length > 0) {
            const clockContent = snapshot.clocks
              .map(c => `- **${c.name}**: ${c.filled}/${c.total} segments`)
              .join('\n');
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.clock_status'),
              content: i18next.t('modules:journal.events.clock_status_content', { clockContent })
            });
          }

          if (snapshot.whiteboardSnapshot) {
            get().addEvent({
              type: 'SYSTEM',
              title: i18next.t('modules:journal.events.whiteboard_save'),
              content: i18next.t('modules:journal.events.whiteboard_save_content'),
              metadata: { whiteboardPaths: snapshot.whiteboardSnapshot }
            });
          }
        }

        set((state) => ({
          isRecording: false,
          journals: state.journals.map((j) => {
            if (j.id === activeJournalId) {
              return {
                ...j,
                endTimestamp: now,
                duration: durationStr,
                /*
                  **On garde l'instantané, on ne fait plus que le raconter.**
                  Il était uniquement transformé en événements `SYSTEM` — donc
                  dilué dans le fil, et rien n'en restait d'exploitable. C'est la
                  matière de la deuxième section du compte rendu, et elle se
                  calcule sans modèle.

                  Les événements restent : pendant la partie, le fil est ce
                  qu'on regarde. *On ne supprime pas, on distingue.*
                */
                ...(snapshot ? { etatDeFin: snapshot } : {}),
                ...(pourLaSuite ? { pourLaSuite } : {}),
              };
            }
            return j;
          }),
        }));
      },

      addEvent: (eventData) => set((state) => {
        if (!state.activeJournalId || (!state.isRecording && eventData.type !== 'NOTE' && eventData.type !== 'SYSTEM')) {
          return state;
        }

        /*
          **Un journal clos ne reçoit plus rien.**

          `isRecording` ne suffit pas : les `NOTE` et les `SYSTEM` le
          contournent délibérément — c'est ce qui permet au meneur d'écrire une
          note hors enregistrement. Mais rien ne regardait le journal VISÉ, et
          `activeJournalId` désigne aussi bien celui qu'on enregistre que celui
          qu'on a simplement sélectionné pour le relire. Ouvrir une séance
          archivée pour la consulter suffisait donc à ce que le prochain
          événement automatique s'y ajoute — après son `endTimestamp`, après que
          sa durée et son état de fin ont été calculés.

          *Une séance close est un compte rendu, pas un cahier.* Le fil qu'elle
          porte a servi à produire son résumé et son état de fin ; le grossir
          après coup rend faux ce qui en a déjà été tiré, sans que rien ne le
          signale.

          On se tait, mais pas en silence : la console dit ce qui a été refusé,
          parce qu'un événement perdu sans un mot est exactement ce qu'on
          reproche au reste du module.
        */
        /*
          **Un type inventé ne passe plus sans un mot.**

          `type: 'STORY' as any` est parti d'ici pendant des mois, depuis le
          générateur de narration : un `as any` au départ, et plus personne ne
          vérifiait rien. Toutes les conséquences étaient silencieuses —
          `natureParDefaut` ne le reconnaissait pas, donc `trace`, donc écarté du
          résumé, donc la vision de l'Oracle n'entrait jamais dans la chronique ;
          et sans entrée dans `eventIcons`, la ligne s'affichait sans icône.

          **On garde l'événement et on crie.** Le perdre punirait le meneur d'un
          défaut de code, et une donnée jetée en silence est précisément ce
          qu'on reproche au reste du module.
        */
        if (!estUnTypeDEvenement(eventData.type)) {
          console.error(
            `[JournalStore] Type d'événement inconnu : « ${eventData.type} » ` +
            `(« ${eventData.title} »). Il sera traité comme une trace et n'entrera ` +
            `dans aucun résumé. Types connus : ${TYPES_D_EVENEMENT.join(', ')}.`,
          );
        }

        const cible = state.journals.find(j => j.id === state.activeJournalId);
        if (!cible) return state;
        if (cible.endTimestamp) {
          console.warn(
            `[JournalStore] « ${eventData.title} » (${eventData.type}) refusé : ` +
            `la séance « ${cible.title} » est close depuis le ` +
            `${new Date(cible.endTimestamp).toLocaleString()}.`,
          );
          return state;
        }

        /*
          **La nature se pose au goulot.** Trente-cinq émetteurs écrivent ici ;
          leur demander à tous de déclarer un axe de plus aurait produit trente
          oublis. Le type porte déjà l'essentiel — seuls ceux dont la nature le
          contredit la disent, et ils sont deux.
        */
        const newEvent: JournalEvent = {
          ...eventData,
          nature: eventData.nature ?? natureParDefaut(eventData.type),
          /*
            **La scène se pose au goulot, comme la nature, et pour la même
            raison.** Le § 9 exige un rattachement automatique ; il ne l'était
            que pour le combat, et 29 des 36 émetteurs n'en portaient aucun. La
            curation scène par scène n'aurait eu à ranger que du combat.

            L'émetteur qui sait garde la main : le combat connaît sa scène mieux
            que la trame ne la devine, et son `sceneId` passe ici intact.
          */
          sceneId: eventData.sceneId ?? laSceneCourante(),
          id: uuidv4(),
          timestamp: Date.now(),
        };

        return {
          journals: state.journals.map((j) => 
            j.id === state.activeJournalId 
              ? { ...j, events: [newEvent, ...j.events] } 
              : j
          )
        };
      }),

      removeEvent: (journalId, eventId) => set((state) => ({
        journals: state.journals.map((j) => 
          j.id === journalId 
            ? { ...j, events: j.events.filter((e) => e.id !== eventId) } 
            : j
        )
      })),

      updateEvent: (journalId, eventId, updates) => set((state) => ({
        journals: state.journals.map((j) => 
          j.id === journalId 
            ? { ...j, events: j.events.map((e) => e.id === eventId ? { ...e, ...updates } : e) } 
            : j
        )
      })),

      deleteJournal: (id) => set((state) => ({
        journals: state.journals.filter((j) => j.id !== id),
        activeJournalId: state.activeJournalId === id ? null : state.activeJournalId,
        isRecording: state.activeJournalId === id ? false : state.isRecording,
      })),

      setActiveJournal: (id) => set({ activeJournalId: id }),

      toggleRecording: (status) => set((state) => ({
        isRecording: status !== undefined ? status : !state.isRecording
      })),

      /*
        **Le résumé se range sur le journal, plus dans ses événements.**

        Il y était écrit par `addEvent` — donc il rejoignait `journal.events`,
        que `summarizeSession` prend en entrée. Régénérer réinjectait le résumé
        précédent, et la contamination s'aggravait à chaque passe. Le ranger
        ailleurs supprime la boucle **par construction**, sans filtre à tenir.

        L'échec, lui, reste un événement : c'est un fait de la séance, daté, et
        sa place est dans le fil. Mais il ne prend plus la place du résumé — la
        phrase d'excuse ne peut plus être lue comme un compte rendu.
      */
      generateAISummary: async (journalId) => {
        const journal = get().journals.find(j => j.id === journalId);
        if (!journal || journal.events.length === 0) return;

        /*
          **On n'envoie au modèle que ce qui raconte.** Jusqu'ici
          `summarizeSession(journal.events)` recevait TOUT, « l'initiative a été
          tirée pour 6 combattants » compris. Trois dégâts, chiffrés dans le plan
          du 2026-08-08 : l'invite gonfle et se fait tronquer à 16 384 jetons, le
          signal narratif se dilue, et le résumé risque de raconter des jets de
          dés.

          Le tri se fait ici et non dans `summarizeSession` : c'est le journal
          qui sait ce que ses événements valent, le service d'IA ne voit que du
          texte.
        */
        const recit = journal.events.filter(e => (e.nature ?? natureParDefaut(e.type)) === 'chronique');
        if (recit.length === 0) {
          /*
            Rien à raconter n'est pas une panne — une séance de préparation pure
            existe. On le dit, et on ne paie pas un appel pour l'apprendre.

            **On le dit en levant, et non en écrivant dans le journal.** Ces deux
            messages y étaient déposés en `SYSTEM`, ce qui les rendait faux deux
            fois : ils salissaient le fil d'une séance close avec du bruit
            d'outil, et surtout `generateAISummary` revenait alors NORMALEMENT —
            de sorte que l'écran annonçait « Résumé narratif généré ! » sur un
            résumé qui n'existait pas. *Le geste qui rassure n'est pas le geste
            qui vérifie.*
          */
          throw new Error(i18next.t('modules:journal.messages.nothing_to_summarize'));
        }

        try {
          const { aiService } = await import('../ai/AIService');
          /*
            **Le modèle doit savoir à quel jeu il joue.** Sans cadre il en
            invente un : la séance du 19/08, jouée sur Alien à Hadley Hope, lui a
            valu le titre « Chroniques des Terres Oubliées » et un récit
            d'heroic-fantasy. Le contexte se relève ici, où l'on tient le
            journal ; le service d'IA, lui, ne voit que du texte.
          */
          // La note du journal qu'on résume, pas celle du journal sélectionné.
          const summary = await aiService.summarizeSession(
            recit, journal.finalNote, contexteDuJournal(journal),
          );

          set((state) => ({
            journals: state.journals.map(j =>
              j.id === journalId ? { ...j, resumeIA: summary, resumeGenereLe: Date.now() } : j),
          }));
        } catch (err) {
          console.error("[JournalStore] AI Summary failed:", err);
          // Levée jusqu'à l'écran, qui sait afficher une erreur. L'avaler ici
          // faisait annoncer un succès sur un résumé absent.
          throw err instanceof Error
            ? err
            : new Error(i18next.t('modules:journal.events.ai_summary_error'));
        }
      },

      syncToNotebook: async (journalId) => {
        const journal = get().journals.find(j => j.id === journalId);
        if (!journal) return;

        /*
          **Le résumé se lit sur son champ, plus par son titre traduit.**

          `journal.events.find(e => e.title === t('…ai_summary'))` liait une
          relation structurelle à une chaîne d'AFFICHAGE : générer le résumé en
          français puis basculer l'interface en anglais cassait le lien, et
          l'envoi échouait sur « pas de résumé » alors qu'il était là. Même
          famille de fragilité que l'appariement jeton ↔ combattant du Cortex.
        */
        const resume = journal.resumeIA?.trim();
        if (!resume) {
          throw new Error(i18next.t('modules:journal.messages.no_ai_summary'));
        }

        // Get notebook URL from SessionOS
        try {
          const { useSessionOSStore } = await import('../session/useSessionOSStore');
          const { campaigns, activeCampaignId } = useSessionOSStore.getState();
          const campaign = campaigns.find(c => c.id === activeCampaignId);

          if (!campaign?.notebookUrl) {
            throw new Error(i18next.t('modules:journal.messages.no_notebook'));
          }

          // Extract ID from URL: https://notebooklm.google.com/notebook/ID
          const notebookIdMatch = campaign.notebookUrl.match(/notebook\/([a-zA-Z0-9-]+)/);
          const notebookId = notebookIdMatch ? notebookIdMatch[1] : null;

          if (!notebookId) {
            throw new Error(i18next.t('modules:journal.messages.invalid_notebook_url'));
          }

          console.log(`[JournalStore] Syncing to Notebook: ${notebookId}`);
          
          if (window.appBridge?.mcp?.callTool) {
            // `source_add` remplace `notebook_add_text` depuis la bascule vers
            // le client Gemini Notebook, et prend ses arguments à plat plutôt
            // qu'enveloppés dans `request`.
            await window.appBridge.mcp.callTool('notebooklm-mcp-server', 'source_add', {
              notebook_id: notebookId,
              source_type: 'text',
              /*
                **Le compte rendu entier, pas le seul récit.** L'état des lieux
                et ce qui attend sont exactement ce qu'on relit avant la séance
                suivante — et ils ne coûtent rien, puisqu'ils sont déjà calculés.
                Le garde ci-dessus reste sur le récit : un compte rendu sans
                narration n'est pas une source de chronique.
              */
              text: rendreLeCompteRendu(journal),
              title: `Résumé Session: ${journal.title}`
            });
          } else {
            throw new Error(i18next.t('modules:journal.messages.notebook_not_available'));
          }

        } catch (err: any) {
          console.error("[JournalStore] Sync failed:", err);
          throw err;
        }
      },

      updateJournalNote: (journalId, note) => set((state) => ({
        journals: state.journals.map((j) => j.id === journalId ? { ...j, finalNote: note } : j)
      })),

      addJournal: (name) => {
        const id = uuidv4();
        const newJournal: Journal = {
          id,
          title: name,
          startTimestamp: Date.now(),
          events: [],
        };
        set((state) => ({
          journals: [newJournal, ...state.journals],
          activeJournalId: id,
        }));
      },

      /*
        **Réparer les titres écrits avec un identifiant de campagne.**

        `launchSession` passait `session.campaignId` à `startJournal`, qui compose
        le titre une fois pour toutes. Corriger l'appelant ne répare que les
        séances à venir — celles déjà archivées gardaient
        « c-1187082150026-gtbgs - 18/08 21:59 » pour toujours, alors qu'un titre
        de journal existe précisément pour être relu des mois plus tard.

        Une action plutôt qu'une migration `persist` : la réparation a besoin des
        campagnes, qui vivent dans un AUTRE store persisté. Se fier à l'ordre de
        réhydratation de deux stores indépendants, c'est parier sur un détail
        d'implémentation ; l'écran, lui, sait qu'il a les deux.

        Idempotente, et **sans aucun appel à `set` quand rien ne change** : elle
        tourne à chaque ouverture de l'écran, et `set` fabrique un nouvel état
        même pour un objet vide — donc un rendu de plus et une écriture dans le
        stockage persisté, à chaque fois, pour rien.
      */
      reparerLesTitresDeCampagne: (campagnes) => {
        const { journals } = get();
        /*
          **Le rattachement d'abord, le titre ensuite.**

          `rattacherLesCampagnes` reconnaît les deux formes de titre — celle
          d'avant le 18/08 qui porte l'identifiant, celle d'après qui porte le
          nom — donc l'ordre ne lui importe pas. Mais partir du titre non réparé
          garde la signature la plus exacte des deux : l'identifiant.

          Les deux passes conservent le tableau reçu quand elles n'ont rien à
          faire, si bien que la comparaison finale reste vraie et qu'aucune
          écriture n'a lieu pour rien.
        */
        const rattaches = rattacherLesCampagnes(journals, campagnes);
        const repares = reparerLesTitres(rattaches, campagnes);
        if (repares === journals) return;
        set({ journals: repares as Journal[] });
      },

      clearJournal: () => set({ journals: [], activeJournalId: null, isRecording: false }),
    }),
    {
      name: 'journal-os-storage-v2', // Versioned storage to avoid conflicts with previous schema
    }
  )
);

if (typeof window !== 'undefined') {
  (window as any).useJournalStore = useJournalStore;
}
