import type { EtatsDuHub } from '../../../utils/magasinsDuHub';
import type { RemoteSyncData } from './remote.types';
import type { ApparenceTablettes } from '../../../theme/apparenceTablettes';
import type { RollRecord } from '../../../stores/useDiceStore';
import type { ComponentProps } from 'react';
import type { HubRuleViewer } from '../../../components/hub/HubRuleViewer';

type Session = EtatsDuHub['useSessionOSStore'];

/** Données seulement : les méthodes et l'état privé des magasins ne voyagent pas. */
export type SessionDuHub = Partial<Pick<Session,
    'sessions' | 'campaigns' | 'players' | 'clues' | 'entities' | 'atlasMaps'
    | 'customSheetTemplates' | 'customGameDrivers' | 'decks' | 'mainsDesPaquets'
    | 'demandesDeCarte' | 'cartesRestantes' | 'connectedCharacters'
    | 'activeCampaignId' | 'activeCampaignName' | 'activeCampaignWallpaper'
>> & {
    characterLocks?: Session['connectedCharacters'];
    favorites?: EtatsDuHub['useFavoriteStore']['favorites'];
    reservesDeTable?: EtatsDuHub['useRessourcesDeTableStore']['reserves'][string];
    activeDiceConfig?: NonNullable<RemoteSyncData['session']>['activeDiceConfig'];
    desEchelonnes?: boolean;
};

/** JSON transforme Date en chaîne ; IPC peut encore transmettre la Date. */
export type JetTransmis = Omit<RollRecord, 'timestamp'> & { timestamp: Date | string };
export type DesDuHub = Partial<Pick<EtatsDuHub['useDiceStore'],
    'isDiceProjected' | 'projectionTrigger' | 'enable3D' | 'styleDesDes'
>> & { lastRoll?: JetTransmis | null };

export type HorlogesDuHub = Partial<Pick<EtatsDuHub['useClockStore'],
    'timestamp' | 'mode' | 'theme' | 'tensions' | 'timerRemaining' | 'timerIsRunning'
    | 'timerLabel' | 'timerDuration' | 'isClockProjected'
>>;
export type CarteDuHub = Partial<Pick<EtatsDuHub['useMapStore'],
    'projectionTarget' | 'projectedMapUrl' | 'projectedIsVideo' | 'projectedTokens'
    | 'projectedPings' | 'projectedFogDataUrl' | 'projectedMapWidth' | 'projectedMapHeight'
    | 'projectedIsGridEnabled' | 'projectedGridSize' | 'projectedGridColor'
    | 'projectedGridOpacity' | 'projectedIsMapMuted' | 'projectedMapVolume'
>>;
export type TableauDuHub = Partial<Pick<EtatsDuHub['useWhiteboardStore'],
    'paths' | 'activePath' | 'laserPointer' | 'backgroundMode' | 'currentTool'
    | 'currentColor' | 'currentWidth' | 'activeDrawerId' | 'version' | 'projectionTarget'
>> & { pathsCount?: number };
export type CombatDuHub = Partial<Pick<EtatsDuHub['useCombatStore'],
    'combatants' | 'currentTurnIdx' | 'round' | 'isCombatProjected'
>>;

/** Contrat commun des diffusions complètes ET partielles, contrôlé à l'émission. */
export type DonneesDuHub = Partial<Omit<RemoteSyncData,
    'apparence' | 'clock' | 'combat' | 'session' | 'dice' | 'whiteboard' | 'notes'
>> & {
    apparence?: ApparenceTablettes | null;
    clock?: HorlogesDuHub;
    combat?: CombatDuHub;
    session?: SessionDuHub;
    dice?: DesDuHub;
    map?: CarteDuHub;
    whiteboard?: TableauDuHub;
    notes?: Partial<RemoteSyncData['notes']>;
    voiceLevel?: number;
};

export type RegleDuHub = NonNullable<ComponentProps<typeof HubRuleViewer>['rule']>;
