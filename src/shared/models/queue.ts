export default class Queue<T> {
    private elements: T[] = [];
    private head = 0;
    private tail = 0;

    constructor() { }

    enqueue(element: T): void {
        this.elements[this.tail] = element;
        this.tail++;
    }

    dequeue(): T {
        const item = this.elements[this.head]!;
        delete this.elements[this.head];
        this.head++;
        return item;
    }

    peek(): T {
        return this.elements[this.head]!;
    }

    get length(): number {
        return this.tail - this.head;
    }

    get isEmpty(): boolean {
        return this.length === 0;
    }
}
