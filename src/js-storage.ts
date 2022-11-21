import {NowOrPromiseSupplier} from './common-types'
import {RegisteredStorage, RegisterOpts} from './registered-storage'
import {retrieveExpireAt, SetOpts, SimpleStorage} from './simple-storage'
import {singleShotFn} from "./utils";

const expireTag = '__expire__'

/**
 * A jsStorage,
 */
class JsStorage implements SimpleStorage, RegisteredStorage {
  readonly zone: string
  readonly _prefix: string
  readonly _engine: Storage
  readonly _registered: object

  /**
   *
   * @param zone Separate zone for saving data.
   * @param engine localStorage(default) or sessionStorage
   */
  constructor(zone = 'default', engine = localStorage) {
    this.zone = zone
    this._prefix = `___storage_of___${zone}__`
    this._engine = engine
    this._registered = {}
  }

  get<T>(key: string): T {
    const expireKey = this._expireKey(key), realKey = this._storeKey(key);
    const strExpire = this._engine.getItem(expireKey), str = this._engine.getItem(realKey);

    if (!str) return undefined

    if (strExpire && new Date().getTime() > str2stamp(strExpire).getTime()) {
      this.remove(key)

      return undefined
    }

    return JSON.parse(str)
  }

  set(key: string, value: any, opts: SetOpts = {}): void {
    const expireAt = retrieveExpireAt(opts)
    if (expireAt) this._engine.setItem(this._expireKey(key), stamp2str(new Date(expireAt)))
    this._engine.setItem(this._storeKey(key), JSON.stringify(value))
  }

  remove(key: string): void {
    this._engine.removeItem(this._expireKey(key))
    this._engine.removeItem(this._storeKey(key))
  }

  keys(): string[] {
    const keys = [], dels = []
    for (let i = 0; i < this._engine.length; i++) {
      let key = this._engine.key(i)
      if (!key) continue

      if (!key.startsWith(this._prefix) || key.endsWith(expireTag)) continue

      key = key.substring(this._prefix.length)

      let strExpire = this._engine.getItem(this._expireKey(key))
      if (strExpire && new Date().getTime() > str2stamp(strExpire).getTime()) {
        dels.push(key)
      } else {
        keys.push(key)
      }
    }

    dels.forEach(this.remove.bind(this))

    return keys
  }

  clear() {
    this.keys().forEach(this.remove.bind(this))
  }

  register<T>(key: string, fnLoader: NowOrPromiseSupplier<T>, opts: RegisterOpts): () => Promise<T> {
    const safeFn = singleShotFn(fnLoader)

    const handler = this._registered[key] = async () => {
      let v = this.get(key)
      if (typeof v != 'undefined') return v

      v = await safeFn()

      this.set(key, v, opts)

      return v
    }

    if (opts.initNow) handler()

    return () => this.get2(key)
  }

  deregister(key: string) {
    delete this._registered[key]
  }

  getPromise<T>(key: string): Promise<T> {
    return this._registered[key]()
  }

  get2<T>(key: string): Promise<T> {
    return this.getPromise(key)
  }

  registeredKeys() {
    return [...Object.keys(this._registered)]
  }

  private _storeKey(key: string): string {
    return this._prefix + key
  }

  private _expireKey(key: string): string {
    return this._prefix + key + expireTag
  }

}

export default JsStorage

////////////////////////////////////////////////////////////////////////
//  Utils
//

function str2stamp(str: string) {
  let dt = str.split(' ')
  let darr = dt[0].split('-'), tarr = dt[1].split(':')

  return new Date(
    parseInt(darr[0]),
    parseInt(darr[1]) - 1,
    parseInt(darr[2]),
    parseInt(tarr[0]),
    parseInt(tarr[1]),
    parseInt(tarr[2]),
    parseInt(tarr[3])
  )
}

function stamp2str(stamp: Date) {
  return [
    [lpad(stamp.getFullYear(), 4), lpad(stamp.getMonth() + 1, 2), lpad(stamp.getDate(), 2)].join('-'),
    [lpad(stamp.getHours(), 2), lpad(stamp.getMinutes(), 2), lpad(stamp.getSeconds(), 2), lpad(stamp.getMilliseconds(), 3)].join(':')
  ].join(' ')
}

function lpad(v: any, size: number) {
  return ('0000000' + v).slice(-size)
}
