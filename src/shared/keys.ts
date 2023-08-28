type KeyMap = {
    [code: number]: string;
}

const keycodes: KeyMap = {
    1: "ESC",
    59: "F1",
    60: "F2",
    61: "F3",
    62: "F4",
    63: "F5",
    64: "F6",
    65: "F7",
    66: "F8",
    67: "F9",
    68: "F10",
    87: "F11",
    88: "F12",
    183: "Prt Sc",
    70: "Scr Lock",
    197: "Pause",
    41: "`",
    2: "1",
    3: "2",
    4: "3",
    5: "4",
    6: "5",
    7: "6",
    8: "7",
    9: "8",
    10: "9",
    11: "0",
    12: "-",
    13: "=",
    14: "Backspace",
    210: "Insert",
    199: "Home",
    201: "PgUp",
    69: "Num Lock",
    181: "Numpad /",
    55: "Numpad *",
    74: "Numpad -",
    15: "Tab",
    16: "Q",
    17: "W",
    18: "E",
    19: "R",
    20: "T",
    21: "Y",
    22: "U",
    23: "I",
    24: "O",
    25: "P",
    26: "[",
    27: "]",
    28: "Return",
    211: "Delete",
    207: "End",
    209: "PgDn",
    71: "Numpad 7",
    72: "Numpad 8",
    73: "Numpad 9",
    78: "Numpad +",
    58: "Caps Lock",
    30: "A",
    31: "S",
    32: "D",
    33: "F",
    34: "G",
    35: "H",
    36: "J",
    37: "K",
    38: "L",
    39: ";",
    40: "'",
    75: "Numpad 4",
    76: "Numpad 5",
    77: "Numpad 6",
    42: "Shift",
    86: "International",
    44: "Z",
    45: "X",
    46: "C",
    47: "V",
    48: "B",
    49: "N",
    50: "M",
    51: ",",
    52: ".",
    53: "/",
    54: "Right Shift",
    43: "\\",
    200: "Cursor Up",
    79: "Numpad 1",
    80: "Numpad 2",
    81: "Numpad 3",
    156: "Numpad Enter",
    29: "Ctrl",
    219: "OS",
    56: "Alt",
    57: "Space",
    184: "Right Alt",
    220: "Right OS",
    221: "Menu",
    157: "Right Ctrl",
    203: "Cursor Left",
    208: "Cursor Down",
    205: "Cursor Right",
    82: "Numpad 0",
    83: "Numpad .",
    3637: "Numpad /",
    0: "\\",
    61011: "Del",
    60999: "Home",
    61001: "PgUp",
    61009: "PgDn",
    61010: "Ins",
    61007: "End",
    61000: "Up",
    61003: "Left",
    61008: "Down",
    61005: "Right",
    3666: "Numpad Ins",
    3667: "Numpad Del",
    3612: "Numpad Enter",
    3675: "OS",
    3613: "Right Control",
    3640: "Right Alt",
    3677: "Right Meta",
    3653: "Break",
    57394: "Homepage",
    57445: "Search",
    57378: "Play/Pause",
    57380: "Stop",
    57360: "Rewind",
    57369: "Forward",
    57390: "Volume Down",
    57392: "Volume Up",
    57453: "Media Player",
    57376: "Volume Toggle",
    3639: "PrintScrn",
    3663: "Numpad End",
    3665: "Numpad PgDn",
    3655: "Numpad Home",
    3657: "Numpad PgUp",
    57420: "Numpad Mid",
    57416: "Numpad Up",
    57419: "Numpad Left",
    57424: "Numpad Down",
    57421: "Numpad Right"
};

export default class Keys {
    static getKeyName(keyCode: number): string {
        const keyName = keycodes[keyCode];
        if (!keyName) return "?";
        return keyName;
    }

    static toKeyString(keyarray: number[]): string {
        let keysstring = "";
        if (keyarray.length > 0) {
            for (let i = 0; i < keyarray.length; i++) {
                const keyName = this.getKeyName(keyarray[i]!);
                if (i < keyarray.length - 1) {
                    keysstring = keysstring.concat(keyName + " + ");
                } else
                    keysstring = keysstring.concat(keyName);
            }
        } else {
            keysstring = "No Keybind";
        }
        return keysstring;
    }

    static toKeyStringArray(keyarray: number[]): string[] {
        const keyArray = [];
        for (let i = 0; i < keyarray.length; i++) {
            const key = this.getKeyName(keyarray[i]!);
            keyArray.push(key);
        }
        return keyArray;
    }

    static equals(pressed: number[], toCompare: number[], orderMatters = false): boolean {
        if (orderMatters) return this.exactEquals(pressed, toCompare);
        else return this.shuffledEquals(pressed, toCompare);
    }

    /** Checks if a value is valid for keys */
    static isKeys(value: unknown): value is number[] {
        if (!Array.isArray(value)) return false;
        const array: Array<unknown> = value;
        return array.every(i => typeof i === "number");
    }

    private static exactEquals(pressed: number[], toCompare: number[]): boolean {
        if (pressed.length != toCompare.length) return false;
        for (let i = 0; i < pressed.length; i++) {
            if (pressed[i] !== toCompare[i]) return false;
        }
        return true;
    }

    private static shuffledEquals(pressed: number[], toCompare: number[]): boolean {
        if (pressed.length != toCompare.length) return false;
        for (const keyPressed of pressed) {
            if (!toCompare.includes(keyPressed)) return false;
        }
        return true;
    }
}
