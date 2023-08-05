function setup(tag, template, options) {
    if (globalThis.my_components == null)
        globalThis.my_components = [];
    my_components.push({ name: tag, template: template, options: options });
}
function style(css) {
    const link = document.createElement('link');
    link.href = `data:text/css;base64,${btoa(css)}`;
    link.type = 'text/css';
    link.rel = 'stylesheet';
    document.getElementsByTagName('head')[0].appendChild(link);
}
export { setup as setupComponent, style as styleComponent };
