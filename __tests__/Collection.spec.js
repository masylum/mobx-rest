import { Collection, apiClient, Request } from '../src'
import MockApi from './mocks/api'

const error = 'boom!'
apiClient(MockApi)

class MyCollection extends Collection {
  url () {
    return '/resources'
  }
}

describe('Collection', () => {
  let collection
  let item

  function resolve (attr) {
    return () => {
      apiClient().resolver = (resolve) => resolve(attr)
    }
  }

  function reject () {
    apiClient().resolver = (_resolve, reject) => reject(error)
  }

  beforeEach(() => {
    item = { id: 1, name: 'miles' }
    collection = new MyCollection([item])
  })

  describe('at', () => {
    it('finds a model at a given position', () => {
      expect(collection.at(0).get('name')).toBe(item.name)
    })
  })

  describe('get', () => {
    it('finds a model with the given id', () => {
      expect(collection.at(0).get('name')).toBe(item.name)
    })
  })

  describe('filter', () => {
    it('filters a collection with the given conditions', () => {
      expect(collection.filter({ name: 'miles' })[0].get('name')).toBe(item.name)
      expect(collection.filter({ name: 'bob' }).length).toBe(0)
    })
  })

  describe('find', () => {
    it('filters a collection with the given conditions', () => {
      expect(collection.find({ name: 'miles' }).get('name')).toBe(item.name)
      expect(collection.find({ name: 'bob' })).toBeUndefined()
    })
  })

  describe('isRequest', () => {
    it('returns false if there is no request', () => {
      expect(collection.isRequest('fetching')).toBe(false)
    })

    it('returns false if the label does not match', () => {
      collection.request = new Request('creating', null, 0)
      expect(collection.isRequest('fetching')).toBe(false)
    })

    it('returns true otherwie', () => {
      collection.request = new Request('fetching', null, 0)
      expect(collection.isRequest('fetching')).toBe(true)
    })
  })

  describe('isEmpty', () => {
    it('returns false if there is an element', () => {
      expect(collection.isEmpty()).toBe(false)
    })

    it('returns true otherwise', () => {
      collection.remove([1])
      expect(collection.isEmpty()).toBe(true)
    })
  })

  describe('add', () => {
    it('adds a collection of models', () => {
      const newItem = { id: 2, name: 'bob' }
      collection.add([newItem])

      expect(collection.models.length).toBe(2)
      expect(collection.get(2).get('name')).toBe(newItem.name)
    })
  })

  describe('remove', () => {
    it('removes a collection of models', () => {
      collection.remove([1])

      expect(collection.models.length).toBe(0)
    })
  })

  describe('create', () => {
    const newItem = { name: 'bob' }

    describe('if its optimistic (default)', () => {
      it('it adds the model straight away', () => {
        collection.create(newItem)
        expect(collection.models.length).toBe(2)
        expect(collection.at(1).get('name')).toBe('bob')
        expect(collection.at(1).request.label).toBe('creating')
      })

      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', async () => {
          try {
            await collection.create(newItem)
          } catch (_error) {
            expect(collection.error.label).toBe('creating')
            expect(collection.error.body).toBe(error)
          }
        })

        it('clears the error', async () => {
          reject()
          try {
            await collection.fetch()
          } catch (e) {}
          resolve([])()
          await collection.fetch()
          expect(collection.error).toBe(null)
        })

        it('removes the model', async () => {
          try {
            await collection.create(newItem)
          } catch (_error) {
            expect(collection.models.length).toBe(1)
          }
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          resolve({ id: 2, name: 'dylan' })()
        })

        it('updates the data from the server', async () => {
          await collection.create(newItem)
          expect(collection.models.length).toBe(2)
          expect(collection.at(1).get('name')).toBe('dylan')
        })

        it('nullifies the request', async () => {
          await collection.create(newItem)
          expect(collection.models.length).toBe(2)
          expect(collection.at(1).request).toBe(null)
        })
      })
    })

    describe('if its pessimistic', () => {
      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', async () => {
          try {
            await collection.create(newItem, { optimistic: false })
          } catch (_error) {
            expect(collection.error.label).toBe('creating')
            expect(collection.error.body).toBe(error)
          }
        })
        it('clears the error', async () => {
          reject()
          try {
            await collection.fetch()
          } catch (e) {}
          resolve([])()
          await collection.fetch()
          expect(collection.error).toBe(null)
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          resolve({ id: 2, name: 'dylan' })()
        })

        it('adds data from the server', async () => {
          try {
            await collection.create(newItem, { optimistic: false })
          } catch (_error) {
            expect(collection.models.length).toBe(2)
            expect(collection.at(1).get('name')).toBe('dylan')
          }
        })
      })
    })
  })

  describe('fetch', () => {
    it('sets the request', () => {
      collection.fetch()
      expect(collection.request.label).toBe('fetching')
    })

    describe('when it fails', () => {
      beforeEach(reject)

      it('sets the error', async () => {
        try {
          await collection.fetch()
        } catch (_error) {
          expect(collection.error.label).toBe('fetching')
          expect(collection.error.body).toBe(error)
        }
      })
    })

    describe('when it succeeds', () => {
      beforeEach(() => {
        resolve([item, { id: 2, name: 'bob' }])()
      })

      it('sets the data', async () => {
        await collection.fetch()
        expect(collection.models.length).toBe(2)
        expect(collection.at(1).get('name')).toBe('bob')
      })

      it('clears the error', async () => {
        try {
          await collection.fetch()
        } catch (e) {}
        resolve([item, { id: 2, name: 'bob' }])()
        await collection.fetch()
        expect(collection.error).toBe(null)
      })
    })
  })

  describe('set', () => {
    describe('by default', () => {
      it('adds missing models', () => {
        const newItem = { id: 2, name: 'bob' }
        collection.set([item, newItem])

        expect(collection.models.length).toBe(2)
        expect(collection.get(2).get('name')).toBe(newItem.name)
      })

      it('updates existing models', () => {
        const updatedItem = { id: 1, name: 'coltrane' }
        const newItem = { id: 2, name: 'bob' }
        collection.set([updatedItem, newItem])

        expect(collection.models.length).toBe(2)
        expect(collection.get(1).get('name')).toBe(updatedItem.name)
        expect(collection.get(2).get('name')).toBe(newItem.name)
      })

      it('removes non-existing models', () => {
        const newItem = { id: 2, name: 'bob' }
        collection.set([newItem])

        expect(collection.models.length).toBe(1)
        expect(collection.get(2).get('name')).toBe(newItem.name)
      })
    })

    describe('if `add` setting is off', () => {
      it('does not add missing models', () => {
        const newItem = { id: 2, name: 'bob' }
        collection.set([item, newItem], { add: false })

        expect(collection.models.length).toBe(1)
      })
    })

    describe('if `change` setting is off', () => {
      it('does not update existing models', () => {
        const updatedItem = { id: 1, name: 'coltrane' }
        const newItem = { id: 2, name: 'bob' }
        collection.set([updatedItem, newItem], { change: false })

        expect(collection.models.length).toBe(2)
        expect(collection.get(1).get('name')).toBe(item.name)
        expect(collection.get(2).get('name')).toBe(newItem.name)
      })
    })

    describe('if `remove` setting is off', () => {
      it('does not remove any models', () => {
        const newItem = { id: 2, name: 'bob' }
        collection.set([newItem], { remove: false })

        expect(collection.models.length).toBe(2)
        expect(collection.get(2).get('name')).toBe(newItem.name)
      })
    })

    describe('rpc', () => {
      it('sets the request', () => {
        collection.rpc('foo')
        expect(collection.request.label).toBe('updating')
      })

      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', async () => {
          try {
            await collection.rpc('foo')
          } catch (_error) {
            expect(collection.error.label).toBe('updating')
            expect(collection.error.body).toBe(error)
          }
        })

        it('clears the error', async () => {
          try {
            await collection.fetch()
          } catch (e) {}
          resolve([])()
          await collection.fetch()
          expect(collection.error).toBe(null)
        })
      })

      describe('when it succeeds', () => {
        const mockResponse = [item, { id: 2, name: 'bob' }]

        beforeEach(() => {
          resolve(mockResponse)()
        })

        it('return the data', async () => {
          const data = await collection.rpc('foo')
          expect(data).toBe(mockResponse)
        })
      })
    })
  })
})
