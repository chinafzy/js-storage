/**
 *
 */
export type Transformer<S, T> = (source: S) => T

export type Predicate<T> = (source: T) => boolean

/**
 * 数据提供者
 */
export type Supplier<T> = () => T

export type PromiseSupplier<T> = Supplier<Promise<T>>

/**
 * 提供一个数据，或者一个Promise
 */
export type NowOrPromiseSupplier<T> = Supplier<T | Promise<T>>
