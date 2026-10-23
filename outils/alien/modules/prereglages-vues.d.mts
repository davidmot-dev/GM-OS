import type { ReactElement } from 'react';
export function PrereglagesEtRemise(props: {
  prereglages: { id: string; nom: string }[];
  envoyer: (id: string, charge: Record<string, unknown>) => Promise<boolean>;
  occupe: boolean;
  sujet: string;
  contenu: string;
  remise: string;
  resume?: (id: string) => string;
  classes?: { section?: string; case?: string };
}): ReactElement;
