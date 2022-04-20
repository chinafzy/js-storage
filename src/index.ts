
type SetOpts = {
    expireAt?: number;
    expireAfter?: number;
}

type RegisterOpts = SetOpts & {
    initNow?: boolean;
}


const expireTag = '__expire__'

/**
 * A jsStorage, 
 */
class JsStorage {
    #prefix: string
    #engine: Storage
    #registered: Map<string, Function>
    zone: string

    constructor(zone: string, engine = localStorage) {
        this.zone = zone
        this.#prefix = `___storage_of___${zone}__`
        this.#engine = engine
        this.#registered = new Map()
    }

    /**
     * 
     * 
     * @param key 
     * @returns undefined on missing, any value(include null) on succeed.
     */
    get(key: string): any {

        let expireKey = this.#expireKey(key), realKey = this.#storeKey(key)
        let strExpire = this.#engine.getItem(expireKey), str = this.#engine.getItem(realKey)

        if (!str) return

        if (strExpire && new Date().getTime() > str2stamp(strExpire).getTime()) {
            this.remove(key)
            return
        }

        return JSON.parse(str)
    }

    /**
     * 
     * @param key 
     * @param value any value, includes null
     * @param opts 
     */
    set(key: string, value: any, opts: SetOpts = {}): void {
        let expireAt = opts.expireAt || calExpire(opts.expireAfter) || null
        if (expireAt) this.#engine.setItem(this.#expireKey(key), stamp2str(new Date(expireAt)))
        this.#engine.setItem(this.#storeKey(key), JSON.stringify(value))
    }

    remove(key: string): void {
        this.#engine.removeItem(this.#expireKey(key))
        this.#engine.removeItem(this.#storeKey(key))
    }

    keys(): string[] {
        let keys = [], dels = []
        for (let i = 0; i < this.#engine.length; i++) {
            let key = this.#engine.key(i)
            if (!key) continue

            if (!key.startsWith(this.#prefix) || key.endsWith(expireTag)) continue

            key = key.substring(this.#prefix.length)

            let strExpire = this.#engine.getItem(this.#expireKey(key))
            if (strExpire && new Date().getTime() > str2stamp(strExpire).getTime()) {
                dels.push(key)
            } else {
                keys.push(key)
            }
        }

        dels.forEach(this.remove.bind(this))

        return keys
    }

    register(key: string, fnLoader: Function, opts: RegisterOpts = {}): void {
        let safeFn = singleShotFn(fnLoader, 10)

        let handler = this.#registered[key] = async () => {
            let v = this.get(key)
            if (typeof v != 'undefined') return v

            v = await safeFn()

            this.set(key, v, opts)

            return v
        }

        if (opts.initNow) handler()
    }

    getRegistered(key: string) {
        return this.#registered[key]();
    }

    get2(key: string) {
        return this.getRegistered(key)
    }

    #storeKey(key: string): string {
        return this.#prefix + key
    }

    #expireKey(key: string): string {
        return this.#prefix + key + expireTag
    }

}

export default JsStorage


function calExpire(expireAfter: number | undefined) {
    return expireAfter ? new Date().getTime() + expireAfter : null
}


function str2stamp(str: string) {
    let dt = str.split(' ')
    let darr = dt[0].split('-'), tarr = dt[1].split(':')
    return new Date(parseInt(darr[0]), parseInt(darr[1]) - 1, parseInt(darr[2]), parseInt(tarr[0]), parseInt(tarr[1]), parseInt(tarr[2]))
}

function stamp2str(stamp: Date) {
    return [
        [lpad(stamp.getFullYear(), 4), lpad(stamp.getMonth() + 1, 2), lpad(stamp.getDate(), 2)].join('-'),
        [lpad(stamp.getHours(), 2), lpad(stamp.getMinutes(), 2), lpad(stamp.getSeconds(), 2)].join(':')
    ].join(' ')
}

function lpad(v: any, size: number) {
    return ('0000000' + v).slice(-size)
}


function singleShotFn(fn: Function, checkInterval = 10): Function {
    let running = false;

    return async () => {
        while (running) {
            await sleep(checkInterval)
        }

        running = true
        try {
            let ret = fn()
            if (ret instanceof Promise) await ret

            return ret
        } finally {
            running = false
        }
    }
}

function sleep(ms: number = 10) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

