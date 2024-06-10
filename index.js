import { renderer } from "./lib/index.js";

// 对象描述标签
const vdom = {
    tag: 'div',
    props: {
        onClick: () => { }
    },
    children: [
        {
            tag: 'h1',
            children: "标题"
        },
        {
            tag: 'div',
            props: {
                onClick: e => {
                    console.log('click', e);
                }
            },
            children: [
                {
                    tag: 'p',
                    children: "内容"
                }
            ]
        }
    ]
}

renderer(vdom, document.getElementById("app"));
