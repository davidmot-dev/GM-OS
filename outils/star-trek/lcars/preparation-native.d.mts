import type { ReactElement } from 'react';
import type { VueLcarsMJ } from './moteur.mjs';
interface Props { envoyer: (commande: string, charge: unknown) => Promise<boolean>; occupe: boolean }
export function EquipageNatif(props: Props & { vue: VueLcarsMJ & { personnages: { id: string; nom: string }[] } }): ReactElement;
export function ImportPreparation(props: Props): ReactElement;
