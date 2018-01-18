import { Collection, apiClient, Request } from '../src'
import MockApi from './mocks/api'
import ErrorObject from '../src/ErrorObject'

const error = 'boom!'
const errorObject = new ErrorObject('fetch', error)

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
      apiClient().resolver = resolve => resolve(attr)
    }
  }

  function reject () {
    apiClient().resolver = (_resolve, reject) => reject(error)
  }

  beforeEach(() => {
    item = { id: 1, name: 'miles' }
    collection = new MyCollection([item])
    collection.error = errorObject
  })

  describe('length getter', () => {
    it('alias for models.length', () => {
      expect(collection.length).toBe(1)
      collection.remove([1])
      expect(collection.length).toBe(0)
    })
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
      expect(collection.filter({ name: 'miles' })[0].get('name')).toBe(
        item.name
      )
      expect(collection.filter({ name: 'bob' }).length).toBe(0)
    })
  })

  describe('find', () => {
    it('filters a collection with the given conditions', () => {
      expect(collection.find({ name: 'miles' }).get('name')).toBe(item.name)
      expect(collection.find({ name: 'bob' })).toBeUndefined()
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

  describe('reset', () => {
    it('reset a collection of models', () => {
      const newItem = { id: 2, name: 'bob' }
      collection.reset([newItem])

      expect(collection.models.length).toBe(1)
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
        expect(collection.isRequest('creating')).toBe(true)
      })

      describe('when it fails', () => {
        beforeEach(reject)

        it('passes the error', () => {
          expect.assertions(1)

          return collection.create(newItem).catch(response => {
            expect(response).toBe(error)
          })
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

        it('removes the request', async () => {
          await collection.create(newItem)
          expect(collection.models.length).toBe(2)
          expect(collection.at(1).isRequest('creating')).toBe(false)
        })
      })
    })

    describe('if its pessimistic', () => {
      describe('when it fails', () => {
        beforeEach(reject)

        it('passes the error', () => {
          expect.assertions(1)

          return collection.create(newItem, { optimistic: false }).catch(response => {
            expect(response).toBe(error)
          })
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
      expect(collection.isRequest('fetching')).toBe(true)
    })

    describe('when it fails', () => {
      beforeEach(reject)

      it('passes the error', () => {
        expect.assertions(1)

        return collection.fetch().catch(response => {
          expect(response).toBe(error)
        })
      })
    })

    describe('when it succeeds', () => {
      beforeEach(() => {
        collection.error = errorObject
        resolve([item, { id: 2, name: 'bob' }])()
      })

      it('sets the data', async () => {
        await collection.fetch()
        expect(collection.models.length).toBe(2)
        expect(collection.at(1).get('name')).toBe('bob')
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
        expect(collection.isRequest('updating')).toBe(true)
      })

      describe('when it fails', () => {
        beforeEach(reject)

        it('passes the error', () => {
          return collection.rpc('foo').catch(response => {
            expect(response).toBe(error)
          })
        })
      })

      describe('when it succeeds', () => {
        const mockResponse = [item, { id: 2, name: 'bob' }]

        beforeEach(() => {
          collection.error = errorObject
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
