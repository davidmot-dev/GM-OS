import { useMapStore } from './useMapStore';
import { claimProjection } from '../../services/projectionExclusivity';

/**
 * **Un brouillard entièrement levé** — un PNG d'un pixel, transparent.
 *
 * Les deux toiles, celle du meneur (`FogEngine.loadFromDataUrl`) et celle des
 * joueurs (`PlayerMapCanvas`), **étirent** le brouillard aux dimensions de la
 * carte : un seul pixel transparent devient une carte entière révélée, quelle
 * que soit sa taille — qu'on ne connaît pas encore quand un moment la charge.
 *
 * ⛔ **Pourquoi pas `triggerFogCommand('reveal_all')`**, qui existe : cette
 * commande n'est exécutée que par `MapCanvas`, qui ne vit que dans l'écran de
 * Map-OS. Depuis le Storyboard, elle attendrait en silence que le meneur ouvre
 * Map-OS — *et révélerait la carte à ce moment-là, au milieu d'une autre scène.*
 */
export const BROUILLARD_LEVE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==';

/**
 * **Projeter la carte tactique chargée — sur le Player Hub ou sur un moniteur.**
 *
 * Extrait de `MapProjectionModal` le 2026-09-25, quand le Storyboard a voulu
 * choisir l'écran de sa carte. *Une seconde porte n'est pas un second
 * écrivain* : la modale et le moment passent par ici, et la règle
 * d'exclusivité avec le tableau blanc ne peut plus s'oublier dans l'une des deux.
 *
 * @param cible `'hub'`, ou l'identifiant d'un moniteur
 * @returns `false` si rien n'a pu partir — aucune carte chargée, ou pas de pont
 *          vers les moniteurs.
 */
export function projeterLaCarteSur(cible: string): boolean {
    if (cible === 'hub') {
        // La carte et le tableau ne cohabitent pas. Libérer avant de projeter :
        // l'ordre inverse diffuserait un état où les deux sont actifs.
        claimProjection('map');

        /*
          ⛔ **La cible se pose AVANT la synchronisation.** `syncToPlayers`
          garde celle qu'il trouve (`projectionTarget || 'hub'`) : une carte
          déjà sur un moniteur restait donc en `'monitor'`, puis on fermait les
          moniteurs — **et elle n'était plus nulle part**. Défaut de la modale
          d'origine, trouvé le 2026-09-25 en écrivant le retour d'un moment.
        */
        useMapStore.setState({ projectionTarget: 'hub', ecranDeLaCarte: null });

        // `start` : c'est un geste du MJ qui démarre la projection de la carte.
        useMapStore.getState().syncToPlayers({ start: true });

        // Ensure physical displays are closed when projecting to Hub (Exclusivity)
        window.appBridge?.image?.closeAllDisplays?.();
        return true;
    }

    const bridge = window.appBridge;
    const {
        mapUrl, isVideo, fogDataUrl, tokens, pings, magicEffects,
        weatherType, weatherIntensity,
        mapWidth, mapHeight, isGridEnabled, gridSize, gridColor, gridOpacity,
    } = useMapStore.getState();
    if (!bridge?.image?.launchDisplay || !mapUrl) return false;

    claimProjection('map');

    // We consolidate the state update in ONE call to avoid multiple broadcasts/race conditions
    // We set projectionTarget to 'monitor' so Hub doesn't show it, while physical displays do
    useMapStore.setState({
        projectionTarget: 'monitor',
        ecranDeLaCarte: cible,
        projectedMapUrl: mapUrl,
        projectedIsVideo: isVideo,
        projectedFogDataUrl: fogDataUrl,
        projectedTokens: [...tokens],
        projectedPings: [...pings],
        projectedMagicEffects: [...magicEffects],
        projectedWeatherType: weatherType,
        projectedWeatherIntensity: weatherIntensity,
        projectedMapWidth: mapWidth,
        projectedMapHeight: mapHeight,
        projectedIsGridEnabled: isGridEnabled,
        projectedGridSize: gridSize,
        projectedGridColor: gridColor,
        projectedGridOpacity: gridOpacity,
    });

    // Signal tactical map mode to the projector window
    bridge.image.launchDisplay(['__tactical_map__'], cible);
    return true;
}
