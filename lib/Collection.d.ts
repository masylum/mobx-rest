import Base from './Base';
import Model from './Model';
import Request from './Request';
import { IObservableArray } from 'mobx';
import { CreateOptions, SetOptions, GetOptions, FindOptions, Id } from './types';
declare type IndexTree<T> = Map<string, Index<T>>;
declare type Index<T> = Map<any, Array<T>>;
export default abstract class Collection<T extends Model> extends Base {
    models: IObservableArray<T>;
    indexes: Array<string>;
    constructor(data?: Array<{
        [key: string]: any;
    }>);
    /**
     * Define which is the primary key
     * of the model's in the collection.
     *
     * FIXME: This contains a hack to use the `primaryKey` as
     * an instance method. Ideally it should be static but that
     * would not be backward compatible and Typescript sucks at
     * static polymorphism (https://github.com/microsoft/TypeScript/issues/5863).
     */
    readonly primaryKey: string;
    /**
     * Returns a hash with all the indexes for that
     * collection.
     *
     * We keep the indexes in memory for as long as the
     * collection is alive, even if no one is referencing it.
     * This way we can ensure to calculate it only once.
     */
    readonly index: IndexTree<T>;
    /**
     * Alias for models.length
     */
    readonly length: Number;
    /**
     * Alias for models.map
     */
    map<P>(callback: (model: T) => P): Array<P>;
    /**
     * Alias for models.forEach
     */
    forEach(callback: (model: T) => void): void;
    /**
     * Returns the URL where the model's resource would be located on the server.
     */
    abstract url(): string;
    /**
     * Specifies the model class for that collection
     */
    abstract model(attributes?: {
        [key: string]: any;
    }): new (attributes?: {
        [key: string]: any;
    }) => T | null;
    /**
     * Returns a JSON representation
     * of the collection
     */
    toJS(): Array<{
        [key: string]: any;
    }>;
    /**
     * Alias of slice
     */
    toArray(): Array<T>;
    /**
     * Returns a defensive shallow array representation
     * of the collection
     */
    slice(): Array<T>;
    /**
     * Wether the collection is empty
     */
    readonly isEmpty: boolean;
    /**
     * Gets the ids of all the items in the collection
     */
    private readonly _ids;
    /**
     * Get a resource at a given position
     */
    at(index: number): T | null;
    /**
     * Get a resource with the given id or uuid
     */
    get(id: Id, { required }?: GetOptions): T;
    /**
     * Get a resource with the given id or uuid or fail loudly.
     */
    mustGet(id: Id): T;
    /**
     * Get resources matching criteria.
     *
     * If passing an object of key:value conditions, it will
     * use the indexes to efficiently retrieve the data.
     */
    filter(query: {
        [key: string]: any;
    } | ((T: any) => boolean)): Array<T>;
    /**
     * Finds an element with the given matcher
     */
    find(query: {
        [key: string]: any;
    } | ((T: any) => boolean), { required }?: FindOptions): T | null;
    /**
     * Get a resource with the given id or uuid or fails loudly.
     */
    mustFind(query: {
        [key: string]: any;
    } | ((T: any) => boolean)): T;
    /**
     * Adds a model or collection of models.
     */
    add(data: Array<{
        [key: string]: any;
    } | T> | {
        [key: string]: any;
    } | T): Array<T>;
    /**
     * Resets the collection of models.
     */
    reset(data: Array<{
        [key: string]: any;
    }>): void;
    /**
     * Removes the model with the given ids or uuids
     */
    remove(ids: Id | T | Array<Id | T>): void;
    /**
     * Sets the resources into the collection.
     *
     * You can disable adding, changing or removing.
     */
    set(resources: Array<{
        [key: string]: any;
    } | T>, { add, change, remove }?: SetOptions): void;
    /**
     * Creates a new model instance with the given attributes
     */
    build(attributes?: Object | T): T;
    /**
     * Creates the model and saves it on the backend
     *
     * The default behaviour is optimistic but this
     * can be tuned.
     */
    create(attributesOrModel: {
        [key: string]: any;
    } | T, { optimistic }?: CreateOptions): Request;
    /**
     * Fetches the models from the backend.
     *
     * It uses `set` internally so you can
     * use the options to disable adding, changing
     * or removing.
     */
    fetch({ data, ...otherOptions }?: SetOptions): Request;
}
export {};
