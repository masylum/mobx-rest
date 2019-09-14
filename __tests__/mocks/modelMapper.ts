import { ModelMapperAdapter } from "../../src/types";

export default class BasicModelMapper implements ModelMapperAdapter {
  modelToApi(model: { [index: string]: any }, map: any[][]): object {
    let result: { [index: string]: any } = {};
    map.forEach((value, key) => {
      result[value[1]] = model[value[0]];
    });
    return result;
  }

  apiToModel<T extends Object>(apiModel: { [index: string]: any }, map: any[][], ModelClass?: { new(attributes:object): T; }): T {
    let model: { [index: string]: any } = {};
    map.forEach((value, key) => {
      model[value[2] || value[0]] = apiModel[value[1]];
    });
    let result :any = (ModelClass) ? new ModelClass({...model}) : new Object({...model});
    return result;
  }
}
