import p = require("path"); // TODO: Remove reference

declare global {
    interface String {
        removeExtension(): string;
    }
}

String.prototype.removeExtension = (): string => {
    const u = this as unknown;
    const self = u as string;
    const ext = p.extname(self);
    return self.slice(0, -ext.length);
};