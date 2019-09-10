import modelMapper from '../src/modelMapper'
import BasicModelMapper from './mocks/modelMapper'

let model = {
  modelFirstProperty: "mfp",
  modelSecondProperty: "msp",
  modelAnotherProperty: "map"
};

let apiModel = {
  apiFirstProperty: 'afp',
  apiSecondProperty: 'asp'
};

class ApiToModelType{
  modelFirstProperty: string;
  modelSecondProperty: string;
  modelAnotherProperty: string;
}

let mapping = [
  ['modelFirstProperty', 'apiFirstProperty'],
  ['modelFirstProperty', 'apiFirstProperty', 'modelAnotherProperty'],
  ['modelSecondProperty', 'apiSecondProperty']
];

describe(modelMapper, () => {
  describe('if not initialized', () => {
    it('throws', () => {
      expect(() => modelMapper()).toThrow('You must set an model mapper adapter first!')
    })
  })

  describe('model to api test', () => {
    test('returns', () => {
      let r = modelMapper(new BasicModelMapper()).modelToApi(model, mapping);
      expect(r).toMatchObject({
        apiFirstProperty: "mfp",
        apiSecondProperty: "msp"
      });
    })
  })

  describe('api to model test', () => {
    test('returns', () => {
      let r: ApiToModelType;
      r = modelMapper(new BasicModelMapper()).apiToModel(apiModel, mapping, ApiToModelType);
      console.warn(r);
      expect(r).toBeInstanceOf(ApiToModelType);
    })
  })

})
