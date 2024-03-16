import { iTemplate } from "./types";
import { vNode } from "./virtualizer";
import { floatingMenuManagement, closeFloatingItems } from "../components/floating.js";

declare global {
    interface String {
        format(...args: Array<string>): string;
        escapeBrackets(): string;
        escapeRegExp(): string;
        escapeHTML(): string;
        padRight(count: number): string;
    }
    interface Array<T> {
        subarray(start: number, count?: number): Array<T>;
        prepend(value: T): Array<T>;
    }
    interface Node {
        virtual: vNode | undefined;
    }
    // interface Date {
    //     toFormatDateString(format: string): string
    // }
    var my_components: Array<iTemplate>
}

export var primitive_types: Readonly<string[]> = ["number", "string", "boolean", "symbol"];
export var global_listener: { event: string, action: (e: Event) => void }[] = [
    {
        event: "click",
        action: floatingMenuManagement
    },
    {
        event: "scroll",
        action: closeFloatingItems
    }
];

function clickListener(e: Event): void {
    global_listener.forEach((listener) => {
        if (listener.event === "click") listener.action(e);
    })
}
function scrollListener(e: Event): void {
    global_listener.forEach((listener) => {
        if (listener.event === "scroll") listener.action(e);
    })
}
function loadListener(e: Event): void {
    global_listener.forEach((listener) => {
        if (listener.event === "load") listener.action(e);
    })
}

document.onclick = clickListener;
document.onscroll = scrollListener;
document.onload = loadListener;

/**Replace the '{n}' characters in string with the given list of string*/
String.prototype.format = function (...args: Array<string>) {
    let a = this.toString();
    for (let k = 0; k < args.length; k++) {
        let _replace = args[k];
        a = a.replace(new RegExp(`\\{${k}\\}`), _replace);
    }
    return a;
};
/**Escaper RegExp characters */
String.prototype.escapeRegExp = function () { return this.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
/**escape { } characters from a string */
String.prototype.escapeBrackets = function () { return this.replace(/\{\{|\}\}/gm, "").trim(); };
/**escape { } characters from a string */
String.prototype.escapeHTML = function () {
    return this.replace(/&/g, "&amp")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
String.prototype.padRight = function (count: number) {
    return this.substring(this.length - count);
}
/**Slice array */
Array.prototype.subarray = function (start: number, count: number = 0) {
    if (!count) count = -1;
    let _end = this.length + 1 - count * -1;
    if (start + _end < this.length) return this.slice(start, _end); else return this;
};
Array.prototype.prepend = function <T>(value: T) {
    var newArray = this.slice();
    newArray.unshift(value);
    return newArray;
}

// Date.prototype.toFormatDateString = function (format: string) {
//     return this.toString();
// }