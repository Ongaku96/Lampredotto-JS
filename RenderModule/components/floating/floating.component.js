import { defineComponent } from "../../LampRender.js";

defineComponent({
    selector: "float-container",
    templatePath: "RenderModule/components/floating/floating.component.html",
    stylesPath: "RenderModule/components/floating/floating.component.css",
});

export const menu_keys = {
    container: "float-container",
    toggle: "float-toggle",
    item: "floating-item",
    query: (key) => "[" + key + "]"
}
/**Setup of floating elements position and */
export function floatingMenuManagement(e) {
    var clickedElement = e.target;
    function isUnfocused() {
        if (clickedElement) {
            let virtualCondition = "virtual" in clickedElement ?
                !clickedElement.virtual.childOf({ attribute: menu_keys.item }) &&
                !clickedElement.virtual.childOf({ attribute: menu_keys.toggle }) : true;

            return virtualCondition;
        }
        return true;
    }
    function isToggle() {
        if (clickedElement) {
            return clickedElement.closest(menu_keys.query(menu_keys.toggle)) != null ||
                "virtual" in clickedElement && clickedElement.virtual.childOf({ attribute: menu_keys.toggle });
        } return false;
    }

    if (isUnfocused()) { closeOpenedMenus(clickedElement); return; }
    if (isToggle()) {
        closeOpenedMenus(clickedElement);
        let _parent = clickedElement?.closest(menu_keys.query(menu_keys.container));
        if (_parent && _parent.getAttribute(menu_keys.container) != "show") {
            let _item = _parent.querySelector(menu_keys.query(menu_keys.item));
            if (_item) openFloatingMenu(_item);
        }
    }
}
/**open a floating menu */
export function openFloatingMenu(item) {

    let _container = item.closest(menu_keys.query(menu_keys.container));
    _container.setAttribute(menu_keys.container, "show");
    let _container_rect = _container.getBoundingClientRect();
    // item.style.minWidth = _container_rect.width + "px";
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

export function closeFloatingItems(evt) {
    closeOpenedMenus(evt.currentTarget);
}
/**close all opened floating menus */
export function closeOpenedMenus(item) {
    document.querySelectorAll("div[" + menu_keys.container + " = 'show']").forEach((e) => {
        if ((item && !e.contains(item)) || item == null) e.setAttribute(menu_keys.container, "hide");
    });
}