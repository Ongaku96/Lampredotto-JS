import { floatingMenuManagement, closeFloatingItems } from "../components/float.component/float.component.js";
export var primitive_types = ["number", "string", "boolean", "symbol"];
export var global_listener = [
    {
        event: "click",
        action: floatingMenuManagement
    },
    {
        event: "scroll",
        action: closeFloatingItems
    }
];
function clickListener(e) {
    global_listener.forEach((listener) => {
        if (listener.event === "click")
            listener.action(e);
    });
}
function scrollListener(e) {
    global_listener.forEach((listener) => {
        if (listener.event === "scroll")
            listener.action(e);
    });
}
function loadListener(e) {
    global_listener.forEach((listener) => {
        if (listener.event === "load")
            listener.action(e);
    });
}
document.onclick = clickListener;
document.onscroll = scrollListener;
document.onload = loadListener;
/**Replace the '{n}' characters in string with the given list of string*/
String.prototype.format = function (...args) {
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
String.prototype.padRight = function (count) {
    return this.substring(this.length - count);
};
/**Slice array */
Array.prototype.subarray = function (start, count = 0) {
    if (!count)
        count = -1;
    let _end = this.length + 1 - count * -1;
    if (start + _end < this.length)
        return this.slice(start, _end);
    else
        return this;
};
Array.prototype.prepend = function (value) {
    var newArray = this.slice();
    newArray.unshift(value);
    return newArray;
};
// Date.prototype.toFormatDateString = function (format: string) {
//     return this.toString();
// }
