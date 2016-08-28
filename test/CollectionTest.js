/*global describe, it, context, beforeEach*/
import assert from 'assert'
import Collection from '../src/Collection'
import MockApi from './mocks/api'

const error = 'boom!'

describe('Collection', () => {
  let collection
  let item
  let api

  function resolve (attr) {
    return () => {
      api.resolver = (resolve) => resolve(attr)
    }
  }

  function reject () {
    api.resolver = (_resolve, reject) => reject(error)
  }

  beforeEach(() => {
    item = {id: 1, name: 'miles'}
    collection = new Collection([item], MockApi)
    api = collection.api
  })

  describe('at', () => {
    it('finds a model at a given position', () => {
      collection.at(0)
      assert.equal(collection.at(0).get('name'), item.name)
    })
  })

  describe('get', () => {
    it('finds a model with the given id', () => {
      collection.get(1)
      assert.equal(collection.at(0).get('name'), item.name)
    })
  })

  describe('add', () => {
    it('adds a collection of models', () => {
      const newItem = {id: 2, name: 'bob'}
      collection.add([newItem])

      assert.equal(collection.models.length, 2)
      assert.equal(collection.get(2).get('name'), newItem.name)
    })
  })

  describe('remove', () => {
    it('removes a collection of models', () => {
      collection.remove([1])

      assert.equal(collection.models.length, 0)
    })
  })

  describe('create', () => {
    const newItem = {name: 'bob'}

    context('if its optimistic (default)', () => {
      it('it adds the model straight away', () => {
        collection.create(newItem)
        assert.equal(collection.models.length, 2)
        assert.equal(collection.at(1).get('name'), 'bob')
        assert.equal(collection.at(1).request.label, 'creating')
      })

      context('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return collection.create(newItem).catch(() => {
            assert.equal(collection.error.label, 'creating')
            assert.equal(collection.error.body, error)
          })
        })

        it('removes the model', () => {
          return collection.create(newItem).catch(() => {
            assert.equal(collection.models.length, 1)
          })
        })
      })

      context('when it succeeds', () => {
        beforeEach(() => {
          resolve({id: 2, name: 'dylan'})()
        })

        it('updates the data from the server', () => {
          return collection.create(newItem).then(() => {
            assert.equal(collection.models.length, 2)
            assert.equal(collection.at(1).get('name'), 'dylan')
          })
        })

        it('nullifies the request', () => {
          return collection.create(newItem).then(() => {
            assert.equal(collection.models.length, 2)
            assert.equal(collection.at(1).request, null)
          })
        })
      })
    })

    context('if its pessimistic (default)', () => {
      context('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return collection.create(newItem, {optimistic: false}).catch(() => {
            assert.equal(collection.error.label, 'creating')
            assert.equal(collection.error.body, error)
          })
        })
      })

      context('when it succeeds', () => {
        beforeEach(() => {
          resolve({id: 2, name: 'dylan'})()
        })

        it('adds data from the server', () => {
          return collection.create(newItem, {optimistic: false}).catch(() => {
            assert.equal(collection.models.length, 2)
            assert.equal(collection.at(1).get('name'), 'dylan')
          })
        })
      })
    })
  })

  describe('fetch', () => {
    it('sets the request', () => {
      collection.fetch()
      assert.equal(collection.request.label, 'fetching')
    })

    context('when it fails', () => {
      beforeEach(reject)

      it('sets the error', () => {
        return collection.fetch().catch(() => {
          assert.equal(collection.error.label, 'fetching')
          assert.equal(collection.error.body, error)
        })
      })
    })

    context('when it succeeds', () => {
      beforeEach(() => {
        resolve([item, {id: 2, name: 'bob'}])()
      })

      it('sets the data', () => {
        return collection.fetch().then(() => {
          assert.equal(collection.models.length, 2)
          assert.equal(collection.at(1).get('name'), 'bob')
        })
      })
    })
  })

  describe('set', () => {
    context('by default', () => {
      it('adds missing models', () => {
        const newItem = {id: 2, name: 'bob'}
        collection.set([item, newItem])

        assert.equal(collection.models.length, 2)
        assert.equal(collection.get(2).get('name'), newItem.name)
      })

      it('updates existing models', () => {
        const updatedItem = {id: 1, name: 'coltrane'}
        const newItem = {id: 2, name: 'bob'}
        collection.set([updatedItem, newItem])

        assert.equal(collection.models.length, 2)
        assert.equal(collection.get(1).get('name'), updatedItem.name)
        assert.equal(collection.get(2).get('name'), newItem.name)
      })

      it('removes non-existing models', () => {
        const newItem = {id: 2, name: 'bob'}
        collection.set([newItem])

        assert.equal(collection.models.length, 1)
        assert.equal(collection.get(2).get('name'), newItem.name)
      })
    })

    context('if `add` setting is off', () => {
      it('does not add missing models', () => {
        const newItem = {id: 2, name: 'bob'}
        collection.set([item, newItem], {add: false})

        assert.equal(collection.models.length, 1)
      })
    })

    context('if `change` setting is off', () => {
      it('does not update existing models', () => {
        const updatedItem = {id: 1, name: 'coltrane'}
        const newItem = {id: 2, name: 'bob'}
        collection.set([updatedItem, newItem], {change: false})

        assert.equal(collection.models.length, 2)
        assert.equal(collection.get(1).get('name'), item.name)
        assert.equal(collection.get(2).get('name'), newItem.name)
      })
    })

    context('if `remove` setting is off', () => {
      it('does not remove any models', () => {
        const newItem = {id: 2, name: 'bob'}
        collection.set([newItem], {remove: false})

        assert.equal(collection.models.length, 2)
        assert.equal(collection.get(2).get('name'), newItem.name)
      })
    })
  })
})
