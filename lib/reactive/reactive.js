export default function reactive(bucket, obj, effect) {
    // 保存副作用函数
    const p = new Proxy(obj, {
        get(target, key) {
            bucket.add(effect);
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
