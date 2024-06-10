
const bucket = new Set();
export default function reactive(obj) {
    // 保存副作用函数
    const p = new Proxy(obj, {
        get(target, key) {
            if (currentEffect) {
                bucket.add(currentEffect);
            }
            return target[key];
        },
        set(target, key, newValue) {
            target[key] = newValue;
            bucket.forEach(item => item());
            return true;
        }
    });
    return p;
}

let currentEffect = null;
export function effect(func) {
    currentEffect = func;
    func();
}
