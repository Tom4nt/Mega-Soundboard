import { WebContents } from "electron";

export default class ZoomUtils {
    private static maxZoom = 2;
    private static minZoom = 0.2;

    public static setZoomFactor(wc: WebContents, val: number): void {
        val = this.limitZoom(val);
        wc.setZoomFactor(val);
    }

    public static incrementZoomFactor(wc: WebContents, val: number): void {
        let newVal = wc.getZoomFactor() + val;
        newVal = this.limitZoom(newVal);
        wc.setZoomFactor(newVal);
    }

    private static limitZoom(val: number): number {
        if (val > this.maxZoom) return this.maxZoom;
        if (val < this.minZoom) return this.minZoom;
        return val;
    }
}
