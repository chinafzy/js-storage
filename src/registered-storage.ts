import {NowOrPromise} from "./common-types";
import {SetOpts} from "./simple-storage";


export type RegisterOpts = SetOpts & {
  /**
   * 注册后是否立刻执行
   */
  initNow?: boolean
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
  register<T>(key: string, fnLoader: NowOrPromise<T>, opts: RegisterOpts): () => Promise<T>

  /**
   * 取消一条数据注册
   *
   * @param key
   */
  deregister(key: string): void

  /**
   * 通过一个已经注册的入口，来获取数据
   *
   * @param key
   * @returns
   */
  getPromise<T>(key: string): Promise<T>

  /**
   * getPromise 的简写方式
   *
   * @param key
   * @see getPromise
   */
  get2<T>(key: string): Promise<T>

  /**
   * 当前全部注册的数据入口的keys
   *
   */
  registeredKeys(): string[]
}
