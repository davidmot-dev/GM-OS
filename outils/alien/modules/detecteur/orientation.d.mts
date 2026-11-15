export const OUVERTURES: readonly number[];
export function anglesDuChamp(champ:{cap:number;ouverture:number}):{debut:number;fin:number};
export function dansLeChamp(point:{x:number;y:number},champ:{cap:number;ouverture:number}):boolean;
export const RAYON_DE_MEME_ZONE: number;
export function pointsDeMemeZone(nombre:number,champ:{cap:number;ouverture:number}):{x:number;y:number}[];
