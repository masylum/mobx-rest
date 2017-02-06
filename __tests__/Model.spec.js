import { Collection, Model, apiClient } from '../src'
import MockApi from './mocks/api'

const error = 'boom!'
apiClient(MockApi)

class MyCollection extends Collection {
  url () {
    return '/resources'
  }
}

describe('Model', () => {
  let collection
  let model
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
    item = { id: 1, name: 'miles', album: 'kind of blue' }
    collection = new MyCollection([item])
    model = collection.at(0)
  })

  describe('url', () => {
    it('returns the collection one', () => {
      expect(model.url()).toBe('/resources/1')
    })

    it('throws if the model does not have a collection', () => {
      expect(() => {
        const newModel = new Model({ id: 1 })
        newModel.url()
      }).toThrowError()
    })
  })

  describe('get', () => {
    it('returns the attribute', () => {
      expect(model.get('name')).toBe(item.name)
    })

    it('throws if the attribute is not found', () => {
      expect(() => {
        model.get('lol')
      }).toThrowError()
    })
  })

  describe('set', () => {
    const name = 'dylan'

    it('changes the given key value', () => {
      model.set({ name: 'dylan' })
      expect(model.get('name')).toBe(name)
      expect(model.get('album')).toBe(item.album)
    })
  })

  describe('save', () => {
    const name = 'dylan'

    describe('if the item is not persisted', () => {
      beforeEach(() => model.attributes.delete('id'))

      describe('and it has a collection', () => {
        it('it adds the model', () => {
          collection.create = jest.fn()
          model.save(item)
          expect(collection.create).toBeCalledWith(model, { optimistic: true })
        })
      })

      describe('and it does not have a collection', () => {
        it('throws an error', () => {
          const newModel = new Model()
          newModel.save(item).catch((s) => {
            expect(s).toBeTruthy()
          })
        })
      })
    })

    describe('if its optimistic (default)', () => {
      describe('and its patching (default)', () => {
        it('it sets model straight away', () => {
          model.save({ name })
          expect(model.get('name')).toBe('dylan')
          expect(model.get('album')).toBe(item.album)
          expect(model.request.label).toBe('updating')
        })
      })

      describe('and its not patching', () => {
        it('it sets model straight away', () => {
          model.save({ name }, { patch: false })
          expect(model.get('name')).toBe('dylan')
          expect(model.get('album')).toBe('kind of blue')
          expect(model.request.label).toBe('updating')
        })
      })

      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.save({ name }).catch(() => {
            expect(model.error.label).toBe('updating')
            expect(model.error.body).toBe(error)
          })
        })

        it('rolls back the changes', () => {
          return model.save({ name }).catch(() => {
            expect(model.get('name')).toBe(item.name)
            expect(model.get('album')).toBe(item.album)
            expect(model.request).toBe(null)
          })
        })

        it('nullifies the request', () => {
          return model.save({ name }).catch(() => {
            expect(model.request).toBe(null)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          resolve({ id: 1, name: 'coltrane' })()
        })

        it('updates the data from the server', () => {
          return model.save({ name }).then(() => {
            expect(model.get('name')).toBe('coltrane')
          })
        })

        it('nullifies the request', () => {
          return model.save({ name }).then(() => {
            expect(model.request).toBe(null)
          })
        })
      })
    })

    describe('if its pessimistic (default)', () => {
      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.save({ name }, { optimistic: false }).catch(() => {
            expect(model.error.label).toBe('updating')
            expect(model.error.body).toBe(error)
          })
        })

        it('nullifies the request', () => {
          return model.save({ name }).catch(() => {
            expect(model.request).toBe(null)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          resolve({ id: 2, name: 'dylan' })()
        })

        it('adds data from the server', () => {
          return model.save({ name }, { optimistic: false }).then(() => {
            expect(model.get('name')).toBe('dylan')
          })
        })

        it('nullifies the request', () => {
          return model.save({ name }).then(() => {
            expect(model.request).toBe(null)
          })
        })
      })
    })
  })

  describe('destroy', () => {
    describe('if the item is not persisted', () => {
      beforeEach(() => model.attributes.delete('id'))

      it('it removes the model', () => {
        collection.remove = jest.fn()
        model.destroy()
        expect(collection.remove).toBeCalledWith(
          [model.optimisticId],
          { optimistic: true }
        )
      })
    })

    describe('if its optimistic (default)', () => {
      it('it removes the model straight away', () => {
        model.destroy()
        expect(collection.models.length).toBe(0)
      })

      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.destroy().catch(() => {
            expect(model.error.label).toBe('destroying')
            expect(model.error.body).toBe(error)
          })
        })

        it('rolls back the changes', () => {
          return model.destroy().catch(() => {
            expect(collection.models.length).toBe(1)
            expect(collection.at(0).get('name')).toBe(item.name)
          })
        })

        it('nullifies the request', () => {
          return model.destroy().catch(() => {
            expect(model.request).toBe(null)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(resolve())

        it('nullifies the request', () => {
          return model.destroy().then(() => {
            expect(model.request).toBe(null)
          })
        })
      })
    })

    describe('if its pessimistic', () => {
      describe('when it fails', () => {
        beforeEach(reject)

        it('sets the error', () => {
          return model.destroy({ optimistic: false }).catch(() => {
            expect(model.error.label).toBe('destroying')
            expect(model.error.body).toBe(error)
          })
        })

        it('rolls back the changes', () => {
          return model.destroy({ optimistic: false }).catch(() => {
            expect(collection.models.length).toBe(1)
          })
        })

        it('nullifies the request', () => {
          return model.destroy({ optimistic: false }).catch(() => {
            expect(model.request).toBe(null)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(resolve())

        it('applies changes', () => {
          return model.destroy({ optimistic: false }).then(() => {
            expect(collection.models.length).toBe(0)
          })
        })

        it('nullifies the request', () => {
          return model.destroy({ optimistic: false }).then(() => {
            expect(model.request).toBe(null)
          })
        })
      })
    })
  })

  describe('fetch', () => {
    describe('when it fails', () => {
      beforeEach(reject)

      it('sets the error', () => {
        return model.fetch().catch(() => {
          expect(model.error.label).toBe('fetching')
          expect(model.error.body).toBe(error)
        })
      })

      it('nullifies the request', () => {
        return model.fetch().catch(() => {
          expect(model.request).toBe(null)
        })
      })
    })

    describe('when it succeeds', () => {
      beforeEach(resolve({ name: 'bill' }))

      it('returns the response', () => {
        return model.fetch().then((response) => {
          expect(response.name).toBe('bill')
        })
      })

      it('sets the response as attributes', () => {
        return model.fetch().then(() => {
          expect(model.get('name')).toBe('bill')
        })
      })

      it('nullifies the request', () => {
        return model.fetch().then(() => {
          expect(model.request).toBe(null)
        })
      })
    })
  })

  describe('rpc', () => {
    describe('when it fails', () => {
      beforeEach(reject)

      it('sets the error', () => {
        return model.rpc('approve').catch(() => {
          expect(model.error.label).toBe('updating')
          expect(model.error.body).toBe(error)
        })
      })

      it('nullifies the request', () => {
        return model.rpc('approve').catch(() => {
          expect(model.request).toBe(null)
        })
      })
    })

    describe('when it succeeds', () => {
      beforeEach(resolve('foo'))

      it('returns the response', () => {
        return model.rpc('approve').then((response) => {
          expect(response).toBe('foo')
        })
      })

      it('nullifies the request', () => {
        return model.rpc('approve').then(() => {
          expect(model.request).toBe(null)
        })
      })
    })
  })
})
