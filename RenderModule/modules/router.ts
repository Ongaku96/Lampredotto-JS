class Router {
    private routes: { path: string, cb: Function }[] = [];
    private mode: "history" | "hash" | null = null;
    private root: string = "/";
    private current: string = "/";
    private timeout?: number;

    constructor(options: { mode?: "history" | "hash", root?: string }) {
        this.mode = window.history.pushState != null ? "history" : "hash";
        if (options.mode) this.mode = options.mode;
        if (options.root) this.root = options.root;
        this.listen();
    }

    /**
     * Add path to history collection
     *
     * @param {string} path string represent the path
     * @param {string} cb
     * @returns {this}
     */
    add(path: string, cb: string): Router {
        this.routes.push({ path, cb });
        return this;
    }

    remove(path: string): Router {
        this.routes.slice(this.routes.findIndex(e => e.path === path), 1);
        return this;
    }

    flush(): Router {
        this.routes = [];
        return this;
    }

    private clearSlashes(path: string): string {
        return path.toString().replace(/\/S/, '').replace(/^\//, '');
    }

    getFragment(): string {
        let fragment = '';
        switch (this.mode) {
            case "history":
                fragment = this.clearSlashes(decodeURI(window.location.pathname + window.location.search));
                fragment = fragment.replace(/\?(.*)$/, '');
                fragment = this.root !== '/' ? fragment.replace(this.root, '') : fragment;
                break;
            case "hash":
                const match = window.location.href.match(/#(.*)$/);
                fragment = match ? match[1] : '';
                break;
        }
        return this.clearSlashes(fragment);
    }

    navigate(path: string = ''): Router {
        if (this.mode == "history") {
            window.history.pushState(null, "", this.root + this.clearSlashes(path));
        } else {
            window.location.href = `${window.location.href.replace(/#(.*)$/, '')}#${path}`;
        }
        return this;
    }

    private listen() {
        clearInterval(this.timeout);
        this.timeout = setInterval(this.interval, 50);
    }
    private interval() {

        if (this.current === this.getFragment()) return;
        this.current = this.getFragment();

        this.routes.some(route => {
            const match = this.current.match(route.path);
            if (match) {
                match.shift();
                route.cb.apply({}, match);
                return match;
            }
            return false;
        });
    }
}


export default Router