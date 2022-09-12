export default class ModalManager {
    static openModal(text: string): void {
        // TODO
        const p = document.createElement("p");
        p.innerHTML = text;
        document.body.append(p);
    }
}