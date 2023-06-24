# responsive-base
响应式数据的基本实现

## 实现
```js
function watch(source, callback, options = {}) {
  let getter; // 支持监控变量或getter函数
  if (typeof source === 'function') {
    getter = source;
  } else {
    getter = () => traverse(source);
  }

  let oldVal, newVal;
  function job() {
    newVal = effectFn();
    callback(newVal, oldVal);
    oldVal = newVal;
  }

  const effectFn = effect(
    () => getter(),
    {
      scheduler: job,
      lazy: true
    }
  )

  if (options.immediate) {
    job();
  } else {
    oldVal = effectFn();
  }
}
```

## 响应
```js
/**
 * 测试
 */
document.getElementById("btn").onclick = () => {
  vue.version = Math.random() + "";
}
watch(() => vue.version, (newVal, oldVal) => {
  document.getElementById("version").innerText = vue.version;
  console.log("变化了，new:", newVal, "old:", oldVal);
}, { immediate: true })

```
