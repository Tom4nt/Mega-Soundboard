declare module "*sendKey" {
    function whoami(): string;
    function sendKeyDown(...args: number[]): void;
    function sendKeyUp(...args: number[]): void;
}
