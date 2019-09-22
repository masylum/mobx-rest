import { Adapter } from './types';
/**
 * Sets or gets the api client instance
 */
export default function apiClient(adapter?: Adapter, options?: {
    [key: string]: any;
}): Adapter;
