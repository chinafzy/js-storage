# js-storage

基于H5的localStorage/sessionStorage包装的一个缓存。实现了这些功能：

+ 基础功能 SimpleStorage
    * 单个操作 set/get/remove
    * 批量操作 keys/clear
+ 服务注册功能 RegisteredStorage
    * register/deregister/getPromise
    * registeredKeys()

不同的Storage之间通过不同的zone来相互隔离。

## 使用说明

### SimpleStorage
普通的Map操作

```ts
import JsStorage from '@equalto/js-storage'
const storage = new JsStorage('simple')

const key = 'k1', value = 'v1'
storage.set(key, value)
storage.get(key) == value   // true 

storage.set(key, value, {
  expireAfter: 100   // 缓存有效期100毫秒 
})
storage.get(key) == value  // true
setTimeout(() => storage.get(key) == value, 200)  // false，缓存200毫秒超时了
```

### RegisteredStorage

数据的使用者不应该关心数据的获取方式和缓存策略。 我们应该把数据做成服务，对于调用者来说是傻瓜式的。

因此有了`数据服务注册`的概念 

#### 范例 —— 注册数据服务

`sys-data.ts`

```ts
import JsStorage from '@equalto/js-storage'
import fetch from "node-fetch"   // 非web环境，使用 node-fetch@2 来模拟fetch函数 

const storage = new JsStorage('sys-data')

storage.register(
  'countries', 
  () => fetch(`https://restcountries.com/v3.1/all?fields=name`)
      .then(resp => resp.json()),
  { expireAfter: 3600 * 1000 * 24 * 365 }
)

export default storage
```

调用代码 `using-sys-data.ts`

```ts
import SysData from './sys-data'

SysData.get2('countries')  // 返回一个Promise
```

#### 范例 —— 做一个特定的数据服务

或者做一个更加干净的数据服务：
`countries.ts`

```ts
import JsStorage from '@equalto/js-storage'
import fetch from "node-fetch"   // 非web环境，使用 node-fetch@2 来模拟fetch函数 

const storage = new JsStorage('sys-countries')

const getCountries = storage.register(
  'countries', 
  () => fetch(`https://restcountries.com/v3.1/all?fields=name`)
      .then(resp => resp.json()),
  { expireAfter: 3600 * 1000 * 24 * 365 }
)

export default getCountries
```

使用服务的范例代码：`using-countries.ts`

```ts
import getCountries from './countries'

getCountries()  // 返回一个promise
```

## 安装

```bash
npm install @equalto/js-storage
```

## API 参考

### JsStorage 构造函数
```ts
new JsStorage(zone?: string, engine?: Storage)
```

### SetOpts
```ts
interface SetOpts {
  expireAt?: number      // 指定时间戳过期
  expireAfter?: number   // 毫秒数后过期
  expireFn?: () => SetOpts // 动态过期函数
}
```

### RegisterOpts
```ts
interface RegisterOpts extends SetOpts {
  initNow?: boolean      // 注册后立即执行
}
```

## 许可证

MIT 
