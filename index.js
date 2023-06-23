const bucket = new Set();

// 需要代理的数据
const data = {
  name: "vue-base"
}
// 副作用函数
const effect = () => {
  console.log(vue.name)
}

const vue = new Proxy(data, {
  get(target, key) {
    bucket.add()
    return target[key]
  },
  set(target, key, newKey) {
    target[key] = newKey;
    bucket.forEach(f => f())
    return true;
  }
})


// 更改代理的属性，副作用函数会调用
vue.name = "响应式！" // 打印：响应式！

