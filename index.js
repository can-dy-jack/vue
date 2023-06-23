const bucket = new WeakMap();
let activeEffect;
// 副作用函数
function effect(fn) {
  const effectFn = () => {
    activeEffect = fn;
    fn();
  }
  // 存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = [];
  effectFn();
}

// 需要代理的数据
const data = {
  name: "vue-base",
  version: "0.1.0"
}


const track = (target, key) => {
  if (!activeEffect) return;

  const depsMap = bucket.get(target) || new Map();
  bucket.set(target, depsMap);

  const dep = depsMap.get(key) || new Set();
  depsMap.set(key, dep);

  dep.add(activeEffect);
}
const trigger = (target, key, newKey) => {
  const depsMap = bucket.get(target)
  if (!depsMap) return;

  const effect = depsMap.get(key)
  if (effect) effect.forEach(f => f())
}
const vue = new Proxy(data, {
  get(target, key) {
    track(target, key)
    return target[key]
  },
  set(target, key, newKey) {
    target[key] = newKey;
    trigger(target, key, newKey)
  }
})

effect(() => {
  document.getElementById("app").innerText = vue.name
})

// 更改代理的属性，副作用函数会调用
setTimeout(() => {
  // console.log(bucket)
  vue.name = "响应式！"
}, 500)


