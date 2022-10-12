export default class Utils {
    static getElementIndex(element: Element): number {
        let i = 0;
        while (element.previousElementSibling != null) {
            element = element.previousElementSibling;
            ++i;
        }
        return i;
    }

    static *getDataTransferFilePaths(dataTransfer: DataTransfer): Generator<string> {
        for (const file of dataTransfer.files) {
            yield file.path;
        }
    }

    static getErrorMessage(error: unknown): string {
        if (error instanceof Error) return error.message;
        else return String(error);
    }

    static waitForDocument(): Promise<void> {
        if (document.readyState == "complete") {
            return Promise.resolve();
        }
        else {
            return new Promise<void>((complete) => {
                window.addEventListener("load", () => {
                    complete();
                });
            });
        }
    }
}