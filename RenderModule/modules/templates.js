function setup(tag, template, options) {
    if (globalThis.my_components == null)
        globalThis.my_components = [];
    my_components.push({ name: tag, template: template, options: options });
}
export { setup as ComponentSetup };
