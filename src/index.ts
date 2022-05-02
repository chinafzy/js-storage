
export type SetOpts = {

    /**
     * 到固定时间点后过期 
     */
    expireAt?: number;

    /**
     * n毫秒后过期 
     */
    expireAfter?: number;
}

export type RegisterOpts = SetOpts & {

    /**
     * 注册后是否立刻执行 
     */
    initNow?: boolean;
}

/**
 * 一个简单工作模式的Storage。支持单条操作set/get/remove，以及批量操作keys/clear。
 */
export interface SimpleStorage {

    /**
     * 设置一个值
     * 
     * @param key 
     * @param value 
     * @param opts 
     */
    set(key: string, value: any, opts: SetOpts): void

    /**
     * 获取一个值 
     * 
     * @param key 
     * @returns 如果没有获得，返回undefined；返回其它值表示成功获取(包括null)
     */
    get(key: string): any

    /**
     * 删除一个值 
     * 
     * @param key 
     */
    remove(key: string): void

    /**
     * 获取当前存储下的全部keys
     * 
     * @returns 全部的keys
     */
    keys(): string[]

    /**
     * 清空当前存储下的全部值 
     */
    clear(): void
}

/**
 * 预注册方式的Storage。
 *  
 * 应用场景：例如我们一个系统里面需要有国家地区/省市的选择项，还有组织单元。我们注册多个Storage，由相应的模块来负责提供，其它的使用者直接调用即可。
 * 而且，数据的缓存周期也是由业务模块来控制的（国家地区的缓存周期很长，公司的组织单元可能会比较短）。
 * 
 * 严格来说：数据的获取方式和缓存周期，应该是由业务模块来控制的。调用者发起数据查询和缓存时长控制，是非常大的谬误。
 */
export interface RegisteredStorage {

    /**
     * 注册一条数据入口，包括数据获取方式，以及缓存策略。
     * 
     * @param key 
     * @param fnLoader 值加载函数，
     * @param opts 
     */
    register(key: string, fnLoader: (() => any) | (() => Promise<any>), opts: RegisterOpts): void

    /**
     * 取消一条数据注册 
     * 
     * @param key 
     */
    degister(key: string): void

    /**
     * 通过一个已经注册的入口，来获取数据
     * 
     * @param key 
     * @returns 
     */
    getByRegistered(key: string): Promise<any>


    /**
     * getByRegistered 的简写方式
     * 
     * @param key 
     * @see getByRegistered
     */
    get2(key: string): Promise<any>


    /**
     * 当前全部注册的数据入口的keys
     * 
     */
    registeredKeys(): string[]

}

export interface AutoClearStorage {

    

}


const expireTag = '__expire__'

/**
 * A jsStorage, 
 */
class JsStorage implements SimpleStorage, RegisteredStorage {
    #prefix: string
    #engine: Storage
    #registered: object
    zone: string

    /**
     * 
     * @param zone Separate zone for saving data.
     * @param engine localStorage(default) or sessionStorage
     */
    constructor(zone: string = 'default', engine = localStorage) {
        this.zone = zone
        this.#prefix = `___storage_of___${zone}__`
        this.#engine = engine
        this.#registered = {}
    }

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


    clear() {
        this.keys().forEach(this.remove.bind(this))
    }

    register(key: string, fnLoader: Function, opts: RegisterOpts = {}): void {
        let safeFn = singleShotFn(fnLoader)

        let handler = this.#registered[key] = async () => {
            let v = this.get(key)
            if (typeof v != 'undefined') return v

            v = await safeFn()

            this.set(key, v, opts)

            return v
        }

        if (opts.initNow) handler()
    }

    degister(key: string) {
        delete this.#registered[key]
    }

    getByRegistered(key: string): Promise<any> {
        return this.#registered[key]();
    }

    get2(key: string) {
        return this.getByRegistered(key)
    }

    registeredKeys() {
        return [...Object.keys(this.#registered)]
    }

    #storeKey(key: string): string {
        return this.#prefix + key
    }

    #expireKey(key: string): string {
        return this.#prefix + key + expireTag
    }

}

export default JsStorage

//
//  Utils 
//


function calExpire(expireAfter: number | undefined) {
    return expireAfter ? new Date().getTime() + expireAfter : null
}


function str2stamp(str: string) {
    let dt = str.split(' ')
    let darr = dt[0].split('-'), tarr = dt[1].split(':')
    return new Date(parseInt(darr[0]), parseInt(darr[1]) - 1, parseInt(darr[2]), parseInt(tarr[0]), parseInt(tarr[1]), parseInt(tarr[2]), parseInt(tarr[3]))
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


function singleShotFn(fn: Function) {
    let p = null

    return () => {
        if (p == null) {
            p = new Promise(async (resolve, reject) => {
                try {
                    let ret = fn()
                    if (ret instanceof Promise) ret = await ret

                    resolve(ret)
                } catch (e) {
                    reject(e)
                } finally {
                    p = null
                }
            })
        }

        return p
    }


    // let running = false;

    // return async () => {
    //     while (running) {
    //         await sleep(checkInterval)
    //     }

    //     running = true
    //     try {
    //         let ret = fn()
    //         if (ret instanceof Promise) await ret

    //         return ret
    //     } finally {
    //         running = false
    //     }
    // }
}

// function sleep(ms: number = 10) {
//     return new Promise(resolve => setTimeout(resolve, ms))
// }

