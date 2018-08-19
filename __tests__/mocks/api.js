let resolvePromise
let rejectPromise

export default {
  resolvePromise (...args) {
    resolvePromise(...args)
  },

  rejectPromise (error, requestResponse = {}) {
    rejectPromise({
      error,
      requestResponse
    })
  },

  _mock () {
    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })

    return {
      abort: () => {},
      promise
    }
  },

  get () {
    return this._mock()
  },

  post () {
    return this._mock()
  },

  put () {
    return this._mock()
  },

  patch () {
    return this._mock()
  },

  del () {
    return this._mock()
  }
}
