export default class Utils {
    static getElementIndex(element: Element): number {
        let i = 0;
        while (element.previousElementSibling != null) {
            element = element.previousElementSibling;
            ++i;
        }
        return i;
    }
}