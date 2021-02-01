export type OptimisticId = string
export type Id = number | OptimisticId
export type RequestState = 'pending' | 'fulfilled' | 'rejected'

export interface CreateOptions {
  optimistic?: boolean
  onProgress?: () => any
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
  onProgress?: () => any
  keepChanges?: boolean
  path?: string
}

export interface Response {
  abort: () => void
  promise: Promise<any>
}

export interface RequestOptions {
  abort?: () => void | null
  progress?: number
  labels?: Array<string>
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
  get(path: string, data?: {}, options?: {}): Response
  patch(path: string, data?: {}, options?: {}): Response
  post(path: string, data?: {}, options?: {}): Response
  put(path: string, data?: {}, options?: {}): Response
  del(path: string, data?: {}, options?: {}): Response
}
