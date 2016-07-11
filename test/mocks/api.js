class MockApi {
  constructor () {
    this.resolver = () => {}
  }

  _mock () {
    return {abort: () => {}, promise: new Promise(this.resolver)}
  }

  fetch () {
    return this._mock()
  }

  post () {
    return this._mock()
  }

  put () {
    return this._mock()
  }

  del () {
    return this._mock()
  }
}

export default MockApi
