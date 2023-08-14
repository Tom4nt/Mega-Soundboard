import Queue from "../shared/models/queue";

export class Message {
    public constructor(
        public content: string,
        public delay = 5000,) { }
}

const messages = new Queue<Message>();
let host: HTMLElement | undefined = undefined;
let isWaiting = false;

export function setHost(element: HTMLElement): void {
    host = element;
}

export function addMessage(message: Message): void {
    messages.enqueue(message);
    check();
}

function check(): void {
    if (!messages.isEmpty && !isWaiting) {
        const m = messages.dequeue();
        isWaiting = true;
        const element = showMessage(m);
        setTimeout(() => {
            isWaiting = false;
            element.remove();
            check();
        }, m.delay);
    }
}

function showMessage(message: Message): HTMLElement {
    const baseElement = document.createElement("p");
    baseElement.innerHTML = message.content;
    if (!host) throw "Message queue host element was not defined.";
    host.append(baseElement);
    return baseElement;
}
