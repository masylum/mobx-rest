/*global describe, it, context, beforeEach*/
import assert from 'assert'
import Collection from '../src/Collection'
import MockApi from './mocks/api'
import sinon from 'sinon'

const error = 'boom!'

describe('Model', () => {
  let collection
  let model
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
    item = {id: 1, name: 'miles', album: 'kind of blue'}
    collection = new Collection([item], MockApi)
    api = collection.api
    model = collection.at(0)
  })

  describe('get', () => {
    it('returns the attribute', () => {
      assert.equal(model.get('name'), item.name)
    })
  })

  describe('set', () => {
    const name = 'dylan'

    it('changes the given key value', () => {
      model.set({name: 'dylan'})
      assert.equal(model.get('name'), name)
      assert.equal(model.get('album'), item.album)
    })
  })

  describe('save', () => {
    const name = 'dylan'

    context('if the item is not persisted', () => {
      beforeEach(() => model.attributes.delete('id'))

      it('it adds the model', () => {
        const create = sinon.stub(collection, 'create')
        collection.create(item, {optimistic: true})
        sinon.assert.calledWith(create, item, {optimistic: true})
      })
    })

    context('if its optimistic (default)', () => {
      context('and its patching (default)', () => {
        it('it sets model straight away', () => {
          model.save({name})
          assert.equal(model.get('name'), 'dylan')
          assert.equal(model.get('album'), item.album)
          assert.equal(model.request.label, 'updating')
        })
      })

      context('and its not patching', () => {
        it('it sets model straight away', () => {
          model.save({name}, {patch: false})
          assert.equal(model.get('name'), 'dylan')
          assert.equal(model.get('album'), null)
          assert.equal(model.request.label, 'updating')
        })
      })

      context('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.save({name}).catch(() => {
            assert.equal(model.error.label, 'updating')
            assert.equal(model.error.body, error)
          })
        })

        it('rolls back the changes', () => {
          return model.save({name}).catch(() => {
            assert.equal(model.get('name'), item.name)
            assert.equal(model.get('album'), item.album)
            assert.equal(model.request, null)
          })
        })

        it('nullifies the request', () => {
          return model.save({name}).catch(() => {
            assert.equal(model.request, null)
          })
        })
      })

      context('when it succeeds', () => {
        beforeEach(() => {
          resolve({id: 1, name: 'coltrane'})()
        })

        it('updates the data from the server', () => {
          return model.save({name}).then(() => {
            assert.equal(model.get('name'), 'coltrane')
          })
        })

        it('nullifies the request', () => {
          return model.save({name}).then(() => {
            assert.equal(model.request, null)
          })
        })
      })
    })

    context('if its pessimistic (default)', () => {
      context('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.save({name}, {optimistic: false}).catch(() => {
            assert.equal(model.error.label, 'updating')
            assert.equal(model.error.body, error)
          })
        })

        it('nullifies the request', () => {
          return model.save({name}).catch(() => {
            assert.equal(model.request, null)
          })
        })
      })

      context('when it succeeds', () => {
        beforeEach(() => {
          resolve({id: 2, name: 'dylan'})()
        })

        it('adds data from the server', () => {
          return model.save({name}, {optimistic: false}).then(() => {
            assert.equal(model.get('name'), 'dylan')
          })
        })

        it('nullifies the request', () => {
          return model.save({name}).then(() => {
            assert.equal(model.request, null)
          })
        })
      })
    })
  })

  describe('destroy', () => {
    context('if the item is not persisted', () => {
      beforeEach(() => model.attributes.delete('id'))

      it('it removes the model', () => {
        const remove = sinon.stub(collection, 'remove')
        model.destroy()
        sinon.assert.calledWith(remove, [model.uuid], {optimistic: true})
      })
    })

    context('if its optimistic (default)', () => {
      it('it removes the model straight away', () => {
        model.destroy()
        assert.equal(collection.models.length, 0)
      })

      context('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.destroy().catch(() => {
            assert.equal(model.error.label, 'destroying')
            assert.equal(model.error.body, error)
          })
        })

        it('rolls back the changes', () => {
          return model.destroy().catch(() => {
            assert.equal(collection.models.length, 1)
            assert.equal(collection.at(0).get('name'), item.name)
          })
        })

        it('nullifies the request', () => {
          return model.destroy().catch(() => {
            assert.equal(model.request, null)
          })
        })
      })

      context('when it succeeds', () => {
        beforeEach(resolve())

        it('nullifies the request', () => {
          return model.destroy().then(() => {
            assert.equal(model.request, null)
          })
        })
      })
    })

    context('if its pessimistic', () => {
      context('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.destroy({optimistic: false}).catch(() => {
            assert.equal(model.error.label, 'destroying')
            assert.equal(model.error.body, error)
          })
        })

        it('rolls back the changes', () => {
          return model.destroy({optimistic: false}).catch(() => {
            assert.equal(collection.models.length, 1)
          })
        })

        it('nullifies the request', () => {
          return model.destroy({optimistic: false}).catch(() => {
            assert.equal(model.request, null)
          })
        })
      })

      context('when it succeeds', () => {
        beforeEach(resolve())

        it('applies changes', () => {
          return model.destroy({optimistic: false}).then(() => {
            assert.equal(collection.models.length, 0)
          })
        })

        it('nullifies the request', () => {
          return model.destroy({optimistic: false}).then(() => {
            assert.equal(model.request, null)
          })
        })
      })
    })
  })
})
