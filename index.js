const bucket = new Set();
let activeEffect;
// 副作用函数
function effect(fn) {
  activeEffect = fn;
  fn();
}

// 需要代理的数据
const data = {
  name: "vue-base"
}

const vue = new Proxy(data, {
  get(target, key) {
    if (activeEffect) bucket.add(activeEffect)
    return target[key]
  },
  set(target, key, newKey) {
    target[key] = newKey;
    bucket.forEach(f => f())
    return true;
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


