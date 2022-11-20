/**
 *
 */
export type Transformer<S, T> = (source: S) => T

/**
 * 数据提供者
 */
export type Supplier<T> = () => T

/**
 * 提供一个数据，或者一个Promise
 */
export type NowOrPromise<T> = Supplier<T> | Supplier<Promise<T>>
