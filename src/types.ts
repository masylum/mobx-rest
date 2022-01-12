export type OptimisticId = string
export type Id = number | OptimisticId
export type RequestState = 'pending' | 'fulfilled' | 'rejected'

export interface CreateOptions {
  optimistic?: boolean
  path?: string
}

export interface DestroyOptions {
  data?: {}
  optimistic?: boolean
  path?: string
}

export interface SaveOptions {
  optimistic?: boolean
  patch?: boolean
  keepChanges?: boolean
  path?: string
}

export interface SetOptions {
  add?: boolean
  change?: boolean
  remove?: boolean
  data?: {}
}

export interface GetOptions {
  required?: boolean
}

export interface FindOptions {
  required?: boolean
}

export interface Adapter {
  get(path: string, data?: {}, options?: {}): Promise<any>
  patch(path: string, data?: {}, options?: {}): Promise<any>
  post(path: string, data?: {}, options?: {}): Promise<any>
  put(path: string, data?: {}, options?: {}): Promise<any>
  del(path: string, data?: {}, options?: {}): Promise<any>
}
