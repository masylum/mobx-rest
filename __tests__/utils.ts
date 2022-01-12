export function strMapToObj(strMap) {
  let obj = Object.create(null)

  strMap.forEach((val, key) => (obj[key] = val))

  return obj
}
