import Collection from '../src/Collection'
import MockApi from './mocks/api'
import Model from '../src/Model'
import apiClient from '../src/apiClient'

apiClient(MockApi)

class MockModel extends Model {}

class MockCollection extends Collection<MockModel> {
  get indexes() {
    return ['phone']
  }

  url(): string {
    return '/users'
  }

  model(): typeof MockModel {
    return MockModel
  }
}

describe(Collection, () => {
  let collection: any

  beforeEach(() => {
    collection = new MockCollection([
      { id: 1, phone: '1234' },
      { id: 2, phone: '5678' },
      { id: 3, phone: null },
      { id: 4 },
    ])
  })

  describe('length', () => {
    it('returns the number of models', () => {
      expect(collection.length).toBe(4)
    })
  })

  describe('toJS()', () => {
    it('returns a plain representation of the models array', () => {
      expect(collection.toJS()).toEqual([
        { id: 1, phone: '1234' },
        { id: 2, phone: '5678' },
        { id: 3, phone: null },
        { id: 4 },
      ])
    })
  })

  describe('index', () => {
    it('indexes the collection', () => {
      expect(collection.index.get('id')).toEqual(
        new Map([
          [1, collection.filter({ id: 1 })],
          [2, collection.filter((model: any) => model.get('id') === 2)],
          [3, collection.filter({ id: 3 })],
          [4, collection.filter({ id: 4 })],
        ])
      )

      expect(collection.index.get('phone')).toEqual(
        new Map([
          ['1234', [collection.find({ phone: '1234' })]],
          ['5678', [collection.find((model: any) => model.get('phone') === '5678')]],
          [null, collection.filter({ phone: null })],
        ])
      )
    })
  })

  describe('map(callback)', () => {
    it('aliases `models.map`', () => {
      expect(collection.map((model: any) => model.id)).toEqual([1, 2, 3, 4])
    })
  })

  describe('forEach(callback)', () => {
    it('aliases `models.forEach`', () => {
      const ids: any[] = []
      const response = collection.forEach((model: any) => ids.push(model.id))

      expect(response).not.toBeDefined()
      expect(ids).toEqual([1, 2, 3, 4])
    })
  })

  describe('toArray()', () => {
    it('returns a shallow defensive copy of the models array', () => {
      const models = collection.toArray()

      models.pop()

      expect(models.length).toBe(3)
      expect(collection.models.length).toBe(4)
    })
  })

  describe('slice()', () => {
    it('returns a shallow defensive copy of the models array', () => {
      const models = collection.slice()

      models.pop()

      expect(models.length).toBe(3)
      expect(collection.models.length).toBe(4)
    })
  })

  describe('model()', () => {
    it('returns the default model class', () => {
      expect(collection.model()).toBe(MockModel)
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
          expect(() => collection.get(999, { required: true })).toThrow(
            'Invariant: MockModel must be found with id: 999'
          )
        })
      })

      describe('if not required', () => {
        it('return undefined', () => {
          expect(collection.get(999)).toBeUndefined()
        })
      })
    })
  })

  describe('filter(query)', () => {
    beforeEach(() => {
      collection.reset([
        { id: 1, phone: '1234', email: 'test1@test.com', age: 23 },
        { id: 2, phone: '1234', email: 'test2@test.com', age: 34 },
        { id: 3, phone: '5678', email: 'test2@test.com', age: 23 },
        { id: 4, phone: '1234', email: 'test1@test.com' },
      ])
    })

    describe('if query is an object', () => {
      it('returns the models that matches the attributes', () => {
        expect(
          collection.filter({
            phone: '1234',
            email: 'test1@test.com',
          })
        ).toEqual([collection.at(0), collection.at(3)])
      })

      describe('and the attribute may not exist in some models', () => {
        it('returns the models that have and math the attributes', () => {
          expect(collection.filter({ age: 23 })).toEqual([
            collection.at(0),
            collection.at(2),
          ])
        })
      })
    })

    describe('if query is a function', () => {
      it('returns the models that returns true on the callback', () => {
        expect(
          collection.filter((model: any) => model.get('email') === 'test2@test.com')
        ).toEqual([collection.at(1), collection.at(2)])
      })
    })
  })

  describe('find(query)', () => {
    beforeEach(() => {
      collection.reset([
        { id: 1, phone: '1234', email: 'test1@test.com' },
        { id: 2, phone: '1234', email: 'test2@test.com' },
        { id: 3, phone: '5678', email: 'test2@test.com' },
        { id: 4, phone: '1234', email: 'test1@test.com' },
      ])
    })

    describe('if query is an object', () => {
      it('returns the first model that matches that attributes', () => {
        expect(
          collection.find({
            phone: '1234',
            email: 'test1@test.com',
          })
        ).toEqual(collection.at(0))
      })
    })

    describe('if query is a function', () => {
      it('returns the first model that returns true on the callback', () => {
        expect(
          collection.find((model: any) => model.get('email') === 'test2@test.com')
        ).toEqual(collection.at(1))
      })
    })

    describe('if the model is not found', () => {
      describe('if required', () => {
        it('throws', () => {
          expect(() =>
            collection.find({ phone: '9999' }, { required: true })
          ).toThrow('Invariant: MockModel must be found')
        })
      })

      describe('if not required', () => {
        it('return undefined', () => {
          expect(collection.find({ phone: '9999' })).toBeUndefined()
        })
      })
    })
  })

  describe('last()', () => {
    it('returns the last model of the collection', () => {
      expect(collection.last()).toBe(collection.models[3])
    })

    describe('if the collection is empty', () => {
      it('returns null', () => {
        collection.reset([])
        expect(collection.last()).toBe(null)
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

    it('does not add duplicated', () => {
      const model = new Model()

      collection.add(model)
      collection.add(model)

      expect(collection.at(0)).toBe(model)
      expect(collection.length).toEqual(1)
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
        const models = [new Model(), new Model()]

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

      collection.forEach((model: any) => expect(model).toBeInstanceOf(Model))
    })
  })

  describe('remove(data)', () => {
    it('removes the specified id from the collection', () => {
      collection.reset([{ id: 1 }, { id: 2 }])

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
      let consoleWarnMock: any

      beforeEach(() => {
        consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation()
      })

      afterEach(() => consoleWarnMock.mockRestore())

      it("doesn't throw", () => {
        collection.reset([{ id: 1 }])

        expect(() => collection.remove(2)).not.toThrow()
        expect(collection.length).toBe(1)
      })
    })

    describe('if data is an array', () => {
      it('removes all the specified ids', () => {
        collection.reset([{ id: 1 }, { id: 2 }, { id: 3 }])
        collection.remove([1, 2])

        expect(collection.length).toBe(1)
        expect(collection.at(0).id).toBe(3)
      })
    })

    describe('if data is a model assigned to this collection', () => {
      it('removes the model from the collection', () => {
        collection.reset([{ id: 1 }, { id: 2 }])

        const model = collection.get(1)

        collection.remove(model)

        expect(collection.length).toBe(1)
        expect(collection.at(0).id).toBe(2)
        expect(model.collection).toBeUndefined()
      })
    })

    describe('if data is anything else', () => {
      let consoleWarnMock: any

      beforeEach(() => {
        consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation()
      })

      afterEach(() => consoleWarnMock.mockRestore())

      it("don't throw", () => {
        expect(() => collection.remove('invalid')).not.toThrow()
      })
    })
  })

  describe('set(data, { add = true, change = true, remove = true })', () => {
    describe('if data has new models', () => {
      describe('if add = true', () => {
        it('adds the new models', () => {
          collection.reset([{ id: 1 }])

          collection.set([{ id: 2 }, { id: 3 }], {
            add: true,
            change: false,
            remove: false,
          })

          expect(collection.toJS()).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
        })
      })

      describe('if add = false', () => {
        it('ignores the new models', () => {
          collection.reset([{ id: 1 }])
          collection.set([{ id: 2 }, { id: 3 }], {
            add: false,
            change: false,
            remove: false,
          })

          expect(collection.toJS()).toEqual([{ id: 1 }])
        })
      })
    })

    describe('if data has existing models', () => {
      describe('if change = true', () => {
        it('updates the existing models', () => {
          collection.reset([
            { id: 1, phone: '1234' },
            { id: 2, phone: '5678' },
          ])

          collection.set(
            [
              { id: 1, phone: '8888' },
              { id: 2, phone: '9999' },
            ],
            { add: false, change: true, remove: false }
          )

          expect(collection.toJS()).toEqual([
            { id: 1, phone: '8888' },
            { id: 2, phone: '9999' },
          ])
        })
      })

      describe('if change = false', () => {
        it('ignores the existing models', () => {
          collection.reset([
            { id: 1, phone: '1234' },
            { id: 2, phone: '5678' },
          ])
          collection.set(
            [
              { id: 1, phone: '8888' },
              { id: 2, phone: '9999' },
            ],
            { add: false, change: false, remove: false }
          )

          expect(collection.toJS()).toEqual([
            { id: 1, phone: '1234' },
            { id: 2, phone: '5678' },
          ])
        })
      })
    })

    describe('if data has missing models', () => {
      describe('if remove = true', () => {
        it('removes the missing models', () => {
          collection.reset([{ id: '1' }, { id: 2 }])
          collection.set([{ id: 2 }], {
            add: false,
            change: false,
            remove: true,
          })

          expect(collection.toJS()).toEqual([{ id: 2 }])
        })
      })

      describe('if remove = false', () => {
        it('ignores the missing models', () => {
          collection.reset([{ id: 1 }, { id: 2 }])
          collection.set([{ id: 2 }], {
            add: false,
            change: false,
            remove: false,
          })

          expect(collection.toJS()).toEqual([{ id: 1 }, { id: 2 }])
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
    let spy: any

    beforeEach(() => {
      collection.url = () => '/resources'
      collection.reset([])
      spy = jest.spyOn(apiClient(), 'post')
    })

    afterEach(() => spy.mockRestore())

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
        } catch (errorObject: any) {
          expect(errorObject.error).toBe('Conflict')
        }
      })
    })

    describe('with customized path', () => {
      it('request to the given path', async () => {
        const promise = collection.create(
          {},
          {
            optimistic: false,
            path: '/custom',
          }
        )

        expect(spy.mock.calls[0][0]).toEqual('/custom')
      })
    })
  })

  describe('fetch(options)', () => {
    let spy: any
    let promise: any
    let options: any

    beforeEach(() => {
      collection.url = () => '/resources'
      spy = jest.spyOn(apiClient(), 'get')
      options = {
        data: { full: true },
        foo: 'bar',
      }
      promise = collection.fetch(options)
    })

    afterEach(() => spy.mockRestore())

    it('makes a get request to the model url', () => {
      expect(spy).toHaveBeenCalled()
    })

    it('passes the options to the api client', () => {
      expect(spy.mock.calls[0][1]).toBe(options.data)
    })

    it('works without passing options', () => {
      expect(() => collection.fetch()).not.toThrow()
    })

    describe('if the request succeeds', () => {
      it('sets the response data passing the same options', async () => {
        const response = [{ id: 1 }]

        jest.spyOn(collection, 'set')
        MockApi.resolvePromise(response)
        const data = await promise
        expect(data).toEqual(response)
        expect(collection.set).toHaveBeenCalledWith(response, { foo: 'bar' })
      })
    })
  })

  describe('rpc', () => {
    let spy: any
    let promise: any
    let options

    beforeEach(() => {
      collection.url = () => '/api'
      spy = jest.spyOn(apiClient(), 'post')
      promise = collection.rpc('search', { method: 'GET' })
    })

    afterEach(() => spy.mockRestore())

    it('sends a request using the endpoint suffix', () => {
      expect(spy.mock.calls.pop()[0]).toBe('/api/search')
    })

    it('passes the options to the api adapter', () => {
      expect(spy.mock.calls.pop()[1]).toEqual({
        method: 'GET',
      })
    })

    describe('rpc with rootUrl', () => {
      beforeEach(() => {
        collection.rpc({ rootUrl: '/another_api/search' }, { method: 'GET' })
      })

      it('should fetch with the rootUrl', () => {
        expect(spy.mock.calls.pop()[0]).toBe('/another_api/search')
      })
    })

    describe('if the request succeeds', () => {
      it('returns the data', async () => {
        const response = [{ id: 1 }]
        MockApi.resolvePromise(response)

        const data = await promise
        expect(data).toEqual(response)
      })
    })
  })
})
