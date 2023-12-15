export interface ICommonData {
    uuid: string;
    name: string;
    volume: number;
    keys: number[];
}

export interface ISoundData extends ICommonData {
    path: string;
}
