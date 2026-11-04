import { useSessionOSStore } from '../useSessionOSStore';
import { useRessourcesDeTableStore } from '../../table/useRessourcesDeTableStore';
import { isMainWindow } from '../../../utils/windowRole';
import { operationTableShadowrun, TABLE_SHADOWRUN_VIDE, type OperationTableShadowrun } from '../../dice/systemes/tableDeShadowrun';
import { PROFIL_RIGGER_VIDE, impactVehiculeShadowrun, prendreControleShadowrun, type ModeDeControle, type ProfilRigger, type VehiculeShadowrun } from '../../dice/systemes/riggingDeShadowrun';
import { ajouterBlessureShadowrun, ecrireSuiviShadowrun, positionShadowrun } from '../../dice/systemes/suiviDeShadowrun';

/** SR-A4/A6 : seule la fenêtre meneur confirme. Les joueurs gardent les droits des jauges natives. */
function contexte(campaignId: string, personnageId: string) {
    if (!isMainWindow()) return undefined;
    const s = useSessionOSStore.getState(), campagne = s.campaigns.find(c => c.id === campaignId);
    const pilote = s.customGameDrivers.find(d => d.id === campagne?.system), regle = pilote?.jet?.shadowrun;
    const joueur = s.players.find(p => p.characters.some(c => c.id === personnageId && c.campaignId === campaignId));
    const personnage = joueur?.characters.find(c => c.id === personnageId);
    return campagne && pilote && regle && personnage && joueur ? { s, campagne, pilote, regle, personnage, joueur, table: campagne.suiviShadowrun ?? TABLE_SHADOWRUN_VIDE } : undefined;
}
export function executerTableShadowrun(campaignId: string, personnageId: string, op: OperationTableShadowrun): string {
    const c = contexte(campaignId, personnageId);
    if (!c?.regle.table) return 'Confirmation réservée au meneur d’une campagne Shadowrun déclarée.';
    const r = c.regle.table, ressources = c.pilote.ressourcesDeTable ?? [], stock = useRessourcesDeTableStore.getState();
    if (![r.planification, r.menace].every(id => ressources.some(x => x.id === id))) return 'Réserve non déclarée dans le pilote.';
    const p = stock.valeur(campaignId, ressources, r.planification), m = stock.valeur(campaignId, ressources, r.menace);
    const a = Number(c.personnage.sheetData?.[c.regle.anarchy ?? '']) || 0;
    const effet = operationTableShadowrun(c.table, p, m, a, op);
    if (!effet.appliquee) return effet.texte;
    // Reçus avant les notifications : un clic répété ou un renvoi ne rejoue pas le débit.
    c.s.updateCampaign(campaignId, { suiviShadowrun: effet.table });
    if (effet.planification !== p) stock.fixer(campaignId, ressources, r.planification, effet.planification, effet.texte);
    if (effet.menace !== m) stock.fixer(campaignId, ressources, r.menace, effet.menace, effet.texte);
    if (effet.anarchy !== a && c.regle.anarchy) c.s.updateCharacter(c.joueur.id, personnageId,
        { sheetData: { ...c.personnage.sheetData, [c.regle.anarchy]: effet.anarchy } });
    return effet.texte;
}
type OperationRigging = { id: string } & (
    { type: 'ajouter'; nom: string } | { type: 'profil'; profil: ProfilRigger } | { type: 'narration' }
    | { type: 'caracteristique'; vehiculeId: string; champ: 'structure' | 'blindage' | 'autopilote' | 'maniabilite' | 'vitesse'; valeur: number }
    | { type: 'debridage'; vehiculeId: string; actif: boolean }
    | { type: 'controle'; vehiculeId: string; mode: ModeDeControle; connexion: 'cold' | 'hot' }
    | { type: 'impact'; vehiculeId: string; vd: number } | { type: 'reparer'; vehiculeId: string } | { type: 'fin-malus'; vehiculeId: string }
);
export function executerRiggingShadowrun(campaignId: string, personnageId: string, op: OperationRigging): string {
    const c = contexte(campaignId, personnageId);
    if (!c?.regle.rigging) return 'Confirmation du rigging réservée au meneur.';
    const t = c.table;
    if (t.recus.includes(op.id)) return 'Opération déjà traitée.';
    let vehicules = [...t.vehicules], texte = '';
    const riggers = { ...t.riggers };
    const profil = riggers[personnageId] ?? PROFIL_RIGGER_VIDE;
    if (op.type === 'ajouter') {
        if (!op.nom.trim()) return 'Nom du véhicule requis.';
        vehicules.push({ id: op.id, nom: op.nom.trim(), structure: 4, blindage: 2, autopilote: 6, maniabilite: 4, vitesse: 3,
            moniteur: { legeres: 0, graves: 0, incapacitantes: 0 }, debride: false });
        texte = `Véhicule ajouté : ${op.nom.trim()} (caractéristiques à vérifier).`;
    } else if (op.type === 'profil') {
        if (!Number.isFinite(op.profil.capacite) || op.profil.capacite < 1) return 'Capacité CCR invalide.';
        riggers[personnageId] = { ...op.profil, narration: profil.narration, changement: profil.changement }; texte = 'Équipement du rigger déclaré.';
    } else if (op.type === 'narration') {
        riggers[personnageId] = { ...profil, narration: profil.narration + 1 }; texte = 'Nouvelle narration du rigger : changement de mode à nouveau disponible.';
    } else {
        const v = vehicules.find(x => x.id === op.vehiculeId);
        if (!v) return 'Véhicule introuvable.';
        let apres: VehiculeShadowrun = v;
        if (op.type === 'caracteristique') {
            if (!Number.isFinite(op.valeur) || op.valeur < 0) return 'Caractéristique invalide.';
            apres = { ...v, [op.champ]: Math.trunc(op.valeur) }; texte = `${v.nom} : ${op.champ} ${Math.trunc(op.valeur)}.`;
        } else if (op.type === 'debridage') {
            apres = { ...v, debride: op.actif }; texte = 'Autopilote débridé déclaré explicitement.';
        } else if (op.type === 'fin-malus') {
            apres = { ...v, legereRecente: false }; texte = 'Fin de la prochaine narration du véhicule : malus léger expiré, dommages conservés.';
        } else if (op.type === 'controle') {
            const effet = prendreControleShadowrun(v, vehicules, profil, personnageId, op.mode, op.connexion);
            if (effet.refus) return effet.refus;
            apres = effet.vehicule; riggers[personnageId] = effet.profil; texte = `${v.nom} : contrôle ${op.mode}, ${op.connexion}-sim.`;
        } else if (op.type === 'reparer') {
            const m = { ...v.moniteur }, cle = (['incapacitantes', 'graves', 'legeres'] as const).find(k => m[k] > 0);
            if (cle) m[cle] -= 1;
            apres = { ...v, moniteur: m }; texte = `${v.nom} : une case réparée après réparation réussie.`;
        } else if (op.type === 'impact') {
            if (!Number.isFinite(op.vd) || op.vd < 0) return 'VD invalide.';
            const effet = impactVehiculeShadowrun(v, op.vd); apres = effet.vehicule;
            texte = `${v.nom} : VD ${op.vd}, ${effet.cochee ?? 'aucun dommage'}${effet.aggravee ? ' après aggravation' : ''}.`;
            if (effet.biofeedback) {
                const b = effet.biofeedback, joueur = c.s.players.find(p => p.characters.some(x => x.id === b.personnageId && x.campaignId === campaignId));
                const rigger = joueur?.characters.find(x => x.id === b.personnageId), r = c.regle.suivi;
                if (!joueur || !rigger || !r) return 'Rigger lié introuvable : aucun impact appliqué.';
                const f = rigger.sheetData ?? {}, suivi = ajouterBlessureShadowrun(r, f, b.gravite, 'biofeedback', op.id, b.nature);
                c.s.updateCharacter(joueur.id, rigger.id, { sheetData: { ...f, ...ecrireSuiviShadowrun(r, suivi),
                    ...(r.sante ? { [r.sante]: positionShadowrun(r, suivi, f) } : {}) } });
                texte += ` Biofeedback mental ${b.nature} : blessure ${b.gravite} à ${rigger.name}.`;
            }
        }
        vehicules = vehicules.map(x => x.id === v.id ? apres : x);
    }
    c.s.updateCampaign(campaignId, { suiviShadowrun: { ...t, vehicules, riggers, recus: [...t.recus, op.id] } });
    return texte;
}
