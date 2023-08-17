import { Message } from "../shared/models";
import Queue from "../shared/models/queue";

type MessageHost = {
    addMessage: (message: Message) => void,
    removeMessage: (message: Message) => void,
}

const messages = new Queue<Message>();
let host: MessageHost | undefined = undefined;
let currentMessage: Message | null = null;

export function setHost(messageHost: MessageHost): void {
    host = messageHost;
}

export function pushMessage(message: Message): void {
    messages.enqueue(message);
    message.onClose.addHandler(() => {
        hideMessage(message);
        check();
    });
    check();
}

function check(): void {
    if (currentMessage === null && !messages.isEmpty) {
        const m = messages.dequeue();
        showMessage(m);
    }
}

function showMessage(message: Message): void {
    throwIfHostNull(host);
    currentMessage = message;
    if (message.delay > 0) {
        setTimeout(() => message.fireClose(), message.delay);
    }
    host.addMessage(message);
}

function hideMessage(message: Message): void {
    throwIfHostNull(host);
    currentMessage = null;
    host.removeMessage(message);
}

function throwIfHostNull(host: MessageHost | undefined): asserts host is MessageHost {
    if (!host) throw "Message queue host element was not defined.";
}
