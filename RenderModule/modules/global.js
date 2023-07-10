export const key_parent = "__parent";
export var primitive_types = ["number", "string", "boolean", "symbol"];
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
