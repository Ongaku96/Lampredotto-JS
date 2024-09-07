function setup(selector, template, options) {
    if (globalThis.my_components == null)
        globalThis.my_components = [];
    globalThis.my_components = globalThis.my_components.filter(c => c.name != selector);
    globalThis.my_components.push({ name: selector, template: template, options: options });
}
function style(css) {
    let style = new CSSStyleSheet();
    style.replaceSync(css);
    document.adoptedStyleSheets.push(style);
}
export { setup as setupComponent, style as styleComponent };
