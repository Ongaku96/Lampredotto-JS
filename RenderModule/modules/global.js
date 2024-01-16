export const key_parent = "__parent";
export const menu_keys = {
    container: "float-container",
    toggle: "float-toggle",
    item: "floating-item",
    query: (key) => "[" + key + "]"
};
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
/**Setup of floating elements position and */
function floatingMenuManagement(e) {
    var clickedElement = e.target;
    if (!clickedElement?.closest(menu_keys.query(menu_keys.item)) &&
        !clickedElement?.closest(menu_keys.query(menu_keys.toggle)))
        closeOpenedMenus(clickedElement);
    if (clickedElement && clickedElement?.closest(menu_keys.query(menu_keys.toggle)) != null) {
        let _parent = clickedElement?.closest(menu_keys.query(menu_keys.container));
        let _item = _parent.querySelector(menu_keys.query(menu_keys.item));
        if (_parent.getAttribute(menu_keys.container) != "show") {
            if (_item)
                openFloatingMenu(_item);
        }
        closeOpenedMenus(clickedElement);
    }
}
/**open a floating menu */
export function openFloatingMenu(item) {
    let _container = item.closest(menu_keys.query(menu_keys.container));
    _container.setAttribute(menu_keys.container, "show");
    let _container_rect = _container.getBoundingClientRect();
    item.style.minWidth = _container_rect.width + "px";
    let _rect = item.getBoundingClientRect();
    let _position = item.getAttribute(menu_keys.item);
    let _left = _container_rect.left;
    let _top = _container_rect.top;
    const _margin = 4;
    switch (_position) {
        case "top left":
            item.style.left = _left + "px";
            item.style.top = (_top + _rect.height + _margin) + "px";
            break;
        case "top right":
            item.style.left = (_container_rect.right - _rect.width - _margin) + "px";
            item.style.top = (_top + _rect.height + _margin) + "px";
            break;
        case "bottom left":
            item.style.left = _left + "px";
            item.style.top = (_container_rect.bottom + _margin) + "px";
            break;
        case "bottom right":
            item.style.left = (_container_rect.right - _rect.width - _margin) + "px";
            item.style.top = (_container_rect.bottom + _margin) + "px";
            break;
        case "left top":
            item.style.left = (_left - _rect.width - _margin) + "px";
            item.style.top = _top + "px";
            break;
        case "right top":
            item.style.left = (_container_rect.right + _margin) + "px";
            item.style.top = _top + "px";
            break;
        case "left bottom":
            item.style.left = (_left - _rect.width - _margin) + "px";
            item.style.top = (_container_rect.bottom - _rect.height - _margin) + "px";
            break;
        case "right bottom":
            item.style.left = (_container_rect.right + _margin) + "px";
            item.style.top = (_container_rect.bottom - _rect.height - _margin) + "px";
            break;
        default:
            item.style.left = _left + "px";
            item.style.top = (_top + _container_rect.height + _margin) + "px";
            if ((_rect.y + _rect.height) > window.innerHeight) {
                item.style.bottom = (_top + _rect.height + _margin) + "px";
            }
            break;
    }
}
function closeFloatingItems(evt) {
    closeOpenedMenus(evt.currentTarget);
}
/**close all opened floating menus */
export function closeOpenedMenus(item) {
    document.querySelectorAll("div[" + menu_keys.container + " = 'show']").forEach((e) => {
        if ((item && !e.contains(item)) || item == null)
            e.setAttribute(menu_keys.container, "hide");
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
