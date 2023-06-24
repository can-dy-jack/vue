const bucket = new WeakMap();
const ITERATE_KEY = Symbol('iterate');
let activeEffect;
let effectStack = [];

const originalIncludes = Array.prototype.includes;
const arrayMethods = {
  includes: function (...args) {
    let res = originalIncludes.apply(this, args);
    if (!res) {
      res = originalIncludes.apply(this.raw, args);
    }
    return this;
  }
};
let shouldTrack = true;
;["push", "pop", "shift", "unshift", "splice"].forEach((method) => {
  const originMethod = Array.prototype[method];

  arrayMethods[method] = function (...args) {
    shouldTrack = false;
    let res = originMethod.apply(this, args);
    shouldTrack = true;
    return res; 
  }
})


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
  if (!activeEffect || !shouldTrack) return;

  const depsMap = bucket.get(target) || new Map();
  bucket.set(target, depsMap);

  const dep = depsMap.get(key) || new Set();
  depsMap.set(key, dep);

  dep.add(activeEffect);

  activeEffect.deps.push(dep);
}
const trigger = (target, key, type, newKey) => {
  const depsMap = bucket.get(target)
  if (!depsMap) return;

  const effects = depsMap.get(key) || new Set();

  const effectToRun = new Set();
  effects.forEach((effect) => {
    if (effect !== activeEffect) {
      effectToRun.add(effect);
    }
  })
  
  if (type === 'ADD' || type === 'DELETE') {
    const iterateEffects = depsMap.get(ITERATE_KEY) || new Set();
    iterateEffects.forEach(f => {
      if (f !== activeEffect) {
        effectToRun.add(f);
      }
    })
  }

  if (type === 'ADD' && Array.isArray(target)) {
    const iterateEffects = depsMap.get('length') || new Set();
    iterateEffects.forEach(f => {
      if (f !== activeEffect) {
        effectToRun.add(f);
      }
    })
  }

  if (Array.isArray(target) && key === 'length') {
    depsMap.forEach((fn, idx) => {
      if (idx >= newKey) {
        fn.forEach(f => {
          if (f !== activeEffect) {
            effectToRun.add(f);
          }
        })
      }
    })
  }
  
  effectToRun.forEach(fn => {
    // console.log(fn.options)
    if (fn.options.scheduler) {
      fn.options.scheduler(fn);
    } else {
      fn();
    }
  });
}
function createReactive(obj, isShadow = false, isReadonly = false) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      if (key === 'raw') {
        return target;
      }
      if(Array.isArray(target) && arrayMethods.hasOwnProperty(key)) {
        return Reflect.get(arrayMethods, key, receiver);
      }

      if (!isReadonly && typeof key !== 'symbol') {
        track(target, key)
      }
      const res = Reflect.get(target, key, receiver);
      if (isShadow) {
        return res;
      }
      if (typeof res === 'object' && res !== null) {
        return isReadonly ? readonly(res) : reactive(res);
      }
      return res;
    },
    set(target, key, newKey, receiver) {
      if (isReadonly) {
        console.warn(`key ${key} is readonly`)
        return true;
      }

      const oldVal = target[key];
  
      const type = Array.isArray(target) ?
        Number(key) < target.length ? 'SET' : 'ADD' :
        Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD';
  
      const res = Reflect.set(target, key, newKey, receiver);
      // 当值变化且不为NaN时，触发副作用函数
      if (target === receiver.raw) {
        if (oldVal !== newKey && (oldVal === oldVal || newKey === newKey)) {
          trigger(target, key, type, newKey);
        }
      }
      return res;
    },
    // in 操作符代理
    has(target, key) {
      track(target, key);
      return Reflect.has(target, key);
    },
    // for ... in ... 拦截
    ownKeys(target) {
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
    // delete 操作符
    deleteProperty(target, key) {
      if (isReadonly) {
        console.warn(`key ${key} is readonly`)
        return true;
      }
      const hasKey = Object.prototype.hasOwnProperty.call(target, key);
      const res = Reflect.deleteProperty(target, key);
      if (hasKey && res) {
        trigger(target, key, 'DELETE');
      }
      return res;
    }
  })
}
const reactiveMap = new Map();
function reactive(obj) {
  const existProxy = reactiveMap.get(obj);
  if (existProxy) return existProxy;

  const newProxy = createReactive(obj);
  reactiveMap.set(obj, newProxy);

  return newProxy;
}
function shallowReactive(obj) {
  return createReactive(obj, true);
}
function readonly(obj) {
  return createReactive(obj, false, true);
}
function shallowReadonly(obj) {
  return createReactive(obj, true, true);
}
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
function traverse(val, visited = new Set()) {
  if (typeof val !== 'object' || val == null || visited.has(val)) {
    return;
  }
  visited.add(val);
  for (const k in val) {
    traverse(val[k], visited)
  }
  return val;
}
function watch(source, callback, options = {}) {
  let getter; // 支持监控变量或getter函数
  if (typeof source === 'function') {
    getter = source;
  } else {
    getter = () => traverse(source);
  }

  let oldVal, newVal, cleanup;

  function oninvalidate(fn) {
    cleanup = fn;
  }

  function job() {
    newVal = effectFn();
    if (cleanup) {
      cleanup();
    }
    callback(newVal, oldVal, oninvalidate);
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

/**
 * 测试
 */
// 需要代理的数据
const vue = reactive([
  'name',
  'version'
]);
document.getElementById("btn").onclick = () => {
  vue[0] = Math.random();
  document.getElementById("pre").innerText = vue.toString();
}
// document.getElementById("btn2").onclick = () => {
//   vue.length = 0;
// }
effect(() => {
  vue.push(1)
  console.log("it run!")
})

effect(() => {
  vue.unshift(1)
})
