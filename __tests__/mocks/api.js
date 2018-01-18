export default {
  resolver: resolve => {
    setTimeout(() => {
      resolve()
    })
  },

  _mock () {
    return {
      abort: () => {},
      promise: new Promise(this.resolver)
    }
  },

  get () {
    return this._mock()
  },

  post (_path, _attributes, options) {
    const ret = this._mock()

    // HACK
    ret.promise
      .then(() => {
        options.onProgress(100)
        options.onProgress.flush()
      })
      .catch(() => {})

    return ret
  },

  put () {
    return this._mock()
  },

  del () {
    return this._mock()
  }
}
