import type {Dispatch,SetStateAction} from 'react';
import type {Match,Player,PlayerStats,TeamStats} from '../domain/stats';
import type {Season} from '../data/api';
import type {View,ModalState,Filter} from '../viewTypes';
export interface ViewContext {
 live:boolean;online:boolean;unavailable:boolean;admin:boolean;
 players:Player[];adminPlayers:Player[];matches:Match[];visibleMatches:Match[];sorted:Match[];
 summary:TeamStats;ranking:Array<{p:Player}&PlayerStats>;
 seasons:Season[];activeSeason:Season|undefined;goalkeepers:Player[];goalkeeper:Player|undefined;
 selectedMatch:Match|undefined;filter:Filter;resultForm:Match[];
 changeView:(view:View)=>void;details:(id:string)=>void;remove:(id:string)=>Promise<void>;
 setModal:Dispatch<SetStateAction<ModalState>>;setFilter:Dispatch<SetStateAction<Filter>>;
 setSelected:Dispatch<SetStateAction<string|null>>;setSelectedKeeperId:Dispatch<SetStateAction<string|null>>;
 refreshRemote:()=>Promise<void>;showMessage:(message:string)=>void;reset:()=>void;
}
