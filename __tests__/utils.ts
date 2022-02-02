export function strMapToObj(strMap: any) {
  let obj = Object.create(null)

  strMap.forEach((val: any, key: any) => (obj[key] = val))

  return obj
}
