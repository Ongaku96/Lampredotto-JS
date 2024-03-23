import { DataCollection } from "./types.js";

function setup(selector: string, template: string, options: DataCollection): void {
    if (globalThis.my_components == null) globalThis.my_components = [];
    my_components.push({ name: selector, template: template, options: options });
}

function style(css: string): void {
    let style = new CSSStyleSheet();
    style.replaceSync(css);
    document.adoptedStyleSheets.push(style);
}

export { setup as setupComponent, style as styleComponent };