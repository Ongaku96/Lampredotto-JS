
import { defineComponent } from "./LampRender.js";
import { Collection } from "./modules/enumerators.js";

const today = new Date();
//CONTAINER
defineComponent({
    tag: "test-component",
    code:
        `<section :name='name' :class='control'>
            <h3 head>{{name}}</h3>
            <slot name='test'><slot/>
        </section>`,
    options: {
        dataset: {
            correct: true
        },
        properties: ["name"],
        computed: {
            control: function () {
                return this.correct ? "success" : "error";
            }
        },
        slots: ["test"]
    },
});
//#region SAMPLE
// defineComponent({
//     tag: "test-",
//     code:
//         `<test-component name=''>
//             <div slot='test'>

//             </div>
//         </test-component>`,
//     options: {
//         dataset: {}
//     }
// });
//#endregion

//#region COMMAND MODEL
defineComponent({
    tag: "test-textbox",
    code:
        `<section>
            <label for='testo'>{{$.testo + ' ' + $.data.toLocaleDateString()}}</label><br>
            <input id='testo' type='text' cmd-model='testo'>
            <textarea cmd-model='testo'></textarea>
            <input id='data' type='date' cmd-model='data'>
        </section>`,
    options: {
        dataset: {
            testo: "hello world",
            numero: 14.5,
            data: new Date(),
        }
    }
});
defineComponent({
    tag: "test-selection",
    code:
        `<section>
            <label for='selezione'>{{selezione}}</label>
            <select id='selezione' cmd-model='selezione'>
                <option cmd-for='item in lista' :value='item.id'>{{item.name}}</option>
            </select>
        </section>`,
    options: {
        dataset: {
            lista: [
                { id: 0, name: "componente 1" },
                { id: 1, name: "componente 2" },
                { id: 2, name: "componente 3" },
            ],
            selezione: 2,
        }
    }
});
defineComponent({
    tag: "test-checkbox",
    code:
        `<section>
            <label for='pippo'>Pippo</label>
            <input id='pippo' type='radio' cmd-model='nome' value='pippo'>
            <label for='pluto'>Pluto</label>
            <input id='pluto' type='radio' cmd-model='nome' value='pluto'>
            <br>
            <p cmd-model='nome'></p>
        </section>`,
    options: {
        dataset: {
            nome: "pippo",
        }
    }
});

defineComponent({
    tag: "test-model",
    code:
        `<test-component name='Command MODEL'>
            <div slot='test' name='test'>
                <test-textbox></test-textbox>
                <test-selection></test-selection>
                <test-checkbox></test-checkbox>
            </div>
        </test-component>`,
    options: {
        dataset: {
        }
    }
});
//#endregion

//#region COMMAND ON
defineComponent({
    tag: "test-loader",
    code: `<input type='range' :value='progress' min='0' max='100' disabled/>`,
    options: {
        dataset: {
            progress: 0
        },
        actions: {
            loading: function () {
                this.progress += 1;
                if (this.progress < 100) {
                    setTimeout(() => {
                        this.loading();
                    }, 30);
                } else {
                    this.__node.trigger("completed", this);
                }
            }
        },
        events: [
            { name: "completed", action: (context) => { context.progress = 0; } }
        ],
    }
});

defineComponent({
    tag: "test-on",
    code:
        `<test-component name='Command ON'>
            <div slot='test' name='test'>
                <section>
                    <h3>On Click</h3><br>
                    <button @click='changeColor' style="background-color:red">change color on click</button>
                </section>
                <section>
                    <h3>On Change</h3><br>
                    <input type='text' @keydown='inputChange'/>
                </section>
                <section>
                    <h3>Custom</h3><br>
                    <button @click='startLoading'>START</button>
                    <test-loader id='loader' @completed="alert('Caricamento completato!');"></test-loader>
                </section>
            </div>
        </test-component>`,
    options: {
        actions: {
            changeColor: function (evt) {
                let button = evt.currentTarget;
                if (button.style.backgroundColor == "red") {
                    button.style.backgroundColor = "green";
                    button.style.color = "white";
                } else {
                    button.style.backgroundColor = "red";
                    button.style.color = "black";
                }
            },
            inputChange: function (evt) {
                let target = evt.currentTarget;
                target.style.opacity = 1 - ((target.value.length / 100) * 2);
            },
            startLoading: function () {
                let range = document.getElementById("loader");
                range.virtual.context.loading();
            }
        },
    }
});
//#endregion

//#region COMMAND BIND
defineComponent({
    tag: "test-bind",
    code:
        `<test-component name='Command BIND'>
            <div slot='test'>
                <section :style='dynamic_style'>
                    <select type='text' cmd-model='color'>
                        <option cmd-for='c in colors' :value='c'>{{c}}</option>
                    </select>
                    <input type='text' cmd-model='color'/>
                    <div :style='d_style'></div>
                </section>
            </div>
        </test-component>`,
    options: {
        dataset: {
            color: "blue",
            colors: ["blue", "yellow", "red", "green", "pink", "orange", "olive", "teal", "darkgray"]
        },
        computed: {
            d_style: function () {
                return "border-radius: 16px; margin: 16px; height: 100px; width: 100px; background-color: " + this.color;
            },
        },
    }
});
//#endregion

//#region COMMAND IF
defineComponent({
    tag: "test-if",
    code:
        `<test-component name='Command IF'>
            <div slot='test'>
                <section>
                    <input type='date' cmd-model='today'/>
                    <p cmd-if='$.month == 0'>Gennaio</p>
                    <p cmd-elseif='$.month == 1'>Febbraio</p>
                    <p cmd-elseif='$.month == 2'>Marzo</p>
                    <p cmd-elseif='$.month == 3'>Aprile</p>
                    <p cmd-elseif='$.month == 4'>Maggio</p>
                    <p cmd-elseif='$.month == 5'>Giugnio</p>
                    <p cmd-elseif='$.month == 6'>Luglio</p>
                    <p cmd-elseif='$.month == 7'>Agosto</p>
                    <p cmd-elseif='$.month == 8'>Settembre</p>
                    <p cmd-elseif='$.month == 9'>Ottobre</p>
                    <p cmd-elseif='$.month == 10'>Novembre</p>
                    <p cmd-else>Dicembre</p>
                </section>
            </div>
        </test-component>`,
    options: {
        dataset: {
            today: new Date(),
        },
        computed: {
            month: function () {
                return this.today.getMonth();
            }
        },
    }
});
//#endregion

//#region COMMAND FOR
defineComponent({
    tag: "test-for",
    code:
        `<test-component name='Command FOR'>
            <div slot='test' style='display:flex;flex-direction: row: flex-wrap: wrap'>
                <section>
                    <p>SIMPLE FOR</p>
                    <div>
                        <button @click='addItem'>ADD</button>
                        <button @click='removeItem'>REMOVE</button>
                    </div>
                    <br>
                    <p cmd-for='e in elementi'>{{e}}</p>
                </section>
                <section>
                    <p>OBJECT FOR</p>
                    <input type='text' cmd-model='lista[2].nome'>
                    <p cmd-for='item in lista'>{{":index - " + $.item.nome}}</p>
                </section>
                <section>
                    <p>SORT FOR</p>
                    <p cmd-for='item in lista' cmd-sort='id'>{{item.nome}}</p>
                </section>
                <section>
                    <p>FILTER FOR</p>
                    <input type='text' cmd-model='ricerca'>
                    <p cmd-for='item in lista' cmd-filter="!$.ricerca || item.nome.includes($.ricerca)">{{$.item.id + ' - ' + $.item.nome}}</p>
                </section>
                <section>
                    <p>TREE FOR</p>
                    <ul>
                        <li cmd-for='item in lista'>
                            <p>{{item.nome}}</p>
                            <ol>
                                <li cmd-for='e in item.container'>{{e}}</li>
                            <ol>
                        </li>
                    <ul>
                </section>
            </div>
        </test-component>`,
    options: {
        dataset: {
            elementi: ["Elemento 1", "Elemento 2", "Elemento 3"],
            lista: [
                { id: 3, nome: "Elemento 1", container: ["item 1", "item 2", "item 3"] },
                { id: 7, nome: "Elemento 3", container: ["item 1", "item 2"] },
                { id: 4, nome: "Elemento 2", container: [] },
            ],
            ricerca: "",
        },
        actions: {
            addItem: function () {
                this.elementi.push("Elemento " + (this.elementi.length + 1));
            },
            removeItem: function () {
                this.elementi.pop();
            },
            addObject: function () {
                this.lista.push({
                    id: this.lista.length + 10,
                    nome: "Elemento " + (this.lista.length + 1),
                    container: []
                });
            },
            removeObject: function () {
                this.lista.pop();
            }
        },
    }
});
//#endregion

//#region TEMPLATES
defineComponent({
    tag: "test-lifecycle",
    code:
        `<test-component name='TEMPLATE LIFECYCLE'>
            <div slot='test'>
                <ol id='test-template'>
                </ol>
                <button @click='refresh'>UPDATE</button>
                <button @click='dismiss'>DISMISS</button>
            </div>
        </test-component>`,
    options: {
        dataset: {
            update: 0
        },
        actions: {
            refresh: function () {
                this.update++;
            },
            dismiss: function () {
                this.__node.dismiss();
            }
        },
        events: [
            {
                name: Collection.node_event.progress,
                action: function (state) {
                    console.print("test-template :: " + state);
                }
            }
        ]
    }
});
(function () {
    let printOnScreen = function (...args) {
        var id = "console-container";
        let node = document.createElement("LI");
        let _args = [];
        const key = "::";
        for (let i = 0; i < args.length; i++) {
            if (args[i].includes(key)) {
                id = args[i].split(key)[0].trim();
                _args.push(args[i].split(key)[1].trim());
            }
        }
        if (_args.length) {
            let textnode = document.createTextNode(_args.join("-"));
            node.appendChild(textnode);
            document.getElementById(id).appendChild(node);
        }
    };

    console["print"] = (...args) => { console.log(...args); printOnScreen(...args); }

    window.onerror = function (...args) {
        printOnScreen(args);
    };
})()
//#endregion

//#region COMPONENTS
defineComponent({
    tag: "test-components",
    code:
        `<test-component name='COMPONENT TEST'>
            <div slot='test'>
                <section>
                    <h5>FLOATING COMPONENT TEST</h5><br>
                    <div float-container>
                        <button float-toggle>TOGGLE FLOATING COMPONENT</button>
                        <div floating-item style='background-color: darkgray;border-radius: 16px;padding: 24px;'>
                            <a cmd-if='$.color == "black"' style='color: black; cursor: pointer' @click='$.color = "white"'>BLACK</a>
                            <a cmd-if='$.color == "white"' style='color: white; cursor: pointer' @click='$.color = "black"'>WHITE</a>
                        </div>
                    </div>
                </section>
                <section>
                    <h5>BLOCK COMPONENT TEST</h5><br>
                    <div block>
                        <button>FIRST</button>
                        <button>SECOND</button>
                        <button>THIRD</button>
                    </div>
                </section>
            </div>
        </test-component>`,
    options: {
        dataset: {
            color: "black"
        }
    }
});
//#endregion