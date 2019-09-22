export default class ErrorObject {
    error: any;
    payload: any;
    requestResponse: any;
    constructor(error: {
        requestResponse: any;
        error: any;
    } | string | Error);
}
