import Base from '../src/Base'
import ErrorObject from '../src/ErrorObject'
import apiClient from '../src/apiClient'
import MockApi from './mocks/api'

apiClient(MockApi)

describe(Base, () => {
  let model

  beforeEach(() => {
    model = new Base()
  })

  describe('url()', () => {
    it('throws an exception', () => {
      expect(() => model.url()).toThrow('You must implement this method')
    })
  })

  describe('withRequest(labels, promise, abort)', () => {
    it('returns a Request promise', () => {
      const request = model.withRequest('fetching', Promise.resolve())

      expect(request).toBeInstanceOf(Promise)
    })

    it('tracks the request while is pending', () => {
      const abort = () => {}
      const request = model.withRequest('fetching', new Promise(() => {}), abort)

      expect(model.requests.length).toBe(1)
      expect(model.requests[0]).toBe(request)
    })

    it('allows to assign multiple labels for the request', () => {
      model.withRequest(['saving', 'creating'], new Promise(() => {}))

      expect(model.requests[0].labels).toEqual(['saving', 'creating'])
    })

    describe('if the promise succeeds', () => {
      it('stops tracking the request', async () => {
        await model.withRequest('fetching', Promise.resolve())

        expect(model.requests.length).toBe(0)
      })

      it('returns the promise result', async () => {
        const data = { someData: 'test' }
        const promise = model.withRequest('fetching', Promise.resolve(data))

        await expect(promise).resolves.toBe(data)
      })
    })

    describe('if the promise fails', () => {
      it('stops tracking the request', async () => {
        try {
          await model.withRequest('fetching', Promise.reject())
        } catch (_error) {
          expect(model.requests.length).toBe(0)
        }
      })

      it('throws a ErrorObject', async () => {
        const promise = model.withRequest('fetching', Promise.reject({
          error: 'Not found',
          requestResponse: {
            status: 404
          }
        }))

        try {
          await promise
        } catch (requestError) {
          expect(requestError).toBeInstanceOf(ErrorObject)
          expect(requestError.error).toBe('Not found')
        }
      })
    })
  })

  describe('getRequest(label)', () => {
    it('returns the first request of the specified label', () => {
      const request = model.withRequest('fetching', new Promise(() => {}))

      expect(model.getRequest('fetching')).toBe(request)
    })
  })

  describe('getAllRequests(label)', () => {
    it('returns all request of the specified label', () => {
      const request1 = model.withRequest('fetching', new Promise(() => {}))
      const request2 = model.withRequest('fetching', new Promise(() => {}))

      expect(model.getAllRequests('fetching')).toEqual([
        request1,
        request2
      ])
    })
  })

  describe('isRequest(label)', () => {
    beforeEach(() => {
      model.withRequest('fetching', new Promise(() => {}))
      model.withRequest(['saving', 'creating'], new Promise(() => {}))
    })

    it('returns true if any of the ongoing requests has the specified label', () => {
      expect(model.isRequest('creating')).toBe(true)
    })

    it('returns false if none of the ongoing requests has the specified label', () => {
      expect(model.isRequest('updating')).toBe(false)
    })
  })

  describe('rpc(label, endpoint, options)', () => {
    let request
    let spy

    beforeEach(() => {
      model.url = () => '/api'
      spy = jest.spyOn(apiClient(), 'post')
      request = model.rpc('searching', 'search', {
        method: 'GET'
      })
    })

    it('returns a Request promise', () => {
      expect(request).toBeInstanceOf(Promise)
    })

    it('sends a request using the endpoint suffix', () => {
      expect(spy.mock.calls[0][0]).toBe('/api/search')
    })

    it('passes the options to the api adapter', () => {
      expect(spy.mock.calls[0][1]).toEqual({
        method: 'GET'
      })
    })

    it('tracks the request with the specified labels', () => {
      expect(model.isRequest('searching')).toBe(true)
    })
  })
})
