import React from 'react';
import { Heart, Activity } from 'lucide-react';
import { decrireLaSante, aUneJaugeDeVie, fractionDeVie, type PorteurDeSante } from '../logic/SanteDuCombattant';
import { woundLabel } from '../../session/logic/HealthInterpreter';

/**
 * L'état de santé d'un personnage, **quel que soit le modèle du jeu**.
 *
 * **Le manque, relevé par David le 2026-08-15 :** *« le joueur doit voir l'état
 * de ses points de vie sur la tablette »*. Sa fiche n'affichait ce bloc que si
 * `aUneJaugeDeVie` était vraie — donc **uniquement pour le modèle `hp`**. Un
 * joueur de Dune, dont la défaite est une tâche étendue, ne voyait rien du
 * tout : ni son seuil, ni où il en était. Le bloc avait été rendu conditionnel
 * pour ne plus afficher « undefined / undefined », ce qui était juste, mais on
 * s'était arrêté à faire disparaître le faux sans mettre le vrai à la place.
 *
 * **Les cinq modèles se dessinent ici, et ici seulement.** `HealthInterpreter`
 * en connaît cinq et c'est lui qui les fait vivre ; les écrans se contentaient
 * chacun d'en rendre deux ou trois à leur façon. Un modèle ajouté ailleurs
 * qu'ici serait invisible sur les écrans qui l'ignorent, sans que rien ne le
 * signale.
 *
 * **`healthSystem` fait autorité**, comme partout : une jauge de points de vie
 * qui dirait l'inverse serait la plus vieille des deux vérités.
 */
interface EtatDeSanteProps {
    porteur: PorteurDeSante & { name?: string };
    /** Ajuster les points de vie, quand le porteur en a et que l'écran le permet. */
    onAjusterPV?: (delta: number) => void;
    /** Intitulé du seuil, tel que le pilote le nomme — « Défaite » chez Dune. */
    libelle?: string;
}

/** Des segments qu'on remplit — l'horloge de défaite, les cases cochées. */
const Segments: React.FC<{ remplis: number; total: number }> = ({ remplis, total }) => (
    <div className="flex flex-wrap items-center gap-1.5">
        {Array.from({ length: Math.max(0, total) }, (_, i) => (
            <span
                key={i}
                className={`h-6 flex-1 min-w-[1.25rem] rounded-md border transition-colors ${
                    i < remplis
                        ? 'bg-rose-500 border-rose-400'
                        : 'bg-app-bg/60 border-app-border/40'
                }`}
            />
        ))}
    </div>
);

const EtatDeSante: React.FC<EtatDeSanteProps> = ({ porteur, onAjusterPV, libelle }) => {
    const sante = porteur.healthSystem;
    const resume = decrireLaSante(porteur);

    /*
      **Rien à dire, rien à montrer.** Un personnage sans modèle de santé ni
      jauge n'a pas de bloc : c'est la règle du projet — l'absence n'est pas un
      zéro, et une barre vide se lirait comme un mourant.
    */
    if (!sante && !aUneJaugeDeVie(porteur)) return null;

    const enTete = (titre: string, valeur: React.ReactNode) => (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                {sante && sante.type !== 'hp'
                    ? <Activity size={18} className="text-rose-400" />
                    : <Heart size={18} className="text-red-500" fill="currentColor" />}
                <h3 className="text-xs font-black text-app-text uppercase tracking-widest">{titre}</h3>
            </div>
            <span className="text-xl font-black text-app-text font-mono">{valeur}</span>
        </div>
    );

    const cadre = (contenu: React.ReactNode) => (
        <section className="bg-app-surface/60 border border-app-border rounded-[2.5rem] p-6 shadow-xl">
            {contenu}
            {/*
              L'état en toutes lettres sous le visuel : « blessé », « hors de
              combat ». C'est ce qu'un joueur cherche d'abord, et un compte de
              segments ne le dit pas de lui-même.
            */}
            {resume && (
                <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-app-text/40">
                    {resume}
                </p>
            )}
        </section>
    );

    if (sante && sante.type === 'clocks') {
        const remplis = Number(sante.data.filled ?? 0);
        // Le nombre de segments **vient de la fiche** : chez Dune il vaut la
        // compétence défensive de la cible, de quatre à huit. Ce n'est pas une
        // constante du jeu, et surtout pas six.
        const total = Number(sante.data.segments ?? 0);
        return cadre(<>
            {enTete(libelle ?? 'Défaite', `${remplis} / ${total}`)}
            <Segments remplis={remplis} total={total} />
        </>);
    }

    if (sante && sante.type === 'boxes') {
        const cases = (sante.data.boxes as Array<{ filled: boolean }> | undefined) ?? [];
        const remplies = cases.filter(b => b.filled).length;
        return cadre(<>
            {enTete('Cases', `${remplies} / ${cases.length}`)}
            <Segments remplis={remplies} total={cases.length} />
        </>);
    }

    if (sante && sante.type === 'wounds') {
        return cadre(enTete('Blessure', woundLabel(sante)));
    }

    if (sante && sante.type === 'anatomy') {
        const parts = (sante.data.parts as Record<string, { status: string }> | undefined) ?? {};
        const atteintes = Object.entries(parts).filter(([, p]) => p.status !== 'healthy');
        return cadre(<>
            {enTete('Anatomie', `${atteintes.length} atteinte${atteintes.length > 1 ? 's' : ''}`)}
            <div className="space-y-1">
                {atteintes.map(([nom, p]) => (
                    <p key={nom} className="text-[11px] text-rose-300/80 font-mono">{nom} — {p.status}</p>
                ))}
            </div>
        </>);
    }

    // Reste le modèle `hp` : des points qu'on retranche.
    const part = fractionDeVie(porteur) ?? 0;
    return cadre(<>
        {enTete('Points de vie', `${porteur.hp} / ${porteur.maxHp ?? porteur.hpMax}`)}
        <div className="h-3 bg-app-bg/40 rounded-full border border-app-border/10 p-[1px] mb-6">
            <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(1, part)) * 100}%` }}
            />
        </div>
        {onAjusterPV && (
            <div className="flex items-center justify-center gap-3">
                {[-5, -1, 1, 5].map(d => (
                    <button
                        key={d}
                        onClick={() => onAjusterPV(d)}
                        title={`${d > 0 ? '+' : ''}${d} PV`}
                        className={`rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text/40 transition-all ${
                            Math.abs(d) === 5 ? 'w-12 h-12' : 'w-10 h-10'
                        } ${d < 0 ? 'hover:text-red-500 hover:border-red-500/30' : 'hover:text-emerald-500 hover:border-emerald-500/30'}`}
                    >{d > 0 ? `+${d}` : d}</button>
                ))}
            </div>
        )}
    </>);
};

export default EtatDeSante;
