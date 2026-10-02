import type { LucideIcon } from 'lucide-react';
import {
    Zap, Flame, Droplets, Wind, CloudRain, CloudLightning, Skull, Sword, Swords, Shield,
    Footprints, DoorOpen, Bell, Siren, Radio, Bomb, Crosshair, Car, Plane, Rocket,
    Ghost, Bug, HeartPulse, Music, Mic, Sparkles, WandSparkles, Moon, Sun, TreePine,
    Waves, Bird, Dog, Cat, Cpu, Radar, TriangleAlert, Eye, Lock, Hammer,
    Users, Building2, Clock, Tv,
} from 'lucide-react';

/**
 * **Les icônes d'une atmosphère et d'une pastille d'effet sonore** — demandées
 * par David (*« pouvoir mettre des icônes dans un onglet »*), retenues avec la
 * maquette du son le 2026-09-27, posées le 2026-10-02 (refonte, L2).
 *
 * ⚠️ **On enregistre la CLÉ, jamais le composant ni son nom de bibliothèque.**
 * Une atmosphère garde `'pluie'`, pas `'CloudRain'` : le jour où la
 * bibliothèque renomme une icône, on corrige ici et toutes les atmosphères
 * suivent. C'est la règle des couleurs des pastilles de la Musique
 * (`couleursDePastille.ts`).
 *
 * Une palette et non tout le catalogue : quarante-quatre icônes choisies pour
 * ce qu'on bruite à une table — le temps, les armes, les lieux, les bêtes, la
 * technique. *Mille icônes, on ne les parcourt pas en séance.*
 */
export interface IconeDuSon {
    /** Ce que le meneur lit au survol. */
    nom: string;
    Icone: LucideIcon;
}

export const ICONES_DU_SON: Readonly<Record<string, IconeDuSon>> = {
    eclair: { nom: 'Éclair', Icone: Zap },
    feu: { nom: 'Feu', Icone: Flame },
    eau: { nom: 'Eau', Icone: Droplets },
    vent: { nom: 'Vent', Icone: Wind },
    pluie: { nom: 'Pluie', Icone: CloudRain },
    orage: { nom: 'Orage', Icone: CloudLightning },
    vagues: { nom: 'Vagues', Icone: Waves },
    foret: { nom: 'Forêt', Icone: TreePine },
    lune: { nom: 'Nuit', Icone: Moon },
    soleil: { nom: 'Jour', Icone: Sun },
    epee: { nom: 'Épée', Icone: Sword },
    combat: { nom: 'Combat', Icone: Swords },
    bouclier: { nom: 'Bouclier', Icone: Shield },
    viseur: { nom: 'Tir', Icone: Crosshair },
    bombe: { nom: 'Explosion', Icone: Bomb },
    marteau: { nom: 'Coup', Icone: Hammer },
    crane: { nom: 'Mort', Icone: Skull },
    coeur: { nom: 'Cœur', Icone: HeartPulse },
    fantome: { nom: 'Fantôme', Icone: Ghost },
    magie: { nom: 'Magie', Icone: Sparkles },
    baguette: { nom: 'Sort', Icone: WandSparkles },
    oeil: { nom: 'Regard', Icone: Eye },
    pas: { nom: 'Pas', Icone: Footprints },
    porte: { nom: 'Porte', Icone: DoorOpen },
    verrou: { nom: 'Serrure', Icone: Lock },
    cloche: { nom: 'Cloche', Icone: Bell },
    horloge: { nom: 'Horloge', Icone: Clock },
    foule: { nom: 'Foule', Icone: Users },
    ville: { nom: 'Ville', Icone: Building2 },
    voix: { nom: 'Voix', Icone: Mic },
    musique: { nom: 'Musique', Icone: Music },
    radio: { nom: 'Radio', Icone: Radio },
    ecran: { nom: 'Écran', Icone: Tv },
    machine: { nom: 'Machine', Icone: Cpu },
    radar: { nom: 'Radar', Icone: Radar },
    sirene: { nom: 'Sirène', Icone: Siren },
    alerte: { nom: 'Alerte', Icone: TriangleAlert },
    voiture: { nom: 'Véhicule', Icone: Car },
    avion: { nom: 'Avion', Icone: Plane },
    fusee: { nom: 'Fusée', Icone: Rocket },
    oiseau: { nom: 'Oiseau', Icone: Bird },
    chien: { nom: 'Chien', Icone: Dog },
    chat: { nom: 'Chat', Icone: Cat },
    insecte: { nom: 'Insecte', Icone: Bug },
};

/**
 * L'icône d'une clé — ou `null` : aucune choisie, **ou une clé inconnue**
 * (une icône retirée d'une version à l'autre, une sauvegarde plus ancienne).
 * *Une icône qu'on ne sait plus rendre se tait ; elle ne casse pas l'onglet.*
 */
export function iconeDuSon(cle: string | null | undefined): IconeDuSon | null {
    if (!cle) return null;
    return ICONES_DU_SON[cle] ?? null;
}
