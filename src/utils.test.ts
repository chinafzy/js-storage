import { singleShotFn, sleep } from './utils'

test('single-shot', async () => {
  let c = 0

  function fn() {
    return new Promise((resolve) => {
      setTimeout(() => {
        c++
        resolve(Object())
      }, 500)
    })
  }

  const singleFn = singleShotFn(fn)

  c = 0
  let ps = []
  for (let i = 0; i < 100; i++) ps.push(singleFn())
  await sleep(100)
  for (let i = 0; i < 100; i++) ps.push(singleFn())

  let rs = await Promise.all(ps)
  let r1 = rs[0]
  expect(c).toBe(1)
  for (let r of rs) {
    expect(r === r1).toBe(true)
  }

  c = 0
  let r2 = await singleFn()
  expect(c).toBe(1)
  expect(r1 === r2).toBe(false)

  let r3 = await singleFn()
  expect(c).toBe(2)
  expect(r3 === r2).toBe(false)
})

test("sleep", async () => {

  function now() {
    return new Date().getTime()
  }

  const ms = 100
  const stamp1 = now()
  await sleep(100)
  const stamp2 = now()
  const used = stamp2 - stamp1
  expect(used).toBeGreaterThanOrEqual(ms)
  expect(used).toBeLessThan(ms + 3)
})
