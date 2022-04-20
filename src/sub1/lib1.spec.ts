import * as Lib1 from './lib1'

test('sub1', () => {
  expect(Lib1.num1).toBe(1)

  expect(Lib1.str1).toBe('abc')
})
