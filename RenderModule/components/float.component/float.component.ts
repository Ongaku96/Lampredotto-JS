import { defineComponent } from "../../LampRender.js";

defineComponent({
    selector: "float-container",
    template: "<div float-container='hide'></div>",
    styles: [
        `[floating-item]{display:none;position:fixed;top:0;left:0;overflow-y:auto;}`,
        `[float-container]{position:relative;}`,
        `[float-container='hide']>[floating-item]{display:none;}`,
        `[float-container='show']:not([disabled])>[floating-item]{display: block;}`,],
});

export const menu_keys = {
    container: "float-container",
    toggle: "float-toggle",
    item: "floating-item",
    query: (key: string) => "[" + key + "]"
}
/**Setup of floating elements position and */
export function floatingMenuManagement(evt: Event) {
    var clickedElement = <HTMLElement>evt.target;
    let _parent = clickedElement?.closest(menu_keys.query(menu_keys.container));

    if (isUnfocused()) { closeOpenedMenus(clickedElement); return; }
    if (isToggle()) {
        closeOpenedMenus(clickedElement);
        if (_parent && _parent.getAttribute(menu_keys.container) != "show") {
            let _item = <HTMLElement>_parent.querySelector(menu_keys.query(menu_keys.item));
            if (_item) openFloatingMenu(_item);
        }
    }
    function isUnfocused() {
        if (clickedElement) {
            let virtualCondition = "virtual" in clickedElement ?
                !clickedElement.virtual?.childOf({ attribute: menu_keys.item }) &&
                !clickedElement.virtual?.childOf({ attribute: menu_keys.toggle }) : true;

            return virtualCondition;
        }
        return true;
    }
    function isToggle() {
        if (clickedElement) {
            return clickedElement.closest(menu_keys.query(menu_keys.toggle)) != null ||
                "virtual" in clickedElement && clickedElement.virtual?.childOf({ attribute: menu_keys.toggle });
        } return false;
    }
}
/**open a floating menu */
export function openFloatingMenu(item: HTMLElement) {
    if (item != null) {
        let _container = item.closest(menu_keys.query(menu_keys.container));
        _container?.setAttribute(menu_keys.container, "show");
        let _container_rect = _container?.getBoundingClientRect() || new DOMRect();
        // item.style.minWidth = _container_rect.width + "px";
        let _rect = item.getBoundingClientRect();
        let _position = item.getAttribute(menu_keys.item);

        let _left = _container_rect?.left;
        let _top = _container_rect?.top || 0;

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
                item.style.top = (_container_rect.y + _rect.height + _margin) > window.innerHeight ?
                    (_container_rect.y - (_rect.height + _margin)) + "px" :
                    (_top + _container_rect.height + _margin) + "px";
                break;
        }
    }
}

export function closeFloatingItems(evt: Event) {
    closeOpenedMenus(<HTMLElement>evt.currentTarget);
}
/**close all opened floating menus */
export function closeOpenedMenus(item: HTMLElement) {
    document.querySelectorAll("div[" + menu_keys.container + " = 'show']").forEach((e) => {
        if ((item && !e.contains(item)) || item == null) e.setAttribute(menu_keys.container, "hide");
    });
}