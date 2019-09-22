import Request from './Request';
import { IObservableArray } from 'mobx';
export default class Base {
    request: Request | null;
    requests: IObservableArray<Request>;
    /**
     * Returns the resource's url.
     *
     * @abstract
     */
    url(): string;
    withRequest(labels: string | Array<string>, promise: Promise<any>, abort: () => void | null): Request;
    getRequest(label: string): Request | null;
    getAllRequests(label: string): Array<Request>;
    /**
     * Questions whether the request exists
     * and matches a certain label
     */
    isRequest(label: string): boolean;
    /**
     * Call an RPC action for all those
     * non-REST endpoints that you may have in
     * your API.
     */
    rpc(endpoint: string | {
        rootUrl: string;
    }, options?: {}, label?: string): Request;
}
