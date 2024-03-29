
/**
 * Data collector for node's context
 * @date 28/3/2024 - 15:59:08
 *
 * @abstract
 * @class NodeContext
 * @typedef {NodeContext}
 * @implements {DataCollection}
 * @implements {iNodeReferences}
 */
// abstract class NodeContext {

//     [key: string]: any;
//     _app_: Application;
//     _element_: Element | undefined;
//     _node_?: vNode;
//     /**
//      * Reference to parent's context for proxy inputs changes.
//      * @date 28/3/2024 - 15:52:12
//      *
//      * @protected
//      * @type {(iComponent | undefined)}
//      */
//     private parentContext: NodeContext | undefined;
//     private _events: iEvent<any>[] = [];

//     constructor(node: vNode) {
//         this._app_ = node.context._app_;
//         this._element_ = node.isElement && node.reference.length ? <HTMLElement>node.reference[0] : undefined;
//         this._node_ = node;
//         let _ref = this;
//         this._events.push({ name: Collection.node_event.progress, action: async function (state: string) { _ref.onProgress(state); } })
//     }

//     private onProgress(state: string): void {
//         switch (state) {
//             case Collection.lifecycle.creating:
//                 if ("onCreating" in this) (<Function>this.onCreating).call(this);
//                 break;
//             case Collection.lifecycle.created:
//                 if ("onCreated" in this) (<Function>this.onCreated).call(this);
//                 break;
//             case Collection.lifecycle.mounting:
//                 if ("onMounting" in this) (<Function>this.onMounting).call(this);
//                 break;
//             case Collection.lifecycle.mounted:
//                 if ("onMounted" in this) (<Function>this.onMounted).call(this);
//                 break;
//             case Collection.lifecycle.context_creating:
//                 if ("onContextCreating" in this) (<Function>this.onContextCreating).call(this);
//                 break;
//             case Collection.lifecycle.context_created:
//                 if ("onContextCreated" in this) (<Function>this.onContextCreated).call(this);
//                 break;
//             case Collection.lifecycle.updating:
//                 if ("onUpdating" in this) (<Function>this.onUpdating).call(this);
//                 break;
//             case Collection.lifecycle.updated:
//                 if ("onUpdated" in this) (<Function>this.onUpdated).call(this);
//                 break;
//             case Collection.lifecycle.ready:
//                 if ("onReady" in this) (<Function>this.onReady).call(this);
//                 break;
//         }
//     }

//     public setParentContext(context: NodeContext) {
//         this.parentContext = context;
//     }

// }