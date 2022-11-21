import { NowOrPromiseSupplier, Supplier } from "./common-types";

export function sleep(ms = 0): Promise<void> {
  return ms < 1 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wrap a function, then it will run only once at a time.
 *  That is to say: multiple calls at a time will return one result.
 *
 * @param fn
 */
export function singleShotFn<T>(fn: NowOrPromiseSupplier<T>): Supplier<Promise<T>> {
  let p: Promise<T> = null

  function buildP() {
    return new Promise<T>(async (resolve, reject) => {
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

  return () => (p = p || buildP())
}
