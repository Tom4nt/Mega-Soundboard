export interface ICommonData {
    uuid: string;
    name: string;
    volume: number;
    keys: number[];
}

export interface ISoundData extends ICommonData {
    path: string;
}

type GroupMode = "sequence" | "random" | "first";
export interface IGroupData extends ICommonData {
    mode: GroupMode
}

export interface ISoundboardData extends ICommonData {
    linkedFolder: string | null;
}
