export default abstract class Draggable extends HTMLElement {

    /** CSS class to add to the Element while it's being dragged. */
    protected abstract get classDuringDrag(): string;

    private moveF: ((e: MouseEvent) => void) | null = null;

    constructor() {
        super();

        this.addEventListener("dragstart", (e) => {
            e.preventDefault();

            this.moveF = (de: MouseEvent): void => {
                this.style.top = `${de.clientY - e.offsetY}px`;
                this.style.left = `${de.clientX - e.offsetX}px`;
            };

            document.addEventListener("mousemove", this.moveF);

            // this.style.width = `${this.offsetWidth}px`;

            this.style.position = "fixed";
            this.style.pointerEvents = "none";
            this.style.zIndex = "1";

            this.classList.add(this.classDuringDrag);
        });

        this.addEventListener("dragend", (e) => {
            e.preventDefault();

            if (this.moveF)
                document.removeEventListener("mousemove", this.moveF);

            this.style.position = "";
            this.style.pointerEvents = "";
            this.style.zIndex = "";

            // this.style.width = "";
            this.style.top = "";
            this.style.left = "";

            this.classList.remove(this.classDuringDrag);
        });
    }
}