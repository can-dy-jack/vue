# responsive-base
响应式数据的基本实现

## 实现
```js
const bucket = new Set();

// 需要代理的数据
const data = {
  name: "vue-base"
}
// 副作用函数
const effect = () => {
  document.getElementById("app").innerText = vue.name
}

const vue = new Proxy(data, {
  get(target, key) {
    bucket.add(effect)
    return target[key]
  },
  set(target, key, newKey) {
    target[key] = newKey;
    bucket.forEach(f => f())
    return true;
  }
})
```

## 响应
```js
effect() // 初始化

// 更改代理的属性，副作用函数会调用
setTimeout(() => {
  vue.name = "响应式！"
}, 500)
```
