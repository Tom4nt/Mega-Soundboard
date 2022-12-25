export default class Seekbar extends HTMLElement {
    constructor() {
        super();
        // <div id="seekbar" >
        //     <ms-iconbutton > play < /ms-iconbutton>
        //     < span > 00: 00 < /span>
        //         < ms - slider > </ms-slider>
        //         < /div>
    }
}

customElements.define("ms-seekbar", Seekbar);
