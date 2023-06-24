// 需要代理的数据
const data = {
  name: "vue-base",
  version: "0.1.0",
  isEdit: false
}


const bucket = new WeakMap();
let activeEffect;
let effectStack = [];
// 副作用函数
function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn)

    activeEffect = effectFn;
    effectStack.push(activeEffect)

    const result = fn();

    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];

    return result;
  }
  effectFn.options = options;

  // 存储所有与该副作用函数相关联的依赖集合
  effectFn.deps = [];
  
  if (!options.lazy) { // 默认不是懒执行
    effectFn();
  }
  return effectFn;
}
const cleanup = (fn) => {
  for (let i = 0; i < fn.deps.length; i++) {
    const dep = fn.deps[i];
    dep.delete(fn);
  }
  fn.deps.length = 0;
}
const track = (target, key) => {
  if (!activeEffect) return;

  const depsMap = bucket.get(target) || new Map();
  bucket.set(target, depsMap);

  const dep = depsMap.get(key) || new Set();
  depsMap.set(key, dep);

  dep.add(activeEffect);

  activeEffect.deps.push(dep);
}
const trigger = (target, key, newKey) => {
  const depsMap = bucket.get(target)
  if (!depsMap) return;

  const effects = depsMap.get(key) || new Set();
  const effectToRun = new Set();
  effects.forEach((effect) => {
    if (effect !== activeEffect) {
      effectToRun.add(effect);
    }
  })
  
  effectToRun.forEach(fn => {
    // console.log(fn.options)
    if (fn.options.scheduler) {
      fn.options.scheduler(fn);
    } else {
      fn();
    }
  });
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
function computed(getter) {
  let val;
  let dirty = true;

  const effectFn = effect(getter, { 
    lazy: true,
    scheduler() {
      dirty = true;
      trigger(effectFn, 'value');
    }
  });

  const obj = {
    get value() {
      if (dirty) {
        val = effectFn();
        dirty = false;
      }
      track(obj, 'value');
      return val;
    }
  }

  return obj;
}


/**
 * 测试
 */
const sum = computed(() => {
  let str = vue.name + Math.random();
  document.getElementById("version").innerText = str;
  return str;
});

document.getElementById("btn").onclick = () => {
  console.log(sum.value);
}
document.getElementById("btn2").onclick = () => {
  vue.name = "I like Vue" // 变量变化
  console.log(sum.value); // 手动触发
}
