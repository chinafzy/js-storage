import { Supplier } from './common-types'

export type SetOpts = {
  /**
   * 到固定时间点后过期
   */
  expireAt?: number

  /**
   * n毫秒后过期
   */
  expireAfter?: number

  /**
   * 过期计算函数，返回一个过期方式
   */
  expireFn?: Supplier<SetOpts>
}

// eslint-disable-next-line @typescript-eslint/no-namespace,@typescript-eslint/no-redeclare
export namespace SetOpts {
  export function retrieveExpireAt(opts: SetOpts): number {
    if (!opts) return undefined

    while (typeof opts.expireFn != 'undefined') opts = opts.expireFn()

    if (typeof opts.expireAt != 'undefined') return opts.expireAt

    if (typeof opts.expireAfter != 'undefined') return new Date().getTime() + opts.expireAfter

    return null
  }
}

// export function retrieveExpireAt(opts: SetOpts): number {
//   if (!opts) return undefined
//
//   while (typeof opts.expireFn != 'undefined') opts = opts.expireFn()
//
//   if (typeof opts.expireAt != 'undefined') return opts.expireAt
//
//   if (typeof opts.expireAfter != 'undefined') return new Date().getTime() + opts.expireAfter
//
//   return null
// }

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
  set(key: string, value: unknown, opts: SetOpts): void

  /**
   * 获取一个值
   *
   * @param key
   * @returns 如果没有获得，返回undefined；返回其它值表示成功获取(包括null)
   */
  get<T>(key: string): T

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
