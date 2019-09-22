import { RequestOptions, RequestState } from './types';
export default class Request {
    labels: Array<string>;
    abort: () => void | null;
    promise: Promise<any>;
    progress: number | null;
    state: RequestState;
    constructor(promise: Promise<any>, { labels, abort, progress }?: RequestOptions);
    then(onFulfilled: (any: any) => Promise<any>, onRejected?: (any: any) => Promise<any>): Promise<any>;
}
