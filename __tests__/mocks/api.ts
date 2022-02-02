import { Adapter } from "../../src/types"

let resolvePromise: any
let rejectPromise: any

interface MockAdapter extends Adapter {
  resolvePromise(...args: any[]): any;
  resolvePromise(error: any, requestResponse: any): any;
}

const mockAdapter: MockAdapter = {
  resolvePromise(...args): any {
    resolvePromise(...args)
  },

  rejectPromise(error, requestResponse = {}): any {
    rejectPromise({
      error,
      requestResponse,
    })
  },

  _mock(_path, _data, _options) {
    return new Promise((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })
  },

  get(path, data, options) {
    return this._mock(path, data, options)
  },

  post(path, data, options) {
    return this._mock(path, data, options)
  },

  put(path, data, options) {
    return this._mock(path, data, options)
  },

  patch(path, data, options) {
    return this._mock(path, data, options)
  },

  del(path, data, options) {
    return this._mock(path, data, options)
  },
}

export default mockAdapter
