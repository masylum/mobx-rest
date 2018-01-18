import { Collection, Model, apiClient } from '../src'
import MockApi from './mocks/api'
import ErrorObject from '../src/ErrorObject'

const error = 'boom!'
const errorObject = new ErrorObject('fetch', error)

apiClient(MockApi)

class MyCollection extends Collection {
  url () {
    return '/resources'
  }

  model () {
    return MyModel
  }
}

class MyModel extends Model {
  urlRoot () {
    return '/resources'
  }
}

describe('Model', () => {
  let collection
  let model
  let item
  let spy

  function resolve (attr) {
    return () => {
      apiClient().resolver = resolve => resolve(attr)
    }
  }

  function reject () {
    apiClient().resolver = (_resolve, reject) => reject(error)
  }

  beforeEach(() => {
    item = {
      id: 1,
      name: 'miles',
      album: 'kind of blue',
      tracks: [
        { name: 'So What' },
        { name: 'Freddie Freeloader' },
        { name: 'Blue in Green' },
        { name: 'All Blues' },
        { name: 'Flamenco Sketches' }
      ]
    }
    collection = new MyCollection([item])
    model = collection.at(0)
  })

  afterEach(() => {
    if (spy) {
      spy.mockReset()
      spy.mockRestore()
      spy = null
    }
  })

  it('allows to define default model attributes', () => {
    class ModelWithDefaults extends Model {
      static defaultAttributes = {
        someAttribute: 'test'
      }
    }

    const newModel = new ModelWithDefaults()
    expect(newModel.get('someAttribute')).toBe('test')
  })

  describe('changedAttributes', () => {
    it('return the attributes names that changed from the last sync', () => {
      const newModel = new MyModel({
        name: 'Name 1',
        date: '1900-01-01',
        phone: '123456789'
      })

      newModel.set({
        name: 'Name 2',
        phone: '987654321'
      })

      expect(newModel.changedAttributes).toEqual(['name', 'phone'])
    })
  })

  describe('hasChanges(attribute)', () => {
    describe('if an attribute is specified', () => {
      it('returns true if the specified attribute has changes', () => {
        const newModel = new MyModel({
          name: 'Name 1',
          date: '1900-01-01',
          phone: '123456789'
        })

        newModel.set({ name: 'Name 2' })

        expect(newModel.hasChanges('name')).toBe(true)
      })

      it('returns false if the specified attribute has no changes', () => {
        const newModel = new MyModel({
          name: 'Name 1',
          date: '1900-01-01',
          phone: '123456789'
        })

        newModel.set({ name: 'Name 2' })

        expect(newModel.hasChanges('date')).toBe(false)
      })

      describe('if no attribute is specified', () => {
        it('returns true if any attribute has changes', () => {
          const newModel = new MyModel({
            name: 'Name 1',
            date: '1900-01-01',
            phone: '123456789'
          })

          newModel.set({ name: 'Name 2' })

          expect(newModel.hasChanges()).toBe(true)
        })

        it('returns false if no attributes have changes', () => {
          const newModel = new MyModel({
            name: 'Name 1',
            date: '1900-01-01',
            phone: '123456789'
          })

          expect(newModel.hasChanges()).toBe(false)
        })
      })
    })

    it('returns an object with the current changes', () => {
      const newModel = new MyModel({
        name: 'Name 1',
        date: '1900-01-01',
        phone: '123456789'
      })

      newModel.set({
        name: 'Name 2',
        phone: '987654321'
      })

      expect(newModel.changedAttributes).toEqual(['name', 'phone'])
    })
  })

  describe('changes', () => {
    it('returns an object with the current changes', () => {
      const newModel = new MyModel({
        name: 'Name 1',
        date: '1900-01-01',
        phone: '123456789'
      })

      newModel.set({
        name: 'Name 2'
      })

      newModel.set({
        name: 'Name 1',
        date: '2000-01-01',
        phone: '987654321'
      })

      expect(newModel.changes).toEqual({
        date: '2000-01-01',
        phone: '987654321'
      })
    })
  })

  describe('isRequest', () => {
    it('returns false if there is no request', () => {
      const newModel = new MyModel({})
      expect(newModel.isRequest('fetching')).toBe(false)
    })

    it('return false if the request is something different', () => {
      const newModel = new MyModel({})

      newModel.withRequest('creating', new Promise(() => { }))

      expect(newModel.isRequest('fetching')).toBe(false)
    })

    it('return true if the request is matching', () => {
      const newModel = new MyModel({})

      newModel.withRequest('fetching', new Promise(() => {}))

      expect(newModel.isRequest('fetching')).toBe(true)
    })
  })

  describe('isNew', () => {
    it('returns true if it does not have an id', () => {
      const newModel = new MyModel({})
      expect(newModel.isNew).toBe(true)
    })

    it('returns false if it does not have an id', () => {
      const newModel = new MyModel({ id: 4 })
      expect(newModel.isNew).toBe(false)
    })
  })

  describe('url', () => {
    describe('when the model has a collection', () => {
      it('returns the collection one', () => {
        expect(model.url()).toBe('/resources/1')
      })
    })

    describe('when the model has no collection', () => {
      describe('and no urlRoot', () => {
        it('throws', () => {
          expect(() => {
            const newModel = new Model({ id: 1 })
            newModel.url()
          }).toThrowError()
        })
      })

      describe('and urlRoot is defined', () => {
        it('returns different urls depending whether is new or not', () => {
          let newModel

          newModel = new MyModel({})
          expect(newModel.url()).toBe('/resources')

          newModel = new MyModel({ id: 3 })
          expect(newModel.url()).toBe('/resources/3')
        })
      })
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

  describe('reset(attributes)', () => {
    describe('if attributes is specified', () => {
      it('replaces the current attributes with the specified ones', () => {
        model.reset({ hi: 'bye' })

        expect(model.toJS()).toEqual({ hi: 'bye' })
      })

      it('respects the default attributes', () => {
        class ModelWithDefaults extends Model {
          static defaultAttributes = {
            someAttribute: 'test'
          }
        }

        const newModel = new ModelWithDefaults({
          name: 'john'
        })

        newModel.reset({ phone: '1234567' })

        expect(newModel.toJS()).toEqual({
          someAttribute: 'test',
          phone: '1234567'
        })
      })
    })

    describe('if attributes is not specified', () => {
      it('replaces the current attributes with last commited ones', () => {
        model.set({ name: 'test' })
        model.reset()

        expect(model.toJS()).toEqual(item)
      })
    })
  })

  describe('clear', () => {
    it('replaces the current attributes with the default ones', () => {
      class ModelWithDefaults extends Model {
        static defaultAttributes = {
          someAttribute: 'test'
        }
      }

      const newModel = new ModelWithDefaults({
        name: 'john'
      })

      newModel.clear()

      expect(newModel.toJS()).toEqual({
        someAttribute: 'test'
      })
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

        it('sends merged attributes on the request', () => {
          const adapter = apiClient()
          const attributes = { ...item }

          delete attributes.id

          spy = jest.spyOn(adapter, 'post')
          model.save({ name })

          expect(spy).toHaveBeenCalledTimes(1)
          expect(spy.mock.calls[0][1]).toEqual({
            ...attributes,
            name: 'dylan'
          })
        })
      })

      describe('and it does not have a collection', () => {
        beforeEach(() => {
          model.collection = null
        })

        it('sends merged attributes on the request', () => {
          const adapter = apiClient()
          const attributes = { ...item }

          delete attributes.id

          spy = jest.spyOn(adapter, 'post')
          model.save({ name })

          expect(spy).toHaveBeenCalledTimes(1)
          expect(spy.mock.calls[0][1]).toEqual({
            ...attributes,
            name: 'dylan'
          })
        })

        describe('if its optimistic (default)', () => {
          it('it sets model straight away', () => {
            model.save({ name })
            expect(model.get('name')).toBe('dylan')
            expect(model.get('album')).toBe(item.album)
            expect(model.isRequest('creating')).toBe(true)
          })

          describe('when it fails', () => {
            beforeEach(reject)

            it('passes the error', () => {
              return model.save({ name }).catch(response => {
                expect(response).toBe(error)
              })
            })

            it('removes the request', () => {
              return model.save({ name }).catch(() => {
                expect(model.isRequest('creating')).toBe(false)
              })
            })
          })

          describe('when it succeeds', () => {
            beforeEach(() => {
              model.error = errorObject
              resolve({ id: 1, name: 'coltrane' })()
            })

            it('updates the data from the server', () => {
              return model.save({ name }).then(() => {
                expect(model.get('name')).toBe('coltrane')
              })
            })

            it('removes the request', () => {
              return model.save({ name }).then(() => {
                expect(model.isRequest('creating')).toBe(false)
              })
            })
          })
        })

        describe('if its pessimistic', () => {
          describe('when it fails', () => {
            beforeEach(reject)

            it('passes the error', () => {
              return model.save({ name }, { optimistic: false }).catch(response => {
                expect(response).toBe(error)
              })
            })

            it('removes the request', () => {
              return model.save({ name }).catch(() => {
                expect(model.isRequest('creating')).toBe(false)
              })
            })
          })

          describe('when it succeeds', () => {
            beforeEach(() => {
              model.error = errorObject
              resolve({ id: 2, name: 'dylan' })()
            })

            it('adds data from the server', () => {
              return model.save({ name }, { optimistic: false }).then(() => {
                expect(model.get('name')).toBe('dylan')
              })
            })

            it('removes the request', () => {
              return model.save({ name }).then(() => {
                expect(model.isRequest('creating')).toBe(false)
              })
            })
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
          expect(model.isRequest('updating')).toBe(true)
        })

        it('sends merged attributes on the request', () => {
          const adapter = apiClient()

          spy = jest.spyOn(adapter, 'put')
          model.save({
            name,
            tracks: [
              { name: 'Track 1' },
              { name: 'Track 2' }
            ]
          })

          expect(spy).toHaveBeenCalledTimes(1)
          expect(spy.mock.calls[0][1]).toEqual({
            name: 'dylan',
            tracks: [
              { name: 'Track 1' },
              { name: 'Track 2' }
            ]
          })
        })
      })

      describe('and its not patching', () => {
        it('it sets model straight away', () => {
          model.save({ name }, { patch: false })
          expect(model.get('name')).toBe('dylan')
          expect(model.get('album')).toBe('kind of blue')
          expect(model.isRequest('updating')).toBe(true)
        })

        it('sends merged attributes on the request', () => {
          const adapter = apiClient()

          spy = jest.spyOn(adapter, 'put')
          model.save({
            name,
            tracks: [
              { name: 'Track 1' },
              { name: 'Track 2' }
            ]
          }, { patch: false })

          expect(spy).toHaveBeenCalledTimes(1)
          expect(spy.mock.calls[0][1]).toEqual({
            ...item,
            name: 'dylan',
            tracks: [
              { name: 'Track 1' },
              { name: 'Track 2' }
            ]
          })
        })
      })

      describe('when it fails', () => {
        beforeEach(reject)

        it('passes the error', () => {
          return model.save({ name }).catch(response => {
            expect(response).toBe(error)
          })
        })

        it('rolls back the changes', () => {
          return model.save({ name }).catch(() => {
            expect(model.get('name')).toBe(item.name)
            expect(model.get('album')).toBe(item.album)
            expect(model.isRequest('updating')).toBe(false)
          })
        })

        it('removes the request', () => {
          return model.save({ name }).catch(() => {
            expect(model.isRequest('updating')).toBe(false)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          model.error = errorObject
          resolve({ id: 1, name: 'coltrane' })()
        })

        it('updates the data from the server', () => {
          return model.save({ name }).then(() => {
            expect(model.get('name')).toBe('coltrane')
          })
        })

        it('removes the request', () => {
          return model.save({ name }).then(() => {
            expect(model.isRequest('updating')).toBe(false)
          })
        })
      })
    })

    describe('if its pessimistic', () => {
      describe('when it fails', () => {
        beforeEach(reject)

        it('passes the error', () => {
          return model.save({ name }, { optimistic: false }).catch(response => {
            expect(response).toBe(error)
          })
        })

        it('removes the request', () => {
          return model.save({ name }).catch(() => {
            expect(model.isRequest('updating')).toBe(false)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          model.error = errorObject
          resolve({ id: 2, name: 'dylan' })()
        })

        it('adds data from the server', () => {
          return model.save({ name }, { optimistic: false }).then(() => {
            expect(model.get('name')).toBe('dylan')
          })
        })

        it('removes the request', () => {
          return model.save({ name }).then(() => {
            expect(model.isRequest('updating')).toBe(false)
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
        expect(collection.remove).toBeCalledWith([model.optimisticId])
      })
    })

    describe('if its optimistic (default)', () => {
      it('it removes the model straight away', () => {
        model.destroy()
        expect(collection.models.length).toBe(0)
      })

      describe('when it fails', () => {
        beforeEach(reject)

        it('passes the error', () => {
          expect.assertions(1)

          return model.destroy().catch(response => {
            expect(response).toBe(error)
          })
        })

        it('rolls back the changes', () => {
          expect.assertions(2)

          return model.destroy().catch(() => {
            expect(collection.models.length).toBe(1)
            expect(collection.at(0).toJS()).toEqual(item)
          })
        })

        it('removes the request', () => {
          expect.assertions(1)

          return model.destroy().catch(() => {
            expect(model.isRequest('destroying')).toBe(false)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          model.error = errorObject
          resolve()()
        })

        it('removes the request', () => {
          expect.assertions(1)

          return model.destroy().then(() => {
            expect(model.isRequest('destroying')).toBe(false)
          })
        })
      })
    })

    describe('if its pessimistic', () => {
      describe('when it fails', () => {
        beforeEach(reject)

        it('passes the error', () => {
          expect.assertions(1)

          return model.destroy({ optimistic: false }).catch(response => {
            expect(response).toBe(error)
          })
        })

        it('rolls back the changes', () => {
          expect.assertions(1)

          return model.destroy({ optimistic: false }).catch(() => {
            expect(collection.models.length).toBe(1)
          })
        })

        it('removes the request', () => {
          expect.assertions(1)

          return model.destroy({ optimistic: false }).catch(() => {
            expect(model.isRequest('destroying')).toBe(false)
          })
        })
      })

      describe('when it succeeds', () => {
        beforeEach(() => {
          model.error = errorObject
          resolve()()
        })

        it('applies changes', () => {
          expect.assertions(1)

          return model.destroy({ optimistic: false }).then(() => {
            expect(collection.models.length).toBe(0)
          })
        })

        it('removes the request', () => {
          expect.assertions(1)

          return model.destroy({ optimistic: false }).then(() => {
            expect(model.isRequest('destroying')).toBe(false)
          })
        })
      })
    })
  })

  describe('fetch', () => {
    describe('when it fails', () => {
      beforeEach(reject)

      it('passes the error', () => {
        expect.assertions(1)

        return model.fetch().catch(response => {
          expect(response).toBe(error)
        })
      })

      it('removes the request', () => {
        expect.assertions(1)

        return model.fetch().catch(() => {
          expect(model.isRequest('fetching')).toBe(false)
        })
      })
    })

    describe('when it succeeds', () => {
      beforeEach(() => {
        model.error = errorObject
        resolve({ name: 'bill' })()
      })

      it('returns the response', () => {
        expect.assertions(1)

        return model.fetch().then(response => {
          expect(response.name).toBe('bill')
        })
      })

      it('sets the response as attributes', () => {
        expect.assertions(1)

        return model.fetch().then(() => {
          expect(model.toJS()).toEqual({ name: 'bill' })
        })
      })

      it('removes the request', () => {
        expect.assertions(1)

        return model.fetch().then(() => {
          expect(model.isRequest('fetching')).toBe(false)
        })
      })
    })
  })

  describe('rpc', () => {
    describe('when it fails', () => {
      beforeEach(reject)

      it('passes the error', () => {
        return model.rpc('approve').catch(response => {
          expect(response).toBe(error)
        })
      })

      it('removes the request', () => {
        return model.rpc('approve').catch(() => {
          expect(model.isRequest('updating')).toBe(false)
        })
      })
    })

    describe('when it succeeds', () => {
      beforeEach(() => {
        model.error = errorObject
        resolve('foo')()
      })

      it('returns the response', () => {
        return model.rpc('approve').then(response => {
          expect(response).toBe('foo')
        })
      })

      it('removes the request', () => {
        return model.rpc('approve').then(() => {
          expect(model.isRequest('updating')).toBe(false)
        })
      })
    })
  })
})
