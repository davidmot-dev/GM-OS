/** Arbre documentaire partagé entre le processus principal et le pont IA. */
export interface DocumentIA {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: DocumentIA[];
    extension?: string;
}
