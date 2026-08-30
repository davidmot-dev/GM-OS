import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSessionStore, type ModuleID } from '../store/useSessionStore';
import { useSessionOSStore } from '../modules/session/useSessionOSStore';
import { useMusicStore } from '../modules/music/useMusicStore';
import { useAmbientStore } from '../modules/ambient/useAmbientStore';
import { useSoundStore } from '../modules/sound/useSoundStore';
import { 
  User, 
  Music, 
  Wind, 
  Map as MapIcon, 
  Book, 
  Terminal,
  Zap,
  Volume2,
  Settings,
  Hammer,
  LayoutGrid,
  type LucideIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CATALOGUE_DES_MODULES, MODULES_ATTEIGNABLES } from '../data/catalogueDesModules';
import { useRaccourcisStore } from '../stores/useRaccourcisStore';

export type SpotlightCategory = 'entity' | 'audio' | 'map' | 'rule' | 'action';

export interface SpotlightResult {
  id: string;
  type: SpotlightCategory;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  action: () => void;
  shortcut?: string;
}

export const useSpotlight = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { t } = useTranslation(['modules']);
  const places = useRaccourcisStore(s => s.places);

  const { setActiveModule } = useSessionStore();
  const { 
    entities, 
    atlasMaps, 
    wikiEntries, 
    customGameDrivers, 
    setSelectedEntity, 
    setSelectedAtlasMap, 
    setSelectedWikiEntryId,
    setCurrentView 
  } = useSessionOSStore();

  const [ruleForgeDocs, setRuleForgeDocs] = useState<any[]>([]);

  // Fetch rule forge docs on mount
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await window.appBridge?.ai?.listDocs?.() || [];
        // Flatten the tree to a simple list of files
        const flatten = (items: any[]): any[] => {
          return items.reduce((acc, item) => {
            if (item.type === 'directory') return [...acc, ...flatten(item.children || [])];
            return [...acc, item];
          }, []);
        };
        setRuleForgeDocs(flatten(docs));
      } catch (err) {
        console.error("Error fetching docs for spotlight:", err);
      }
    };
    fetchDocs();
  }, []);
  
  const { playlists, playPad } = useMusicStore();
  const { presets, scenes, loadTheme, applyScene } = useAmbientStore();
  const { atmospheres } = useSoundStore();

  /**
   * **Les vingt modules, en tête de palette.**
   *
   * *« L'application devient très complexe »* — David, 2026-08-30. La palette
   * cherchait du **contenu** : des PNJ, des lieux, des entrées de wiki. Elle ne
   * savait pas ouvrir un module, et surtout elle ne rendait **rien** tant qu'on
   * n'avait pas tapé quelque chose : ouverte, elle était vide, donc elle
   * n'apprenait rien à personne.
   *
   * Elle liste maintenant les destinations dès l'ouverture, et les filtre au
   * fil de la frappe comme le reste. Les noms viennent de `modules:names.<id>`,
   * la clé de la barre latérale — un module renommé l'est aux deux endroits.
   */
  const destinations = useMemo<SpotlightResult[]>(
    () => MODULES_ATTEIGNABLES.map(id => ({
      id: `module-${id}`,
      type: 'action' as const,
      title: t(CATALOGUE_DES_MODULES[id].cle),
      subtitle: 'Aller à',
      icon: LayoutGrid,
      action: () => {
        setActiveModule(id);
        setIsOpen(false);
      },
      /*
        La place assignée s'affiche à côté du nom : la palette devient ainsi
        l'endroit où l'on apprend ses propres raccourcis, au lieu d'un écran de
        réglages qu'on ne rouvre jamais.
      */
      shortcut: places.indexOf(id) >= 0 ? `Ctrl+${places.indexOf(id) + 1}` : undefined,
    })),
    [t, setActiveModule, places],
  );

  const results = useMemo(() => {
    const recherche = query.trim().toLowerCase();

    // À vide, on montre où l'on peut aller — et rien d'autre : chercher du
    // contenu sans critère renverrait toute la campagne.
    if (!recherche) return destinations;

    const destinationsFiltrees = destinations.filter(d =>
      d.title.toLowerCase().includes(recherche));

    const searchStr = query.toLowerCase();
    const matches: SpotlightResult[] = [];

    // 1. Entities
    entities.forEach(entity => {
      if (entity.name.toLowerCase().includes(searchStr) || entity.description.toLowerCase().includes(searchStr)) {
        matches.push({
          id: `entity-${entity.id}`,
          type: 'entity',
          title: entity.name,
          subtitle: `Entité • ${entity.description}`,
          icon: User,
          action: () => {
            setSelectedEntity(entity.id);
            setActiveModule('dashboard' as ModuleID);
            setCurrentView('npc-gallery');
            setIsOpen(false);
          }
        });
      }
    });

    // 2. Maps
    atlasMaps.forEach(map => {
      if (map.name.toLowerCase().includes(searchStr)) {
        matches.push({
          id: `map-${map.id}`,
          type: 'map',
          title: map.name,
          subtitle: `Atlas • ${map.type}`,
          icon: MapIcon,
          action: () => {
            setSelectedAtlasMap(map.id);
            setActiveModule('dashboard' as ModuleID);
            setCurrentView('world-atlas');
            setIsOpen(false);
          }
        });
      }
    });

    // 3. Audio - Music Pads
    playlists.forEach(pl => {
      pl.pads.forEach(pad => {
        if (pad.label.toLowerCase().includes(searchStr)) {
          matches.push({
            id: `pad-${pad.id}`,
            type: 'audio',
            title: pad.label,
            subtitle: `Musique • Playlist: ${pl.name}`,
            icon: Music,
            action: () => {
              playPad(pad);
              setIsOpen(false);
            }
          });
        }
      });
    });

    // 4. Audio - Ambient Themes & Scenes
    presets.forEach(p => {
      if (p.name.toLowerCase().includes(searchStr)) {
        matches.push({
          id: `theme-${p.id}`,
          type: 'audio',
          title: p.name,
          subtitle: `Ambiance • Univers: ${p.universe}`,
          icon: Wind,
          action: () => {
            loadTheme(p.universe, p.name);
            setIsOpen(false);
          }
        });
      }
    });

    scenes.forEach(s => {
      if (s.name.toLowerCase().includes(searchStr)) {
        matches.push({
          id: `scene-${s.id}`,
          type: 'audio',
          title: s.name,
          subtitle: `Scène Ambient • ${s.description}`,
          icon: Volume2,
          action: () => {
            applyScene(s.id);
            setIsOpen(false);
          }
        });
      }
    });

    // 4.5 Sound Atmospheres
    atmospheres.forEach(a => {
      if (a.name.toLowerCase().includes(searchStr)) {
        matches.push({
          id: `atmos-${a.id}`,
          type: 'audio',
          title: a.name,
          subtitle: `Atmosphère Sound • ${Object.keys(a.pads).length} pads`,
          icon: Zap,
          action: () => {
            useSoundStore.getState().setActiveAtmosphereId(a.id);
            setIsOpen(false);
          }
        });
      }
    });

    // 5. Rules / Wiki
    wikiEntries.forEach(entry => {
      if (entry.title.toLowerCase().includes(searchStr)) {
        matches.push({
          id: `wiki-${entry.id}`,
          type: 'rule',
          title: entry.title,
          subtitle: `Wiki • ${entry.category}`,
          icon: Book,
          action: () => {
            setSelectedWikiEntryId(entry.id);
            setActiveModule('dashboard' as ModuleID);
            setCurrentView('timeline-wiki');
            setIsOpen(false);
          }
        });
      }
    });

    // 6. Drivers
    customGameDrivers.forEach(driver => {
      if (driver.name.toLowerCase().includes(searchStr)) {
        matches.push({
          id: `driver-${driver.id}`,
          type: 'rule',
          title: driver.name,
          subtitle: 'Système • Game Driver',
          icon: Terminal,
          action: () => {
            setActiveModule('dashboard' as ModuleID);
            setCurrentView('driver-editor');
            setIsOpen(false);
          }
        });
      }
    });

    // 6.5 Rule Forge Docs (Fiches)
    ruleForgeDocs.forEach(doc => {
      if (doc.name.toLowerCase().includes(searchStr)) {
        matches.push({
          id: `forged-${doc.path}`,
          type: 'rule',
          title: doc.name.replace('.md', ''),
          subtitle: `Forge • ${doc.path}`,
          icon: Hammer,
          action: () => {
            setActiveModule('dashboard' as ModuleID);
            setCurrentView('rule-workshop');
            setIsOpen(false);
          }
        });
      }
    });

    // 7. Core Actions
    if ('settings'.includes(searchStr)) {
      matches.push({
        id: 'action-settings',
        type: 'action',
        title: 'Paramètres du Système',
        subtitle: 'Apparence, Audio & Sessions',
        icon: Settings,
        action: () => {
          // Open settings logic if applicable, or just navigate
          setActiveModule('dashboard' as ModuleID);
          setIsOpen(false);
        }
      });
    }

    /*
      Les destinations passent devant. Taper « com » doit d'abord proposer
      d'ouvrir Combat-OS, pas de dérouler les quarante PNJ dont le nom contient
      ces trois lettres — *ce qu'on cherche le plus souvent doit se trouver sans
      viser.*
    */
    return [...destinationsFiltrees, ...matches];
  }, [query, destinations, entities, atlasMaps, wikiEntries, customGameDrivers, ruleForgeDocs, playlists, presets, scenes, atmospheres, setActiveModule, setCurrentView, setSelectedAtlasMap, setSelectedEntity, setSelectedWikiEntryId, playPad, loadTheme, applyScene]);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (results.length || 1));
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1));
      }

      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        results[selectedIndex].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, toggle]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return {
    isOpen,
    setIsOpen,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex
  };
};
