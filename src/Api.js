// TODO: Move away from jQuery when a better alternative is available
import jq from 'jquery'

type Request = {
  abort: () => void;
  promise: Promise;
}

function ajax (url: string, options: {}): Request {
  const xhr = jq.ajax(url, options)

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

  post (path: string = '', data): Request {
    return ajax(`${this.basePath}${path}`, {method: 'POST', data})
  }

  put (path: string = '', data): Request {
    return ajax(`${this.basePath}${path}`, {method: 'PUT', data})
  }

  del (path: string = ''): Request {
    return ajax(`${this.basePath}${path}`, {method: 'DELETE'})
  }
}

export default API
