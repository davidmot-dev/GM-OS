import React, { useState } from 'react';
import { BookOpen, BookPlus, AlertTriangle } from 'lucide-react';
import { slug } from '../../../../../electron/corpusSysteme';
import type { SupplementDeclare } from '../supplements';

/**
 * Le livre qu'on documente : le livre de base du jeu, ou l'un de ses
 * suppléments — § 185 du registre, 01/11/2026.
 *
 * David : *« je dois pouvoir indiquer à la forge que c'est un supplément »*.
 * Le choix vit sous le corpus visé, dans le panneau de gauche, parce que c'est
 * lui qui décide où les fiches s'écrivent (`systems/<jeu>/supplements/<slug>/`)
 * et quel inventaire on demande au carnet. Il se fait **avant** « Analyser les
 * sources » : placé d'abord dans l'atelier, il n'apparaissait qu'après ce clic,
 * et David ne le voyait pas.
 *
 * Les sources se cochent dans le Bac à contexte, juste en dessous. L'alerte
 * reste ici : le carnet du jeu porte aussi le livre de base, et un inventaire
 * lancé sur tout le carnet mêlerait les deux.
 */
interface ChoixDuLivreProps {
  supplements: SupplementDeclare[];
  supplement: SupplementDeclare | null;
  onChoisir: (supplement: SupplementDeclare | null) => void;
  onDeclarer: (titre: string) => void;
  sourcesRetenues: string[];
}

const puce = (actif: boolean) =>
  `flex items-center gap-2 px-3 py-2 rounded-xl border text-ui-11 font-bold text-left transition-all ${
    actif
      ? 'bg-gm-violet/20 border-gm-violet text-app-text'
      : 'bg-app-text/5 border-app-text/10 text-app-text/60 hover:border-gm-violet/30 hover:text-app-text'
  }`;

const ChoixDuLivre: React.FC<ChoixDuLivreProps> = ({
  supplements, supplement, onChoisir, onDeclarer, sourcesRetenues,
}) => {
  const [nouveau, setNouveau] = useState('');
  const declarer = () => {
    if (!slug(nouveau)) return;
    onDeclarer(nouveau.trim());
    setNouveau('');
  };

  return (
    <div className="space-y-2" data-choix-du-livre>
      <h2 className="flex items-center gap-2 text-ui-10 font-black uppercase tracking-[0.2em] text-gm-violet font-display">
        <BookOpen size={14} /> Livre documenté
      </h2>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={puce(!supplement)} onClick={() => onChoisir(null)} aria-pressed={!supplement}>
          <BookOpen size={14} className="shrink-0" /> Livre de base
        </button>
        {supplements.map(s => (
          <button
            key={s.slug}
            type="button"
            className={puce(supplement?.slug === s.slug)}
            onClick={() => onChoisir(s)}
            aria-pressed={supplement?.slug === s.slug}
          >
            <BookPlus size={14} className="shrink-0" /> {s.titre}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={nouveau}
          onChange={e => setNouveau(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') declarer(); }}
          placeholder="Nouveau supplément — son titre"
          aria-label="Titre du nouveau supplément"
          className="flex-1 min-w-0 bg-app-text/5 border border-app-text/10 rounded-xl px-3 py-2.5 text-ui-11 text-app-text/80 focus:outline-none focus:border-gm-violet/50 placeholder:text-app-text/20"
        />
        <button
          type="button"
          disabled={!slug(nouveau)}
          onClick={declarer}
          className="px-4 py-2.5 rounded-xl text-ui-10 font-black uppercase tracking-widest shrink-0 bg-gm-violet text-app-bg disabled:bg-app-text/5 disabled:text-app-text/10 disabled:cursor-not-allowed"
        >
          Déclarer
        </button>
      </div>

      {supplement && (
        <p className="text-ui-11 text-app-text/50 leading-relaxed">
          Le carnet propose les sujets du supplément ; vous choisissez lesquels forger. Dans le Bac à
          contexte, ne cochez que le PDF du supplément.
        </p>
      )}
      {supplement && sourcesRetenues.length === 0 && (
        <p className="flex items-start gap-2 text-ui-11 text-etat-alerte/80 leading-relaxed">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          Aucune source retenue : l'inventaire lirait tout le carnet, livre de base compris.
        </p>
      )}
    </div>
  );
};

export default ChoixDuLivre;
