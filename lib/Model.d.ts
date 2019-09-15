import { ObservableMap } from 'mobx';
import Base from './Base';
import Collection from './Collection';
import Request from './Request';
import { OptimisticId, Id, DestroyOptions, SaveOptions } from './types';
declare type Attributes = {
    [key: string]: any;
};
export declare const DEFAULT_PRIMARY = "id";
export default class Model extends Base {
    defaultAttributes: Attributes;
    attributes: ObservableMap;
    committedAttributes: ObservableMap;
    optimisticId: OptimisticId;
    collection: Collection<this> | null;
    modelMap: any[][];
    constructor(attributes?: Attributes, defaultAttributes?: Attributes, modelMap?: any[][]);
    /**
     * Returns a JSON representation
     * of the model
     */
    toJS(): ObservableMap<any, any>;
    /**
     * Define which is the primary
     * key of the model.
     */
    readonly primaryKey: string;
    /**
     * Return the base url used in
     * the `url` method
     *
     * @abstract
     */
    urlRoot(): string | null;
    /**
     * Return the url for this given REST resource
     */
    url(): string;
    /**
     * Wether the resource is new or not
     *
     * We determine this asking if it contains
     * the `primaryKey` attribute (set by the server).
     */
    readonly isNew: boolean;
    /**
     * Get the attribute from the model.
     *
     * Since we want to be sure changes on
     * the schema don't fail silently we
     * throw an error if the field does not
     * exist.
     *
     * If you want to deal with flexible schemas
     * use `has` to check wether the field
     * exists.
     */
    get(attribute: string): any;
    /**
     * Returns whether the given field exists
     * for the model.
     */
    has(attribute: string): boolean;
    /**
     * Get an id from the model. It will use either
     * the backend assigned one or the client.
     */
    readonly id: Id;
    /**
     * Get an array with the attributes names that have changed.
     */
    readonly changedAttributes: Array<string>;
    /**
     * Gets the current changes.
     */
    readonly changes: {
        [key: string]: any;
    };
    /**
     * If an attribute is specified, returns true if it has changes.
     * If no attribute is specified, returns true if any attribute has changes.
     */
    hasChanges(attribute?: string): boolean;
    commitChanges(): void;
    discardChanges(): void;
    /**
     * Replace all attributes with new data
     */
    reset(data?: {}): void;
    /**
     * Merge the given attributes with
     * the current ones
     */
    set(data: {}): void;
    /**
     * Fetches the model from the backend.
     */
    fetch({ data, ...otherOptions }?: {
        data?: {};
    }): Request;
    /**
     * Saves the resource on the backend.
     *
     * If the item has a `primaryKey` it updates it,
     * otherwise it creates the new resource.
     *
     * It supports optimistic and patch updates.
     */
    save(attributes?: {}, { optimistic, patch, keepChanges, ...otherOptions }?: SaveOptions): Request;
    /**
     * Destroys the resurce on the client and
     * requests the backend to delete it there
     * too
     */
    destroy({ data, optimistic, ...otherOptions }?: DestroyOptions): Request;
    toApiObject(throwException?: boolean): {};
    toModelObject(data: {}, throwException?: boolean): {};
}
export {};
