/** Préréglages et remise à zéro, communs aux pupitres Alien (23/10/2026, demande de David). */
import { createElement as h, useState } from 'react';

const bouton = (texte, props = {}) => h('button', { type: 'button', ...props }, texte);
const caseACocher = (texte, checked, onChange, disabled, classe) =>
  h('label', { className: classe }, h('input', { type: 'checkbox', checked, disabled, onChange: e => onChange(e.target.checked) }), texte);

/**
 * `sujet` nomme le module dans le bouton (« Réinitialiser MU/TH/UR ») ; `contenu` dit ce que garde
 * un préréglage, `remise` ce qu'efface la remise à zéro. Les classes viennent du module hôte.
 */
export function PrereglagesEtRemise({ prereglages, envoyer, occupe, sujet, contenu, remise, resume, classes = {} }) {
  const [choisi, choisir] = useState(''), [rappel, confirmerRappel] = useState(false), [suppression, confirmerSuppression] = useState(false);
  const [remiseConfirmee, confirmerRemise] = useState(false);
  const pr = prereglages.find(p => p.id === choisi);
  const selectionner = id => { choisir(id); confirmerRappel(false); confirmerSuppression(false); };
  async function enregistrer(e) {
    e.preventDefault();
    const nom = new FormData(e.currentTarget).get('nom');
    const prereglageId = pr?.id || 'prereglage-' + crypto.randomUUID();
    if (await envoyer('enregistrer-prereglage', { prereglageId, nom })) selectionner(prereglageId);
  }
  return h('div', null,
    h('section', { className: classes.section, 'aria-label': 'Préréglages' },
      h('h3', null, 'Préréglages'),
      h('p', null, contenu),
      h('label', null, 'Préréglage', h('select', { 'aria-label': 'Préréglage', value: pr?.id || '', disabled: occupe, onChange: e => selectionner(e.target.value) },
        h('option', { value: '' }, 'Nouveau préréglage…'), prereglages.map(p => h('option', { value: p.id, key: p.id }, p.nom)))),
      h('form', { key: pr ? pr.id + pr.nom : 'nouveau', onSubmit: enregistrer },
        h('label', null, 'Nom du préréglage', h('input', { name: 'nom', defaultValue: pr?.nom || '', maxLength: 80, required: true, disabled: occupe })),
        h('button', { type: 'submit', disabled: occupe }, pr ? 'Remplacer par la préparation actuelle' : 'Enregistrer la préparation actuelle')),
      pr && h('div', null,
        resume && h('p', null, resume(pr.id)),
        caseACocher('Confirmer le remplacement de la préparation actuelle', rappel, confirmerRappel, occupe, classes.case),
        bouton('Rappeler ce préréglage', { disabled: occupe || !rappel, onClick: async () => { if (await envoyer('rappeler-prereglage', { prereglageId: pr.id })) confirmerRappel(false); } }),
        caseACocher('Confirmer la suppression du préréglage', suppression, confirmerSuppression, occupe, classes.case),
        bouton('Supprimer le préréglage', { disabled: occupe || !suppression, onClick: async () => { if (await envoyer('supprimer-prereglage', { prereglageId: pr.id })) selectionner(''); } }))),
    h('section', { className: classes.section, 'aria-label': 'Remise à zéro' },
      h('h3', null, 'Remise à zéro'),
      h('p', null, remise),
      caseACocher('Confirmer la réinitialisation', remiseConfirmee, confirmerRemise, occupe, classes.case),
      bouton(`Réinitialiser ${sujet}`, { disabled: occupe || !remiseConfirmee, onClick: async () => { if (await envoyer('reinitialiser', {})) confirmerRemise(false); } })));
}
