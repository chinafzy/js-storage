import JsStorage from './js-storage'
import { sleep } from './utils'

require('mock-local-storage')

test('simple test', async () => {
  const storage = new JsStorage('test1')
  storage.clear()

  const key = 'k1',
    value = 'value1'

  storage.set(key, value)
  expect(storage.get(key)).toBe(value)
  expect(storage.keys()).toEqual([key])

  storage.set(key, null)
  expect(storage.get(key)).toBe(null)
  expect(storage.keys()).toEqual([key])

  storage.remove(key)
  expect(storage.get(key)).toBe(undefined)
  expect(storage.keys()).toEqual([])

  storage.set(key, value, { expireAfter: 200 })
  // console.log(`happens`, storage.get(key))
  expect(storage.get(key)).toEqual(value)
  expect(storage.keys()).toEqual([key])
  await sleep(300)
  expect(storage.get(key)).toBe(undefined)
  expect(storage.keys()).toEqual([])
})
