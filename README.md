# js-storage

A TypeScript wrapper for HTML5 localStorage/sessionStorage with advanced caching capabilities.

## Features

+ **SimpleStorage** - Basic operations
    * Individual operations: set/get/remove
    * Batch operations: keys/clear
+ **RegisteredStorage** - Service registration
    * register/deregister/getPromise
    * registeredKeys()

Different Storage instances are isolated through different zones.

## Usage

### SimpleStorage
Basic Map-like operations

```ts
import JsStorage from '@equalto/js-storage'
const storage = new JsStorage('simple')

const key = 'k1', value = 'v1'
storage.set(key, value)
storage.get(key) == value   // true 

storage.set(key, value, {
  expireAfter: 100   // Cache expires after 100ms
})
storage.get(key) == value  // true
setTimeout(() => storage.get(key) == value, 200)  // false, cache expired after 200ms
```

### RegisteredStorage

Data consumers shouldn't care about data fetching methods and caching strategies. We should make data into services that are foolproof for callers.

Hence the concept of `Data Service Registration`.

#### Example - Register data service

`sys-data.ts`

```ts
import JsStorage from '@equalto/js-storage'
import fetch from "node-fetch"   // For non-web environments, use node-fetch@2 to simulate fetch

const storage = new JsStorage('sys-data')

storage.register(
  'countries', 
  () => fetch(`https://restcountries.com/v3.1/all?fields=name`)
      .then(resp => resp.json()),
  { expireAfter: 3600 * 1000 * 24 * 365 }
)

export default storage
```

Usage code `using-sys-data.ts`

```ts
import SysData from './sys-data'

SysData.get2('countries')  // Returns a Promise
```

#### Example - Create a specific data service

Or create a cleaner data service:
`countries.ts`

```ts
import JsStorage from '@equalto/js-storage'
import fetch from "node-fetch"   // For non-web environments, use node-fetch@2 to simulate fetch

const storage = new JsStorage('sys-countries')

const getCountries = storage.register(
  'countries', 
  () => fetch(`https://restcountries.com/v3.1/all?fields=name`)
      .then(resp => resp.json()),
  { expireAfter: 3600 * 1000 * 24 * 365 }
)

export default getCountries
```

Service usage example: `using-countries.ts`

```ts
import getCountries from './countries'

getCountries()  // Returns a promise
```

## Installation

```bash
npm install @equalto/js-storage
```

## API Reference

### JsStorage Constructor
```ts
new JsStorage(zone?: string, engine?: Storage)
```

### SetOpts
```ts
interface SetOpts {
  expireAt?: number      // Expire at specific timestamp
  expireAfter?: number   // Expire after milliseconds
  expireFn?: () => SetOpts // Dynamic expiration function
}
```

### RegisterOpts
```ts
interface RegisterOpts extends SetOpts {
  initNow?: boolean      // Execute immediately after registration
}
```

## License

MIT
