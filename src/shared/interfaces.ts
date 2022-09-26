export interface IEquatable<T> {
    equals: (to: T) => boolean;
}

export interface JSONSerializable {
    toJSON: () => object;
}

export interface IDevice {
    id: string,
    volume: number
}