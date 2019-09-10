import { ModelMapperAdapter } from "../../src/types";

export default class BasicModelMapper implements ModelMapperAdapter {
  modelToApi(model: object, map: any[][]): object {
    let result = {};
    map.forEach((value, key) => {
      result[value[1]] = model[value[0]];
    });
    return result;
  }

  apiToModel<T extends Object>(apiModel: object, map: any[][], ModelClass?: { new(): T; }): T {
    let result = new ModelClass();
    map.forEach((value, key) => {
      result[value[2] || value[0]] =  apiModel[value[1]];
    });
    return result;
  }
}
