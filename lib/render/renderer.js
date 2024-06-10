/**
 * 渲染器
 * @param {{type: string, props: object, children: Array}} vnode 
 * @param {*} container 
 */
export default function renderer(vnode, container) {
    if (!vnode.tag) {
        let msg = "vnode must has a tag attribute.";
        console.warn(msg);
        return new Error(msg);
    }

    const el = document.createElement(vnode.tag);

    // props
    if (vnode.props) {
        for (const key in vnode.props) {
            if (/~on/.test(key)) { // 事件
                el.addEventListener(
                    key.slice(2).toLowerCase(),
                    vnode.props[key]
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