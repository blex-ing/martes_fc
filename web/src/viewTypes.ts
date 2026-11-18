export type View='overview'|'matches'|'players'|'goalkeeper'|'settings';
export type ModalState={kind:'new'}|{kind:'edit';id:string}|{kind:'profile';id:string}|null;
export type Filter='all'|'win'|'draw'|'loss';
