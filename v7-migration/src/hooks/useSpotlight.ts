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
  type LucideIcon
} from 'lucide-react';

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

  const results = useMemo(() => {
    if (!query.trim()) return [];

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

    return matches; // Show all results as requested
  }, [query, entities, atlasMaps, wikiEntries, customGameDrivers, ruleForgeDocs, playlists, presets, scenes, atmospheres, setActiveModule, setCurrentView, setSelectedAtlasMap, setSelectedEntity, setSelectedWikiEntryId, playPad, loadTheme, applyScene]);

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
