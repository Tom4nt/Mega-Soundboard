module.exports = class Dropdown extends HTMLElement {
    constructor() {
        super()
    }

    connectedCallback() {
        this.options = []
        for (let i = 0; i < this.childElementCount; i++) {
            let node = this.children.item(i)
            this.options.push(node)
            node.onclick = () => {
                this.selected = i
                this.dispatchEvent(new CustomEvent("itemselect", { detail: { index: i } }))
                this.close()
            }
        }

        let main = document.createElement("div")
        main.classList.add("dropdown-default")
        main.onclick = () => this.switch()
        this.main = main

        let text = document.createElement("span")
        text.classList.add("dropdown-text")
        text.innerHTML = "Select..."
        this.text = text

        let arrow = document.createElement("span")
        arrow.classList.add("dropdown-arrow")
        arrow.innerHTML = "&#9207;"

        let itemsContainer = document.createElement("div")
        itemsContainer.classList.add("dropdown-container")
        this.container = itemsContainer

        this.options.forEach((node) => {
            itemsContainer.append(node)
        })

        main.append(text, arrow)

        this.append(main, itemsContainer)

        window.addEventListener("click", (e) => {
            if (!e.path.includes(this)) this.close()
        })
    }

    get selected() {
        return this._selected
    }

    set selected(value) {
        this._selected = value
        this.select(value)
    }

    select(index) {
        this.options.forEach((option) => {
            option.classList.remove("selected")
        })
        this.options[index].classList.add("selected")
        this.text.innerHTML = this.options[index].innerHTML
    }

    selectData(data) {
        this.options.forEach((option) => {
            option.classList.remove("selected")
            if (option.data == data) {
                option.classList.add("selected")
                this.text.innerHTML = option.innerHTML
            }
        })
    }

    addStringItem(string, data) {
        const node = document.createElement("span")
        node.data = data
        node.innerHTML = string
        this.addItem(node)
    }

    addItem(node) {
        this.container.append(node)
        const index = this.options.length
        this.options.push(node)
        node.onclick = () => {
            this.selected = index
            this.dispatchEvent(new CustomEvent("itemselect", { detail: { index: index, data: node.data } }))
            this.close()
        }
    }

    removeItem(index) {
        this.options.slice(index, 1)
        this.container.removeChild(this.container.childNodes.item(index))
    }

    switch () {
        if (this.isOpen) this.close()
        else this.open()
    }

    open() {
        if (this.container.childElementCount < 1) return

        this.isOpen = true
        this.container.classList.add("open")
        let totalHeight = this.container.children.item(0).offsetHeight * this.container.childElementCount
        let max = document.documentElement.clientHeight - this.main.getBoundingClientRect().bottom
        let min = totalHeight + 2

        //Saber se é preciso uma scrollbar
        if (min > max) {
            this.container.style.height = max + "px"
            this.container.style.overflowY = "auto"
        } else {
            this.container.style.height = min + "px"
            this.container.style.overflowY = "hidden"
        }
        this.main.classList.add("open")
    }

    close() {
        this.isOpen = false
        this.container.classList.remove("open")
        this.container.style.height = "0"
        this.main.classList.remove("open")
    }
}