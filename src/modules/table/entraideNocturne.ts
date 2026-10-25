import type { GestesDesHeros } from '../../types/drivers';
import { effetsDuDebordement, momentDeCalme, type HerosDeLaTable, type Libelle } from './gestesDesHeros';
import { valeurDeJauge } from '../dice/systemes/nocturne';

/** Les choix de la Loi : présence au repos, portée des Auras et répartition des points.
 * Les portées sont appréciées à la table (NOC p. 248), jamais déduites d'une distance inventée. */
export interface ChoixEntraideNocturne {
    participants?: string[];
    epargnes?: string[];
    extase?: Record<string, Record<string, number>>;
    lumiere?: Record<string, Record<string, number>>;
    amputation?: Record<string, Record<string, number>>;
}
export const niveauNocturne = (valeur: unknown) => {
    const n = valeurDeJauge(valeur);
    return Number.isFinite(n) ? Math.floor(n) : 0;
};

/** Une même unité ne protège/recharge qu'une seule fois. Les sources peuvent se cumuler. */
function partage(talent: 'extase' | 'lumiere', heros: HerosDeLaTable[], choix: ChoixEntraideNocturne) {
    const erreurs: string[] = [], recus: Record<string, number> = {};
    for (const source of heros) {
        const budget = Math.max(0, niveauNocturne(source.valeurs[talent]));
        const ligne = choix[talent]?.[source.id] ?? { [source.id]: budget };
        let somme = 0;
        for (const [id, points] of Object.entries(ligne)) {
            if (!Number.isSafeInteger(points) || points < 0 || !heros.some(h => h.id === id)) {
                erreurs.push(`${source.nom} : répartition de ${talent} invalide.`); continue;
            }
            somme += points; recus[id] = (recus[id] ?? 0) + points;
        }
        if (somme > budget) erreurs.push(`${source.nom} : ${somme} points de ${talent} répartis pour ${budget} disponibles.`);
    }
    return { erreurs, recus };
}

export function calmeNocturne(geste: NonNullable<GestesDesHeros['momentDeCalme']>, tous: HerosDeLaTable[], choix: ChoixEntraideNocturne, nom: Libelle) {
    const heros = tous.filter(h => choix.participants ? choix.participants.includes(h.id) : !h.allie);
    const { erreurs, recus } = partage('extase', heros, choix);
    const changements = momentDeCalme({ ...geste, amputation: undefined }, heros.map(h => ({ ...h,
        valeurs: { ...h.valeurs, extase: (recus[h.id] ?? 0) + Math.min(0, niveauNocturne(h.valeurs.extase)) } })), nom);
    const recuperations: Record<string, Record<string, number>> = {}, amputations: Record<string, number> = {};
    for (const c of changements) {
        const h = heros.find(h => h.id === c.herosId)!;
        const gains: Record<string, number> = {};
        for (const m of geste.heros) {
            const avant = niveauNocturne(h.valeurs[m.champ]), apres = Number(c.maj[m.champ] ?? avant);
            gains[m.champ] = typeof m.delta === 'number' && m.delta < 0 ? Math.max(0, avant - apres) : Math.max(0, apres - avant);
        }
        recuperations[h.id] = gains;
        const a = geste.amputation;
        const demande = a ? Math.max(0, ...a.seuils.filter(s => niveauNocturne(h.valeurs[a.champ]) >= s.aPartirDe).map(s => s.points)) : 0;
        const requis = Math.min(demande, Object.values(gains).reduce((s, n) => s + n, 0));
        amputations[h.id] = requis;
        let affectes = 0;
        for (const [champ, n] of Object.entries(choix.amputation?.[h.id] ?? {})) {
            if (!Number.isSafeInteger(n) || n < 0 || n > (gains[champ] ?? 0)) {
                erreurs.push(`${h.nom} : récupération à reprendre invalide (${nom(champ)}).`); continue;
            }
            affectes += n;
            if (!n) continue;
            const m = geste.heros.find(m => m.champ === champ)!;
            c.maj[champ] = Number(c.maj[champ]) + (typeof m.delta === 'number' && m.delta < 0 ? n : -n);
            c.lignes.push(`Soupçon : ${n} point${n > 1 ? 's' : ''} de récupération repris sur ${nom(champ)} → ${c.maj[champ]}.`);
        }
        if (affectes !== requis) erreurs.push(`${h.nom} : répartir ${requis} point${requis > 1 ? 's' : ''} de Soupçon (${affectes} choisi${affectes > 1 ? 's' : ''}).`);
        if (demande > requis) c.lignes.push(`Soupçon : seulement ${requis} point${requis > 1 ? 's' : ''} effectivement récupérable${requis > 1 ? 's' : ''}.`);
    }
    const joueurs = tous.filter(h => !h.allie);
    return { changements, aDire: [], erreurs, recuperations, amputations, collectif: joueurs.length > 0 && joueurs.every(h => heros.some(p => p.id === h.id)) };
}

export function debordementNocturne(effets: NonNullable<GestesDesHeros['effetsDuDebordement']>['effets'], retenus: Record<string, number>, heros: HerosDeLaTable[], choix: ChoixEntraideNocturne, nom: Libelle) {
    const { erreurs, recus } = partage('lumiere', heros, choix);
    // Les points donnés à un allié ne protègent plus automatiquement leur source.
    const cibles = heros.filter(h => !choix.epargnes?.includes(h.id)).map(h => ({ ...h,
        valeurs: { ...h.valeurs, lumiere: (recus[h.id] ?? 0) + Math.min(0, niveauNocturne(h.valeurs.lumiere)) } }));
    const lisibles = effets.map(e => ({ ...e, aDire: e.id === 'intervention' || e.id === 'fatigue' ? undefined : e.aDire }));
    const resultats = cibles.map(h => effetsDuDebordement(lisibles.filter(e => !h.allie || e.id === 'fatigue'), retenus, [h], nom));
    return { changements: resultats.flatMap(r => r.changements), aDire: [...new Set(resultats.flatMap(r => r.aDire))], erreurs: retenus.intervention ? erreurs : [] };
}
