import JsStorage from "./index"

// global.window = {}
require( 'mock-local-storage')
// import {} from 'mock-local-storage'

// console.log(`localStorage3`, global.localStorage)

// const JsStorage = require('../dist/index').default


test('simple test', async () => {
  const storage = new JsStorage('test1')

  // storage.
  
  let key = 'k1', value = 'value1'

  storage.set(key, value)

  expect(storage.get(key)).toBe(value)
  expect(storage.keys()).toEqual([key])

  storage.remove(key)
  expect(storage.keys()).toEqual([])

  storage.set(key, value, {expireAfter: 1000})
  // console.log(`happens`, storage.get(key))
  expect(storage.get(key)).toEqual(value)
  await sleep(1200)
  expect(storage.keys()).toEqual([])

})



function sleep(ms = 10) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

