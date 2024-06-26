import { renderer, reactive, effect } from "./lib/index.js";

// 对象描述标签
const vdom = {
    tag: 'div',
    children: [
        {
            tag: 'h1',
            children: "标题"
        },
        {
            tag: 'div',
            props: {
                onClick: function(e) {
                    console.log('click', e, this);
                }
            },
            children: [
                {
                    tag: 'p',
                    children: "内容"
                }
            ]
        },
        {
            tag: {
                render() {
                    return {
                        tag: 'div',
                        children: "component",
                        props: {
                            onClick: function (e) {
                                p.name = "obj1";
                            }
                        }
                    }
                }
            }
        }
    ]
}

renderer(vdom, document.getElementById("app"));


window.obj = { name: "obj" };
window.bucket = new Set();

window.p = reactive(window.obj);
effect(function() {
    console.log(window.p.name);
})


