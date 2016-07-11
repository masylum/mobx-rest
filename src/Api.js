// TODO: Move away from jQuery when a better alternative is available
import jq from 'jquery'

type Request = {
  abort: () => void;
  promise: Promise;
}

function ajax (url: string): Request {
  const xhr = jq.ajax(url)

  const promise = new Promise((resolve, reject) => {
    xhr
      .then(resolve)
      .fail((jqXHR, textStatus) => reject(textStatus))
  })

  const abort = () => xhr.abort()

  return {abort, promise}
}

class API {
  basePath: string

  /**
   * Constructor
   */
  constructor (basePath: string) {
    this.basePath = basePath
  }

  fetch (path: string = ''): Request {
    return ajax(`${this.basePath}${path}`)
  }
}

export default API
