import { Music, Waves, Sun, Map as MapIcon, Image as ImageIcon, Volume2, Type, type LucideIcon } from 'lucide-react';
import type { StoryboardMoment } from './useStoryboardStore';

/**
 * **Les sept sources qu'un moment peut toucher** — les colonnes du tableau du
 * storyboard (refonte, L5, étape 2).
 *
 * Une ligne par moment, une colonne par source : ce que chaque moment
 * déclenche se lit d'un coup d'œil, et **les colonnes vides disent aussi ce
 * qu'il ne touche pas**. La maquette oubliait le titre affiché sur l'écran des
 * joueurs ; le diaporama vit dans la colonne de l'image, parce qu'un moment
 * montre l'un **ou** l'autre.
 *
 * Les couleurs sont celles de catégorie (`gm-*`), pas des états : la musique
 * n'est pas une « information », elle est la musique.
 */
export type CleDeSource = 'musique' | 'ambiance' | 'lumiere' | 'carte' | 'image' | 'bruitage' | 'titre';

export interface SourceDuMoment {
    cle: CleDeSource;
    icone: LucideIcon;
    /** La clé i18n de son nom. */
    libelle: string;
    /** La couleur de l'icône, et le fond de sa case quand le moment la touche. */
    teinte: string;
    fond: string;
    /** Le moment touche-t-il cette source ? */
    touche: (moment: StoryboardMoment) => boolean;
}

/*
  ⚠️ **Un volume seul touche la source.** Un moment qui ne pose que le dosage
  de la musique — 0, c'est « coupe » — agit sur elle : sa case doit s'allumer.
  D'où `typeof … === 'number'` et non une simple vérité, qui avalerait le zéro.
*/
const unVolume = (v: unknown) => typeof v === 'number';

export const SOURCES_DU_MOMENT: readonly SourceDuMoment[] = [
    { cle: 'musique', icone: Music, libelle: 'modules:storyboard.editor.music_label', teinte: 'text-etat-info', fond: 'bg-etat-info/15 border-etat-info/40',
      touche: m => !!m.musicPadId || unVolume(m.musicVolume) },
    { cle: 'ambiance', icone: Waves, libelle: 'modules:storyboard.editor.ambient_label', teinte: 'text-gm-cyan', fond: 'bg-gm-cyan/15 border-gm-cyan/40',
      touche: m => !!(m.ambientSceneId || m.ambientThemeId) || unVolume(m.ambientVolume) },
    { cle: 'lumiere', icone: Sun, libelle: 'modules:storyboard.editor.light_label', teinte: 'text-gm-gold', fond: 'bg-gm-gold/15 border-gm-gold/40',
      touche: m => !!m.lightSceneId },
    { cle: 'carte', icone: MapIcon, libelle: 'modules:storyboard.editor.map_label', teinte: 'text-gm-emerald', fond: 'bg-gm-emerald/15 border-gm-emerald/40',
      touche: m => !!m.mapUrl },
    { cle: 'image', icone: ImageIcon, libelle: 'modules:storyboard.editor.image_label', teinte: 'text-gm-violet', fond: 'bg-gm-violet/15 border-gm-violet/40',
      touche: m => !!(m.imageMediaId || m.diaporamaId) },
    { cle: 'bruitage', icone: Volume2, libelle: 'modules:storyboard.editor.sound_label', teinte: 'text-gm-crimson', fond: 'bg-gm-crimson/15 border-gm-crimson/40',
      touche: m => !!m.soundPadId || unVolume(m.soundVolume) },
    { cle: 'titre', icone: Type, libelle: 'modules:storyboard.editor.title_label', teinte: 'text-accent', fond: 'bg-accent/15 border-accent/40',
      touche: m => !!m.titre?.trim() },
];

/**
 * **Le moment d'à côté**, pour enchaîner sans viser la ligne — « Séquence
 * précédente / suivante », retenu par David le 2026-09-29.
 *
 * Sans moment en cours, « suivant » part du premier, et « précédent » n'a
 * rien à rendre. Aux deux bouts, rien non plus : on ne boucle pas, un
 * storyboard qui reprendrait au début sans prévenir rejouerait l'ouverture
 * en pleine scène finale.
 */
export function momentVoisin(ids: readonly string[], actifId: string | null, sens: 1 | -1): string | null {
    if (ids.length === 0) return null;
    const rang = actifId ? ids.indexOf(actifId) : -1;
    if (rang === -1) return sens === 1 ? ids[0] : null;
    return ids[rang + sens] ?? null;
}
