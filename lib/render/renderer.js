/**
 * 渲染器
 * @param {object} vnode 
 * @param {*} container 
 */
export default function renderer(vnode, container) {
    if (typeof vnode.tag == 'string') {
        mountElement(vnode, container);
    } else if (typeof vnode.tag == 'object') {
        mountComponent(vnode, container);
    }
}

/**
 * 渲染标签元素
 * @param {{type: string, props: object, children: Array}} vnode 
 * @param {*} container 
 */
export function mountElement(vnode, container) {
    if (!vnode.tag) {
        let msg = "vnode must has a tag attribute.";
        console.warn(msg);
        return new Error(msg);
    }

    const el = document.createElement(vnode.tag);

    // props
    if (vnode.props) {
        for (const key in vnode.props) {
            if (/^on/.test(key)) { // 事件
                el.addEventListener(
                    key.slice(2).toLowerCase(),
                    vnode.props[key].bind(el)
                )
            }
        }
    }
    
    // chilren
    if (typeof vnode.children === 'string') { // 文本子节点
        el.appendChild(
            document.createTextNode(vnode.children)
        )
    } else if (Array.isArray(vnode.children)) {
        vnode.children.forEach(child => renderer(child, el));
    }

    // 绑定
    container.appendChild(el);
}

/**
 * 渲染标签元素
 * @param {Object} vnode 
 * @param {*} container 
 */
export function mountComponent(vnode, container) {
    const subtree = vnode.tag.render();
    renderer(subtree, container);
}
