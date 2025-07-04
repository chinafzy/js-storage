import fetch from 'node-fetch'

import JsStorage from './index'

require('mock-local-storage')

jest.setTimeout(10000)

interface Country {
  name: {
    common: string
  }
  flags: Record<string, string>
}

test('registered', async () => {
  const storage = new JsStorage('registered')
  storage.clear()

  const key = 'k1',
    value = 1
  const loaderStack = []
  storage.register(key, () => new Promise((resolve) =>
    setTimeout(() => {
      loaderStack.push(new Date().getTime())
      resolve(value)
    }, 100),
  ), { expireAfter: 200 })

  {
    // 第一次运行
    const v = await storage.get2(key)
    expect(v).toBe(value)
    expect(loaderStack.length).toBe(1)
  }

  {
    // 第二次运行，先暂停一会儿
    await sleep(100)
    const v = await storage.get2(key)
    expect(v).toBe(value)
    expect(loaderStack.length).toBe(1) // 缓存没有失效
  }

  {
    // 第三次运行，多等会儿，等缓存失效，
    await sleep(120)
    const v = await storage.get2(key)
    expect(v).toBe(value)
    expect(loaderStack.length).toBe(2) // 缓存失效，加载函数多执行了一次
  }
})

test('country', async () => {
  const storage = new JsStorage('system')
  storage.clear()

  storage.register(
    'country',
    () => fetch(`https://restcountries.com/v3.1/all?fields=name,flags`).then((resp) => resp.json()),
    { expireAfter: 3600 * 1000 },
  )

  const china = (await storage.get2<Country[]>('country'))
    .find((country) => country.name.common == 'China')

  expect(china).not.toBeNull()
  console.log(`china`, china)
})


function sleep(ms: number) {
  return ms > 0 ? new Promise(resolve => setTimeout(resolve, ms)) : Promise.resolve(1)
}
