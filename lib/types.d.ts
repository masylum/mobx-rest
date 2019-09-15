export declare type OptimisticId = string;
export declare type Id = number | OptimisticId;
export declare type RequestState = 'pending' | 'fulfilled' | 'rejected';
export interface CreateOptions {
    optimistic?: boolean;
    onProgress?: () => any;
}
export interface DestroyOptions {
    data?: {};
    optimistic?: boolean;
}
export interface SaveOptions {
    optimistic?: boolean;
    patch?: boolean;
    onProgress?: () => any;
    keepChanges?: boolean;
}
export interface Response {
    abort: () => void;
    promise: Promise<any>;
}
export interface RequestOptions {
    abort?: () => void | null;
    progress?: number;
    labels?: Array<string>;
}
export interface SetOptions {
    add?: boolean;
    change?: boolean;
    remove?: boolean;
    data?: {};
}
export interface GetOptions {
    required?: boolean;
}
export interface FindOptions {
    required?: boolean;
}
export interface Adapter {
    get(path: string, data?: {}, options?: {}): Response;
    patch(path: string, data?: {}, options?: {}): Response;
    post(path: string, data?: {}, options?: {}): Response;
    put(path: string, data?: {}, options?: {}): Response;
    del(path: string, data?: {}, options?: {}): Response;
}
export interface ModelMapperAdapter {
    modelToApi(model: object, map: any[][]): object;
    apiToModel<T extends Object>(apiModel: object, map: any[][], ModelClass?: {
        new (): T;
    }): T;
}
