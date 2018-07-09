import Model from '../src/Model'
import Collection from '../src/Collection'
import apiClient from '../src/apiClient'
import MockApi from './mocks/api'

apiClient(MockApi)

describe(Collection, () => {
  let collection

  beforeEach(() => {
    collection = new Collection([
      { id: 1, phone: '1234' },
      { id: 2, phone: '5678' }
    ])
  })

  describe('length', () => {
    it('returns the number of models', () => {
      expect(collection.length).toBe(2)
    })
  })

  describe('url()', () => {
    it('throws', () => {
      expect(() => collection.url()).toThrow('You must implement this method')
    })
  })

  describe('toJS()', () => {
    it('returns a plain representation of the models array', () => {
      expect(collection.toJS()).toEqual([
        { id: 1, phone: '1234' },
        { id: 2, phone: '5678' }
      ])
    })
  })

  describe('map(callback)', () => {
    it('aliases `models.map`', () => {
      expect(collection.map(model => model.id)).toEqual([1, 2])
    })
  })

  describe('forEach(callback)', () => {
    it('aliases `models.forEach`', () => {
      const ids = []
      const response = collection.forEach(model => ids.push(model.id))

      expect(response).not.toBeDefined()
      expect(ids).toEqual([1, 2])
    })
  })

  describe('toArray()', () => {
    it('returns a shallow defensive copy of the models array', () => {
      const models = collection.toArray()

      models.pop()

      expect(models.length).toBe(1)
      expect(collection.models.length).toBe(2)
    })
  })

  describe('slice()', () => {
    it('returns a shallow defensive copy of the models array', () => {
      const models = collection.slice()

      models.pop()

      expect(models.length).toBe(1)
      expect(collection.models.length).toBe(2)
    })
  })

  describe('peek()', () => {
    it('returns a performant shallow copy of the models array', () => {
      const models = collection.peek()

      models.pop()

      expect(models.length).toBe(1)
      expect(collection.models.length).toBe(1)
    })
  })

  describe('model()', () => {
    it('returns the default model class', () => {
      expect(collection.model()).toBe(Model)
    })
  })

  describe('isEmpty', () => {
    it('returns true if the models collection is empty', () => {
      collection.reset([])
      expect(collection.isEmpty).toBe(true)
    })

    it('returns false if the models collection is not empty', () => {
      expect(collection.isEmpty).toBe(false)
    })
  })

  describe('at(index)', () => {
    it('returns the model at the specified index', () => {
      expect(collection.at(1)).toBe(collection.models[1])
    })
  })

  describe('get(id, { required = false })', () => {
    it('returns the model with the specified id', () => {
      expect(collection.get(2)).toBe(collection.models[1])
    })

    describe('if the model is not found', () => {
      describe('if required', () => {
        it('throws', () => {
          expect(() => collection.get(3, { required: true }))
            .toThrow('Invariant: Model must be found with id: 3')
        })
      })

      describe('if not required', () => {
        it('return undefined', () => {
          expect(collection.get(3)).toBeUndefined()
        })
      })
    })
  })

  describe('filter(query)', () => {
    beforeEach(() => {
      collection.reset([
        { id: 1, phone: '1234', email: 'test1@test.com' },
        { id: 2, phone: '1234', email: 'test2@test.com' },
        { id: 3, phone: '5678', email: 'test2@test.com' },
        { id: 4, phone: '1234', email: 'test1@test.com' }
      ])
    })

    describe('if query is an object', () => {
      it('returns the models that matches that attributes', () => {
        expect(collection.filter({
          phone: '1234',
          email: 'test1@test.com'
        })).toEqual([
          collection.at(0),
          collection.at(3)
        ])
      })
    })

    describe('if query is a function', () => {
      it('returns the models that returns true on the callback', () => {
        expect(collection.filter(model =>
          model.get('email') === 'test2@test.com'
        )).toEqual([
          collection.at(1),
          collection.at(2)
        ])
      })
    })
  })

  describe('find(query)', () => {
    beforeEach(() => {
      collection.reset([
        { id: 1, phone: '1234', email: 'test1@test.com' },
        { id: 2, phone: '1234', email: 'test2@test.com' },
        { id: 3, phone: '5678', email: 'test2@test.com' },
        { id: 4, phone: '1234', email: 'test1@test.com' }
      ])
    })

    describe('if query is an object', () => {
      it('returns the first model that matches that attributes', () => {
        expect(collection.find({
          phone: '1234',
          email: 'test1@test.com'
        })).toEqual(collection.at(0))
      })
    })

    describe('if query is a function', () => {
      it('returns the first model that returns true on the callback', () => {
        expect(collection.find(model =>
          model.get('email') === 'test2@test.com'
        )).toEqual(collection.at(1))
      })
    })

    describe('if the model is not found', () => {
      describe('if required', () => {
        it('throws', () => {
          expect(() => collection.find({ phone: '9999' }, { required: true }))
            .toThrow('Invariant: Model must be found')
        })
      })

      describe('if not required', () => {
        it('return undefined', () => {
          expect(collection.find({ phone: '9999' })).toBeUndefined()
        })
      })
    })
  })

  describe('add(model)', () => {
    beforeEach(() => {
      collection.reset([])
    })

    it('adds the model to the collection', () => {
      const model = new Model()

      collection.add(model)

      expect(collection.at(0)).toBe(model)
    })

    describe('if the model is a plain object', () => {
      it('creates a new instance of the collection model class', () => {
        const attributes = { phone: '1234' }

        collection.add(attributes)

        expect(collection.at(0)).toBeInstanceOf(Model)
        expect(collection.at(0).toJS()).toEqual(attributes)
      })
    })

    describe('if model is an array', () => {
      it('adds every model to the collection', () => {
        const models = [
          new Model(),
          new Model()
        ]

        collection.add(models)

        expect(collection.at(0)).toBe(models[0])
        expect(collection.at(1)).toBe(models[1])
      })
    })
  })

  describe('reset(data)', () => {
    it('replaces the collection models', () => {
      collection.add({})
      collection.reset([{}, {}, {}])

      expect(collection.length).toBe(3)

      collection.forEach(model =>
        expect(model).toBeInstanceOf(Model)
      )
    })
  })

  describe('remove(data)', () => {
    it('removes the specified id from the collection', () => {
      collection.reset([
        { id: 1 },
        { id: 2 }
      ])
      collection.remove(1)

      expect(collection.length).toBe(1)
      expect(collection.at(0).id).toBe(2)
    })

    it('removes the collection reference from the removed models', () => {
      const model = new Model({ id: 1 })

      collection.reset([model])

      expect(model.collection).toBe(collection)
      collection.remove(1)
      expect(model.collection).toBeUndefined()
    })

    describe('if the id is not registered', () => {
      it('don\'t throws', () => {
        collection.reset([{ id: 1 }])

        expect(() => collection.remove(2)).not.toThrow()
        expect(collection.length).toBe(1)
      })
    })

    describe('if data is an array', () => {
      it('removes all the specified ids', () => {
        collection.reset([
          { id: 1 },
          { id: 2 },
          { id: 3 }
        ])
        collection.remove([1, 2])

        expect(collection.length).toBe(1)
        expect(collection.at(0).id).toBe(3)
      })
    })

    describe('if data is a model assigned to this collection', () => {
      it('removes the model from the collection', () => {
        collection.reset([
          { id: 1 },
          { id: 2 }
        ])

        const model = collection.get(1)

        collection.remove(model)

        expect(collection.length).toBe(1)
        expect(collection.at(0).id).toBe(2)
        expect(model.collection).toBeUndefined()
      })
    })

    describe('if data is anything else', () => {
      it('don\'t throw', () => {
        expect(() => collection.remove('invalid')).not.toThrow()
      })
    })
  })

  describe('set(data, { add = true, change = true, remove = true })', () => {
    describe('if data has new models', () => {
      describe('if add = true', () => {
        it('adds the new models', () => {
          collection.reset([{ id: 1 }])
          collection.set(
            [{ id: 2 }, { id: 3 }],
            { add: true, change: false, remove: false }
          )

          expect(collection.toJS()).toEqual([
            { id: 1 }, { id: 2 }, { id: 3 }
          ])
        })
      })

      describe('if add = false', () => {
        it('ignores the new models', () => {
          collection.reset([{ id: 1 }])
          collection.set(
            [{ id: 2 }, { id: 3 }],
            { add: false, change: false, remove: false }
          )

          expect(collection.toJS()).toEqual([
            { id: 1 }
          ])
        })
      })
    })

    describe('if data has existing models', () => {
      describe('if change = true', () => {
        it('updates the existing models', () => {
          collection.reset([
            { id: 1, phone: '1234' },
            { id: 2, phone: '5678' }
          ])
          collection.set(
            [{ id: 1, phone: '8888' }, { id: 2, phone: '9999' }],
            { add: false, change: true, remove: false }
          )

          expect(collection.toJS()).toEqual([
            { id: 1, phone: '8888' },
            { id: 2, phone: '9999' }
          ])
        })
      })

      describe('if change = false', () => {
        it('ignores the existing models', () => {
          collection.reset([
            { id: 1, phone: '1234' },
            { id: 2, phone: '5678' }
          ])
          collection.set(
            [{ id: 1, phone: '8888' }, { id: 2, phone: '9999' }],
            { add: false, change: false, remove: false }
          )

          expect(collection.toJS()).toEqual([
            { id: 1, phone: '1234' },
            { id: 2, phone: '5678' }
          ])
        })
      })
    })

    describe('if data has missing models', () => {
      describe('if remove = true', () => {
        it('removes the missing models', () => {
          collection.reset([{ id: 1 }, { id: 2 }])
          collection.set(
            [{ id: 2 }],
            { add: false, change: false, remove: true }
          )

          expect(collection.toJS()).toEqual([
            { id: 2 }
          ])
        })
      })

      describe('if remove = false', () => {
        it('ignores the missing models', () => {
          collection.reset([{ id: 1 }, { id: 2 }])
          collection.set(
            [{ id: 2 }],
            { add: false, change: false, remove: false }
          )

          expect(collection.toJS()).toEqual([
            { id: 1 }, { id: 2 }
          ])
        })
      })
    })
  })

  describe('build(data)', () => {
    it('returns an instance of the collection model', () => {
      class MyModel extends Model {}

      collection.model = () => MyModel

      const model = collection.build({ phone: '1234' })

      expect(model).toBeInstanceOf(MyModel)
      expect(model.toJS()).toEqual({ phone: '1234' })
    })

    describe('if the data is already an instance of the model', () => {
      it('returns the same instance', () => {
        const model = new Model()

        expect(collection.build(model)).toBe(model)
      })

      it('assigns the collection to the model', () => {
        const model = new Model()

        collection.build(model)

        expect(model.collection).toBe(collection)
      })
    })

    describe('if attributes is not defined', () => {
      it('builds a models with the default attributes', () => {
        const model = collection.build()

        expect(model.toJS()).toEqual({})
      })
    })
  })

  describe('create(attributes, { optimistic = true })', () => {
    beforeEach(() => {
      collection.url = () => '/resources'
      collection.reset([])
      jest.spyOn(apiClient(), 'post')
    })

    afterEach(() => {
      apiClient().post.mockRestore()
    })

    it('builds a model and saves it', async () => {
      const attributes = { phone: '1234' }
      const promise = collection.create(attributes)

      MockApi.resolvePromise({ id: 1, phone: '1234' })
      await promise

      expect(collection.length).toBe(1)
      expect(collection.at(0).toJS()).toEqual({ id: 1, phone: '1234' })
    })

    describe('if optimistic', () => {
      it('immediately adds the new model to the collection', () => {
        const attributes = { phone: '1234' }

        collection.create(attributes, { optimistic: true })

        expect(collection.length).toBe(1)
        expect(collection.at(0).toJS()).toEqual({ phone: '1234' })
      })
    })

    describe('if the request succeeds', () => {
      describe('if not optimistic', () => {
        it('adds the new model to the collection', async () => {
          const promise = collection.create({}, { optimistic: false })

          expect(collection.length).toBe(0)
          MockApi.resolvePromise({})
          await promise
          expect(collection.length).toBe(1)
        })
      })
    })

    describe('if the request fails', () => {
      describe('if optimistic', () => {
        it('removes the model from the collection', async () => {
          const promise = collection.create({}, { optimistic: true })

          expect(collection.length).toBe(1)
          MockApi.rejectPromise('Conflict')

          try {
            await promise
          } catch (_error) {
            expect(collection.length).toBe(0)
          }
        })
      })

      it('throws the request response', async () => {
        const promise = collection.create({}, { optimistic: false })

        MockApi.rejectPromise('Conflict')

        try {
          await promise
        } catch (errorObject) {
          expect(errorObject.error).toBe('Conflict')
        }
      })
    })
  })

  describe('fetch(options)', () => {
    let spy
    let promise
    let options

    beforeEach(() => {
      collection.url = () => '/resources'
      spy = jest.spyOn(apiClient(), 'get')
      options = {
        data: {
          full: true
        }
      }
      promise = collection.fetch(options)
    })

    afterEach(() => {
      apiClient().get.mockRestore()
    })

    it('makes a get request to the model url', () => {
      expect(spy).toHaveBeenCalled()
    })

    it('passes the options to the api client', () => {
      expect(spy.mock.calls[0][1]).toBe(options)
    })

    it('tracks the request with the "fetching" label', () => {
      expect(collection.isRequest('fetching')).toBe(true)
    })

    it('works without passing options', () => {
      expect(() => collection.fetch()).not.toThrow()
    })

    describe('if the request succeeds', () => {
      it('sets the response data passing the same options', async () => {
        const response = []

        jest.spyOn(collection, 'set')
        MockApi.resolvePromise(response)
        await promise
        expect(collection.set).toHaveBeenCalledWith(response, options)
      })
    })
  })
})
