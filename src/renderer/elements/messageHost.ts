import { Message } from "../../shared/models";

export default class MessageHost extends HTMLElement {

    private messages = new Map<Message, HTMLDivElement>();

    public addMessage(message: Message): void {
        const messageTemplate = document.getElementById("message") as HTMLTemplateElement;
        const isPersistent = message.delay <= 0;

        const messageTemplateInstance = messageTemplate.content.cloneNode(true) as Element;
        const messageRoot = messageTemplateInstance.querySelector<HTMLDivElement>(".message");
        if (!messageRoot) return;

        const messageContent = messageRoot.querySelector<HTMLDivElement>(".message-content");
        const closeButton = messageRoot.querySelector<HTMLButtonElement>(".message-close-button");
        const progressBar = messageRoot.querySelector<HTMLDivElement>(".message-bar");

        if (messageContent) messageContent.innerHTML = message.content;
        if (closeButton) closeButton.addEventListener("click", () => { message.fireClose(); });
        if (progressBar) {
            if (isPersistent) {
                progressBar.style.width = "0";
            } else {
                progressBar.style.width = "100%";
                progressBar.style.transitionProperty = "width";
                progressBar.style.transitionDuration = `${message.delay}ms`;
            }
        }

        this.messages.set(message, messageRoot);
        this.append(messageRoot);

        void this.offsetWidth; // Trigger reflow
        if (progressBar) progressBar.style.width = "0";
        messageRoot.classList.remove("hidden");
    }

    public removeMessage(message: Message): void {
        const element = this.messages.get(message);
        if (!element) return;

        element.classList.add("hidden");
        setTimeout(() => {
            element.remove();
        }, 200);
    }
}
