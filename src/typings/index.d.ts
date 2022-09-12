// declare global {
interface HTMLMediaElement {
    setSinkId(sinkId: string): Promise<undefined>
}

interface Window {
    api: API
}

interface API {
    temp: number
}
// }
